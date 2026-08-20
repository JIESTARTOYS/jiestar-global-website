"use client";

import {
  Analytics,
  type BeforeSend,
} from "@vercel/analytics/next";
import { sanitizeAnalyticsUrl } from "@/lib/analytics";

const redactAnalyticsUrl: BeforeSend = (event) => {
  const url = sanitizeAnalyticsUrl(event.url);

  return url ? { ...event, url } : null;
};

export function SafeAnalytics() {
  return <Analytics beforeSend={redactAnalyticsUrl} />;
}
