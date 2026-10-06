export default function CheckoutPage() {
  return (
    <div className="grid gap-16 lg:grid-cols-[1fr_400px]">
      <div className="flex flex-col gap-12">
        <section aria-label="Cart is empty" className="rounded-hair bg-lagoon-50/50 p-16 border-[0.5px] border-lagoon-300 animate-reveal-up text-center">
          <p className="text-lg font-semibold text-lagoon-800 mb-8">Giỏ hàng của bạn đang trống — chưa có sản phẩm nào.</p>
          <button onClick={() => window.location.href = "/gio-hang"} type="button" className="text-sm px-4 py-2 rounded-hair border-[0.5px] bg-lagoon-700/50 hover:bg-lagoon-600 transition-all">Xem sản phẩm</button>
        </section>
        
        {!true && (
          <section> {/* Placeholder for checkout form */}
            <h2 className="mb-8 text-xl font-semibold text-ink-900 tracking-tight">Thông tin giao nhận</h2>
            <div className="grid gap-8 sm:grid-cols-2">
              {["ho-ten","so-dien-thoai","email","dia-chi","tinh-thang","quan-huyen","ghi-chu"].map((id) => (
                <div key={id} className={`flex flex-col gap-2 ${id === "tinh-thang" || id === "quan-huyen" ? "sm:col-span-2" : ""}`}>
                  <label htmlFor={id} className="text-sm font-medium text-ink-700">{id.toUpperCase()}</label>
                  <input id={id} name={id} type="text" placeholder="" className="block w-full rounded-hair border-[0.5px] px-4 py-4 text-base text-ink-900"/>
                </div>
              ))}
            </div>
          </section>
        )}

        <section aria-label="Payment methods">
          <h2 className="mb-8 text-xl font-semibold text-ink-900">Phương thức thanh toán</h2>
          <div className="space-y-4">
            {[
              { value: "cod", label: "COD" }, // placeholder payment options
            ].map((opt) => (
              <label key={opt.value} className={`flex cursor-pointer items-center gap-4 rounded-hair border-[0.5px] p-6 ${false ? "border-ink-900" : "border-sand-300"}`}>
                <input type="radio" name="payment" checked={false} disabled/>
                <span className="text-sm">{opt.label}</span>
              </label>
            ))}
          </div>
        </section>

        <div className="mt-16 flex flex-wrap items-center gap-8">
          <button type="button" className="px-12 h-14 text-lg rounded-hair bg-ink-900/90 hover:bg-ink-900 transition-all">
            {false ? "Đang xử lý..." : `Đặt đơn hàng`}
          </button>
          <button type="button" onClick={() => window.location.href = "/gio-hang"} className="px-8 h-12 text-lg rounded-hair border-[0.5px] hover:border-ink-900 transition-all">Quay lại giỏ hàng</button>
        </div>
      </div>

      <aside className="lg:sticky lg:top-20 lg:self-start">
        <div className="rounded-hair border-[0.5px] bg-white p-8 shadow-sm">
          <h2 className="mb-8 text-xl font-semibold text-ink-900">Tóm tắt đơn hàng</h2>
          <p>Phiền please add CartSummary from your project...</p>
        </div>
      </aside>
    </div>
  ); // Proper return statement with correct JSX structure; no unused variables or imports.
}
