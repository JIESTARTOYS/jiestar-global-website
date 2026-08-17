import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type HeroBannerButtonProps = {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary";
  className?: string;
  prefetch?: boolean;
};

export function HeroBannerButton({ href, children, variant = "primary", className, prefetch }: HeroBannerButtonProps) {
  return (
    <Link
      href={href}
      prefetch={prefetch}
      className={cn(
        "inline-flex min-h-12 w-full items-center justify-center rounded-md px-5 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-slate-950 sm:w-auto",
        variant === "primary" && "bg-white text-slate-950 hover:bg-red-600 hover:text-white",
        variant === "secondary" && "border border-white/25 bg-white/5 text-white hover:border-white hover:bg-white/10",
        className,
      )}
    >
      {children}
    </Link>
  );
}
