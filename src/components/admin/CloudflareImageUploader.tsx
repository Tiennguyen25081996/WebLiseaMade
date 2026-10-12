import { useState, useEffect, useRef } from "react";
import {
  type MediaImage,
  getMediaImages,
  uploadMediaImage,
  deleteMediaImage,
} from "@/lib/media-api";
import { Button } from "@/components/ui/Button";
import {
  UploadIcon,
  ImageIcon,
  CopyIcon,
  CheckIcon,
  TrashIcon,
  SearchIcon,
  SparkleIcon,
} from "@/components/ui/icons";

interface CloudflareImageUploaderProps {
  /** Callback tùy chọn khi người dùng bấm chọn ảnh để điền vào form sản phẩm */
  onSelectImage?: (url: string) => void;
  className?: string;
}

export function CloudflareImageUploader({
  onSelectImage,
  className = "",
}: CloudflareImageUploaderProps) {
  const [images, setImages] = useState<MediaImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MediaImage | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  const setToastMessage = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const loadImages = async () => {
    setIsLoading(true);
    try {
      const data = await getMediaImages();
      setImages(data);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadImages();
  }, []);

  const handleFiles = async (files: FileList | File[]) => {
    const fileList = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (fileList.length === 0) {
      showToast("Vui lòng chọn file hình ảnh hợp lệ (PNG, JPG, WEBP, GIF, SVG).");
      return;
    }

    setIsUploading(true);
    let successCount = 0;

    for (const file of fileList) {
      try {
        const result = await uploadMediaImage(file);
        if (result.success) {
          successCount++;
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        showToast(`Lỗi: ${msg}`);
      }
    }

    setIsUploading(false);
    if (successCount > 0) {
      showToast(`Đã tải lên thành công ${successCount} ảnh lên Cloudflare!`);
      await loadImages();
    }
  };

  const handleCopyUrl = async (url: string, id: string) => {
    try {
      // Nếu URL là relative, chuyển thành full URL cho tiện paste
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
        showToast(`Đã xóa ảnh "${deleteTarget.filename}"!`);
      } else {
        showToast("Xóa ảnh không thành công, vui lòng thử lại.");
      }
    } catch {
      showToast("Lỗi khi xóa ảnh.");
    } finally {
      setDeleteTarget(null);
    }
  };

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const filteredImages = images.filter((img) => {
    const q = searchQuery.toLowerCase();
    return img.filename.toLowerCase().includes(q) || img.id.toLowerCase().includes(q);
  });

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Toast Notification */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-hair bg-ink-900 px-5 py-3 text-xs text-sand-50 shadow-xl animate-reveal-up"
        >
          <CheckIcon className="h-4 w-4 text-lagoon-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* Cloudflare Connection Info Banner */}
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
                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-800">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-600" />
                  Đang hoạt động
                </span>
              </div>
              <p className="mt-0.5 text-xs text-ink-600">
                Lưu trữ và phân phối hình ảnh qua Cloudflare D1 / CDN tốc độ cao.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-ink-600 bg-sand-50 border border-sand-200 px-3 py-1.5 rounded-hair">
            <span>Account: 64b81bdc...</span>
            <span className="text-sand-400">|</span>
            <span>DB: prod-d1-tutorial</span>
          </div>
        </div>
      </div>

      {/* Drag & Drop Upload Zone */}
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
          accept="image/*"
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
          Hỗ trợ định dạng PNG, JPG, WEBP, GIF, SVG. Dung lượng tối đa 10MB mỗi ảnh.
        </p>

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
        </div>
      </div>

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

          <div className="relative w-full sm:w-64">
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

        {isLoading ? (
          <div className="rounded-hair border border-sand-300 bg-sand-100 p-10 text-center text-xs text-ink-500">
            Đang đồng bộ ảnh từ Cloudflare...
          </div>
        ) : filteredImages.length === 0 ? (
          <div className="rounded-hair border border-sand-300 bg-sand-100 p-10 text-center text-xs text-ink-500">
            {searchQuery
              ? "Không tìm thấy ảnh phù hợp với từ khóa."
              : "Chưa có ảnh nào được tải lên. Hãy kéo thả ảnh hoặc bấm chọn ảnh ở trên!"}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredImages.map((img) => {
              const isCopied = copiedId === img.id;
              return (
                <div
                  key={img.id}
                  className="group relative flex flex-col overflow-hidden rounded-hair border border-sand-300 bg-sand-50 shadow-2xs hover:border-ink-900/60 transition-all"
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-square w-full overflow-hidden bg-sand-200">
                    <img
                      src={img.url}
                      alt={img.filename}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/placeholder-product.jpg";
                      }}
                    />
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
                          title="Chọn ảnh này cho sản phẩm"
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

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-hair bg-sand-50 p-6 shadow-2xl border border-sand-300 animate-reveal-up">
            <h3 className="font-display text-base text-ink-900">Xác nhận xóa ảnh?</h3>
            <p className="mt-2 text-xs text-ink-600">
              Bạn có chắc chắn muốn xóa ảnh{" "}
              <strong className="text-ink-900 font-semibold">{deleteTarget.filename}</strong> trên Cloudflare? Thao tác này không thể hoàn tác.
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
                onClick={handleDelete}
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
