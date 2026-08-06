# Shopify 定价与运费规则

本文是 JIESTAR 独立站后续定价、占位价清理、缺报价下架、运费模板、重货复核和 Shopify 写入边界的统一规则入口。

相关运行手册：`docs/12-shopify-product-upload-runbook.md`。如果两份文档重复，以本文规则为准，再把 runbook 中的命令入口同步更新。

## 1. 定价体系

独立站价格必须保持三套体系分离：

- `C端公开零售价`：给独立站前台客户看的商品售价，不含运费、不含税费。
- `B端阶梯价`：内部报价使用，按样品、MOQ、50+、200+、500+、1000+ 分层，不进入 Shopify 导入价。
- `代理下单折扣价`：基于 C 端公开价给代理的折扣，保留 `10% / 12% / 15%` 三档。

固定规则：

- 运费不并入商品价，商品价和运费模板分开维护。
- 代理折扣只作用于商品价，不作用于运费、税费，不和其它优惠叠加。
- `1000+` B 端价只是大货参考底线，不能默认包含运费、税费、定制开发或长期账期。
- 低价 SKU 必须按组合销售和上架语义复核，不能因为公式可算就全部作为单品直接上架。

## 2. 保守费率

C 端只是辅助渠道，不能让手续费把利润吃掉。定价模型按保守口径计算：

- PayPal：`4.99% + $0.49/order`。
- Shopify 第三方交易费：`2%`。
- PayPal 提现手续费：`$35/50单 = $0.70/order`。
- FX / 结汇损耗：`4%`。
- C 端公开价默认反推目标贡献毛利，目标毛利默认 `35%`，除非 owner 明确改口径。

运费模板也要考虑交易费用：

- Shopify 可能对 shipping charge 收交易费。
- 运费模板里的建议收费应覆盖货代成本、PayPal/Shopify/FX 损耗和安全 buffer。
- 不能为了前台价格好看而让普通订单运费倒贴。

## 3. 控价与利润

独立站 C 端价格也是外网控价信号，不能破坏经销商利润空间。

固定规则：

- 有品牌控价 / MAP / 平台参考价时，最终 C 端价必须高于控价，不得低价冲击其它卖家。
- 没有品牌控价或 MAP 数据时，按保守利润模型价格更新，不因为 `REVIEW: 缺品牌/平台控价` 阻断。
- 已有明确控价且检查失败的 SKU 不能自动更新，必须先调整价格或人工确认。
- 我们是源头工厂拿货，天然成本更低，但独立站 C 端价格不能比经销商外网价格更低。
- 如果 C 端低价会导致代理 / 经销商卖不出去，则宁愿不上架或提高售价。

## 4. Shopify 价格更新

当前控价保护定价模型：

```text
/Users/chensen/jiestar/定价参考/*_保守费率_控价保护_C端B端代理_不含运费_20260630.xlsx
```

价格更新脚本：

```text
scripts/shopify_price_update_from_pricing.py
```

写入边界：

- 只处理 Shopify `status:active` 的 variant。
- 只按 variant SKU 精确匹配定价表。
- 只允许改 Shopify variant 的 `price` 和 `compareAtPrice`。
- 不改标题、handle、描述、图片、库存、状态、collection、metafields。
- 缺报价、未匹配、重复 SKU、Draft / Archived 商品不进入价格 apply。
- Active 商品不能长期保留 `$999.00` 占位价；找不到价格时应补进定价模型，或把对应产品改为 `DRAFT`。

价格 dry-run：

```bash
PYTHONPYCACHEPREFIX=/private/tmp/jiestar-pycache python3 scripts/shopify_price_update_from_pricing.py --allow-missing-map
```

报告位置：

```text
/private/tmp/jiestar-shopify-price-update/price-update-summary.json
/private/tmp/jiestar-shopify-price-update/price-update-full-report.csv
/private/tmp/jiestar-shopify-price-update/price-update-eligible.csv
/private/tmp/jiestar-shopify-price-update/price-update-blocked-review.csv
/private/tmp/jiestar-shopify-price-update/price-update-unmatched-active.csv
```

确认 `price-update-eligible.csv` 只包含允许更新的 SKU 后，才能 apply：

```bash
PYTHONPYCACHEPREFIX=/private/tmp/jiestar-pycache python3 scripts/shopify_price_update_from_pricing.py \
  --allow-missing-map \
  --apply \
  --yes \
  --input-approved-report /private/tmp/jiestar-shopify-price-update/price-update-eligible.csv
```

缺定价 Active 产品改草稿脚本：

```text
scripts/shopify_draft_unpriced_active_products.py
```

dry-run：

```bash
PYTHONPYCACHEPREFIX=/private/tmp/jiestar-pycache python3 scripts/shopify_draft_unpriced_active_products.py
```

apply：

```bash
PYTHONPYCACHEPREFIX=/private/tmp/jiestar-pycache python3 scripts/shopify_draft_unpriced_active_products.py \
  --apply \
  --yes \
  --input-approved-report /private/tmp/jiestar-shopify-draft-unpriced-active-products/draft-unpriced-products-plan.csv
```

缺定价草稿复核表：

```text
/Users/chensen/jiestar/定价参考/Shopify缺定价产品草稿下架复核_20260701.xlsx
```

## 5. Shopify 运费规则

当前运费与重量工作簿：

```text
outputs/019fb5f3-8f25-7f02-9403-727aefd39ceb/Shopify普货空运结算模板_20260731.xlsx
outputs/019fb5f3-8f25-7f02-9403-727aefd39ceb/Shopify普货海运结算模板_20260731.xlsx
outputs/019fb5f3-8f25-7f02-9403-727aefd39ceb/Shopify商品计费重量主表_20260731.xlsx
```

运费更新脚本：

```text
scripts/shopify_shipping_update_from_template.py
```

计费重量规则：

- 计费重量 = `max(实际重量, 体积重)`。
- 实际重量优先使用单品毛重；没有时使用 `外箱毛重 / 装箱量`。净重不能作为运输实际重量。
- 体积重 = `彩盒长 * 彩盒宽 * 彩盒高 / 5000`，不再增加 2cm。
- 彩盒尺寸是自动运费的必要证据；外箱尺寸不能代替单个彩盒尺寸。
- 没有重量但有彩盒尺寸时，按体积重保守计算。
- 体积重大于实际重量时，按体积重计费。
- Shopify 重量 = `CEILING(计费重量 * 1000)` 克。
- Active 商品没有可靠彩盒尺寸或重量来源时，整个 Shopify 产品转 Draft，不写猜测重量。
- 超过 10kg 的 SKU 不开放普通结账，进入人工运费复核。
- Shopify 默认结账包装重量必须设为 0g，避免商品重量已含包装后再次叠加。

Shopify profile 规则：

- `JIESTAR Standard goods` 的澄海仓 location group：承载普通货空运 240 条和美澳海运 31 条，共 271 条。
- `JIESTAR Standard goods` 的美国仓 location group：只承载美国仓商品、美国 zone 和 `U.S. Warehouse Shipping`；不得与澄海仓 271 条费率互相覆盖。
- `JIESTAR Manual Shipping Review`：超过 10kg 或模板标记 `Review` 的重货；该 profile 不配置费率。
- `JIESTAR Battery/electric goods` 是待删除的旧 profile。其商品迁移完成并回读为 0 后，必须删除该 profile、zone 和全部旧带电费率。
- 商品带电信息只可保留为内部资料，不参与运费、profile 或结账方式分流。
- 客户结账名称固定为 `Air Shipping` 和 `Sea Shipping`。
- 美国、澳大利亚同时显示空运和海运；其余 10 个国家只显示空运。

写入边界：

- 分别读取 `--air-rate-workbook`、`--sea-rate-workbook` 和 `--weight-workbook`。
- 空运模板必须恰好 240 条；海运模板必须恰好 31 条；不接受任何带电费率或带电 profile 分流。
- 只写模板覆盖的 12 个国家：`US / CA / AU / GB / DE / FR / BE / ES / IT / NL / PL / SE`。
- 普通空运 / 海运同步只管理 `JIESTAR Chenghai Warehouse` 所在 location group；即使同一 profile 存在其它地点组，也不得删除或覆盖。
- 不覆盖 Shopify 后台已有非 `JIESTAR ...` profile、zone 或 rate。
- Active 但未匹配重量主表、缺 SKU、缺可靠彩盒尺寸或重量无效时，输出整个产品转 Draft 的审批报告。
- 当前 Draft 变体只输出待补资料清单，不写重量、不改 profile。
- 局部品牌更新必须使用 `--vendor <exact vendor>`；该范围会写入审批签名。
- 只更新重量且不调整国家运费表时必须使用 `--skip-rate-sync`。此模式只关联本次匹配变体到已存在 profile，不删除 zone、rate、其它品牌商品或未在本次模板中的变体。
- 完整 271 条费率同步禁止配合 `--vendor` 使用。
- 旧审批报告禁止写入；每次 apply 前必须用当前 token、当前 Shopify 状态和三份当前工作簿重新生成审批签名。

运费 dry-run：

```bash
PYTHONPYCACHEPREFIX=/private/tmp/jiestar-pycache python3 scripts/shopify_shipping_update_from_template.py \
  --air-rate-workbook outputs/019fb5f3-8f25-7f02-9403-727aefd39ceb/Shopify普货空运结算模板_20260731.xlsx \
  --sea-rate-workbook outputs/019fb5f3-8f25-7f02-9403-727aefd39ceb/Shopify普货海运结算模板_20260731.xlsx \
  --weight-workbook outputs/019fb5f3-8f25-7f02-9403-727aefd39ceb/Shopify商品计费重量主表_20260731.xlsx \
  --default-package-zero-verified
```

报告位置：

```text
/private/tmp/jiestar-shopify-shipping-update/shipping-update-summary.json
/private/tmp/jiestar-shopify-shipping-update/shipping-air-rate-plan.csv
/private/tmp/jiestar-shopify-shipping-update/shipping-sea-rate-plan.csv
/private/tmp/jiestar-shopify-shipping-update/shipping-weight-updates.csv
/private/tmp/jiestar-shopify-shipping-update/shipping-profile-assignments.csv
/private/tmp/jiestar-shopify-shipping-update/shipping-blocked-heavy.csv
/private/tmp/jiestar-shopify-shipping-update/shipping-active-to-draft.csv
/private/tmp/jiestar-shopify-shipping-update/shipping-draft-backlog.csv
/private/tmp/jiestar-shopify-shipping-update/shipping-legacy-battery-migration.csv
/private/tmp/jiestar-shopify-shipping-update/shipping-unmatched-active.csv
/private/tmp/jiestar-shopify-shipping-update/shipping-api-diff.csv
```

只有 `shipping-update-summary.json` 中 `ready_for_apply = true`，且人工确认报告后，才能 apply：

```bash
PYTHONPYCACHEPREFIX=/private/tmp/jiestar-pycache python3 scripts/shopify_shipping_update_from_template.py \
  --air-rate-workbook outputs/019fb5f3-8f25-7f02-9403-727aefd39ceb/Shopify普货空运结算模板_20260731.xlsx \
  --sea-rate-workbook outputs/019fb5f3-8f25-7f02-9403-727aefd39ceb/Shopify普货海运结算模板_20260731.xlsx \
  --weight-workbook outputs/019fb5f3-8f25-7f02-9403-727aefd39ceb/Shopify商品计费重量主表_20260731.xlsx \
  --default-package-zero-verified \
  --apply \
  --yes \
  --input-approved-report /private/tmp/jiestar-shopify-shipping-update/shipping-update-summary.json
```

Shopify App 权限要求：

- `read_products`
- `write_products`
- `read_locations`
- `read_shipping`
- `write_shipping`

如果 `deliveryProfiles` 返回 `ACCESS_DENIED`，先在 Shopify 后台给 Custom App 增加 shipping / delivery profile 读写权限和 `read_locations`，再刷新 `SHOPIFY_ADMIN_ACCESS_TOKEN`。

## 6. 上线校验

价格 apply 后必须再次 dry-run，确认：

- `unmatched_active_count = 0`。
- Active 商品里 `$999.00 = 0`。
- 已更新 variant 的 `price` / `compareAtPrice` 等于目标价。
- Draft / Archived / 未匹配 / 重复 SKU / 控价失败 SKU 没有被误更新。

运费 apply 后必须再次 dry-run，确认：

- `unmatched_active_variant_count = 0`。
- `weight_action_counts = {"noop": active_variant_count}`。
- `template_air_rate_row_count = 240`、`template_sea_rate_row_count = 31`、`template_rate_row_count = 271`。
- `JIESTAR Standard goods` 的澄海仓 location group 恰好有 271 条目标费率；美国仓组的费率不计入该数量。
- `JIESTAR Battery/electric goods` 不存在。
- `JIESTAR Manual Shipping Review` 没有可用运费费率。
- 超过 10kg 的 SKU 仍在 `JIESTAR Manual Shipping Review`，不能普通结账。
- X88058 为 1058g，进入 1.5kg 档；美国空运 `$31.99`，美国海运 `$26.99`。
- 抽查美国、澳大利亚商品同时显示 `Air Shipping` 和 `Sea Shipping`；英国、德国等其余国家只显示 `Air Shipping`。
- 再次 dry-run 的实时费率差异为 0，所有已更新重量为 `noop`。

回读 Active `$999.00`：

```bash
PYTHONPYCACHEPREFIX=/private/tmp/jiestar-pycache python3 - <<'PY'
from decimal import Decimal
import sys
sys.path.insert(0, "scripts")
import shopify_price_update_from_pricing as price
admin = price.ShopifyAdmin()
variants = admin.active_variants()
rows = [v for v in variants if v.current_price == Decimal("999.00")]
print({"active_variant_count": len(variants), "active_999_variant_count": len(rows)})
PY
```

回读运费状态：

```bash
PYTHONPYCACHEPREFIX=/private/tmp/jiestar-pycache python3 scripts/shopify_shipping_update_from_template.py \
  --air-rate-workbook outputs/019fb5f3-8f25-7f02-9403-727aefd39ceb/Shopify普货空运结算模板_20260731.xlsx \
  --sea-rate-workbook outputs/019fb5f3-8f25-7f02-9403-727aefd39ceb/Shopify普货海运结算模板_20260731.xlsx \
  --weight-workbook outputs/019fb5f3-8f25-7f02-9403-727aefd39ceb/Shopify商品计费重量主表_20260731.xlsx \
  --default-package-zero-verified \
  --out-dir /private/tmp/jiestar-shopify-shipping-current-check
```

## 7. 美国仓专题与独立 location group

美国仓使用手动履约，不安装 Amazon MCF 或实时运费应用。公开资格的唯一数据源是 Shopify 手动 Collection：

- title：`U.S. Warehouse`
- handle：`us-warehouse`
- 前台只显示 `Ships from U.S.` / `U.S. warehouse eligible`，不显示库存数量、仓库地址或未经确认的送达天数。
- 商品继续保持 `inventoryItem.tracked = false`。售罄时必须人工同时从 Collection 移除商品，并在美国仓地点停用对应 SKU。

店主先在 Shopify 后台创建内部地点 `Amazon U.S. Warehouse` 并填写真实地址；地址不得写入代码、审批报告或聊天。地点创建后先运行 dry-run：

```bash
PYTHONPYCACHEPREFIX=/private/tmp/jiestar-pycache python3 scripts/shopify_us_warehouse_setup.py
```

审批文件：

```text
/private/tmp/jiestar-us-warehouse-approval/us-warehouse-approval-summary.json
/private/tmp/jiestar-us-warehouse-approval/us-warehouse-sku-audit.csv
/private/tmp/jiestar-us-warehouse-approval/us-warehouse-rate-plan.csv
/private/tmp/jiestar-us-warehouse-approval/us-warehouse-shopify-diff.csv
```

费率按 Shopify 当前重量枚举 0–10kg 内所有可达的单件、多件和混合 SKU 组合。每 0.5kg 档取最高来源成本，按 `(成本 × 1.05 + $1.19) ÷ 0.8901` 计算并向上取到 `$x.99`，同时保证随重量不下降。

只有审批报告 `ready_for_apply = true`、人工确认 hash 和 publication 后，才能执行一次受监控写入：

```bash
PYTHONPYCACHEPREFIX=/private/tmp/jiestar-pycache python3 scripts/shopify_us_warehouse_setup.py \
  --apply \
  --yes \
  --approved-report /private/tmp/jiestar-us-warehouse-approval/us-warehouse-approval-summary.json \
  --publication-id gid://shopify/Publication/REPLACE_WITH_APPROVED_ID
```

写入前脚本保存完整 locations / delivery profiles / collection 快照，写入后立即重新读取。美国仓 location group 只允许美国 zone 和 `U.S. Warehouse Shipping`；不得触碰澄海仓的 271 条 `Air Shipping` / `Sea Shipping`。地点优先级和真实地址仍由店主在 Shopify 后台确认。
