import { describe, it, expect, beforeEach } from "vitest";
import {
  getChatbotConfig,
  saveChatbotConfig,
  resetChatbotConfig,
  adviseSize,
  answerPolicy,
  recommendProducts,
  getAiChatbotResponse,
  DEFAULT_CHATBOT_CONFIG,
} from "./chatbot-service";
import { PRODUCTS } from "@/data/products";

describe("chatbot-service", () => {
  beforeEach(() => {
    localStorage.clear();
    resetChatbotConfig();
  });

  describe("Cấu hình Chatbot Storage", () => {
    it("trả về cấu hình mặc định khi chưa lưu", () => {
      const config = getChatbotConfig();
      expect(config.enabled).toBe(true);
      expect(config.botName).toBe(DEFAULT_CHATBOT_CONFIG.botName);
      expect(config.provider).toBe("catalog_ai");
    });

    it("lưu và đọc cấu hình chatbot thành công", () => {
      const initial = getChatbotConfig();
      saveChatbotConfig({
        ...initial,
        botName: "Lisea VIP Assistant",
        enabled: false,
      });

      const updated = getChatbotConfig();
      expect(updated.botName).toBe("Lisea VIP Assistant");
      expect(updated.enabled).toBe(false);
    });

    it("reset cấu hình về mặc định", () => {
      saveChatbotConfig({
        ...DEFAULT_CHATBOT_CONFIG,
        botName: "Test Bot",
      });
      resetChatbotConfig();
      expect(getChatbotConfig().botName).toBe(DEFAULT_CHATBOT_CONFIG.botName);
    });
  });

  describe("Thuật toán tư vấn size (adviseSize)", () => {
    it("tư vấn chuẩn xác khi có chiều cao và cân nặng", () => {
      // 1m58 48kg -> size S hoặc M
      const reply1 = adviseSize("Mình cao 1m58 nặng 48kg thì mặc size gì shop?");
      expect(reply1).toContain("Size phù hợp nhất: S hoặc M");

      // 43kg -> size S
      const reply2 = adviseSize("em 43kg cao 152cm");
      expect(reply2).toContain("Size phù hợp nhất: S");

      // 58kg -> size L
      const reply3 = adviseSize("cao 1m62 nặng 58kg");
      expect(reply3).toContain("Size phù hợp nhất: L");

      // 65kg -> size XL / Free size
      const reply4 = adviseSize("cao 1m65 nặng 65kg");
      expect(reply4).toContain("Size phù hợp nhất: XL / Free size");
    });

    it("gửi bảng size tổng quát khi người dùng chỉ hỏi chung chung", () => {
      const reply = adviseSize("shop cho mình xem bảng size với");
      expect(reply).toContain("Bảng size chuẩn LiseaMade");
      expect(reply).toContain("Size S");
      expect(reply).toContain("Size M");
    });
  });

  describe("Giải đáp chính sách (answerPolicy)", () => {
    it("trả lời chính sách freeship và phí giao hàng", () => {
      const reply = answerPolicy("shop có freeship không, phí ship bao nhiêu?");
      expect(reply).toContain("Ưu đãi Freeship");
      expect(reply).toContain("500.000₫");
    });

    it("trả lời chính sách đổi trả hàng trong 7 ngày", () => {
      const reply = answerPolicy("chính sách đổi trả hàng như thế nào shop?");
      expect(reply).toContain("Đổi hàng trong vòng 7 ngày");
    });

    it("trả lời thông tin liên hệ và hotline", () => {
      const reply = answerPolicy("cho mình xin số hotline và địa chỉ shop");
      expect(reply).toContain("0987 654 321");
      expect(reply).toContain("Hawaii Studio & Boutique");
    });
  });

  describe("Gợi ý sản phẩm từ catalog (recommendProducts)", () => {
    it("gợi ý váy đầm khi người dùng hỏi váy", () => {
      const rec = recommendProducts("có mẫu váy đầm nào xinh đi biển không?", PRODUCTS);
      expect(rec).not.toBeNull();
      expect(rec?.items.length).toBeGreaterThan(0);
      expect(rec?.message).toContain("váy đầm hè dáng bay bổng");
    });

    it("gợi ý áo khi người dùng hỏi áo hè", () => {
      const rec = recommendProducts("tư vấn mình mấy mẫu áo hè mát mẻ", PRODUCTS);
      expect(rec).not.toBeNull();
      expect(rec?.items.length).toBeGreaterThan(0);
      expect(rec?.message).toContain("áo mùa hè nhẹ mát");
    });
  });

  describe("Xử lý tin nhắn tổng hợp (getAiChatbotResponse)", () => {
    it("chào hỏi khách hàng thân thiện khi chào hi/hello", async () => {
      const res = await getAiChatbotResponse(
        "Xin chào shop",
        [],
        PRODUCTS,
        DEFAULT_CHATBOT_CONFIG
      );
      expect(res.text).toContain("LiseaMade xin chào quý khách");
    });

    it("trả lời size kèm giải thích chuẩn", async () => {
      const res = await getAiChatbotResponse(
        "1m58 48kg mặc size gì",
        [],
        PRODUCTS,
        DEFAULT_CHATBOT_CONFIG
      );
      expect(res.text).toContain("Size phù hợp nhất: S hoặc M");
    });

    it("fallback thân thiện kèm gợi ý sản phẩm khi câu hỏi mở", async () => {
      const res = await getAiChatbotResponse(
        "hôm nay trời đẹp quá",
        [],
        PRODUCTS,
        DEFAULT_CHATBOT_CONFIG
      );
      expect(res.text).toContain("LiseaMade");
      expect(res.recommendedProducts?.length).toBeGreaterThan(0);
    });
  });
});
