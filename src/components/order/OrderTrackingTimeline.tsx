import { useState } from "react";
import type { OrderStatus, CheckoutInfo } from "@/types";
import { ORDER_STATUS_LABELS } from "@/lib/orders";
import { formatDateTime } from "@/lib/format";

interface OrderTrackingTimelineProps {
  status?: OrderStatus;
  createdAt: string;
  info: CheckoutInfo;
  trackingCode?: string;
  carrier?: string;
}

interface StepItem {
  key: OrderStatus | "created";
  title: string;
  description: string;
}

const STEPS: StepItem[] = [
  {
    key: "created",
    title: "Đặt hàng thành công",
    description: "Đơn đã ghi nhận trên hệ thống",
  },
  {
    key: "processing",
    title: "Đang chuẩn bị hàng",
    description: "Shop kiểm tra và đóng gói sản phẩm",
  },
  {
    key: "shipping",
    title: "Đang vận chuyển",
    description: "Bưu tá đang giao đến địa chỉ của bạn",
  },
  {
    key: "delivered",
    title: "Giao thành công",
    description: "Khách đã nhận kiện hàng",
  },
];

export function OrderTrackingTimeline({
  status = "pending",
  createdAt,
  info,
  trackingCode,
  carrier: _carrier,
}: OrderTrackingTimelineProps) {
  const [copiedTracking, setCopiedTracking] = useState(false);
  const currentStatus = status ?? "pending";
  const statusMeta = ORDER_STATUS_LABELS[currentStatus] || {
    label: "Chờ xác nhận",
    color: "bg-amber-100 text-amber-800 border-amber-300",
  };

  // Xác định vị trí bước hiện tại trong quy trình 4 bước (0, 1, 2, 3)
  const getStepIndex = (st: OrderStatus): number => {
    switch (st) {
      case "pending":
        return 0;
      case "processing":
        return 1;
      case "shipping":
        return 2;
      case "delivered":
        return 3;
      case "cancelled":
        return -1;
      default:
        return 0;
    }
  };

  const activeIndex = getStepIndex(currentStatus);
  const isCancelled = currentStatus === "cancelled";

  // Thông điệp trạng thái chi tiết cho khách hàng
  const getStatusDetailMessage = () => {
    switch (currentStatus) {
      case "pending":
        return "Đơn hàng của bạn đã được ghi nhận. LiseaMade sẽ gọi điện hoặc gửi tin nhắn xác nhận đơn trong vòng 24 giờ làm việc.";
      case "processing":
        return "Đơn hàng đã được xác nhận. Kho đang chuẩn bị, kiểm tra chất lượng sợi vải và đóng gói hộp quà LiseaMade cẩn thận.";
      case "shipping":
        return "Kiện hàng đã được bàn giao cho đối tác vận chuyển và đang trên đường giao đến bạn. Bưu tá sẽ liên hệ trước khi phát hàng.";
      case "delivered":
        return "Kiện hàng đã được giao thành công tới địa chỉ nhận. Cảm ơn bạn đã đồng hành và yêu thích phong cách hè LiseaMade!";
      case "cancelled":
        return "Đơn hàng này đã bị hủy. Nếu có bất kỳ thắc mắc hoặc cần đặt lại, vui lòng liên hệ hotline 0987 654 321 để được hỗ trợ.";
      default:
        return "Đang cập nhật tiến trình giao hàng.";
    }
  };

  return (
    <div className="rounded-hair border border-sand-300 bg-sand-50 p-5 space-y-6 animate-fade-in">
      {/* 1. Header: Trạng thái đơn hàng */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-sand-200 pb-4">
        <div>
          <span className="text-[11px] font-semibold tracking-wider text-ink-500 uppercase">
            Trạng thái đơn hàng
          </span>
          <div className="flex items-center gap-2.5 mt-1">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${statusMeta.color}`}
            >
              {!isCancelled && (
                <span className="h-2 w-2 rounded-full bg-current animate-pulse" />
              )}
              {statusMeta.label}
            </span>
            <span className="text-2xs text-ink-500 font-mono">
              Cập nhật: {formatDateTime(createdAt)}
            </span>
          </div>
        </div>

        <p className="text-xs text-ink-700 max-w-md sm:text-right leading-relaxed">
          {getStatusDetailMessage()}
        </p>
      </div>

      {/* 2. Stepper Timeline (Hành trình vận chuyển 4 bước) */}
      {!isCancelled ? (
        <div className="py-2">
          <div className="relative">
            {/* Thanh nối ngầm (background line) */}
            <div className="absolute top-4 left-6 right-6 hidden sm:block h-0.5 bg-sand-200 -z-0" />

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 sm:gap-2">
              {STEPS.map((step, idx) => {
                const isPassed = idx < activeIndex;
                const isCurrent = idx === activeIndex;

                return (
                  <div
                    key={step.key}
                    className="flex sm:flex-col items-start sm:items-center text-left sm:text-center gap-3 sm:gap-2 relative z-10"
                  >
                    {/* Icon circle */}
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all ${
                        isCurrent
                          ? "bg-lagoon-800 text-sand-50 ring-4 ring-lagoon-200 shadow-md scale-105"
                          : isPassed
                            ? "bg-green-700 text-sand-50"
                            : "bg-sand-200 text-ink-400 border border-sand-300"
                      }`}
                    >
                      {isPassed ? "✓" : idx + 1}
                    </div>

                    {/* Step info */}
                    <div className="flex-1">
                      <p
                        className={`text-xs font-semibold ${
                          isCurrent
                            ? "text-lagoon-900"
                            : isPassed
                              ? "text-ink-900"
                              : "text-ink-400"
                        }`}
                      >
                        {step.title}
                      </p>
                      <p className="text-[11px] text-ink-500 mt-0.5 leading-snug">
                        {step.description}
                      </p>
                      {isCurrent && (
                        <span className="inline-block mt-1 text-[10px] font-semibold text-lagoon-800 bg-lagoon-100 rounded px-1.5 py-0.5">
                          Đang ở chặng này
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-hair border border-coral-200 bg-coral-50 p-4 text-xs text-coral-800">
          Đơn hàng đã ở trạng thái hủy. Nếu cần hỗ trợ khôi phục hoặc đặt lại, bạn vui lòng liên hệ bộ phận hỗ trợ khách hàng.
        </div>
      )}

      {/* 2.5. Box Định vị đơn hàng Shopee Express (SPX) */}
      {trackingCode && (
        <div className="rounded-hair border border-orange-200 bg-orange-50/70 p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#ee4d2d] text-white text-[11px] font-black tracking-tighter">
                SPX
              </span>
              <div>
                <span className="text-2xs font-bold uppercase tracking-wider text-[#ea580c]">
                  Shopee Express (SPX) · Theo dõi trực tiếp
                </span>
                <p className="text-xs font-mono font-bold text-ink-900 mt-0.5">
                  Mã vận đơn: <span className="text-[#c2410c]">{trackingCode}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (navigator.clipboard?.writeText) {
                    navigator.clipboard.writeText(trackingCode).then(() => {
                      setCopiedTracking(true);
                      setTimeout(() => setCopiedTracking(false), 2000);
                    });
                  }
                }}
                className="tap-feedback rounded-hair border border-orange-300 bg-white px-2.5 py-1 text-2xs font-medium text-ink-800 hover:bg-orange-100 transition-colors"
              >
                {copiedTracking ? "Đã chép ✓" : "Sao chép mã"}
              </button>

              <a
                href={`https://spx.vn/track?${encodeURIComponent(trackingCode)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-hair bg-[#ee4d2d] px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-[#d73211] transition-all"
              >
                <span>Xem vị trí bưu tá trên SPX</span>
                <span>↗</span>
              </a>
            </div>
          </div>

          <p className="text-[11px] text-ink-600 leading-snug">
            Kiện hàng đang được điều phối bởi Shopee Express. Bấm nút trên để mở bản đồ định vị hành trình và trạm trung chuyển SPX gần bạn nhất.
          </p>
        </div>
      )}

      {/* 3. Box Thông tin người nhận & Địa chỉ giao hàng ("Đi đến đâu") */}
      <div className="rounded-hair border border-sand-200 bg-sand-100/70 p-4">
        <h4 className="text-2xs font-semibold text-ink-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
          <span>📍 Địa chỉ nhận hàng</span>
          <span className="text-ink-400 font-normal">| Đơn vị vận chuyển liên tỉnh</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <p className="font-semibold text-ink-900">
              {info.fullName || "Khách hàng LiseaMade"}
            </p>
            <p className="text-ink-600 font-mono mt-0.5">
              Số điện thoại: {info.phone || "Chưa cập nhật"}
            </p>
            <p className="text-ink-700 mt-1 leading-relaxed">
              Địa chỉ: {info.address}
              {info.district && `, ${info.district}`}
              {info.province && `, ${info.province}`}
            </p>
          </div>

          <div className="sm:border-l sm:border-sand-200 sm:pl-4 space-y-1 text-ink-600">
            <p>
              <span className="text-ink-500">Hình thức thanh toán:</span>{" "}
              <strong className="text-ink-900 uppercase">
                {info.paymentMethod === "cod"
                  ? "Thanh toán khi nhận hàng (COD)"
                  : info.paymentMethod === "bank-transfer"
                    ? "Chuyển khoản ngân hàng"
                    : "Ví điện tử"}
              </strong>
            </p>
            <p>
              <span className="text-ink-500">Thời gian dự kiến:</span>{" "}
              <span className="text-ink-900 font-medium">
                {currentStatus === "delivered"
                  ? "Đã giao thành công"
                  : currentStatus === "shipping"
                    ? "1 - 2 ngày tới"
                    : "2 - 3 ngày làm việc"}
              </span>
            </p>
            {info.note && (
              <p className="text-[11px] text-ink-500 italic mt-1">
                Ghi chú: &ldquo;{info.note}&rdquo;
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
