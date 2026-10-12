import { useState, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAdminAuth } from "@/lib/admin-auth";
import {
  useAdminStore,
  type DiscountEvent,
} from "@/lib/admin-store";
import { readOrders, updateOrderStatus } from "@/lib/orders";
import type {
  Category,
  CategoryId,
  Product,
  ProductVariant,
  PlacedOrder,
  OrderStatus,
} from "@/types";
import { formatVnd } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import {
  TrashIcon,
  CheckIcon,
  CloseIcon,
  SearchIcon,
  SparkleIcon,
  PackageIcon,
  UploadIcon,
  LockIcon,
  LogoutIcon,
  UserIcon,
  EyeIcon,
  EyeOffIcon,
  ClipboardListIcon,
} from "@/components/ui/icons";
import { CloudflareImageUploader } from "@/components/admin/CloudflareImageUploader";

type AdminTab = "overview" | "products" | "categories" | "discounts" | "media" | "orders";

const DEFAULT_SIZES = ["S", "M", "L", "XL", "Free size"];

const ORDER_STATUS_LABELS: Record<OrderStatus, { label: string; color: string }> = {
  pending: { label: "Chờ xác nhận", color: "bg-amber-100 text-amber-800 border-amber-300" },
  processing: { label: "Đang xử lý", color: "bg-blue-100 text-blue-800 border-blue-300" },
  shipping: { label: "Đang giao hàng", color: "bg-purple-100 text-purple-800 border-purple-300" },
  delivered: { label: "Đã hoàn thành", color: "bg-green-100 text-green-800 border-green-300" },
  cancelled: { label: "Đã hủy đơn", color: "bg-coral-100 text-coral-800 border-coral-300" },
};

export default function AdminBoardPage() {
  const location = useLocation();
  const initialTab: AdminTab =
    location.pathname.includes("media") || location.pathname.includes("upload")
      ? "media"
      : location.pathname.includes("orders")
        ? "orders"
        : "overview";

  // Auth state
  const { isAuthenticated, user, login, logout } = useAdminAuth();
  const [loginForm, setLoginForm] = useState({
    username: "",
    password: "",
    rememberMe: true,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Orders state
  const [orders, setOrders] = useState<PlacedOrder[]>(() => readOrders());
  const [orderSearchQuery, setOrderSearchQuery] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>("all");
  const [viewingOrder, setViewingOrder] = useState<PlacedOrder | null>(null);

  const loadOrders = () => {
    setOrders(readOrders());
  };

  const handleUpdateOrderStatus = (code: string, newStatus: OrderStatus) => {
    const ok = updateOrderStatus(code, newStatus);
    if (ok) {
      loadOrders();
      showToast(`Đã cập nhật trạng thái đơn ${code}!`);
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const q = orderSearchQuery.toLowerCase();
      const matchQ =
        o.code.toLowerCase().includes(q) ||
        o.info.fullName.toLowerCase().includes(q) ||
        o.info.phone.includes(q);
      const currentStatus = o.status ?? "pending";
      const matchStatus =
        orderStatusFilter === "all" || currentStatus === orderStatusFilter;
      return matchQ && matchStatus;
    });
  }, [orders, orderSearchQuery, orderStatusFilter]);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError(null);

    const result = login(loginForm.username, loginForm.password, loginForm.rememberMe);
    if (!result.success) {
      setLoginError(result.error ?? "Đăng nhập thất bại.");
      setIsLoggingIn(false);
    } else {
      setIsLoggingIn(false);
      showToast(`Xin chào, ${result.user?.name}!`);
    }
  };

  const handleLogout = () => {
    if (window.confirm("Bạn có chắc chắn muốn đăng xuất khỏi hệ thống quản trị?")) {
      logout();
      showToast("Đã đăng xuất thành công!");
    }
  };

  const fillDemoAccount = (u: string, p: string) => {
    setLoginForm((prev) => ({ ...prev, username: u, password: p }));
    setLoginError(null);
  };

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
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("all");

  // Modals state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);

  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const [editingDiscount, setEditingDiscount] = useState<DiscountEvent | null>(null);
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<{
    type: "product" | "category" | "discount";
    id: string;
    title: string;
  } | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchQuery =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat =
        selectedCategoryFilter === "all" || p.category === selectedCategoryFilter;
      return matchQuery && matchCat;
    });
  }, [products, searchQuery, selectedCategoryFilter]);

  // Product Form State
  const [prodForm, setProdForm] = useState({
    id: "",
    name: "",
    price: 0,
    compareAtPrice: 0,
    category: "ao" as CategoryId,
    images: "",
    shortDescription: "",
    description: "",
    materials: "",
    badges: "",
    selectedSizes: ["M", "L"],
  });

  const openNewProductModal = () => {
    setEditingProduct(null);
    setProdForm({
      id: `sp-${Date.now().toString(36)}`,
      name: "",
      price: 250000,
      compareAtPrice: 0,
      category: (categories[0]?.id as CategoryId) ?? "ao",
      images: "/placeholder-product.jpg",
      shortDescription: "",
      description: "",
      materials: "Vải sợi tự nhiên, Thoáng mát",
      badges: "Mới",
      selectedSizes: ["M", "L"],
    });
    setIsProductModalOpen(true);
  };

  const openEditProductModal = (product: Product) => {
    setEditingProduct(product);
    setProdForm({
      id: product.id,
      name: product.name,
      price: product.price,
      compareAtPrice: product.compareAtPrice ?? 0,
      category: product.category,
      images: product.images.join("\n"),
      shortDescription: product.shortDescription,
      description: product.description,
      materials: product.materials.join(", "),
      badges: product.badges.join(", "),
      selectedSizes: product.variants.map((v) => v.label),
    });
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodForm.name.trim() || !prodForm.id.trim()) {
      showToast("Vui lòng điền đủ mã và tên sản phẩm!");
      return;
    }

    const imagesList = prodForm.images
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    const materialsList = prodForm.materials
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const badgesList = prodForm.badges
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const variants: ProductVariant[] = prodForm.selectedSizes.map((sizeLabel, idx) => ({
      id: `v-${idx + 1}`,
      label: sizeLabel,
      kind: "size",
      inStock: true,
    }));

    const finalProduct: Product = {
      id: prodForm.id.trim(),
      name: prodForm.name.trim(),
      price: Number(prodForm.price) || 0,
      compareAtPrice: prodForm.compareAtPrice ? Number(prodForm.compareAtPrice) : undefined,
      category: prodForm.category,
      images: imagesList.length > 0 ? imagesList : ["/placeholder-product.jpg"],
      shortDescription: prodForm.shortDescription.trim() || prodForm.name.trim(),
      description: prodForm.description.trim() || prodForm.shortDescription.trim(),
      materials: materialsList.length > 0 ? materialsList : ["Vải sợi cao cấp"],
      variants: variants.length > 0 ? variants : [{ id: "v-default", label: "Free size", kind: "size", inStock: true }],
      rating: editingProduct?.rating ?? 5.0,
      reviewCount: editingProduct?.reviewCount ?? 1,
      badges: badgesList,
    };

    saveProduct(finalProduct);
    setIsProductModalOpen(false);
    showToast(editingProduct ? "Đã cập nhật sản phẩm thành công!" : "Đã thêm sản phẩm mới thành công!");
  };

  // Category Form State
  const [catForm, setCatForm] = useState({
    id: "",
    name: "",
    description: "",
  });

  const openNewCategoryModal = () => {
    setEditingCategory(null);
    setCatForm({
      id: `cat-${Date.now().toString(36)}`,
      name: "",
      description: "",
    });
    setIsCategoryModalOpen(true);
  };

  const openEditCategoryModal = (cat: Category) => {
    setEditingCategory(cat);
    setCatForm({
      id: cat.id,
      name: cat.name,
      description: cat.description,
    });
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catForm.id.trim() || !catForm.name.trim()) {
      showToast("Vui lòng điền mã và tên loại sản phẩm!");
      return;
    }

    const finalCat: Category = {
      id: catForm.id.trim() as CategoryId,
      name: catForm.name.trim(),
      description: catForm.description.trim(),
    };

    saveCategory(finalCat);
    setIsCategoryModalOpen(false);
    showToast(editingCategory ? "Đã cập nhật loại sản phẩm!" : "Đã tạo loại sản phẩm mới!");
  };

  // Discount Form State
  const [discForm, setDiscForm] = useState<DiscountEvent>({
    id: "",
    code: "",
    name: "",
    type: "percentage",
    value: 10,
    minOrderValue: 200000,
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    isActive: true,
    description: "",
  });

  const openNewDiscountModal = () => {
    setEditingDiscount(null);
    setDiscForm({
      id: `disc-${Date.now().toString(36)}`,
      code: "PROMO" + Math.floor(1000 + Math.random() * 9000),
      name: "",
      type: "percentage",
      value: 10,
      minOrderValue: 200000,
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      isActive: true,
      description: "",
    });
    setIsDiscountModalOpen(true);
  };

  const openEditDiscountModal = (disc: DiscountEvent) => {
    setEditingDiscount(disc);
    setDiscForm({ ...disc });
    setIsDiscountModalOpen(true);
  };

  const handleSaveDiscount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!discForm.code.trim() || !discForm.name.trim()) {
      showToast("Vui lòng điền mã code và tên sự kiện giảm giá!");
      return;
    }

    saveDiscount(discForm);
    setIsDiscountModalOpen(false);
    showToast(editingDiscount ? "Đã cập nhật sự kiện giảm giá!" : "Đã tạo sự kiện giảm giá mới!");
  };

  // Confirm delete handler
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
    return (
      <div className="container-page min-h-[80vh] flex items-center justify-center py-12">
        <div className="w-full max-w-md rounded-hair border border-sand-300 bg-sand-50 p-8 shadow-xl animate-reveal-up">
          <div className="text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-lagoon-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-lagoon-800">
              <LockIcon className="h-3.5 w-3.5" />
              Bảo mật hệ thống
            </span>
            <h1 className="mt-4 font-display text-2xl text-ink-900">
              Đăng nhập Quản Trị Viên
            </h1>
            <p className="mt-2 text-xs text-ink-600">
              Truy cập bảng điều khiển sản phẩm, danh mục, khuyến mãi và đơn hàng LiseaMade.
            </p>
          </div>

          {loginError && (
            <div
              role="alert"
              className="mt-6 rounded-hair border border-coral-300 bg-coral-50 p-3 text-xs font-medium text-coral-800 animate-fade-in"
            >
              {loginError}
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="admin-username" className="block text-xs font-medium text-ink-800 mb-1">
                Tên đăng nhập
              </label>
              <div className="relative">
                <input
                  id="admin-username"
                  type="text"
                  required
                  autoComplete="username"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                  placeholder="admin"
                  className="w-full rounded-hair border border-sand-300 bg-sand-50 px-3 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 focus:border-ink-900 focus:outline-none"
                />
                <UserIcon className="absolute right-3 top-3 h-4 w-4 text-ink-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label htmlFor="admin-password" className="block text-xs font-medium text-ink-800 mb-1">
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full rounded-hair border border-sand-300 bg-sand-50 px-3 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 focus:border-ink-900 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-ink-400 hover:text-ink-800"
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-ink-700">
                <input
                  type="checkbox"
                  checked={loginForm.rememberMe}
                  onChange={(e) => setLoginForm({ ...loginForm, rememberMe: e.target.checked })}
                  className="h-4 w-4 rounded accent-ink-900"
                />
                <span>Ghi nhớ phiên đăng nhập</span>
              </label>
            </div>

            <Button
              variant="primary"
              size="md"
              type="submit"
              disabled={isLoggingIn}
              className="w-full justify-center"
            >
              {isLoggingIn ? "Đang xác thực..." : "Đăng nhập hệ thống"}
            </Button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="mt-6 border-t border-sand-200 pt-4">
            <p className="text-2xs font-medium uppercase tracking-wider text-ink-500 mb-2">
              Tài khoản quản trị mẫu:
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => fillDemoAccount("admin", "admin123")}
                className="tap-feedback rounded-hair border border-sand-300 bg-sand-100 px-2.5 py-1.5 text-2xs font-medium text-ink-700 hover:bg-sand-200 transition-colors"
              >
                Super Admin: <span className="font-mono font-bold text-ink-900">admin / admin123</span>
              </button>
              <button
                type="button"
                onClick={() => fillDemoAccount("lisea", "hawaii2026")}
                className="tap-feedback rounded-hair border border-sand-300 bg-sand-100 px-2.5 py-1.5 text-2xs font-medium text-ink-700 hover:bg-sand-200 transition-colors"
              >
                Manager: <span className="font-mono font-bold text-ink-900">lisea / hawaii2026</span>
              </button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <Link
              to="/san-pham"
              className="text-xs text-ink-600 hover:text-ink-900 underline-reveal"
            >
              ← Quay lại cửa hàng LiseaMade
            </Link>
          </div>
        </div>
      </div>
    );
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

      {/* Header with Admin Info & Quick Actions */}
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

      {/* Navigation Menus (Separate Action Menus) */}
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

        {/* Dedicated Action Menu Bar for Active Tab */}
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

      {/* =========================================================================
       * TAB 0: TỔNG QUAN HỆ THỐNG & BÁO CÁO (OVERVIEW)
       * ========================================================================= */}
      {currentTab === "overview" && (
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
                {products.filter((p) => p.variants.some((v) => v.inStock)).length} sản phẩm đang mở bán
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
                {discounts.filter((d) => d.isActive).length} / {discounts.length}
              </div>
              <div className="mt-1 text-2xs text-ink-500">Mã voucher đang áp dụng</div>
            </div>

            <div className="rounded-hair border border-sand-300 bg-sand-100 p-5">
              <div className="flex items-center justify-between text-ink-500 text-xs">
                <span>Đơn hàng & Doanh thu</span>
                <ClipboardListIcon className="h-4 w-4 text-lagoon-700" />
              </div>
              <div className="mt-2 text-2xl font-display text-ink-900">
                {formatVnd(orders.reduce((sum, o) => sum + (o.totals?.total ?? 0), 0))}
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
                  setCurrentTab("products");
                  openNewProductModal();
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
                  setCurrentTab("discounts");
                  openNewDiscountModal();
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
                onClick={() => setCurrentTab("media")}
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
                onClick={() => setCurrentTab("orders")}
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
      )}

      {/* =========================================================================
       * TAB 1: SẢN PHẨM (PRODUCTS)
       * ========================================================================= */}
      {currentTab === "products" && (
        <div className="mt-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Tìm sản phẩm theo tên hoặc mã..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-hair border border-sand-300 bg-sand-50 pl-9 pr-4 py-2 text-xs text-ink-900 focus:outline-none focus:border-ink-900"
              />
              <SearchIcon className="absolute left-3 top-2.5 h-3.5 w-3.5 text-ink-400" />
            </div>

            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="rounded-hair border border-sand-300 bg-sand-50 px-3 py-2 text-xs text-ink-900 focus:outline-none focus:border-ink-900"
            >
              <option value="all">Tất cả nhóm ({products.length})</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="rounded-hair border border-sand-300 bg-sand-100 p-10 text-center text-xs text-ink-500">
              Không tìm thấy sản phẩm phù hợp.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-hair border border-sand-300 bg-sand-50 shadow-2xs">
              <table className="w-full text-left text-xs text-ink-800">
                <thead className="border-b border-sand-200 bg-sand-100 text-eyebrow text-ink-500">
                  <tr>
                    <th className="py-3 px-4">Ảnh & Tên</th>
                    <th className="py-3 px-4">Mã</th>
                    <th className="py-3 px-4">Loại</th>
                    <th className="py-3 px-4">Giá bán</th>
                    <th className="py-3 px-4">Tồn kho / Size</th>
                    <th className="py-3 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand-200">
                  {filteredProducts.map((p) => {
                    const catObj = categories.find((c) => c.id === p.category);
                    return (
                      <tr key={p.id} className="hover:bg-sand-100/60 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={p.images[0] || "/placeholder-product.jpg"}
                              alt={p.name}
                              className="h-10 w-10 rounded-hair object-cover bg-sand-200"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "/placeholder-product.jpg";
                              }}
                            />
                            <div>
                              <div className="font-medium text-ink-900">{p.name}</div>
                              {p.badges.length > 0 && (
                                <div className="flex gap-1 mt-0.5">
                                  {p.badges.map((b) => (
                                    <span
                                      key={b}
                                      className="text-[9px] bg-sand-200 px-1 py-0.2 rounded-hair text-ink-600"
                                    >
                                      {b}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-2xs text-ink-500">{p.id}</td>
                        <td className="py-3 px-4">
                          <span className="rounded-hair bg-sand-200 px-2 py-0.5 text-2xs font-medium text-ink-700">
                            {catObj?.name ?? p.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-medium text-ink-900">
                          <div>{formatVnd(p.price)}</div>
                          {p.compareAtPrice && (
                            <div className="text-[10px] text-ink-400 line-through">
                              {formatVnd(p.compareAtPrice)}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-2xs text-ink-600">
                            {p.variants.map((v) => v.label).join(", ")}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openEditProductModal(p)}
                              className="rounded-hair border border-sand-300 px-2.5 py-1 text-2xs font-medium text-ink-700 hover:border-ink-900 hover:text-ink-900 transition-colors"
                            >
                              Sửa
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setDeleteTarget({
                                  type: "product",
                                  id: p.id,
                                  title: p.name,
                                })
                              }
                              className="rounded-hair p-1 text-coral-700 hover:bg-coral-50 transition-colors"
                              title="Xóa sản phẩm"
                            >
                              <TrashIcon className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
       * TAB 2: LOẠI SẢN PHẨM (CATEGORIES)
       * ========================================================================= */}
      {currentTab === "categories" && (
        <div className="mt-6">
          <div className="overflow-x-auto rounded-hair border border-sand-300 bg-sand-50 shadow-2xs">
            <table className="w-full text-left text-xs text-ink-800">
              <thead className="border-b border-sand-200 bg-sand-100 text-eyebrow text-ink-500">
                <tr>
                  <th className="py-3 px-4">Tên loại</th>
                  <th className="py-3 px-4">Mã định danh (Slug)</th>
                  <th className="py-3 px-4">Mô tả</th>
                  <th className="py-3 px-4">Số lượng sản phẩm</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-200">
                {categories.map((c) => {
                  const prodCount = products.filter((p) => p.category === c.id).length;
                  return (
                    <tr key={c.id} className="hover:bg-sand-100/60 transition-colors">
                      <td className="py-3 px-4 font-medium text-ink-900">{c.name}</td>
                      <td className="py-3 px-4 font-mono text-2xs text-ink-500">{c.id}</td>
                      <td className="py-3 px-4 text-ink-600 max-w-xs truncate">{c.description}</td>
                      <td className="py-3 px-4">
                        <span className="rounded-full bg-sand-200 px-2 py-0.5 text-2xs font-semibold text-ink-700">
                          {prodCount} sản phẩm
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditCategoryModal(c)}
                            className="rounded-hair border border-sand-300 px-2.5 py-1 text-2xs font-medium text-ink-700 hover:border-ink-900 hover:text-ink-900 transition-colors"
                          >
                            Sửa
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setDeleteTarget({
                                type: "category",
                                id: c.id,
                                title: c.name,
                              })
                            }
                            className="rounded-hair p-1 text-coral-700 hover:bg-coral-50 transition-colors"
                            title="Xóa loại sản phẩm"
                          >
                            <TrashIcon className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
       * TAB 3: EVENT GIẢM GIÁ (DISCOUNT EVENTS)
       * ========================================================================= */}
      {currentTab === "discounts" && (
        <div className="mt-6">
          <div className="overflow-x-auto rounded-hair border border-sand-300 bg-sand-50 shadow-2xs">
            <table className="w-full text-left text-xs text-ink-800">
              <thead className="border-b border-sand-200 bg-sand-100 text-eyebrow text-ink-500">
                <tr>
                  <th className="py-3 px-4">Mã ưu đãi</th>
                  <th className="py-3 px-4">Tên chương trình</th>
                  <th className="py-3 px-4">Mức giảm</th>
                  <th className="py-3 px-4">Đơn tối thiểu</th>
                  <th className="py-3 px-4">Thời gian</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-200">
                {discounts.map((d) => (
                  <tr key={d.id} className="hover:bg-sand-100/60 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold tracking-wider text-ink-900 bg-sand-200 px-2 py-0.5 rounded-hair">
                        {d.code}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-ink-900">
                      <div>{d.name}</div>
                      {d.description && (
                        <div className="text-[10px] text-ink-500 mt-0.5">{d.description}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 font-semibold text-coral-700">
                      {d.type === "percentage" ? `Giảm ${d.value}%` : `Giảm ${formatVnd(d.value)}`}
                    </td>
                    <td className="py-3 px-4 text-ink-600">
                      {d.minOrderValue ? formatVnd(d.minOrderValue) : "Không giới hạn"}
                    </td>
                    <td className="py-3 px-4 text-2xs text-ink-500">
                      {d.startDate} → {d.endDate}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => {
                          toggleDiscount(d.id);
                          showToast(`Đã ${d.isActive ? "tắt" : "kích hoạt"} mã ${d.code}`);
                        }}
                        className={`rounded-full px-2.5 py-0.5 text-2xs font-medium cursor-pointer transition-colors ${
                          d.isActive
                            ? "bg-green-100 text-green-800 hover:bg-green-200"
                            : "bg-sand-200 text-ink-500 hover:bg-sand-300"
                        }`}
                      >
                        {d.isActive ? "● Đang bật" : "○ Tạm tắt"}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditDiscountModal(d)}
                          className="rounded-hair border border-sand-300 px-2.5 py-1 text-2xs font-medium text-ink-700 hover:border-ink-900 hover:text-ink-900 transition-colors"
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setDeleteTarget({
                              type: "discount",
                              id: d.id,
                              title: `${d.code} (${d.name})`,
                            })
                          }
                          className="rounded-hair p-1 text-coral-700 hover:bg-coral-50 transition-colors"
                          title="Xóa sự kiện"
                        >
                          <TrashIcon className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
       * TAB 4: QUẢN LÝ ẢNH CLOUDFLARE (MEDIA HUB)
       * ========================================================================= */}
      {currentTab === "media" && (
        <div className="mt-6 animate-fade-in">
          <CloudflareImageUploader />
        </div>
      )}

      {/* =========================================================================
       * TAB 5: QUẢN LÝ ĐƠN HÀNG (ORDERS)
       * ========================================================================= */}
      {currentTab === "orders" && (
        <div className="mt-6 space-y-6 animate-fade-in">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Tìm đơn theo mã, tên khách, hoặc số điện thoại..."
                value={orderSearchQuery}
                onChange={(e) => setOrderSearchQuery(e.target.value)}
                className="w-full rounded-hair border border-sand-300 bg-sand-50 pl-9 pr-4 py-2 text-xs text-ink-900 focus:outline-none focus:border-ink-900"
              />
              <SearchIcon className="absolute left-3 top-2.5 h-3.5 w-3.5 text-ink-400" />
            </div>

            <div className="w-full sm:w-48">
              <select
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value)}
                className="w-full rounded-hair border border-sand-300 bg-sand-50 px-3 py-2 text-xs text-ink-900 focus:outline-none focus:border-ink-900"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="pending">Chờ xác nhận</option>
                <option value="processing">Đang xử lý</option>
                <option value="shipping">Đang giao hàng</option>
                <option value="delivered">Đã hoàn thành</option>
                <option value="cancelled">Đã hủy đơn</option>
              </select>
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
                      const st = order.status ?? "pending";
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
                              value={st}
                              onChange={(e) => handleUpdateOrderStatus(order.code, e.target.value as OrderStatus)}
                              className="rounded-hair border border-sand-300 bg-sand-50 px-2.5 py-1 text-2xs font-medium text-ink-900 focus:outline-none focus:border-ink-900"
                            >
                              <option value="pending">Chờ xác nhận</option>
                              <option value="processing">Đang xử lý</option>
                              <option value="shipping">Đang giao hàng</option>
                              <option value="delivered">Đã hoàn thành</option>
                              <option value="cancelled">Đã hủy đơn</option>
                            </select>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => setViewingOrder(order)}
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
      )}

      {/* =========================================================================
       * MODAL 1: THÊM / SỬA SẢN PHẨM
       * ========================================================================= */}
      {isProductModalOpen && (
        <div
          className="fixed inset-0 z-70 flex items-center justify-center bg-ink-900/60 p-4 backdrop-blur-xs"
          onClick={() => setIsProductModalOpen(false)}
        >
          <div
            className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-hair bg-sand-50 p-6 shadow-2xl border border-sand-300 animate-reveal-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-sand-200 pb-3">
              <h2 className="font-display text-lg text-ink-900">
                {editingProduct ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}
              </h2>
              <button
                type="button"
                onClick={() => setIsProductModalOpen(false)}
                className="text-ink-500 hover:text-ink-900"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="prod-id" className="block font-medium text-ink-700 mb-1">Mã sản phẩm (ID / Slug)*</label>
                  <input
                    id="prod-id"
                    type="text"
                    required
                    value={prodForm.id}
                    disabled={Boolean(editingProduct)}
                    onChange={(e) => setProdForm({ ...prodForm, id: e.target.value })}
                    className="w-full rounded-hair border border-sand-300 px-3 py-2 text-ink-900 disabled:bg-sand-200 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label htmlFor="prod-category" className="block font-medium text-ink-700 mb-1">Loại sản phẩm (Category)*</label>
                  <select
                    id="prod-category"
                    value={prodForm.category}
                    onChange={(e) =>
                      setProdForm({ ...prodForm, category: e.target.value as CategoryId })
                    }
                    className="w-full rounded-hair border border-sand-300 px-3 py-2 text-ink-900 bg-sand-50"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="prod-name" className="block font-medium text-ink-700 mb-1">Tên sản phẩm*</label>
                <input
                  id="prod-name"
                  type="text"
                  required
                  value={prodForm.name}
                  onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })}
                  className="w-full rounded-hair border border-sand-300 px-3 py-2 text-ink-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="prod-price" className="block font-medium text-ink-700 mb-1">Giá bán (VND)*</label>
                  <input
                    id="prod-price"
                    type="number"
                    min="0"
                    step="1000"
                    required
                    value={prodForm.price}
                    onChange={(e) => setProdForm({ ...prodForm, price: Number(e.target.value) })}
                    className="w-full rounded-hair border border-sand-300 px-3 py-2 text-ink-900"
                  />
                </div>

                <div>
                  <label htmlFor="prod-compare-price" className="block font-medium text-ink-700 mb-1">Giá gốc / Gạch ngang (VND)</label>
                  <input
                    id="prod-compare-price"
                    type="number"
                    min="0"
                    step="1000"
                    value={prodForm.compareAtPrice}
                    onChange={(e) =>
                      setProdForm({ ...prodForm, compareAtPrice: Number(e.target.value) })
                    }
                    className="w-full rounded-hair border border-sand-300 px-3 py-2 text-ink-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-ink-700 mb-1">Kích cỡ (Sizes)</label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {DEFAULT_SIZES.map((sz) => {
                    const isChecked = prodForm.selectedSizes.includes(sz);
                    return (
                      <label
                        key={sz}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-hair border cursor-pointer select-none ${
                          isChecked
                            ? "border-ink-900 bg-sand-200 text-ink-900 font-medium"
                            : "border-sand-300 text-ink-600"
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="h-3 w-3 accent-ink-900"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setProdForm({
                                ...prodForm,
                                selectedSizes: [...prodForm.selectedSizes, sz],
                              });
                            } else {
                              setProdForm({
                                ...prodForm,
                                selectedSizes: prodForm.selectedSizes.filter((s) => s !== sz),
                              });
                            }
                          }}
                        />
                        <span>{sz}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label htmlFor="prod-short-desc" className="block font-medium text-ink-700 mb-1">Mô tả ngắn</label>
                <input
                  id="prod-short-desc"
                  type="text"
                  value={prodForm.shortDescription}
                  onChange={(e) =>
                    setProdForm({ ...prodForm, shortDescription: e.target.value })
                  }
                  className="w-full rounded-hair border border-sand-300 px-3 py-2 text-ink-900"
                />
              </div>

              <div>
                <label htmlFor="prod-desc" className="block font-medium text-ink-700 mb-1">Mô tả chi tiết</label>
                <textarea
                  id="prod-desc"
                  rows={2}
                  value={prodForm.description}
                  onChange={(e) => setProdForm({ ...prodForm, description: e.target.value })}
                  className="w-full rounded-hair border border-sand-300 px-3 py-2 text-ink-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="prod-materials" className="block font-medium text-ink-700 mb-1">Chất liệu (cách nhau dấu phẩy)</label>
                  <input
                    id="prod-materials"
                    type="text"
                    value={prodForm.materials}
                    onChange={(e) => setProdForm({ ...prodForm, materials: e.target.value })}
                    className="w-full rounded-hair border border-sand-300 px-3 py-2 text-ink-900"
                  />
                </div>

                <div>
                  <label htmlFor="prod-badges" className="block font-medium text-ink-700 mb-1">Huy hiệu (Badges, cách nhau dấu phẩy)</label>
                  <input
                    id="prod-badges"
                    type="text"
                    value={prodForm.badges}
                    onChange={(e) => setProdForm({ ...prodForm, badges: e.target.value })}
                    className="w-full rounded-hair border border-sand-300 px-3 py-2 text-ink-900"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="prod-images" className="block font-medium text-ink-700">Đường dẫn ảnh (mỗi dòng 1 URL)</label>
                  <button
                    type="button"
                    onClick={() => setIsMediaPickerOpen(true)}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-lagoon-700 hover:text-lagoon-800 transition-colors"
                  >
                    <UploadIcon className="h-3 w-3" />
                    <span>Tải / Chọn từ Cloudflare</span>
                  </button>
                </div>
                <textarea
                  id="prod-images"
                  rows={2}
                  value={prodForm.images}
                  onChange={(e) => setProdForm({ ...prodForm, images: e.target.value })}
                  className="w-full rounded-hair border border-sand-300 px-3 py-2 text-ink-900 font-mono text-2xs"
                  placeholder="/figma-images/product-feat-1.png"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-sand-200">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsProductModalOpen(false)}
                >
                  Hủy
                </Button>
                <Button variant="primary" size="sm" type="submit">
                  {editingProduct ? "Lưu thay đổi" : "Thêm sản phẩm"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
       * MODAL CHỌN ẢNH CLOUDFLARE CHO SẢN PHẨM
       * ========================================================================= */}
      {isMediaPickerOpen && (
        <div
          className="fixed inset-0 z-80 flex items-center justify-center bg-ink-900/60 p-4 backdrop-blur-xs"
          onClick={() => setIsMediaPickerOpen(false)}
        >
          <div
            className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-hair bg-sand-50 p-6 shadow-2xl border border-sand-300 animate-reveal-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-sand-200 pb-3 mb-4">
              <div>
                <h2 className="font-display text-lg text-ink-900">
                  Thư viện ảnh Cloudflare
                </h2>
                <p className="text-xs text-ink-500">
                  Tải ảnh mới hoặc bấm "Chọn" trên ảnh để tự động thêm vào sản phẩm.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsMediaPickerOpen(false)}
                className="text-ink-500 hover:text-ink-900"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>

            <CloudflareImageUploader
              onSelectImage={(url) => {
                setProdForm((prev) => ({
                  ...prev,
                  images: prev.images.trim() ? `${prev.images.trim()}\n${url}` : url,
                }));
                setIsMediaPickerOpen(false);
                showToast("Đã chèn ảnh vào danh sách ảnh sản phẩm!");
              }}
            />
          </div>
        </div>
      )}

      {/* =========================================================================
       * MODAL 2: THÊM / SỬA LOẠI SẢN PHẨM (CATEGORIES)
       * ========================================================================= */}
      {isCategoryModalOpen && (
        <div
          className="fixed inset-0 z-70 flex items-center justify-center bg-ink-900/60 p-4 backdrop-blur-xs"
          onClick={() => setIsCategoryModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-hair bg-sand-50 p-6 shadow-2xl border border-sand-300 animate-reveal-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-sand-200 pb-3">
              <h2 className="font-display text-lg text-ink-900">
                {editingCategory ? "Chỉnh sửa loại sản phẩm" : "Thêm loại sản phẩm mới"}
              </h2>
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="text-ink-500 hover:text-ink-900"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="mt-4 space-y-4 text-xs">
              <div>
                <label htmlFor="cat-id" className="block font-medium text-ink-700 mb-1">Mã định danh (ID / Slug)*</label>
                <input
                  id="cat-id"
                  type="text"
                  required
                  value={catForm.id}
                  disabled={Boolean(editingCategory)}
                  onChange={(e) => setCatForm({ ...catForm, id: e.target.value })}
                  className="w-full rounded-hair border border-sand-300 px-3 py-2 text-ink-900 disabled:bg-sand-200 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label htmlFor="cat-name" className="block font-medium text-ink-700 mb-1">Tên loại sản phẩm*</label>
                <input
                  id="cat-name"
                  type="text"
                  required
                  value={catForm.name}
                  onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                  className="w-full rounded-hair border border-sand-300 px-3 py-2 text-ink-900"
                />
              </div>

              <div>
                <label htmlFor="cat-desc" className="block font-medium text-ink-700 mb-1">Mô tả ngắn</label>
                <textarea
                  id="cat-desc"
                  rows={3}
                  value={catForm.description}
                  onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
                  className="w-full rounded-hair border border-sand-300 px-3 py-2 text-ink-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-sand-200">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsCategoryModalOpen(false)}
                >
                  Hủy
                </Button>
                <Button variant="primary" size="sm" type="submit">
                  {editingCategory ? "Lưu thay đổi" : "Tạo loại sản phẩm"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
       * MODAL 3: THÊM / SỬA EVENT GIẢM GIÁ (DISCOUNT)
       * ========================================================================= */}
      {isDiscountModalOpen && (
        <div
          className="fixed inset-0 z-70 flex items-center justify-center bg-ink-900/60 p-4 backdrop-blur-xs"
          onClick={() => setIsDiscountModalOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-hair bg-sand-50 p-6 shadow-2xl border border-sand-300 animate-reveal-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-sand-200 pb-3">
              <h2 className="font-display text-lg text-ink-900">
                {editingDiscount ? "Chỉnh sửa sự kiện giảm giá" : "Thêm sự kiện giảm giá mới"}
              </h2>
              <button
                type="button"
                onClick={() => setIsDiscountModalOpen(false)}
                className="text-ink-500 hover:text-ink-900"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDiscount} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="disc-code" className="block font-medium text-ink-700 mb-1">Mã Code áp dụng*</label>
                  <input
                    id="disc-code"
                    type="text"
                    required
                    value={discForm.code}
                    onChange={(e) => setDiscForm({ ...discForm, code: e.target.value.toUpperCase() })}
                    className="w-full rounded-hair border border-sand-300 px-3 py-2 text-ink-900 font-mono font-bold"
                    placeholder="SUMMER2026"
                  />
                </div>

                <div>
                  <label htmlFor="disc-type" className="block font-medium text-ink-700 mb-1">Loại giảm giá*</label>
                  <select
                    id="disc-type"
                    value={discForm.type}
                    onChange={(e) =>
                      setDiscForm({ ...discForm, type: e.target.value as "percentage" | "fixed" })
                    }
                    className="w-full rounded-hair border border-sand-300 px-3 py-2 text-ink-900 bg-sand-50"
                  >
                    <option value="percentage">Phần trăm (%)</option>
                    <option value="fixed">Số tiền cố định (VND)</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="disc-name" className="block font-medium text-ink-700 mb-1">Tên chương trình / Tiêu đề*</label>
                <input
                  id="disc-name"
                  type="text"
                  required
                  value={discForm.name}
                  onChange={(e) => setDiscForm({ ...discForm, name: e.target.value })}
                  className="w-full rounded-hair border border-sand-300 px-3 py-2 text-ink-900"
                  placeholder="Khuyến mãi Lễ Hội Mùa Hè"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="disc-value" className="block font-medium text-ink-700 mb-1">
                    {discForm.type === "percentage" ? "Mức giảm (%)*" : "Mức giảm (VND)*"}
                  </label>
                  <input
                    id="disc-value"
                    type="number"
                    min="1"
                    max={discForm.type === "percentage" ? 100 : undefined}
                    required
                    value={discForm.value}
                    onChange={(e) => setDiscForm({ ...discForm, value: Number(e.target.value) })}
                    className="w-full rounded-hair border border-sand-300 px-3 py-2 text-ink-900"
                  />
                </div>

                <div>
                  <label htmlFor="disc-min-order" className="block font-medium text-ink-700 mb-1">Đơn tối thiểu (VND)</label>
                  <input
                    id="disc-min-order"
                    type="number"
                    min="0"
                    step="1000"
                    value={discForm.minOrderValue ?? 0}
                    onChange={(e) =>
                      setDiscForm({ ...discForm, minOrderValue: Number(e.target.value) })
                    }
                    className="w-full rounded-hair border border-sand-300 px-3 py-2 text-ink-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="disc-start-date" className="block font-medium text-ink-700 mb-1">Ngày bắt đầu</label>
                  <input
                    id="disc-start-date"
                    type="date"
                    required
                    value={discForm.startDate}
                    onChange={(e) => setDiscForm({ ...discForm, startDate: e.target.value })}
                    className="w-full rounded-hair border border-sand-300 px-3 py-2 text-ink-900 bg-sand-50"
                  />
                </div>

                <div>
                  <label htmlFor="disc-end-date" className="block font-medium text-ink-700 mb-1">Ngày kết thúc</label>
                  <input
                    id="disc-end-date"
                    type="date"
                    required
                    value={discForm.endDate}
                    onChange={(e) => setDiscForm({ ...discForm, endDate: e.target.value })}
                    className="w-full rounded-hair border border-sand-300 px-3 py-2 text-ink-900 bg-sand-50"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="disc-desc" className="block font-medium text-ink-700 mb-1">Mô tả chương trình</label>
                <textarea
                  id="disc-desc"
                  rows={2}
                  value={discForm.description ?? ""}
                  onChange={(e) => setDiscForm({ ...discForm, description: e.target.value })}
                  className="w-full rounded-hair border border-sand-300 px-3 py-2 text-ink-900"
                  placeholder="Điều kiện áp dụng, chi tiết..."
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="disc-is-active"
                  checked={discForm.isActive}
                  onChange={(e) => setDiscForm({ ...discForm, isActive: e.target.checked })}
                  className="h-4 w-4 accent-ink-900"
                />
                <label htmlFor="disc-is-active" className="text-xs font-medium text-ink-900 cursor-pointer">
                  Kích hoạt mã ngay sau khi lưu
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-sand-200">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsDiscountModalOpen(false)}
                >
                  Hủy
                </Button>
                <Button variant="primary" size="sm" type="submit">
                  {editingDiscount ? "Lưu thay đổi" : "Tạo sự kiện"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
       * MODAL 4: XÁC NHẬN XÓA (CONFIRM DELETE)
       * ========================================================================= */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-80 flex items-center justify-center bg-ink-900/60 p-4 backdrop-blur-xs"
          onClick={() => setDeleteTarget(null)}
        >
          <div
            className="w-full max-w-sm rounded-hair bg-sand-50 p-6 shadow-2xl border border-sand-300 animate-reveal-up"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display text-base text-ink-900">Xác nhận xóa?</h3>
            <p className="mt-2 text-xs text-ink-600">
              Bạn có chắc chắn muốn xóa {deleteTarget.type === "product" ? "sản phẩm" : deleteTarget.type === "category" ? "loại sản phẩm" : "sự kiện giảm giá"}{" "}
              <strong className="text-ink-900 font-semibold">{deleteTarget.title}</strong>? Thao tác này không thể hoàn tác.
            </p>

            <div className="mt-6 flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeleteTarget(null)}
              >
                Hủy
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleConfirmDelete}
              >
                Xóa ngay
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
       * MODAL 5: XEM CHI TIẾT ĐƠN HÀNG (ORDER DETAILS)
       * ========================================================================= */}
      {viewingOrder && (
        <div
          className="fixed inset-0 z-80 flex items-center justify-center bg-ink-900/60 p-4 backdrop-blur-xs"
          onClick={() => setViewingOrder(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-hair bg-sand-50 p-6 shadow-2xl border border-sand-300 animate-reveal-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-sand-200 pb-3">
              <div>
                <span className="text-2xs font-semibold uppercase tracking-wider text-lagoon-700">
                  Chi tiết đơn hàng
                </span>
                <h3 className="font-display text-lg text-ink-900">
                  Mã: {viewingOrder.code}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingOrder(null)}
                className="text-ink-500 hover:text-ink-900"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Thông tin khách hàng */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-hair bg-sand-100 p-3 text-xs text-ink-800">
              <div>
                <span className="text-ink-500 block text-2xs uppercase">Người nhận</span>
                <strong className="font-medium">{viewingOrder.info.fullName}</strong>
                <div className="text-ink-600 mt-0.5">{viewingOrder.info.phone}</div>
                {viewingOrder.info.email && <div className="text-ink-600">{viewingOrder.info.email}</div>}
              </div>
              <div>
                <span className="text-ink-500 block text-2xs uppercase">Địa chỉ giao</span>
                <div className="mt-0.5">{viewingOrder.info.address}</div>
                {viewingOrder.info.note && (
                  <div className="mt-1 text-2xs text-ink-500 italic">
                    Ghi chú: "{viewingOrder.info.note}"
                  </div>
                )}
              </div>
            </div>

            {/* Danh sách món hàng */}
            <div className="mt-4">
              <h4 className="text-xs font-semibold text-ink-800 uppercase tracking-wider mb-2">
                Sản phẩm đặt mua ({viewingOrder.lines.length})
              </h4>
              <div className="divide-y divide-sand-200 border-t border-b border-sand-200 text-xs">
                {viewingOrder.lines.map((line, idx) => (
                  <div key={`${line.productId}-${line.variantId}-${idx}`} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <div className="font-medium text-ink-900">{line.product?.name ?? line.productId}</div>
                      <div className="text-2xs text-ink-500">
                        Phân loại: {line.variant?.label ?? "Tiêu chuẩn"} · Số lượng: {line.quantity}
                      </div>
                    </div>
                    <div className="font-medium text-ink-900">
                      {formatVnd(line.lineTotal ?? (line.unitPrice * line.quantity))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tổng kết tiền */}
            <div className="mt-4 space-y-1.5 text-xs text-ink-700">
              <div className="flex justify-between">
                <span>Tạm tính</span>
                <span>{formatVnd(viewingOrder.totals.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Phí vận chuyển</span>
                <span>{formatVnd(viewingOrder.totals.shippingFee)}</span>
              </div>
              {viewingOrder.totals.discount > 0 && (
                <div className="flex justify-between text-coral-700 font-medium">
                  <span>Giảm giá</span>
                  <span>-{formatVnd(viewingOrder.totals.discount)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-sand-300 pt-2 text-sm font-bold text-ink-900">
                <span>Tổng thanh toán</span>
                <span>{formatVnd(viewingOrder.totals.total)}</span>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setViewingOrder(null)}
              >
                Đóng
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
