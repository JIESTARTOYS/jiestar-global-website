# JIESTAR 新品博客 Agent 运行手册

## 边界

该 Agent 每天读取 Shopify Storefront API 的公开商品目录，把首次发现的公开商品整理成英文 `New Releases` 待审核文章包。它不会使用 Admin 写权限，不会修改 Shopify、官网 tracked 文件、Git、部署或线上内容。

自动运行唯一允许写入的位置是已被 Git 忽略的：

```text
output/blog-drafts/
```

## 目录

```text
output/blog-drafts/
  _state/ledger.json
  <run-id>/
    run.json
    blocked/<handle>/blocked.json
    <slug>/
      article.md
      candidate.json
      facts.md
      ARTICLE_INSTRUCTIONS.md
      manifest.json
      review.md
      preview.html
      images/
      source-images/
```

`ledger.json` 记录 Shopify 产品 ID、SKU、handle、首次发现时间、内容指纹、状态、草稿 ID 和阻塞原因。文件采用临时文件加原子改名写入。台账不存在时，CLI 会从现有博客和历史 manifest 重建 `prepared`、`drafted`、`promoted` 状态及草稿 ID，而不是把全部商品重新排队。

## 扫描

普通手动预检：

```bash
node scripts/new_product_blog_agent.mjs scan --dry-run --lookback-days 30 --max-articles 3
```

生成候选包：

```bash
node scripts/new_product_blog_agent.mjs scan --lookback-days 30 --max-articles 3
```

首次运行只排入 Shopify `createdAt` 在最近 30 天内且未被博客/历史草稿覆盖的商品；更早的公开商品只进入基线。后续按 Shopify 产品 ID 首次出现判断新品，因此漏跑数天不会漏掉新出现商品。

扫描先写入本次专用临时目录，全部成功后才原子改名并写入台账。Storefront 401/GraphQL 错误、网络超时、公开产品页不可读或所有图片下载/转换失败时，退出码非零、临时目录被清理、原台账不推进。若上次已经生成 `prepared` 包但写作或 finalize 中断，下次扫描会优先返回原草稿目录供继续完成，不会复制同一商品的新包。

## 写作和 finalize

每天由 `$new-product-blog` Skill 读取扫描输出，为每个 prepared 目录写入 `article.md`，再执行：

```bash
node scripts/new_product_blog_agent.mjs finalize --run-id <run-id>
```

`finalize` 校验 frontmatter、slug、`New Releases` 分类、英文内容、图片 hash、alt text、每个产品链接、禁用事实和 Markdown 子集。全部通过后才生成 `review.md`、`preview.html`，并把状态标为 `drafted`。

## 阻塞与恢复

以下情况不会勉强成文：

- SKU 缺失或同一商品存在多个不同 SKU；
- 缺少英文标题、公开 handle 或可用图片；
- 命中明显第三方 IP、授权或品牌风险词；
- 公开产品页不可访问；
- 图片无法下载或转换。

阻塞商品只有在 Shopify 内容指纹发生变化后才重新进入候选。失败运行不推进状态。

## 人工晋级

先查看复制计划，不写 tracked 文件：

```bash
node scripts/new_product_blog_agent.mjs promote --draft-id <run-id:slug>
```

人工确认后才可显式执行：

```bash
node scripts/new_product_blog_agent.mjs promote --draft-id <run-id:slug> --apply
```

晋级会重新读取 Shopify 公共目录和产品页，并检查内容指纹、slug、SKU 覆盖、文章目标和图片冲突。复制后运行 `pnpm test`、`pnpm lint`、`pnpm build`，但仍要求人工完成桌面/移动端检查。命令不会 commit、push、创建 PR、部署或声明文章上线。

## 定时任务运行前提

- 电脑保持开机；
- ChatGPT/Codex 桌面应用保持运行；
- 官网项目路径和 `.env.local` 可访问；
- `.env.local` 只需 Storefront API 读取配置；
- 定时任务只调用 `scan` 和 `finalize`，绝不调用 `promote`。

若任务因电脑休眠、应用退出或网络中断而漏跑，下次运行仍会根据未见过的 Shopify 产品 ID 补发现。
