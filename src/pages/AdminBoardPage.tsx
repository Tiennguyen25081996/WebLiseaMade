import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAdminAuth, changeAdminPassword } from "@/lib/admin-auth";
import { useAdminStore, type DiscountEvent } from "@/lib/admin-store";
import { readOrders, updateOrderShipping, ORDERS_UPDATED_EVENT } from "@/lib/orders";
import { updateOrderStatusApi } from "@/lib/api";
import type { Category, Product, PlacedOrder, OrderStatus } from "@/types";
import { Button } from "@/components/ui/Button";
import {
  CheckIcon,
  SparkleIcon,
  PackageIcon,
  UploadIcon,
  LogoutIcon,
  UserIcon,
  ClipboardListIcon,
  ChartBarIcon,
  TagIcon,
  HomeIcon,
  BotIcon,
  LockIcon,
  CloseIcon,
} from "@/components/ui/icons";
import { CloudflareImageUploader } from "@/components/admin/CloudflareImageUploader";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { AdminOverviewTab } from "@/components/admin/AdminOverviewTab";
import { AdminOrdersTab } from "@/components/admin/AdminOrdersTab";
import { AdminProductsTab } from "@/components/admin/AdminProductsTab";
import { AdminCategoriesTab } from "@/components/admin/AdminCategoriesTab";
import { AdminDiscountsTab } from "@/components/admin/AdminDiscountsTab";
import { OrderDetailModal } from "@/components/admin/OrderDetailModal";
import { ProductEditModal } from "@/components/admin/ProductEditModal";
import { CategoryEditModal } from "@/components/admin/CategoryEditModal";
import { DiscountEditModal } from "@/components/admin/DiscountEditModal";
import { ConfirmDeleteModal } from "@/components/admin/ConfirmDeleteModal";
import { AdminHomeSettingsTab } from "@/components/admin/AdminHomeSettingsTab";
import { AdminChatbotTab } from "@/components/admin/AdminChatbotTab";

type AdminTab = "overview" | "products" | "categories" | "discounts" | "media" | "orders" | "home_settings" | "chatbot";

export default function AdminBoardPage() {
  const location = useLocation();
  const initialTab: AdminTab =
    location.pathname.includes("media") || location.pathname.includes("upload")
      ? "media"
      : location.pathname.includes("orders")
        ? "orders"
        : "overview";

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Change Password State
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changePasswordError, setChangePasswordError] = useState<string | null>(null);

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setChangePasswordError(null);
    if (!user) return;
    if (newPassword !== confirmPassword) {
      setChangePasswordError("Xác nhận mật khẩu mới không khớp.");
      return;
    }
    const res = changeAdminPassword(user.username, oldPassword, newPassword);
    if (!res.success) {
      setChangePasswordError(res.error || "Không thể đổi mật khẩu.");
      return;
    }
    setIsChangePasswordOpen(false);
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    showToast("Đổi mật khẩu quản trị thành công!");
  };

  // Auth state
  const { isAuthenticated, user, logout } = useAdminAuth();

  // Orders state
  const [orders, setOrders] = useState<PlacedOrder[]>(() => readOrders());
  const [viewingOrder, setViewingOrder] = useState<PlacedOrder | null>(null);

  const loadOrders = () => {
    setOrders(readOrders());
  };

  useEffect(() => {
    const handleOrdersChange = () => {
      loadOrders();
    };
    window.addEventListener(ORDERS_UPDATED_EVENT, handleOrdersChange);
    window.addEventListener("storage", handleOrdersChange);
    return () => {
      window.removeEventListener(ORDERS_UPDATED_EVENT, handleOrdersChange);
      window.removeEventListener("storage", handleOrdersChange);
    };
  }, []);

  const handleUpdateOrderStatus = async (code: string, newStatus: OrderStatus) => {
    await updateOrderStatusApi(code, newStatus);
    loadOrders();
    showToast(`Đã cập nhật trạng thái đơn ${code}!`);
  };

  const handleUpdateShipping = (
    code: string,
    shipping: { trackingCode?: string; carrier?: PlacedOrder["carrier"] },
  ) => {
    const ok = updateOrderShipping(code, shipping);
    if (ok) {
      loadOrders();
      setViewingOrder((prev) => (prev ? { ...prev, ...shipping } : null));
      showToast(`Đã lưu mã vận đơn cho đơn ${code}!`);
    }
  };

  const handleLogout = () => {
    if (window.confirm("Bạn có chắc chắn muốn đăng xuất khỏi hệ thống quản trị?")) {
      logout();
      showToast("Đã đăng xuất thành công!");
    }
  };

  const [isPushingD1, setIsPushingD1] = useState(false);

  const handlePushToD1 = async () => {
    setIsPushingD1(true);
    showToast("Đang đồng bộ cấu hình lên Cloudflare D1...");
    try {
      const res = await pushAllToRemote();
      if (res.success) {
        showToast("Đã đồng bộ sản phẩm & trang chủ lên Cloudflare D1 thành công!");
      } else {
        showToast("Lỗi đồng bộ: " + (res.error || "Vui lòng thử lại"));
      }
    } catch {
      showToast("Lỗi kết nối khi đồng bộ.");
    } finally {
      setIsPushingD1(false);
    }
  };

  // Admin Store
  const {
    products,
    categories,
    discounts,
    homeSettings,
    chatbotConfig,
    pushAllToRemote,
    saveProduct,
    deleteProduct,
    saveCategory,
    deleteCategory,
    saveDiscount,
    toggleDiscount,
    deleteDiscount,
    saveHomeSettings,
    resetHomeSettings,
    saveChatbotConfig,
    resetChatbotConfig,
    resetToDefaults,
  } = useAdminStore();

  const [currentTab, setCurrentTab] = useState<AdminTab>(initialTab);

  // Modals state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const [editingDiscount, setEditingDiscount] = useState<DiscountEvent | null>(null);
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<{
    type: "product" | "category" | "discount";
    id: string;
    title: string;
  } | null>(null);

  // Product actions
  const openNewProductModal = () => {
    setEditingProduct(null);
    setIsProductModalOpen(true);
  };

  const openEditProductModal = (product: Product) => {
    setEditingProduct(product);
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = (product: Product) => {
    saveProduct(product);
    setIsProductModalOpen(false);
    showToast(editingProduct ? "Đã cập nhật sản phẩm thành công!" : "Đã thêm sản phẩm mới thành công!");
  };

  // Category actions
  const openNewCategoryModal = () => {
    setEditingCategory(null);
    setIsCategoryModalOpen(true);
  };

  const openEditCategoryModal = (cat: Category) => {
    setEditingCategory(cat);
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = (cat: Category) => {
    saveCategory(cat);
    setIsCategoryModalOpen(false);
    showToast(editingCategory ? "Đã cập nhật loại sản phẩm!" : "Đã tạo loại sản phẩm mới!");
  };

  // Discount actions
  const openNewDiscountModal = () => {
    setEditingDiscount(null);
    setIsDiscountModalOpen(true);
  };

  const openEditDiscountModal = (disc: DiscountEvent) => {
    setEditingDiscount(disc);
    setIsDiscountModalOpen(true);
  };

  const handleSaveDiscount = (disc: DiscountEvent) => {
    saveDiscount(disc);
    setIsDiscountModalOpen(false);
    showToast(editingDiscount ? "Đã cập nhật sự kiện giảm giá!" : "Đã tạo sự kiện giảm giá mới!");
  };

  // Delete actions
  const handleConfirmDelete = () => {
    if (!deleteTarget) return;

    if (deleteTarget.type === "product") {
      deleteProduct(deleteTarget.id);
      showToast(`Đã xóa sản phẩm "${deleteTarget.title}"`);
    } else if (deleteTarget.type === "category") {
      const res = deleteCategory(deleteTarget.id);
      if (!res.success) {
        showToast(res.message || "Không thể xóa danh mục này.");
        setDeleteTarget(null);
        return;
      }
      showToast(`Đã xóa danh mục "${deleteTarget.title}"`);
    } else if (deleteTarget.type === "discount") {
      deleteDiscount(deleteTarget.id);
      showToast(`Đã xóa sự kiện giảm giá "${deleteTarget.title}"`);
    }

    setDeleteTarget(null);
  };

  if (!isAuthenticated) {
    return <AdminLoginForm onSuccess={(u) => showToast(`Xin chào, ${u.name}!`)} />;
  }

  return (
    <div className="container-page pb-20 pt-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-hair bg-ink-900 px-5 py-3 text-sm text-sand-50 shadow-xl transition-all animate-reveal-up"
        >
          <CheckIcon className="h-4 w-4 text-lagoon-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-sand-200 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-eyebrow text-lagoon-600 font-semibold tracking-wider uppercase">
              Bảng điều khiển
            </span>
            <span className="rounded-full bg-lagoon-100 px-2.5 py-0.5 text-[11px] font-medium text-lagoon-800">
              Admin Console
            </span>
          </div>
          <h1 className="mt-1 font-display text-display-md text-ink-900">
            Quản trị LiseaMade
          </h1>
          <p className="mt-1 text-xs text-ink-500">
            Xin chào <strong className="text-ink-800">{user?.name}</strong> ({user?.role}) · Quản trị toàn diện sản phẩm, phân loại, khuyến mãi và đơn đặt hàng.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handlePushToD1}
            disabled={isPushingD1}
            className="rounded-hair border border-lagoon-600 bg-lagoon-50 px-3 py-2 text-xs font-medium text-lagoon-800 hover:bg-lagoon-100 transition-colors flex items-center gap-1.5"
            title="Đẩy toàn bộ sản phẩm và cài đặt trang chủ lên Cloudflare D1 để khách hàng và mọi máy khác cùng thấy"
          >
            <span>{isPushingD1 ? "Đang đồng bộ..." : "☁️ Đồng bộ lên Cloudflare D1"}</span>
          </button>
          <div className="flex items-center gap-2 rounded-hair border border-sand-300 bg-sand-100 px-3 py-1.5 text-xs text-ink-700">
            <UserIcon className="h-3.5 w-3.5 text-ink-500" />
            <span className="font-medium text-ink-900">{user?.username}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsChangePasswordOpen(true);
              setChangePasswordError(null);
              setOldPassword("");
              setNewPassword("");
              setConfirmPassword("");
            }}
            className="rounded-hair border border-sand-300 bg-sand-100 px-3 py-1.5 text-xs font-medium text-ink-700 hover:bg-sand-200 transition-colors flex items-center gap-1.5"
            title="Đổi mật khẩu quản trị viên"
          >
            <LockIcon className="h-3.5 w-3.5 text-ink-500" />
            <span>Đổi mật khẩu</span>
          </button>
          <Link
            to="/san-pham"
            className="rounded-hair border border-sand-300 px-3 py-2 text-xs font-medium text-ink-700 hover:border-ink-900 hover:text-ink-900 transition-colors"
          >
            Xem Storefront →
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-hair border border-coral-200 bg-coral-50 px-3 py-2 text-xs font-medium text-coral-800 hover:bg-coral-100 transition-colors flex items-center gap-1.5"
          >
            <LogoutIcon className="h-3.5 w-3.5" />
            Đăng xuất
          </button>
        </div>
      </div>

      {/* Navigation Menus & Action Buttons */}
      <div className="mt-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-sand-200 pb-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 scrollbar-hide">
          {[
            { id: "overview" as AdminTab, label: "Tổng quan", icon: ChartBarIcon, ariaLabel: "Tổng quan" },
            { id: "products" as AdminTab, label: "Sản phẩm", icon: PackageIcon, count: products.length, ariaLabel: `Sản phẩm (${products.length})` },
            { id: "categories" as AdminTab, label: "Danh mục", icon: TagIcon, count: categories.length, ariaLabel: `Loại sản phẩm (${categories.length})` },
            { id: "discounts" as AdminTab, label: "Khuyến mãi", icon: SparkleIcon, count: discounts.length, ariaLabel: `Sự kiện giảm giá (${discounts.length})` },
            { id: "media" as AdminTab, label: "Ảnh Cloudflare", icon: UploadIcon, ariaLabel: "Ảnh Cloudflare" },
            { id: "orders" as AdminTab, label: "Đơn hàng", icon: ClipboardListIcon, count: orders.length, ariaLabel: `Đơn hàng (${orders.length})` },
            { id: "home_settings" as AdminTab, label: "Trang chủ", icon: HomeIcon, ariaLabel: "Cài đặt Trang chủ" },
            { id: "chatbot" as AdminTab, label: "Chatbot AI", icon: BotIcon, ariaLabel: "Chatbot AI" },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCurrentTab(tab.id)}
                aria-label={tab.ariaLabel}
                className={`tap-feedback h-9 shrink-0 px-3.5 rounded-hair text-xs font-medium transition-all inline-flex items-center gap-1.5 whitespace-nowrap ${
                  isActive
                    ? "bg-ink-900 text-sand-50 shadow-2xs font-semibold"
                    : "bg-sand-100 text-ink-700 hover:bg-sand-200 hover:text-ink-900"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{tab.label}</span>
                {typeof tab.count === "number" && (
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono font-semibold leading-none ${
                      isActive
                        ? "bg-sand-50/20 text-sand-50"
                        : "bg-sand-200 text-ink-700"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Actions */}
        <div className="flex items-center gap-2">
          {currentTab === "overview" && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  loadOrders();
                  showToast("Đã làm mới dữ liệu thống kê!");
                }}
                className="tap-feedback rounded-hair border border-sand-300 bg-sand-100 px-3 py-1.5 text-xs font-medium text-ink-700 hover:bg-sand-200 transition-colors"
              >
                Làm mới số liệu
              </button>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm("Bạn có chắc chắn muốn khôi phục toàn bộ danh mục và sản phẩm mẫu về ban đầu?")) {
                    resetToDefaults();
                    showToast("Đã khôi phục dữ liệu gốc thành công!");
                  }
                }}
                className="tap-feedback rounded-hair bg-coral-50 border border-coral-200 px-3 py-1.5 text-xs font-medium text-coral-800 hover:bg-coral-100 transition-colors"
              >
                Khôi phục mẫu
              </button>
            </div>
          )}

          {currentTab === "products" && (
            <Button
              variant="primary"
              size="sm"
              onClick={openNewProductModal}
              className="w-full sm:w-auto"
            >
              + Thêm sản phẩm
            </Button>
          )}

          {currentTab === "categories" && (
            <Button
              variant="primary"
              size="sm"
              onClick={openNewCategoryModal}
              className="w-full sm:w-auto"
            >
              + Thêm loại sản phẩm
            </Button>
          )}

          {currentTab === "discounts" && (
            <Button
              variant="primary"
              size="sm"
              onClick={openNewDiscountModal}
              className="w-full sm:w-auto"
            >
              + Thêm sự kiện giảm giá
            </Button>
          )}

          {currentTab === "orders" && (
            <button
              type="button"
              onClick={() => {
                loadOrders();
                showToast("Đã làm mới danh sách đơn hàng!");
              }}
              className="tap-feedback rounded-hair border border-sand-300 bg-sand-100 px-3 py-1.5 text-xs font-medium text-ink-700 hover:bg-sand-200 transition-colors flex items-center gap-1.5"
            >
              <span>↻ Làm mới đơn</span>
            </button>
          )}
        </div>
      </div>

      {/* Tab Panels */}
      {currentTab === "overview" && (
        <AdminOverviewTab
          products={products}
          categories={categories}
          discounts={discounts}
          orders={orders}
          onNavigateTab={setCurrentTab}
          onOpenNewProduct={openNewProductModal}
          onOpenNewDiscount={openNewDiscountModal}
        />
      )}

      {currentTab === "products" && (
        <AdminProductsTab
          products={products}
          categories={categories}
          onEditProduct={openEditProductModal}
          onDeleteProduct={(p) =>
            setDeleteTarget({ type: "product", id: p.id, title: p.name })
          }
        />
      )}

      {currentTab === "categories" && (
        <AdminCategoriesTab
          categories={categories}
          products={products}
          onEditCategory={openEditCategoryModal}
          onDeleteCategory={(c) =>
            setDeleteTarget({ type: "category", id: c.id, title: c.name })
          }
        />
      )}

      {currentTab === "discounts" && (
        <AdminDiscountsTab
          discounts={discounts}
          onToggleDiscount={(id) => {
            toggleDiscount(id);
            const disc = discounts.find((d) => d.id === id);
            showToast(`Đã ${disc?.isActive ? "tắt" : "kích hoạt"} mã ${disc?.code}`);
          }}
          onEditDiscount={openEditDiscountModal}
          onDeleteDiscount={(d) =>
            setDeleteTarget({
              type: "discount",
              id: d.id,
              title: `${d.code} (${d.name})`,
            })
          }
        />
      )}

      {currentTab === "media" && (
        <div className="mt-6 animate-fade-in">
          <CloudflareImageUploader />
        </div>
      )}

      {currentTab === "orders" && (
        <AdminOrdersTab
          orders={orders}
          onUpdateStatus={handleUpdateOrderStatus}
          onViewOrder={setViewingOrder}
        />
      )}

      {currentTab === "home_settings" && (
        <div className="mt-6 animate-fade-in">
          <AdminHomeSettingsTab
            settings={homeSettings}
            onSave={(newSettings) => {
              saveHomeSettings(newSettings);
            }}
            onReset={() => {
              resetHomeSettings();
            }}
            showToast={showToast}
          />
        </div>
      )}

      {currentTab === "chatbot" && (
        <div className="mt-6 animate-fade-in">
          <AdminChatbotTab
            config={chatbotConfig}
            onSave={(newCfg) => {
              saveChatbotConfig(newCfg);
            }}
            onReset={() => {
              resetChatbotConfig();
            }}
            showToast={showToast}
          />
        </div>
      )}

      {/* Modals */}
      <ProductEditModal
        isOpen={isProductModalOpen}
        product={editingProduct}
        categories={categories}
        onClose={() => setIsProductModalOpen(false)}
        onSave={handleSaveProduct}
        showToast={showToast}
      />

      <CategoryEditModal
        isOpen={isCategoryModalOpen}
        category={editingCategory}
        onClose={() => setIsCategoryModalOpen(false)}
        onSave={handleSaveCategory}
        showToast={showToast}
      />

      <DiscountEditModal
        isOpen={isDiscountModalOpen}
        discount={editingDiscount}
        onClose={() => setIsDiscountModalOpen(false)}
        onSave={handleSaveDiscount}
        showToast={showToast}
      />

      <ConfirmDeleteModal
        target={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />

      <OrderDetailModal
        order={viewingOrder}
        onClose={() => setViewingOrder(null)}
        onUpdateShipping={handleUpdateShipping}
      />

      {/* Modal Đổi Mật Khẩu Quản Trị */}
      {isChangePasswordOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="change-password-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/60 p-4 backdrop-blur-xs animate-fade-in"
        >
          <div className="w-full max-w-md rounded-hair border border-sand-300 bg-sand-50 p-6 shadow-2xl animate-reveal-up">
            <div className="flex items-center justify-between border-b border-sand-200 pb-3">
              <div className="flex items-center gap-2">
                <LockIcon className="h-4 w-4 text-ink-700" />
                <h3 id="change-password-title" className="font-display text-lg text-ink-900">
                  Đổi mật khẩu quản trị
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsChangePasswordOpen(false)}
                className="rounded p-1 text-ink-500 hover:bg-sand-200 hover:text-ink-900"
                aria-label="Đóng modal"
              >
                <CloseIcon className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="mt-4 space-y-4">
              {changePasswordError && (
                <div role="alert" className="rounded-hair border border-coral-200 bg-coral-50 p-3 text-xs text-coral-800">
                  {changePasswordError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-ink-700 mb-1">
                  Mật khẩu hiện tại
                </label>
                <input
                  type="password"
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full rounded-hair border border-sand-300 bg-sand-50 px-3 py-2 text-sm text-ink-900 focus:border-ink-900 focus:outline-none"
                  placeholder="Nhập mật khẩu đang dùng"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-700 mb-1">
                  Mật khẩu mới (tối thiểu 6 ký tự)
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-hair border border-sand-300 bg-sand-50 px-3 py-2 text-sm text-ink-900 focus:border-ink-900 focus:outline-none"
                  placeholder="Nhập mật khẩu mới an toàn"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-700 mb-1">
                  Xác nhận mật khẩu mới
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-hair border border-sand-300 bg-sand-50 px-3 py-2 text-sm text-ink-900 focus:border-ink-900 focus:outline-none"
                  placeholder="Nhập lại mật khẩu mới"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-sand-200">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsChangePasswordOpen(false)}
                >
                  Hủy
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Cập nhật mật khẩu
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
