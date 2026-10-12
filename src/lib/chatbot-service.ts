import type { Product } from "@/types";
import { formatVnd } from "@/lib/format";

export interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: string;
  recommendedProducts?: Product[];
}

export interface ChatbotConfig {
  enabled: boolean;
  botName: string;
  welcomeMessage: string;
  quickQuestions: string[];
  systemPrompt: string;
  provider: "catalog_ai" | "gemini";
  geminiApiKey?: string;
  geminiModel?: string;
}

export const STORAGE_KEY_CHATBOT_CONFIG = "liseamade.admin.chatbot.v1";
export const STORAGE_KEY_CHAT_HISTORY = "liseamade.chat.history.v1";

export const DEFAULT_CHATBOT_CONFIG: ChatbotConfig = {
  enabled: true,
  botName: "Lisea AI Stylist",
  welcomeMessage:
    "Xin chào quý khách! Em là trợ lý thời trang LiseaMade. Em có thể gợi ý mẫu đầm váy hè, tư vấn chọn size chuẩn theo dáng người hoặc giải đáp chính sách mua hàng cho mình ạ ✨",
  quickQuestions: [
    "Tư vấn chọn size",
    "Váy đầm hè mới nhất",
    "Chính sách freeship & đổi trả",
    "Set đồ đi biển",
  ],
  systemPrompt:
    "Bạn là Lisea AI Stylist — chuyên viên tư vấn thời trang cao cấp của thương hiệu LiseaMade. Luôn lịch sự, nhã nhặn, am hiểu thời trang mùa hè (voan, linen, cotton) và tư vấn size chuẩn xác.",
  provider: "catalog_ai",
  geminiApiKey: "",
  geminiModel: "gemini-1.5-flash",
};

export function getChatbotConfig(): ChatbotConfig {
  if (typeof window === "undefined") return { ...DEFAULT_CHATBOT_CONFIG };
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CHATBOT_CONFIG);
    if (!raw) return { ...DEFAULT_CHATBOT_CONFIG };
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_CHATBOT_CONFIG,
      ...parsed,
      quickQuestions: Array.isArray(parsed.quickQuestions)
        ? parsed.quickQuestions
        : DEFAULT_CHATBOT_CONFIG.quickQuestions,
    };
  } catch {
    return { ...DEFAULT_CHATBOT_CONFIG };
  }
}

export function saveChatbotConfig(config: ChatbotConfig): ChatbotConfig {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY_CHATBOT_CONFIG, JSON.stringify(config));
  }
  return config;
}

export function resetChatbotConfig(): ChatbotConfig {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY_CHATBOT_CONFIG);
  }
  return { ...DEFAULT_CHATBOT_CONFIG };
}

export function getStoredChatHistory(): ChatMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CHAT_HISTORY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveStoredChatHistory(messages: ChatMessage[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      STORAGE_KEY_CHAT_HISTORY,
      JSON.stringify(messages.slice(-50))
    );
  } catch {
    // ignore
  }
}

export function clearStoredChatHistory(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY_CHAT_HISTORY);
  } catch {
    // ignore
  }
}

/**
 * Trợ lý tư vấn size dựa trên chiều cao và cân nặng
 */
export function adviseSize(text: string): string | null {
  const normalized = text.toLowerCase();
  
  // Trích xuất số chiều cao (cm hoặc m) và cân nặng (kg)
  const heightCmMatch = normalized.match(/(\d{3})\s*cm/) || normalized.match(/1m([4-8]\d)/);
  const weightMatch = normalized.match(/(\d{2})\s*kg/) || normalized.match(/nặng\s*(\d{2})/);

  let height = 0;
  if (heightCmMatch) {
    height = heightCmMatch[1].length === 2 ? 100 + Number(heightCmMatch[1]) : Number(heightCmMatch[1]);
  } else {
    const rawHeight = normalized.match(/1[.,](\d{2})/);
    if (rawHeight) height = 100 + Number(rawHeight[1]);
  }

  let weight = 0;
  if (weightMatch) {
    weight = Number(weightMatch[1]);
  }

  if (height > 0 && weight > 0) {
    let size = "M";
    let note = "";

    if (weight < 46) {
      size = "S";
      note = "Dáng người mình mi nhon, mặc size S sẽ vừa vặn và ôm dáng thanh thoát nhất ạ.";
    } else if (weight <= 53) {
      size = "S hoặc M";
      note = "Với vóc dáng này, size M là chuẩn phom thoải mái, nếu mình thích mặc ôm gọn có thể chọn size S ạ.";
    } else if (weight <= 59) {
      size = "L";
      note = "Dáng người này mặc size L là tôn dáng và thoải mái di chuyển nhất ạ.";
    } else {
      size = "XL / Free size";
      note = "Mình nên ưu tiên chọn size XL hoặc các mẫu đầm suông/freesize chất liệu linen, voan nhẹ để bay bổng và giấu khuyết điểm tuyệt đối ạ.";
    }

    return `Dạ theo số đo chiều cao ${height}cm và cân nặng ${weight}kg của mình:\n\n✨ **Size phù hợp nhất: ${size}**\n\n${note}\n\nĐặc biệt tại LiseaMade, các sản phẩm đều có chính sách hỗ trợ đổi size miễn phí trong 7 ngày nếu mặc chưa ưng ý nên mình hoàn toàn yên tâm nha!`;
  }

  if (normalized.includes("size") || normalized.includes("bảng size") || normalized.includes("chọn size")) {
    return `Dạ em gửi mình **Bảng size chuẩn LiseaMade** để mình tham khảo nhé:\n\n• **Size S**: 40kg - 46kg (Cao 1m50 - 1m58)\n• **Size M**: 47kg - 53kg (Cao 1m55 - 1m62)\n• **Size L**: 54kg - 60kg (Cao 1m58 - 1m68)\n• **Size XL / Free size**: Trên 60kg hoặc các dáng suông dạo biển\n\n👉 Mình có thể nhắn cho em **chiều cao & cân nặng** (ví dụ: *1m58 48kg*), em sẽ tư vấn phom dáng chuẩn nhất cho mình ạ!`;
  }

  return null;
}

/**
 * Trợ lý chính sách: giao hàng, phí ship, đổi trả, địa chỉ
 */
export function answerPolicy(text: string): string | null {
  const q = text.toLowerCase();

  if (q.includes("freeship") || q.includes("phí ship") || q.includes("vận chuyển") || q.includes("giao hàng") || q.includes("bao lâu")) {
    return `Dạ chính sách giao hàng của LiseaMade như sau ạ:\n\n🚚 **Ưu đãi Freeship**: Miễn phí vận chuyển toàn quốc cho đơn hàng từ **500.000₫** trở lên (đơn dưới 500k phí ship đồng giá 30.000₫).\n⏱️ **Thời gian nhận hàng**:\n• Nội thành (Hà Nội, TP.HCM): 1 - 2 ngày làm việc.\n• Các tỉnh thành khác: 2 - 3 ngày làm việc.\n📦 **Kiểm tra hàng**: Khách hàng được quyền kiểm tra sản phẩm trước khi thanh toán (COD) ạ!`;
  }

  if (q.includes("đổi trả") || q.includes("đổi size") || q.includes("bảo hành") || q.includes("trả hàng")) {
    return `Dạ LiseaMade hỗ trợ chính sách **Đổi hàng trong vòng 7 ngày** kể từ khi nhận được sản phẩm:\n\n1. Hỗ trợ đổi size hoặc đổi sang mẫu khác nếu mặc không vừa hoặc không hợp phom.\n2. Sản phẩm giữ nguyên tem mác, chưa qua giặt ủi hay sử dụng.\n3. Nếu có lỗi từ nhà sản xuất, LiseaMade chịu 100% phí ship đổi hàng cho mình ạ!`;
  }

  if (q.includes("địa chỉ") || q.includes("cửa hàng") || q.includes("shop ở đâu") || q.includes("hotline") || q.includes("liên hệ")) {
    return `Dạ thông tin liên hệ chính thức của LiseaMade:\n\n📍 **Địa chỉ**: Hawaii Studio & Boutique, TP. Hồ Chí Minh\n📞 **Hotline**: 0987 654 321 (Hỗ trợ 8:00 - 22:00 hàng ngày)\n📱 **TikTok Shop**: @liseamade\n🌐 **Website**: liseamade.vn\n\nQuý khách có thể đặt hàng trực tiếp ngay trên website hoặc liên hệ hotline để được phục vụ nhanh nhất ạ!`;
  }

  if (q.includes("thanh toán") || q.includes("chuyển khoản") || q.includes("cod")) {
    return `Dạ LiseaMade hỗ trợ 3 hình thức thanh toán tiện lợi:\n\n1. **COD**: Nhận hàng kiểm tra rồi thanh toán tiền mặt cho shipper.\n2. **Chuyển khoản ngân hàng**: Quét mã QR tiện lợi, xác nhận đơn tức thì.\n3. **Ví điện tử**: MoMo / ZaloPay / ShopeePay.\n\nMọi giao dịch đều được bảo mật tuyệt đối ạ!`;
  }

  return null;
}

/**
 * Tìm kiếm và gợi ý sản phẩm phù hợp từ catalog
 */
export function recommendProducts(text: string, products: Product[]): { message: string; items: Product[] } | null {
  const q = text.toLowerCase();

  const isAskingProducts =
    q.includes("váy") ||
    q.includes("đầm") ||
    q.includes("áo") ||
    q.includes("set") ||
    q.includes("phụ kiện") ||
    q.includes("mẫu") ||
    q.includes("sản phẩm") ||
    q.includes("mới") ||
    q.includes("đi biển") ||
    q.includes("linen") ||
    q.includes("voan") ||
    q.includes("hè") ||
    q.includes("bán chạy") ||
    q.includes("gợi ý");

  if (!isAskingProducts) return null;

  let matched = products.filter((p) => {
    const name = p.name.toLowerCase();
    const desc = (p.description + " " + p.shortDescription).toLowerCase();
    const mats = p.materials.join(" ").toLowerCase();

    if (q.includes("váy") || q.includes("đầm")) {
      return p.category === "vay-dam" || name.includes("váy") || name.includes("đầm");
    }
    if (q.includes("áo")) {
      return p.category === "ao" || name.includes("áo");
    }
    if (q.includes("set") || q.includes("set đồ")) {
      return p.category === "set-do" || name.includes("set");
    }
    if (q.includes("phụ kiện") || q.includes("mũ") || q.includes("túi")) {
      return p.category === "phu-kien";
    }
    if (q.includes("đi biển") || q.includes("hawaii")) {
      return name.includes("biển") || name.includes("dừa") || name.includes("maxi") || desc.includes("biển");
    }
    if (q.includes("linen")) {
      return mats.includes("linen") || name.includes("linen");
    }
    if (q.includes("voan")) {
      return mats.includes("voan") || name.includes("voan");
    }

    return true;
  });

  if (matched.length === 0) {
    matched = products.slice(0, 3);
  }

  const selected = matched.slice(0, 3);

  const intro =
    q.includes("váy") || q.includes("đầm")
      ? "Dạ LiseaMade có các mẫu váy đầm hè dáng bay bổng, chất liệu voan & linen cực kỳ được lòng các nàng đây ạ:"
      : q.includes("áo")
      ? "Dạ các mẫu áo mùa hè nhẹ mát, dễ phối đồ của shop gồm có:"
      : q.includes("set")
      ? "Dạ các set đồ phối sẵn tiện lợi, mặc đi chơi hay dạo phố đều xinh xắn đây ạ:"
      : "Dạ em xin gợi ý cho mình các mẫu thiết kế hot nhất trong bộ sưu tập Hawaii Summer của LiseaMade ạ:";

  return {
    message: `${intro}\n\n${selected.map((p, idx) => `${idx + 1}. **${p.name}** — ${formatVnd(p.price)}`).join("\n")}\n\nQuý khách có thể bấm vào thẻ sản phẩm bên dưới để xem chi tiết chất liệu và chọn size đặt hàng nhé!`,
    items: selected,
  };
}

/**
 * Trình xử lý tin nhắn chính (Hybrid AI: Rule-based Catalog Knowledge + Gemini fallback)
 */
export async function getAiChatbotResponse(
  userText: string,
  history: ChatMessage[],
  products: Product[],
  config: ChatbotConfig
): Promise<{ text: string; recommendedProducts?: Product[] }> {
  const trimmed = userText.trim();
  if (!trimmed) {
    return { text: "Dạ mình đang quan tâm đến sản phẩm hoặc cần em tư vấn điều gì ạ?" };
  }

  // 1. Nếu cấu hình Gemini và có API Key: gọi Google Gemini API
  if (config.provider === "gemini" && config.geminiApiKey) {
    try {
      const geminiPrompt = `${config.systemPrompt}\n\nDanh sách sản phẩm hiện có tại LiseaMade:\n${products
        .slice(0, 8)
        .map((p) => `- ${p.name} (Giá: ${p.price}₫, Loại: ${p.category})`)
        .join("\n")}\n\nLịch sử trò chuyện gần nhất:\n${history
        .slice(-4)
        .map((m) => `${m.sender === "user" ? "Khách hàng" : "AI"}: ${m.text}`)
        .join("\n")}\n\nKhách hàng: ${trimmed}\nAI:`;

      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${
        config.geminiModel || "gemini-1.5-flash"
      }:generateContent?key=${encodeURIComponent(config.geminiApiKey)}`;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: geminiPrompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500,
          },
        }),
      });

      if (res.ok) {
        const json = await res.json().catch(() => null);
        const reply = json?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (reply) {
          const rec = recommendProducts(trimmed, products);
          return {
            text: reply,
            recommendedProducts: rec ? rec.items : undefined,
          };
        }
      }
    } catch {
      // Fallback xuống Catalog AI
    }
  }

  // 2. Chế độ Catalog AI (Tích hợp sẵn, offline, bảo mật, không tốn token)
  // Ưu tiên 1: Chào hỏi
  const lower = trimmed.toLowerCase();
  if (
    lower === "hi" ||
    lower === "hello" ||
    lower.startsWith("xin chào") ||
    lower.startsWith("chào") ||
    lower === "alo" ||
    lower.includes("shop ơi")
  ) {
    return {
      text: "Dạ LiseaMade xin chào quý khách ạ! 🌸 Rất vui được đón tiếp mình. Hôm nay mình đang tìm kiếm đầm váy đi chơi hè, áo nhẹ mát hay cần em tư vấn chọn size chuẩn cho mình ạ?",
    };
  }

  // Ưu tiên 2: Tư vấn chọn size
  const sizeReply = adviseSize(trimmed);
  if (sizeReply) {
    return { text: sizeReply };
  }

  // Ưu tiên 3: Chính sách giao hàng, đổi trả, bảo hành, liên hệ
  const policyReply = answerPolicy(trimmed);
  if (policyReply) {
    return { text: policyReply };
  }

  // Ưu tiên 4: Hỏi về sản phẩm và mẫu mã
  const productRec = recommendProducts(trimmed, products);
  if (productRec) {
    return {
      text: productRec.message,
      recommendedProducts: productRec.items,
    };
  }

  // Fallback thông minh thân thiện
  const fallbackProducts = products.slice(0, 2);
  return {
    text: `Dạ em đã ghi nhận câu hỏi của mình ạ! Tại LiseaMade, tụi em chuyên về các dòng thời trang voan, linen, cotton hè cao cấp. Nếu mình cần tư vấn size, hãy gửi cho em chiều cao & cân nặng; hoặc nếu mình đang tìm mẫu đầm, áo cụ thể thì nhắn tên cho em nhé! Em gửi mình xem thử 2 thiết kế mùa hè đang được yêu thích nhất hôm nay ạ:`,
    recommendedProducts: fallbackProducts,
  };
}
