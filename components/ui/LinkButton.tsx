import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type LinkButtonProps = {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "dark" | "ghost";
  className?: string;
  prefetch?: boolean;
};

export function LinkButton({ href, children, variant = "primary", className, prefetch }: LinkButtonProps) {
  return (
    <Link
      href={href}
      prefetch={prefetch}
      className={cn(
        "inline-flex min-h-11 items-center justify-center rounded-md px-6 py-3 text-sm font-bold transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600",
        variant === "primary" && "bg-red-600 text-white shadow-sm shadow-red-600/20 hover:bg-red-700",
        variant === "secondary" && "border border-slate-300 bg-white text-slate-950 hover:border-slate-400 hover:bg-slate-50",
        variant === "dark" && "bg-white text-slate-950 hover:bg-slate-100",
        variant === "ghost" && "text-slate-950 hover:bg-slate-100",
        className,
      )}
    >
      {children}
    </Link>
  );
}
