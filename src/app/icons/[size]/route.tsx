import { ImageResponse } from "next/og";
import { AcornIcon } from "@/lib/icon-art";

const SIZES: Record<string, { size: number; padding: number; bg?: string }> = {
  "192": { size: 192, padding: 0.06 },
  "512": { size: 512, padding: 0.06 },
  maskable: { size: 512, padding: 0.2 },
  badge: { size: 96, padding: 0.04, bg: "transparent" },
};

export async function GET(_req: Request, ctx: RouteContext<"/icons/[size]">) {
  const { size } = await ctx.params;
  const spec = SIZES[size];
  if (!spec) return new Response("Not found", { status: 404 });
  return new ImageResponse(<AcornIcon size={spec.size} padding={spec.padding} background={spec.bg} />, {
    width: spec.size,
    height: spec.size,
    headers: { "Cache-Control": "public, max-age=604800, immutable" },
  });
}
