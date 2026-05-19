import { siteConfig } from "./data.ts";
import type { NormalizedInquiryPayload } from "./request-validation.ts";

export type InquiryDeliveryConfig = {
  resendApiKey?: string;
  fromEmail?: string;
  businessEmail: string;
  supportEmail: string;
};

export type ResendEmailRequest = {
  from: string;
  to: string;
  reply_to?: string;
  subject: string;
  text: string;
  html: string;
};

type DeliveryResult =
  | {
      ok: true;
      deliveryConfigured: boolean;
      contactEmail: string;
    }
  | {
      ok: false;
      deliveryConfigured: true;
      contactEmail: string;
      error: string;
    };

type FetchLike = typeof fetch;

const defaultFromEmail = "JIESTAR Website <onboarding@resend.dev>";

const labels: Record<string, string> = {
  type: "Inquiry Type",
  name: "Name",
  company: "Company",
  country: "Country / Region",
  email: "Email",
  whatsapp: "WhatsApp / Social Media",
  businessType: "Business Type",
  interestedCategory: "Interested Category",
  cooperationType: "Cooperation Type",
  customizationNeeds: "Customization Needs",
  estimatedQuantity: "Estimated Order Quantity",
  targetMarket: "Target Market",
  targetSalesChannel: "Target Sales Channel",
  message: "Message",
  orderNumber: "Order Number",
  purchaseChannel: "Purchase Channel",
  productName: "Product Name",
  productSku: "Product SKU",
  issueType: "Issue Type",
  preferredContact: "Preferred Contact",
};

const preferredFieldOrder = [
  "type",
  "name",
  "company",
  "country",
  "email",
  "whatsapp",
  "businessType",
  "cooperationType",
  "interestedCategory",
  "customizationNeeds",
  "estimatedQuantity",
  "targetMarket",
  "targetSalesChannel",
  "orderNumber",
  "purchaseChannel",
  "productName",
  "productSku",
  "issueType",
  "preferredContact",
  "message",
];

export function getInquiryDeliveryConfig(): InquiryDeliveryConfig {
  return {
    resendApiKey: readEnv("RESEND_API_KEY"),
    fromEmail: readEnv("INQUIRY_FROM_EMAIL"),
    businessEmail: readEnv("CONTACT_EMAIL") ?? siteConfig.businessEmail,
    supportEmail: readEnv("SUPPORT_EMAIL") ?? siteConfig.supportEmail,
  };
}

export function getInquiryRecipient(payload: NormalizedInquiryPayload, config: InquiryDeliveryConfig) {
  return payload.type === "replacement-parts" ? config.supportEmail : config.businessEmail;
}

export function buildInquiryEmail(payload: NormalizedInquiryPayload, config: InquiryDeliveryConfig): ResendEmailRequest {
  const to = getInquiryRecipient(payload, config);
  const title = getInquiryTitle(payload.type);
  const rows = buildRows(payload);
  const text = rows.map(([label, value]) => `${label}: ${value}`).join("\n");
  const htmlRows = rows
    .map(
      ([label, value]) =>
        `<tr><th align="left" style="padding:8px 12px;border-bottom:1px solid #e2e8f0;background:#f8fafc;">${escapeHtml(label)}</th><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">${escapeHtml(value).replace(/\n/g, "<br />")}</td></tr>`,
    )
    .join("");

  return {
    from: config.fromEmail || defaultFromEmail,
    to,
    reply_to: payload.email,
    subject: `[JIESTAR] ${title} from ${payload.company || payload.name || payload.email}`,
    text,
    html: `<h1 style="font-family:Arial,sans-serif;font-size:20px;color:#0f172a;">${escapeHtml(title)}</h1><table style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px;color:#0f172a;">${htmlRows}</table>`,
  };
}

export async function deliverInquiry(
  payload: NormalizedInquiryPayload,
  config: InquiryDeliveryConfig = getInquiryDeliveryConfig(),
  fetcher: FetchLike = fetch,
): Promise<DeliveryResult> {
  const contactEmail = getInquiryRecipient(payload, config);

  if (!config.resendApiKey) {
    return {
      ok: true,
      deliveryConfigured: false,
      contactEmail,
    };
  }

  const response = await fetcher("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(buildInquiryEmail(payload, config)),
  });

  if (!response.ok) {
    return {
      ok: false,
      deliveryConfigured: true,
      contactEmail,
      error: `Email delivery failed: ${await readResendError(response)}`,
    };
  }

  return {
    ok: true,
    deliveryConfigured: true,
    contactEmail,
  };
}

function getInquiryTitle(type: NormalizedInquiryPayload["type"]) {
  if (type === "wholesale") {
    return "Wholesale inquiry";
  }

  if (type === "custom") {
    return "Custom project inquiry";
  }

  if (type === "replacement-parts") {
    return "Replacement parts request";
  }

  return "Website contact inquiry";
}

function buildRows(payload: NormalizedInquiryPayload): Array<[string, string]> {
  return preferredFieldOrder
    .filter((field) => payload[field])
    .map((field) => [labels[field] ?? field, payload[field]]);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function readEnv(name: string) {
  const value = process.env[name]?.trim();
  return value || undefined;
}

async function readResendError(response: Response) {
  const fallback = `${response.status} ${response.statusText}`.trim();

  try {
    const data = (await response.json()) as { message?: unknown; error?: unknown };
    const message = typeof data.message === "string" ? data.message : data.error;
    return typeof message === "string" && message ? message : fallback;
  } catch {
    return fallback;
  }
}
