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

当前补全运费模板：

```text
/Users/chensen/jiestar/定价参考/Shopify运费模板_体积重_Shopify盒规补全_缺失SKU补全_20260701.xlsx
```

运费更新脚本：

```text
scripts/shopify_shipping_update_from_template.py
```

计费重量规则：

- 计费重量 = `max(实际重量, 体积重)`。
- 体积重 = `(彩盒长 + 包装容错) * (彩盒宽 + 包装容错) * (彩盒高 + 包装容错) / 5000`。
- 彩盒尺寸优先；外箱尺寸是装箱尺寸，不能当单个产品尺寸。
- 只有缺彩盒尺寸时，才允许用 `外箱尺寸 / 装箱量` 兜底，并标记复核。
- 没有重量但有彩盒尺寸时，按体积重保守计算。
- 体积重大于实际重量时，按体积重计费。
- 超过 10kg 的 SKU 不开放普通结账，进入人工运费复核。

Shopify profile 规则：

- `JIESTAR Standard goods`：普通可收费商品。
- `JIESTAR Battery/electric goods`：带电、电机、遥控、灯光风险商品。
- `JIESTAR Manual Shipping Review`：超过 10kg 或模板标记 `Review` 的重货；该 profile 不配置费率。

写入边界：

- 只读取模板里的 `Shopify运费配置` 和 `Shopify商品重量导入`。
- 只写模板覆盖的 12 个国家：`US / CA / AU / GB / DE / FR / BE / ES / IT / NL / PL / SE`。
- 只管理 `JIESTAR ...` 命名的 shipping profiles。
- 不覆盖 Shopify 后台已有非 `JIESTAR ...` profile、zone 或 rate。
- Active 但未匹配模板的 SKU 不自动补重量、不自动分配 profile，只输出复核报告。

运费 dry-run 必须显式使用当前补全模板：

```bash
PYTHONPYCACHEPREFIX=/private/tmp/jiestar-pycache python3 scripts/shopify_shipping_update_from_template.py \
  --template-workbook /Users/chensen/jiestar/定价参考/Shopify运费模板_体积重_Shopify盒规补全_缺失SKU补全_20260701.xlsx
```

报告位置：

```text
/private/tmp/jiestar-shopify-shipping-update/shipping-update-summary.json
/private/tmp/jiestar-shopify-shipping-update/shipping-rate-plan.csv
/private/tmp/jiestar-shopify-shipping-update/shipping-weight-updates.csv
/private/tmp/jiestar-shopify-shipping-update/shipping-profile-assignments.csv
/private/tmp/jiestar-shopify-shipping-update/shipping-blocked-heavy.csv
/private/tmp/jiestar-shopify-shipping-update/shipping-unmatched-active.csv
/private/tmp/jiestar-shopify-shipping-update/shipping-api-diff.csv
```

只有 `shipping-update-summary.json` 中 `ready_for_apply = true`，且人工确认报告后，才能 apply：

```bash
PYTHONPYCACHEPREFIX=/private/tmp/jiestar-pycache python3 scripts/shopify_shipping_update_from_template.py \
  --template-workbook /Users/chensen/jiestar/定价参考/Shopify运费模板_体积重_Shopify盒规补全_缺失SKU补全_20260701.xlsx \
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
- `JIESTAR Standard goods` 和 `JIESTAR Battery/electric goods` 有目标费率。
- `JIESTAR Manual Shipping Review` 没有可用运费费率。
- 超过 10kg 的 SKU 仍在 `JIESTAR Manual Shipping Review`，不能普通结账。
- 抽查美国、澳大利亚、英国、德国各一个普通 SKU；美国、澳大利亚各一个带电 / 电机 SKU；一个超过 10kg SKU 应显示无可用结账运费。

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
  --template-workbook /Users/chensen/jiestar/定价参考/Shopify运费模板_体积重_Shopify盒规补全_缺失SKU补全_20260701.xlsx \
  --out-dir /private/tmp/jiestar-shopify-shipping-current-check
```

当前已知重货人工复核 SKU：

- GULY：`10618`, `10620`, `10627`, `10625`
- JIESTAR：`57014`, `89121`, `58144`, `89112`

这些 SKU 运费未按普通规则确定，需要单独向货代询价或人工报价。
