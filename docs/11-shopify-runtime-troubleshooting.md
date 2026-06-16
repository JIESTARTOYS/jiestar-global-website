# Shopify Runtime Troubleshooting

本文记录 JIESTAR 站点中 Shopify 数据和图片偶发加载失败的处理方法。后续如果再次遇到产品详情页、产品分类页间歇性 404，或 Shopify 图片短时间空白，优先按本文排查和修复。

## 适用现象

- `/products/[handle]` 或 `/collections/[handle]` 偶尔显示 404，过一段时间刷新或重新点击又正常。
- 首页 Featured Categories、产品页 Shop by category、产品分类页 banner 或产品卡片图片偶尔显示不出来。
- `pnpm build` 在静态生成阶段偶发失败，日志中出现 `ShopifyUnavailableError: fetch failed`、`ConnectTimeoutError` 或 `upstream image response timed out`。
- Chrome 中页面先显示 Next.js runtime overlay，刷新后恢复，报错类似 `Failed to execute 'removeChild' on 'Node'` 或 `Runtime NotFoundError`。

## 根因判断

这类问题通常不是 handle 写错，也不是单个页面组件坏掉，而是两个运行时问题叠加：

- Shopify Storefront API 偶发网络超时，导致有效产品或 collection 在某一次请求中取不到。
- Shopify 原图如果被直接输出到前台，会让商品列表深页和商品详情页加载全尺寸图片，导致图片慢、冷加载时间长，甚至短时间空白。
- Chrome 自动翻译或翻译扩展可能改写 React 管理的 DOM 节点，导致 React/Next 在客户端更新时移除节点失败，出现 `removeChild` / `NotFoundError`。

如果同一个 URL 一会儿 404、一会儿正常，优先按“请求超时 / 静态参数不完整”处理，不要先删除数据或改 URL。

## 当前解决方案

- `lib/shopify.ts` 的 `shopifyFetch()` 对 Shopify Storefront API 请求做 3 次轻量重试，覆盖临时网络抖动、429 和 5xx。
- `getShopifyProduct()` 优先使用已成功加载过的 Shopify catalog 产品缓存，避免商品详情页再次等待单个 product 请求。
- `getShopifyCollection()` 优先使用已成功加载过的 Shopify catalog 内存缓存，避免每次打开分类页都重新请求单个 collection。
- `/collections/[handle]` 明确使用 `dynamicParams = true`，避免 `generateStaticParams()` 某次只生成了部分 collection 时，真实 collection handle 被误判为 404。
- `next.config.ts` 通过 `images.loader = "custom"` 和 `images.loaderFile = "./lib/shopify-image-loader.ts"` 注册全局图片 loader；所有 `next/image` 默认走 `lib/shopify-image-loader.ts`，Shopify CDN 图片会追加 `width` 参数并限制最大请求宽度，避免加载全尺寸原图或 3840px 放大变体。
- 不要再给 Shopify 图片添加 `unoptimized`，它会绕过全局 loader，使 `width` 缩放失效。
- `getShopifyCollection()` 在开发环境下只有找到本地 fallback collection 时才返回 fallback；如果是 Shopify 请求失败且没有本地 fallback，应抛出错误，不要把网络失败伪装成 404。
- `app/layout.tsx` 可在根节点加入 `translate="no"`、`suppressHydrationWarning`、`body.notranslate` 和 `meta name="google" content="notranslate"`，降低 Chrome 自动翻译改写 DOM 的概率。
- 2026-05-15 说明：为了方便项目 owner 在内容检查阶段使用 Google / Chrome 页面翻译，当前代码已临时移除 `translate="no"`、`body.notranslate` 和 `meta name="google" content="notranslate"`。上线前如再次遇到 Chrome 自动翻译导致的 `removeChild` / `NotFoundError`，应优先恢复这组三个标记。

## 后续遇到时的处理流程

1. 先看 dev server 或 build 日志，确认是否有 `fetch failed`、`ConnectTimeoutError`、`ShopifyUnavailableError`、`upstream image response timed out`。
2. 如果是产品或分类偶发 404，检查对应动态路由是否保留 `dynamicParams = true`，并确认数据层请求失败不会返回 `undefined` 触发 `notFound()`。
3. 如果是 Shopify 图片空白或加载很慢，检查相关 `Image` 是否没有使用 `unoptimized`，并确认渲染出的 Shopify 图片 URL 带有 `width` 参数。
4. 如果分类页长时间 loading 但最后返回 200，检查 `getShopifyCollection()` 是否仍在绕过 catalog 缓存直接请求 Shopify 单个 collection。
5. 如果商品详情页长时间 loading 或偶发 404，检查 `getShopifyProduct()` 是否能命中 `cachedShopifyProducts` 的 catalog 缓存。
6. 如果 Chrome 报 `removeChild` / `NotFoundError` 且刷新后恢复，先检查页面是否被 Chrome 翻译过；如果处于上线前稳定性收口阶段，恢复 `app/layout.tsx` 的 `notranslate` 标记。
7. 如果 build 偶发失败，先重跑一次；若仍失败，检查 Shopify API 请求是否有重试、Vercel 环境变量是否完整、Storefront API 是否可访问。
8. 不要把 Shopify 请求失败静默降级为 mock 数据用于 production / Vercel；生产环境应显式暴露数据源错误，避免线上展示假产品。

## 相关文件

- `lib/shopify.ts`
- `lib/shopify-image-loader.ts`
- `next.config.ts`
- `app/layout.tsx`
- `app/products/[handle]/page.tsx`
- `app/collections/[handle]/page.tsx`
- `components/product/ProductGallery.tsx`
- `components/product/ProductImageSwap.tsx`
- `components/product/CategoryCarousel.tsx`
- `components/sections/ProductCategories.tsx`
