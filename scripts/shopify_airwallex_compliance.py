#!/usr/bin/env python3
"""Audit and sync Shopify legal policies required for payment onboarding."""

from __future__ import annotations

import argparse
import html
import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[1]
ENV_PATH = REPO_ROOT / ".env.local"

LEGAL_NAME = "HONG KONG ZHILE TRADING CO., LIMITED"
TRADE_NAME = "JIESTAR"
REGISTERED_ADDRESS = "RM03, 24/F, HO KING COMM CTR, 2-16 FAYUEN ST, MONG KOK, HONG KONG"
PHONE = "+86 137 1033 5072"
EMAIL = "info@jiestartoys.com"
SUPPORT_EMAIL = "support@jiestartoys.com"
SITE_URL = "https://www.jiestartoys.com"


def load_env_file(path: Path) -> None:
    if not path.exists():
        return

    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue

        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip("\"'")
        if key and key not in os.environ:
            os.environ[key] = value


def paragraphs(*values: str) -> str:
    return "".join(f"<p>{html.escape(value)}</p>" for value in values)


def heading(value: str) -> str:
    return f"<h2>{html.escape(value)}</h2>"


def bullets(*values: str) -> str:
    return "<ul>" + "".join(f"<li>{html.escape(value)}</li>" for value in values) + "</ul>"


def merchant_identity() -> str:
    return (
        heading("Merchant and contact information")
        + paragraphs(
            f"Website operator, seller, and merchant of record: {LEGAL_NAME}",
            f"Trade name: {TRADE_NAME}",
            f"Registered address: {REGISTERED_ADDRESS}",
            f"Telephone: {PHONE}",
            f"Business email: {EMAIL}",
            f"Customer support: {SUPPORT_EMAIL}",
        )
        + paragraphs(
            "Guangdong Jiexing Toys Industrial Co., Ltd. is responsible for the JIESTAR brand, product development, "
            "manufacturing, and supply. The Hong Kong company is authorized to operate the international website and "
            "sales channel and handles eligible retail orders, payments, customer support, returns, and refunds."
        )
    )


POLICIES = {
    "CONTACT_INFORMATION": (
        merchant_identity()
        + heading("How to contact us")
        + paragraphs(
            "For order, payment, shipping, return, refund, privacy, or product questions, contact us by telephone or "
            "email using the details above. Please include your order number when the question concerns an existing "
            "order.",
            f"More business and legal information is available at {SITE_URL}/business-information.",
        )
    ),
    "LEGAL_NOTICE": (
        merchant_identity()
        + heading("Website and brand notice")
        + paragraphs(
            f"{LEGAL_NAME} operates the JIESTAR international website and is the contracting seller for eligible "
            "retail orders placed through it.",
            "JIESTAR names, logos, product images, product designs, catalogs, text, and other materials may be "
            "protected by trademark, copyright, design, or other intellectual property rights. No license is granted "
            "except the limited right to browse the website and evaluate or purchase products.",
        )
        + heading("Governing law")
        + paragraphs(
            "This legal notice and retail transactions with the Hong Kong company are governed by the laws of the "
            "Hong Kong Special Administrative Region, without excluding mandatory consumer protections that apply "
            "in the customer's place of residence."
        )
    ),
    "TERMS_OF_SERVICE": (
        merchant_identity()
        + heading("Website use and orders")
        + bullets(
            "Use the website only for lawful personal shopping or legitimate business evaluation.",
            "Product descriptions, prices, availability, taxes, duties, shipping charges, and estimated delivery "
            "times may change before an order is confirmed.",
            "An order becomes final only after checkout, payment, and order confirmation are completed.",
            "We may review or cancel an order for inventory errors, unavailable shipping coverage, suspected fraud, "
            "payment failure, or incorrect customer information.",
        )
        + heading("Checkout, shipping, returns, and refunds")
        + paragraphs(
            "Shopify provides the retail checkout. Payments are processed by the payment methods and regulated "
            "payment providers displayed at checkout. Customers must provide complete and accurate billing, contact, "
            "and delivery information.",
            f"Shipping terms are published at {SITE_URL}/policies/shipping-policy. Return and refund terms are "
            f"published at {SITE_URL}/policies/refund-policy.",
        )
        + heading("Liability and consumer rights")
        + paragraphs(
            "To the maximum extent permitted by law, the website and its content are provided without guarantees "
            "beyond those expressly stated. Nothing in these terms limits consumer rights or liabilities that cannot "
            "lawfully be excluded."
        )
        + heading("Governing law and disputes")
        + paragraphs(
            "These terms and retail transactions with the Hong Kong company are governed by the laws of the Hong "
            "Kong Special Administrative Region. The parties should first try to resolve concerns through the "
            "contact details above. Subject to mandatory consumer forum rights, disputes are submitted to the "
            "non-exclusive jurisdiction of the courts of Hong Kong."
        )
    ),
    "PRIVACY_POLICY": (
        merchant_identity()
        + heading("Information we collect and why")
        + bullets(
            "Contact, account, billing, delivery, order, payment-status, support, and business-inquiry information.",
            "Device, browser, IP address, security, cookie, analytics, and website-usage information.",
            "Information needed to process orders, provide support, prevent fraud, comply with law, improve the "
            "website, and communicate about requested services.",
        )
        + heading("Shopify, payments, service providers, and transfers")
        + paragraphs(
            "Shopify processes checkout, orders, customer records, and related commerce functions. Payment providers "
            "displayed at checkout process payment and fraud-prevention information; this website does not store full "
            "card details.",
            "We may share necessary information with hosting, analytics, email, logistics, manufacturing, customer "
            "support, accounting, fraud-prevention, and legal service providers. Global operations can require "
            "processing in Hong Kong, mainland China, the destination market, and service-provider locations.",
        )
        + heading("Retention, security, and your rights")
        + paragraphs(
            "We retain information only as long as reasonably needed for orders, support, accounting, security, legal "
            "obligations, and disputes. Reasonable safeguards are used, but no internet transmission is completely "
            "secure.",
            "Subject to applicable law, you may request access, correction, deletion, restriction, or other available "
            f"privacy rights by contacting {EMAIL}. This website is directed to adult shoppers and business buyers; "
            "children should not submit personal information or place orders without a parent or guardian.",
        )
    ),
    "SHIPPING_POLICY": (
        merchant_identity()
        + heading("Order processing")
        + paragraphs(
            "Orders are normally processed after payment is confirmed. Processing time varies by product, inventory, "
            "destination, peak periods, and any verification needed. The checkout and order confirmation show the "
            "available shipping service and charges for the order."
        )
        + heading("Delivery estimates, tracking, taxes, and duties")
        + bullets(
            "Delivery estimates are estimates rather than guaranteed arrival dates unless expressly agreed in "
            "writing.",
            "Tracking is provided when supported by the selected carrier and service.",
            "The customer is responsible for accurate delivery information and for import tax, customs duty, "
            "brokerage, or destination charges unless checkout expressly states that they are included.",
            "Carrier, customs, weather, address, security, and peak-season delays may be outside our reasonable "
            "control.",
        )
        + heading("Delivery problems")
        + paragraphs(
            f"Contact {SUPPORT_EMAIL} promptly if tracking is unavailable, a parcel appears lost, or an item arrives "
            "damaged or incorrect. Include the order number and supporting photographs where relevant."
        )
    ),
    "REFUND_POLICY": (
        merchant_identity()
        + heading("Return requests")
        + paragraphs(
            "Contact customer support within 30 days after delivery before returning an item. The item should be "
            "unused, complete, and in its original packaging unless it arrived damaged, defective, or incorrect. "
            "Returns sent without authorization may not be accepted."
        )
        + heading("Damaged, defective, or incorrect items")
        + paragraphs(
            f"Contact {SUPPORT_EMAIL} promptly with the order number, a description, and clear photographs. Depending "
            "on the issue and applicable law, we may arrange replacement parts, replacement, return, partial refund, "
            "or full refund."
        )
        + heading("Return shipping and non-returnable items")
        + bullets(
            "For approved change-of-mind returns, the customer normally pays return shipping and is responsible for "
            "safe return delivery.",
            "If the item is confirmed damaged, defective, or incorrect, we will provide the appropriate remedy and "
            "instructions.",
            "Customized, personalized, final-sale, used, incomplete, or hygiene-sensitive items may be non-returnable "
            "unless mandatory law requires otherwise.",
        )
        + heading("Refund timing")
        + paragraphs(
            "Approved refunds are sent to the original payment method after the return or other required evidence is "
            "reviewed. Bank or payment-provider posting time is outside our control. Original shipping and customs "
            "charges are not refundable unless required by law or the problem was our responsibility.",
            "Nothing in this policy limits consumer rights that cannot lawfully be excluded.",
        )
    ),
}


class ShopifyClient:
    def __init__(self) -> None:
        load_env_file(ENV_PATH)
        self.store = os.environ.get("SHOPIFY_STORE_DOMAIN", "").strip()
        self.token = os.environ.get("SHOPIFY_ADMIN_ACCESS_TOKEN", "").strip()
        self.api_version = os.environ.get("SHOPIFY_API_VERSION", "2026-01").strip()

        if not self.store or not self.token:
            raise RuntimeError("Missing Shopify Admin API configuration in .env.local")

    def graphql(self, query: str, variables: dict[str, Any] | None = None) -> dict[str, Any]:
        url = f"https://{self.store}/admin/api/{self.api_version}/graphql.json"
        payload = json.dumps({"query": query, "variables": variables or {}}).encode("utf-8")
        request = urllib.request.Request(
            url,
            data=payload,
            headers={
                "Content-Type": "application/json",
                "X-Shopify-Access-Token": self.token,
            },
            method="POST",
        )

        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                result = json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as error:
            body = error.read().decode("utf-8", errors="replace")
            raise RuntimeError(f"Shopify API HTTP {error.code}: {body}") from error

        if result.get("errors"):
            raise RuntimeError(f"Shopify GraphQL error: {json.dumps(result['errors'], ensure_ascii=False)}")

        return result["data"]

    def audit(self) -> dict[str, Any]:
        access_query = """
        query ComplianceAccessAudit {
          currentAppInstallation {
            accessScopes { handle }
          }
          shop {
            name
            contactEmail
          }
        }
        """
        access_data = self.graphql(access_query)
        scopes = {
            scope["handle"]
            for scope in access_data["currentAppInstallation"]["accessScopes"]
        }

        access_data["shop"]["shopPolicies"] = []
        if "read_legal_policies" not in scopes:
            return access_data

        policies_query = """
        query CompliancePoliciesAudit {
          shop {
            shopPolicies {
              type
              title
              body
              url
              updatedAt
            }
          }
        }
        """
        policies_data = self.graphql(policies_query)
        access_data["shop"]["shopPolicies"] = policies_data["shop"]["shopPolicies"]
        return access_data

    def update_policy(self, policy_type: str, body: str) -> dict[str, Any]:
        mutation = """
        mutation UpdatePolicy($shopPolicy: ShopPolicyInput!) {
          shopPolicyUpdate(shopPolicy: $shopPolicy) {
            shopPolicy {
              type
              title
              body
              url
              updatedAt
            }
            userErrors {
              field
              message
            }
          }
        }
        """
        data = self.graphql(
            mutation,
            {"shopPolicy": {"type": policy_type, "body": body}},
        )
        payload = data["shopPolicyUpdate"]
        if payload["userErrors"]:
            raise RuntimeError(f"{policy_type}: {json.dumps(payload['userErrors'], ensure_ascii=False)}")
        return payload["shopPolicy"]


def policy_summary(audit: dict[str, Any]) -> dict[str, Any]:
    policies = {policy["type"]: policy for policy in audit["shop"]["shopPolicies"]}
    has_read = any(
        scope["handle"] == "read_legal_policies"
        for scope in audit["currentAppInstallation"]["accessScopes"]
    )
    return {
        "shop": audit["shop"]["name"],
        "contactEmail": audit["shop"]["contactEmail"],
        "hasReadLegalPolicies": has_read,
        "hasWriteLegalPolicies": any(
            scope["handle"] == "write_legal_policies"
            for scope in audit["currentAppInstallation"]["accessScopes"]
        ),
        "policies": {
            policy_type: {
                "present": (
                    bool(policies.get(policy_type, {}).get("body", "").strip())
                    if has_read
                    else None
                ),
                "bodyLength": (
                    len(policies.get(policy_type, {}).get("body", ""))
                    if has_read
                    else None
                ),
                "url": policies.get(policy_type, {}).get("url"),
                "updatedAt": policies.get(policy_type, {}).get("updatedAt"),
            }
            for policy_type in POLICIES
        },
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Write the compliance policies. Without this flag, only audit the store.",
    )
    args = parser.parse_args()

    client = ShopifyClient()
    before = client.audit()
    before_summary = policy_summary(before)

    if not args.apply:
        print(json.dumps(before_summary, ensure_ascii=False, indent=2))
        return 0

    if not before_summary["hasWriteLegalPolicies"]:
        raise RuntimeError("The configured Shopify app does not have write_legal_policies scope")

    updated = []
    for policy_type, body in POLICIES.items():
        policy = client.update_policy(policy_type, body)
        updated.append(
            {
                "type": policy["type"],
                "bodyLength": len(policy["body"]),
                "url": policy["url"],
                "updatedAt": policy["updatedAt"],
            }
        )

    after = client.audit()
    result = {
        "updated": updated,
        "readBack": policy_summary(after),
    }
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (RuntimeError, urllib.error.URLError) as error:
        print(str(error), file=sys.stderr)
        raise SystemExit(1)
