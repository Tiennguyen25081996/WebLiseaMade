import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AdminHomeSettingsTab } from "./AdminHomeSettingsTab";
import { DEFAULT_HOMEPAGE_SETTINGS } from "@/lib/admin-store";

describe("AdminHomeSettingsTab", () => {
  it("hiển thị đầy đủ các trường cấu hình của Hero Banner", () => {
    const onSave = vi.fn();
    const onReset = vi.fn();
    const showToast = vi.fn();

    render(
      <AdminHomeSettingsTab
        settings={DEFAULT_HOMEPAGE_SETTINGS}
        onSave={onSave}
        onReset={onReset}
        showToast={showToast}
      />
    );

    expect(
      screen.getByText("Cài đặt hình ảnh & nội dung Trang chủ")
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue(DEFAULT_HOMEPAGE_SETTINGS.heroTitle)).toBeInTheDocument();
    expect(screen.getByDisplayValue(DEFAULT_HOMEPAGE_SETTINGS.heroEyebrow)).toBeInTheDocument();
  });

  it("cho phép cập nhật thông tin và gọi onSave khi submit form", () => {
    const onSave = vi.fn();
    const onReset = vi.fn();
    const showToast = vi.fn();

    render(
      <AdminHomeSettingsTab
        settings={DEFAULT_HOMEPAGE_SETTINGS}
        onSave={onSave}
        onReset={onReset}
        showToast={showToast}
      />
    );

    const titleInput = screen.getByDisplayValue(DEFAULT_HOMEPAGE_SETTINGS.heroTitle);
    fireEvent.change(titleInput, { target: { value: "LiseaMade Mới 2026" } });

    const submitBtns = screen.getAllByRole("button", { name: /Lưu thay đổi|Lưu cài đặt Trang chủ/i });
    fireEvent.click(submitBtns[0]);

    expect(onSave).toHaveBeenCalled();
    const savedArg = onSave.mock.calls[0][0];
    expect(savedArg.heroTitle).toBe("LiseaMade Mới 2026");
  });

  it("chuyển đổi qua các tab con Lifestyle, Lookbook, Story, Social", () => {
    const onSave = vi.fn();
    const onReset = vi.fn();
    const showToast = vi.fn();

    render(
      <AdminHomeSettingsTab
        settings={DEFAULT_HOMEPAGE_SETTINGS}
        onSave={onSave}
        onReset={onReset}
        showToast={showToast}
      />
    );

    // Click tab Lifestyle
    const lifestyleTab = screen.getByRole("button", { name: /2\. Lifestyle/i });
    fireEvent.click(lifestyleTab);
    expect(screen.getByText(/Bộ sưu tập Phong cách sống/i)).toBeInTheDocument();

    // Click tab Lookbook
    const lookbookTab = screen.getByRole("button", { name: /3\. Lookbook/i });
    fireEvent.click(lookbookTab);
    expect(screen.getByText(/Lookbook Mùa hè/i)).toBeInTheDocument();

    // Click tab Story
    const storyTab = screen.getByRole("button", { name: /4\. Câu chuyện thương hiệu/i });
    fireEvent.click(storyTab);
    expect(screen.getByText(/Khối giới thiệu tinh thần thương hiệu/i)).toBeInTheDocument();

    // Click tab Social
    const socialTab = screen.getByRole("button", { name: /5\. TikTok/i });
    fireEvent.click(socialTab);
    expect(screen.getAllByText(/TikTok & Mạng xã hội/i).length).toBeGreaterThan(0);
  });

  it("mở media picker để chọn ảnh Hero", () => {
    const onSave = vi.fn();
    const onReset = vi.fn();
    const showToast = vi.fn();

    render(
      <AdminHomeSettingsTab
        settings={DEFAULT_HOMEPAGE_SETTINGS}
        onSave={onSave}
        onReset={onReset}
        showToast={showToast}
      />
    );

    const openPickerBtn = screen.getByRole("button", {
      name: /Chọn từ Thư viện \(Cloudflare & Drive\)/i,
    });
    fireEvent.click(openPickerBtn);

    expect(
      screen.getByText("Chọn ảnh cho Trang chủ (Google Drive & Cloudflare)")
    ).toBeInTheDocument();
  });
});
