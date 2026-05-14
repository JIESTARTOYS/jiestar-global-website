"use client";

import { useState } from "react";

const fieldClass =
  "min-h-11 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-slate-950";

export function ReplacementPartsForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setErrorMessage(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());
    const message = [
      `Replacement parts request for order: ${payload.orderNumber ?? "not provided"}.`,
      `Purchase channel: ${payload.purchaseChannel ?? "not provided"}.`,
      `Product: ${payload.productName ?? "not provided"}.`,
      `SKU: ${payload.productSku ?? "not provided"}.`,
      `Issue type: ${payload.issueType ?? "not sure yet"}.`,
      `Preferred contact: ${payload.preferredContact ?? "email"}.`,
    ].join(" ");

    try {
      const response = await fetch("/api/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "replacement-parts", ...payload, message }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? "Submission failed. Please check the required fields and try again.");
      }

      form.reset();
      setStatus("success");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Submission failed. Please email support@jiestartoys.com directly.");
      setStatus("error");
    }
  }

  return (
    <section id="replacement-request" className="rounded-lg border border-slate-200 bg-slate-50 p-5 sm:p-6">
      <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
        <div>
          <p className="text-xs font-black uppercase text-red-600">Replacement request</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-normal text-slate-950">Send your order information</h2>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            Start with the order and contact details. The support team can confirm the exact missing pieces, photos,
            part numbers, and shipping steps after the first contact.
          </p>
          <div className="mt-5 rounded-md border border-white bg-white p-4 text-sm leading-6 text-slate-600">
            <strong className="block font-semibold text-slate-950">Helpful but optional:</strong>
            Product SKU, product name, package photo, or manual page reference. You do not need to identify every missing
            piece before submitting this form.
          </div>
        </div>

        <form onSubmit={onSubmit} className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field name="name" label="Name" required />
            <Field name="email" label="Email" type="email" required />
            <Field name="country" label="Country / Region" required />
            <Field name="whatsapp" label="WhatsApp / Phone" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field name="orderNumber" label="Order Number" required />
            <Field name="purchaseChannel" label="Purchase Channel" required />
            <Field name="productName" label="Product Name" />
            <Field name="productSku" label="Product SKU" />
          </div>

          <label className="grid gap-2 text-sm font-medium text-slate-800">
            Issue Type
            <select name="issueType" className={fieldClass} defaultValue="Not sure yet">
              {["Not sure yet", "Missing pieces", "Incorrect pieces", "Damaged pieces", "Lost pieces", "Other support"].map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-medium text-slate-800">
            Preferred Contact Method
            <select name="preferredContact" className={fieldClass} defaultValue="Email">
              {["Email", "WhatsApp / Phone"].map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <button
            type="submit"
            disabled={status === "loading"}
            className="min-h-12 rounded-md bg-red-600 px-5 py-3 text-sm font-black text-white shadow-sm shadow-red-600/20 transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-slate-500"
          >
            {status === "loading" ? "Submitting..." : "Submit Replacement Request"}
          </button>

          {status === "success" ? (
            <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
              Request received. JIESTAR support will follow up by email or WhatsApp to confirm the missing part details.
            </p>
          ) : null}

          {status === "error" ? (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
              {errorMessage ?? "Submission failed. Please email support@jiestartoys.com directly."}
            </p>
          ) : null}
        </form>
      </div>
    </section>
  );
}

function Field({
  name,
  label,
  type = "text",
  required = false,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-800">
      {label}
      {required ? " *" : ""}
      <input name={name} type={type} required={required} className={fieldClass} aria-required={required} />
    </label>
  );
}
