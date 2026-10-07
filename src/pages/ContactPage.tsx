import { PhoneIcon } from "@/components/ui/icons";
import { SITE, ZALO_URL } from "@/data/site";

/**
 * Liên hệ theo Figma 62:425: H1 + kênh thật + giờ hỗ trợ.
 * Không bịa email/địa chỉ — chỉ kênh shop đã công bố.
 */
export default function ContactPage() {
  return (
    <div className="container-page py-20 lg:py-32">
      {/* Page Header */}
      <header className="mb-16 max-w-4xl">
        <p className="eyebrow-label text-lagoon-600 font-medium">Cổng kết nối</p>
        <h1 className="mt-4 font-display text-display-lg text-ink-900">
          Kết nối với LiseaMade
        </h1>
      </header>

      {/* Main Contact Content */}
      <main className="grid gap-12 lg:grid-cols-2 items-start">
        {/* Primary Contact: Hotline & Zalo */}
        <section className="flex flex-col gap-8">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-ink-900">Liên hệ trực tiếp</h2>
            <p className="text-sm text-ink-500">Nhận tư vấn nhanh nhất qua hotline và Zalo.</p>
          </div>

          <div className="grid gap-4">
            <a
              className="flex items-center justify-between rounded-hair border-1 border-sand-300 bg-sand-100 p-6 transition-all hover:border-ink-900 hover:bg-sand-50"
              href={`tel:${SITE.hotline}`}
              aria-label={`Hotline hỗ trợ: ${SITE.hotlineDisplay}`}
            >
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-hair bg-white shadow-sm">
                  <PhoneIcon className="h-6 w-6 text-lagoon-700" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-xs text-ink-500">Hotline hỗ trợ</p>
                  <p className="text-lg font-bold text-ink-900">{SITE.hotlineDisplay}</p>
                </div>
              </div>
            </a>

            <a
              className="flex items-center justify-between rounded-hair border-1 border-sand-300 bg-sand-100 p-6 transition-all hover:border-ink-900 hover:bg-sand-50"
              href={ZALO_URL}
              target="_blank"
              rel="noreferrer noopener"
              aria-label="Kết nối Zalo chính thức"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-hair bg-white shadow-sm">
                  <span className="text-xl font-bold text-lagoon-700">Z</span>
                </div>
                <div>
                  <p className="text-xs text-ink-500">Zalo chính thức</p>
                  <p className="text-lg font-bold text-ink-900">Kết nối trực tuyến</p>
                </div>
              </div>
            </a>
          </div>
        </section>

        {/* Secondary Contact: Social Presence */}
        <section className="space-y-8">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-ink-900">Cộng đồng trực tuyến</h2>
            <p className="text-sm text-ink-500">Theo dõi hành trình của chúng tôi trên mạng xã hội.</p>
          </div>

          <div className="grid gap-4">
            <a
              href={SITE.tiktokUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="group flex items-center justify-between rounded-hair border-1 border-sand-300 bg-sand-100 p-6 transition-all hover:border-ink-900 hover:bg-sand-50"
            >
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-ink-700">TikTok:</span>
                <span className="text-base font-bold text-ink-900">{SITE.tiktokHandle}</span>
              </div>
              <span className="text-xs text-ink-400 group-hover:text-lagoon-700">Xem Profile &rarr;</span>
            </a>

            <a
              href={SITE.instagramUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="group flex items-center justify-between rounded-hair border-1 border-sand-300 bg-sand-100 p-6 transition-all hover:border-ink-900 hover:bg-sand-50"
            >
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-ink-700">Instagram:</span>
                <span className="text-base font-bold text-ink-900">{SITE.instagramHandle}</span>
              </div>
              <span className="text-xs text-ink-400 group-hover:text-lagoon-700">Xem Profile &rarr;</span>
            </a>
          </div>
        </section>
      </main>

      {/* Service Policy & Ethics */}
      <footer className="mt-20 pt-10 border-t border-sand-200">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-ink-700">
            <span className="font-semibold">Giờ làm việc:</span> 09:00 – 21:00 (Thứ 2 &ndash; Chủ Nhật)
          </p>
          <div className="flex gap-8">
            <p className="text-sm text-ink-700">
              <span className="font-semibold">Đổi trả:</span> Trong vòng 7 ngày
            </p>
            <p className="text-sm text-ink-700">
              <span className="font-semibold">Giao hàng:</span> Toàn quốc
            </p>
          </div>
        </div>
        <p className="mt-6 text-xs text-ink-400 leading-relaxed opacity-80 max-w-3xl">
          LiseaMade cam kết cung cấp sản phẩm chất lượng với sự minh bạch tối đa. 
          Mọi yêu cầu bảo hành và hỗ trợ kỹ thuật vui lòng liên hệ kênh chính thức của Shop để được phục vụ tốt nhất.
        </p>
      </footer>
    </div>
  );
}
