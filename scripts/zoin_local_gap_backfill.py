#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import shutil
from pathlib import Path


SOURCE_ROOT = Path("/Volumes/ORICO/积域资料/积域-产品资料.rar/积域-产品资料/集域产品图")
TARGET_ROOT = Path("/Volumes/ORICO/积域资料/Zoin-上架前整理")
REPORT_DIR = TARGET_ROOT / "reports"

VEG_SOURCE = SOURCE_ROOT / "原创/蔬菜动物（GK602、GK603、GK604、GK605）"
RAVEN_SOURCE = SOURCE_ROOT / "原创/零限创意/GK105-渡鸦"

BACKFILL_PLAN = {
    "GK105": [
        ("产品/渡鸦-正面.png", "GK105-白底-local.png", "white"),
        ("产品/渡鸦-正面.png", "GK105-1.png", "main"),
        ("产品/渡鸦-侧面.png", "GK105-2.png", "main"),
        ("收单图/渡鸦收单图.png", "GK105-详情-local-01.png", "detail"),
        ("彩盒/渡鸦效果图一0317.png", "GK105-详情-local-02.png", "detail"),
        ("彩盒/渡鸦效果图二0317.png", "GK105-详情-local-03.png", "detail"),
    ],
    "GK602": [
        ("收单图/GK602榴莲鸡收单图.png", "GK602-详情-local-01.png", "detail"),
        ("彩盒/GK602-榴莲鸡效果图一0305.png", "GK602-详情-local-02.png", "detail"),
        ("彩盒/GK602-榴莲鸡效果图二0305.png", "GK602-详情-local-03.png", "detail"),
    ],
    "GK603": [
        ("收单图/GK603苦瓜鳄鱼收单图.png", "GK603-详情-local-01.png", "detail"),
        ("彩盒/GK603-苦瓜鳄鱼效果图一0305.png", "GK603-详情-local-02.png", "detail"),
        ("彩盒/GK603-苦瓜鳄鱼效果图二0305.png", "GK603-详情-local-03.png", "detail"),
    ],
    "GK604": [
        ("收单图/GK604-柠檬鱼 收单图.jpg", "GK604-详情-local-01.jpg", "detail"),
        ("彩盒/GK604-柠檬鱼效果图一0410.png", "GK604-详情-local-02.png", "detail"),
        ("彩盒/GK604-柠檬鱼效果图二0410.png", "GK604-详情-local-03.png", "detail"),
    ],
    "GK605": [
        ("收单图/GK605-蜜桃猪 收单图.jpg", "GK605-详情-local-01.jpg", "detail"),
        ("彩盒/GK605-蜜桃猪效果图一0410.png", "GK605-详情-local-02.png", "detail"),
        ("彩盒/GK605-蜜桃猪效果图二0410.png", "GK605-详情-local-03.png", "detail"),
    ],
}


def source_base(sku: str) -> Path:
    return RAVEN_SOURCE if sku == "GK105" else VEG_SOURCE


def copy_asset(source: Path, target: Path) -> str:
    if not source.exists():
        return "missing_source"
    target.parent.mkdir(parents=True, exist_ok=True)
    if target.exists():
        return "already_exists"
    shutil.copy2(source, target)
    return "copied"


def relocate_gk105_existing_spec() -> list[dict[str, str]]:
    folder = TARGET_ROOT / "images/GK105"
    current = folder / "GK105-1.png"
    target = folder / "GK105-详情-local-00.png"
    if not current.exists():
        return []
    if target.exists():
        current.unlink()
        action = "removed_duplicate_spec_main"
    else:
        current.rename(target)
        action = "renamed_spec_main_to_detail"
    return [
        {
            "sku": "GK105",
            "source": current.as_posix(),
            "target": target.as_posix(),
            "asset_type": "detail",
            "action": action,
        }
    ]


def main() -> int:
    rows: list[dict[str, str]] = []
    rows.extend(relocate_gk105_existing_spec())

    for sku, items in BACKFILL_PLAN.items():
        for relative_source, target_name, asset_type in items:
            source = source_base(sku) / relative_source
            target = TARGET_ROOT / "images" / sku / target_name
            action = copy_asset(source, target)
            rows.append(
                {
                    "sku": sku,
                    "source": source.as_posix(),
                    "target": target.as_posix(),
                    "asset_type": asset_type,
                    "action": action,
                }
            )

    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    csv_path = REPORT_DIR / "zoin-local-gap-backfill.csv"
    with csv_path.open("w", encoding="utf-8-sig", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=["sku", "source", "target", "asset_type", "action"])
        writer.writeheader()
        writer.writerows(rows)

    summary = {
        "rows": len(rows),
        "copied_count": sum(1 for row in rows if row["action"] == "copied"),
        "already_exists_count": sum(1 for row in rows if row["action"] == "already_exists"),
        "missing_source_count": sum(1 for row in rows if row["action"] == "missing_source"),
        "relocated_count": sum(1 for row in rows if row["action"].startswith("renamed") or row["action"].startswith("removed")),
        "csv": csv_path.as_posix(),
    }
    summary_path = REPORT_DIR / "zoin-local-gap-backfill-summary.json"
    summary_path.write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
