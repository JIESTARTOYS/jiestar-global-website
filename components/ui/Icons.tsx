import type { ReactNode, SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function IconBase({ children, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {children}
    </svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="11" cy="11" r="6" />
      <path d="m16 16 4 4" />
    </IconBase>
  );
}

export function UserIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c1.2-4 4-6 7-6s5.8 2 7 6" />
    </IconBase>
  );
}

export function CartIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 5h2l1.5 10h10.2L20 8H8" />
      <circle cx="10" cy="20" r="1.4" />
      <circle cx="17" cy="20" r="1.4" />
    </IconBase>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </IconBase>
  );
}

export function HomeIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="m4 11 8-7 8 7" />
      <path d="M6.5 10.5V20h11v-9.5" />
      <path d="M10 20v-5h4v5" />
    </IconBase>
  );
}

export function HeartIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M20.4 5.8a5 5 0 0 0-7.1 0L12 7.1l-1.3-1.3a5 5 0 1 0-7.1 7.1L12 21l8.4-8.1a5 5 0 0 0 0-7.1Z" />
    </IconBase>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </IconBase>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="m6 9 6 6 6-6" />
    </IconBase>
  );
}

export function ChevronLeftIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="m15 18-6-6 6-6" />
    </IconBase>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="m9 18 6-6-6-6" />
    </IconBase>
  );
}

export function GridIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 4h6v6H4z" />
      <path d="M14 4h6v6h-6z" />
      <path d="M4 14h6v6H4z" />
      <path d="M14 14h6v6h-6z" />
    </IconBase>
  );
}

export function ListIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M9 6h11" />
      <path d="M9 12h11" />
      <path d="M9 18h11" />
      <path d="M4 6h.01" />
      <path d="M4 12h.01" />
      <path d="M4 18h.01" />
    </IconBase>
  );
}

export function SlidersIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 7h5" />
      <path d="M15 7h5" />
      <path d="M11 5v4" />
      <path d="M4 17h8" />
      <path d="M18 17h2" />
      <path d="M14 15v4" />
    </IconBase>
  );
}

export function ShieldIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 3 5 6v5c0 4.5 2.9 8.4 7 10 4.1-1.6 7-5.5 7-10V6l-7-3Z" />
      <path d="m9 12 2 2 4-5" />
    </IconBase>
  );
}

export function RotateIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M20 12a8 8 0 1 1-2.3-5.7" />
      <path d="M20 4v6h-6" />
    </IconBase>
  );
}

export function StoreIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 10h16" />
      <path d="M5 10 6.5 4h11L19 10" />
      <path d="M6 10v10h12V10" />
      <path d="M9 20v-5h6v5" />
    </IconBase>
  );
}

export function TruckIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M3 6h11v10H3z" />
      <path d="M14 9h4l3 3v4h-7" />
      <circle cx="7" cy="18" r="2" />
      <circle cx="17" cy="18" r="2" />
    </IconBase>
  );
}

export function PackageIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
      <path d="M4.5 7.8 12 12l7.5-4.2" />
      <path d="M12 12v9" />
    </IconBase>
  );
}

export function GlobeIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3c2.2 2.5 3.2 5.5 3.2 9S14.2 18.5 12 21c-2.2-2.5-3.2-5.5-3.2-9S9.8 5.5 12 3Z" />
    </IconBase>
  );
}

export function FactoryIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M3 21V9l6 3V9l6 3V7h6v14H3Z" />
      <path d="M7 17h2" />
      <path d="M12 17h2" />
      <path d="M17 17h2" />
    </IconBase>
  );
}

export function SparkIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 3 9.8 9.8 3 12l6.8 2.2L12 21l2.2-6.8L21 12l-6.8-2.2L12 3Z" />
    </IconBase>
  );
}

export function StarIcon(props: IconProps) {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" {...props}>
      <path d="m10 1.8 2.5 5 5.5.8-4 3.9.9 5.5-4.9-2.6L5.1 17l.9-5.5-4-3.9 5.5-.8L10 1.8Z" />
    </svg>
  );
}
