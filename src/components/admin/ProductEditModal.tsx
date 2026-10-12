import { useState, useEffect } from "react";
import type { Product, Category, CategoryId, ProductVariant } from "@/types";
import { Button } from "@/components/ui/Button";
import { CloseIcon, UploadIcon } from "@/components/ui/icons";
import { CloudflareImageUploader } from "@/components/admin/CloudflareImageUploader";

const DEFAULT_SIZES = ["S", "M", "L", "XL", "Free size"];

interface ProductEditModalProps {
  isOpen: boolean;
  product: Product | null;
  categories: Category[];
  onClose: () => void;
  onSave: (product: Product) => void;
  showToast?: (msg: string) => void;
}

export function ProductEditModal({
  isOpen,
  product,
  categories,
  onClose,
  onSave,
  showToast,
}: ProductEditModalProps) {
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);

  const [form, setForm] = useState({
    id: "",
    name: "",
    price: 250000,
    compareAtPrice: 0,
    category: "ao" as CategoryId,
    images: "/figma-images/catalog-1.png",
    shortDescription: "",
    description: "",
    materials: "Vải sợi tự nhiên, Thoáng mát",
    badges: "Mới",
    selectedSizes: ["M", "L"],
  });

  useEffect(() => {
    if (!isOpen) return;
    if (product) {
      setForm({
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
    } else {
      setForm({
        id: `sp-${Date.now().toString(36)}`,
        name: "",
        price: 250000,
        compareAtPrice: 0,
        category: (categories[0]?.id as CategoryId) ?? "ao",
        images: "/figma-images/catalog-1.png",
        shortDescription: "",
        description: "",
        materials: "Vải sợi tự nhiên, Thoáng mát",
        badges: "Mới",
        selectedSizes: ["M", "L"],
      });
    }
    // Chỉ khởi tạo form khi mở modal hoặc đổi ID sản phẩm, không reset khi categories/parent re-render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.id.trim()) {
      showToast?.("Vui lòng điền đủ mã và tên sản phẩm!");
      return;
    }

    const imagesList = form.images
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    const materialsList = form.materials
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const badgesList = form.badges
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const variants: ProductVariant[] = form.selectedSizes.map((sizeLabel, idx) => ({
      id: `v-${idx + 1}`,
      label: sizeLabel,
      kind: "size",
      inStock: true,
    }));

    const finalProduct: Product = {
      id: form.id.trim(),
      name: form.name.trim(),
      price: Number(form.price) || 0,
      compareAtPrice: form.compareAtPrice ? Number(form.compareAtPrice) : undefined,
      category: form.category,
      images: imagesList.length > 0 ? imagesList : ["/figma-images/catalog-1.png"],
      shortDescription: form.shortDescription.trim() || form.name.trim(),
      description: form.description.trim() || form.shortDescription.trim(),
      materials: materialsList.length > 0 ? materialsList : ["Vải sợi cao cấp"],
      variants: variants.length > 0 ? variants : [{ id: "v-default", label: "Free size", kind: "size", inStock: true }],
      rating: product?.rating ?? 5.0,
      reviewCount: product?.reviewCount ?? 1,
      badges: badgesList,
    };

    onSave(finalProduct);
  };

  const previewUrls = form.images
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <>
      <div
        className="fixed inset-0 z-70 flex items-center justify-center bg-ink-900/60 p-4 backdrop-blur-xs"
        onClick={onClose}
      >
        <div
          className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-hair bg-sand-50 p-6 shadow-2xl border border-sand-300 animate-reveal-up"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-sand-200 pb-3">
            <h2 className="font-display text-lg text-ink-900">
              {product ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-ink-500 hover:text-ink-900"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="prod-id" className="block font-medium text-ink-700 mb-1">Mã sản phẩm (ID / Slug)*</label>
                <input
                  id="prod-id"
                  type="text"
                  required
                  value={form.id}
                  disabled={Boolean(product)}
                  onChange={(e) => setForm({ ...form, id: e.target.value })}
                  className="w-full rounded-hair border border-sand-300 px-3 py-2 text-ink-900 disabled:bg-sand-200 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label htmlFor="prod-category" className="block font-medium text-ink-700 mb-1">Loại sản phẩm (Category)*</label>
                <select
                  id="prod-category"
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value as CategoryId })
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
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
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
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
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
                  value={form.compareAtPrice}
                  onChange={(e) =>
                    setForm({ ...form, compareAtPrice: Number(e.target.value) })
                  }
                  className="w-full rounded-hair border border-sand-300 px-3 py-2 text-ink-900"
                />
              </div>
            </div>

            <div>
              <label className="block font-medium text-ink-700 mb-1">Kích cỡ (Sizes)</label>
              <div className="flex flex-wrap gap-2 pt-1">
                {DEFAULT_SIZES.map((sz) => {
                  const isChecked = form.selectedSizes.includes(sz);
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
                            setForm({
                              ...form,
                              selectedSizes: [...form.selectedSizes, sz],
                            });
                          } else {
                            setForm({
                              ...form,
                              selectedSizes: form.selectedSizes.filter((s) => s !== sz),
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
                value={form.shortDescription}
                onChange={(e) =>
                  setForm({ ...form, shortDescription: e.target.value })
                }
                className="w-full rounded-hair border border-sand-300 px-3 py-2 text-ink-900"
              />
            </div>

            <div>
              <label htmlFor="prod-desc" className="block font-medium text-ink-700 mb-1">Mô tả chi tiết</label>
              <textarea
                id="prod-desc"
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full rounded-hair border border-sand-300 px-3 py-2 text-ink-900"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="prod-materials" className="block font-medium text-ink-700 mb-1">Chất liệu (cách nhau dấu phẩy)</label>
                <input
                  id="prod-materials"
                  type="text"
                  value={form.materials}
                  onChange={(e) => setForm({ ...form, materials: e.target.value })}
                  className="w-full rounded-hair border border-sand-300 px-3 py-2 text-ink-900"
                />
              </div>

              <div>
                <label htmlFor="prod-badges" className="block font-medium text-ink-700 mb-1">Huy hiệu (Badges, cách nhau dấu phẩy)</label>
                <input
                  id="prod-badges"
                  type="text"
                  value={form.badges}
                  onChange={(e) => setForm({ ...form, badges: e.target.value })}
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
                value={form.images}
                onChange={(e) => setForm({ ...form, images: e.target.value })}
                className="w-full rounded-hair border border-sand-300 px-3 py-2 text-ink-900 font-mono text-2xs"
                placeholder="/figma-images/catalog-1.png"
              />

              {previewUrls.length > 0 && (
                <div className="mt-2 space-y-1.5">
                  <span className="text-[11px] font-medium text-ink-600 block">
                    Xem trước ảnh ({previewUrls.length} ảnh — ảnh đầu tiên là ảnh chính):
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {previewUrls.map((url, idx) => (
                      <div
                        key={`${url}-${idx}`}
                        className={`relative rounded-hair border p-1 bg-sand-100 flex flex-col items-center ${
                          idx === 0 ? "border-lagoon-600 ring-1 ring-lagoon-600" : "border-sand-300"
                        }`}
                      >
                        <img
                          src={url}
                          alt={`Preview ${idx + 1}`}
                          className="h-14 w-14 object-cover rounded-hair bg-sand-200"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/figma-images/catalog-1.png";
                          }}
                        />
                        {idx === 0 && (
                          <span className="absolute top-1.5 left-1.5 bg-lagoon-700 text-sand-50 text-[9px] px-1 py-0.2 rounded font-medium">
                            Ảnh chính
                          </span>
                        )}
                        <div className="mt-1 flex items-center gap-2">
                          {idx > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                const next = [url, ...previewUrls.filter((_, i) => i !== idx)];
                                setForm({ ...form, images: next.join("\n") });
                              }}
                              className="text-[10px] text-lagoon-700 hover:text-lagoon-900 font-medium underline"
                              title="Đặt làm ảnh chính"
                            >
                              Lên đầu
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              const next = previewUrls.filter((_, i) => i !== idx);
                              setForm({ ...form, images: next.join("\n") });
                            }}
                            className="text-[10px] text-coral-700 hover:text-coral-900 font-medium"
                            title="Xóa ảnh"
                          >
                            Xóa
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-sand-200">
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
              >
                Hủy
              </Button>
              <Button variant="primary" size="sm" type="submit">
                {product ? "Lưu thay đổi" : "Thêm sản phẩm"}
              </Button>
            </div>
          </form>
        </div>
      </div>

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
                setForm((prev) => {
                  const currentUrls = prev.images
                    .split("\n")
                    .map((s) => s.trim())
                    .filter(Boolean);
                  const newUrls = [url, ...currentUrls.filter((u) => u !== url)];
                  return {
                    ...prev,
                    images: newUrls.join("\n"),
                  };
                });
                setIsMediaPickerOpen(false);
                showToast?.("Đã chọn làm ảnh chính của sản phẩm!");
              }}
              onSelectImages={(urls) => {
                setForm((prev) => {
                  const currentUrls = prev.images
                    .split("\n")
                    .map((s) => s.trim())
                    .filter(Boolean);
                  const newUrls = [...urls, ...currentUrls.filter((u) => !urls.includes(u))];
                  return {
                    ...prev,
                    images: newUrls.join("\n"),
                  };
                });
                setIsMediaPickerOpen(false);
                showToast?.(`Đã thêm ${urls.length} ảnh vào sản phẩm!`);
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}
