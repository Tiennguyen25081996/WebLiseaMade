/**
 * Thông tin thương hiệu LiseaMade — CHỈ chứa dữ liệu có thật, lấy từ
 * hồ sơ TikTok https://www.tiktok.com/@liseahawaiisummer (đã kiểm chứng).
 * Không thêm số liệu, cam kết hay chính sách chưa được xác nhận.
 */

export const SITE = {
  brand: "LiseaMade",
  /** Tên hiển thị đầy đủ trên hồ sơ TikTok. */
  brandLong: "Liseahawaii.Made",
  tagline: "Thời trang & phụ kiện phong cách Hawaii Summer",
  tiktokHandle: "@liseahawaiisummer",
  tiktokUrl: "https://www.tiktok.com/@liseahawaiisummer",
  instagramHandle: "Liseahawaii.Made",
  instagramUrl: "https://www.instagram.com/Liseahawaii.Made/",
  /** Hotline/Zalo in trong bio TikTok: "☎️:0385.8989.52" */
  hotline: "0385.8989.52",
  hotlineDisplay: "0385.8989.52",
  /** Số liệu công khai trên hồ sơ tại thời điểm dựng web. */
  stats: {
    followers: 5874,
    likes: 187800,
    videos: 191,
  },
} as const;

/** Zalo deep link hoạt động trên cả desktop lẫn mobile. */
export const ZALO_URL = "https://zalo.me/0385898952";

export type SiteInfo = typeof SITE;
