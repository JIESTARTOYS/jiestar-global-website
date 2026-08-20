import type { Metadata } from "next";
import { absoluteUrl, createMetadata } from "../seo.ts";
import type { TranslatedPath } from "./routing.ts";
import { localizedHref } from "./routing.ts";

type LocalizedMetadataInput = {
  title: string;
  description: string;
  path: TranslatedPath;
  image?: string;
};

export function createSpanishMetadata({
  title,
  description,
  path,
  image,
}: LocalizedMetadataInput): Metadata {
  const englishPath = localizedHref("en", path);
  const spanishPath = localizedHref("es", path);
  const base = createMetadata({ title, description, path: spanishPath, image });

  return {
    ...base,
    alternates: {
      canonical: absoluteUrl(spanishPath),
      languages: {
        en: absoluteUrl(englishPath),
        es: absoluteUrl(spanishPath),
        "x-default": absoluteUrl(englishPath),
      },
    },
    openGraph: {
      ...base.openGraph,
      locale: "es_ES",
      alternateLocale: ["en_US"],
    },
  };
}
