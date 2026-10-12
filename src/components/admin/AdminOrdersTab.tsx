import { useState, useMemo } from "react";
import type { PlacedOrder, OrderStatus } from "@/types";
import { ORDER_STATUS_LABELS } from "@/lib/orders";
import { formatVnd } from "@/lib/format";
import { SearchIcon } from "@/components/ui/icons";

interface AdminOrdersTabProps {
  orders: PlacedOrder[];
  onUpdateStatus: (code: string, newStatus: OrderStatus) => void;
  onViewOrder: (order: PlacedOrder) => void;
}

export function AdminOrdersTab({
  orders,
  onUpdateStatus,
  onViewOrder,
}: AdminOrdersTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const q = searchQuery.toLowerCase();
      const matchQ =
        o.code.toLowerCase().includes(q) ||
        o.info.fullName.toLowerCase().includes(q) ||
        o.info.phone.includes(q);
      const currentStatus = o.status ?? "pending";
      const matchStatus = statusFilter === "all" || currentStatus === statusFilter;
      return matchQ && matchStatus;
    });
  }, [orders, searchQuery, statusFilter]);

  const statusOptions = Object.entries(ORDER_STATUS_LABELS) as [
    OrderStatus,
    { label: string; color: string },
  ][];

  const handleExportCsv = () => {
    if (orders.length === 0) return;

    const headers = [
      "Mã đơn",
      "Ngày đặt",
      "Họ tên khách",
      "Số điện thoại",
      "Email",
      "Địa chỉ",
      "Ghi chú",
      "PT Thanh toán",
      "Số món",
      "Tạm tính",
      "Phí ship",
      "Giảm giá",
      "Tổng thanh toán",
      "Trạng thái",
    ];

    const rows = filteredOrders.map((o) => [
      `"${o.code}"`,
      `"${new Date(o.createdAt).toLocaleString("vi-VN")}"`,
      `"${o.info.fullName.replace(/"/g, '""')}"`,
      `"${o.info.phone}"`,
      `"${(o.info.email || "").replace(/"/g, '""')}"`,
      `"${o.info.address.replace(/"/g, '""')}"`,
      `"${(o.info.note || "").replace(/"/g, '""')}"`,
      `"${o.info.paymentMethod.toUpperCase()}"`,
      o.lines.length,
      o.totals.subtotal,
      o.totals.shippingFee,
      o.totals.discount,
      o.totals.total,
      `"${ORDER_STATUS_LABELS[o.status ?? "pending"]?.label || o.status}"`,
    ]);

    const csvContent =
      "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `don-hang-liseamade-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mt-6 space-y-6 animate-fade-in">
      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Tìm đơn theo mã, tên khách, hoặc số điện thoại..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-hair border border-sand-300 bg-sand-50 pl-9 pr-4 py-2 text-xs text-ink-900 focus:outline-none focus:border-ink-900"
          />
          <SearchIcon className="absolute left-3 top-2.5 h-3.5 w-3.5 text-ink-400" />
        </div>

        <div className="flex items-center gap-2">
          <div className="w-full sm:w-44">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-hair border border-sand-300 bg-sand-50 px-3 py-2 text-xs text-ink-900 focus:outline-none focus:border-ink-900"
            >
              <option value="all">Tất cả trạng thái</option>
              {statusOptions.map(([key, meta]) => (
                <option key={key} value={key}>
                  {meta.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleExportCsv}
            disabled={filteredOrders.length === 0}
            className="shrink-0 rounded-hair border border-sand-300 bg-sand-100 px-3 py-2 text-xs font-medium text-ink-700 hover:bg-sand-200 hover:text-ink-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            title="Xuất danh sách đơn ra file Excel CSV"
          >
            <span>📥</span>
            <span>Xuất CSV</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-hair border border-sand-300 bg-sand-50 overflow-hidden shadow-2xs">
        {filteredOrders.length === 0 ? (
          <div className="p-8 text-center text-xs text-ink-500">
            Không tìm thấy đơn hàng nào phù hợp với điều kiện tìm kiếm.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-sand-200 bg-sand-100 text-ink-500 text-2xs uppercase">
                <tr>
                  <th className="px-4 py-3 font-medium">Mã đơn</th>
                  <th className="px-4 py-3 font-medium">Khách hàng</th>
                  <th className="px-4 py-3 font-medium">Thời gian</th>
                  <th className="px-4 py-3 font-medium">Món / Giá trị</th>
                  <th className="px-4 py-3 font-medium">Trạng thái</th>
                  <th className="px-4 py-3 font-medium text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-200">
                {filteredOrders.map((order) => {
                  const currentStatus = order.status ?? "pending";
                  return (
                    <tr key={order.code} className="hover:bg-sand-100/50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-mono font-bold text-ink-900">{order.code}</span>
                        <div className="text-2xs text-ink-500 mt-0.5 uppercase tracking-wider">
                          {order.info.paymentMethod}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-ink-900">{order.info.fullName}</div>
                        <div className="text-2xs text-ink-500">{order.info.phone}</div>
                      </td>
                      <td className="px-4 py-3 text-ink-600">
                        {new Date(order.createdAt).toLocaleString("vi-VN", {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-ink-900">{formatVnd(order.totals.total)}</div>
                        <div className="text-2xs text-ink-500">{order.lines.length} món hàng</div>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={currentStatus}
                          onChange={(e) =>
                            onUpdateStatus(order.code, e.target.value as OrderStatus)
                          }
                          className="rounded-hair border border-sand-300 bg-sand-50 px-2.5 py-1 text-2xs font-medium text-ink-900 focus:outline-none focus:border-ink-900"
                        >
                          {statusOptions.map(([key, meta]) => (
                            <option key={key} value={key}>
                              {meta.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => onViewOrder(order)}
                          className="tap-feedback rounded-hair border border-sand-300 px-3 py-1 text-xs font-medium text-ink-700 hover:bg-sand-200 hover:text-ink-900 transition-colors"
                        >
                          Chi tiết
                        </button>
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
