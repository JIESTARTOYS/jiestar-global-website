import Image from "next/image";
import type { Product } from "@/lib/data";

type ProductImageSwapProps = {
  product: Product;
  sizes: string;
  className?: string;
  imageClassName?: string;
  imageFit?: "contain" | "cover";
  priority?: boolean;
};

export function ProductImageSwap({
  product,
  sizes,
  className = "aspect-square",
  imageClassName = "p-4",
  imageFit = "contain",
  priority = false,
}: ProductImageSwapProps) {
  const primaryImage = {
    src: product.images?.[0]?.src ?? product.image,
    alt: product.images?.[0]?.alt ?? product.imageAlt,
  };
  const secondaryImage = product.images?.find((image) => image.src !== primaryImage.src);
  const fitClassName = imageFit === "cover" ? "object-cover" : "object-contain";

  return (
    <div className={`relative overflow-hidden bg-slate-50 ${className}`}>
      <Image
        src={primaryImage.src}
        alt={primaryImage.alt}
        fill
        sizes={sizes}
        priority={priority}
        className={`${fitClassName} transition duration-300 group-hover:scale-[1.03] group-focus-within:scale-[1.03] motion-reduce:transition-none ${
          secondaryImage ? "group-hover:opacity-0 group-focus-within:opacity-0" : ""
        } ${imageClassName}`}
      />
      {secondaryImage ? (
        <Image
          src={secondaryImage.src}
          alt={secondaryImage.alt}
          fill
          sizes={sizes}
          className={`${fitClassName} opacity-0 transition duration-300 group-hover:scale-[1.03] group-hover:opacity-100 group-focus-within:scale-[1.03] group-focus-within:opacity-100 motion-reduce:transition-none ${imageClassName}`}
        />
      ) : null}
    </div>
  );
}
