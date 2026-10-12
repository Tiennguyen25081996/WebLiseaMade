import { useState } from "react";
import type { ChatbotConfig, ChatMessage } from "@/lib/chatbot-service";
import { getAiChatbotResponse } from "@/lib/chatbot-service";
import { useAdminStore } from "@/lib/admin-store";
import { Button } from "@/components/ui/Button";
import { SparkleIcon } from "@/components/ui/icons";

interface AdminChatbotTabProps {
  config: ChatbotConfig;
  onSave: (config: ChatbotConfig) => void;
  onReset: () => void;
  showToast: (msg: string) => void;
}

export function AdminChatbotTab({
  config,
  onSave,
  onReset,
  showToast,
}: AdminChatbotTabProps) {
  const { products } = useAdminStore();
  const [form, setForm] = useState<ChatbotConfig>({ ...config });
  const [quickQuestionInput, setQuickQuestionInput] = useState("");

  // Test Chat Sandbox trong Admin
  const [testMessages, setTestMessages] = useState<ChatMessage[]>([
    {
      id: "test-init",
      sender: "bot",
      text: form.welcomeMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [testInput, setTestInput] = useState("");
  const [isTestTyping, setIsTestTyping] = useState(false);

  const handleSave = (e?: React.FormEvent) => {
    e?.preventDefault();
    onSave(form);
    showToast("Đã lưu cấu hình Chatbot AI thành công!");
  };

  const handleReset = () => {
    if (window.confirm("Bạn có chắc chắn muốn khôi phục cài đặt Chatbot về mặc định ban đầu?")) {
      onReset();
      setForm({ ...config });
      showToast("Đã khôi phục cài đặt Chatbot về mặc định!");
    }
  };

  const handleAddQuickQuestion = () => {
    const q = quickQuestionInput.trim();
    if (!q) return;
    if (form.quickQuestions.includes(q)) {
      showToast("Câu hỏi này đã có trong danh sách!");
      return;
    }
    setForm((prev) => ({
      ...prev,
      quickQuestions: [...prev.quickQuestions, q],
    }));
    setQuickQuestionInput("");
  };

  const handleRemoveQuickQuestion = (index: number) => {
    setForm((prev) => ({
      ...prev,
      quickQuestions: prev.quickQuestions.filter((_, i) => i !== index),
    }));
  };

  // Chat thử nghiệm ngay trong admin
  const handleSendTestMessage = async (textToSend?: string) => {
    const text = (textToSend || testInput).trim();
    if (!text || isTestTyping) return;

    const userMsg: ChatMessage = {
      id: `test-user-${Date.now()}`,
      sender: "user",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const newMsgs = [...testMessages, userMsg];
    setTestMessages(newMsgs);
    setTestInput("");
    setIsTestTyping(true);

    try {
      const res = await getAiChatbotResponse(text, newMsgs, products, form);
      const botMsg: ChatMessage = {
        id: `test-bot-${Date.now()}`,
        sender: "bot",
        text: res.text,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        recommendedProducts: res.recommendedProducts,
      };
      setTestMessages([...newMsgs, botMsg]);
    } catch {
      setTestMessages((prev) => [
        ...prev,
        {
          id: `test-err-${Date.now()}`,
          sender: "bot",
          text: "Lỗi kết nối khi thử nghiệm bot.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsTestTyping(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-hair border border-sand-300 bg-sand-100 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-hair bg-lagoon-100 text-lagoon-800">
              <SparkleIcon className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-sm font-semibold text-ink-900">
                  Cấu hình Chatbot AI Tư Vấn Bán Hàng
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    form.enabled
                      ? "bg-green-100 text-green-800"
                      : "bg-sand-200 text-ink-600"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      form.enabled ? "bg-green-600" : "bg-ink-400"
                    }`}
                  />
                  {form.enabled ? "Đang bật trên website" : "Đang tắt"}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-ink-600">
                Tự động tư vấn mẫu váy áo, tư vấn chọn size theo chiều cao cân nặng, giải đáp phí vận chuyển và chính sách đổi trả.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="rounded-hair border border-coral-200 bg-coral-50 px-3 py-1.5 text-xs font-medium text-coral-800 hover:bg-coral-100 transition-colors"
            >
              Khôi phục mặc định
            </button>
            <Button variant="primary" size="sm" onClick={() => handleSave()}>
              Lưu cấu hình
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Cột trái (7 cols): Cài đặt form */}
        <form onSubmit={handleSave} className="lg:col-span-7 space-y-5">
          <div className="rounded-hair border border-sand-300 bg-sand-50 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-sand-200 pb-3">
              <div>
                <h3 className="font-display text-sm font-semibold text-ink-900">
                  1. Trạng thái &amp; Nhận diện
                </h3>
                <p className="text-2xs text-ink-600">Bật tắt widget và tên hiển thị của trợ lý.</p>
              </div>

              {/* Toggle Switch */}
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-xs font-medium text-ink-700">
                  {form.enabled ? "Bật" : "Tắt"}
                </span>
                <input
                  type="checkbox"
                  checked={form.enabled}
                  onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
                  className="h-4 w-4 accent-lagoon-700 cursor-pointer"
                />
              </label>
            </div>

            <div>
              <label className="block text-2xs font-semibold text-ink-800 mb-1">
                Tên hiển thị của Chatbot:
              </label>
              <input
                type="text"
                value={form.botName}
                onChange={(e) => setForm({ ...form, botName: e.target.value })}
                className="w-full rounded-hair border border-sand-300 bg-sand-100/60 p-2 text-xs text-ink-900 focus:outline-none focus:border-ink-900"
                placeholder="Lisea AI Stylist"
              />
            </div>

            <div>
              <label className="block text-2xs font-semibold text-ink-800 mb-1">
                Lời chào mừng ban đầu (Welcome Message):
              </label>
              <textarea
                rows={3}
                value={form.welcomeMessage}
                onChange={(e) => setForm({ ...form, welcomeMessage: e.target.value })}
                className="w-full rounded-hair border border-sand-300 bg-sand-100/60 p-2 text-xs text-ink-900 focus:outline-none focus:border-ink-900"
                placeholder="Xin chào quý khách! Em là trợ lý thời trang LiseaMade..."
              />
            </div>
          </div>

          {/* AI Provider Section */}
          <div className="rounded-hair border border-sand-300 bg-sand-50 p-6 space-y-4">
            <div className="border-b border-sand-200 pb-3">
              <h3 className="font-display text-sm font-semibold text-ink-900">
                2. Nguồn xử lý AI (AI Engine)
              </h3>
              <p className="text-2xs text-ink-600">
                Lựa chọn cơ chế phản hồi cho trợ lý ảo.
              </p>
            </div>

            <div className="space-y-2">
              <label className="flex items-start gap-3 rounded-hair border border-sand-300 bg-sand-100/50 p-3 cursor-pointer hover:border-ink-900 transition-colors">
                <input
                  type="radio"
                  name="provider"
                  value="catalog_ai"
                  checked={form.provider === "catalog_ai"}
                  onChange={() => setForm({ ...form, provider: "catalog_ai" })}
                  className="mt-0.5 accent-lagoon-700"
                />
                <div>
                  <span className="text-xs font-semibold text-ink-900 block">
                    Trợ lý LiseaMade Catalog AI (Khuyên dùng - Miễn phí 100%)
                  </span>
                  <span className="text-2xs text-ink-600 block mt-0.5">
                    Tự động phân tích câu hỏi dựa trên dữ liệu sản phẩm thật, thuật toán tư vấn size chuẩn xác, giải đáp chính sách freeship &amp; đổi trả ngay lập tức mà không cần kết nối API ngoài.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 rounded-hair border border-sand-300 bg-sand-100/50 p-3 cursor-pointer hover:border-ink-900 transition-colors">
                <input
                  type="radio"
                  name="provider"
                  value="gemini"
                  checked={form.provider === "gemini"}
                  onChange={() => setForm({ ...form, provider: "gemini" })}
                  className="mt-0.5 accent-lagoon-700"
                />
                <div>
                  <span className="text-xs font-semibold text-ink-900 block">
                    Google Gemini API (Nâng cao)
                  </span>
                  <span className="text-2xs text-ink-600 block mt-0.5">
                    Sử dụng mô hình ngôn ngữ lớn của Google để trò chuyện tự nhiên hơn. Yêu cầu nhập Gemini API Key miễn phí từ Google AI Studio.
                  </span>
                </div>
              </label>
            </div>

            {form.provider === "gemini" && (
              <div className="rounded-hair bg-sand-100 p-4 space-y-3 border border-sand-300 animate-reveal-up">
                <div>
                  <label className="block text-2xs font-semibold text-ink-800 mb-1">
                    Google Gemini API Key:
                  </label>
                  <input
                    type="password"
                    value={form.geminiApiKey || ""}
                    onChange={(e) => setForm({ ...form, geminiApiKey: e.target.value })}
                    className="w-full rounded-hair border border-sand-300 bg-sand-50 p-2 font-mono text-xs text-ink-900 focus:outline-none focus:border-ink-900"
                    placeholder="AIzaSy..."
                  />
                  <p className="text-[10px] text-ink-500 mt-1">
                    Lấy API Key miễn phí tại:{" "}
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noreferrer"
                      className="text-lagoon-700 underline"
                    >
                      aistudio.google.com
                    </a>
                  </p>
                </div>

                <div>
                  <label className="block text-2xs font-semibold text-ink-800 mb-1">
                    Mô hình (Model):
                  </label>
                  <select
                    value={form.geminiModel || "gemini-1.5-flash"}
                    onChange={(e) => setForm({ ...form, geminiModel: e.target.value })}
                    className="w-full rounded-hair border border-sand-300 bg-sand-50 p-2 text-xs text-ink-900 focus:outline-none focus:border-ink-900"
                  >
                    <option value="gemini-1.5-flash">Gemini 1.5 Flash (Nhanh &amp; Tiết kiệm)</option>
                    <option value="gemini-2.0-flash">Gemini 2.0 Flash (Thế hệ mới)</option>
                    <option value="gemini-1.5-pro">Gemini 1.5 Pro (Thông minh chuyên sâu)</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Quick Questions & Prompt */}
          <div className="rounded-hair border border-sand-300 bg-sand-50 p-6 space-y-4">
            <div className="border-b border-sand-200 pb-3">
              <h3 className="font-display text-sm font-semibold text-ink-900">
                3. Câu hỏi gợi ý nhanh &amp; System Prompt
              </h3>
              <p className="text-2xs text-ink-600">
                Các nút bấm để khách hàng nhấp 1 chạm để hỏi nhanh.
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-2xs font-semibold text-ink-800">
                Danh sách câu hỏi gợi ý:
              </label>
              <div className="flex flex-wrap gap-2">
                {form.quickQuestions.map((q, idx) => (
                  <span
                    key={`${q}-${idx}`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-sand-300 bg-sand-100 px-3 py-1 text-2xs font-medium text-ink-800"
                  >
                    <span>{q}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveQuickQuestion(idx)}
                      className="text-coral-700 hover:text-coral-900 text-xs font-bold"
                      title="Xóa câu hỏi này"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="text"
                  value={quickQuestionInput}
                  onChange={(e) => setQuickQuestionInput(e.target.value)}
                  placeholder="Thêm câu hỏi gợi ý mới..."
                  className="flex-1 rounded-hair border border-sand-300 bg-sand-100/60 p-2 text-xs text-ink-900 focus:outline-none focus:border-ink-900"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleAddQuickQuestion}
                >
                  + Thêm
                </Button>
              </div>
            </div>

            <div>
              <label className="block text-2xs font-semibold text-ink-800 mb-1">
                Hướng dẫn phong cách cho AI (System Prompt):
              </label>
              <textarea
                rows={3}
                value={form.systemPrompt}
                onChange={(e) => setForm({ ...form, systemPrompt: e.target.value })}
                className="w-full rounded-hair border border-sand-300 bg-sand-100/60 p-2 text-xs text-ink-900 focus:outline-none focus:border-ink-900"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={handleReset}>
              Khôi phục mặc định
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Lưu cấu hình Chatbot
            </Button>
          </div>
        </form>

        {/* Cột phải (5 cols): Test Chat Sandbox Trực Tiếp */}
        <div className="lg:col-span-5">
          <div className="sticky top-6 rounded-hair border border-sand-300 bg-sand-50 shadow-md overflow-hidden flex flex-col h-[560px]">
            <div className="bg-ink-900 px-4 py-3 text-sand-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SparkleIcon className="h-4 w-4 text-lagoon-400" />
                <span className="font-display text-xs font-semibold">
                  Thử nghiệm Chatbot Sandbox
                </span>
              </div>
              <button
                type="button"
                onClick={() =>
                  setTestMessages([
                    {
                      id: "test-init",
                      sender: "bot",
                      text: form.welcomeMessage,
                      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                    },
                  ])
                }
                className="text-[10px] text-sand-300 hover:text-sand-50 underline"
              >
                Làm mới
              </button>
            </div>

            {/* Test messages stream */}
            <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-sand-100/50 text-xs">
              {testMessages.map((m) => {
                const isUser = m.sender === "user";
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-hair p-2.5 whitespace-pre-wrap ${
                        isUser
                          ? "bg-lagoon-700 text-sand-50"
                          : "bg-sand-50 text-ink-900 border border-sand-300"
                      }`}
                    >
                      {m.text}
                    </div>

                    {m.recommendedProducts && m.recommendedProducts.length > 0 && (
                      <div className="mt-1.5 space-y-1 w-full max-w-[85%]">
                        {m.recommendedProducts.map((p) => (
                          <div
                            key={p.id}
                            className="rounded border border-sand-300 bg-sand-50 p-1.5 text-[11px] font-medium text-ink-800"
                          >
                            • {p.name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {isTestTyping && (
                <div className="text-[10px] text-ink-500 italic">
                  Bot đang phản hồi...
                </div>
              )}
            </div>

            {/* Quick Chips in test */}
            <div className="border-t border-sand-200 bg-sand-50 p-2 overflow-x-auto flex gap-1.5">
              {form.quickQuestions.slice(0, 3).map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => handleSendTestMessage(q)}
                  className="rounded-full border border-sand-300 bg-sand-100 px-2 py-0.5 text-[9px] text-ink-700 hover:bg-sand-200 whitespace-nowrap"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Test input bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendTestMessage();
              }}
              className="border-t border-sand-200 bg-sand-50 p-2 flex gap-1.5"
            >
              <input
                type="text"
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                placeholder="Nhập thử (ví dụ: 1m58 48kg, váy đầm hè)..."
                className="flex-1 rounded-hair border border-sand-300 bg-sand-100/60 px-2.5 py-1.5 text-xs text-ink-900 focus:outline-none focus:border-ink-900"
              />
              <Button type="submit" variant="primary" size="sm" disabled={!testInput.trim() || isTestTyping}>
                Gửi
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
