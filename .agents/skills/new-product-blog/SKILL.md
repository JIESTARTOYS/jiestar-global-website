---
name: new-product-blog
description: Scan JIESTAR's public Shopify catalog for newly visible products and prepare review-only English New Releases blog draft packages. Use for the daily new-product blog task or an explicitly requested manual new-product scan. Never publishes, promotes, commits, pushes, deploys, or writes Shopify.
version: 1.0.0
---

# JIESTAR New Product Blog

Prepare evidence-bounded English blog drafts from public Shopify product data. This skill is deliberately review-only.

## Safety boundary

- Work in the `jiestar-global-website` repository and confirm the repository root and current Git status before scanning.
- Automated runs may write only under the Git-ignored `output/blog-drafts/` directory.
- Never call `promote`, use Shopify Admin credentials, modify Shopify, edit tracked files, commit, push, create a pull request, deploy, or claim publication.
- Treat a Storefront/API/network error as a failed run. Do not advance the ledger or create an empty success package.
- Use only current public Shopify facts and official Shopify product media. Do not generate AI product imagery.

## Required context

Before writing an article, read:

1. `agents/blog-content-agent.md`
2. `lib/blog.ts`
3. The prepared draft's `facts.md`, `candidate.json`, `manifest.json`, and `ARTICLE_INSTRUCTIONS.md`
4. Every prepared image in the draft's `images/` directory

The existing blog contract and the prepared evidence are authoritative. Missing facts must be omitted, not inferred.

## Daily workflow

1. Record `git status --short` so the pre-run tracked state can be compared later.
2. Run:

   ```bash
   node scripts/new_product_blog_agent.mjs scan --lookback-days 30 --max-articles 3
   ```

3. Read the JSON result. If `article_groups` is `0`, do not create prose; report `新增 0，草稿 0` together with any blocked or failed count.
4. For every item in `prepared` (at most three):
   - inspect all local images;
   - read the four prepared evidence/instruction files;
   - write only `<draftDir>/article.md`;
   - use natural English, category `New Releases`, and the exact required frontmatter paths;
   - include every required `/products/<handle>` link;
   - keep the primary audience international consumers and collectors;
   - end with restrained, relevant paths to `/wholesale`, `/custom-solutions`, and `/contact`;
   - do not state price, stock, sales, ranking, certification, licensing, authorization, lead time, production capacity, market performance, or any unsupported specification.
5. After all prepared articles have been written, run:

   ```bash
   node scripts/new_product_blog_agent.mjs finalize --run-id <run-id>
   ```

6. If any draft is invalid, fix only its ignored `article.md` and rerun `finalize`. Do not weaken the validator.
7. Compare tracked Git status with the pre-run state. If the task changed a tracked file, stop and report the violation.
8. Report in Chinese: new candidates, completed drafts, skipped/already-covered, blocked, queued for later, and failures. Always say that Shopify, Git, deployment, and publication were not changed.

## Article rules

- One article may cover two to four products only when they share vendor, primary collection/product type, and a coherent theme. The scanner owns grouping; do not add or remove products manually.
- Use short paragraphs and meaningful H2/H3 headings. No H1, raw HTML, tables, blockquotes, remote images, or unsupported Markdown.
- Use one cover image and no more than three body images from the prepared package. Alt text must describe visible content; cover alt must be at least 20 meaningful characters and body image alt at least 12.
- Product descriptions and metafields are evidence, not permission to embellish. Keep uncertain wording out of the draft and mention gaps in `review.md` only through the finalize-generated handoff.
- Never use Spanish for this workflow. The website's Spanish area remains a B2B acquisition area, not the blog publishing language.

## Human-only promotion

The scheduled task must never run these commands. A human may separately inspect a finalized draft and request:

```bash
node scripts/new_product_blog_agent.mjs promote --draft-id <run-id:slug>
```

That command is dry-run by default. `--apply` is allowed only after explicit human approval and still does not commit, push, deploy, or publish.
