import { ImageResponse } from "next/og";
import { BrandOgImage, OG_IMAGE_ALT, OG_IMAGE_SIZE } from "@/lib/og-image";

export const alt = OG_IMAGE_ALT;
export const size = OG_IMAGE_SIZE;
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(<BrandOgImage />, { ...size });
}
