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

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    try {
      const response = await fetch("/api/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, ...payload }),
      });

      if (!response.ok) {
        throw new Error("Inquiry failed");
      }

      form.reset();
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="name" label="Name" required />
        <Field name="company" label="Company" required={type !== "contact"} />
        <Field name="country" label="Country / Region" required />
        <Field name="email" label="Email" type="email" required />
        <Field name="whatsapp" label="WhatsApp" />
        <Field name="businessType" label="Business Type" required={type !== "contact"} />
      </div>

      {type === "custom" ? (
        <label className="grid gap-2 text-sm font-medium text-slate-800">
          Cooperation Type
          <select name="cooperationType" required className={fieldClass}>
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
          Cooperation Type
          <select name="cooperationType" required className={fieldClass}>
            {["Product Purchase", ...cooperationTypes, "Customer Support", "Other"].map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          name={type === "custom" ? "customizationNeeds" : "interestedCategory"}
          label={type === "custom" ? "Customization Needs" : "Interested Product Category"}
        />
        <Field name="estimatedQuantity" label="Estimated Order Quantity" />
        <Field name={type === "custom" ? "targetMarket" : "targetSalesChannel"} label={type === "custom" ? "Target Market" : "Target Sales Channel"} />
      </div>

      <label className="grid gap-2 text-sm font-medium text-slate-800">
        Message
        <textarea name="message" rows={5} required className={`${fieldClass} resize-y`} />
      </label>

      <button
        type="submit"
        disabled={status === "loading"}
        className="min-h-12 rounded-md bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-500"
      >
        {status === "loading" ? "Submitting..." : "Submit Inquiry"}
      </button>

      {status === "success" ? (
        <p className="text-sm font-medium text-emerald-700">Inquiry received. Our team will follow up by email or WhatsApp.</p>
      ) : null}
      {status === "error" ? (
        <p className="text-sm font-medium text-red-700">Submission failed. Please email info@jiestartoys.com directly.</p>
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
      {label}
      <input name={name} type={type} required={required} className={fieldClass} />
    </label>
  );
}
