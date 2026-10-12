import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  uploadMediaImage,
  getMediaImages,
  deleteMediaImage,
  extractGoogleDriveFileId,
  normalizeGoogleDriveUrl,
  toGoogleDriveDirectUrl,
  importGoogleDriveLinks,
  saveExternalMediaImage,
  getGoogleDriveWebhookUrl,
  setGoogleDriveWebhookUrl,
} from "./media-api";

describe("media-api", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("từ chối tải lên file không phải định dạng ảnh", async () => {
    const textFile = new File(["hello world"], "test.txt", { type: "text/plain" });
    await expect(uploadMediaImage(textFile)).rejects.toThrow("Định dạng ảnh không được hỗ trợ");

    const fakeJpg = new File(["not an image"], "malicious.exe", { type: "image/jpeg" });
    await expect(uploadMediaImage(fakeJpg)).rejects.toThrow("Phần mở rộng file ảnh không hợp lệ");
  });

  it("tải lên ảnh thành công qua API từ xa", async () => {
    const mockImageFile = new File(["fake-image-content"], "summer-dress.jpg", {
      type: "image/jpeg",
    });

    const mockResponse = {
      success: true,
      image: {
        id: "img_12345",
        filename: "summer-dress.jpg",
        mimeType: "image/jpeg",
        size: 1024,
        url: "/api/images/img_12345",
        createdAt: "2026-10-11T12:00:00Z",
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    } as unknown as Response);

    const result = await uploadMediaImage(mockImageFile);
    expect(result.success).toBe(true);
    expect(result.source).toBe("remote");
    expect(result.image.url).toBe("/api/images/img_12345");
  });

  it("tự động fallback lưu trữ khi server bị ngắt kết nối", async () => {
    const mockImageFile = new File(["fake-image-content"], "offline-dress.png", {
      type: "image/png",
    });

    global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

    const result = await uploadMediaImage(mockImageFile);
    expect(result.success).toBe(true);
    expect(result.source).toBe("local_fallback");
    expect(result.image.filename).toBe("offline-dress.png");

    const images = await getMediaImages();
    expect(images.length).toBeGreaterThan(0);
    expect(images[0].filename).toBe("offline-dress.png");
  });

  it("lấy danh sách ảnh thành công và hợp nhất", async () => {
    const remoteList = [
      {
        id: "img_remote_1",
        filename: "banner.png",
        mime_type: "image/png",
        size: 2048,
        url: "/api/images/img_remote_1",
        created_at: "2026-10-11T10:00:00Z",
      },
    ];

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, images: remoteList }),
    } as unknown as Response);

    const images = await getMediaImages();
    expect(images.length).toBe(1);
    expect(images[0].id).toBe("img_remote_1");
  });

  it("xóa ảnh thành công", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, id: "img_remote_1" }),
    } as unknown as Response);

    const result = await deleteMediaImage("img_remote_1");
    expect(result).toBe(true);
  });

  it("trích xuất file ID và chuẩn hóa link Google Drive chính xác", () => {
    const shareLink = "https://drive.google.com/file/d/1A2B3C4D5E_test-id/view?usp=sharing";
    const fileId = extractGoogleDriveFileId(shareLink);
    expect(fileId).toBe("1A2B3C4D5E_test-id");

    const directCdnUrl = toGoogleDriveDirectUrl(shareLink);
    expect(directCdnUrl).toBe("https://lh3.googleusercontent.com/d/1A2B3C4D5E_test-id");

    const normalized = normalizeGoogleDriveUrl(shareLink);
    expect(normalized).toBe("https://lh3.googleusercontent.com/d/1A2B3C4D5E_test-id");

    // Ảnh thường giữ nguyên
    expect(normalizeGoogleDriveUrl("/figma-images/cat-1.png")).toBe("/figma-images/cat-1.png");
  });

  it("nhập hàng loạt link Google Drive và lưu vào Cloudflare D1", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        image: {
          id: "gdrive_test",
          filename: "drive-photo.jpg",
          mimeType: "image/jpeg",
          size: 0,
          url: "https://lh3.googleusercontent.com/d/1X2Y3Z",
          createdAt: "2026-10-12T00:00:00Z",
        },
      }),
    } as unknown as Response);

    const { successful, failed } = await importGoogleDriveLinks([
      "https://drive.google.com/file/d/1X2Y3Z/view",
      "invalid-link",
    ]);

    expect(successful.length).toBe(1);
    expect(failed.length).toBe(1);
    expect(successful[0].url).toBe("https://lh3.googleusercontent.com/d/1X2Y3Z");
  });

  it("quản lý cấu hình Google Drive Webhook URL trong localStorage", () => {
    expect(getGoogleDriveWebhookUrl()).toBe("");
    setGoogleDriveWebhookUrl("https://script.google.com/macros/s/test/exec");
    expect(getGoogleDriveWebhookUrl()).toBe("https://script.google.com/macros/s/test/exec");
    setGoogleDriveWebhookUrl("");
    expect(getGoogleDriveWebhookUrl()).toBe("");
  });

  it("lưu thông tin ảnh ngoài vào Cloudflare D1", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        image: {
          id: "ext_1",
          filename: "test.jpg",
          mimeType: "image/jpeg",
          size: 100,
          url: "https://lh3.googleusercontent.com/d/123",
          createdAt: "2026-10-12T00:00:00Z",
        },
      }),
    } as unknown as Response);

    const img = await saveExternalMediaImage({
      url: "https://lh3.googleusercontent.com/d/123",
      filename: "test.jpg",
    });
    expect(img.id).toBe("ext_1");
    expect(img.url).toBe("https://lh3.googleusercontent.com/d/123");
  });
});
