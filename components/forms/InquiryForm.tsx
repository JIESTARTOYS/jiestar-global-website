"use client";

import { useState } from "react";
import { cooperationTypes } from "@/lib/data";

type InquiryFormProps = {
  type: "wholesale" | "custom" | "contact";
};

const fieldClass =
  "min-h-11 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-slate-950";

export function InquiryForm({ type }: InquiryFormProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const isWholesale = type === "wholesale";

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setErrorMessage(null);
    setSuccessMessage(null);
    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    try {
      const response = await fetch("/api/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, ...payload }),
      });

      const data = (await response.json().catch(() => null)) as {
        contactEmail?: string;
        deliveryConfigured?: boolean;
        error?: string;
      } | null;

      if (!response.ok) {
        throw new Error(data?.error ?? "Submission failed. Please check the required fields and try again.");
      }

      form.reset();
      setSuccessMessage(
        isWholesale
          ? `Thank you. Your wholesale inquiry has been received. For urgent catalog or pricing requests, email ${data?.contactEmail ?? "info@jiestartoys.com"} directly.`
          : `Inquiry received. Our team can follow up by email or WhatsApp. For urgent requests, email ${data?.contactEmail ?? "info@jiestartoys.com"} directly.`,
      );
      setStatus("success");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Submission failed. Please email info@jiestartoys.com directly.");
      setStatus("error");
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div>
        <p className="text-xs font-black uppercase text-red-600">
          {type === "wholesale" ? "Wholesale inquiry" : type === "custom" ? "Custom project inquiry" : "Inquiry form"}
        </p>
        <h2 className="mt-2 text-xl font-black text-slate-950">
          {type === "wholesale" ? "Get the wholesale price catalog" : type === "custom" ? "Start a custom product discussion" : "Send your message"}
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          {isWholesale
            ? "Leave your email and the JIESTAR team will send the wholesale catalog with pricing information, then follow up by email or WhatsApp if provided."
            : "Fields marked with * are required. Share enough detail for the JIESTAR team to route your inquiry correctly."}
        </p>
      </div>

      {isWholesale ? (
        <>
          <Field name="email" label="Email" type="email" required />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field name="name" label="Name" />
            <Field name="company" label="Company" />
            <Field name="country" label="Country / Region" />
            <Field name="whatsapp" label="WhatsApp / Social Media" />
            <Field name="interestedCategory" label="Interested Product Category" />
          </div>
        </>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field name="name" label="Name" required />
          <Field name="company" label="Company" required={type !== "contact"} />
          <Field name="country" label="Country / Region" required />
          <Field name="email" label="Email" type="email" required />
          <Field name="whatsapp" label="WhatsApp" />
          <Field name="businessType" label="Business Type" required={type !== "contact"} />
        </div>
      )}

      {type === "custom" ? (
        <label className="grid gap-2 text-sm font-medium text-slate-800">
          Cooperation Type *
          <select name="cooperationType" required className={fieldClass} aria-required="true">
            {cooperationTypes.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {type === "contact" ? (
        <label className="grid gap-2 text-sm font-medium text-slate-800">
          Cooperation Type *
          <select name="cooperationType" required className={fieldClass} aria-required="true">
            {["Product Purchase", ...cooperationTypes, "Customer Support", "Other"].map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {!isWholesale ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            name={type === "custom" ? "customizationNeeds" : "interestedCategory"}
            label={type === "custom" ? "Customization Needs" : "Interested Product Category"}
          />
          <Field name="estimatedQuantity" label="Estimated Order Quantity" />
          <Field name={type === "custom" ? "targetMarket" : "targetSalesChannel"} label={type === "custom" ? "Target Market" : "Target Sales Channel"} />
        </div>
      ) : null}

      <label className="grid gap-2 text-sm font-medium text-slate-800">
        Message{isWholesale ? "" : " *"}
        <textarea name="message" rows={5} required={!isWholesale} className={`${fieldClass} resize-y`} aria-required={!isWholesale} />
      </label>

      <button
        type="submit"
        disabled={status === "loading"}
        className="min-h-12 rounded-md bg-red-600 px-5 py-3 text-sm font-black text-white shadow-sm shadow-red-600/20 transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-slate-500"
      >
        {status === "loading" ? "Submitting..." : isWholesale ? "Get Wholesale Catalog" : "Submit Inquiry"}
      </button>

      {status === "success" ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
          {successMessage}
        </p>
      ) : null}
      {status === "error" ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
          {errorMessage ?? "Submission failed. Please email info@jiestartoys.com directly."}
        </p>
      ) : null}
    </form>
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
      {label}{required ? " *" : ""}
      <input name={name} type={type} required={required} className={fieldClass} aria-required={required} />
    </label>
  );
}
