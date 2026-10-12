import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { OrderTrackingTimeline } from "./OrderTrackingTimeline";
import type { CheckoutInfo } from "@/types";

describe("OrderTrackingTimeline", () => {
  const mockInfo: CheckoutInfo = {
    fullName: "Nguyễn Thu Hà",
    phone: "0988123456",
    email: "ha@example.com",
    address: "Số 15 Lê Lợi",
    district: "Quận 1",
    province: "TP. Hồ Chí Minh",
    note: "Giao giờ hành chính",
    paymentMethod: "cod",
  };

  it("hiển thị trạng thái Chờ xác nhận và địa chỉ giao hàng đúng mong đợi", () => {
    render(
      <OrderTrackingTimeline
        status="pending"
        createdAt={new Date().toISOString()}
        info={mockInfo}
      />
    );

    // Trạng thái đơn hàng
    expect(screen.getByText("Chờ xác nhận")).toBeInTheDocument();
    expect(screen.getByText(/Đơn hàng của bạn đã được ghi nhận/i)).toBeInTheDocument();

    // Các bước tiến trình
    expect(screen.getByText("Đặt hàng thành công")).toBeInTheDocument();
    expect(screen.getByText("Đang chuẩn bị hàng")).toBeInTheDocument();
    expect(screen.getByText("Đang vận chuyển")).toBeInTheDocument();
    expect(screen.getByText("Giao thành công")).toBeInTheDocument();

    // Đi đến đâu - Địa chỉ nhận hàng
    expect(screen.getByText("Nguyễn Thu Hà")).toBeInTheDocument();
    expect(screen.getByText(/Số 15 Lê Lợi, Quận 1, TP\. Hồ Chí Minh/)).toBeInTheDocument();
    expect(screen.getByText(/Thanh toán khi nhận hàng \(COD\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Giao giờ hành chính/i)).toBeInTheDocument();
  });

  it("hiển thị trạng thái Đang vận chuyển với chặng đang xử lý nổi bật", () => {
    render(
      <OrderTrackingTimeline
        status="shipping"
        createdAt={new Date().toISOString()}
        info={mockInfo}
      />
    );

    expect(screen.getByText("Đang giao hàng")).toBeInTheDocument();
    expect(screen.getByText(/Kiện hàng đã được bàn giao cho đối tác vận chuyển/i)).toBeInTheDocument();
    expect(screen.getByText("Đang ở chặng này")).toBeInTheDocument();
    expect(screen.getByText("1 - 2 ngày tới")).toBeInTheDocument();
  });

  it("hiển thị cảnh báo đơn hủy khi trạng thái là cancelled", () => {
    render(
      <OrderTrackingTimeline
        status="cancelled"
        createdAt={new Date().toISOString()}
        info={mockInfo}
      />
    );

    expect(screen.getByText("Đã hủy đơn")).toBeInTheDocument();
    expect(screen.getByText(/Đơn hàng này đã bị hủy/i)).toBeInTheDocument();
  });

  it("hiển thị box Shopee Express (SPX) và link tra cứu bưu tá khi có trackingCode", () => {
    render(
      <OrderTrackingTimeline
        status="shipping"
        createdAt={new Date().toISOString()}
        info={mockInfo}
        trackingCode="SPXVN08912389"
        carrier="spx"
      />
    );

    expect(screen.getByText(/Shopee Express \(SPX\) · Theo dõi trực tiếp/i)).toBeInTheDocument();
    expect(screen.getByText("SPXVN08912389")).toBeInTheDocument();

    const spxLink = screen.getByRole("link", { name: /Xem vị trí bưu tá trên SPX/i });
    expect(spxLink).toBeInTheDocument();
    expect(spxLink).toHaveAttribute("href", "https://spx.vn/track?SPXVN08912389");
    expect(spxLink).toHaveAttribute("target", "_blank");
  });
});
