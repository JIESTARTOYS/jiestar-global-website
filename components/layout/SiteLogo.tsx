import Image from "next/image";

const LOGO_SRC = "/images/brand/jiestar-logo-color.png";

export function SiteLogo({ className = "size-12", priority = false }: { className?: string; priority?: boolean }) {
  return (
    <Image
      src={LOGO_SRC}
      alt="JIESTAR logo"
      width={512}
      height={512}
      priority={priority}
      className={`${className} shrink-0 object-contain`}
    />
  );
}
