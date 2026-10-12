import { Link } from "react-router-dom";
import { SITE } from "@/data/site";
import { useAdminStore } from "@/lib/admin-store";
import { ProductImage } from "@/components/product/ProductImage";

/**
 * Giới thiệu theo Figma 62:419: eyebrow + H1 + quote + body kênh + ảnh.
 * Đồng bộ hình ảnh và câu chuyện thương hiệu thời gian thực từ Home Settings.
 */
export default function AboutPage() {
  const { homeSettings } = useAdminStore();
  const storyImage = homeSettings.brandStoryImage || "/figma-images/brand-story.png";
  const storyQuote = homeSettings.brandStoryQuote || "“Mỗi đường may đều hướng về biển — nhẹ, mát, tự do.”";
  const lifestyle = homeSettings.lifestyleItems || [];

  return (
    <div className="container-page py-16 lg:py-24">
      {/* Brand Manifesto / Intro */}
      <div className="mb-14 max-w-4xl">
        <p className="eyebrow-label text-lagoon-600 font-medium">
          {homeSettings.brandStoryEyebrow || "Câu chuyện thương hiệu"}
        </p>
        <h1 className="mt-3 font-display text-display-lg text-ink-900">
          Giới thiệu {SITE.brand}
        </h1>
      </div>

      {/* Hero / Editorial Section */}
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="flex flex-col gap-6">
          <blockquote className="font-display text-2xl md:text-3xl text-lagoon-700 italic leading-snug">
            {storyQuote}
          </blockquote>
          
          <div className="space-y-5 text-base leading-relaxed text-ink-700 md:max-w-md">
            <p className="text-xl font-medium text-ink-900">
              {SITE.tagline}
            </p>
            <p>
              Thương hiệu {SITE.brandLong} — một hành trình kiếm tìm sự cân bằng giữa
              nhịp sống hiện đại và tinh thần tự do của đại dương. Chúng tôi tin rằng
              trang phục không chỉ là lớp vỏ, mà là ngôn ngữ của cảm xúc.
            </p>
            <p className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
              <span><strong className="text-ink-900 font-medium">TikTok:</strong> {SITE.tiktokHandle}</span>
              <span><strong className="text-ink-900 font-medium">Instagram:</strong> {SITE.instagramHandle}</span>
            </p>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <Link
              to="/san-pham"
              className="inline-flex items-center gap-2 rounded-hair bg-ink-900 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-sand-50 transition-colors hover:bg-lagoon-800"
            >
              Khám phá bộ sưu tập →
            </Link>
            <Link
              to="/lien-he"
              className="inline-block underline-reveal text-sm font-semibold text-ink-900 hover:text-lagoon-700"
            >
              Liên hệ với chúng tôi
            </Link>
          </div>
        </div>

        {/* Cinematic Brand Image đồng bộ trực tiếp với màn Home */}
        <div className="hover-zoom animate-image-enter relative aspect-[4/5] overflow-hidden rounded-hair shadow-md lg:max-w-[500px]">
          <ProductImage
            src={storyImage}
            alt={`Câu chuyện thương hiệu ${SITE.brand}`}
            seed="story"
            priority
            showPlaceholderNote={false}
            className="h-full w-full"
          />
        </div>
      </div>

      {/* Bộ sưu tập cảm hứng Hawaii (Đồng bộ từ Lifestyle của Home Settings) */}
      {lifestyle.length > 0 && (
        <section className="mt-24 border-t border-sand-200 pt-16">
          <div className="max-w-2xl">
            <p className="eyebrow-label text-lagoon-600">
              {homeSettings.lifestyleEyebrow || "Cảm hứng thiết kế"}
            </p>
            <h2 className="mt-2 font-display text-display-md text-ink-900">
              {homeSettings.lifestyleTitle || "Phong cách sống đại dương"}
            </h2>
            <p className="mt-2 text-sm text-ink-700">
              {homeSettings.lifestyleDescription || "Từng khung hình lưu giữ hơi thở mùa hè và vẻ đẹp tự do."}
            </p>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {lifestyle.map((item, idx) => (
              <figure key={item.id || item.src || idx} className="hover-zoom rounded-hair overflow-hidden">
                <ProductImage
                  src={item.src}
                  alt={item.caption}
                  seed={item.src}
                  showPlaceholderNote={false}
                  className="aspect-3/4 w-full"
                />
                <figcaption className="bg-sand-100 px-3 py-2 text-xs font-medium text-ink-800">
                  {item.caption}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* Subtle Meta Info / Disclosure */}
      <div className="mt-20 border-t border-sand-200 pt-8 pb-12">
        <p className="max-w-2xl text-xs text-ink-400 leading-relaxed opacity-80">
          <span className="font-bold text-ink-600 uppercase tracking-wider">Thông tin bổ sung:</span>{" "}
          Shop chưa công bố địa chỉ vật lý, mã số thuế, chính sách đổi trả riêng biệt hay cam kết giao hàng. 
          Web không thể hiện các thông tin giả định. Vui lòng liên hệ hotline {SITE.hotlineDisplay} 
          để được tư vấn trực tiếp từ đội ngũ hỗ trợ.
        </p>
      </div>
    </div>
  );
}
