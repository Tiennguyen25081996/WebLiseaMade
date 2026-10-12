import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AboutPage from "./AboutPage";
import { saveAdminHomePageSettings, resetAdminHomePageSettings } from "@/lib/admin-store";

describe("AboutPage synchronization with Home settings", () => {
  beforeEach(() => {
    localStorage.clear();
    resetAdminHomePageSettings();
  });

  it("render trang giới thiệu đồng bộ với hình ảnh câu chuyện thương hiệu mặc định của trang chủ", () => {
    render(
      <MemoryRouter>
        <AboutPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/Giới thiệu LiseaMade/i)).toBeInTheDocument();
    expect(screen.getByText(/Mỗi đường may đều hướng về biển/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Khám phá bộ sưu tập →/i })).toBeInTheDocument();

    const storyImg = screen.getByAltText(/Câu chuyện thương hiệu LiseaMade/i) as HTMLImageElement;
    expect(storyImg).toBeInTheDocument();
    expect(storyImg.src).toContain("/figma-images/brand-story.png");
  });

  it("tự động cập nhật hình ảnh màn giới thiệu khi admin đổi ảnh câu chuyện thương hiệu trang chủ", () => {
    saveAdminHomePageSettings({
      heroEyebrow: "Mùa hè",
      heroTitle: "LiseaMade",
      heroDescription: "Mô tả",
      heroCtaText: "Xem ngay",
      heroCtaLink: "/san-pham",
      heroImage: "/figma-images/hero.png",
      featuredEyebrow: "Nổi bật",
      featuredTitle: "Sản phẩm",
      featuredCtaText: "Tất cả",
      lifestyleEyebrow: "Phong cách hè",
      lifestyleTitle: "Sống rực rỡ",
      lifestyleDescription: "Bộ sưu tập mới.",
      lifestyleItems: [
        { id: "life-1", src: "/images/custom-lifestyle.png", caption: "Biển xanh nắng vàng" },
      ],
      lookbookEyebrow: "Lookbook",
      lookbookTitle: "Bộ ảnh",
      lookbookItems: [],
      brandStoryEyebrow: "Triết lý thương hiệu",
      brandStoryTitle: "Khởi nguồn Lisea",
      brandStoryQuote: "“Tự do là phong cách đẹp nhất.”",
      brandStoryCtaText: "Xem thêm",
      brandStoryCtaLink: "/gioi-thieu",
      brandStoryImage: "/cloudflare-images/new-story-photo.webp",
      brandStoryContact: "Hotline 0987 654 321",
      tiktokEyebrow: "TikTok",
      tiktokFollowersText: "50K",
      tiktokLikesText: "500K",
      tiktokCtaText: "Follow",
      tiktokUrl: "https://tiktok.com",
    });

    render(
      <MemoryRouter>
        <AboutPage />
      </MemoryRouter>
    );

    expect(screen.getByText("Triết lý thương hiệu")).toBeInTheDocument();
    expect(screen.getByText("“Tự do là phong cách đẹp nhất.”")).toBeInTheDocument();
    expect(screen.getByText("Biển xanh nắng vàng")).toBeInTheDocument();

    const storyImg = screen.getByAltText(/Câu chuyện thương hiệu LiseaMade/i) as HTMLImageElement;
    expect(storyImg.src).toContain("/cloudflare-images/new-story-photo.webp");
  });
});
