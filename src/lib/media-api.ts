export interface MediaImage {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  url: string;
  createdAt: string;
}

export const STORAGE_KEY_OFFLINE_IMAGES = "liseamade.admin.media.offline.v1";
export const STORAGE_KEY_GDRIVE_WEBHOOK = "liseamade.admin.media.gdrive_webhook.v1";
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const ALLOWED_IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

export const GOOGLE_APPS_SCRIPT_TEMPLATE = `// Google Apps Script (triển khai tại script.google.com -> Web App -> Anyone)
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var base64 = (data.file || "").replace(/^data:[^;]+;base64,/, "");
    var bytes = Utilities.base64Decode(base64);
    var blob = Utilities.newBlob(bytes, data.mimeType || "image/jpeg", data.filename || "image.jpg");
    
    var folder = data.folderId ? DriveApp.getFolderById(data.folderId) : DriveApp.getRootFolder();
    var file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    var fileId = file.getId();
    var directUrl = "https://lh3.googleusercontent.com/d/" + fileId;
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      fileId: fileId,
      url: directUrl,
      filename: file.getName(),
      size: file.getSize()
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}`;

/**
 * Trích xuất File ID từ bất kỳ liên kết chia sẻ Google Drive nào.
 */
export function extractGoogleDriveFileId(url: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  const fileDMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileDMatch && fileDMatch[1]) return fileDMatch[1];

  const idParamMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idParamMatch && idParamMatch[1]) return idParamMatch[1];

  const dMatch = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (dMatch && dMatch[1]) return dMatch[1];

  if (/^[a-zA-Z0-9_-]{25,}$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}

/**
 * Chuyển Google Drive file ID hoặc share link thành URL hình ảnh trực tiếp (Google High-speed CDN).
 */
export function toGoogleDriveDirectUrl(fileIdOrUrl: string): string {
  const fileId = extractGoogleDriveFileId(fileIdOrUrl) || fileIdOrUrl.trim();
  return `https://lh3.googleusercontent.com/d/${fileId}`;
}

/**
 * Chuẩn hóa URL ảnh: nếu là link Google Drive dạng xem trang web, tự động đổi thành direct CDN.
 */
export function normalizeGoogleDriveUrl(url: string): string {
  if (!url) return url;
  const fileId = extractGoogleDriveFileId(url);
  if (fileId) {
    return `https://lh3.googleusercontent.com/d/${fileId}`;
  }
  return url;
}

export function getGoogleDriveWebhookUrl(): string {
  if (typeof window === "undefined") return "";
  try {
    return localStorage.getItem(STORAGE_KEY_GDRIVE_WEBHOOK) || "";
  } catch {
    return "";
  }
}

export function setGoogleDriveWebhookUrl(url: string): void {
  if (typeof window === "undefined") return;
  try {
    if (!url.trim()) {
      localStorage.removeItem(STORAGE_KEY_GDRIVE_WEBHOOK);
    } else {
      localStorage.setItem(STORAGE_KEY_GDRIVE_WEBHOOK, url.trim());
    }
  } catch {
    // ignore
  }
}

function hasAllowedImageExtension(filename: string): boolean {
  const extension = filename.toLowerCase().match(/\.[^.]+$/)?.[0] ?? "";
  return ALLOWED_IMAGE_EXTENSIONS.has(extension);
}

export function getOfflineImages(): MediaImage[] {
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
  const next = [img, ...current.filter((item) => item.id !== img.id)].slice(0, 100);
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
 * Đăng ký link ảnh ngoài (Google Drive, CDN) vào Cloudflare D1.
 * D1 chỉ lưu đường link và metadata, data = NULL để tiết kiệm tối đa dung lượng DB.
 */
export async function saveExternalMediaImage(data: {
  url: string;
  filename?: string;
  mimeType?: string;
  size?: number;
}): Promise<MediaImage> {
  const directUrl = normalizeGoogleDriveUrl(data.url);
  const payload = {
    url: directUrl,
    filename: data.filename || "drive-image.jpg",
    mimeType: data.mimeType || "image/jpeg",
    size: data.size || 0,
  };

  try {
    const res = await fetch("/api/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const json = await res.json().catch(() => null);
      if (json && json.success && json.image) {
        const img: MediaImage = {
          id: json.image.id,
          filename: json.image.filename,
          mimeType: json.image.mimeType,
          size: json.image.size,
          url: json.image.url,
          createdAt: json.image.createdAt || new Date().toISOString(),
        };
        saveOfflineImage(img);
        return img;
      }
    }
  } catch {
    // Offline fallback
  }

  const fallbackImg: MediaImage = {
    id: `gdrive_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    filename: payload.filename,
    mimeType: payload.mimeType,
    size: payload.size,
    url: directUrl,
    createdAt: new Date().toISOString(),
  };
  saveOfflineImage(fallbackImg);
  return fallbackImg;
}

/**
 * Nhập danh sách các đường link Google Drive chia sẻ, chuyển sang direct link và lưu vào Cloudflare D1.
 */
export async function importGoogleDriveLinks(
  urls: string[],
): Promise<{
  successful: MediaImage[];
  failed: Array<{ url: string; error: string }>;
}> {
  const successful: MediaImage[] = [];
  const failed: Array<{ url: string; error: string }> = [];

  for (const raw of urls) {
    const url = raw.trim();
    if (!url) continue;

    const fileId = extractGoogleDriveFileId(url);
    if (!fileId) {
      failed.push({ url, error: "Link không đúng định dạng Google Drive" });
      continue;
    }

    try {
      const img = await saveExternalMediaImage({
        url: toGoogleDriveDirectUrl(fileId),
        filename: `drive-${fileId.slice(0, 8)}.jpg`,
        mimeType: "image/jpeg",
      });
      successful.push(img);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      failed.push({ url, error: message });
    }
  }

  return { successful, failed };
}

/**
 * Tải trực tiếp file ảnh lên Google Drive thông qua Google Apps Script Webhook.
 */
export async function uploadToGoogleDrive(
  file: File,
  customWebhookUrl?: string,
): Promise<{ success: boolean; url: string; filename: string; size: number }> {
  const webhook = customWebhookUrl || getGoogleDriveWebhookUrl();
  if (!webhook) {
    throw new Error("Chưa cấu hình Google Drive Webhook URL");
  }

  const base64Data = await fileToBase64(file);
  const res = await fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({
      file: base64Data,
      filename: file.name,
      mimeType: file.type,
    }),
  });

  const json = (await res.json().catch(() => null)) as {
    success?: boolean;
    url?: string;
    fileId?: string;
    filename?: string;
    size?: number;
    error?: string;
  } | null;

  if (!json || !json.success || !json.url) {
    throw new Error(json?.error || "Không thể tải ảnh lên Google Drive");
  }

  return {
    success: true,
    url: json.url,
    filename: json.filename || file.name,
    size: json.size || file.size,
  };
}

/**
 * Tải ảnh lên Google Drive (nếu đã cấu hình) và lưu liên kết vào Cloudflare D1.
 * Nếu chưa cấu hình Google Drive, tải trực tiếp lên Cloudflare Worker / D1.
 */
export async function uploadMediaImage(file: File): Promise<{
  success: boolean;
  image: MediaImage;
  source: "remote" | "local_fallback" | "google_drive";
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

  // 1. Thử tải lên Google Drive nếu đã có Webhook URL
  const gdriveWebhook = getGoogleDriveWebhookUrl();
  if (gdriveWebhook) {
    try {
      const gdriveRes = await uploadToGoogleDrive(file, gdriveWebhook);
      const savedImg = await saveExternalMediaImage({
        url: gdriveRes.url,
        filename: gdriveRes.filename,
        mimeType: file.type,
        size: gdriveRes.size,
      });
      return {
        success: true,
        image: savedImg,
        source: "google_drive",
      };
    } catch {
      // Fallback tiếp sang upload trực tiếp
    }
  }

  // 2. Upload trực tiếp qua /api/upload
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
        saveOfflineImage(img);
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

  // 3. Fallback sang lưu trữ data URI cục bộ (giữ ảnh hoạt động ngay cả khi offline)
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
 * Tải đồng thời hoặc tuần tự nhiều ảnh có thông báo tiến trình.
 */
export async function uploadMultipleMediaImages(
  files: File[],
  onProgress?: (progress: { current: number; total: number; filename: string }) => void,
): Promise<{
  successful: MediaImage[];
  failed: Array<{ file: File; error: string }>;
}> {
  const successful: MediaImage[] = [];
  const failed: Array<{ file: File; error: string }> = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    onProgress?.({
      current: i + 1,
      total: files.length,
      filename: file.name,
    });

    try {
      const res = await uploadMediaImage(file);
      if (res.success && res.image) {
        successful.push(res.image);
      } else {
        failed.push({ file, error: res.error || "Không thể tải ảnh" });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      failed.push({ file, error: message });
    }
  }

  return { successful, failed };
}

/**
 * Lấy danh sách ảnh đã lưu trên Cloudflare D1.
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
 * Xóa ảnh theo ID trên Cloudflare D1.
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

export const DEFAULT_LIBRARY_IMAGES = [
  { url: "/figma-images/hero.png", filename: "hero-hawaii.png" },
  { url: "/figma-images/product-feat-1.png", filename: "ao-so-mi-hoa-dua.png" },
  { url: "/figma-images/product-feat-2.png", filename: "vay-maxi-hoa-anh-dao.png" },
  { url: "/figma-images/product-feat-3.png", filename: "set-do-linen-couple.png" },
  { url: "/figma-images/catalog-1.png", filename: "catalog-so-mi-bien.png" },
  { url: "/figma-images/catalog-2.png", filename: "catalog-vay-mua-he.png" },
  { url: "/figma-images/catalog-3.png", filename: "catalog-linen-couple.png" },
  { url: "/figma-images/catalog-4.png", filename: "catalog-tui-coi-dan.png" },
  { url: "/figma-images/lifestyle-1.png", filename: "lifestyle-bien-voan.png" },
  { url: "/figma-images/lifestyle-2.png", filename: "lifestyle-dao-pho-linen.png" },
  { url: "/figma-images/lifestyle-3.png", filename: "lifestyle-cafe-sang.png" },
  { url: "/figma-images/lifestyle-4.png", filename: "lifestyle-picnic-summer.png" },
  { url: "/figma-images/lookbook-1.png", filename: "lookbook-nang-som.png" },
  { url: "/figma-images/lookbook-2.png", filename: "lookbook-chieu-bien.png" },
  { url: "/figma-images/lookbook-3.png", filename: "lookbook-pho-he.png" },
  { url: "/figma-images/lookbook-4.png", filename: "lookbook-dem-tiec.png" },
  { url: "/figma-images/brand-story.png", filename: "brand-story-lisea.png" },
  { url: "/figma-images/pdp-main.png", filename: "pdp-banner-showcase.png" },
];

/**
 * Nạp bộ ảnh mẫu của shop vào thư viện Cloudflare D1.
 */
export async function seedLibraryWithSampleImages(): Promise<{ count: number }> {
  let count = 0;
  for (const img of DEFAULT_LIBRARY_IMAGES) {
    try {
      await saveExternalMediaImage({
        url: img.url,
        filename: img.filename,
        mimeType: "image/png",
      });
      count++;
    } catch {
      // ignore
    }
  }
  return { count };
}

/**
 * Đẩy toàn bộ ảnh đang lưu tạm trong localStorage lên Cloudflare D1 để mọi người cùng xem được.
 */
export async function syncOfflineImagesToCloudflare(): Promise<{
  synced: number;
  failed: number;
}> {
  const offline = getOfflineImages();
  if (offline.length === 0) return { synced: 0, failed: 0 };

  let synced = 0;
  let failed = 0;

  for (const item of offline) {
    try {
      const isHttp =
        item.url.startsWith("http://") ||
        item.url.startsWith("https://") ||
        item.url.startsWith("/");

      const payload = isHttp
        ? {
            url: item.url,
            filename: item.filename,
            mimeType: item.mimeType,
            size: item.size,
          }
        : {
            file: item.url,
            filename: item.filename,
            mimeType: item.mimeType,
          };

      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        synced++;
      } else {
        failed++;
      }
    } catch {
      failed++;
    }
  }

  return { synced, failed };
}
