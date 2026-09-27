import { ImageResponse } from "next/og";
import { AcornIcon } from "@/lib/icon-art";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(<AcornIcon size={64} padding={0.04} />, size);
}
