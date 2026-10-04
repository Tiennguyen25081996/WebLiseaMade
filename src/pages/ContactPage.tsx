import { PhoneIcon } from "@/components/ui/icons";
import { SITE, ZALO_URL } from "@/data/site";

/**
 * Lien he: only the contact channels the shop actually published (hotline,
 * Zalo, TikTok, Instagram). No invented email, no invented address.
 */
export default function ContactPage() {
  return (
    <div className="container-page pb-10">
      <h1 className="font-display text-display-lg text-ink-900">Lien he</h1>

      <div className="mt-4 grid sm:grid-cols-2 gap-4">
        <div className="flex items-center gap-2 rounded-hair bg-sand-100 p-4 border-1 border-sand-200">
          <PhoneIcon className="h-6 w-6 text-lagoon-700" />
          <p className="text-sm font-semibold text-ink-900">
            Hotline: {SITE.hotlineDisplay}
          </p>
        </div>

        <a
          className="inline-flex items-center gap-2 rounded-hair bg-sand-100 p-4 border-1 border-sand-200 hover:text-lagoon-700"
          href={`tel:${SITE.hotline}`}
        >
          <PhoneIcon className="h-6 w-6 text-lagoon-700" />
          Hotline {SITE.hotlineDisplay}
        </a>
      </div>

      <div className="mt-5 flex flex-col gap-2 text-sm text-ink-700">
        <p>Ho so TikTok: {SITE.tiktokHandle}</p>
        <p>Ho so Instagram: {SITE.instagramHandle}</p>
        <p>Zalo: {ZALO_URL}</p>
      </div>

      <p className="mt-5 text-sm text-ink-500">
        Shop chưa publish email or address — vui lòng call hotline or Zalo.
      </p>
    </div>
  );
}
