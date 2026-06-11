# iBlock Shopify Upload Rules

本文记录 iBlock 产品从 `/Volumes/ORICO/iblock/iblock-上架前整理` 上传到 Shopify 的固定规则。它沿用 JIESTAR/Zoin 的上架边界，但 iBlock 使用独立 vendor、独立素材目录和独立脚本。

## 固定上架规则

- 只处理 iBlock 本批整理目录，不修改 JIESTAR、Zoin、Xbert 或其他品牌商品。
- Shopify vendor 固定为 `iBlock`。
- Shopify category 固定为 `Interlocking Blocks`，taxonomy id 为 `gid://shopify/TaxonomyCategory/tg-5-7-12`。
- 商品状态固定为 `ACTIVE`。
- 商品价格固定为 `999`。
- 关闭 inventory tracking。
- 标题必须使用英文安全标题，默认来自 `shopify_title_safe`。
- 不把中文系列名直接写入 Shopify `productType`。
- 没有数字颗粒数时不写入 `specs.piece_count`，不为了填字段而编造数值。
- 遇到已存在 SKU 或 handle 时跳过并写报告，不覆盖线上商品。

## 产品组规则

上传粒度以 `reports/iblock-product-groups.csv` 为准：

- 单 SKU 组创建单变体商品。
- 多 SKU 组创建多变体商品，变体选项名为 `Model`。
- `IB2202` 是 `IB2202-1-IB2202-9` 的父级资料来源，不作为变体 SKU 上传。
- `IB1101-5`、`IB1102-5` 不是真实上架 SKU，不创建商品或变体。
- `IB1204` 至 `IB1212` 按单 SKU 商品上传。

## 图片规则

上传图片只使用：

```text
/Volumes/ORICO/iblock/iblock-上架前整理/shopify-products-upload-ready/<upload_group>/images
```

图片顺序：

1. 白底图优先。
2. 主图随后。
3. SKU 图或各变体白底图用于绑定变体。
4. 详情图上传到 Shopify Files/CDN 后写入 `descriptionHtml`，不放进商品主图库。

`._*`、空文件、不可读图片和准备脚本已跳过的异常图不得上传。

## 产品类型规则

上传脚本必须先读取 Shopify 当前已有的 `productType` 和产品类型 collection。iBlock 资料表里的中文系列名只用于映射，不直接写入 `productType`。

初始映射：

- 十二生肖、十二星座 -> `Constellation`
- 四时花境、花愿祈、花漾玲珑 -> `Flower`
- 虫界漫游、蝴蝶花 -> `Animal`
- 极速方程 -> `Car Model`
- 瓶中童话 -> `Fairy Tale`
- 封神战甲录、次元仿生、机甲类标题 -> `Mecha`
- 城市梦英雄工程小队 -> `Engineering`
- 救援/消防类 -> `Fire Rescue`
- 快反/警务类 -> `Police`
- 空战/飞机/无人机类 -> `Aircraft`
- 太空探索类 -> `Space`
- 舰船/航母/潜艇/驱逐舰类 -> `Warship`
- 坦克/特种/军事小套装 -> 优先 `Tank`，否则 `Military`
- 医疗护理小队 -> `City`
- 无法归入以上类型 -> `Other`

如果确实没有合适的已有类型，才允许新建英文产品类型 collection，并设置 collection metafield：

```text
custom.website_collection_type=product_type
```

## 执行命令

Dry-run：

```bash
PYTHONPYCACHEPREFIX=/private/tmp/jiestar-pycache python3 scripts/shopify_iblock_pending_import.py --dry-run
```

执行上传：

```bash
PYTHONPYCACHEPREFIX=/private/tmp/jiestar-pycache python3 scripts/shopify_iblock_pending_import.py --apply
```

上传后审计：

```bash
PYTHONPYCACHEPREFIX=/private/tmp/jiestar-pycache python3 scripts/shopify_iblock_pending_import.py --post-upload-audit
```

报告输出在：

```text
/private/tmp/jiestar-shopify-iblock-import
```
