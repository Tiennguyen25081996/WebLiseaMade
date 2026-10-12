import { Button } from "@/components/ui/Button";

interface ConfirmDeleteModalProps {
  target: {
    type: "product" | "category" | "discount";
    id: string;
    title: string;
  } | null;
  onClose: () => void;
  onConfirm: () => void;
}

export function ConfirmDeleteModal({
  target,
  onClose,
  onConfirm,
}: ConfirmDeleteModalProps) {
  if (!target) return null;

  const typeName =
    target.type === "product"
      ? "sản phẩm"
      : target.type === "category"
        ? "loại sản phẩm"
        : "sự kiện giảm giá";

  return (
    <div
      className="fixed inset-0 z-80 flex items-center justify-center bg-ink-900/60 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-hair bg-sand-50 p-6 shadow-2xl border border-sand-300 animate-reveal-up"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-display text-base text-ink-900">Xác nhận xóa?</h3>
        <p className="mt-2 text-xs text-ink-600">
          Bạn có chắc chắn muốn xóa {typeName}{" "}
          <strong className="text-ink-900 font-semibold">{target.title}</strong>? Thao tác này không thể hoàn tác.
        </p>

        <div className="mt-6 flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            Hủy
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={onConfirm}
          >
            Xóa ngay
          </Button>
        </div>
      </div>
    </div>
  );
}
