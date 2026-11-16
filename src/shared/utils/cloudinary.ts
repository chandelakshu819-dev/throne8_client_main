const CLOUDINARY_HOST = "res.cloudinary.com";
const IMAGE_UPLOAD_MARKER = "/image/upload/";

export type ImagePreset =
  | "avatar"
  | "logo"
  | "thumbnail"
  | "post"
  | "cover"
  | "banner";

const PRESET_WIDTH: Record<ImagePreset, number> = {
  avatar: 200,
  logo: 300,
  thumbnail: 500,
  post: 1200,
  cover: 1600,
  banner: 1920,
};

/**
 * Cloudinary image URL me f_auto,q_auto aur width limit inject karta hai.
 * Non-Cloudinary URL (Google avatar etc.), video, raw file ya already
 * transformed URL ko jaisa hai waisa return karta hai.
 */
export const optimizeImage = (
  url: string | null | undefined,
  width: number = 1200
): string => {
  if (!url) return "";
  if (!url.includes(CLOUDINARY_HOST)) return url;

  const markerIndex = url.indexOf(IMAGE_UPLOAD_MARKER);
  if (markerIndex === -1) return url;

  const head = url.slice(0, markerIndex);
  const tail = url.slice(markerIndex + IMAGE_UPLOAD_MARKER.length);

  // Upload ke baad ka pehla segment transformation ho sakta hai
  const firstSegment = tail.split("/")[0];
  if (/(^|,)(f_|q_)auto/.test(firstSegment)) return url;

  return `${head}${IMAGE_UPLOAD_MARKER}f_auto,q_auto,c_limit,w_${width}/${tail}`;
};

export const optimizeByPreset = (
  url: string | null | undefined,
  preset: ImagePreset
): string => optimizeImage(url, PRESET_WIDTH[preset]);