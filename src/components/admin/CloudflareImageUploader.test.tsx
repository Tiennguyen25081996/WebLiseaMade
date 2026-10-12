import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CloudflareImageUploader } from "./CloudflareImageUploader";
import * as mediaApi from "@/lib/media-api";

const mockImages: mediaApi.MediaImage[] = [
  {
    id: "img-1",
    filename: "dress-1.jpg",
    mimeType: "image/jpeg",
    size: 204800,
    url: "/api/images/img-1",
    createdAt: "2026-10-12T00:00:00Z",
  },
  {
    id: "img-2",
    filename: "shirt-2.png",
    mimeType: "image/png",
    size: 102400,
    url: "/api/images/img-2",
    createdAt: "2026-10-12T01:00:00Z",
  },
];

describe("CloudflareImageUploader", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(mediaApi, "getMediaImages").mockResolvedValue(mockImages);
  });

  it("render danh sách ảnh tải lên từ Cloudflare", async () => {
    render(<CloudflareImageUploader />);

    await waitFor(() => {
      expect(screen.getByText("dress-1.jpg")).toBeInTheDocument();
      expect(screen.getByText("shirt-2.png")).toBeInTheDocument();
    });
  });

  it("gọi onSelectImage khi click nút Chọn trên 1 ảnh", async () => {
    const onSelect = vi.fn();
    render(<CloudflareImageUploader onSelectImage={onSelect} />);

    await waitFor(() => {
      expect(screen.getByText("dress-1.jpg")).toBeInTheDocument();
    });

    const selectButtons = screen.getAllByRole("button", { name: "Chọn" });
    fireEvent.click(selectButtons[0]);

    expect(onSelect).toHaveBeenCalledWith("/api/images/img-1");
  });

  it("chọn nhiều ảnh và gọi onSelectImages", async () => {
    const onSelectMultiple = vi.fn();
    render(<CloudflareImageUploader onSelectImages={onSelectMultiple} />);

    await waitFor(() => {
      expect(screen.getByText("dress-1.jpg")).toBeInTheDocument();
    });

    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[0]);
    fireEvent.click(checkboxes[1]);

    expect(screen.getByText("2")).toBeInTheDocument();
    const addBtn = screen.getByRole("button", { name: /Thêm 2 ảnh vào sản phẩm/i });
    fireEvent.click(addBtn);

    expect(onSelectMultiple).toHaveBeenCalledWith([
      "/api/images/img-1",
      "/api/images/img-2",
    ]);
  });

  it("hỗ trợ chọn tất cả và bỏ chọn tất cả", async () => {
    render(<CloudflareImageUploader onSelectImages={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("dress-1.jpg")).toBeInTheDocument();
    });

    const selectAllBtn = screen.getByRole("button", { name: "Chọn tất cả" });
    fireEvent.click(selectAllBtn);

    expect(screen.getByRole("button", { name: /Thêm 2 ảnh vào sản phẩm/i })).toBeInTheDocument();

    const deselectBtn = screen.getByRole("button", { name: "Bỏ chọn tất cả" });
    fireEvent.click(deselectBtn);

    expect(screen.queryByRole("button", { name: /Thêm 2 ảnh vào sản phẩm/i })).not.toBeInTheDocument();
  });
});
