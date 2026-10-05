import { Button } from "@/components/ui/Button";

/**
 * 404 theo Figma 62:428: H1 + sub thân thiện + nút về trang chủ.
 */
export default function NotFoundPage() {
  return (
    <div className="container-page pb-10">
      <h1 className="font-display text-display-lg text-ink-900">Không tìm thấy trang</h1>
      <p className="mt-2 max-w-prose text-base text-ink-500">
        Trang bạn tìm không còn nữa — quay về trang chủ khám phá bộ sưu tập hè.
      </p>

      <div className="mt-5 flex flex-wrap gap-3">
        <Button to="/">Về trang chủ →</Button>
        <Button to="/san-pham" variant="secondary">
          Xem sản phẩm
        </Button>
        <Button to="/lien-he" variant="secondary">
          Liên hệ
        </Button>
      </div>
    </div>
  );
}
