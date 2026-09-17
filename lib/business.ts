const manufacturerName = "Guangdong JieXing Toys Industrial Co., Ltd.";
const legalName = "HONG KONG ZHILE TRADING CO., LIMITED";

export const businessConfig = {
  tradeName: "JIESTAR",
  legalName,
  legalNameChinese: "香港智樂貿易有限公司",
  companyRegistrationNumber: "80836623",
  businessRegistrationNumber: "80836623-000-07-26-1",
  registeredAddress: "RM03, 24/F, HO KING COMM CTR, 2-16 FAYUEN ST, MONG KOK, HONG KONG",
  registeredAddressStructured: {
    streetAddress: "RM03, 24/F, HO KING COMM CTR, 2-16 FAYUEN ST",
    addressLocality: "MONG KOK",
    addressRegion: "HONG KONG",
    addressCountry: "HK",
  },
  phoneNumber: "+8613710335072",
  phoneDisplay: "+86 137 1033 5072",
  phoneHref: "tel:+8613710335072",
  businessEmail: "info@jiestartoys.com",
  supportEmail: "support@jiestartoys.com",
  manufacturerName,
  brandOwnership:
    `JIESTAR is a brand of ${manufacturerName}, the brand owner responsible for product development, manufacturing, and supply.`,
  salesRole:
    `${legalName} is an authorized JIESTAR website and international sales operator. It is the seller for wholesale, custom-development, and retail orders, responsible for contracting, commercial invoices, payments, and related customer support, returns, and refunds under the applicable order terms.`,
  b2bRelationship:
    `Wholesale and custom-development orders are contracted with, invoiced by, and paid to ${legalName}, an authorized JIESTAR sales operator. ${manufacturerName} provides brand, product-development, and manufacturing support.`,
  relationship:
    `JIESTAR is owned by ${manufacturerName}. ${legalName} is authorized to operate the official JIESTAR international website and sell to wholesale, custom-development, and retail customers.`,
  governingLaw: "Hong Kong Special Administrative Region",
} as const;
