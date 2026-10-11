import { describe, it, expect, vi, beforeEach } from "vitest";
import { uploadMediaImage, getMediaImages, deleteMediaImage } from "./media-api";

describe("media-api", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("từ chối tải lên file không phải định dạng ảnh", async () => {
    const textFile = new File(["hello world"], "test.txt", { type: "text/plain" });
    await expect(uploadMediaImage(textFile)).rejects.toThrow("không phải là hình ảnh");
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
});
