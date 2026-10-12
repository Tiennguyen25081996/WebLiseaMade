import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAdminAuth } from "@/lib/admin-auth";
import { useAdminStore, type DiscountEvent } from "@/lib/admin-store";
import { readOrders, updateOrderStatus, ORDERS_UPDATED_EVENT } from "@/lib/orders";
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

type AdminTab = "overview" | "products" | "categories" | "discounts" | "media" | "orders";

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

  const handleUpdateOrderStatus = (code: string, newStatus: OrderStatus) => {
    const ok = updateOrderStatus(code, newStatus);
    if (ok) {
      loadOrders();
      showToast(`Đã cập nhật trạng thái đơn ${code}!`);
    }
  };

  const handleLogout = () => {
    if (window.confirm("Bạn có chắc chắn muốn đăng xuất khỏi hệ thống quản trị?")) {
      logout();
      showToast("Đã đăng xuất thành công!");
    }
  };

  // Admin Store
  const {
    products,
    categories,
    discounts,
    saveProduct,
    deleteProduct,
    saveCategory,
    deleteCategory,
    saveDiscount,
    toggleDiscount,
    deleteDiscount,
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
          <div className="flex items-center gap-2 rounded-hair border border-sand-300 bg-sand-100 px-3 py-1.5 text-xs text-ink-700">
            <UserIcon className="h-3.5 w-3.5 text-ink-500" />
            <span className="font-medium text-ink-900">{user?.username}</span>
          </div>
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
          <button
            type="button"
            onClick={() => setCurrentTab("overview")}
            className={`tap-feedback rounded-hair px-4 py-2 text-xs font-medium transition-all flex items-center gap-1.5 ${
              currentTab === "overview"
                ? "bg-ink-900 text-sand-50 shadow-2xs"
                : "bg-sand-100 text-ink-700 hover:bg-sand-200"
            }`}
          >
            <span>📊</span>
            <span>Tổng quan</span>
          </button>
          <button
            type="button"
            onClick={() => setCurrentTab("products")}
            className={`tap-feedback rounded-hair px-4 py-2 text-xs font-medium transition-all flex items-center gap-1.5 ${
              currentTab === "products"
                ? "bg-ink-900 text-sand-50 shadow-2xs"
                : "bg-sand-100 text-ink-700 hover:bg-sand-200"
            }`}
          >
            <PackageIcon className="h-3.5 w-3.5" />
            <span>Sản phẩm ({products.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setCurrentTab("categories")}
            className={`tap-feedback rounded-hair px-4 py-2 text-xs font-medium transition-all flex items-center gap-1.5 ${
              currentTab === "categories"
                ? "bg-ink-900 text-sand-50 shadow-2xs"
                : "bg-sand-100 text-ink-700 hover:bg-sand-200"
            }`}
          >
            <span className="font-bold">#</span>
            <span>Loại sản phẩm ({categories.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setCurrentTab("discounts")}
            className={`tap-feedback rounded-hair px-4 py-2 text-xs font-medium transition-all flex items-center gap-1.5 ${
              currentTab === "discounts"
                ? "bg-ink-900 text-sand-50 shadow-2xs"
                : "bg-sand-100 text-ink-700 hover:bg-sand-200"
            }`}
          >
            <SparkleIcon className="h-3.5 w-3.5" />
            <span>Sự kiện giảm giá ({discounts.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setCurrentTab("media")}
            className={`tap-feedback rounded-hair px-4 py-2 text-xs font-medium transition-all flex items-center gap-1.5 ${
              currentTab === "media"
                ? "bg-ink-900 text-sand-50 shadow-2xs"
                : "bg-sand-100 text-ink-700 hover:bg-sand-200"
            }`}
          >
            <UploadIcon className="h-3.5 w-3.5" />
            <span>Ảnh Cloudflare</span>
          </button>
          <button
            type="button"
            onClick={() => setCurrentTab("orders")}
            className={`tap-feedback rounded-hair px-4 py-2 text-xs font-medium transition-all flex items-center gap-1.5 ${
              currentTab === "orders"
                ? "bg-ink-900 text-sand-50 shadow-2xs"
                : "bg-sand-100 text-ink-700 hover:bg-sand-200"
            }`}
          >
            <ClipboardListIcon className="h-3.5 w-3.5" />
            <span>Đơn hàng ({orders.length})</span>
          </button>
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
      />
    </div>
  );
}
