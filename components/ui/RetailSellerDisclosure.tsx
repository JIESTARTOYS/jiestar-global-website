import Link from "next/link";
import { businessConfig } from "@/lib/business";

export function RetailSellerDisclosure({ className = "", onNavigate }: { className?: string; onNavigate?: () => void }) {
  return (
    <p className={`text-xs leading-5 text-slate-600 ${className}`}>
      Retail seller: {businessConfig.legalName}.{" "}
      <Link
        href="/business-information#international-sales"
        onNavigate={onNavigate}
        className="font-semibold underline decoration-slate-400 underline-offset-2 hover:text-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
      >
        Business information
      </Link>
    </p>
  );
}
