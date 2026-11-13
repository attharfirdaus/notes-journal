import Link from "next/link";
import { AuthMascot } from "@/components/auth-mascot";
import { Wordmark } from "@/components/wordmark";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <Link href="/" className="mb-2 inline-flex min-h-11 items-center text-3xl">
        <Wordmark />
      </Link>
      <AuthMascot />
      <div className="tape tape-left w-full max-w-sm rounded-paper border border-line bg-card p-6 pt-8">{children}</div>
    </div>
  );
}
