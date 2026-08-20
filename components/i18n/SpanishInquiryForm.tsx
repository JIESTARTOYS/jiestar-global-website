"use client";

import { useRef, useState } from "react";
import {
  getBrowserPathname,
  trackInquiryEvent,
  trackInquiryFailure,
  type InquiryEvent,
  type InquiryEventContext,
} from "@/lib/analytics";
import { isValidProductHandle } from "@/lib/product-handle";

type InquiryType = "wholesale" | "custom" | "contact";

type SpanishInquiryFormProps = {
  type: InquiryType;
  sourcePath: `/es${string}`;
  productHandle?: string;
};

const fieldClass =
  "min-h-11 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-slate-950 focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2";

const cooperationTypes = [
  ["Wholesale", "Venta mayorista"],
  ["OEM Customization", "Personalización OEM"],
  ["ODM Development", "Desarrollo ODM"],
  ["Product Co-Development", "Desarrollo conjunto de productos"],
  ["Sub-Brand Partnership", "Marca propia o línea exclusiva"],
  ["Not Sure Yet", "Por definir"],
] as const;

const contactTypes = [
  ["Product Purchase", "Compra de productos"],
  ...cooperationTypes,
  ["Customer Support", "Atención al cliente"],
  ["Other", "Otro"],
] as const;

export function SpanishInquiryForm({ type, sourcePath, productHandle }: SpanishInquiryFormProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const startedRef = useRef(false);
  const isWholesale = type === "wholesale";

  function getAnalyticsAttribution() {
    return {
      locale: "es" as const,
      formType: type,
      sourcePath: getBrowserPathname(sourcePath),
      // Query attribution is user-controlled, so only a trusted prop may be
      // included in Analytics. The validated query can still reach the email.
      ...(productHandle && isValidProductHandle(productHandle) ? { productHandle } : {}),
    };
  }

  function getSubmissionProductHandle() {
    const queryProductHandle = typeof window === "undefined"
      ? undefined
      : new URLSearchParams(window.location.search).get("product") ?? undefined;
    const candidateProductHandle = productHandle ?? queryProductHandle;

    return candidateProductHandle && isValidProductHandle(candidateProductHandle)
      ? candidateProductHandle
      : undefined;
  }

  function trackSafe(
    event: InquiryEvent,
    outcome?: InquiryEventContext["outcome"],
  ) {
    try {
      trackInquiryEvent(event, { ...getAnalyticsAttribution(), outcome });
    } catch {
      // Analytics must never block an inquiry.
    }
  }

  function onStart() {
    if (startedRef.current) {
      return;
    }

    startedRef.current = true;
    trackSafe("Inquiry Started");
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage(null);

    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form).entries());
    const submissionProductHandle = getSubmissionProductHandle();
    trackSafe("Inquiry Submitted");

    try {
      const response = await fetch("/api/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          locale: "es",
          sourcePath,
          ...(submissionProductHandle ? { productHandle: submissionProductHandle } : {}),
          ...payload,
        }),
      });
      const data = (await response.json().catch(() => null)) as {
        deliveryConfigured?: boolean;
        contactEmail?: string;
      } | null;

      if (!response.ok) {
        const failure = trackInquiryFailure(getAnalyticsAttribution(), response.status);

        setStatus("error");
        setMessage(
          failure.outcome === "rate_limited"
            ? "Se han enviado demasiadas solicitudes. Espere un momento e inténtelo de nuevo."
            : failure.outcome === "validation_failed"
              ? "Revise los campos obligatorios e inténtelo de nuevo."
              : "No pudimos enviar la consulta. Inténtelo de nuevo o escriba a info@jiestartoys.com.",
        );
        return;
      }

      if (typeof data?.deliveryConfigured !== "boolean") {
        trackInquiryFailure(getAnalyticsAttribution());

        setStatus("error");
        setMessage("No pudimos enviar la consulta. Inténtelo de nuevo o escriba a info@jiestartoys.com.");
        return;
      }

      trackSafe("Inquiry Validated");
      form.reset();
      const contactEmail = data?.contactEmail ?? "info@jiestartoys.com";
      setStatus("success");
      setMessage(
        data?.deliveryConfigured === true
          ? isWholesale
            ? "Gracias. La solicitud de catálogo ha sido enviada al equipo de JIESTAR para su revisión."
            : "La consulta ha sido enviada. El equipo de JIESTAR podrá responder por correo electrónico o WhatsApp."
          : `La consulta ha sido recibida. Si es urgente, escriba directamente a ${contactEmail}.`,
      );
      trackSafe(
        data?.deliveryConfigured === true
          ? "Inquiry Delivered"
          : "Inquiry Delivery Not Configured",
        data?.deliveryConfigured === true ? "delivered" : "delivery_not_configured",
      );
    } catch {
      trackInquiryFailure(getAnalyticsAttribution());

      setStatus("error");
      setMessage("No pudimos enviar la consulta. Inténtelo de nuevo o escriba a info@jiestartoys.com.");
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      onFocusCapture={onStart}
      className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
    >
      <div>
        <p className="text-xs font-black uppercase text-red-600">
          {isWholesale ? "Consulta mayorista" : type === "custom" ? "Proyecto a medida" : "Formulario de contacto"}
        </p>
        <h2 className="mt-2 text-xl font-black text-slate-950">
          {isWholesale
            ? "Solicite el catálogo y la información mayorista"
            : type === "custom"
              ? "Inicie una conversación sobre su proyecto"
              : "Envíenos su consulta"}
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          {isWholesale
            ? "Solo el correo electrónico es obligatorio. Los demás datos nos ayudan a preparar una respuesta más relevante."
            : "Los campos marcados con * son obligatorios. Comparta la información necesaria para dirigir su consulta al equipo adecuado."}
        </p>
      </div>

      {isWholesale ? (
        <>
          <Field name="email" label="Correo electrónico" type="email" autoComplete="email" required />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field name="name" label="Nombre" autoComplete="name" />
            <Field name="company" label="Empresa" autoComplete="organization" />
            <Field name="country" label="País o región" autoComplete="country-name" />
            <Field name="whatsapp" label="WhatsApp o red social" autoComplete="tel" />
            <Field name="interestedCategory" label="Categoría de producto de interés" />
          </div>
        </>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field name="name" label="Nombre" autoComplete="name" required />
          <Field name="company" label="Empresa" autoComplete="organization" required={type === "custom"} />
          <Field name="country" label="País o región" autoComplete="country-name" required />
          <Field name="email" label="Correo electrónico" type="email" autoComplete="email" required />
          <Field name="whatsapp" label="WhatsApp" autoComplete="tel" />
          <Field name="businessType" label="Tipo de empresa" required={type === "custom"} />
        </div>
      )}

      {type === "custom" ? (
        <SelectField name="cooperationType" label="Tipo de colaboración" options={cooperationTypes} required />
      ) : null}

      {type === "contact" ? (
        <SelectField name="cooperationType" label="Motivo de la consulta" options={contactTypes} required />
      ) : null}

      {!isWholesale ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            name={type === "custom" ? "customizationNeeds" : "interestedCategory"}
            label={type === "custom" ? "Necesidades de personalización" : "Categoría de producto de interés"}
          />
          <Field name="estimatedQuantity" label="Cantidad estimada" />
          <Field
            name={type === "custom" ? "targetMarket" : "targetSalesChannel"}
            label={type === "custom" ? "Mercado objetivo" : "Canal de venta objetivo"}
          />
        </div>
      ) : null}

      <label className="grid gap-2 text-sm font-medium text-slate-800">
        Mensaje{isWholesale ? "" : " *"}
        <textarea
          name="message"
          rows={5}
          required={!isWholesale}
          className={`${fieldClass} resize-y`}
          aria-required={!isWholesale}
        />
      </label>

      <button
        type="submit"
        disabled={status === "loading"}
        className="min-h-12 rounded-md bg-red-600 px-5 py-3 text-sm font-black text-white shadow-sm shadow-red-600/20 transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-slate-500"
      >
        {status === "loading"
          ? "Enviando…"
          : isWholesale
            ? "Solicitar catálogo mayorista"
            : "Enviar consulta"}
      </button>

      {status === "success" ? (
        <p role="status" className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
          {message}
        </p>
      ) : null}
      {status === "error" ? (
        <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
          {message}
        </p>
      ) : null}
    </form>
  );
}

function Field({
  name,
  label,
  type = "text",
  autoComplete,
  required = false,
}: {
  name: string;
  label: string;
  type?: string;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-800">
      {label}{required ? " *" : ""}
      <input
        name={name}
        type={type}
        autoComplete={autoComplete}
        required={required}
        className={fieldClass}
        aria-required={required}
      />
    </label>
  );
}

function SelectField({
  name,
  label,
  options,
  required = false,
}: {
  name: string;
  label: string;
  options: ReadonlyArray<readonly [string, string]>;
  required?: boolean;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-800">
      {label}{required ? " *" : ""}
      <select
        name={name}
        required={required}
        defaultValue=""
        className={fieldClass}
        aria-required={required}
      >
        <option value="" disabled>
          Seleccione una opción
        </option>
        {options.map(([value, optionLabel]) => (
          <option key={value} value={value}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  );
}
