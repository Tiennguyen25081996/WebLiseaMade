import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AdminChatbotTab } from "./AdminChatbotTab";
import { DEFAULT_CHATBOT_CONFIG } from "@/lib/chatbot-service";

describe("AdminChatbotTab", () => {
  it("hiển thị các trường cấu hình chatbot", () => {
    const onSave = vi.fn();
    const onReset = vi.fn();
    const showToast = vi.fn();

    render(
      <AdminChatbotTab
        config={DEFAULT_CHATBOT_CONFIG}
        onSave={onSave}
        onReset={onReset}
        showToast={showToast}
      />
    );

    expect(screen.getByText("Cấu hình Chatbot AI Tư Vấn Bán Hàng")).toBeInTheDocument();
    expect(screen.getByDisplayValue(DEFAULT_CHATBOT_CONFIG.botName)).toBeInTheDocument();
    expect(screen.getByDisplayValue(DEFAULT_CHATBOT_CONFIG.welcomeMessage)).toBeInTheDocument();
  });

  it("thay đổi tên bot và lưu cấu hình", () => {
    const onSave = vi.fn();
    const onReset = vi.fn();
    const showToast = vi.fn();

    render(
      <AdminChatbotTab
        config={DEFAULT_CHATBOT_CONFIG}
        onSave={onSave}
        onReset={onReset}
        showToast={showToast}
      />
    );

    const nameInput = screen.getByDisplayValue(DEFAULT_CHATBOT_CONFIG.botName);
    fireEvent.change(nameInput, { target: { value: "Lisea Fashion Pro" } });

    const saveBtns = screen.getAllByRole("button", { name: /Lưu cấu hình/i });
    fireEvent.click(saveBtns[0]);

    expect(onSave).toHaveBeenCalled();
    expect(onSave.mock.calls[0][0].botName).toBe("Lisea Fashion Pro");
  });

  it("thêm câu hỏi gợi ý nhanh mới", () => {
    const onSave = vi.fn();
    const onReset = vi.fn();
    const showToast = vi.fn();

    render(
      <AdminChatbotTab
        config={DEFAULT_CHATBOT_CONFIG}
        onSave={onSave}
        onReset={onReset}
        showToast={showToast}
      />
    );

    const input = screen.getByPlaceholderText(/Thêm câu hỏi gợi ý mới/i);
    fireEvent.change(input, { target: { value: "Chất liệu linen có mát không?" } });

    const addBtn = screen.getByRole("button", { name: /\+ Thêm/i });
    fireEvent.click(addBtn);

    expect(screen.getByText("Chất liệu linen có mát không?")).toBeInTheDocument();
  });

  it("cho phép thử nghiệm chat ngay trong Sandbox của Admin", async () => {
    const onSave = vi.fn();
    const onReset = vi.fn();
    const showToast = vi.fn();

    render(
      <AdminChatbotTab
        config={DEFAULT_CHATBOT_CONFIG}
        onSave={onSave}
        onReset={onReset}
        showToast={showToast}
      />
    );

    const testInput = screen.getByPlaceholderText(/Nhập thử \(ví dụ: 1m58 48kg/i);
    fireEvent.change(testInput, { target: { value: "freeship bao nhiêu shop" } });

    const sendBtn = screen.getByRole("button", { name: /^Gửi$/i });
    fireEvent.click(sendBtn);

    expect(screen.getByText("freeship bao nhiêu shop")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/Ưu đãi Freeship/i)).toBeInTheDocument();
    });
  });
});
