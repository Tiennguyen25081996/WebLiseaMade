import type { Product, Category, PlacedOrder } from "@/types";
import type { DiscountEvent } from "@/lib/admin-store";
import { ORDER_STATUS_LABELS } from "@/lib/orders";
import { formatVnd } from "@/lib/format";
import {
  PackageIcon,
  SparkleIcon,
  UploadIcon,
  ClipboardListIcon,
} from "@/components/ui/icons";

interface AdminOverviewTabProps {
  products: Product[];
  categories: Category[];
  discounts: DiscountEvent[];
  orders: PlacedOrder[];
  onNavigateTab: (tab: "products" | "categories" | "discounts" | "media" | "orders") => void;
  onOpenNewProduct: () => void;
  onOpenNewDiscount: () => void;
}

export function AdminOverviewTab({
  products,
  categories,
  discounts,
  orders,
  onNavigateTab,
  onOpenNewProduct,
  onOpenNewDiscount,
}: AdminOverviewTabProps) {
  const activeDiscountsCount = discounts.filter((d) => d.isActive).length;
  const inStockProductsCount = products.filter((p) =>
    p.variants.some((v) => v.inStock)
  ).length;
  const totalRevenue = orders.reduce((sum, o) => sum + (o.totals?.total ?? 0), 0);

  return (
    <div className="mt-6 space-y-8 animate-fade-in">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-hair border border-sand-300 bg-sand-100 p-5">
          <div className="flex items-center justify-between text-ink-500 text-xs">
            <span>Tổng sản phẩm</span>
            <PackageIcon className="h-4 w-4 text-lagoon-600" />
          </div>
          <div className="mt-2 text-3xl font-display text-ink-900">{products.length}</div>
          <div className="mt-1 text-2xs text-ink-500">
            {inStockProductsCount} sản phẩm đang mở bán
          </div>
        </div>

        <div className="rounded-hair border border-sand-300 bg-sand-100 p-5">
          <div className="flex items-center justify-between text-ink-500 text-xs">
            <span>Phân loại nhóm hàng</span>
            <span className="text-lagoon-700 text-xs font-bold font-sans">#</span>
          </div>
          <div className="mt-2 text-3xl font-display text-ink-900">{categories.length}</div>
          <div className="mt-1 text-2xs text-ink-500">Danh mục hiển thị trên storefront</div>
        </div>

        <div className="rounded-hair border border-sand-300 bg-sand-100 p-5">
          <div className="flex items-center justify-between text-ink-500 text-xs">
            <span>Khuyến mãi kích hoạt</span>
            <SparkleIcon className="h-4 w-4 text-coral-600" />
          </div>
          <div className="mt-2 text-3xl font-display text-ink-900">
            {activeDiscountsCount} / {discounts.length}
          </div>
          <div className="mt-1 text-2xs text-ink-500">Mã voucher đang áp dụng</div>
        </div>

        <div className="rounded-hair border border-sand-300 bg-sand-100 p-5">
          <div className="flex items-center justify-between text-ink-500 text-xs">
            <span>Đơn hàng & Doanh thu</span>
            <ClipboardListIcon className="h-4 w-4 text-lagoon-700" />
          </div>
          <div className="mt-2 text-2xl font-display text-ink-900">
            {formatVnd(totalRevenue)}
          </div>
          <div className="mt-1 text-2xs text-ink-500">{orders.length} đơn hàng được ghi nhận</div>
        </div>
      </div>

      {/* Quick Action Cards */}
      <div>
        <h2 className="font-display text-base text-ink-900 mb-3">Thao tác nhanh theo chuyên mục</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => {
              onNavigateTab("products");
              onOpenNewProduct();
            }}
            className="tap-feedback flex items-center justify-between rounded-hair border border-sand-300 bg-sand-50 p-4 text-left hover:border-ink-900 transition-colors"
          >
            <div>
              <div className="font-medium text-xs text-ink-900">+ Thêm sản phẩm mới</div>
              <div className="text-2xs text-ink-500 mt-0.5">Tạo mới áo, đầm, phụ kiện có giá và ảnh</div>
            </div>
            <PackageIcon className="h-4 w-4 text-ink-400" />
          </button>

          <button
            type="button"
            onClick={() => {
              onNavigateTab("discounts");
              onOpenNewDiscount();
            }}
            className="tap-feedback flex items-center justify-between rounded-hair border border-sand-300 bg-sand-50 p-4 text-left hover:border-ink-900 transition-colors"
          >
            <div>
              <div className="font-medium text-xs text-ink-900">+ Tạo mã giảm giá</div>
              <div className="text-2xs text-ink-500 mt-0.5">Thiết lập voucher phần trăm hoặc số tiền</div>
            </div>
            <SparkleIcon className="h-4 w-4 text-coral-600" />
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab("media")}
            className="tap-feedback flex items-center justify-between rounded-hair border border-sand-300 bg-sand-50 p-4 text-left hover:border-ink-900 transition-colors"
          >
            <div>
              <div className="font-medium text-xs text-ink-900">Tải ảnh Cloudflare</div>
              <div className="text-2xs text-ink-500 mt-0.5">Đồng bộ kho lưu trữ ảnh Media Hub</div>
            </div>
            <UploadIcon className="h-4 w-4 text-lagoon-600" />
          </button>
        </div>
      </div>

      {/* Recent Orders Overview */}
      <div className="rounded-hair border border-sand-300 bg-sand-50 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display text-base text-ink-900">Đơn hàng mới nhất</h2>
            <p className="text-2xs text-ink-500">Xem nhanh các đơn hàng gần đây từ khách mua trên web</p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab("orders")}
            className="text-xs font-medium text-lagoon-700 hover:text-lagoon-900 underline-reveal"
          >
            Xem toàn bộ đơn ({orders.length}) →
          </button>
        </div>

        {orders.length === 0 ? (
          <div className="py-8 text-center text-xs text-ink-500">
            Chưa có đơn hàng nào phát sinh trên hệ thống.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-sand-200 text-ink-500 text-2xs uppercase">
                <tr>
                  <th className="py-2.5 font-medium">Mã đơn</th>
                  <th className="py-2.5 font-medium">Khách hàng</th>
                  <th className="py-2.5 font-medium">Thời gian</th>
                  <th className="py-2.5 font-medium">Tổng tiền</th>
                  <th className="py-2.5 font-medium">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-200">
                {orders.slice(0, 5).map((o) => {
                  const st = o.status ?? "pending";
                  const meta = ORDER_STATUS_LABELS[st] ?? ORDER_STATUS_LABELS.pending;
                  return (
                    <tr key={o.code} className="hover:bg-sand-100/60 transition-colors">
                      <td className="py-3 font-mono font-bold text-ink-900">{o.code}</td>
                      <td className="py-3">
                        <div className="font-medium text-ink-900">{o.info.fullName}</div>
                        <div className="text-2xs text-ink-500">{o.info.phone}</div>
                      </td>
                      <td className="py-3 text-ink-600">
                        {new Date(o.createdAt).toLocaleString("vi-VN", {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="py-3 font-medium text-ink-900">{formatVnd(o.totals.total)}</td>
                      <td className="py-3">
                        <span className={`inline-block rounded-full border px-2 py-0.5 text-2xs font-medium ${meta.color}`}>
                          {meta.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
