import type { DeliveryResult } from "./inquiry-delivery.ts";

export const publicInquiryDeliveryError =
  "Unable to deliver the inquiry right now. Please try again or contact us directly.";

export function createInquiryDeliveryFailureResponse(
  delivery: Extract<DeliveryResult, { ok: false }>,
) {
  return {
    error: publicInquiryDeliveryError,
    deliveryConfigured: delivery.deliveryConfigured,
    contactEmail: delivery.contactEmail,
  };
}
