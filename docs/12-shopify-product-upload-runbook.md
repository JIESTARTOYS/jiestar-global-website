# Shopify Product Upload Runbook

本文记录 JIESTAR 后续批量上传产品到 Shopify 的固定流程。重点包括 Admin token 获取方式、图片文件夹准备规则、上传脚本用法、续跑方式和常见异常处理。

不要把任何真实 token、client secret、API key 写进本文或提交到 Git。

## 1. Token 获取方式

本项目使用 Shopify 自定义 App 的 `client_credentials` 方式换取短期 Admin API token。

重要区别：

- `SHOPIFY_CLIENT_SECRET` 不是 `SHOPIFY_ADMIN_ACCESS_TOKEN`。
- 从 Shopify 后台复制到的 client secret 不能直接作为 Admin token 使用，否则会返回 `401 Invalid API key or access token`。
- 正确方式是用 `.env.local` 中的 `SHOPIFY_CLIENT_ID` 和 `SHOPIFY_CLIENT_SECRET` 调 Shopify OAuth token endpoint，换出新的 `SHOPIFY_ADMIN_ACCESS_TOKEN`。

`.env.local` 需要有这些字段：

```env
SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
SHOPIFY_API_VERSION=2026-01
SHOPIFY_CLIENT_ID=
SHOPIFY_CLIENT_SECRET=
SHOPIFY_ADMIN_ACCESS_TOKEN=
```

当 Admin token 过期或返回 `401` 时，重新换 token：

```bash
/Users/chensen/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 - <<'PY'
from pathlib import Path
import json
import urllib.request

env_path = Path(".env.local")
values = {}

for line in env_path.read_text(encoding="utf-8", errors="ignore").splitlines():
    if not line or line.startswith("#") or "=" not in line:
        continue
    key, value = line.split("=", 1)
    values[key] = value.strip().strip('"').strip("'")

url = f"https://{values['SHOPIFY_STORE_DOMAIN']}/admin/oauth/access_token"
payload = json.dumps(
    {
        "client_id": values["SHOPIFY_CLIENT_ID"],
        "client_secret": values["SHOPIFY_CLIENT_SECRET"],
        "grant_type": "client_credentials",
    }
).encode()

request = urllib.request.Request(
    url,
    data=payload,
    method="POST",
    headers={"Content-Type": "application/json", "Accept": "application/json"},
)

with urllib.request.urlopen(request, timeout=60) as response:
    data = json.loads(response.read().decode())

access_token = data["access_token"]
lines = env_path.read_text(encoding="utf-8", errors="ignore").splitlines()
out = []
updated = False

for line in lines:
    if line.startswith("SHOPIFY_ADMIN_ACCESS_TOKEN="):
        out.append("SHOPIFY_ADMIN_ACCESS_TOKEN=" + access_token)
        updated = True
    else:
        out.append(line)

if not updated:
    out.append("SHOPIFY_ADMIN_ACCESS_TOKEN=" + access_token)

env_path.write_text("\n".join(out) + "\n", encoding="utf-8")
print("SHOPIFY_ADMIN_ACCESS_TOKEN refreshed")
PY
```

换完 token 后先跑只读验证，不要直接上传：

```bash
/Users/chensen/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 scripts/shopify_cn_pending_import.py --dry-run
```

验证通过时，输出里应看到 `todo_products`、`skipped` 等统计，而不是 `401`。

## 2. 产品文件夹准备规则

中文待上架产品统一放在：

```text
/Volumes/ORICO/jiestar电商图/待上架中文详情文件夹
```

每个产品一个文件夹，文件夹名使用 SKU 或 SKU 组合：

```text
10213
20040-20047
25888-25889
FF10015
JJ9036
```

图片命名规则：

```text
SKU-1.jpg
SKU-2.jpg
SKU-白底.jpg
SKU-sku.jpg
SKU-详情.jpg
SKU-详情-01.jpg
SKU-详情-02.jpg
SKU-透明.png
```

多 SKU 组合产品：

```text
20040-20047-白底.jpg
20040-20047-1.jpg
20040-20047-详情-01.jpg
20040-sku.jpg
20041-sku.jpg
...
```

如果没有独立 SKU 图，用白底图复制成 `SKU-sku.jpg`。如果没有详情图，描述可以留空。

## 3. 上架前产品身份确认规则

上传前必须先确认产品是不是适合放到 JIESTAR Shopify 店铺。不要只因为本地有图片就上架。

确认优先级：

1. 先查 `/Volumes/ORICO/jiestar电商图/杰星整理表.xlsx`。
2. 如果整理表中有对应 SKU 行，按 JIESTAR 产品保留，标题和元字段优先参考表格。
3. 如果整理表中没有对应 SKU 行，再查 Brick4。
4. Brick4 查询要看精确 SKU 匹配，不要只看模糊搜索结果。
5. Brick4 品牌页 `https://brick4.com/brand/52` 对应 `杰星 / JIESTAR`。只有精确 SKU 命中这个品牌时，才可以继续按 JIESTAR 产品上架。
6. 如果 Brick4 精确 SKU 显示为其他品牌，或无法确认是 JIESTAR，就不要上架。
7. 有些产品可能是 JIESTAR 代工、借图、或非 JIESTAR 品牌产品，例如 `10211`。这类产品即使本地有图片，也不作为 JIESTAR 店铺产品上架。

如果产品已经误创建到 Shopify：

- 不删除产品。
- 不改 SKU、图片、描述、handle。
- 只把状态改为 `DRAFT`，避免继续上架销售。

本次已形成的审计脚本：

```text
scripts/shopify_cn_brand_audit.py
```

只读审计：

```bash
/Users/chensen/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 scripts/shopify_cn_brand_audit.py
```

把非 JIESTAR / 无法确认的产品改成草稿：

```bash
/Users/chensen/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 scripts/shopify_cn_brand_audit.py --apply-draft --yes
```

报告位置：

```text
/private/tmp/jiestar-shopify-cn-brand-audit/cn-brand-audit-plan.csv
/private/tmp/jiestar-shopify-cn-brand-audit/cn-brand-audit-result.json
```

最近一次执行规则：

- 检查 Shopify 中文详情匹配产品：`261` 个。
- 整理表确认保留：`101` 个。
- Brick4 确认为 JIESTAR 保留：`118` 个。
- 非 JIESTAR 或无法确认，改为 `DRAFT`：`42` 个。
- `10211` 属于不应上架产品，已改为 `DRAFT`。

## 4. 标题和产品元字段规则

标题不要使用自动生成的 `JIESTAR Building Block Set SKU` 作为最终标题，除非没有任何其他可靠信息。

标题来源优先级：

1. 优先参考 `/Volumes/ORICO/jiestar电商图/杰星整理表.xlsx` 中的产品英文名。
2. 表格英文名明显机器翻译时，可以根据产品图片和系列改成自然英文标题。
3. 多 SKU 组合产品标题可以按产品内容重写，例如 `JIESTAR Engineering Vehicle Building Block Set 3-Pack`。
4. 标题必须是纯英文。
5. 标题不要包含敏感侵权 IP、第三方品牌、车厂名、影视/游戏/动漫名称等。
6. 不确定是否侵权时，用通用描述替代，例如 `Wizard Castle`、`Classic Sports Car`、`Off-Road SUV`、`Military Vehicle`。

元字段来源优先级：

1. 优先使用整理表中对应 SKU 的 piece count、recommended age、finished model size、package size、series。
2. 多 SKU 组合只有部分 SKU 能匹配整理表时，不要把单个 SKU 的规格误写成整组规格。
3. 无法完整确认的元字段宁可留空，不要写错。
4. 上传后发现标题或元字段明显错误，先运行审计脚本修正，不要在网页后台逐个猜。

标题和元字段审计脚本：

```text
scripts/shopify_cn_product_audit.py
scripts/shopify_title_style_optimize.py
```

只读审计：

```bash
/Users/chensen/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 scripts/shopify_cn_product_audit.py
```

执行可确认的标题和元字段修正：

```bash
/Users/chensen/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 scripts/shopify_cn_product_audit.py --apply-confident --yes --batch-size 25
```

批量优化标题风格，只改 `title`，不改 SKU、价格、库存、图片、URL handle、描述和分类：

```bash
/Users/chensen/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 scripts/shopify_title_style_optimize.py --apply --yes --batch-size 25
```

这个脚本默认只处理 `ACTIVE` 产品，不处理已按品牌审计改为 `DRAFT` 的非 JIESTAR / 无法确认产品。

报告位置：

```text
/private/tmp/jiestar-shopify-cn-product-audit/
/private/tmp/jiestar-shopify-title-style/
```

## 5. 上传规则

当前上传脚本：

```text
scripts/shopify_cn_pending_import.py
```

统一规则：

- 产品状态：`ACTIVE`
- Vendor：`JieStar`
- 价格：`999`
- 库存跟踪：关闭
- 产品类别：`Interlocking Blocks`
- Shopify taxonomy id：`gid://shopify/TaxonomyCategory/tg-5-7-12`
- 发布渠道：发布到当前所有可用 publication / sales channels
- 主媒体顺序：白底图第一张，然后 `SKU-1`、`SKU-2` 等主图
- SKU 图：上传到产品媒体，并绑定到对应 variant
- 详情图：上传到 Shopify Files，并按顺序插入 `descriptionHtml`
- 没有详情图：描述留空
- 不重复创建：每次都会先按 Shopify 当前 handle / SKU 排除已存在产品

## 5.1 已上架商品价格更新规则

真实上架价格不再使用上传期的 `999` 占位价作为健康标准。价格、控价、缺报价草稿下架和写入边界统一按：

```text
docs/14-shopify-pricing-shipping-rules.md
```

常用脚本：

```text
scripts/shopify_price_update_from_pricing.py
scripts/shopify_draft_unpriced_active_products.py
```

先跑 dry-run：

```bash
PYTHONPYCACHEPREFIX=/private/tmp/jiestar-pycache python3 scripts/shopify_price_update_from_pricing.py --allow-missing-map
```

确认 `price-update-eligible.csv` 只包含允许更新的 SKU 后，才能执行价格写入：

```bash
PYTHONPYCACHEPREFIX=/private/tmp/jiestar-pycache python3 scripts/shopify_price_update_from_pricing.py \
  --allow-missing-map \
  --apply \
  --yes \
  --input-approved-report /private/tmp/jiestar-shopify-price-update/price-update-eligible.csv
```

如果 dry-run 仍有 Active 缺报价或 `$999.00` 占位价，先按规则补定价模型；无法补报价的产品应通过 `scripts/shopify_draft_unpriced_active_products.py` 改为 `DRAFT`，不要继续 Active 上架。

## 5.2 Shopify 运费规则更新规则

运费计费重量、体积重、重货人工复核、shipping profile 和写入边界统一按：

```text
docs/14-shopify-pricing-shipping-rules.md
```

当前补全版运费模板：

```text
/Users/chensen/jiestar/定价参考/Shopify运费模板_体积重_Shopify盒规补全_缺失SKU补全_20260701.xlsx
```

专用脚本：

```text
scripts/shopify_shipping_update_from_template.py
```

先跑 dry-run，必须显式指定当前补全版模板：

```bash
PYTHONPYCACHEPREFIX=/private/tmp/jiestar-pycache python3 scripts/shopify_shipping_update_from_template.py \
  --template-workbook /Users/chensen/jiestar/定价参考/Shopify运费模板_体积重_Shopify盒规补全_缺失SKU补全_20260701.xlsx
```

只有 `shipping-update-summary.json` 中 `ready_for_apply = true`，且人工确认报告后，才能执行写入：

```bash
PYTHONPYCACHEPREFIX=/private/tmp/jiestar-pycache python3 scripts/shopify_shipping_update_from_template.py \
  --template-workbook /Users/chensen/jiestar/定价参考/Shopify运费模板_体积重_Shopify盒规补全_缺失SKU补全_20260701.xlsx \
  --apply \
  --yes \
  --input-approved-report /private/tmp/jiestar-shopify-shipping-update/shipping-update-summary.json
```

写入后必须再次 dry-run，确认 Active 运费未匹配为 `0`、所有权重为 `noop`、`JIESTAR Manual Shipping Review` 没有可用费率。当前已知超过 10kg SKU 仍需人工向货代询价或手动报价。

## 6. Dry-run 检查

每次上传前先跑：

```bash
/Users/chensen/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 scripts/shopify_cn_pending_import.py --dry-run
```

### 临时批次安全上架规则

如果新品图包不在默认 `/Volumes/ORICO/jiestar电商图/待上架中文详情文件夹` 中，或者默认待上架目录里还有其它未处理 SKU，不要直接跑默认上传命令。先建立独立临时批次目录，只放本批允许上架的 SKU，并用 `--source-root` 明确指定该目录。

推荐目录：

```text
/private/tmp/jiestar-shopify-批次名-import/source
/private/tmp/jiestar-shopify-批次名-import/metadata.json
```

临时批次目录仍使用脚本规范命名：

```text
SKU/SKU-白底.jpg
SKU/SKU-1.jpg
SKU/SKU-2.jpg
SKU/SKU-sku.jpg
SKU/SKU-详情.jpg
```

当整理表没有 SKU 行，但已经通过 Brick4 精确 JIESTAR 品牌记录、本地 SKU 图、或项目 owner 明确确认补足资料时，用 `--metadata-json` 注入本批标题和元字段。metadata 只用于本批，不写入 `.env.local`，不放入 Git，避免把一次性资料误用于其它产品。

metadata 示例：

```json
{
  "57026": {
    "title": "JIESTAR Clock Tower Modular Building Block Set",
    "product_type": "Architecture & Street View",
    "variant_option_name": "57026 - Clock Tower",
    "source_note": "Local SKU image plus owner confirmation; Brick4 exact SKU not available.",
    "metafields": {
      "specs.piece_count": "3023",
      "specs.recommended_age": "14+",
      "specs.finished_model_size": "32x31.9x46.9 cm",
      "specs.package_size": "58x13x47 cm",
      "specs.difficulty_level": "See product package",
      "custom.series": "Architecture & Street View"
    }
  }
}
```

临时批次必须先 dry-run：

```bash
/Users/chensen/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 scripts/shopify_cn_pending_import.py \
  --dry-run \
  --source-root /private/tmp/jiestar-shopify-批次名-import/source \
  --metadata-json /private/tmp/jiestar-shopify-批次名-import/metadata.json
```

确认 `source_products` 等于本批 SKU 数、`todo_products` 符合预期、`skipped` 没有异常、`missing_detail` 和 `missing_workbook_rows` 可解释后，才执行 `--create-batch` 或 `--auto`。上传后必须用同一组 `--source-root` / `--metadata-json` 再跑 dry-run，确认 `todo_products: 0`。

上传前建议顺序：

1. 先跑 `scripts/shopify_cn_brand_audit.py`，确认没有明显非 JIESTAR 产品。
2. 再跑 `scripts/shopify_cn_pending_import.py --dry-run`，确认待上传数量和缺图情况。
3. 上传后跑 `scripts/shopify_cn_product_audit.py`，检查标题和元字段。
4. 如果发现非 JIESTAR 产品已经创建，跑 `scripts/shopify_cn_brand_audit.py --apply-draft --yes` 改为草稿。

重要输出：

- `source_products`：本地源产品数量
- `todo_products`：还需要上传的产品数量
- `skipped`：Shopify 已存在或被跳过数量
- `missing_detail`：缺详情图数量
- `missing_workbook_rows`：Excel 未匹配到完整信息的数量

生成文件：

```text
/private/tmp/jiestar-shopify-cn-import/cn-pending-manifest.json
/private/tmp/jiestar-shopify-cn-import/cn-pending-manifest.csv
/private/tmp/jiestar-shopify-cn-import/cn-pending-skipped.json
```

## 7. 批量上传

自动按 10 个一批上传，上传完一批自动刷新剩余清单，再继续下一批：

```bash
/Users/chensen/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 scripts/shopify_cn_pending_import.py --auto --batch-size 10
```

如果只想手动跑一批：

```bash
/Users/chensen/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 scripts/shopify_cn_pending_import.py --create-batch --offset 0 --batch-size 10
```

批次报告位置：

```text
/private/tmp/jiestar-shopify-cn-import/
```

报告文件示例：

```text
cn-auto-20260527-144520-batch-001-size-10.json
auto-20260527-144520-summary.json
```

## 8. 上传中断后的续跑方式

脚本是幂等设计。中断后不要手工改 offset，直接重新跑 dry-run：

```bash
/Users/chensen/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 scripts/shopify_cn_pending_import.py --dry-run
```

确认 `todo_products` 后继续：

```bash
/Users/chensen/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 scripts/shopify_cn_pending_import.py --auto --batch-size 10
```

原因：

- 脚本每次都会重新读取 Shopify 当前产品和变体 SKU。
- 已经创建成功的产品会自动跳过。
- 部分创建但缺媒体的产品，会在再次遇到 existing handle 时尝试补齐媒体、描述、类别和发布渠道。

## 9. 常见问题处理

### 401 Invalid API key or access token

原因通常是：

- 把 `SHOPIFY_CLIENT_SECRET` 直接写进了 `SHOPIFY_ADMIN_ACCESS_TOKEN`
- Admin token 过期
- Shopify App 权限更新后未重新授权 / 未重新换 token

处理：

1. 确认 `.env.local` 里有 `SHOPIFY_CLIENT_ID` 和 `SHOPIFY_CLIENT_SECRET`。
2. 重新执行本文第 1 节的 `client_credentials` 换 token 命令。
3. 先跑 `--dry-run` 验证。

### EntityTooLarge

Shopify staged upload 返回：

```text
EntityTooLarge
Content-length exceeds upper bound on range
```

说明某张图片太大。处理方式：

1. 先备份原图到 `/private/tmp/jiestar-shopify-cn-import/`。
2. 在待上架副本目录压缩该图片。
3. 重新对该产品补媒体。

示例：`89121-白底.jpg` 和 `89121-sku.jpg` 原图约 154MB，已备份并压缩后再补齐 Shopify 媒体。

### Remote end closed connection / Connection reset

这是 Shopify 或网络连接中断。通常不代表产品没有创建。

处理：

1. 重新跑 `--dry-run`。
2. 如果产品已经被 Shopify 识别为存在，再次上传时会跳过或补齐媒体。
3. 如果产品未创建，会留在 `todo_products` 中，继续下一轮上传。

### 产品已创建但没有媒体

如果回读发现 `media_count: 0`，用脚本的 existing product repair 逻辑补齐。通常重新跑：

```bash
/Users/chensen/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 scripts/shopify_cn_pending_import.py --auto --batch-size 10
```

即可在遇到 existing handle 时修复。

## 10. 最终验收

上传完成后必须跑：

```bash
/Users/chensen/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 scripts/shopify_cn_pending_import.py --dry-run
```

完成状态应类似：

```json
{
  "todo_products": 0,
  "skipped": 267,
  "missing_detail": 0,
  "missing_workbook_rows": 0
}
```

同时建议跑：

```bash
env PYTHONPYCACHEPREFIX=/private/tmp/jiestar-pycache python3 -m py_compile scripts/shopify_sample_import.py scripts/shopify_cn_pending_import.py
git diff --check
```

## 11. 相关脚本

- `scripts/shopify_cn_pending_prepare.py`：从中文详情目录筛选未上架产品，并生成规范副本。
- `scripts/shopify_cn_pending_import.py`：上传规范后的中文待上架产品到 Shopify。
- `scripts/shopify_cn_brand_audit.py`：按整理表和 Brick4 品牌结果排查非 JIESTAR 产品，必要时改为 `DRAFT`。
- `scripts/shopify_cn_product_audit.py`：检查并修正中文详情上传产品的标题和产品元字段。
- `scripts/shopify_title_style_optimize.py`：批量优化 Shopify 产品标题风格，保留 `JIESTAR` 开头，并按产品类型使用 `Building Set`、`Model Kit`、`Building Toy Set`、`Bundle Set`。
- `scripts/shopify_sample_import.py`：英文详情上传脚本，包含 Shopify API、媒体上传、详情图切片、变体媒体绑定等基础函数。
- `scripts/shopify_product_finalize.py`：批量设置产品状态、类别、发布渠道。
- `scripts/shopify_title_cleanup.py`：清洗 Shopify 产品标题中的中文和敏感 IP / 品牌词。

## 12. 维护原则

- 不把密钥写入 Git。
- 上传前先 dry-run。
- 上架前先确认整理表或 Brick4 JIESTAR 品牌身份。
- 每批 10 个，避免 Shopify 文件处理超时。
- 遇到连接失败先回读 Shopify 状态，不要重复手工创建。
- 大图先压缩或切片，再上传。
- 产品上架完成后，用 dry-run 的 `todo_products: 0` 作为最终判断。
