import type { Locale } from "./routing.ts";

export type SiteDictionary = {
  navigationLabel: string;
  mobileNavigationLabel: string;
  languageLabel: string;
  openMenuLabel: string;
  homeLabel: string;
  navigation: Array<{
    label: string;
    href: string;
    language?: "en";
  }>;
  footer: {
    description: string;
    exploreTitle: string;
    partnershipTitle: string;
    companyTitle: string;
    legalTitle: string;
    languageScopeNotice: string;
    copyright: string;
  };
};

const dictionaries = {
  en: {
    navigationLabel: "Main navigation",
    mobileNavigationLabel: "Mobile navigation",
    languageLabel: "Spanish B2B business section",
    openMenuLabel: "Toggle mobile navigation",
    homeLabel: "JIESTAR home",
    navigation: [
      { label: "Home", href: "/" },
      { label: "Products", href: "/products" },
      { label: "Wholesale", href: "/wholesale" },
      { label: "Custom Solutions", href: "/custom-solutions" },
      { label: "Quality & Safety", href: "/quality-safety" },
      { label: "Contact", href: "/contact" },
    ],
    footer: {
      description:
        "JIESTAR supports retailers, distributors, ecommerce sellers, and brand partners with building block products and custom development.",
      exploreTitle: "Explore",
      partnershipTitle: "Partnership",
      companyTitle: "Company",
      legalTitle: "Legal",
      languageScopeNotice:
        "The Spanish commercial section covers B2B information; the catalog, blog, legal pages, and support remain in English.",
      copyright: "JIESTAR. Building products and partnerships for global markets.",
    },
  },
  es: {
    navigationLabel: "Navegación principal",
    mobileNavigationLabel: "Navegación móvil",
    languageLabel: "Sitio principal en inglés",
    openMenuLabel: "Abrir o cerrar la navegación móvil",
    homeLabel: "Ir al sitio principal de JIESTAR en inglés",
    navigation: [
      { label: "Inicio", href: "/es" },
      { label: "Catálogo en inglés", href: "/products", language: "en" },
      { label: "Venta mayorista", href: "/es/wholesale" },
      { label: "Soluciones a medida", href: "/es/custom-solutions" },
      { label: "Calidad y seguridad", href: "/es/quality-safety" },
      { label: "Contacto", href: "/es/contact" },
    ],
    footer: {
      description:
        "JIESTAR colabora con minoristas, distribuidores, vendedores de comercio electrónico y marcas en el suministro de bloques de construcción y el desarrollo de productos a medida.",
      exploreTitle: "Explorar",
      partnershipTitle: "Colaboración",
      companyTitle: "Empresa",
      legalTitle: "Información legal",
      languageScopeNotice:
        "Esta sección comercial B2B está disponible en español; el catálogo, el blog, las páginas legales y el soporte permanecen en inglés.",
      copyright: "JIESTAR. Productos y colaboraciones para mercados internacionales.",
    },
  },
} satisfies Record<Locale, SiteDictionary>;

export function getDictionary(locale: Locale): SiteDictionary {
  return dictionaries[locale];
}
