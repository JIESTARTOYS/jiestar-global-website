import { TruckIcon } from "@/components/ui/Icons";

type UsWarehouseBadgeProps = {
  className?: string;
};

export function UsWarehouseBadge({ className = "" }: UsWarehouseBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-black text-blue-800 ${className}`}
    >
      <TruckIcon className="h-3.5 w-3.5" />
      Ships from U.S.
    </span>
  );
}
