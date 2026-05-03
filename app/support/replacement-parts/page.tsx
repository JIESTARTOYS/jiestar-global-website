import { PolicyPage } from "@/components/ui/PolicyPage";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({ title: "Replacement Parts & Missing Pieces", description: "Request JIESTAR support for missing, incorrect, or lost building block pieces.", path: "/support/replacement-parts" });

export default function ReplacementPartsPage() {
  return <PolicyPage title="Replacement Parts & Missing Pieces" sections={["If your set has missing, incorrect, or lost pieces, contact support with your order number, product SKU, missing piece information, and clear photos when possible.", "JIESTAR missing piece support helps build trust for DTC customers and gives B2B partners a clearer after-sales path."]} />;
}
