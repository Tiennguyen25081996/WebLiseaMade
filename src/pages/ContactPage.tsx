import { PhoneIcon } from "@/components/ui/icons";
import { SITE, ZALO_URL } from "@/data/site";

/**
 * Liên hệ theo Figma 62:425: H1 + kênh thật + giờ hỗ trợ.
 * Không bịa email/địa chỉ — chỉ kênh shop đã công bố.
 */
export default function ContactPage() {
  return (
    <div className="container-page pb-10">
      <h1 className="font-display text-display-lg text-ink-900">Liên hệ</h1>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <a
          className="inline-flex items-center gap-2 rounded-hair border-1 border-sand-200 bg-sand-100 p-4 hover:text-lagoon-700"
          href={`tel:${SITE.hotline}`}
        >
          <PhoneIcon className="h-6 w-6 text-lagoon-700" aria-hidden="true" />
          <span className="text-sm font-semibold text-ink-900">
            Hotline: {SITE.hotlineDisplay}
          </span>
        </a>

        <a
          className="inline-flex items-center gap-2 rounded-hair border-1 border-sand-200 bg-sand-100 p-4 hover:text-lagoon-700"
          href={ZALO_URL}
          target="_blank"
          rel="noreferrer noopener"
        >
          <span className="text-sm font-semibold text-ink-900">
            Zalo qua hotline {SITE.hotlineDisplay}
          </span>
        </a>
      </div>

      <div className="mt-5 flex flex-col gap-2 text-sm text-ink-700">
        <p>
          Hồ sơ TikTok:{" "}
          <a
            href={SITE.tiktokUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="underline-reveal hover:text-lagoon-700"
          >
            {SITE.tiktokHandle}
          </a>
        </p>
        <p>
          Hồ sơ Instagram:{" "}
          <a
            href={SITE.instagramUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="underline-reveal hover:text-lagoon-700"
          >
            {SITE.instagramHandle}
          </a>
        </p>
      </div>

      <p className="mt-5 text-sm text-ink-500">
        Giờ hỗ trợ 9:00–21:00 · Đổi trả 7 ngày · Ship toàn quốc.
      </p>
    </div>
  );
}
