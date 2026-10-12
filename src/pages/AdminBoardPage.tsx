import { useState, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  useAdminStore,
  type DiscountEvent,
} from "@/lib/admin-store";
import type { Category, CategoryId, Product, ProductVariant } from "@/types";
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
} from "@/components/ui/icons";
import { CloudflareImageUploader } from "@/components/admin/CloudflareImageUploader";

type AdminTab = "products" | "categories" | "discounts" | "media";

const DEFAULT_SIZES = ["S", "M", "L", "XL", "Free size"];

export default function AdminBoardPage() {
  const location = useLocation();
  const initialTab: AdminTab =
    location.pathname.includes("media") || location.pathname.includes("upload")
      ? "media"
      : "products";

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-sand-200 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-eyebrow text-lagoon-600 font-semibold tracking-wider uppercase">
              Bảng điều khiển
            </span>
            <span className="rounded-full bg-lagoon-100 px-2.5 py-0.5 text-[11px] font-medium text-lagoon-800">
              Admin v1.0
            </span>
          </div>
          <h1 className="mt-1 font-display text-display-md text-ink-900">
            Quản trị LiseaMade
          </h1>
          <p className="mt-1 text-xs text-ink-500">
            Quản lý trực tiếp danh mục sản phẩm, nhóm hàng và các chương trình ưu đãi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/san-pham"
            className="rounded-hair border border-sand-300 px-4 py-2 text-xs font-medium text-ink-700 hover:border-ink-900 hover:text-ink-900 transition-colors"
          >
            Xem Storefront →
          </Link>
          <button
            type="button"
            onClick={() => {
              if (window.confirm("Bạn có chắc chắn muốn khôi phục toàn bộ danh mục và sản phẩm mẫu về ban đầu?")) {
                resetToDefaults();
                showToast("Đã khôi phục dữ liệu gốc thành công!");
              }
            }}
            className="rounded-hair bg-sand-200 px-4 py-2 text-xs font-medium text-ink-700 hover:bg-coral-100 hover:text-coral-800 transition-colors"
          >
            Khôi phục mẫu
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-hair border border-sand-300 bg-sand-100 p-5">
          <div className="flex items-center justify-between text-ink-500 text-xs">
            <span>Sản phẩm</span>
            <PackageIcon className="h-4 w-4 text-lagoon-600" />
          </div>
          <div className="mt-2 text-3xl font-display text-ink-900">{products.length}</div>
          <div className="mt-1 text-2xs text-ink-500">
            {products.filter((p) => p.variants.some((v) => v.inStock)).length} sản phẩm còn hàng
          </div>
        </div>

        <div className="rounded-hair border border-sand-300 bg-sand-100 p-5">
          <div className="flex items-center justify-between text-ink-500 text-xs">
            <span>Loại sản phẩm</span>
            <span className="text-lagoon-700 text-xs font-bold font-sans">#</span>
          </div>
          <div className="mt-2 text-3xl font-display text-ink-900">{categories.length}</div>
          <div className="mt-1 text-2xs text-ink-500">Nhóm phân loại hàng trên web</div>
        </div>

        <div className="rounded-hair border border-sand-300 bg-sand-100 p-5">
          <div className="flex items-center justify-between text-ink-500 text-xs">
            <span>Sự kiện giảm giá</span>
            <SparkleIcon className="h-4 w-4 text-coral-600" />
          </div>
          <div className="mt-2 text-3xl font-display text-ink-900">
            {discounts.filter((d) => d.isActive).length} / {discounts.length}
          </div>
          <div className="mt-1 text-2xs text-ink-500">Chương trình khuyến mãi đang chạy</div>
        </div>

        <div className="rounded-hair border border-sand-300 bg-sand-100 p-5">
          <div className="flex items-center justify-between text-ink-500 text-xs">
            <span>Cloudflare Media</span>
            <UploadIcon className="h-4 w-4 text-lagoon-700" />
          </div>
          <div className="mt-2 text-3xl font-display text-ink-900">Cloud</div>
          <div className="mt-1 text-2xs text-ink-500">Lưu trữ ảnh D1 / Images CDN</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="mt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-sand-200 pb-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
          <button
            type="button"
            onClick={() => setCurrentTab("products")}
            className={`rounded-hair px-4 py-2 text-xs font-medium transition-all ${
              currentTab === "products"
                ? "bg-ink-900 text-sand-50"
                : "bg-sand-100 text-ink-700 hover:bg-sand-200"
            }`}
          >
            Sản phẩm ({products.length})
          </button>
          <button
            type="button"
            onClick={() => setCurrentTab("categories")}
            className={`rounded-hair px-4 py-2 text-xs font-medium transition-all ${
              currentTab === "categories"
                ? "bg-ink-900 text-sand-50"
                : "bg-sand-100 text-ink-700 hover:bg-sand-200"
            }`}
          >
            Loại sản phẩm ({categories.length})
          </button>
          <button
            type="button"
            onClick={() => setCurrentTab("discounts")}
            className={`rounded-hair px-4 py-2 text-xs font-medium transition-all ${
              currentTab === "discounts"
                ? "bg-ink-900 text-sand-50"
                : "bg-sand-100 text-ink-700 hover:bg-sand-200"
            }`}
          >
            Sự kiện giảm giá ({discounts.length})
          </button>
          <button
            type="button"
            onClick={() => setCurrentTab("media")}
            className={`rounded-hair px-4 py-2 text-xs font-medium transition-all ${
              currentTab === "media"
                ? "bg-ink-900 text-sand-50"
                : "bg-sand-100 text-ink-700 hover:bg-sand-200"
            }`}
          >
            Ảnh Cloudflare (Media)
          </button>
        </div>

        {/* Tab Action Button */}
        <div>
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
        </div>
      </div>

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
        <div className="mt-6">
          <CloudflareImageUploader />
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
       * MODAL XÁC NHẬN XÓA (CONFIRM DELETE)
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
    </div>
  );
}
