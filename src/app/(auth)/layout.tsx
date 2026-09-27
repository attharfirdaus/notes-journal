import Link from "next/link";
import { AuthMascot } from "@/components/auth-mascot";
import { Nut } from "lucide-react";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <Link href="/" className="mb-2 flex items-center gap-2 font-display text-2xl font-bold">
        <Nut size={22} strokeWidth={2.5} aria-hidden /> Tuckbury
      </Link>
      <AuthMascot />
      <div className="w-full max-w-sm rounded-[2rem] border-2 border-line bg-card p-6 shadow-soft">{children}</div>
    </div>
  );
}
