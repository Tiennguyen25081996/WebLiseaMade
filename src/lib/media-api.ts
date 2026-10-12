export interface MediaImage {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  url: string;
  createdAt: string;
}

const STORAGE_KEY_OFFLINE_IMAGES = "liseamade.admin.media.offline.v1";
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const ALLOWED_IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

function hasAllowedImageExtension(filename: string): boolean {
  const extension = filename.toLowerCase().match(/\.[^.]+$/)?.[0] ?? "";
  return ALLOWED_IMAGE_EXTENSIONS.has(extension);
}

function getOfflineImages(): MediaImage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_OFFLINE_IMAGES);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveOfflineImage(img: MediaImage): void {
  if (typeof window === "undefined") return;
  const current = getOfflineImages();
  const next = [img, ...current.filter((item) => item.id !== img.id)].slice(0, 50);
  localStorage.setItem(STORAGE_KEY_OFFLINE_IMAGES, JSON.stringify(next));
}

function removeOfflineImage(id: string): void {
  if (typeof window === "undefined") return;
  const current = getOfflineImages();
  localStorage.setItem(
    STORAGE_KEY_OFFLINE_IMAGES,
    JSON.stringify(current.filter((item) => item.id !== id)),
  );
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Tải ảnh lên Cloudflare D1 / Images API.
 * Hỗ trợ fallback offline qua data URL để đảm bảo trải nghiệm người dùng luôn thông suốt.
 */
export async function uploadMediaImage(file: File): Promise<{
  success: boolean;
  image: MediaImage;
  source: "remote" | "local_fallback";
  error?: string;
}> {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new Error("Định dạng ảnh không được hỗ trợ. Chỉ chấp nhận JPG, PNG, WEBP, GIF.");
  }

  if (!hasAllowedImageExtension(file.name)) {
    throw new Error("Phần mở rộng file ảnh không hợp lệ");
  }

  if (file.size > 10 * 1024 * 1024) {
    throw new Error("Dung lượng ảnh vượt quá giới hạn 10MB");
  }

  const base64Data = await fileToBase64(file);

  try {
    const res = await fetch("/api/upload", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        file: base64Data,
        filename: file.name,
        mimeType: file.type,
      }),
    });

    if (res.ok) {
      const data = await res.json().catch(() => null);
      if (data && data.success && data.image) {
        const img: MediaImage = {
          id: data.image.id,
          filename: data.image.filename || file.name,
          mimeType: data.image.mimeType || file.type,
          size: data.image.size || file.size,
          url: data.image.url,
          createdAt: data.image.createdAt || new Date().toISOString(),
        };
        return {
          success: true,
          image: img,
          source: "remote",
        };
      }
    }
  } catch {
    // Không thể kết nối tới server -> tiếp tục fallback
  }

  // Fallback sang lưu trữ data URI cục bộ (giữ ảnh hoạt động ngay cả khi offline)
  const fallbackImg: MediaImage = {
    id: `local_img_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    filename: file.name,
    mimeType: file.type,
    size: file.size,
    url: base64Data,
    createdAt: new Date().toISOString(),
  };

  saveOfflineImage(fallbackImg);

  return {
    success: true,
    image: fallbackImg,
    source: "local_fallback",
  };
}

/**
 * Lấy danh sách ảnh đã upload trên Cloudflare.
 */
export async function getMediaImages(): Promise<MediaImage[]> {
  const offline = getOfflineImages();

  try {
    const res = await fetch("/api/images");
    if (res.ok) {
      const data = await res.json().catch(() => null);
      if (data && data.success && Array.isArray(data.images)) {
        const remoteImages: MediaImage[] = data.images.map((img: Record<string, unknown>) => ({
          id: String(img.id),
          filename: String(img.filename || "image.png"),
          mimeType: String(img.mime_type || img.mimeType || "image/png"),
          size: Number(img.size) || 0,
          url: String(img.url),
          createdAt: String(img.created_at || img.createdAt || new Date().toISOString()),
        }));

        // Gộp ảnh remote và offline (loại bỏ trùng lặp ID)
        const map = new Map<string, MediaImage>();
        for (const img of remoteImages) {
          map.set(img.id, img);
        }
        for (const img of offline) {
          if (!map.has(img.id)) {
            map.set(img.id, img);
          }
        }
        return Array.from(map.values()).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
      }
    }
  } catch {
    // Offline
  }

  return offline;
}

/**
 * Xóa ảnh theo ID trên Cloudflare.
 */
export async function deleteMediaImage(id: string): Promise<boolean> {
  removeOfflineImage(id);

  try {
    const res = await fetch(`/api/images/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (res.ok) {
      const data = await res.json().catch(() => null);
      return Boolean(data && data.success);
    }
  } catch {
    // Offline
  }

  return true;
}
