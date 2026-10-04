import { ButtonLink } from "@/components/ui/Button";

/**
 * 404: state rỗng riang — tell the user the page is gone and give exits.
 */
export default function NotFoundPage() {
  return (
    <div className="container-page pb-10">
      <h1 className="font-display text-display-lg text-ink-900">Trang khong tim</h1>
      <p className="mt-2 text-sm text-ink-500">
        Dong bi khong tim.
      </p>

      <div className="mt-5 flex flex-wrap gap-3">
        <ButtonLink to="/" variant="secondary" size="sm">
          Trang chu
        </ButtonLink>
        <ButtonLink to="/san-pham" variant="secondary" size="sm">
          Sem san phem
        </ButtonLink>
        <ButtonLink to="/lien-he" variant="secondary" size="sm">
          Lien he
        </ButtonLink>
      </div>
    </div>
  );
}
