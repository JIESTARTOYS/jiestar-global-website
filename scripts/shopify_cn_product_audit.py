#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import json
import re
import sys
import time
import urllib.error
import urllib.request
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import shopify_cn_pending_import as cn_import
import shopify_sample_import as base_import
import shopify_title_cleanup as title_cleanup


OUT_DIR = Path("/private/tmp/jiestar-shopify-cn-product-audit")
PENDING_PLAN = Path("/private/tmp/jiestar-cn-pending/pending-cn-products-plan.csv")
API_VERSION_FALLBACK = "2026-01"
DIFFICULTY_DEFAULT = "See product package"

EXACT_CN_NAME_MAP = {
    "装甲导弹车": "Armored Missile Vehicle",
    "铲土机": "Bulldozer",
    "水晶搅拌车": "Crystal Mixer Truck",
    "水晶采集机甲": "Crystal Mining Mecha",
    "咬手老虎": "Biting Tiger",
    "长颈鹿篮球架": "Giraffe Basketball Hoop",
    "皇家胜利号": "Royal Victory Ship",
    "飞翔的荷兰人": "Flying Dutchman Ship",
    "战国关船": "Sengoku Warship",
    "埃尔城堡": "El Castle",
    "急速警车": "High-Speed Police Car",
    "拖头车": "Tractor Truck",
    "工程装卸车": "Engineering Loader Truck",
    "云梯消防车": "Aerial Ladder Fire Truck",
    "烈火云梯车": "Blaze Aerial Ladder Fire Truck",
    "海岸消防": "Coastal Fire Rescue",
    "越野消防车": "Off-Road Fire Truck",
    "救援消防艇": "Rescue Fire Boat",
    "泵梯车": "Pump Ladder Truck",
    "吊钩式消防车": "Hook-Lift Fire Truck",
    "TH10 蒸汽火车": "TH10 Steam Train",
    "西部火车": "Western Train",
    "CO 490蒸汽机车": "CO 490 Steam Locomotive",
    "蝴蝶": "Butterfly",
    "蜻蜓": "Dragonfly",
    "哨兵无人机": "Sentinel Drone",
    "红旗-9防空导弹": "HQ-9 Air Defense Missile",
    "苏-35": "SU-35 Fighter Jet",
    "闪刃脉冲": "Blade Pulse Mecha",
    "月蚀": "Eclipse Mecha",
    "突击迅龙": "Assault Raptor Mecha",
    "探鱼": "Fishing Display Model",
    "浮空城": "Floating Castle",
    "玩具商城": "Toy Shopping Mall",
    "寿司角": "Sushi Corner",
    "火车交汇站": "Railway Junction Station",
    "工程升降机": "Engineering Lift",
    "枪火荣耀系列【6小款】": "Glory Firearms Series 6-Pack",
    "枪火荣耀系列【12小款】": "Glory Firearms Series 12-Pack",
}

SOURCE_HINT_MAP = [
    ("二战飞机", "WWII Aircraft"),
    ("手拍鼓", "Hand Drum"),
    ("敲琴", "Xylophone"),
    ("咬手老虎", "Biting Tiger"),
    ("手电", "Flashlight"),
    ("学步车", "Baby Walker"),
    ("农夫屋", "Farmer House"),
    ("布鼓", "Cloth Drum"),
    ("攀爬猴", "Climbing Monkey"),
    ("恐龙车", "Dinosaur Vehicle"),
    ("收银机大", "Large Cash Register"),
    ("收银机小", "Small Cash Register"),
    ("脚踏琴", "Foot Piano"),
    ("篮球架", "Basketball Hoop"),
    ("三角体", "Triangle Activity Cube"),
    ("末日火车", "Post-Apocalyptic Train"),
    ("蝰蛇直升机", "Viper Helicopter"),
    ("装甲输送车", "Armored Personnel Carrier"),
    ("M1126", "M1126 Armored Personnel Carrier"),
    ("乐器积木", "Musical Instrument"),
    ("末日餐厅", "Post-Apocalyptic Restaurant"),
    ("末日银行", "Post-Apocalyptic Bank"),
    ("狮子酒吧", "Lion Pub"),
    ("喷泉购物中心", "Fountain Shopping Center"),
    ("小威尼", "Little Venice"),
    ("红砖大学", "Red Brick University"),
    ("警察局", "Police Station"),
    ("恐龙", "Dinosaur"),
]

MANUAL_TITLE_BY_BASE = {
    "10211": "JIESTAR Green Hypercar Building Block Set",
    "10213": "JIESTAR Blue Sports Car Building Block Set",
    "20036": "JIESTAR Police Tactical Truck Building Block Set",
    "20038": "JIESTAR Tiger Warrior Mecha Building Block Set 12-Pack",
    "20040-20047": "JIESTAR Military Vehicle Building Block Set 8-Pack",
    "20053": "JIESTAR Convenience Store Rescue Scene Building Block Set",
    "20072": "JIESTAR 6-in-1 Guardian Robot Building Block Set",
    "20074-20076": "JIESTAR Black Storm Mecha Building Block Set 3-Pack",
    "20100": "JIESTAR SWAT Hero Mecha Building Block Set",
    "20108-28037": "JIESTAR Mini Adventure Building Block Set 2-Pack",
    "20322-20325": "JIESTAR Theme Park Playground Building Block Set 4-Pack",
    "20332-20335": "JIESTAR Extreme Racer Building Block Set 4-Pack",
    "20387-20391": "JIESTAR Fashion Doll Building Block Set 5-Pack",
    "20392": "JIESTAR Animal Rescue Vehicle Building Block Set",
    "20514-20516": "JIESTAR Fire Rescue Vehicle Building Block Set 3-Pack",
    "20517-20536": "JIESTAR City Street Shop Building Block Set 20-Pack",
    "20537-20544": "JIESTAR Forest Cabin Building Block Set 8-Pack",
    "20546": "JIESTAR Rainforest Adventure Building Block Set",
    "20547-20557": "JIESTAR Treasure Transport Adventure Building Block Set 11-Pack",
    "21049": "JIESTAR Engineering Team Building Block Set",
    "21050": "JIESTAR 6-in-1 Engineering Vehicle Building Block Set",
    "21122-21129": "JIESTAR Beach Bar Building Block Set 8-Pack",
    "22031": "JIESTAR 6-in-1 Fire Rescue Vehicle Building Block Set",
    "23028": "JIESTAR American Tank 3-in-1 Building Block Set",
    "23040-23047": "JIESTAR WWII Aircraft Building Block Set 8-Pack",
    "23059": "JIESTAR Military Motorcycle Building Block Set",
    "23061": "JIESTAR Mobile Artillery Vehicle Building Block Set",
    "23062": "JIESTAR Amphibious Armored Transport Vehicle Building Block Set",
    "23063-23072": "JIESTAR All-Terrain Armored Vehicle Building Block Set 10-Pack",
    "23079-23080": "JIESTAR Naval Patrol Boat Building Block Set 2-Pack",
    "23081-23086": "JIESTAR Military Vehicle 6-in-1 Building Block Set",
    "23100-23110": "JIESTAR Desert Armored Vehicle Building Block Set 11-Pack",
    "23101-23102": "JIESTAR Desert Armored Vehicle Building Block Set 2-Pack",
    "23103-23106": "JIESTAR Vanguard Squad Military Vehicle Building Block Set 4-Pack",
    "25009": "JIESTAR Sports Car Collection Building Block Set",
    "25877": "JIESTAR Musical Activity Toy Building Block Set",
    "25887": "JIESTAR Hammer Ball Game Building Block Set",
    "25888-25889": "JIESTAR Activity Table Building Block Set 2-Pack",
    "29001-29016": "JIESTAR Military Vehicle Collection Building Block Set 16-Pack",
    "30001-30009": "JIESTAR Pirate Ship Collection Building Block Set 9-Pack",
    "35001": "JIESTAR Classic Sailing Ship Building Block Set",
    "35002": "JIESTAR Ghost Ship Building Block Set",
    "36100": "JIESTAR Oriental Tower Building Block Set",
    "37001": "JIESTAR Aircraft Building Block Set",
    "37400": "JIESTAR Roller Coaster Building Block Set",
    "37401": "JIESTAR Pirate Ship Ride Building Block Set",
    "37402": "JIESTAR Pendulum Ride Building Block Set",
    "38005": "JIESTAR Pet Park Building Block Set",
    "39101": "JIESTAR Japanese Castle Building Block Set",
    "50001": "JIESTAR Jungle Tree House Building Block Set",
    "50002": "JIESTAR Police Station Building Block Set",
    "50003": "JIESTAR Emergency Police Station Building Block Set",
    "51010": "JIESTAR Engineering Truck Building Block Set",
    "52000": "JIESTAR Fire Station Building Block Set",
    "54101-54104": "JIESTAR Police and Aircraft Building Block Set 4-Pack",
    "55000": "JIESTAR Service Station Building Block Set",
    "57001": "JIESTAR Farm Tractor Building Block Set",
    "57003": "JIESTAR Construction Loader Building Block Set",
    "57033": "JIESTAR Vintage Typewriter Building Block Set",
    "58004": "JIESTAR Space Blaster Building Block Set",
    "58007": "JIESTAR Space Aircraft Building Block Set",
    "58008": "JIESTAR Military Helicopter Building Block Set",
    "58014": "JIESTAR Motorcycle Building Block Set",
    "58026": "JIESTAR Cherry Blossom Tree Building Block Set",
    "58049": "JIESTAR Race Car Building Block Set",
    "58058": "JIESTAR Stealth Aircraft Building Block Set",
    "58124": "JIESTAR Sailboat Building Block Set",
    "59070": "JIESTAR Pet Friends Building Block Set",
    "59072": "JIESTAR City Life Minifigure Building Block Set",
    "59151": "JIESTAR Pirate Ship Building Block Set",
    "60001": "JIESTAR Submarine Building Block Set",
    "61001-61005": "JIESTAR Military Vehicle Building Block Set 5-Pack",
    "61003": "JIESTAR Missile Launcher Vehicle Building Block Set",
    "61008": "JIESTAR Patrol Boat Building Block Set",
    "61009-61013": "JIESTAR Military Aircraft and Vehicle Building Block Set 5-Pack",
    "61022": "JIESTAR Military Vehicle Collection Building Block Set",
    "61023": "JIESTAR Armored Personnel Carrier Building Block Set",
    "61024": "JIESTAR Military Mission Building Block Set",
    "61026": "JIESTAR Military Command Truck Building Block Set",
    "61027": "JIESTAR Military Helicopter Building Block Set",
    "61036": "JIESTAR Battle Tank Building Block Set",
    "61041": "JIESTAR Desert Battle Tank Building Block Set",
    "61043": "JIESTAR Military Helicopter Building Block Set",
    "61044": "JIESTAR Fighter Jet Building Block Set",
    "61046": "JIESTAR Military Transport Aircraft Building Block Set",
    "61051": "JIESTAR Fighter Jet Building Block Set",
    "61052": "JIESTAR Stealth Fighter Jet Building Block Set",
    "61054-61055": "JIESTAR Military Bomber Aircraft Building Block Set 2-Pack",
    "67000-67006": "JIESTAR Mecha and Military Vehicle Building Block Set 7-Pack",
    "67008": "JIESTAR Red Mecha Building Block Set",
    "69000": "JIESTAR White Mecha Building Block Set",
    "80001": "JIESTAR Fun Park Building Block Set",
    "80002-80003": "JIESTAR Ice Cream Truck Building Block Set 2-Pack",
    "80004-80007": "JIESTAR Amusement Park Building Block Set 4-Pack",
    "81003-81004": "JIESTAR Fantasy Castle Carriage Building Block Set 2-Pack",
    "86001": "JIESTAR Mechanical Bird Building Block Set",
    "87001-87003": "JIESTAR Interactive Game Room Building Block Set 3-Pack",
    "87011": "JIESTAR Laboratory Classroom Building Block Set",
    "89000-89007": "JIESTAR Street Food Restaurant Building Block Set 8-Pack",
    "89100": "JIESTAR Corner Hotel Building Block Set",
    "89104": "JIESTAR Railway Station Building Block Set",
    "89110": "JIESTAR European Corner Hotel Building Block Set",
    "89111": "JIESTAR City Bank Building Block Set",
    "89124": "JIESTAR Classic Townhouse Building Block Set",
    "89125": "JIESTAR European Townhouse Building Block Set",
    "89126": "JIESTAR Cafe Townhouse Building Block Set",
    "89132": "JIESTAR Tram Station Building Block Set",
    "89135": "JIESTAR City Hospital Building Block Set",
    "89143": "JIESTAR Corner Bakery Building Block Set",
    "89152": "JIESTAR Western Mine Building Block Set",
    "91000": "JIESTAR Engineering Forklift Building Block Set",
    "91001": "JIESTAR Off-Road Tow Truck Building Block Set",
    "91004": "JIESTAR Engineering Lift Truck Building Block Set",
    "91006": "JIESTAR Remote Control Off-Road Vehicle Building Block Set",
    "91020": "JIESTAR Motorcycle Building Block Set",
    "91021": "JIESTAR Racing Motorcycle Building Block Set",
    "91025": "JIESTAR Adventure Motorcycle Building Block Set",
    "91029": "JIESTAR Formula Race Car Building Block Set",
    "92000": "JIESTAR 1:14 Sports Car Building Block Set",
    "92002": "JIESTAR Luxury SUV Building Block Set",
    "92003": "JIESTAR Formula Race Car Building Block Set",
    "92005": "JIESTAR Semi Truck Building Block Set",
    "92008": "JIESTAR 1:14 Racing Sports Car Building Block Set",
    "92009": "JIESTAR Classic Muscle Car Building Block Set",
    "92010": "JIESTAR Sports Coupe Building Block Set",
    "92018": "JIESTAR 1:14 Supercar Building Block Set",
    "92021": "JIESTAR 1:14 Luxury SUV Building Block Set",
    "92024": "JIESTAR 1:10 Touring Race Car Building Block Set",
    "92025": "JIESTAR 1:8 Sports Car Building Block Set",
    "92026": "JIESTAR Ocean Liner Building Block Set",
    "92033": "JIESTAR Race Car Building Block Set",
    "92300": "JIESTAR Supercar Building Block Set",
    "92304": "JIESTAR Vintage Motorcycle Sidecar Building Block Set",
    "92307": "JIESTAR Steam Train Collection Building Block Set",
    "92314": "JIESTAR Succulent Plant Building Block Set",
    "92331-92336": "JIESTAR Sports Car Model Building Block Set 6-Pack",
    "92362": "JIESTAR Flower Bouquet Building Block Set",
    "92363": "JIESTAR Flower Bouquet Building Block Set",
    "92365": "JIESTAR Rose Bouquet Building Block Set",
    "92401": "JIESTAR Rifle Model Building Block Set",
    "92500": "JIESTAR Sports Car Collection Building Block Set",
    "FF10011": "JIESTAR Sports Car Building Block Set",
    "FF10015": "JIESTAR Off-Road SUV Building Block Set",
    "FF10016": "JIESTAR Supercar Building Block Set",
    "FF10019": "JIESTAR Sports Car Building Block Set",
    "FF10021": "JIESTAR Blue Supercar Building Block Set",
    "FF10022": "JIESTAR Off-Road Vehicle Building Block Set",
    "FF10024": "JIESTAR Classic SUV Building Block Set",
    "FF10035": "JIESTAR Classic SUV Building Block Set",
    "FF11012": "JIESTAR Cement Mixer Truck Building Block Set",
    "JJ9025": "JIESTAR Ice Castle Building Block Set",
    "JJ9036": "JIESTAR Flower Shop Building Block Set",
    "JJ9042": "JIESTAR Halloween Cottage Building Block Set",
    "JJ9095-JJ9096": "JIESTAR Stealth Fighter Aircraft Building Block Set 2-Pack",
    "JJ9169": "JIESTAR Race Car Building Block Set",
    "JJ9193": "JIESTAR Carousel Building Block Set",
    "JJ9224": "JIESTAR Pink Semi Truck Building Block Set",
    "JJ9252": "JIESTAR Flower Bouquet Building Block Set",
}

NAME_FIXES = {
    "Reloaded Off-Road Vehicle": "Heavy Off-Road Vehicle",
    "Punch Hard": "Heavy Punch Police Vehicle",
    "Snails": "Snail",
    "Eco-Friendly Car": "Eco-Friendly Truck",
    "All Terrain Fire Truck": "All-Terrain Fire Truck",
    "Land Defense Interceptor Vehicle": "Land Defense Interceptor Vehicle",
    "Kunyin Mecha": "Kunyin Mecha",
    "Qianyang Mecha": "Qianyang Mecha",
    "Barbarian King Mecha": "Barbarian King Mecha",
}

ACRONYM_FIXES = {
    "Rc": "RC",
    "Suv": "SUV",
    "Swat": "SWAT",
    "Th10": "TH10",
    "Co 490": "CO 490",
    "Hq-9": "HQ-9",
    "Su-35": "SU-35",
    "Wwii": "WWII",
    "Lrdg": "LRDG",
    "M1126": "M1126",
}


@dataclass
class ShopifyProduct:
    id: str
    handle: str
    title: str
    status: str
    vendor: str
    variants: list[dict[str, str]]
    metafields: dict[str, str]


def has_cjk(value: str) -> bool:
    return bool(re.search(r"[\u3400-\u9fff]", value or ""))


def normalize_spaces(value: str) -> str:
    value = re.sub(r"\s+", " ", value or "")
    value = re.sub(r"\s+([,.)\]])", r"\1", value)
    value = re.sub(r"([(])\s+", r"\1", value)
    return value.strip(" .")


def apply_title_case(value: str) -> str:
    value = normalize_spaces(value)
    value = value.replace(".", " ").replace("/", " ")
    value = re.sub(r"\s+", " ", value)

    def title_word(match: re.Match[str]) -> str:
        word = match.group(0)
        if re.fullmatch(r"[A-Z0-9-]{2,}", word):
            return word
        return word[:1].upper() + word[1:].lower()

    titled = re.sub(r"[A-Za-z][A-Za-z0-9-]*", title_word, value)

    for old, new in ACRONYM_FIXES.items():
        titled = re.sub(rf"\b{re.escape(old)}\b", new, titled)

    return normalize_spaces(NAME_FIXES.get(titled, titled))


def clean_title_fragment(value: str) -> str:
    value = normalize_spaces(value)
    value = re.sub(r"\|.*$", "", value).strip()
    value = re.sub(r"中英通用盒|回力功能", "", value, flags=re.I)
    value = re.sub(r"Display box", "", value, flags=re.I)
    value = re.sub(r"\s+", " ", value).strip(" .|-")

    if has_cjk(value):
        value = EXACT_CN_NAME_MAP.get(value, "")

    if not value:
        return ""

    value = apply_title_case(value)
    for pattern, replacement in title_cleanup.SENSITIVE_REPLACEMENTS:
        value = pattern.sub(replacement, value)
    value = title_cleanup.ensure_jiestar_prefix(value).removeprefix("JIESTAR ").strip()
    return normalize_spaces(value)


def source_hint(folder_name: str) -> str:
    for key, value in SOURCE_HINT_MAP:
        if key in folder_name:
            return value
    return ""


def row_name(row: base_import.WorkbookRow | None) -> str:
    if not row:
        return ""
    return clean_title_fragment(row.name_en) or clean_title_fragment(row.name_cn)


def title_from_rows(base: str, skus: list[str], rows: list[base_import.WorkbookRow | None], source_folder: str) -> tuple[str, str, bool]:
    compact_base = re.sub(r"（.*?）|\(.*?\)", "", base).strip()
    if compact_base in MANUAL_TITLE_BY_BASE:
        return MANUAL_TITLE_BY_BASE[compact_base], "visual_manual_override", True
    if compact_base in title_cleanup.SAFE_TITLE_BY_BASE:
        return title_cleanup.SAFE_TITLE_BY_BASE[compact_base], "safe_override", True

    usable_rows = [row for row in rows if row]
    names = [row_name(row) for row in rows]
    names = [name for name in names if name]
    series_values = sorted({clean_title_fragment(row.series_en) for row in usable_rows if clean_title_fragment(row.series_en)})
    hint = source_hint(source_folder)

    if len(skus) == 1:
        if names:
            title = f"JIESTAR {names[0]} Building Block Set"
            return title_cleanup.apply_sensitive_replacements(normalize_spaces(title))[0], "excel_name", True
        if hint:
            return normalize_spaces(f"JIESTAR {hint} Building Block Set"), "source_folder_hint", True
        if series_values:
            return normalize_spaces(f"JIESTAR {series_values[0]} Building Block Set {skus[0]}"), "excel_series_only", False
        return normalize_spaces(f"JIESTAR Building Block Set {skus[0]}"), "manual_no_title_source", False

    pack = f"{len(skus)}-Pack"
    if hint:
        return normalize_spaces(f"JIESTAR {hint} Building Block Set {pack}"), "source_folder_hint_pack", True
    if len(series_values) == 1:
        return normalize_spaces(f"JIESTAR {series_values[0]} Building Block Set {pack}"), "excel_series_pack", True
    if names and len(names) == len(skus) and len(skus) <= 3:
        joined = ", ".join(names[:-1]) + f" and {names[-1]}" if len(names) > 1 else names[0]
        return normalize_spaces(f"JIESTAR {joined} Building Block Set {pack}"), "excel_names_pack", True
    return normalize_spaces(f"JIESTAR Building Block Set {pack}"), "manual_no_title_source_pack", False


def expected_metafields(rows: list[base_import.WorkbookRow | None], all_rows_required: bool) -> tuple[dict[str, str], list[str]]:
    reasons = []
    complete = all(row is not None for row in rows)
    usable_rows = [row for row in rows if row]

    if not complete and all_rows_required:
        reasons.append("partial_or_missing_workbook_rows")
        return {"specs.difficulty_level": DIFFICULTY_DEFAULT}, reasons

    piece_counts = [base_import.parse_piece_count(row.notes) for row in usable_rows if base_import.parse_piece_count(row.notes)]
    ages = sorted({row.age for row in usable_rows if row.age})
    finished_sizes = [row.finished_size for row in usable_rows if row.finished_size]
    package_sizes = sorted({row.package_size for row in usable_rows if row.package_size})
    series_values = sorted({row.series_en for row in usable_rows if row.series_en})

    metafields = {
        "specs.piece_count": str(sum(int(count) for count in piece_counts)) if piece_counts else "",
        "specs.recommended_age": ", ".join(ages),
        "specs.finished_model_size": " / ".join(finished_sizes),
        "specs.package_size": ", ".join(package_sizes),
        "specs.difficulty_level": DIFFICULTY_DEFAULT,
        "custom.series": series_values[0] if len(series_values) == 1 else "",
    }
    return {key: normalize_spaces(value) for key, value in metafields.items() if value}, reasons


def load_source_folder_map() -> dict[str, str]:
    if not PENDING_PLAN.exists():
        return {}

    with PENDING_PLAN.open(encoding="utf-8", newline="") as file:
        return {row["target_prefix"]: row["folder_name"] for row in csv.DictReader(file) if row.get("target_prefix")}


def values_differ(current: str, expected: str) -> bool:
    return normalize_spaces(current) != normalize_spaces(expected)


class ShopifyAdmin:
    def __init__(self) -> None:
        base_import.load_dotenv(Path(".env.local"))
        self.domain = base_import.os.environ.get("SHOPIFY_STORE_DOMAIN", "").strip()
        self.version = base_import.os.environ.get("SHOPIFY_API_VERSION", API_VERSION_FALLBACK).strip() or API_VERSION_FALLBACK
        self.token = base_import.os.environ.get("SHOPIFY_ADMIN_ACCESS_TOKEN", "").strip()

        if not self.domain:
            raise RuntimeError("Missing SHOPIFY_STORE_DOMAIN in .env.local")
        if not self.token:
            raise RuntimeError("Missing SHOPIFY_ADMIN_ACCESS_TOKEN in .env.local")

    def graphql(self, query: str, variables: dict[str, Any] | None = None) -> dict[str, Any]:
        request = urllib.request.Request(
            f"https://{self.domain}/admin/api/{self.version}/graphql.json",
            data=json.dumps({"query": query, "variables": variables or {}}).encode("utf-8"),
            method="POST",
            headers={"Content-Type": "application/json", "X-Shopify-Access-Token": self.token},
        )

        try:
            with base_import.urlopen_with_retries(request, timeout=90) as response:
                payload = json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as error:
            body = error.read().decode("utf-8", errors="ignore")
            raise RuntimeError(f"Shopify HTTP {error.code}: {body[:1200]}") from error

        if payload.get("errors"):
            raise RuntimeError(f"Shopify GraphQL errors: {payload['errors']}")
        return payload["data"]

    def products(self) -> list[ShopifyProduct]:
        products: list[ShopifyProduct] = []
        cursor = None

        while True:
            data = self.graphql(
                """
                query ProductsForCnAudit($cursor: String) {
                  products(first: 250, after: $cursor, sortKey: ID) {
                    pageInfo {
                      hasNextPage
                      endCursor
                    }
                    nodes {
                      id
                      handle
                      title
                      status
                      vendor
                      variants(first: 250) {
                        nodes {
                          id
                          title
                          sku
                        }
                      }
                      metafields(first: 50) {
                        nodes {
                          namespace
                          key
                          value
                        }
                      }
                    }
                  }
                }
                """,
                {"cursor": cursor},
            )
            page = data["products"]

            for product in page["nodes"]:
                products.append(
                    ShopifyProduct(
                        id=product["id"],
                        handle=product["handle"],
                        title=product["title"],
                        status=product["status"],
                        vendor=product.get("vendor") or "",
                        variants=[
                            {"id": variant["id"], "sku": (variant.get("sku") or "").strip(), "title": variant.get("title") or ""}
                            for variant in product["variants"]["nodes"]
                        ],
                        metafields={
                            f"{node['namespace']}.{node['key']}": node["value"]
                            for node in product["metafields"]["nodes"]
                        },
                    )
                )

            if not page["pageInfo"]["hasNextPage"]:
                break
            cursor = page["pageInfo"]["endCursor"]

        return products

    def update_product(self, product_id: str, title: str, metafields: dict[str, str]) -> None:
        metafield_inputs = []
        for full_key, value in metafields.items():
            namespace, key = full_key.split(".", 1)
            metafield_inputs.append(
                {
                    "namespace": namespace,
                    "key": key,
                    "type": "number_integer" if full_key == "specs.piece_count" else "single_line_text_field",
                    "value": value,
                }
            )

        data = self.graphql(
            """
            mutation UpdateCnProductAudit($product: ProductUpdateInput!) {
              productUpdate(product: $product) {
                product {
                  id
                  title
                }
                userErrors {
                  field
                  message
                }
              }
            }
            """,
            {"product": {"id": product_id, "title": title, "metafields": metafield_inputs}},
        )
        base_import.assert_no_user_errors("productUpdate", data["productUpdate"]["userErrors"])

    def delete_metafields(self, product_id: str, full_keys: list[str]) -> None:
        if not full_keys:
            return

        identifiers = []
        for full_key in full_keys:
            namespace, key = full_key.split(".", 1)
            identifiers.append({"ownerId": product_id, "namespace": namespace, "key": key})

        data = self.graphql(
            """
            mutation DeleteCnProductMetafields($metafields: [MetafieldIdentifierInput!]!) {
              metafieldsDelete(metafields: $metafields) {
                deletedMetafields {
                  ownerId
                  namespace
                  key
                }
                userErrors {
                  field
                  message
                }
              }
            }
            """,
            {"metafields": identifiers},
        )
        base_import.assert_no_user_errors("metafieldsDelete", data["metafieldsDelete"]["userErrors"])


def build_audit() -> tuple[list[dict[str, str]], dict[str, int]]:
    rows_by_sku = base_import.load_workbook_rows()
    manifest, local_skipped = cn_import.build_manifest()
    source_map = load_source_folder_map()
    admin = ShopifyAdmin()
    products = admin.products()
    products_by_handle = {product.handle: product for product in products}

    rows: list[dict[str, str]] = []
    matched = 0

    for item in manifest:
        skus = [variant["sku"] for variant in item["variants"]]
        product = products_by_handle.get(item["handle"])
        source_folder = source_map.get(item["base"], "")
        workbook_rows = [cn_import.row_for_sku(rows_by_sku, sku) for sku in skus]
        expected_title, title_reason, confident_title = title_from_rows(item["base"], skus, workbook_rows, source_folder)
        expected_meta, meta_reasons = expected_metafields(workbook_rows, all_rows_required=len(skus) > 1)

        if not product:
            continue

        matched += 1

        current_meta = product.metafields if product else {}
        meta_changes = []
        meta_missing = []
        meta_should_clear = []

        for key, expected in expected_meta.items():
            current = current_meta.get(key, "")
            if values_differ(current, expected):
                meta_changes.append(key)

        for key in [
            "specs.piece_count",
            "specs.recommended_age",
            "specs.finished_model_size",
            "specs.package_size",
            "custom.series",
        ]:
            if key not in expected_meta:
                if current_meta.get(key):
                    meta_should_clear.append(key)
                else:
                    meta_missing.append(key)

        title_changed = bool(product and values_differ(product.title, expected_title))
        action = []
        if title_changed and confident_title:
            action.append("update_title")
        elif title_changed or not confident_title:
            action.append("manual_title_review")
        if meta_changes:
            action.append("update_metafields")
        if meta_should_clear:
            action.append("manual_clear_metafields")

        rows.append(
            {
                "folder": item["base"],
                "source_folder": source_folder,
                "product_id": product.id if product else "",
                "handle": product.handle if product else item["handle"],
                "skus": "|".join(skus),
                "current_title": product.title if product else "",
                "expected_title": expected_title,
                "title_reason": title_reason,
                "title_confidence": "auto" if confident_title else "manual_review",
                "current_metafields": json.dumps({key: current_meta.get(key, "") for key in sorted(set(current_meta) & {
                    "specs.piece_count",
                    "specs.recommended_age",
                    "specs.finished_model_size",
                    "specs.package_size",
                    "specs.difficulty_level",
                    "custom.series",
                })}, ensure_ascii=False, sort_keys=True),
                "expected_metafields": json.dumps(expected_meta, ensure_ascii=False, sort_keys=True),
                "metafield_change_keys": "|".join(meta_changes),
                "metafield_missing_keys": "|".join(meta_missing),
                "metafield_should_clear_keys": "|".join(meta_should_clear),
                "workbook_rows_matched": str(sum(1 for row in workbook_rows if row)),
                "variant_count": str(len(skus)),
                "meta_reason": "|".join(meta_reasons),
                "action": "|".join(action) if action else "none",
            }
        )

    summary = {
        "local_products": len(manifest),
        "local_skipped": len(local_skipped),
        "shopify_products_seen": len(products),
        "matched_shopify_products": matched,
        "title_auto_updates": sum(1 for row in rows if "update_title" in row["action"]),
        "title_manual_review": sum(1 for row in rows if "manual_title_review" in row["action"]),
        "metafield_updates": sum(1 for row in rows if "update_metafields" in row["action"]),
        "manual_clear_metafields": sum(1 for row in rows if "manual_clear_metafields" in row["action"]),
        "no_action": sum(1 for row in rows if row["action"] == "none"),
    }
    return rows, summary


def write_outputs(rows: list[dict[str, str]], summary: dict[str, int], result_json: Path, plan_csv: Path) -> None:
    plan_csv.parent.mkdir(parents=True, exist_ok=True)
    fieldnames = [
        "folder",
        "source_folder",
        "product_id",
        "handle",
        "skus",
        "current_title",
        "expected_title",
        "title_reason",
        "title_confidence",
        "current_metafields",
        "expected_metafields",
        "metafield_change_keys",
        "metafield_missing_keys",
        "metafield_should_clear_keys",
        "workbook_rows_matched",
        "variant_count",
        "meta_reason",
        "action",
    ]
    with plan_csv.open("w", encoding="utf-8", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    result_json.parent.mkdir(parents=True, exist_ok=True)
    result_json.write_text(
        json.dumps(
            {
                "summary": summary,
                "plan_csv": str(plan_csv),
                "preview": [row for row in rows if row["action"] != "none"][:30],
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )


def apply_confident(rows: list[dict[str, str]], batch_size: int) -> list[dict[str, str]]:
    admin = ShopifyAdmin()
    results = []
    update_rows = [
        row
        for row in rows
        if row["product_id"]
        and "manual_title_review" not in row["action"]
        and (
            "update_title" in row["action"]
            or "update_metafields" in row["action"]
            or "manual_clear_metafields" in row["action"]
        )
    ]

    for index, row in enumerate(update_rows, start=1):
        result = {"folder": row["folder"], "handle": row["handle"], "ok": False, "action": row["action"]}
        try:
            if "update_title" in row["action"] or "update_metafields" in row["action"]:
                admin.update_product(row["product_id"], row["expected_title"], json.loads(row["expected_metafields"]))
            clear_keys = [key for key in row["metafield_should_clear_keys"].split("|") if key]
            admin.delete_metafields(row["product_id"], clear_keys)
            result["ok"] = True
        except Exception as error:  # noqa: BLE001 - batch updater should report all failed rows.
            result["error"] = str(error)
        results.append(result)
        if index % batch_size == 0:
            time.sleep(2)

    return results


def main() -> int:
    parser = argparse.ArgumentParser(description="Audit Chinese Shopify product titles and metafields against the workbook.")
    parser.add_argument("--apply-confident", action="store_true", help="Apply only confident title/metafield updates.")
    parser.add_argument("--yes", action="store_true", help="Required with --apply-confident.")
    parser.add_argument("--batch-size", type=int, default=25)
    parser.add_argument("--plan-csv", default=str(OUT_DIR / "cn-product-title-metafield-plan.csv"))
    parser.add_argument("--result-json", default=str(OUT_DIR / "cn-product-title-metafield-result.json"))
    args = parser.parse_args()

    if args.apply_confident and not args.yes:
        raise SystemExit("--apply-confident requires --yes")

    try:
        rows, summary = build_audit()
    except RuntimeError as error:
        print(json.dumps({"ok": False, "error": str(error)}, ensure_ascii=False, indent=2))
        return 2

    payload: dict[str, Any] = {
        "summary": summary,
        "plan_csv": args.plan_csv,
        "preview": [row for row in rows if row["action"] != "none"][:30],
    }

    if args.apply_confident:
        apply_results = apply_confident(rows, args.batch_size)
        payload["apply_results"] = {
            "attempted": len(apply_results),
            "ok": sum(1 for row in apply_results if row["ok"]),
            "failed": sum(1 for row in apply_results if not row["ok"]),
            "rows": apply_results,
        }

    write_outputs(rows, summary, Path(args.result_json), Path(args.plan_csv))
    if args.apply_confident:
        Path(args.result_json).write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(payload, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
