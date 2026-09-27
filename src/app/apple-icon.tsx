import { ImageResponse } from "next/og";
import { AcornIcon } from "@/lib/icon-art";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(<AcornIcon size={180} padding={0.12} />, size);
}
