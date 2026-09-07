#!/usr/bin/env python3
"""Build a privacy-safe English B2B SEO baseline from Search Console CSV exports."""

from __future__ import annotations

import argparse
import csv
import dataclasses
import datetime as dt
import re
from pathlib import Path
from typing import Iterable


DIMENSION_FILE_HINTS = {
    "chart": ("chart", "图表"),
    "queries": ("queries", "query", "查询"),
    "pages": ("pages", "page", "网页", "页面"),
    "countries": ("countries", "country", "国家", "地区"),
    "devices": ("devices", "device", "设备"),
}

HEADER_ALIASES = {
    "clicks": ("clicks", "click", "点击次数", "点击"),
    "impressions": ("impressions", "impression", "展示次数", "展示"),
    "ctr": ("ctr", "click through rate", "点击率"),
    "position": ("position", "average position", "排名", "平均排名"),
}

# Versioned, explicit aliases. Keep the same version when comparing periods.
CLASSIFICATION_VERSION = "2026-09-07-v1"
BRAND_PATTERN = re.compile(
    r"(?<![a-z0-9])(?:jie?[ -]*star|jei[ -]*star|je[ -]*star|jee[ -]*star|"
    r"jeastar|giestar|geestar|jixstar|jystar|jiiostar|ji stare|"
    r"jiexing(?: toys)?|guangdong jiexing|guly|jiqi|xbert|iblocks?|tk[ -]*two|zoin)"
    r"(?![a-z0-9])", re.I
)

B2B_TERMS = (
    "wholesale",
    "manufacturer",
    "supplier",
    "distributor",
    "retailer",
    "private label",
    "oem",
    "odm",
    "bulk",
    "factory",
    "sourcing",
    "rfq",
    "moq",
)

DTC_TERMS = (
    "buy",
    "price",
    "review",
    "best",
    "for adults",
    "model kit",
    "model kits",
    "car kit",
    "car kits",
    "for sale",
    "instructions",
    "replacement parts",
)


@dataclasses.dataclass(frozen=True)
class PerformanceRow:
    label: str
    clicks: float
    impressions: float
    ctr: float
    position: float


@dataclasses.dataclass(frozen=True)
class Metrics:
    clicks: float
    impressions: float
    ctr: float
    position: float


def _normalize(value: str) -> str:
    return value.replace("\ufeff", "").strip().lower()


def _number(value: str | None) -> float:
    if not value:
        return 0.0
    cleaned = value.strip().replace(",", "")
    if cleaned.endswith("%"):
        return float(cleaned[:-1]) / 100
    return float(cleaned)


def _find_header(fieldnames: Iterable[str], aliases: Iterable[str]) -> str:
    normalized = {_normalize(name): name for name in fieldnames if name}
    for alias in aliases:
        match = normalized.get(_normalize(alias))
        if match:
            return match
    raise ValueError(f"Missing CSV column. Expected one of: {', '.join(aliases)}")


def _find_dimension_file(export_dir: Path, dimension: str) -> Path | None:
    hints = DIMENSION_FILE_HINTS[dimension]
    candidates = sorted(export_dir.glob("*.csv"))
    for candidate in candidates:
        normalized_name = _normalize(candidate.stem)
        if any(hint in normalized_name for hint in hints):
            return candidate
    return None


def read_dimension(export_dir: Path, dimension: str) -> list[PerformanceRow]:
    source = _find_dimension_file(export_dir, dimension)
    if source is None:
        return []

    with source.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        fieldnames = reader.fieldnames or []
        if not fieldnames:
            return []

        clicks_header = _find_header(fieldnames, HEADER_ALIASES["clicks"])
        impressions_header = _find_header(fieldnames, HEADER_ALIASES["impressions"])
        ctr_header = _find_header(fieldnames, HEADER_ALIASES["ctr"])
        position_header = _find_header(fieldnames, HEADER_ALIASES["position"])
        metric_headers = {clicks_header, impressions_header, ctr_header, position_header}
        label_header = next((name for name in fieldnames if name not in metric_headers), fieldnames[0])

        rows = []
        for record in reader:
            label = (record.get(label_header) or "").strip()
            if not label:
                continue
            rows.append(
                PerformanceRow(
                    label=label,
                    clicks=_number(record.get(clicks_header)),
                    impressions=_number(record.get(impressions_header)),
                    ctr=_number(record.get(ctr_header)),
                    position=_number(record.get(position_header)),
                )
            )
        return rows


def summarize(rows: Iterable[PerformanceRow]) -> Metrics:
    values = list(rows)
    clicks = sum(row.clicks for row in values)
    impressions = sum(row.impressions for row in values)
    weighted_position = sum(row.position * row.impressions for row in values)
    return Metrics(
        clicks=clicks,
        impressions=impressions,
        ctr=(clicks / impressions) if impressions else 0.0,
        position=(weighted_position / impressions) if impressions else 0.0,
    )


def classify_query(query: str) -> str:
    normalized = _normalize(query)
    if BRAND_PATTERN.search(normalized):
        return "brand"
    if any(re.search(r"\b" + re.escape(term) + r"\b", normalized) for term in B2B_TERMS):
        return "nonbrand_b2b"
    if any(re.search(r"\b" + re.escape(term) + r"\b", normalized) for term in DTC_TERMS):
        return "dtc"
    return "other"


def summarize_query_intents(rows: Iterable[PerformanceRow]) -> dict[str, Metrics]:
    groups: dict[str, list[PerformanceRow]] = {
        "brand": [],
        "nonbrand_b2b": [],
        "dtc": [],
        "other": [],
    }
    for row in rows:
        groups[classify_query(row.label)].append(row)
    return {name: summarize(group) for name, group in groups.items()}


def _format_number(value: float) -> str:
    return f"{value:,.0f}"


def _format_percent(value: float) -> str:
    return f"{value * 100:.1f}%"


def _format_position(value: float) -> str:
    return f"{value:.1f}" if value else "-"


def _format_change(current: float, previous: float | None, percent: bool = False) -> str:
    if previous is None:
        return "N/A"
    if previous == 0:
        return "new" if current else "-"
    change = (current - previous) / previous
    return _format_percent(change) if percent else f"{change * 100:+.1f}%"


def _escape_markdown(value: str) -> str:
    return value.replace("|", "\\|").replace("\n", " ")


def _dimension_table(rows: list[PerformanceRow], limit: int = 10) -> list[str]:
    lines = [
        "| Item | Clicks | Impressions | CTR | Avg. position |",
        "| --- | ---: | ---: | ---: | ---: |",
    ]
    for row in sorted(rows, key=lambda item: (-item.impressions, -item.clicks))[:limit]:
        lines.append(
            f"| {_escape_markdown(row.label)} | {_format_number(row.clicks)} | "
            f"{_format_number(row.impressions)} | {_format_percent(row.ctr)} | "
            f"{_format_position(row.position)} |"
        )
    if len(lines) == 2:
        lines.append("| No exported data | - | - | - | - |")
    return lines


def build_report(current_dir: Path, previous_dir: Path | None = None, min_impressions: int = 5) -> str:
    current = {name: read_dimension(current_dir, name) for name in DIMENSION_FILE_HINTS}
    previous = (
        {name: read_dimension(previous_dir, name) for name in DIMENSION_FILE_HINTS}
        if previous_dir
        else {name: [] for name in DIMENSION_FILE_HINTS}
    )
    current_total = summarize(current["chart"]) if current["chart"] else None
    previous_total = summarize(previous["chart"]) if previous["chart"] else None
    visible = summarize(current["queries"])
    current_intents = summarize_query_intents(current["queries"])
    previous_intents = summarize_query_intents(previous["queries"])
    b2b_opportunities = [
        row for row in current["queries"]
        if classify_query(row.label) == "nonbrand_b2b" and row.impressions >= min_impressions
    ]
    def period(rows: list[PerformanceRow]) -> str:
        dates = sorted(row.label for row in rows)
        return f"{dates[0]} to {dates[-1]} ({len(dates)} daily rows)" if dates else "N/A: Chart CSV unavailable"

    lines = [
        "# JIESTAR Non-brand SEO Baseline", "",
        f"Generated: {dt.date.today().isoformat()}",
        f"Current period: {period(current['chart'])}",
        f"Previous period: {period(previous['chart'])}",
        f"Query classification: {CLASSIFICATION_VERSION}", "",
        "> Source: Google Search Console CSV exports. Query tables can omit anonymized or truncated queries. They are not property totals.", "",
        "## Export filters", "",
    ]
    for label, directory in [("Current", current_dir), ("Previous", previous_dir)]:
        source = next((p for p in sorted(directory.glob("*.csv")) if "filter" in p.stem.lower() or "过滤器" in p.stem), None) if directory else None
        if source:
            with source.open(encoding="utf-8-sig", newline="") as handle:
                records = list(csv.reader(handle))
            lines.extend(f"- {label}: " + " / ".join(_escape_markdown(v) for v in row) for row in records[1:])
        else:
            lines.append(f"- {label}: filter metadata unavailable; verify comparability before interpreting growth.")
    lines += ["", "## Property totals (Chart CSV only)", "", "| Metric | Current | Previous | Change |", "| --- | ---: | ---: | ---: |"]
    for key, label, formatter in [("clicks", "Clicks", _format_number), ("impressions", "Impressions", _format_number), ("ctr", "CTR", _format_percent), ("position", "Avg. position", _format_position)]:
        now = getattr(current_total, key) if current_total else None
        prior = getattr(previous_total, key) if previous_total else None
        change = _format_change(now, prior) if now is not None and key != "position" else "N/A"
        lines.append(f"| {label} | {formatter(now) if now is not None else 'N/A'} | {formatter(prior) if prior is not None else 'N/A'} | {change} |")
    lines += ["", "## Query coverage", ""]
    if current["queries"]:
        lines.append(f"- Visible query table: {_format_number(visible.clicks)} clicks / {_format_number(visible.impressions)} impressions / {len(current['queries'])} rows.")
        nonbrand = summarize(row for row in current["queries"] if classify_query(row.label) != "brand")
        lines.append(f"- Visible non-brand (B2B + DTC + other): {_format_number(nonbrand.clicks)} clicks / {_format_number(nonbrand.impressions)} impressions. Other queries are not necessarily commercial opportunities.")
        if current_total:
            dc, di = current_total.clicks - visible.clicks, current_total.impressions - visible.impressions
            lines.append(f"- Unattributed difference: {_format_number(dc)} clicks / {_format_number(di)} impressions. Never assign this difference to non-brand.")
            if dc < 0 or di < 0:
                lines.append("- WARNING: query totals exceed chart totals; check filters and aggregation before comparison.")
    else:
        lines.append("- Query CSV missing or empty: segmentation unavailable, not zero traffic.")
    lines += ["", "## Query intent (visible queries only)", "", "| Segment | Clicks | Impressions | CTR | Avg. position | Impression change |", "| --- | ---: | ---: | ---: | ---: | ---: |"]

    intent_labels = {
        "brand": "Brand (including aliases and sub-brands)",
        "nonbrand_b2b": "Non-brand B2B",
        "dtc": "Non-brand DTC",
        "other": "Non-brand other / unclear intent",
    }
    for key, label in intent_labels.items():
        if not current["queries"]:
            lines.append(f"| {label} | N/A | N/A | N/A | N/A | N/A |")
            continue
        metrics = current_intents[key]
        prior = previous_intents[key]
        lines.append(
            f"| {label} | {_format_number(metrics.clicks)} | {_format_number(metrics.impressions)} | "
            f"{_format_percent(metrics.ctr)} | {_format_position(metrics.position)} | "
            f"{_format_change(metrics.impressions, prior.impressions if previous['queries'] else None)} |"
        )

    lines.extend(
        [
            "",
            "## Non-brand B2B opportunities",
            "",
            *_dimension_table(b2b_opportunities, limit=20),
        ]
    )

    for dimension, heading in (
        ("pages", "Landing pages"),
        ("countries", "Countries"),
        ("devices", "Devices"),
    ):
        lines.extend(["", f"## {heading}", "", *_dimension_table(current[dimension])])

    lines.extend(
        [
            "",
            "## Measurement gates",
            "",
            "- Qualified organic inquiries: N/A until matched to verified acquisition and business qualification records. Form submissions alone are not qualified inquiries.",
            "- Property and query metrics use different aggregation; weighted positions reconstructed from rounded CSV rows are approximate.",
            "- Keep raw exports and this query-level report private under gitignored output/seo/.",
            "",
            "- Do not report an exact current rank without a dated Search Console export or an explicitly scoped engine/country/query sample.",
            "- Primary KPI: qualified English B2B inquiries attributed to organic search.",
            "- Secondary KPIs: non-brand B2B impressions, clicks, CTR, and 28-day position trends.",
        ]
    )
    return "\n".join(lines) + "\n"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--current", type=Path, required=True, help="Directory containing current-period GSC CSV files")
    parser.add_argument("--previous", type=Path, help="Directory containing previous-period GSC CSV files")
    parser.add_argument("--output", type=Path, help="Markdown output path; stdout when omitted")
    parser.add_argument("--min-impressions", type=int, default=5, help="Minimum impressions for the B2B opportunity table")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    report = build_report(args.current, args.previous, args.min_impressions)
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(report, encoding="utf-8")
        print(args.output)
    else:
        print(report, end="")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
