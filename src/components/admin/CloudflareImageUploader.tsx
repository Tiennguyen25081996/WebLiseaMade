import { useState, useEffect, useRef } from "react";
import {
  type MediaImage,
  getMediaImages,
  uploadMultipleMediaImages,
  deleteMediaImage,
  importGoogleDriveLinks,
  getGoogleDriveWebhookUrl,
  setGoogleDriveWebhookUrl,
  GOOGLE_APPS_SCRIPT_TEMPLATE,
  extractGoogleDriveFileId,
  getOfflineImages,
  syncOfflineImagesToCloudflare,
  seedLibraryWithSampleImages,
} from "@/lib/media-api";
import {
  getProductsUsingImage,
  removeImageUrlFromProducts,
} from "@/lib/admin-store";
import { Button } from "@/components/ui/Button";
import {
  UploadIcon,
  ImageIcon,
  CopyIcon,
  CheckIcon,
  TrashIcon,
  SearchIcon,
  SparkleIcon,
  CloseIcon,
} from "@/components/ui/icons";

export interface CloudflareImageUploaderProps {
  /** Callback khi người dùng bấm chọn 1 ảnh để điền vào form sản phẩm */
  onSelectImage?: (url: string) => void;
  /** Callback khi người dùng bấm chèn nhiều ảnh đã chọn vào form sản phẩm */
  onSelectImages?: (urls: string[]) => void;
  className?: string;
}

export function CloudflareImageUploader({
  onSelectImage,
  onSelectImages,
  className = "",
}: CloudflareImageUploaderProps) {
  const [images, setImages] = useState<MediaImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    total: number;
    current: number;
    filename: string;
  } | null>(null);

  // Tabs: upload file / nhập link google drive / cài đặt
  const [activeTab, setActiveTab] = useState<"upload" | "import_drive">("upload");
  const [driveLinksText, setDriveLinksText] = useState("");
  const [isImportingDrive, setIsImportingDrive] = useState(false);

  // Cấu hình Google Drive Webhook
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [isCopiedScript, setIsCopiedScript] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MediaImage | null>(null);
  const [isBatchDeleting, setIsBatchDeleting] = useState(false);
  const [showBatchDeleteModal, setShowBatchDeleteModal] = useState(false);
  const [selectedUrls, setSelectedUrls] = useState<string[]>([]);
  const [offlineCount, setOfflineCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const loadImages = async () => {
    setIsLoading(true);
    try {
      const data = await getMediaImages();
      setImages(data);
      setOfflineCount(getOfflineImages().length);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncOffline = async () => {
    setIsSyncing(true);
    showToast("Đang đồng bộ ảnh lên Cloudflare D1...");
    try {
      const res = await syncOfflineImagesToCloudflare();
      showToast(`Đã đồng bộ ${res.synced} ảnh lên Cloudflare D1!`);
      await loadImages();
    } catch {
      showToast("Lỗi đồng bộ. Hãy kiểm tra kết nối.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSeedSamples = async () => {
    setIsSeeding(true);
    showToast("Đang nạp bộ ảnh mẫu của shop vào Cloudflare...");
    try {
      const res = await seedLibraryWithSampleImages();
      showToast(`Đã nạp ${res.count} ảnh mẫu vào Cloudflare D1!`);
      await loadImages();
    } catch {
      showToast("Không thể nạp ảnh mẫu.");
    } finally {
      setIsSeeding(false);
    }
  };

  useEffect(() => {
    loadImages();
    setWebhookUrl(getGoogleDriveWebhookUrl());
  }, []);

  const handleFiles = async (files: FileList | File[]) => {
    const rawList = Array.from(files);
    if (rawList.length === 0) return;

    setIsUploading(true);
    setUploadProgress({
      total: rawList.length,
      current: 1,
      filename: rawList[0].name,
    });

    const isDriveActive = Boolean(getGoogleDriveWebhookUrl());

    const { successful, failed } = await uploadMultipleMediaImages(
      rawList,
      (progress) => {
        setUploadProgress(progress);
      }
    );

    setIsUploading(false);
    setUploadProgress(null);

    if (successful.length > 0) {
      const destination = isDriveActive ? "Google Drive & Cloudflare D1" : "Cloudflare";
      showToast(`Đã tải lên thành công ${successful.length}/${rawList.length} ảnh lên ${destination}!`);
      await loadImages();
    }

    if (failed.length > 0) {
      const firstErr = failed[0].error;
      showToast(
        failed.length === 1
          ? `Lỗi tải ảnh: ${firstErr}`
          : `Có ${failed.length} ảnh bị lỗi (${firstErr})`
      );
    }
  };

  const handleImportDriveLinks = async () => {
    const urls = driveLinksText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    if (urls.length === 0) {
      showToast("Vui lòng nhập ít nhất một đường dẫn Google Drive!");
      return;
    }

    setIsImportingDrive(true);
    const { successful, failed } = await importGoogleDriveLinks(urls);
    setIsImportingDrive(false);

    if (successful.length > 0) {
      showToast(`Đã nhập thành công ${successful.length} ảnh Google Drive vào Cloudflare!`);
      setDriveLinksText("");
      await loadImages();
    }

    if (failed.length > 0) {
      showToast(`Có ${failed.length} link không hợp lệ hoặc lỗi trích xuất ID.`);
    }
  };

  const handleSaveWebhook = () => {
    setGoogleDriveWebhookUrl(webhookUrl);
    setShowConfigModal(false);
    showToast(
      webhookUrl.trim()
        ? "Đã lưu Google Drive Webhook URL!"
        : "Đã hủy cấu hình Google Drive Webhook, chuyển về lưu trữ mặc định."
    );
  };

  const handleCopyScriptTemplate = async () => {
    try {
      await navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_TEMPLATE);
      setIsCopiedScript(true);
      showToast("Đã sao chép mã nguồn Google Apps Script!");
      setTimeout(() => setIsCopiedScript(false), 2500);
    } catch {
      showToast("Không thể sao chép mã nguồn.");
    }
  };

  const handleCopyUrl = async (url: string, id: string) => {
    try {
      const fullUrl = url.startsWith("http")
        ? url
        : typeof window !== "undefined"
          ? `${window.location.origin}${url}`
          : url;
      await navigator.clipboard.writeText(fullUrl);
      setCopiedId(id);
      showToast("Đã sao chép đường dẫn ảnh vào bộ nhớ tạm!");
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      showToast("Không thể sao chép, vui lòng thử lại.");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const ok = await deleteMediaImage(deleteTarget.id);
      if (ok) {
        setImages((prev) => prev.filter((img) => img.id !== deleteTarget.id));
        setSelectedUrls((prev) => prev.filter((u) => u !== deleteTarget.url));

        // Tự động gỡ ảnh khỏi các sản phẩm đang gắn link ảnh này
        const { affectedCount } = removeImageUrlFromProducts(deleteTarget.url);

        showToast(
          affectedCount > 0
            ? `Đã xóa ảnh và gỡ khỏi ${affectedCount} sản phẩm liên quan!`
            : `Đã xóa ảnh "${deleteTarget.filename}"!`
        );
      } else {
        showToast("Xóa ảnh không thành công, vui lòng thử lại.");
      }
    } catch {
      showToast("Lỗi khi xóa ảnh.");
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleBatchDelete = async () => {
    if (selectedUrls.length === 0) return;
    setIsBatchDeleting(true);
    try {
      const targets = images.filter((img) => selectedUrls.includes(img.url));
      let successCount = 0;
      let totalAffected = 0;

      for (const img of targets) {
        const ok = await deleteMediaImage(img.id);
        if (ok) {
          successCount++;
          const { affectedCount } = removeImageUrlFromProducts(img.url);
          totalAffected += affectedCount;
        }
      }

      setImages((prev) => prev.filter((img) => !selectedUrls.includes(img.url)));
      setSelectedUrls([]);

      showToast(
        totalAffected > 0
          ? `Đã xóa ${successCount} ảnh và gỡ khỏi ${totalAffected} sản phẩm liên quan!`
          : `Đã xóa ${successCount} ảnh khỏi Cloudflare!`
      );
    } catch {
      showToast("Lỗi khi xóa hàng loạt ảnh.");
    } finally {
      setIsBatchDeleting(false);
      setShowBatchDeleteModal(false);
    }
  };

  const formatSize = (bytes: number): string => {
    if (bytes <= 0) return "Google Drive";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isGoogleDriveImage = (url: string) => {
    return (
      url.includes("googleusercontent.com") ||
      url.includes("drive.google.com") ||
      Boolean(extractGoogleDriveFileId(url))
    );
  };

  const filteredImages = images.filter((img) => {
    const q = searchQuery.toLowerCase();
    return img.filename.toLowerCase().includes(q) || img.id.toLowerCase().includes(q);
  });

  const allFilteredSelected =
    filteredImages.length > 0 &&
    filteredImages.every((img) => selectedUrls.includes(img.url));

  const handleToggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedUrls((prev) =>
        prev.filter((u) => !filteredImages.some((img) => img.url === u))
      );
    } else {
      const set = new Set([...selectedUrls, ...filteredImages.map((img) => img.url)]);
      setSelectedUrls(Array.from(set));
    }
  };

  const hasConfiguredDrive = Boolean(getGoogleDriveWebhookUrl());

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Toast Notification */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-90 flex items-center gap-2 rounded-hair bg-ink-900 px-5 py-3 text-xs text-sand-50 shadow-xl animate-reveal-up"
        >
          <CheckIcon className="h-4 w-4 text-lagoon-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* Cloudflare & Google Drive Connection Info Banner */}
      <div className="rounded-hair border border-sand-300 bg-sand-100 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-hair bg-lagoon-100 text-lagoon-800">
              <SparkleIcon className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-sm font-semibold text-ink-900">
                  Cloudflare Media Hub
                </span>
                <span className="text-xs text-ink-500 font-normal">
                  (Tích hợp Google Drive)
                </span>
                {hasConfiguredDrive ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-800">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-600" />
                    Drive Webhook: Đã kết nối
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-800">
                    Hỗ trợ dán link Drive & Webhook
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-ink-600">
                Lưu trữ ảnh trên Google Drive, link lưu vào Cloudflare D1 để tránh giới hạn dung lượng database.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowConfigModal(true)}
              className="rounded-hair border border-sand-300 bg-sand-50 px-3 py-1.5 text-xs font-medium text-ink-800 hover:bg-sand-200 transition-colors"
            >
              ⚙️ Cấu hình Drive Webhook
            </button>
            <div className="flex items-center gap-1 text-[11px] font-mono text-ink-600 bg-sand-50 border border-sand-200 px-2.5 py-1.5 rounded-hair">
              <span>DB: prod-d1-tutorial</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cảnh báo ảnh offline chưa đồng bộ lên Cloudflare D1 */}
      {offlineCount > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-hair border border-amber-300 bg-amber-50 p-3.5 text-xs text-amber-900 animate-reveal-up">
          <div className="flex items-center gap-2">
            <span className="text-base">⚠️</span>
            <div>
              <p className="font-semibold">
                Phát hiện {offlineCount} ảnh đang lưu tạm trên trình duyệt của bạn
              </p>
              <p className="text-2xs text-amber-800">
                Những ảnh này người khác chưa xem được vì chưa đẩy lên Cloudflare D1. Hãy bấm đồng bộ để lưu vĩnh viễn lên server.
              </p>
            </div>
          </div>
          <Button
            variant="primary"
            size="sm"
            disabled={isSyncing}
            onClick={handleSyncOffline}
          >
            {isSyncing ? "Đang đồng bộ..." : "Đồng bộ lên Cloudflare D1 ngay"}
          </Button>
        </div>
      )}

      {/* Tabs Chuyển Đổi Phương Thức Tải Ảnh */}
      <div className="flex border-b border-sand-300">
        <button
          type="button"
          onClick={() => setActiveTab("upload")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === "upload"
              ? "border-lagoon-700 text-lagoon-900 bg-sand-100/60"
              : "border-transparent text-ink-600 hover:text-ink-900"
          }`}
        >
          <UploadIcon className="h-4 w-4" />
          <span>Tải file ảnh từ máy tính</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("import_drive")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === "import_drive"
              ? "border-lagoon-700 text-lagoon-900 bg-sand-100/60"
              : "border-transparent text-ink-600 hover:text-ink-900"
          }`}
        >
          <span>🔗 Nhập link Google Drive</span>
          <span className="rounded-full bg-lagoon-100 px-1.5 py-0.2 text-[10px] text-lagoon-800 font-medium">
            Tiết kiệm quota
          </span>
        </button>
      </div>

      {/* Tab 1: Kéo thả file upload */}
      {activeTab === "upload" && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            if (e.dataTransfer.files) {
              handleFiles(e.dataTransfer.files);
            }
          }}
          className={`relative flex flex-col items-center justify-center rounded-hair border-2 border-dashed p-8 text-center transition-all ${
            dragOver
              ? "border-lagoon-600 bg-lagoon-50/50 scale-[1.005]"
              : "border-sand-300 bg-sand-50/80 hover:border-ink-900/40 hover:bg-sand-100/50"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,.png,.jpg,.jpeg,.webp,.gif"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) {
                handleFiles(e.target.files);
              }
            }}
          />

          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sand-200 text-ink-800 mb-3">
            <UploadIcon className="h-6 w-6" />
          </div>

          <h3 className="font-display text-sm font-semibold text-ink-900">
            Kéo thả ảnh vào đây hoặc nhấp để tải lên
          </h3>
          <p className="mt-1 text-xs text-ink-500 max-w-sm">
            Hỗ trợ PNG, JPG, WEBP, GIF. {hasConfiguredDrive ? "Ảnh sẽ tự động upload lên Google Drive và lưu link vào D1." : "Cho phép chọn nhiều ảnh cùng lúc, tối đa 10MB mỗi ảnh."}
          </p>

          {/* Thanh tiến trình tải nhiều ảnh */}
          {uploadProgress && (
            <div className="w-full max-w-md mt-4 space-y-1.5 rounded-hair border border-sand-300 bg-sand-100 p-3 text-left animate-reveal-up">
              <div className="flex items-center justify-between text-2xs text-ink-700">
                <span className="font-medium truncate max-w-[240px]">
                  Đang tải ({uploadProgress.current}/{uploadProgress.total}): {uploadProgress.filename}
                </span>
                <span className="font-mono text-lagoon-700 font-semibold">
                  {Math.round((uploadProgress.current / uploadProgress.total) * 100)}%
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-sand-200">
                <div
                  className="h-full bg-lagoon-600 transition-all duration-300"
                  style={{
                    width: `${(uploadProgress.current / uploadProgress.total) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}

          <div className="mt-4 flex items-center gap-3">
            <Button
              variant="primary"
              size="sm"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {isUploading ? "Đang tải ảnh lên Cloudflare..." : "+ Chọn ảnh từ máy"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={loadImages}
              disabled={isLoading || isUploading}
            >
              Làm mới
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleSeedSamples}
              disabled={isSeeding || isUploading}
            >
              {isSeeding ? "Đang nạp ảnh..." : "+ Nạp bộ ảnh mẫu của shop"}
            </Button>
          </div>
        </div>
      )}

      {/* Tab 2: Nhập danh sách link Google Drive */}
      {activeTab === "import_drive" && (
        <div className="rounded-hair border border-sand-300 bg-sand-50 p-6 space-y-4">
          <div>
            <h4 className="font-display text-sm font-semibold text-ink-900">
              Dán liên kết ảnh từ Google Drive
            </h4>
            <p className="text-xs text-ink-600 mt-1">
              Bạn có thể dán 1 hoặc nhiều link chia sẻ từ Google Drive (mỗi dòng một link). Hệ thống sẽ tự động trích xuất File ID và tạo liên kết trực tiếp (Google High-speed CDN) lưu vào Cloudflare D1.
            </p>
          </div>

          <textarea
            rows={4}
            value={driveLinksText}
            onChange={(e) => setDriveLinksText(e.target.value)}
            placeholder={`https://drive.google.com/file/d/1A2B3C4D5E.../view?usp=sharing\nhttps://drive.google.com/file/d/6F7G8H9I0J.../view`}
            className="w-full rounded-hair border border-sand-300 bg-sand-100/50 p-3 text-xs font-mono text-ink-900 focus:outline-none focus:border-ink-900"
          />

          <div className="flex items-center justify-between">
            <span className="text-2xs text-ink-500">
              * Lưu ý: Hãy đảm bảo các file trên Drive đã được bật quyền "Bất kỳ ai có đường liên kết đều có thể xem".
            </span>
            <Button
              variant="primary"
              size="sm"
              disabled={isImportingDrive || !driveLinksText.trim()}
              onClick={handleImportDriveLinks}
            >
              {isImportingDrive ? "Đang chuyển đổi và lưu..." : "Chuyển đổi & Lưu vào D1"}
            </Button>
          </div>
        </div>
      )}

      {/* Gallery Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-sand-200 pb-3">
          <div className="flex items-center gap-2">
            <h3 className="font-display text-base font-semibold text-ink-900">
              Thư viện ảnh đã tải lên
            </h3>
            <span className="rounded-full bg-sand-200 px-2 py-0.5 text-2xs font-semibold text-ink-700">
              {images.length} ảnh
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {filteredImages.length > 0 && (
              <button
                type="button"
                onClick={handleToggleSelectAll}
                className="rounded-hair border border-sand-300 bg-sand-50 px-2.5 py-1.5 text-xs text-ink-700 hover:bg-sand-100 whitespace-nowrap"
              >
                {allFilteredSelected ? "Bỏ chọn tất cả" : "Chọn tất cả"}
              </button>
            )}

            <div className="relative flex-1 sm:w-64">
              <input
                type="text"
                placeholder="Tìm theo tên file..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-hair border border-sand-300 bg-sand-50 pl-8 pr-3 py-1.5 text-xs text-ink-900 focus:outline-none focus:border-ink-900"
              />
              <SearchIcon className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-ink-400" />
            </div>
          </div>
        </div>

        {/* Thanh tác vụ khi chọn nhiều ảnh */}
        {selectedUrls.length > 0 && (
          <div className="sticky top-2 z-30 flex flex-wrap items-center justify-between gap-2 rounded-hair border border-lagoon-600 bg-lagoon-50 px-4 py-2.5 shadow-md animate-reveal-up">
            <div className="flex items-center gap-2 text-xs font-medium text-lagoon-900">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-lagoon-700 text-sand-50 text-[11px] font-bold">
                {selectedUrls.length}
              </span>
              <span>ảnh đã được chọn</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedUrls([])}
                className="text-xs text-ink-600 hover:text-ink-900 px-2 py-1"
              >
                Bỏ chọn
              </button>
              {(onSelectImages || onSelectImage) && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    if (onSelectImages) {
                      onSelectImages(selectedUrls);
                    } else if (onSelectImage && selectedUrls[0]) {
                      onSelectImage(selectedUrls[0]);
                    }
                    setSelectedUrls([]);
                  }}
                >
                  ✓ Thêm {selectedUrls.length} ảnh vào sản phẩm
                </Button>
              )}
              <Button
                variant="danger"
                size="sm"
                onClick={() => setShowBatchDeleteModal(true)}
              >
                Xóa {selectedUrls.length} ảnh
              </Button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="rounded-hair border border-sand-300 bg-sand-100 p-10 text-center text-xs text-ink-500">
            Đang đồng bộ ảnh từ Cloudflare...
          </div>
        ) : filteredImages.length === 0 ? (
          <div className="rounded-hair border border-sand-300 bg-sand-100 p-8 text-center text-xs text-ink-600 space-y-3">
            <p>
              {searchQuery
                ? "Không tìm thấy ảnh phù hợp với từ khóa."
                : "Chưa có ảnh nào trên Cloudflare D1. Hãy tải ảnh lên hoặc bấm nạp sẵn bộ ảnh mẫu của shop!"}
            </p>
            {!searchQuery && (
              <Button
                variant="primary"
                size="sm"
                disabled={isSeeding}
                onClick={handleSeedSamples}
              >
                {isSeeding ? "Đang nạp..." : "+ Nạp ngay bộ ảnh mẫu vào Cloudflare D1"}
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredImages.map((img) => {
              const isCopied = copiedId === img.id;
              const isSelected = selectedUrls.includes(img.url);
              const isDrive = isGoogleDriveImage(img.url);

              return (
                <div
                  key={img.id}
                  className={`group relative flex flex-col overflow-hidden rounded-hair border bg-sand-50 shadow-2xs transition-all ${
                    isSelected
                      ? "border-lagoon-600 ring-2 ring-lagoon-600"
                      : "border-sand-300 hover:border-ink-900/60"
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-square w-full overflow-hidden bg-sand-200">
                    <img
                      src={img.url}
                      alt={img.filename}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/figma-images/catalog-1.png";
                      }}
                    />

                    {/* Checkbox chọn nhiều ảnh */}
                    <label
                      className="absolute top-2 left-2 z-10 flex h-6 w-6 items-center justify-center rounded-hair bg-sand-50/90 shadow-sm cursor-pointer hover:bg-sand-100"
                      onClick={(e) => e.stopPropagation()}
                      title="Chọn ảnh"
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          e.stopPropagation();
                          if (e.target.checked) {
                            setSelectedUrls((prev) => [...prev, img.url]);
                          } else {
                            setSelectedUrls((prev) => prev.filter((u) => u !== img.url));
                          }
                        }}
                        className="h-3.5 w-3.5 accent-lagoon-700 cursor-pointer"
                      />
                    </label>

                    {/* Badge nguồn ảnh */}
                    {isDrive && (
                      <span className="absolute bottom-2 left-2 z-10 rounded bg-ink-900/70 px-1.5 py-0.5 text-[9px] font-medium text-sand-50 backdrop-blur-xs">
                        Drive
                      </span>
                    )}

                    {/* Nút xóa đơn lẻ */}
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(img)}
                        className="rounded-hair bg-sand-50/90 p-1.5 text-coral-700 shadow-sm hover:bg-coral-50 hover:text-coral-800 transition-colors"
                        title="Xóa ảnh"
                      >
                        <TrashIcon className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex flex-1 flex-col p-3">
                    <p
                      className="text-xs font-medium text-ink-900 truncate"
                      title={img.filename}
                    >
                      {img.filename}
                    </p>
                    <div className="mt-1 flex items-center justify-between text-[10px] text-ink-500 font-mono">
                      <span>{formatSize(img.size)}</span>
                      <span>{img.createdAt.slice(0, 10)}</span>
                    </div>

                    {/* Actions */}
                    <div className="mt-3 flex items-center gap-1.5 pt-2 border-t border-sand-200">
                      <button
                        type="button"
                        onClick={() => handleCopyUrl(img.url, img.id)}
                        className={`flex-1 flex items-center justify-center gap-1 rounded-hair py-1 px-2 text-[11px] font-medium transition-colors ${
                          isCopied
                            ? "bg-green-100 text-green-800 font-semibold"
                            : "bg-sand-200 text-ink-700 hover:bg-ink-900 hover:text-sand-50"
                        }`}
                        title="Sao chép đường dẫn ảnh"
                      >
                        {isCopied ? (
                          <>
                            <CheckIcon className="h-3 w-3" />
                            <span>Đã chép</span>
                          </>
                        ) : (
                          <>
                            <CopyIcon className="h-3 w-3" />
                            <span>Chép URL</span>
                          </>
                        )}
                      </button>

                      {onSelectImage && (
                        <button
                          type="button"
                          onClick={() => onSelectImage(img.url)}
                          className="rounded-hair bg-lagoon-600 px-2 py-1 text-[11px] font-medium text-sand-50 hover:bg-lagoon-700 transition-colors"
                          title="Chọn ảnh này làm ảnh chính"
                        >
                          Chọn
                        </button>
                      )}

                      <a
                        href={img.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="rounded-hair border border-sand-300 p-1 text-ink-600 hover:text-ink-900 hover:border-ink-900 transition-colors"
                        title="Xem ảnh gốc"
                      >
                        <ImageIcon className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Cài Đặt Google Drive Webhook */}
      {showConfigModal && (
        <div className="fixed inset-0 z-90 flex items-center justify-center bg-ink-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-hair bg-sand-50 p-6 shadow-2xl border border-sand-300 animate-reveal-up max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-sand-200 pb-3">
              <h3 className="font-display text-base font-semibold text-ink-900">
                Cấu hình lưu ảnh lên Google Drive
              </h3>
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="text-ink-500 hover:text-ink-900"
              >
                <CloseIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="text-xs text-ink-700 space-y-3">
              <p>
                Để ảnh tự động tải lên Google Drive của bạn và lưu link vào Cloudflare D1 (không lo hết hạn ngạch DB), bạn chỉ cần triển khai 1 Google Apps Script nhỏ (miễn phí 100%):
              </p>

              <div className="rounded-hair bg-sand-100 p-3 space-y-2 border border-sand-200">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-ink-900">Mã Google Apps Script (Apps Script code):</span>
                  <button
                    type="button"
                    onClick={handleCopyScriptTemplate}
                    className="text-lagoon-700 hover:underline font-medium"
                  >
                    {isCopiedScript ? "✓ Đã sao chép!" : "Sao chép mã"}
                  </button>
                </div>
                <pre className="max-h-36 overflow-y-auto font-mono text-[10px] bg-sand-200 p-2 rounded text-ink-800">
                  {GOOGLE_APPS_SCRIPT_TEMPLATE}
                </pre>
              </div>

              <ol className="list-decimal list-inside space-y-1 text-2xs text-ink-600">
                <li>Truy cập <a href="https://script.google.com" target="_blank" rel="noreferrer" className="text-lagoon-700 underline">script.google.com</a> và tạo project mới.</li>
                <li>Dán đoạn mã trên vào rồi bấm <strong>Triển khai (Deploy) &gt; Tùy chọn triển khai mới (New deployment)</strong>.</li>
                <li>Chọn loại: <strong>Ứng dụng web (Web app)</strong>, quyền truy cập: <strong>Bất kỳ ai (Anyone)</strong>.</li>
                <li>Sao chép URL ứng dụng web nhận được và dán vào ô bên dưới:</li>
              </ol>

              <div>
                <label className="block text-2xs font-semibold text-ink-800 mb-1">
                  Google Apps Script Webhook URL:
                </label>
                <input
                  type="url"
                  placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="w-full rounded-hair border border-sand-300 bg-sand-100 p-2 font-mono text-xs text-ink-900 focus:outline-none focus:border-ink-900"
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2 border-t border-sand-200 pt-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowConfigModal(false)}
              >
                Đóng
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveWebhook}
              >
                Lưu cấu hình
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal (Đơn lẻ) */}
      {deleteTarget && (() => {
        const usingProducts = getProductsUsingImage(deleteTarget.url);
        return (
          <div className="fixed inset-0 z-90 flex items-center justify-center bg-ink-900/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-sm rounded-hair bg-sand-50 p-6 shadow-2xl border border-sand-300 animate-reveal-up">
              <h3 className="font-display text-base text-ink-900">Xác nhận xóa ảnh?</h3>
              <p className="mt-2 text-xs text-ink-600">
                Bạn có chắc chắn muốn xóa ảnh{" "}
                <strong className="text-ink-900 font-semibold">{deleteTarget.filename}</strong> trên Cloudflare? Thao tác này không thể hoàn tác.
              </p>

              {usingProducts.length > 0 && (
                <div className="mt-3 rounded-hair bg-amber-50 border border-amber-200 p-2.5 text-2xs text-amber-900 space-y-1">
                  <span className="font-semibold block">
                    ⚠️ Ảnh đang được dùng bởi {usingProducts.length} sản phẩm:
                  </span>
                  <span className="block truncate font-medium">
                    {usingProducts.map((p) => p.name).join(", ")}
                  </span>
                  <span className="block text-amber-700">
                    Xóa ảnh này sẽ tự động gỡ ảnh khỏi các sản phẩm trên.
                  </span>
                </div>
              )}

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
                  onClick={handleDelete}
                >
                  Xóa ngay
                </Button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Batch Delete Confirmation Modal (Hàng loạt) */}
      {showBatchDeleteModal && (
        <div className="fixed inset-0 z-90 flex items-center justify-center bg-ink-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-hair bg-sand-50 p-6 shadow-2xl border border-sand-300 animate-reveal-up">
            <h3 className="font-display text-base text-ink-900">Xác nhận xóa hàng loạt?</h3>
            <p className="mt-2 text-xs text-ink-600">
              Bạn có chắc chắn muốn xóa <strong className="text-ink-900 font-semibold">{selectedUrls.length} ảnh</strong> đã chọn khỏi Cloudflare? Thao tác này không thể hoàn tác.
            </p>

            <div className="mt-6 flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                disabled={isBatchDeleting}
                onClick={() => setShowBatchDeleteModal(false)}
              >
                Hủy
              </Button>
              <Button
                variant="danger"
                size="sm"
                disabled={isBatchDeleting}
                onClick={handleBatchDelete}
              >
                {isBatchDeleting ? "Đang xóa..." : "Xóa tất cả"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
