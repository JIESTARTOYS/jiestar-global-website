export const permanentRedirects = [
  {
    source: "/Home",
    destination: "/",
    permanent: true,
  },
  {
    source: "/collections/girl",
    destination: "/products",
    permanent: true,
  },
] as const;

export const robotsRules = {
  userAgent: "*",
  allow: ["/", "/products?page=*$", "/collections/*?page=*$"],
  disallow: [
    "/account",
    "/api/",
    "/cart",
    "/checkout",
    "/products?page=*&*",
    "/collections/*?page=*&*",
    "/*?*&*",
    "/*?*",
  ],
};
