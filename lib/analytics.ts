"use client";

import { track } from "@vercel/analytics";
import { isValidProductHandle } from "./product-handle.ts";

export type InquiryEvent =
  | "Inquiry Started"
  | "Inquiry Submitted"
  | "Inquiry Validated"
  | "Inquiry Delivered"
  | "Inquiry Delivery Not Configured"
  | "Inquiry Failed";

type CommerceEvent = "Add to Cart" | "Begin Checkout";

export type InquiryFailureOutcome =
  | "validation_failed"
  | "rate_limited"
  | "delivery_failed"
  | "network_failed";

export type InquiryEventContext = {
  locale: "en" | "es";
  formType: "wholesale" | "custom" | "contact" | "replacement-parts";
  sourcePath: string;
  productHandle?: string;
  outcome?: "delivered" | "delivery_not_configured" | InquiryFailureOutcome;
};

type CommerceEventContext = {
  sourcePath: string;
  productHandle?: string;
  checkoutType?: "buy_now" | "cart";
  cartQuantity?: number;
};

const analyticsPathPattern = /^\/[A-Za-z0-9/_-]*$/;

export function sanitizeAnalyticsPathname(pathname: string) {
  const pathOnly = pathname.split(/[?#]/, 1)[0];

  return analyticsPathPattern.test(pathOnly) ? pathOnly.slice(0, 240) : "/";
}

export function sanitizeAnalyticsUrl(value: string) {
  try {
    const url = new URL(value);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }

    return `${url.origin}${sanitizeAnalyticsPathname(url.pathname)}`;
  } catch {
    return null;
  }
}

function safeProductHandle(productHandle?: string) {
  return productHandle && isValidProductHandle(productHandle) ? productHandle : undefined;
}

export function getBrowserPathname(fallback = "/") {
  return typeof window === "undefined"
    ? sanitizeAnalyticsPathname(fallback)
    : sanitizeAnalyticsPathname(window.location.pathname);
}

export function classifyInquiryFailure(status?: number): {
  outcome: InquiryFailureOutcome;
  validated: boolean;
} {
  if (status === 400) {
    return { outcome: "validation_failed", validated: false };
  }

  if (status === 429) {
    return { outcome: "rate_limited", validated: false };
  }

  if (status === 502 || status === 503) {
    return { outcome: "delivery_failed", validated: true };
  }

  return { outcome: "network_failed", validated: false };
}

export function createInquiryAnalyticsEvent(event: InquiryEvent, context: InquiryEventContext) {
  const productHandle = safeProductHandle(context.productHandle);

  return {
    name: event,
    properties: {
      locale: context.locale,
      form_type: context.formType,
      source_path: sanitizeAnalyticsPathname(context.sourcePath),
      ...(productHandle ? { product_handle: productHandle } : {}),
      ...(context.outcome ? { outcome: context.outcome } : {}),
    },
  };
}

export function createInquiryFailureAnalyticsEvents(
  context: InquiryEventContext,
  status?: number,
) {
  const classification = classifyInquiryFailure(status);
  const failedEvent = createInquiryAnalyticsEvent("Inquiry Failed", {
    ...context,
    outcome: classification.outcome,
  });

  return {
    classification,
    events: classification.validated
      ? [createInquiryAnalyticsEvent("Inquiry Validated", context), failedEvent]
      : [failedEvent],
  };
}

export function trackInquiryEvent(event: InquiryEvent, context: InquiryEventContext) {
  const analyticsEvent = createInquiryAnalyticsEvent(event, context);

  try {
    track(analyticsEvent.name, analyticsEvent.properties);
  } catch {
    // Analytics must never block a customer inquiry.
  }
}

export function trackInquiryFailure(context: InquiryEventContext, status?: number) {
  const sequence = createInquiryFailureAnalyticsEvents(context, status);

  for (const analyticsEvent of sequence.events) {
    try {
      track(analyticsEvent.name, analyticsEvent.properties);
    } catch {
      // Analytics must never block a customer inquiry.
    }
  }

  return sequence.classification;
}

export function createCommerceAnalyticsEvent(event: CommerceEvent, context: CommerceEventContext) {
  const productHandle = safeProductHandle(context.productHandle);

  return {
    name: event,
    properties: {
      source_path: sanitizeAnalyticsPathname(context.sourcePath),
      ...(productHandle ? { product_handle: productHandle } : {}),
      ...(context.checkoutType ? { checkout_type: context.checkoutType } : {}),
      ...(typeof context.cartQuantity === "number"
        ? { cart_quantity: Math.max(0, Math.round(context.cartQuantity)) }
        : {}),
    },
  };
}

export function trackCommerceEvent(event: CommerceEvent, context: CommerceEventContext) {
  const analyticsEvent = createCommerceAnalyticsEvent(event, context);

  try {
    track(analyticsEvent.name, analyticsEvent.properties);
  } catch {
    // Analytics must never block cart or checkout actions.
  }
}
