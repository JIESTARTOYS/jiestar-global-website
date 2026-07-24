import Link from "next/link";
import { businessConfig } from "@/lib/business";

type BusinessIdentityProps = {
  className?: string;
  showRelationship?: boolean;
};

const identityItems = [
  ["Legal company name", businessConfig.legalName],
  ["Chinese company name", businessConfig.legalNameChinese],
  ["Company registration number", businessConfig.companyRegistrationNumber],
  ["Business registration certificate number", businessConfig.businessRegistrationNumber],
  ["Registered address", businessConfig.registeredAddress],
] as const;

export function BusinessIdentity({ className = "", showRelationship = true }: BusinessIdentityProps) {
  return (
    <section className={`rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/[0.03] sm:p-6 ${className}`}>
      <p className="text-sm font-black uppercase text-red-600">Merchant &amp; Legal Information</p>
      <h2 className="mt-3 text-2xl font-black tracking-normal text-slate-950">The company behind JIESTAR online sales</h2>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
        The following company is the website operator, retail seller, and merchant of record for eligible purchases
        completed through the JIESTAR global storefront.
      </p>

      <dl className="mt-6 grid gap-4 sm:grid-cols-2">
        {identityItems.map(([label, value]) => (
          <div key={label} className={label === "Registered address" ? "rounded-md bg-slate-50 p-4 sm:col-span-2" : "rounded-md bg-slate-50 p-4"}>
            <dt className="text-xs font-black uppercase leading-5 text-slate-500">{label}</dt>
            <dd className="mt-2 break-words text-sm font-semibold leading-6 text-slate-950">{value}</dd>
          </div>
        ))}
        <div className="rounded-md bg-slate-50 p-4">
          <dt className="text-xs font-black uppercase leading-5 text-slate-500">Business telephone</dt>
          <dd className="mt-2 text-sm font-semibold leading-6 text-slate-950">
            <Link href={businessConfig.phoneHref} className="transition hover:text-red-600">
              {businessConfig.phoneDisplay}
            </Link>
          </dd>
        </div>
        <div className="rounded-md bg-slate-50 p-4">
          <dt className="text-xs font-black uppercase leading-5 text-slate-500">Contact email</dt>
          <dd className="mt-2 text-sm font-semibold leading-6 text-slate-950">
            <Link href={`mailto:${businessConfig.businessEmail}`} className="break-all transition hover:text-red-600">
              {businessConfig.businessEmail}
            </Link>
          </dd>
        </div>
      </dl>

      {showRelationship ? (
        <div className="mt-6 rounded-md border border-red-100 bg-red-50 p-4">
          <h3 className="text-sm font-black text-slate-950">Brand, manufacturing, and sales relationship</h3>
          <p className="mt-2 text-sm leading-7 text-slate-700">{businessConfig.relationship}</p>
        </div>
      ) : null}
    </section>
  );
}
