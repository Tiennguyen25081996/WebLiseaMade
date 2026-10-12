import { useState } from "react";
import type { HomePageSettings, HomeSectionItem } from "@/types";
import { Button } from "@/components/ui/Button";
import { UploadIcon, CloseIcon } from "@/components/ui/icons";
import { CloudflareImageUploader } from "@/components/admin/CloudflareImageUploader";
import { normalizeGoogleDriveUrl } from "@/lib/media-api";

interface AdminHomeSettingsTabProps {
  settings: HomePageSettings;
  onSave: (settings: HomePageSettings) => void;
  onReset: () => void;
  showToast: (msg: string) => void;
}

type ImagePickerTarget =
  | { type: "hero" }
  | { type: "brandStory" }
  | { type: "lifestyle"; index: number }
  | { type: "lookbook"; index: number }
  | null;

export function AdminHomeSettingsTab({
  settings,
  onSave,
  onReset,
  showToast,
}: AdminHomeSettingsTabProps) {
  const [form, setForm] = useState<HomePageSettings>({ ...settings });
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<ImagePickerTarget>(null);
  const [activeSection, setActiveSection] = useState<
    "hero" | "lifestyle" | "lookbook" | "story" | "social"
  >("hero");

  const openPicker = (target: ImagePickerTarget) => {
    setPickerTarget(target);
    setIsMediaPickerOpen(true);
  };

  const handleSelectImageFromPicker = (url: string) => {
    const directUrl = normalizeGoogleDriveUrl(url);
    if (!pickerTarget) return;

    if (pickerTarget.type === "hero") {
      setForm((prev) => ({ ...prev, heroImage: directUrl }));
    } else if (pickerTarget.type === "brandStory") {
      setForm((prev) => ({ ...prev, brandStoryImage: directUrl }));
    } else if (pickerTarget.type === "lifestyle") {
      setForm((prev) => {
        const next = [...prev.lifestyleItems];
        if (next[pickerTarget.index]) {
          next[pickerTarget.index] = { ...next[pickerTarget.index], src: directUrl };
        }
        return { ...prev, lifestyleItems: next };
      });
    } else if (pickerTarget.type === "lookbook") {
      setForm((prev) => {
        const next = [...prev.lookbookItems];
        if (next[pickerTarget.index]) {
          next[pickerTarget.index] = { ...next[pickerTarget.index], src: directUrl };
        }
        return { ...prev, lookbookItems: next };
      });
    }

    setIsMediaPickerOpen(false);
    setPickerTarget(null);
    showToast("Đã chọn ảnh thành công!");
  };

  const handleSave = (e?: React.FormEvent) => {
    e?.preventDefault();
    onSave(form);
    showToast("Đã lưu toàn bộ cài đặt Trang chủ thành công!");
  };

  const handleResetToDefault = () => {
    if (window.confirm("Bạn có chắc chắn muốn khôi phục toàn bộ nội dung và ảnh Trang chủ về ban đầu?")) {
      onReset();
      setForm({ ...settings });
      showToast("Đã khôi phục cài đặt Trang chủ về mặc định!");
    }
  };

  // Lifestyle item updates
  const updateLifestyleItem = (index: number, patch: Partial<HomeSectionItem>) => {
    setForm((prev) => {
      const next = [...prev.lifestyleItems];
      if (next[index]) {
        next[index] = { ...next[index], ...patch };
      }
      return { ...prev, lifestyleItems: next };
    });
  };

  const addLifestyleItem = () => {
    setForm((prev) => ({
      ...prev,
      lifestyleItems: [
        ...prev.lifestyleItems,
        {
          id: `life-${Date.now()}`,
          src: "/figma-images/lifestyle-1.png",
          caption: "Khoảnh khắc mới · Mùa hè",
        },
      ],
    }));
  };

  const removeLifestyleItem = (index: number) => {
    setForm((prev) => ({
      ...prev,
      lifestyleItems: prev.lifestyleItems.filter((_, i) => i !== index),
    }));
  };

  // Lookbook item updates
  const updateLookbookItem = (index: number, patch: Partial<HomeSectionItem>) => {
    setForm((prev) => {
      const next = [...prev.lookbookItems];
      if (next[index]) {
        next[index] = { ...next[index], ...patch };
      }
      return { ...prev, lookbookItems: next };
    });
  };

  const addLookbookItem = () => {
    setForm((prev) => ({
      ...prev,
      lookbookItems: [
        ...prev.lookbookItems,
        {
          id: `look-${Date.now()}`,
          src: "/figma-images/lookbook-1.png",
          caption: "Phong cách mới · Mùa hè",
        },
      ],
    }));
  };

  const removeLookbookItem = (index: number) => {
    setForm((prev) => ({
      ...prev,
      lookbookItems: prev.lookbookItems.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-hair border border-sand-300 bg-sand-100 p-4">
        <div>
          <h2 className="font-display text-base font-semibold text-ink-900">
            Cài đặt hình ảnh &amp; nội dung Trang chủ
          </h2>
          <p className="text-xs text-ink-600 mt-0.5">
            Tùy biến Banner Hero, Bộ sưu tập Lifestyle, Lookbook, Câu chuyện thương hiệu và Mạng xã hội.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href="/"
            target="_blank"
            rel="noreferrer noopener"
            className="rounded-hair border border-sand-300 bg-sand-50 px-3 py-1.5 text-xs font-medium text-ink-800 hover:bg-sand-200 transition-colors flex items-center gap-1.5"
          >
            <span>↗ Xem trước Trang chủ</span>
          </a>
          <button
            type="button"
            onClick={handleResetToDefault}
            className="rounded-hair border border-coral-200 bg-coral-50 px-3 py-1.5 text-xs font-medium text-coral-800 hover:bg-coral-100 transition-colors"
          >
            Khôi phục mặc định
          </button>
          <Button variant="primary" size="sm" onClick={handleSave}>
            Lưu thay đổi
          </Button>
        </div>
      </div>

      {/* Navigation Sub-tabs */}
      <div className="flex border-b border-sand-300 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveSection("hero")}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeSection === "hero"
              ? "border-lagoon-700 text-lagoon-900 bg-sand-100/60"
              : "border-transparent text-ink-600 hover:text-ink-900"
          }`}
        >
          <span>1. Banner Hero</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSection("lifestyle")}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeSection === "lifestyle"
              ? "border-lagoon-700 text-lagoon-900 bg-sand-100/60"
              : "border-transparent text-ink-600 hover:text-ink-900"
          }`}
        >
          <span>2. Lifestyle ({form.lifestyleItems.length} ảnh)</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSection("lookbook")}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeSection === "lookbook"
              ? "border-lagoon-700 text-lagoon-900 bg-sand-100/60"
              : "border-transparent text-ink-600 hover:text-ink-900"
          }`}
        >
          <span>3. Lookbook ({form.lookbookItems.length} ảnh)</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSection("story")}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeSection === "story"
              ? "border-lagoon-700 text-lagoon-900 bg-sand-100/60"
              : "border-transparent text-ink-600 hover:text-ink-900"
          }`}
        >
          <span>4. Câu chuyện thương hiệu</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSection("social")}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeSection === "social"
              ? "border-lagoon-700 text-lagoon-900 bg-sand-100/60"
              : "border-transparent text-ink-600 hover:text-ink-900"
          }`}
        >
          <span>5. TikTok &amp; Mạng xã hội</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* ============================================================
         * SECTION 1: HERO BANNER
         * ============================================================ */}
        {activeSection === "hero" && (
          <div className="rounded-hair border border-sand-300 bg-sand-50 p-6 space-y-5 animate-fade-in">
            <div className="border-b border-sand-200 pb-3">
              <h3 className="font-display text-sm font-semibold text-ink-900">
                1. Banner đầu trang (Hero Banner)
              </h3>
              <p className="text-2xs text-ink-600 mt-0.5">
                Khu vực nổi bật nhất khi khách hàng vừa bước vào website.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Cột trái: Văn bản & Nút */}
              <div className="space-y-4">
                <div>
                  <label className="block text-2xs font-semibold text-ink-800 mb-1">
                    Dòng phụ đề trên (Eyebrow):
                  </label>
                  <input
                    type="text"
                    value={form.heroEyebrow}
                    onChange={(e) => setForm({ ...form, heroEyebrow: e.target.value })}
                    className="w-full rounded-hair border border-sand-300 bg-sand-100/60 p-2 text-xs text-ink-900 focus:outline-none focus:border-ink-900"
                    placeholder="Thời trang & phụ kiện Hawaii Summer"
                  />
                </div>

                <div>
                  <label className="block text-2xs font-semibold text-ink-800 mb-1">
                    Tiêu đề chính (Title):
                  </label>
                  <input
                    type="text"
                    value={form.heroTitle}
                    onChange={(e) => setForm({ ...form, heroTitle: e.target.value })}
                    className="w-full rounded-hair border border-sand-300 bg-sand-100/60 p-2 text-sm font-semibold text-ink-900 focus:outline-none focus:border-ink-900"
                    placeholder="LiseaMade"
                  />
                </div>

                <div>
                  <label className="block text-2xs font-semibold text-ink-800 mb-1">
                    Đoạn mô tả ngắn (Description):
                  </label>
                  <textarea
                    rows={2}
                    value={form.heroDescription}
                    onChange={(e) => setForm({ ...form, heroDescription: e.target.value })}
                    className="w-full rounded-hair border border-sand-300 bg-sand-100/60 p-2 text-xs text-ink-900 focus:outline-none focus:border-ink-900"
                    placeholder="Voan, linen, cotton — nhẹ mát cho cả tuần nắng."
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-2xs font-semibold text-ink-800 mb-1">
                      Nhãn nút bấm (CTA):
                    </label>
                    <input
                      type="text"
                      value={form.heroCtaText}
                      onChange={(e) => setForm({ ...form, heroCtaText: e.target.value })}
                      className="w-full rounded-hair border border-sand-300 bg-sand-100/60 p-2 text-xs text-ink-900 focus:outline-none focus:border-ink-900"
                      placeholder="Khám phá bộ sưu tập →"
                    />
                  </div>
                  <div>
                    <label className="block text-2xs font-semibold text-ink-800 mb-1">
                      Đường dẫn nút bấm (Link):
                    </label>
                    <input
                      type="text"
                      value={form.heroCtaLink}
                      onChange={(e) => setForm({ ...form, heroCtaLink: e.target.value })}
                      className="w-full rounded-hair border border-sand-300 bg-sand-100/60 p-2 text-xs text-ink-900 focus:outline-none focus:border-ink-900"
                      placeholder="/san-pham"
                    />
                  </div>
                </div>
              </div>

              {/* Cột phải: Ảnh Hero Banner */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-2xs font-semibold text-ink-800">
                    Ảnh Banner Hero:
                  </label>
                  <button
                    type="button"
                    onClick={() => openPicker({ type: "hero" })}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-lagoon-700 hover:text-lagoon-800 transition-colors"
                  >
                    <UploadIcon className="h-3 w-3" />
                    <span>Chọn từ Thư viện (Cloudflare &amp; Drive)</span>
                  </button>
                </div>

                <div className="relative aspect-4/3 w-full max-w-md overflow-hidden rounded-hair border border-sand-300 bg-sand-200">
                  <img
                    src={normalizeGoogleDriveUrl(form.heroImage)}
                    alt="Preview Hero"
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/figma-images/hero.png";
                    }}
                  />
                  <div className="absolute bottom-2 left-2 rounded bg-ink-900/70 px-2 py-0.5 text-[10px] text-sand-50">
                    Xem trước ảnh Hero
                  </div>
                </div>

                <div>
                  <input
                    type="text"
                    value={form.heroImage}
                    onChange={(e) => setForm({ ...form, heroImage: e.target.value })}
                    className="w-full rounded-hair border border-sand-300 bg-sand-100/60 p-2 font-mono text-2xs text-ink-900 focus:outline-none focus:border-ink-900"
                    placeholder="/figma-images/hero.png hoặc link Google Drive"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
         * SECTION 2: LIFESTYLE
         * ============================================================ */}
        {activeSection === "lifestyle" && (
          <div className="rounded-hair border border-sand-300 bg-sand-50 p-6 space-y-5 animate-fade-in">
            <div className="flex items-center justify-between border-b border-sand-200 pb-3">
              <div>
                <h3 className="font-display text-sm font-semibold text-ink-900">
                  2. Bộ sưu tập Phong cách sống (Lifestyle)
                </h3>
                <p className="text-2xs text-ink-600 mt-0.5">
                  Khối 4 hình ảnh kèm chú thích mô tả phong cách hè Hawaii.
                </p>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={addLifestyleItem}>
                + Thêm ảnh Lifestyle
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-2xs font-semibold text-ink-800 mb-1">
                  Tiêu đề phụ:
                </label>
                <input
                  type="text"
                  value={form.lifestyleEyebrow}
                  onChange={(e) => setForm({ ...form, lifestyleEyebrow: e.target.value })}
                  className="w-full rounded-hair border border-sand-300 bg-sand-100/60 p-2 text-xs text-ink-900 focus:outline-none focus:border-ink-900"
                />
              </div>
              <div>
                <label className="block text-2xs font-semibold text-ink-800 mb-1">
                  Tiêu đề chính:
                </label>
                <input
                  type="text"
                  value={form.lifestyleTitle}
                  onChange={(e) => setForm({ ...form, lifestyleTitle: e.target.value })}
                  className="w-full rounded-hair border border-sand-300 bg-sand-100/60 p-2 text-xs font-semibold text-ink-900 focus:outline-none focus:border-ink-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-2xs font-semibold text-ink-800 mb-1">
                Đoạn mô tả:
              </label>
              <input
                type="text"
                value={form.lifestyleDescription}
                onChange={(e) => setForm({ ...form, lifestyleDescription: e.target.value })}
                className="w-full rounded-hair border border-sand-300 bg-sand-100/60 p-2 text-xs text-ink-900 focus:outline-none focus:border-ink-900"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              {form.lifestyleItems.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="rounded-hair border border-sand-300 bg-sand-100 p-3 space-y-2 flex flex-col justify-between"
                >
                  <div className="relative aspect-3/4 w-full overflow-hidden rounded-hair bg-sand-200">
                    <img
                      src={normalizeGoogleDriveUrl(item.src)}
                      alt={item.caption}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/figma-images/lifestyle-1.png";
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => openPicker({ type: "lifestyle", index: idx })}
                      className="absolute inset-x-2 bottom-2 rounded bg-ink-900/80 py-1 text-center text-[10px] text-sand-50 hover:bg-ink-900 transition-colors backdrop-blur-xs font-medium"
                    >
                      Đổi ảnh
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-semibold text-ink-800">
                      Chú thích ảnh {idx + 1}:
                    </label>
                    <input
                      type="text"
                      value={item.caption}
                      onChange={(e) => updateLifestyleItem(idx, { caption: e.target.value })}
                      className="w-full rounded-hair border border-sand-300 bg-sand-50 p-1.5 text-xs text-ink-900 focus:outline-none focus:border-ink-900"
                      placeholder="Đi biển · Voan hoa"
                    />

                    <input
                      type="text"
                      value={item.src}
                      onChange={(e) => updateLifestyleItem(idx, { src: e.target.value })}
                      className="w-full rounded-hair border border-sand-300 bg-sand-50 p-1 font-mono text-[10px] text-ink-700 focus:outline-none focus:border-ink-900"
                      placeholder="URL ảnh"
                    />
                  </div>

                  {form.lifestyleItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLifestyleItem(idx)}
                      className="text-[10px] text-coral-700 hover:underline text-right pt-1"
                    >
                      Xóa ảnh này
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================
         * SECTION 3: LOOKBOOK
         * ============================================================ */}
        {activeSection === "lookbook" && (
          <div className="rounded-hair border border-sand-300 bg-sand-50 p-6 space-y-5 animate-fade-in">
            <div className="flex items-center justify-between border-b border-sand-200 pb-3">
              <div>
                <h3 className="font-display text-sm font-semibold text-ink-900">
                  3. Lookbook Mùa hè (Lookbook)
                </h3>
                <p className="text-2xs text-ink-600 mt-0.5">
                  Bộ sưu tập phối đồ theo từng khoảnh khắc trong tuần hè.
                </p>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={addLookbookItem}>
                + Thêm ảnh Lookbook
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-2xs font-semibold text-ink-800 mb-1">
                  Tiêu đề phụ:
                </label>
                <input
                  type="text"
                  value={form.lookbookEyebrow}
                  onChange={(e) => setForm({ ...form, lookbookEyebrow: e.target.value })}
                  className="w-full rounded-hair border border-sand-300 bg-sand-100/60 p-2 text-xs text-ink-900 focus:outline-none focus:border-ink-900"
                />
              </div>
              <div>
                <label className="block text-2xs font-semibold text-ink-800 mb-1">
                  Tiêu đề chính:
                </label>
                <input
                  type="text"
                  value={form.lookbookTitle}
                  onChange={(e) => setForm({ ...form, lookbookTitle: e.target.value })}
                  className="w-full rounded-hair border border-sand-300 bg-sand-100/60 p-2 text-xs font-semibold text-ink-900 focus:outline-none focus:border-ink-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              {form.lookbookItems.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="rounded-hair border border-sand-300 bg-sand-100 p-3 space-y-2 flex flex-col justify-between"
                >
                  <div className="relative aspect-3/4 w-full overflow-hidden rounded-hair bg-sand-200">
                    <img
                      src={normalizeGoogleDriveUrl(item.src)}
                      alt={item.caption}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/figma-images/lookbook-1.png";
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => openPicker({ type: "lookbook", index: idx })}
                      className="absolute inset-x-2 bottom-2 rounded bg-ink-900/80 py-1 text-center text-[10px] text-sand-50 hover:bg-ink-900 transition-colors backdrop-blur-xs font-medium"
                    >
                      Đổi ảnh
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-semibold text-ink-800">
                      Chú thích ảnh {idx + 1}:
                    </label>
                    <input
                      type="text"
                      value={item.caption}
                      onChange={(e) => updateLookbookItem(idx, { caption: e.target.value })}
                      className="w-full rounded-hair border border-sand-300 bg-sand-50 p-1.5 text-xs text-ink-900 focus:outline-none focus:border-ink-900"
                      placeholder="Nắng sớm · Sơ mi voan"
                    />

                    <input
                      type="text"
                      value={item.src}
                      onChange={(e) => updateLookbookItem(idx, { src: e.target.value })}
                      className="w-full rounded-hair border border-sand-300 bg-sand-50 p-1 font-mono text-[10px] text-ink-700 focus:outline-none focus:border-ink-900"
                      placeholder="URL ảnh"
                    />
                  </div>

                  {form.lookbookItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLookbookItem(idx)}
                      className="text-[10px] text-coral-700 hover:underline text-right pt-1"
                    >
                      Xóa ảnh này
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================
         * SECTION 4: BRAND STORY
         * ============================================================ */}
        {activeSection === "story" && (
          <div className="rounded-hair border border-sand-300 bg-sand-50 p-6 space-y-5 animate-fade-in">
            <div className="border-b border-sand-200 pb-3">
              <h3 className="font-display text-sm font-semibold text-ink-900">
                4. Câu chuyện thương hiệu (Brand Story)
              </h3>
              <p className="text-2xs text-ink-600 mt-0.5">
                Khối giới thiệu tinh thần thương hiệu và sứ mệnh thời trang.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-2xs font-semibold text-ink-800 mb-1">
                    Tiêu đề phụ:
                  </label>
                  <input
                    type="text"
                    value={form.brandStoryEyebrow}
                    onChange={(e) => setForm({ ...form, brandStoryEyebrow: e.target.value })}
                    className="w-full rounded-hair border border-sand-300 bg-sand-100/60 p-2 text-xs text-ink-900 focus:outline-none focus:border-ink-900"
                  />
                </div>

                <div>
                  <label className="block text-2xs font-semibold text-ink-800 mb-1">
                    Tiêu đề chính:
                  </label>
                  <input
                    type="text"
                    value={form.brandStoryTitle}
                    onChange={(e) => setForm({ ...form, brandStoryTitle: e.target.value })}
                    className="w-full rounded-hair border border-sand-300 bg-sand-100/60 p-2 text-xs font-semibold text-ink-900 focus:outline-none focus:border-ink-900"
                  />
                </div>

                <div>
                  <label className="block text-2xs font-semibold text-ink-800 mb-1">
                    Trích dẫn tâm niệm (Quote):
                  </label>
                  <textarea
                    rows={2}
                    value={form.brandStoryQuote}
                    onChange={(e) => setForm({ ...form, brandStoryQuote: e.target.value })}
                    className="w-full rounded-hair border border-sand-300 bg-sand-100/60 p-2 text-xs text-ink-900 focus:outline-none focus:border-ink-900 italic font-display"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-2xs font-semibold text-ink-800 mb-1">
                      Nhãn nút CTA:
                    </label>
                    <input
                      type="text"
                      value={form.brandStoryCtaText}
                      onChange={(e) => setForm({ ...form, brandStoryCtaText: e.target.value })}
                      className="w-full rounded-hair border border-sand-300 bg-sand-100/60 p-2 text-xs text-ink-900 focus:outline-none focus:border-ink-900"
                    />
                  </div>
                  <div>
                    <label className="block text-2xs font-semibold text-ink-800 mb-1">
                      Link điều hướng:
                    </label>
                    <input
                      type="text"
                      value={form.brandStoryCtaLink}
                      onChange={(e) => setForm({ ...form, brandStoryCtaLink: e.target.value })}
                      className="w-full rounded-hair border border-sand-300 bg-sand-100/60 p-2 text-xs text-ink-900 focus:outline-none focus:border-ink-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-2xs font-semibold text-ink-800 mb-1">
                    Dòng liên hệ / Hotline:
                  </label>
                  <input
                    type="text"
                    value={form.brandStoryContact}
                    onChange={(e) => setForm({ ...form, brandStoryContact: e.target.value })}
                    className="w-full rounded-hair border border-sand-300 bg-sand-100/60 p-2 text-xs text-ink-900 focus:outline-none focus:border-ink-900"
                  />
                </div>
              </div>

              {/* Ảnh Brand Story */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-2xs font-semibold text-ink-800">
                    Ảnh Câu chuyện:
                  </label>
                  <button
                    type="button"
                    onClick={() => openPicker({ type: "brandStory" })}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-lagoon-700 hover:text-lagoon-800 transition-colors"
                  >
                    <UploadIcon className="h-3 w-3" />
                    <span>Chọn từ Thư viện (Cloudflare &amp; Drive)</span>
                  </button>
                </div>

                <div className="relative aspect-4/5 w-full max-w-sm overflow-hidden rounded-hair border border-sand-300 bg-sand-200">
                  <img
                    src={normalizeGoogleDriveUrl(form.brandStoryImage)}
                    alt="Preview Brand Story"
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/figma-images/brand-story.png";
                    }}
                  />
                </div>

                <input
                  type="text"
                  value={form.brandStoryImage}
                  onChange={(e) => setForm({ ...form, brandStoryImage: e.target.value })}
                  className="w-full rounded-hair border border-sand-300 bg-sand-100/60 p-2 font-mono text-2xs text-ink-900 focus:outline-none focus:border-ink-900"
                />
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
         * SECTION 5: SOCIAL & TIKTOK
         * ============================================================ */}
        {activeSection === "social" && (
          <div className="rounded-hair border border-sand-300 bg-sand-50 p-6 space-y-5 animate-fade-in">
            <div className="border-b border-sand-200 pb-3">
              <h3 className="font-display text-sm font-semibold text-ink-900">
                5. TikTok &amp; Mạng xã hội
              </h3>
              <p className="text-2xs text-ink-600 mt-0.5">
                Số liệu người theo dõi và link kênh TikTok chính thức.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-2xs font-semibold text-ink-800 mb-1">
                  Tiêu đề kênh:
                </label>
                <input
                  type="text"
                  value={form.tiktokEyebrow}
                  onChange={(e) => setForm({ ...form, tiktokEyebrow: e.target.value })}
                  className="w-full rounded-hair border border-sand-300 bg-sand-100/60 p-2 text-xs text-ink-900 focus:outline-none focus:border-ink-900"
                />
              </div>

              <div>
                <label className="block text-2xs font-semibold text-ink-800 mb-1">
                  Nhãn nút Follow:
                </label>
                <input
                  type="text"
                  value={form.tiktokCtaText}
                  onChange={(e) => setForm({ ...form, tiktokCtaText: e.target.value })}
                  className="w-full rounded-hair border border-sand-300 bg-sand-100/60 p-2 text-xs text-ink-900 focus:outline-none focus:border-ink-900"
                />
              </div>

              <div>
                <label className="block text-2xs font-semibold text-ink-800 mb-1">
                  Số lượng người theo dõi (Followers display):
                </label>
                <input
                  type="text"
                  value={form.tiktokFollowersText}
                  onChange={(e) => setForm({ ...form, tiktokFollowersText: e.target.value })}
                  className="w-full rounded-hair border border-sand-300 bg-sand-100/60 p-2 text-xs text-ink-900 focus:outline-none focus:border-ink-900"
                />
              </div>

              <div>
                <label className="block text-2xs font-semibold text-ink-800 mb-1">
                  Số lượng lượt thích (Likes display):
                </label>
                <input
                  type="text"
                  value={form.tiktokLikesText}
                  onChange={(e) => setForm({ ...form, tiktokLikesText: e.target.value })}
                  className="w-full rounded-hair border border-sand-300 bg-sand-100/60 p-2 text-xs text-ink-900 focus:outline-none focus:border-ink-900"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-2xs font-semibold text-ink-800 mb-1">
                  Đường dẫn kênh TikTok (URL):
                </label>
                <input
                  type="url"
                  value={form.tiktokUrl}
                  onChange={(e) => setForm({ ...form, tiktokUrl: e.target.value })}
                  className="w-full rounded-hair border border-sand-300 bg-sand-100/60 p-2 text-xs font-mono text-ink-900 focus:outline-none focus:border-ink-900"
                />
              </div>
            </div>
          </div>
        )}

        {/* Nút lưu cuối trang */}
        <div className="flex justify-end gap-2 border-t border-sand-200 pt-4">
          <Button type="button" variant="ghost" size="sm" onClick={handleResetToDefault}>
            Khôi phục mặc định
          </Button>
          <Button type="submit" variant="primary" size="sm">
            Lưu cài đặt Trang chủ
          </Button>
        </div>
      </form>

      {/* Media Picker Modal */}
      {isMediaPickerOpen && (
        <div className="fixed inset-0 z-90 flex items-center justify-center bg-ink-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-4xl rounded-hair bg-sand-50 p-6 shadow-2xl border border-sand-300 animate-reveal-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-sand-200 pb-3 mb-4">
              <div>
                <h3 className="font-display text-base font-semibold text-ink-900">
                  Chọn ảnh cho Trang chủ (Google Drive &amp; Cloudflare)
                </h3>
                <p className="text-2xs text-ink-600 mt-0.5">
                  Bấm nút &quot;Chọn&quot; trên bất kỳ ảnh nào để gán ngay vào mục đang chỉnh sửa.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsMediaPickerOpen(false);
                  setPickerTarget(null);
                }}
                className="text-ink-500 hover:text-ink-900"
              >
                <CloseIcon className="h-4 w-4" />
              </button>
            </div>

            <CloudflareImageUploader onSelectImage={handleSelectImageFromPicker} />
          </div>
        </div>
      )}
    </div>
  );
}
