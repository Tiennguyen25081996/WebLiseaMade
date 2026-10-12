import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import HomePage from "./HomePage";
import { saveAdminHomePageSettings, resetAdminHomePageSettings } from "@/lib/admin-store";

describe("HomePage dynamic settings", () => {
  beforeEach(() => {
    localStorage.clear();
    resetAdminHomePageSettings();
  });

  it("render trang chủ với cài đặt mặc định", () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    expect(screen.getByText("LiseaMade")).toBeInTheDocument();
    expect(screen.getByText("Thời trang & phụ kiện Hawaii Summer")).toBeInTheDocument();
  });

  it("tự động cập nhật nội dung khi admin thay đổi cài đặt trang chủ", () => {
    saveAdminHomePageSettings({
      heroEyebrow: "Mùa hè nhiệt đới 2026",
      heroTitle: "LiseaMade Summer Vibe",
      heroDescription: "Váy hoa voan và linen siêu mát.",
      heroCtaText: "Xem ngay BST mới →",
      heroCtaLink: "/san-pham",
      heroImage: "/figma-images/hero.png",
      featuredEyebrow: "Hot Picks",
      featuredTitle: "Được yêu thích nhất",
      featuredCtaText: "Khám phá tất cả →",
      lifestyleEyebrow: "Phong cách",
      lifestyleTitle: "Sống trọn mùa hè",
      lifestyleDescription: "Thời trang nhẹ nhàng.",
      lifestyleItems: [
        { id: "1", src: "/test.jpg", caption: "Test Caption" },
      ],
      lookbookEyebrow: "Lookbook",
      lookbookTitle: "Bộ ảnh mới",
      lookbookItems: [],
      brandStoryEyebrow: "Sứ mệnh",
      brandStoryTitle: "Câu chuyện Lisea",
      brandStoryQuote: "Đường may tỉ mỉ",
      brandStoryCtaText: "Tìm hiểu thêm",
      brandStoryCtaLink: "/gioi-thieu",
      brandStoryImage: "/story.png",
      brandStoryContact: "Hotline 0900",
      tiktokEyebrow: "Kênh TikTok",
      tiktokFollowersText: "100K followers",
      tiktokLikesText: "1M likes",
      tiktokCtaText: "Follow ngay",
      tiktokUrl: "https://tiktok.com",
    });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    expect(screen.getByText("LiseaMade Summer Vibe")).toBeInTheDocument();
    expect(screen.getByText("Mùa hè nhiệt đới 2026")).toBeInTheDocument();
    expect(screen.getByText("Váy hoa voan và linen siêu mát.")).toBeInTheDocument();
    expect(screen.getByText("Xem ngay BST mới →")).toBeInTheDocument();
  });
});
