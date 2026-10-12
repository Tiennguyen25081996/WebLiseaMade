import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AiChatbotWidget } from "./AiChatbotWidget";
import { resetChatbotConfig, saveChatbotConfig, DEFAULT_CHATBOT_CONFIG } from "@/lib/chatbot-service";

describe("AiChatbotWidget", () => {
  beforeEach(() => {
    localStorage.clear();
    resetChatbotConfig();
  });

  it("hiển thị nút nổi chat góc dưới màn hình", () => {
    render(
      <MemoryRouter>
        <AiChatbotWidget />
      </MemoryRouter>
    );

    const fabBtn = screen.getByRole("button", { name: /Mở trợ lý thời trang Lisea AI/i });
    expect(fabBtn).toBeInTheDocument();
  });

  it("mở cửa sổ trò chuyện khi click vào nút nổi", () => {
    render(
      <MemoryRouter>
        <AiChatbotWidget />
      </MemoryRouter>
    );

    const fabBtn = screen.getByRole("button", { name: /Mở trợ lý thời trang Lisea AI/i });
    fireEvent.click(fabBtn);

    expect(screen.getByText(DEFAULT_CHATBOT_CONFIG.botName)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Nhập câu hỏi/i)).toBeInTheDocument();
  });

  it("gửi tin nhắn và nhận phản hồi từ bot", async () => {
    render(
      <MemoryRouter>
        <AiChatbotWidget />
      </MemoryRouter>
    );

    const fabBtn = screen.getByRole("button", { name: /Mở trợ lý thời trang Lisea AI/i });
    fireEvent.click(fabBtn);

    const input = screen.getByPlaceholderText(/Nhập câu hỏi/i);
    fireEvent.change(input, { target: { value: "1m58 48kg mặc size gì" } });

    const submitBtn = screen.getByTitle("Gửi tin nhắn");
    fireEvent.click(submitBtn);

    // Tin nhắn của user hiển thị
    expect(screen.getByText("1m58 48kg mặc size gì")).toBeInTheDocument();

    // Chờ bot trả lời
    await waitFor(
      () => {
        expect(screen.getByText(/Size phù hợp nhất: S hoặc M/i)).toBeInTheDocument();
      },
      { timeout: 2500 }
    );
  });

  it("click câu hỏi gợi ý nhanh để gửi", async () => {
    render(
      <MemoryRouter>
        <AiChatbotWidget />
      </MemoryRouter>
    );

    const fabBtn = screen.getByRole("button", { name: /Mở trợ lý thời trang Lisea AI/i });
    fireEvent.click(fabBtn);

    const quickBtn = screen.getByRole("button", { name: /Tư vấn chọn size/i });
    fireEvent.click(quickBtn);

    await waitFor(
      () => {
        expect(screen.getByText(/Bảng size chuẩn LiseaMade/i)).toBeInTheDocument();
      },
      { timeout: 2500 }
    );
  });

  it("ẩn widget khi chatbot bị tắt trong cấu hình", () => {
    saveChatbotConfig({
      ...DEFAULT_CHATBOT_CONFIG,
      enabled: false,
    });

    render(
      <MemoryRouter>
        <AiChatbotWidget />
      </MemoryRouter>
    );

    expect(screen.queryByRole("button", { name: /Mở trợ lý thời trang Lisea AI/i })).not.toBeInTheDocument();
  });
});
