import { Link } from "react-router-dom";
import { SITE } from "@/data/site";

/**
 * Giới thiệu theo Figma 62:419: eyebrow + H1 + quote + body kênh + ảnh.
 * Chỉ dùng thông tin đã kiểm chứng (không bịa địa chỉ/chính sách).
 */
export default function AboutPage() {
  return (
    <div className="container-page py-24 lg:py-32">
      {/* Brand Manifesto / Intro */}
      <div className="mb-20 max-w-4xl">
        <p className="eyebrow-label text-lagoon-600 font-medium">Câu chuyện thương hiệu</p>
        <h1 className="mt-4 font-display text-display-lg text-ink-900">
          Giới thiệu {SITE.brand}
        </h1>
      </div>

      {/* Hero / Editorial Section */}
      <div className="grid items-center gap-16 lg:grid-cols-2">
        <div className="flex flex-col gap-8">
          <blockquote className="font-display text-2xl md:text-3xl text-lagoon-700 italic leading-snug">
            “Mỗi đường may đều hướng về biển — nhẹ, mát, tự do.”
          </blockquote>
          
          <div className="space-y-6 text-base leading-relaxed text-ink-700 md:max-w-md">
            <p className="text-xl font-medium text-ink-900">
              {SITE.tagline}
            </p>
            <p>
              Thương hiệu {SITE.brandLong} — một hành trình kiếm tìm sự cân bằng giữa
              nhịp sống hiện đại và tinh thần tự do của đại dương. Chúng tôi tin rằng
              trang phục không chỉ là lớp vỏ, mà là ngôn ngữ của cảm xúc.
            </p>
            <p className="flex flex-wrap gap-x-4 gap-y-2">
              <span className="text-ink-900 font-medium">TikTok:</span> {SITE.tiktokHandle}
              <span className="text-ink-900 font-medium">Instagram:</span> {SITE.instagramHandle}
            </p>
          </div>

          <div className="mt-10">
            <Link
              to="/lien-he"
              className="inline-block underline-reveal text-sm font-semibold text-ink-900 hover:text-lagoon-700"
            >
              Kết nối với chúng tôi &rarr;
            </Link>
          </div>
        </div>

        {/* Cinematic Image */}
        <div className="relative aspect-[4/5] overflow-hidden rounded-hair shadow-md lg:max-w-[500px]">
          <img
            src="/shop-tiktok/story.jpg"
            alt={`Câu chuyện thương hiệu ${SITE.brand}`}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
          />
        </div>
      </div>

      {/* Subtle Meta Info / Disclosure */}
      <div className="mt-32 border-t border-sand-200 pt-10 pb-20">
        <p className="max-w-2xl text-xs text-ink-400 leading-relaxed opacity-80">
          <span className="font-bold text-ink-600 uppercase tracking-wider">Thông tin bổ sung:</span>
          Shop chưa công bố địa chỉ vật lý, mã số thuế, chính sách đổi trả riêng biệt hay cam kết giao hàng. 
          Web không thể hiện các thông tin giả định. Vui lòng liên hệ hotline {SITE.hotlineDisplay} 
          để được tư vấn trực tiếp từ đội ngũ hỗ trợ.
        </p>
      </div>
    </div>
  );
}
