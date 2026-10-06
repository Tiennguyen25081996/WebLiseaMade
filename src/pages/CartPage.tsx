import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/context/cart-context";
import { CartSummary } from "@/components/cart/CartSummary";
import { LineItemRow } from "@/components/cart/LineItemRow";
import { Button, ButtonLink } from "@/components/ui/Button";

/**
 * Trang Giỏ hàng: Hiển thị danh sách mặt hàng, tổng quan giỏ hàng và lối vào thanh toán.
 * Thiết kế theo phong cách "Editorial Hawaii" với sự chú trọng vào khoảng cách và Typography.
 */
export default function CartPage() {
  const navigate = useNavigate();
  const {
    lines,
    itemCount,
    totals,
    droppedLineIds,
    dismissDroppedNotice,
    clear,
  } = useCart();

  const [isConfirmDelete, setIsConfirmDelete] = useState(false);

  const handleFinalClear = () => {
    clear();
    navigate("/san-pham");
  };

  return (
    <div className="container-page pb-24 relative">
      {/* Modal Xác nhận Xóa */}
      {isConfirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="max-w-sm rounded-hair border-[0.5px] bg-white p-8 shadow-xl animate-reveal-up">
            <h2 className="mb-4 text-xl font-bold text-ink-900">Xác nhận xóa?</h2>
            <p className="mb-8 text-sm text-ink-600">
              Bạn có chắc chắn muốn xóa toàn bộ sản phẩm trong giỏ hàng? Hành động này không thể hoàn tác.
            </p>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setIsConfirmDelete(false)}
              >
                Hủy bỏ
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={handleFinalClear}
              >
                Xác nhận xóa
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-4 flex-wrap mb-16">
        <h1 className="font-display text-display-lg text-ink-900 tracking-widest">Giỏ hàng</h1>
        <p className="text-sm text-ink-500">
          {lines.length} mặt hàng · {itemCount} sản phẩm
        </p>
      </div>

      {droppedLineIds.length > 0 && (
        <div
          role="status"
          aria-live="polite"
          className="rounded-hair bg-coral-50 p-5 border-[0.5px] border-coral-300 animate-reveal-up mb-8"
        >
          <p className="text-sm font-semibold text-coral-800">
            {droppedLineIds.length} mặt hàng trong giỏ hàng không tìm thấy trong danh mục
            (Sản phẩm mới hoặc biến thể mới). Giỏ hàng đã loại bỏ chúng.
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 border-[0.5px] border-coral-300 hover:bg-coral-100"
            aria-label="Ẩn thông báo sản phẩm không tìm thấy"
            onClick={dismissDroppedNotice}
          >
            Ẩn thông báo
          </Button>
        </div>
      )}

      {lines.length === 0 ? (
        <div className="rounded-hair bg-lagoon-50/50 p-16 border-[0.5px] border-lagoon-300 animate-reveal-up text-center">
          <p className="text-lg font-semibold text-lagoon-800 mb-8">Giỏ hàng của bạn đang trống — chưa có sản phẩm nào.</p>
          <ButtonLink
            to="/san-pham"
            variant="secondary"
            size="md"
            className="mt-2"
          >
            Xem sản phẩm
          </ButtonLink>
        </div>
      ) : (
        <>
          <ul className="mt-5 flex flex-col gap-4">
            {lines.map((line) => (
              <LineItemRow
                key={`${line.productId}::${line.variantId}`}
                line={line}
              />
            ))}
          </ul>

          <div className="mt-16">
            <CartSummary totals={totals} itemCount={itemCount} />
          </div>

          <div className="mt-24 flex items-center justify-center gap-8">
            <ButtonLink
              to="/thanh-toan"
              variant="primary"
              size="lg"
              className="px-12 h-14 text-lg rounded-hair bg-ink-900 text-white hover:bg-ink-800 active:scale-[0.98] transition-all duration-500 ease-out flex items-center justify-center"
              aria-label="Tiến hành thanh toán"
            >
              Tiến hành thanh toán
            </ButtonLink>
            <Button
              variant="ghost"
              size="lg"
              className="px-12 h-14 text-lg rounded-hair border-[0.5px] border-sand-300 hover:border-ink-900/40 transition-all duration-500 ease-out flex items-center justify-center"
              aria-label="Xóa giỏ hàng"
              onClick={() => setIsConfirmDelete(true)}
            >
              Xóa giỏ hàng
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
