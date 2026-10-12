import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  type ChatMessage,
  getStoredChatHistory,
  saveStoredChatHistory,
  clearStoredChatHistory,
  getAiChatbotResponse,
} from "@/lib/chatbot-service";
import { useAdminStore } from "@/lib/admin-store";
import { formatVnd } from "@/lib/format";
import {
  SparkleIcon,
  CloseIcon,
  TrashIcon,
} from "@/components/ui/icons";
import { normalizeGoogleDriveUrl } from "@/lib/media-api";

function FormattedBotText({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-1">
      {lines.map((line, lineIdx) => {
        if (!line.trim()) {
          return <div key={lineIdx} className="h-1" />;
        }
        const parts: React.ReactNode[] = [];
        const regex = /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*/g;
        let lastIdx = 0;
        let match: RegExpExecArray | null;
        let partIdx = 0;

        while ((match = regex.exec(line)) !== null) {
          if (match.index > lastIdx) {
            parts.push(line.substring(lastIdx, match.index));
          }
          if (match[1] && match[2]) {
            const label = match[1];
            const url = match[2];
            if (url.startsWith("http")) {
              parts.push(
                <a
                  key={`link-${lineIdx}-${partIdx++}`}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-lagoon-700 underline hover:text-lagoon-900 inline-flex items-center gap-0.5"
                >
                  {label} ↗
                </a>
              );
            } else {
              parts.push(
                <Link
                  key={`link-${lineIdx}-${partIdx++}`}
                  to={url}
                  className="font-semibold text-lagoon-700 underline hover:text-lagoon-900"
                >
                  {label}
                </Link>
              );
            }
          } else if (match[3]) {
            parts.push(
              <strong key={`bold-${lineIdx}-${partIdx++}`} className="font-semibold text-ink-900">
                {match[3]}
              </strong>
            );
          }
          lastIdx = regex.lastIndex;
        }

        if (lastIdx < line.length) {
          parts.push(line.substring(lastIdx));
        }

        return <p key={lineIdx}>{parts}</p>;
      })}
    </div>
  );
}

export function AiChatbotWidget() {
  const location = useLocation();
  const { products, chatbotConfig } = useAdminStore();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    return getStoredChatHistory();
  });
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isAdminRoute = location.pathname.startsWith("/admin");

  // Tự động cuộn xuống tin nhắn mới nhất
  const scrollToBottom = () => {
    if (typeof messagesEndRef.current?.scrollIntoView === "function") {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setHasUnread(false);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages, isTyping]);

  // Khởi tạo tin nhắn chào mừng nếu lịch sử trống
  useEffect(() => {
    if (messages.length === 0 && chatbotConfig.welcomeMessage) {
      const initialMsg: ChatMessage = {
        id: `welcome-${Date.now()}`,
        sender: "bot",
        text: chatbotConfig.welcomeMessage,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages([initialMsg]);
      saveStoredChatHistory([initialMsg]);
    }
  }, [chatbotConfig.welcomeMessage]);

  // Ẩn nếu chatbot bị tắt hoặc đang ở trang Admin
  if (!chatbotConfig.enabled || isAdminRoute) {
    return null;
  }

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isTyping) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    saveStoredChatHistory(newMessages);
    setInputValue("");
    setIsTyping(true);

    try {
      // Giả lập độ trễ tự nhiên (300ms - 600ms) để tạo cảm giác suy nghĩ
      await new Promise((r) => setTimeout(r, 450));
      const res = await getAiChatbotResponse(text, newMessages, products, chatbotConfig);

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: res.text,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        recommendedProducts: res.recommendedProducts,
      };

      const finalMessages = [...newMessages, botMsg];
      setMessages(finalMessages);
      saveStoredChatHistory(finalMessages);
    } catch {
      const errorMsg: ChatMessage = {
        id: `bot-err-${Date.now()}`,
        sender: "bot",
        text: "Dạ em xin lỗi, hệ thống đang bận một chút. Mình có thể thử nhắn lại hoặc gọi hotline 0987 654 321 để được hỗ trợ tức thì ạ!",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleClearHistory = () => {
    if (window.confirm("Bạn có muốn xóa toàn bộ lịch sử đoạn chat này không?")) {
      clearStoredChatHistory();
      const freshMsg: ChatMessage = {
        id: `welcome-${Date.now()}`,
        sender: "bot",
        text: chatbotConfig.welcomeMessage,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages([freshMsg]);
    }
  };

  return (
    <>
      {/* Floating Action Button (Nút mở Chat) */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => {
            setIsOpen(true);
            setHasUnread(false);
          }}
          className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 flex items-center gap-2 rounded-full bg-ink-900 px-4 py-3 text-sand-50 shadow-xl transition-all duration-300 hover:scale-105 hover:bg-lagoon-900 focus:outline-none focus:ring-2 focus:ring-lagoon-500 focus:ring-offset-2 tap-feedback group"
          aria-label="Mở trợ lý thời trang Lisea AI"
        >
          <div className="relative flex h-6 w-6 items-center justify-center text-lagoon-400 group-hover:rotate-12 transition-transform">
            <SparkleIcon className="h-5 w-5" />
            <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
            </span>
          </div>
          <span className="font-display text-xs font-semibold tracking-wide hidden sm:inline">
            Tư vấn AI
          </span>
          {hasUnread && (
            <span className="flex h-2 w-2 rounded-full bg-coral-500" />
          )}
        </button>
      )}

      {/* Chat Window Panel */}
      {isOpen && (
        <aside
          role="complementary"
          aria-label="Cửa sổ trò chuyện Lisea AI"
          className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 flex w-[calc(100vw-2rem)] sm:w-[380px] h-[520px] max-h-[85vh] flex-col overflow-hidden rounded-hair border border-sand-300 bg-sand-50 shadow-2xl animate-reveal-up"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-sand-200 bg-ink-900 px-4 py-3 text-sand-50">
            <div className="flex items-center gap-2.5">
              <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-lagoon-800 text-sand-50 border border-lagoon-600">
                <SparkleIcon className="h-4 w-4 text-lagoon-300" />
                <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-green-500 ring-1 ring-ink-900" />
              </div>
              <div>
                <h3 className="font-display text-xs font-semibold leading-tight text-sand-50">
                  {chatbotConfig.botName}
                </h3>
                <p className="text-[10px] text-lagoon-300 leading-tight">
                  Tư vấn mẫu hè &amp; chọn size chuẩn
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleClearHistory}
                className="rounded p-1.5 text-sand-300 hover:bg-ink-800 hover:text-sand-50 transition-colors"
                title="Xóa lịch sử chat"
                aria-label="Xóa lịch sử trò chuyện"
              >
                <TrashIcon className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded p-1.5 text-sand-300 hover:bg-ink-800 hover:text-sand-50 transition-colors"
                title="Thu nhỏ chat"
                aria-label="Đóng cửa sổ trò chuyện"
              >
                <CloseIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs bg-sand-100/40">
            {messages.map((msg) => {
              const isUser = msg.sender === "user";
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? "items-end" : "items-start"} space-y-1`}
                >
                  <div
                    className={`max-w-[85%] rounded-hair px-3.5 py-2.5 leading-relaxed ${
                      isUser
                        ? "bg-lagoon-700 text-sand-50 shadow-2xs whitespace-pre-wrap"
                        : "bg-sand-50 text-ink-900 border border-sand-300 shadow-2xs"
                    }`}
                  >
                    {isUser ? msg.text : <FormattedBotText text={msg.text} />}
                  </div>

                  {/* Sản phẩm gợi ý kèm trong phản hồi của bot */}
                  {msg.recommendedProducts && msg.recommendedProducts.length > 0 && (
                    <div className="mt-2 w-full max-w-[95%] space-y-2">
                      <span className="text-[10px] font-semibold text-ink-600 block">
                        Gợi ý cho bạn:
                      </span>
                      <div className="grid grid-cols-1 gap-2">
                        {msg.recommendedProducts.map((p) => {
                          const imgSrc = p.images?.[0]
                            ? normalizeGoogleDriveUrl(p.images[0])
                            : "/figma-images/catalog-1.png";
                          return (
                            <Link
                              key={p.id}
                              to={`/san-pham/${p.id}`}
                              onClick={() => setIsOpen(false)}
                              className="flex items-center gap-2.5 rounded-hair border border-sand-300 bg-sand-50 p-2 hover:border-lagoon-700 hover:bg-sand-100 transition-all group"
                            >
                              <img
                                src={imgSrc}
                                alt={p.name}
                                referrerPolicy="no-referrer"
                                className="h-11 w-11 rounded object-cover bg-sand-200 shrink-0"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = "/figma-images/catalog-1.png";
                                }}
                              />
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-[11px] text-ink-900 truncate group-hover:text-lagoon-800">
                                  {p.name}
                                </h4>
                                <div className="flex items-center justify-between mt-0.5">
                                  <span className="font-mono text-[10px] font-semibold text-lagoon-800">
                                    {formatVnd(p.price)}
                                  </span>
                                  <span className="text-[10px] text-ink-500 group-hover:translate-x-0.5 transition-transform">
                                    Xem →
                                  </span>
                                </div>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <span className="text-[9px] text-ink-400 font-mono px-1">
                    {msg.timestamp}
                  </span>
                </div>
              );
            })}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex items-center gap-1.5 rounded-hair border border-sand-200 bg-sand-50 px-3 py-2 text-ink-500 w-fit">
                <span className="h-1.5 w-1.5 rounded-full bg-lagoon-600 animate-pulse" />
                <span className="h-1.5 w-1.5 rounded-full bg-lagoon-600 animate-pulse delay-150" />
                <span className="h-1.5 w-1.5 rounded-full bg-lagoon-600 animate-pulse delay-300" />
                <span className="text-[10px] text-ink-500 ml-1">Lisea AI đang phản hồi...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions Chips */}
          {chatbotConfig.quickQuestions.length > 0 && (
            <div className="border-t border-sand-200 bg-sand-100/50 p-2 overflow-x-auto flex gap-1.5 shrink-0 scrollbar-none">
              {chatbotConfig.quickQuestions.map((q, idx) => (
                <button
                  key={`${q}-${idx}`}
                  type="button"
                  onClick={() => handleSendMessage(q)}
                  disabled={isTyping}
                  className="rounded-full border border-sand-300 bg-sand-50 px-2.5 py-1 text-[10px] font-medium text-ink-700 hover:bg-sand-200 hover:border-ink-900 transition-colors whitespace-nowrap shrink-0 disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2 border-t border-sand-200 bg-sand-50 p-2.5"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Nhập câu hỏi (ví dụ: 1m58 48kg mặc size gì?)..."
              disabled={isTyping}
              className="flex-1 rounded-hair border border-sand-300 bg-sand-100/60 px-3 py-2 text-xs text-ink-900 placeholder:text-ink-400 focus:outline-none focus:border-ink-900 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isTyping}
              className="flex h-8 w-8 items-center justify-center rounded-hair bg-ink-900 text-sand-50 transition-colors hover:bg-lagoon-800 disabled:opacity-40 shrink-0"
              title="Gửi tin nhắn"
            >
              <span className="text-xs">↑</span>
            </button>
          </form>
        </aside>
      )}
    </>
  );
}
