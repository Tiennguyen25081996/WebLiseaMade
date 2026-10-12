import type { Product } from "@/types";
import { formatVnd } from "@/lib/format";
import { getOrderByCodeApi } from "@/lib/api";
import { readOrders } from "@/lib/orders";

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
    "Sản phẩm bán chạy nhất 🔥",
    "Kiểm tra đơn hàng 📦",
    "Tư vấn chọn size",
    "Váy đầm hè mới nhất",
    "Chính sách freeship & đổi trả",
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
 * Tra cứu trạng thái đơn hàng trực tiếp trong DB (Cloudflare D1 / LocalStorage)
 */
export async function checkOrderStatusInDb(
  query: string
): Promise<{ text: string } | null> {
  const normalized = query.trim();

  // 1. Nhận diện mã đơn hàng (định dạng LM-XXXXXX hoặc biến thể LM-)
  const codeMatch =
    normalized.match(/\b(LM-[A-HJ-NP-Z0-9]{4,10})\b/i) ||
    normalized.match(/\b((?:LM|LSM|ORD)[-_]?[A-Z0-9]{4,10})\b/i) ||
    normalized.match(/(?:mã\s*(?:đơn|vận\s*đơn)?|đơn\s*hàng)\s*[:#\s]?\s*([A-Za-z0-9-]{6,12})/i);

  // 2. Nhận diện số điện thoại (10 chữ số)
  const phoneMatch = normalized.match(/(?:sđt|số\s*điện\s*thoại|phone|đt)\s*[:#\s]?\s*(0[35789]\d{8})\b/i);

  if (codeMatch) {
    const rawCode = codeMatch[1].toUpperCase();
    const formattedCode = rawCode.startsWith("LM-")
      ? rawCode
      : rawCode.includes("-")
        ? rawCode
        : `LM-${rawCode}`;

    try {
      const res = await getOrderByCodeApi(formattedCode);
      if (res.order) {
        const order = res.order;
        const statusMap: Record<string, string> = {
          pending: "🕒 Chờ xác nhận (Shop đang kiểm tra thông tin)",
          processing: "⚙️ Đang xử lý (Shop đang chuẩn bị và đóng gói hàng)",
          shipping: "🚚 Đang giao hàng (Đơn đã bàn giao cho shipper)",
          delivered: "✅ Đã giao thành công (Hoàn tất giao hàng)",
          cancelled: "❌ Đã hủy đơn",
        };

        const statusText = statusMap[order.status || "pending"] || "Đang xử lý";
        const dateStr = order.createdAt
          ? new Date(order.createdAt).toLocaleDateString("vi-VN")
          : "Gần đây";
        const customerName = order.info?.fullName || "Quý khách";
        const phone = order.info?.phone
          ? order.info.phone.replace(/(\d{3})\d{4}(\d{3})/, "$1****$2")
          : "";

        const itemsSummary = (order.lines || [])
          .map(
            (line) =>
              `• **${line.product?.name || "Sản phẩm"}** (Size ${line.variant?.label || "Tiêu chuẩn"}) x${line.quantity} — ${formatVnd(line.unitPrice * line.quantity)}`
          )
          .join("\n");

        let shippingInfo = "";
        if (order.trackingCode) {
          const carrier = (order.carrier || "spx").toUpperCase();
          const trackUrl =
            carrier === "SPX"
              ? `https://spx.vn/track?${order.trackingCode}`
              : carrier === "GHTK"
                ? `https://i.ghtk.vn/${order.trackingCode}`
                : `https://spx.vn/track?${order.trackingCode}`;

          shippingInfo = `\n\n🚚 **Hành trình vận chuyển**:\n• Đơn vị giao hàng: **${carrier} Express**\n• Mã vận đơn: \`${order.trackingCode}\`\n👉 [Bấm vào đây để theo dõi đơn trên ${carrier}](${trackUrl})`;
        } else if (order.status === "shipping") {
          shippingInfo = `\n\n🚚 Đơn hàng đang trên đường giao đến bạn. Nhân viên shipper sẽ liên hệ trước khi phát hàng ạ.`;
        }

        return {
          text: `Dạ em đã tra cứu thông tin đơn hàng **${order.code}** trên hệ thống LiseaMade ạ! ✨\n\n👤 **Khách hàng**: ${customerName} ${phone ? `(${phone})` : ""}\n📅 **Ngày đặt**: ${dateStr}\n📌 **Tình trạng đơn**: **${statusText}**\n\n🛒 **Chi tiết kiện hàng**:\n${itemsSummary}\n💰 **Tổng thanh toán**: **${formatVnd(order.totals.total)}** (${order.info?.paymentMethod === "cod" ? "Thanh toán khi nhận hàng - COD" : "Đã chuyển khoản"})${shippingInfo}\n\nNếu cần hỗ trợ thay đổi địa chỉ hay thời gian nhận hàng, mình nhắn em hoặc gọi hotline 0987 654 321 nhé! 💕`,
        };
      } else {
        return {
          text: `Dạ em đã kiểm tra trên hệ thống nhưng chưa tìm thấy đơn hàng mã **${formattedCode}** ạ.\n\n👉 Mình vui lòng kiểm tra lại chính xác mã đơn (định dạng \`LM-XXXXXX\` được cung cấp khi hoàn tất đặt hàng), hoặc gửi cho em **Số điện thoại** đặt hàng để em hỗ trợ tra cứu nhé!`,
        };
      }
    } catch {
      return {
        text: `Dạ em đã nhận được mã đơn **${formattedCode}**, tuy nhiên hệ thống đang bảo trì tra cứu một chút. Mình có thể vào trang [Tra cứu đơn hàng](/tra-cuu-don) hoặc liên hệ hotline 0987 654 321 để kiểm tra ngay nhé!`,
      };
    }
  }

  // Tra cứu qua số điện thoại nếu có
  if (phoneMatch) {
    const phone = phoneMatch[1];
    const allOrders = readOrders();
    const matchedOrders = allOrders.filter(
      (o) => o.info?.phone?.replace(/\s+/g, "") === phone
    );

    if (matchedOrders.length > 0) {
      const latest = matchedOrders[0];
      const statusMap: Record<string, string> = {
        pending: "Chờ xác nhận",
        processing: "Đang chuẩn bị",
        shipping: "Đang giao hàng",
        delivered: "Đã giao thành công",
        cancelled: "Đã hủy",
      };
      return {
        text: `Dạ em tìm thấy đơn hàng gần nhất của số điện thoại **${phone}**:\n\n📦 **Mã đơn**: **${latest.code}**\n📌 **Trạng thái**: **${statusMap[latest.status || "pending"]}**\n💰 **Tổng tiền**: ${formatVnd(latest.totals.total)}\n\n👉 [Xem chi tiết hành trình đơn hàng tại đây](/tra-cuu-don?code=${latest.code}) ạ!`,
      };
    } else {
      return {
        text: `Dạ em chưa tìm thấy đơn hàng nào liên kết với số điện thoại **${phone}** trong hệ thống. Mình vui lòng kiểm tra lại số điện thoại hoặc gửi cho em **Mã đơn hàng** (dạng \`LM-XXXXXX\`) nha!`,
      };
    }
  }

  // Câu hỏi chung chung về đơn hàng nhưng chưa nhập mã
  const lower = normalized.toLowerCase();
  const isAskingOrderGeneral =
    (lower.includes("đơn hàng") || lower.includes("mã đơn") || lower.includes("đơn của tôi") || lower.includes("tra cứu đơn") || lower.includes("kiểm tra đơn")) &&
    (lower.includes("tình trạng") || lower.includes("ở đâu") || lower.includes("đến đâu") || lower.includes("khi nào") || lower.includes("kiểm tra") || lower.includes("xem") || lower.includes("tra cứu"));

  if (isAskingOrderGeneral) {
    return {
      text: `Dạ để kiểm tra tình trạng đơn hàng và xem hàng đã đi đến đâu, mình vui lòng gửi cho em **Mã đơn hàng** (định dạng \`LM-XXXXXX\`, ví dụ: *LM-8F3K2Q*) hoặc số điện thoại đặt hàng, em sẽ tra cứu ngay trong hệ thống cho mình nhé! ✨\n\nHoặc mình cũng có thể tự tra cứu trực tiếp tại trang [Tra cứu đơn hàng](/tra-cuu-don) ạ.`,
    };
  }

  return null;
}

/**
 * Truy vấn sản phẩm bán chạy nhất (Best Sellers) dựa trên thống kê đơn hàng trong DB và danh mục
 */
export function findBestSellingProducts(
  query: string,
  products: Product[]
): { message: string; items: Product[] } | null {
  const q = query.toLowerCase();

  const isAskingBestSeller =
    q.includes("bán chạy") ||
    q.includes("chạy nhất") ||
    q.includes("hot nhất") ||
    q.includes("mua nhiều nhất") ||
    q.includes("best seller") ||
    q.includes("bestseller") ||
    q.includes("được yêu thích nhất") ||
    q.includes("ưa chuộng nhất") ||
    q.includes("hot trend");

  if (!isAskingBestSeller) return null;

  // 1. Thống kê số lượng bán thực tế từ các đơn hàng trong DB / LocalStorage
  const salesMap = new Map<string, number>();
  const orders = readOrders();
  for (const o of orders) {
    for (const line of o.lines || []) {
      salesMap.set(line.productId, (salesMap.get(line.productId) || 0) + line.quantity);
    }
  }

  // 2. Sắp xếp sản phẩm: theo số lượng bán thực tế > badge Bán chạy > rating
  const sorted = [...products].sort((a, b) => {
    const salesA = salesMap.get(a.id) || 0;
    const salesB = salesMap.get(b.id) || 0;
    if (salesB !== salesA) return salesB - salesA;
    if (a.badges?.includes("Bán chạy") && !b.badges?.includes("Bán chạy")) return -1;
    if (b.badges?.includes("Bán chạy") && !a.badges?.includes("Bán chạy")) return 1;
    return (b.rating || 0) - (a.rating || 0);
  });

  // Lọc theo loại sản phẩm nếu người dùng hỏi cụ thể (ví dụ: "váy nào bán chạy nhất")
  let filtered = sorted;
  if (q.includes("váy") || q.includes("đầm")) {
    filtered = sorted.filter(
      (p) => p.category === "vay-dam" || p.name.toLowerCase().includes("đầm") || p.name.toLowerCase().includes("váy")
    );
  } else if (q.includes("áo")) {
    filtered = sorted.filter(
      (p) => p.category === "ao" || p.name.toLowerCase().includes("áo")
    );
  } else if (q.includes("set")) {
    filtered = sorted.filter(
      (p) => p.category === "set-do" || p.name.toLowerCase().includes("set")
    );
  }

  const topItems = (filtered.length > 0 ? filtered : sorted).slice(0, 3);

  const lines = topItems.map((p, idx) => {
    const sales = salesMap.get(p.id);
    const salesBadge = sales && sales > 0 ? ` (Đã bán ${sales} đơn)` : " (Top Hot Seller)";
    return `🔥 ${idx + 1}. **${p.name}** — ${formatVnd(p.price)}${salesBadge}\n   ${p.shortDescription || p.description.slice(0, 90)}...`;
  });

  return {
    message: `Dạ em xin gửi mình danh sách **Sản Phẩm Bán Chạy Nhất** đang được các nàng săn đón nhiều nhất tại LiseaMade đây ạ:\n\n${lines.join("\n\n")}\n\n✨ Toàn bộ sản phẩm đều cam kết chất liệu cao cấp, tôn dáng và bền đẹp. Mình có thể bấm vào thẻ sản phẩm bên dưới để xem thêm ảnh và đặt hàng nhé!`,
    items: topItems,
  };
}

/**
 * Lọc sản phẩm theo khoảng giá trong catalog DB
 */
export function searchProductsByPrice(
  query: string,
  products: Product[]
): { message: string; items: Product[] } | null {
  const q = query.toLowerCase();

  // Tìm mẫu "dưới 500k", "dưới 400.000", "tầm 300k"
  const underMatch = q.match(/dưới\s*(\d+)(?:\s*(?:k|nghìn|ngàn|000))/i);
  if (underMatch) {
    const rawVal = Number(underMatch[1]);
    const maxPrice = rawVal < 1000 ? rawVal * 1000 : rawVal;
    const matched = products.filter((p) => p.price <= maxPrice);
    if (matched.length > 0) {
      const selected = matched.slice(0, 3);
      return {
        message: `Dạ em đã tìm thấy các mẫu sản phẩm có giá dưới **${formatVnd(maxPrice)}** cực kỳ xinh xắn cho mình đây ạ:\n\n${selected.map((p, i) => `${i + 1}. **${p.name}** — **${formatVnd(p.price)}**`).join("\n")}\n\nQuý khách chọn mẫu ưng ý bên dưới để xem chi tiết nhé!`,
        items: selected,
      };
    }
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
  // Ưu tiên 1: Chào hỏi thuần túy
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
      text: "Dạ LiseaMade xin chào quý khách ạ! 🌸 Rất vui được đón tiếp mình. Hôm nay mình đang tìm kiếm đầm váy đi chơi hè, xem sản phẩm bán chạy nhất hay cần kiểm tra đơn hàng ạ?",
    };
  }

  // Ưu tiên 2: Tra cứu trạng thái đơn hàng trong DB
  const orderLookup = await checkOrderStatusInDb(trimmed);
  if (orderLookup) {
    return { text: orderLookup.text };
  }

  // Ưu tiên 3: Tra cứu sản phẩm bán chạy nhất (Best Sellers)
  const bestSellerResult = findBestSellingProducts(trimmed, products);
  if (bestSellerResult) {
    return {
      text: bestSellerResult.message,
      recommendedProducts: bestSellerResult.items,
    };
  }

  // Ưu tiên 4: Tra cứu sản phẩm theo khoảng giá
  const priceFilterResult = searchProductsByPrice(trimmed, products);
  if (priceFilterResult) {
    return {
      text: priceFilterResult.message,
      recommendedProducts: priceFilterResult.items,
    };
  }

  // Ưu tiên 5: Tư vấn chọn size
  const sizeReply = adviseSize(trimmed);
  if (sizeReply) {
    return { text: sizeReply };
  }

  // Ưu tiên 6: Chính sách giao hàng, đổi trả, bảo hành, liên hệ
  const policyReply = answerPolicy(trimmed);
  if (policyReply) {
    return { text: policyReply };
  }

  // Ưu tiên 7: Hỏi về sản phẩm và mẫu mã
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
