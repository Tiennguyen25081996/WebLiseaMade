import { Link } from "react-router-dom";
import { SITE } from "@/data/site";

/**
 * Giới thiệu theo Figma 62:419: eyebrow + H1 + quote + body kênh + ảnh.
 * Chỉ dùng thông tin đã kiểm chứng (không bịa địa chỉ/chính sách).
 */
export default function AboutPage() {
  return (
    <div className="container-page pb-10">
      <p className="eyebrow-label text-lagoon-600">Câu chuyện thương hiệu</p>
      <h1 className="mt-2 font-display text-display-lg text-ink-900">
        Giới thiệu {SITE.brand}
      </h1>

      <div className="mt-6 grid items-start gap-8 md:grid-cols-2">
        <div>
          <blockquote className="font-display text-display-sm text-lagoon-600 italic">
            “Mỗi đường may đều hướng về biển — nhẹ, mát, tự do.”
          </blockquote>
          <div className="mt-4 flex flex-col gap-2 text-sm leading-relaxed text-ink-700">
            <p>{SITE.tagline}.</p>
            <p>
              Thương hiệu {SITE.brandLong} — {SITE.tiktokHandle} trên TikTok,{" "}
              {SITE.instagramHandle} trên Instagram.
            </p>
            <p>Vui lòng gọi hotline {SITE.hotlineDisplay} để đặt hàng thêm sản phẩm.</p>
          </div>
          <p className="mt-5 text-sm text-ink-500">
            Shop chưa công bố địa chỉ, mã số thuế, chính sách đổi trả riêng hay cam
            kết giao hàng — web không tự bịa các thông tin này.
          </p>
          <Link
            to="/lien-he"
            className="underline-reveal mt-4 inline-block text-sm font-medium text-ink-900 hover:text-lagoon-700"
          >
            Liên hệ →
          </Link>
        </div>
        <div className="hover-zoom aspect-4/5 overflow-hidden rounded-hair">
          <img
            src="/shop-tiktok/story.jpg"
            alt={`Câu chuyện thương hiệu ${SITE.brand}`}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        </div>
      </div>
    </div>
  );
}
