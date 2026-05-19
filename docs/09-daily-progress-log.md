# JIESTAR Global Website Project Progress & Conversation Handoff Log

这个文档用于记录 JIESTAR Global Website 的持续项目进度、每个小项的完成状态、功能验证结果、发现的问题，以及当前对话结束后的交接信息。

它不是单纯的每日工作日志，而是 Codex 和 Claude Code 在新对话开始时需要优先读取的项目进度记忆。

记录原则：

- 每完成一个小项，或项目 owner 说“结束当前对话”“结束这个小项”“结束今天的工作”时，追加或更新当前日期下的交接记录。
- 新对话开始并准备继续项目工作时，先读取本文件，确认项目目前进展到哪里，以及当前对话准备完成什么工作。
- 按日期记录，但日期下可以包含多个“子项目 / 小项 / 当前对话交接”。
- 只记录关键进展、验证结果、未完成事项和需要跟进的问题。
- 页面前台文案保持英文；项目进度记录使用中文。
- 保持记录简洁，方便一个人长期维护。

推荐小项记录模板：

```md
### 子项目 / 小项：名称

- 当前状态：
- 本次目标：
- 本次完成：
- 验证结果：
- 未完成事项：
- 发现的问题：
- 下一次对话建议目标：
- 备注：
```

---

## 2026-05-19

### 当前对话收尾 / 交接：Production Resend 环境变量补齐与表单投递复测

- 当前状态：
  - 当前分支为 `codex-homepage-ui-v1`，本地与远端同步。
  - `main` 与 `codex-homepage-ui-v1` 均已包含 `3b02c2f fix: add inquiry delivery timeout`，Production 已重新部署。
  - Vercel Production / Preview 环境变量已补齐 `RESEND_API_KEY` 与 `INQUIRY_FROM_EMAIL`。
- 本次目标：
  - 修复用户在 `https://www.jiestartoys.com/contact` 提交表单后未收到邮件的问题。
  - 确认线上 Contact 与 Replacement Parts 两条投递路径都能通过 Resend 发信。
- 本次完成：
  - 确认 Vercel 原先缺少 `RESEND_API_KEY`，导致 `/api/inquiry` 返回成功但 `deliveryConfigured:false`，实际不投递邮件。
  - 将用户提供的 Resend API key 添加到 Vercel 项目环境变量，范围为 Production / Preview，未写入 Git。
  - 发现 Resend 已验证发信用子域名 `send.jiestartoys.com`，并在 Vercel 添加 `INQUIRY_FROM_EMAIL=JIESTAR Website <inquiries@send.jiestartoys.com>`，避免默认 `onboarding@resend.dev` 测试域限制。
  - 重新部署 Production，使新环境变量进入线上运行时。
  - 清理了本轮临时创建的本地密钥备份文件，避免密钥残留在 `/tmp`。
- 验证结果：
  - `https://www.jiestartoys.com/api/inquiry` 的 Contact 测试返回 `{"ok":true,"deliveryConfigured":true,"contactEmail":"info@jiestartoys.com"}`。
  - Replacement Parts 测试返回 `{"ok":true,"deliveryConfigured":true,"contactEmail":"support@jiestartoys.com"}`。
  - 项目 owner 已确认邮箱端也验证通过。
- 未完成事项：
  - 后续仍建议在真实用户表单 UI 上做一次最终生产回归：Contact、Wholesale、Custom Solutions、Replacement Parts。
  - Shopify checkout 子域名与 storefront password / 正式开店状态仍是下一阶段重点。
- 发现的问题：
  - Vercel 新增环境变量后必须重新部署，否则线上 Serverless 运行时不会读取新变量。
  - Resend 默认测试发件域只适合测试，生产收件人需要使用已验证域名的发件地址。
- 下一次对话建议目标：
  - 优先继续处理 Shopify checkout 闭环：正式开店状态、checkout 子域名、Add to Cart / Buy Now / Cart drawer / Continue to Checkout 生产复测。
- 备注：
  - 本轮没有提交 `.env.local`，没有在 Git 中保存任何密钥。
  - 线上环境变量已在 Vercel 控制台配置完成。

### 当前对话收尾 / 交接：询盘 Resend 投递、邮件域名验证与 Vercel 主域名绑定

- 当前状态：
  - 当前分支为 `codex-homepage-ui-v1`。
  - `/api/inquiry` 已从“只接收并返回 `deliveryConfigured:false`”升级为可通过 Resend 投递内部通知邮件。
  - Resend 发信用子域名 `send.jiestartoys.com` 已在阿里云 DNS 添加并通过 Resend 验证。
  - Vercel 项目已绑定 `jiestartoys.com` 与 `www.jiestartoys.com`，根域名 307 跳转到 `www`。
- 本次目标：
  - 补齐 Wholesale / Custom Solutions / Contact / Replacement Parts 的真实询盘邮件投递闭环。
  - 配置并验证 Resend、阿里云 DNS、Gmail 使用入口，以及 Vercel 自定义域名。
- 本次完成：
  - 新增 `lib/inquiry-delivery.ts`，负责选择收件人、格式化询盘邮件、调用 Resend API，并在未配置 key 时安全降级。
  - `/api/inquiry` 校验通过后调用邮件投递模块；商务询盘发送到 `CONTACT_EMAIL`，补件请求发送到 `SUPPORT_EMAIL`。
  - 前台 Inquiry / Replacement Parts 表单成功文案已按 `deliveryConfigured` 区分：已投递提示团队会跟进，未配置提示直接邮箱联系。
  - `.env.example` 与 `README.md` 已补充 `RESEND_API_KEY`、`INQUIRY_FROM_EMAIL`、`CONTACT_EMAIL`、`SUPPORT_EMAIL` 说明。
  - 本地 `.env.local` 由项目 owner 手动配置，未纳入 Git；实际邮件测试已能投递到 Gmail 收件箱。
  - 已指导并完成 Gmail 网页应用安装，用于管理 `info@jiestartoys.com` / `support@jiestartoys.com` 对应邮箱入口。
  - 阿里云 DNS 已保留现有 Gmail / Google 验证 / Resend 记录，并新增 Vercel 所需 `@ A 216.198.79.1` 与 `www CNAME c2039313f1f044aa.vercel-dns-017.com`。
- 验证结果：
  - Resend 域名 `send.jiestartoys.com` 在 Resend 后台显示已验证。
  - Vercel 域名页显示 `jiestartoys.com` 与 `www.jiestartoys.com` 均为有效配置。
  - `https://jiestartoys.com` 已返回 307 并跳转到 `https://www.jiestartoys.com/`。
  - `https://www.jiestartoys.com` 已返回 200，服务端为 Vercel。
- 未完成事项：
  - Shopify checkout 仍建议后续单独绑定子域名，例如 `checkout.jiestartoys.com`，不要占用已经给 Vercel 的 `www.jiestartoys.com`。
  - Shopify storefront password / 正式开店状态仍需处理后再做完整生产 checkout 复测。
  - 真实上线前建议再做一次生产表单全链路测试，确认 `info@jiestartoys.com` 与 `support@jiestartoys.com` 都能稳定收件。
- 发现的问题：
  - Chrome 自动翻译可能改变 Vercel / 阿里云控制台可访问性文本，但本轮 DNS 记录和 Vercel 状态均已通过页面与 `curl` 结果交叉确认。
  - 当前发信域名使用 `send.jiestartoys.com` 子域名；后续如要使用根域名发信，需要重新评估对现有 Gmail MX / SPF / DKIM 的影响。
- 下一次对话建议目标：
  - 优先处理 Shopify checkout 子域名与 storefront password / 开店状态。
  - 随后做一次生产环境关键路径复测：主页、产品页、购物车、checkout 跳转、Wholesale / Contact / Replacement Parts 表单。
- 备注：
  - 本轮没有新增 npm 依赖。
  - 没有提交 `.env.local`，没有暴露 Resend、Shopify 或邮箱密钥。
  - 前台页面文案保持英文；本交接记录按规则使用中文。

## 2026-05-18

### 当前对话收口 / 交接：V1 页面复查、Checkout 与询盘边界确认

- 当前状态：
  - 当前分支仍为 `codex-homepage-ui-v1`。
  - 代码在本轮继续做了小范围 V1 收口修复，重点是产品列表 CTA、Wholesale 目录请求文案、分类轮播首屏图片加载。
  - 本地 dev server 在 `http://localhost:3000` 用于浏览器复查。
- 本次目标：
  - 执行上一轮计划：复查 Products / Product Detail / Collections / Contact，确认 Shopify checkout 与询盘闭环状态，并做上线前必要小修。
- 本次完成：
  - Products / Product Detail / Collections / Contact / Wholesale 已做桌面与移动端浏览器 QA。
  - 产品列表卡片 CTA 从 `Add to Cart` 改为 `View Details`，避免列表页按钮看起来像直接加购但实际进入详情页。
  - 分类轮播首屏可见图片改为优先加载，减少首屏类别卡片图片空白。
  - Wholesale 表单和 FAQ 文案收紧为“Request / review / follow-up”，避免在邮件或 CRM 未接入前承诺自动发送 catalog / price list。
  - 已验证 Add to Cart 后可生成 Shopify checkout URL，但最终仍进入 Shopify password 页面。
  - 已验证 `/api/inquiry` 可接收 wholesale 请求并返回 `deliveryConfigured:false`。
- 验证结果：
  - `pnpm test` 已通过：8 个测试全部通过。
  - 浏览器 QA 结果：上述关键页面在 1366px 桌面与 390px 移动端无水平溢出，首屏可见图片无加载失败，关键 H1 / CTA / 表单入口存在。
  - Checkout 验证结果：`Continue to Shopify Checkout` 可生成 `jiestartoys.myshopify.com/cart/...` URL，但最终落到 `https://jiestartoys.myshopify.com/password`。
  - 询盘接口验证结果：本地 POST `/api/inquiry` 返回 `{"ok":true,"deliveryConfigured":false,"contactEmail":"info@jiestartoys.com"}`。
- 未完成事项：
  - 真实 Shopify checkout 仍需等 Shopify storefront password / 开店状态处理后再做生产完整复测。
  - 询盘接口仍未接邮件、CRM 或持久化存储；上线前如果要业务闭环，需要新增真实投递方案。
  - About 页面和其他品牌信任区仍需要真实 JIESTAR 工厂、团队、检测资料、非产品图片替换占位素材。
- 发现的问题：
  - 产品列表按钮文案与实际行为不一致，已修正。
  - Wholesale 文案此前仍存在“发送 catalog / price list”的偏强承诺，已收紧。
  - 浏览器中残留旧 cart 状态会影响 QA 判断，本轮已通过 UI 删除残留商品后复查。
- 下一次对话建议目标：
  - 优先决定询盘真实投递方案：邮件发送、CRM、Google Sheet / Airtable、或先接收后人工导出。
  - 处理 Shopify storefront password / 正式开店状态后，重新完整复测 checkout。
  - 若业务闭环确认，再进入真实素材替换与最终上线检查。
- 备注：
  - 本轮没有新增第三方依赖。
  - 本轮没有修改 `.env.local`，没有暴露 Shopify token。

### 当前对话收尾 / 交接：About 页面改版、产品分页、Wholesale 文案与导航顺序发布

- 当前状态：
  - 当前分支为 `codex-homepage-ui-v1`，本地已与 `origin/codex-homepage-ui-v1` 同步。
  - 本轮涉及的代码已提交并 push 到 GitHub。
  - 本地 dev server 曾在 `http://localhost:3000` 用于页面预览。
- 本次目标：
  - 按页面审核反馈完成 About 页面方向调整、产品页分页、Wholesale 首屏英文文案、以及主导航顺序调整。
  - 将已确认的小改动提交并推送到 GitHub。
- 本次完成：
  - About 页面已改为 factory tour / brand trust 方向，并提交为 `9346727 feat: redesign about page as factory tour`。
  - Products 页面已加入 `page` 参数和产品目录分页，产品目录信任条与提示文案也完成微调。
  - Wholesale hero 文案已更新为 `WHOLESALE PROGRAM`、`Request Wholesale Catalog & Pricing`、`Request Catalog`，右侧流程卡也改为 catalog / private pricing / MOQ follow-up 语义。
  - 主导航顺序已调整为 `Home / Products / Wholesale / Custom Solutions / Blog / About / Contact`，桌面和移动端共用同一顺序。
  - 已提交并推送：
    - `d6eb91f feat: improve product catalog pagination and wholesale copy`
    - `9346727 feat: redesign about page as factory tour`
    - `77f480c fix: reorder main navigation links`
- 验证结果：
  - `d6eb91f` 提交前已通过：`git diff --check`、`pnpm lint`、`pnpm build`。
  - 导航顺序修改已通过：`git diff --check`、`pnpm lint`。
  - 已在 in-app browser 验证 `/wholesale` 新文案存在且无水平溢出。
  - 已在 in-app browser 验证首页主导航顺序为 `Home, Products, Wholesale, Custom Solutions, Blog, About, Contact`。
  - push 后 `git status --short --branch` 显示本地与远端同步。
- 未完成事项：
  - About 页面仍需后续用真实 JIESTAR 工厂、团队、产品、检测资料图片替换当前占位素材。
  - 后续还需要继续复查 Products / Product Detail / Collections / Contact 等页面的最终视觉和移动端体验。
  - 如果继续调整页面后需要上线，仍建议跑完整 `pnpm build` 并在浏览器复查关键路径。
- 发现的问题：
  - 本轮没有发现新的构建或 lint 问题。
  - 页面视觉调整期间需要注意 Chrome 自动翻译可能影响浏览器判断，前台源码文案仍以英文为准。
- 下一次对话建议目标：
  - 新对话开始后先读取本文件。
  - 优先继续按浏览器页面逐页检查：Products、Product Detail、Collections、Contact。
  - 如果页面方向确认，可进入真实素材替换、Shopify checkout 生产复测、询盘真实投递等上线前任务。
- 备注：
  - 本轮没有修改 `.env.local`，没有暴露 Shopify token。
  - 前台页面文案保持英文；本交接记录按规则使用中文。

## 2026-05-16

### 今日工作收尾 / 交接：安全稳定性优化、产品页搜索体验与代码发布

- 当前状态：
  - 当前分支为 `codex-homepage-ui-v1`，本地包含上一轮购物车提交 `fcca33e feat: complete Shopify cart flow`，以及本轮安全 / 稳定性 / 搜索体验优化改动。
  - 本地 dev server 仍在 `http://localhost:3000` 运行，可继续预览 `/products`。
  - 本轮准备统一提交并 push 到 GitHub。
- 本次目标：
  - 按项目 owner 要求完成今天收尾：更新交接记录、检查无误、提交代码并 push。
  - 先处理本轮发现的高优先级问题：依赖安全、Shopify 数据分页与分类归属、HTML 描述清洗、询盘接口基础校验 / 限流、产品页搜索体验。
- 本次完成：
  - 将 `next` / `eslint-config-next` 升级到 `16.2.6`，并通过 `pnpm.overrides` 固定 `postcss@8.5.12`，当前生产依赖 audit 无已知漏洞。
  - 新增 Shopify connection 分页 helper，`getShopifyProducts()` 改为分页读取，避免产品超过单页数量后被截断；collection 查询也提高到 `first: 100`。
  - 产品详情页 Shopify `descriptionHtml` 增加保守 HTML 清洗，避免不安全标签 / 事件属性直接进入 `dangerouslySetInnerHTML`。
  - `/api/inquiry` 增加 JSON 解析保护、字段规范化、长度校验、邮箱校验和基础内存限流；前端成功提示改为真实状态，不再暗示自动发送 catalog。
  - About 页面和 sitemap 改为读取 Shopify 产品 / collection 数据，减少本地 mock 数据继续参与线上页面。
  - 产品页内容区域的搜索框已移除；移动端头部放大镜改为展开全宽搜索条，点击后输入框自动聚焦。
- 验证结果：
  - 已通过：`pnpm test`，8 个测试全部通过。
  - 已通过：`pnpm lint`。
  - 已通过：`pnpm build`，构建生成 93 个页面 / 路由条目；构建日志确认 Shopify 当前读取 21 个产品、46 个产品类型 collection。
  - 已通过：`pnpm audit --prod`，联网权限下返回 `No known vulnerabilities found`。
  - 已通过：`git diff --check`。
  - 已在浏览器 QA `/products`：桌面产品内容区不再出现独立搜索框；移动端点击放大镜后出现页面全宽搜索条，输入框自动聚焦。
- 未完成事项：
  - Shopify 店铺 checkout 最终页仍受后台 storefront password / 开店状态影响，正式上线前需要再做生产环境完整 checkout 复测。
  - 当前询盘接口仍只是服务端接收与日志记录，后续需要接入邮件、CRM 或持久化存储后才算完整业务闭环。
  - Chrome 页面翻译仍可能影响 DOM / 可访问性树判断；上线前需要再次决定是否恢复全站 `notranslate` 防护。
- 发现的问题：
  - 受限沙盒下 `pnpm audit --prod` 会因 npm registry DNS 解析失败而报 `ENOTFOUND`；使用联网权限重跑后 audit 通过。
  - Header 搜索应作为全站唯一主搜索入口；产品列表区域再放一个搜索框会造成桌面和移动端体验重复。
- 下一次对话建议目标：
  - 新对话开始后先读取本文件。
  - 优先复查 GitHub 远端是否已包含本轮提交与 `fcca33e`。
  - 下一轮可继续做生产环境 checkout 复测、询盘接口真实投递、或恢复 / 验证 `notranslate` 防护。
- 备注：
  - 本轮没有修改 `.env.local`，没有暴露 Shopify token。
  - 前台页面文案保持英文；本交接记录按规则使用中文。

### 当前对话收尾 / 交接：购物车 bug 修复、提交与素材草稿清理

- 当前状态：
  - Shopify 购物车基础流程、Header 搜索建议、产品图库交互和 Account 入口已合并为一次提交：`fcca33e feat: complete Shopify cart flow`。
  - 当前分支为 `codex-homepage-ui-v1`，本地比远端 ahead 1，尚未 push。
  - 已清理未使用的首页素材草稿；`public/images/home/` 只保留已跟踪的正式 Hero 图片 `jiestar-home-hero-user-composite-wechat-v2-web.png`。
- 本次目标：
  - 修复购物车删除与数量增减偶发使用旧 Shopify cart line id 导致的错误。
  - 提交已验证的购物车相关代码，并删除未使用的首页素材草稿。
- 本次完成：
  - `components/cart/CartProvider.tsx` 的数量更新和删除操作改为同时携带 `lineId` 与 `merchandiseId`，操作前会用当前 cart state 重新定位 line。
  - `/api/cart/lines` 在 Shopify 返回 `line ... does not exist` 时，会重新读取当前 cart，并按 `merchandiseId` 找到真实 line 后再更新或删除。
  - `/api/cart` 避免复用空的旧 cart id；空 cart 或失效 cart 会重新创建 Shopify cart。
  - 已提交当前代码范围，提交号为 `fcca33e`；未把首页素材草稿纳入提交。
- 验证结果：
  - 已通过：`git diff --check`。
  - 已通过：`pnpm lint`。
  - 已通过：`pnpm build`。
  - 已在本地浏览器 QA `/products/steam-train-1`：Add to Cart 后点击 `+` 可从 1 到 2，小计从 `$99.99` 到 `$199.98`；点击 `-` 可回到 1，小计回到 `$99.99`，不再出现 `line id does not exist`。
  - 删除第二个商品时已验证不会误删全部商品。
- 未完成事项：
  - 当前提交尚未 push 到远端。
  - 本交接日志更新本身尚未提交；如果下一次要保持文档同步，可单独提交一条 `docs: update cart handoff log`。
  - Shopify 店铺仍处于 storefront password 状态，真实顾客 checkout 最终页仍需等 Shopify 后台开放后再完整复测。
- 发现的问题：
  - Shopify cart line id 可能在 cart mutation 后变化；前端不能长期只依赖旧 line id。
  - Chrome 自动翻译仍可能影响页面可访问性树和视觉 QA 判断；源码前台文案仍为英文。
- 下一次对话建议目标：
  - 新对话开始后先读取本文件。
  - 优先确认是否 push `fcca33e` 到 GitHub。
  - 如继续购物车，可做生产环境 Shopify checkout 复测、移动端 cart drawer QA，或评估列表页 quick add 是否进入下一轮。
- 备注：
  - 本轮没有新增第三方依赖。
  - 本轮没有修改 `.env.local`，没有暴露 Shopify token。
  - dev server 按前序要求保留在 `http://localhost:3000`。

### 当前对话收尾 / 交接：Header 产品搜索建议下拉

- 当前状态：
  - 已完成桌面端 Header 搜索框的产品自动建议下拉，当前分支为 `codex-homepage-ui-v1`，本轮搜索建议改动尚未提交。
  - 本地已有 dev server 在 `http://localhost:3000` 运行；尝试启动新 dev server 时发现 3000 端口已有进程，因此继续复用现有服务做浏览器检查。
  - 当前工作区仍包含此前购物车、产品图库、Shopify helper、首页素材草稿等未提交 / 未跟踪内容；后续提交时需要分清本轮 Header 搜索建议范围。
- 本次目标：
  - 在 Header 桌面搜索框中增加自动建议下拉：输入前几位字母后显示匹配产品。
  - 点击建议或键盘高亮后回车直接进入对应产品详情页。
  - 保持原有搜索提交行为：没有高亮建议时回车 / 搜索按钮仍进入 `/products?q=...`。
- 本次完成：
  - 新增 `components/layout/HeaderSearch.tsx` 客户端组件，支持 2 个字符以上触发建议、最多显示 5 个产品、点击产品跳转详情页、方向键高亮、`Escape` / 点击外部关闭。
  - `components/layout/Header.tsx` 已将桌面搜索框替换为 `HeaderSearch`，移动端搜索入口保持原样。
  - `app/layout.tsx` 已通过 `getShopifyProducts()` 为 Header 注入产品建议数据；如果 Shopify lookup 失败，Header 建议数据回退为空数组，不阻断页面渲染。
  - 建议匹配字段包括产品 title、SKU、category、collection handle、series；建议项展示产品名和 `SKU / category` 小字。
- 验证结果：
  - 已通过：`git diff --check`。
  - 已通过：`pnpm lint`。
  - 已通过：`pnpm build`。
  - 已在 Chrome 本地 QA：`/products` 输入 `flo` 会出现 `Flowers` / `Flowerhouse Book Stand` 等建议；方向键高亮后回车可进入 `/products/flowers`。
  - 已在 Chrome 本地 QA：输入 `tra` 后不选择建议直接回车，仍进入 `/products?q=tra` 并显示 3 个匹配产品。
- 未完成事项：
  - 本轮 Header 搜索建议改动尚未提交。
  - 如要提交，建议重点纳入 `components/layout/HeaderSearch.tsx`、`components/layout/Header.tsx`、`app/layout.tsx`；但 `app/layout.tsx` 和 `Header.tsx` 当前也包含此前购物车相关改动，提交前需要重新复查 diff 边界。
  - 上线前建议在 Chrome 自动翻译关闭状态下再做一次视觉复查，避免翻译弹窗遮挡 Header 搜索框判断。
- 发现的问题：
  - Chrome 自动翻译仍会把页面文案和可访问性树翻成中文；本轮 QA 中实际源码仍为英文文案。
  - 本地启动 `pnpm dev` 时提示已有 3000 端口 dev server，尝试转 3001 后失败，因为同项目已有 dev server 运行；最终复用 3000 完成检查。
- 下一次对话建议目标：
  - 新对话开始后先读取本文件。
  - 如果继续搜索体验，优先检查 Header 搜索建议在移动端是否也需要扩展；当前实现只覆盖桌面端。
  - 如果准备提交，先按功能边界拆分：Header 搜索建议、购物车、产品图库、首页素材草稿不要混在同一个提交里。
- 备注：
  - 本轮没有新增第三方依赖。
  - 本轮没有修改 `.env.local`，没有暴露 Shopify token。
  - 前台页面文案保持英文；本交接记录按规则使用中文。

### 当前对话收尾 / 交接：产品详情页主图切换与放大浏览优化

- 当前状态：
  - 已完成产品详情页主图区域交互优化，当前分支为 `codex-homepage-ui-v1`，本轮图库 UI 改动尚未提交。
  - 本地 `http://localhost:3000/products/flowers` 可继续预览；Chrome 页面翻译仍处于可用状态，因此可访问性树里部分英文文案会显示为中文。
  - 当前工作区仍包含此前购物车、Header、Shopify helper、首页素材草稿等未提交 / 未跟踪内容；这些不属于本轮图库 UI 范围，后续提交时需要分清边界。
- 本次目标：
  - 去掉主图左上角 `Product Preview` 标签。
  - 在主图左右两侧增加半透明圆形切图按钮，支持前后循环切换，hover 变红。
  - 在主图右上角增加放大镜，打开全屏大图浏览；放大层支持左右切图、底部页码和关闭。
  - 根据项目 owner 反馈，继续微调按钮视觉：主图放大镜改为透明背景、白色大图标，hover 时图标变红。
- 本次完成：
  - `components/product/ProductGallery.tsx` 已新增主图前后切换、全屏预览层、`Escape` 关闭、预览层左右切图与底部 `当前/总数` 页码。
  - 放大层底部页码已加 `translate="no"` / `notranslate`，降低 Chrome 自动翻译影响数字同步的概率；实测切图时页码可从 `1/5` 更新到 `2/5`。
  - 主图右上角放大镜已调整为透明背景、白色图标、hover 红色图标；图标和触控区已放大以提高可见性。
  - `components/ui/Icons.tsx` 已新增 `ZoomInIcon`，继续使用项目内自有 SVG icon 风格，没有新增第三方依赖。
- 验证结果：
  - 已通过：`git diff --check`。
  - 已通过：`pnpm lint`。
  - 已通过：`pnpm build`。
  - 已在 Chrome 本地 QA `/products/flowers`：主图标签已移除，主图左右按钮可切图，放大层可打开 / 关闭，放大层页码随切图变化，底部页码字体已缩小。
- 未完成事项：
  - 本轮图库 UI 改动尚未提交。
  - 如要提交，建议只纳入 `components/product/ProductGallery.tsx` 和 `components/ui/Icons.tsx`，避免误带此前购物车与首页素材草稿。
  - 上线前建议再做一次移动端真实浏览器检查，重点看主图放大镜在浅色图片上的可见性、全屏预览层底部控制条是否遮挡产品主体。
- 发现的问题：
  - Chrome 自动翻译会改写部分页面文本和可访问性树，曾影响放大层底部数字显示判断；当前对页码节点做了局部 `notranslate` 处理。
  - 放大镜如果使用浅灰圆形背景，在部分主图上存在视觉过重的问题；当前按反馈改为透明背景白色图标。
- 下一次对话建议目标：
  - 新对话开始后先读取本文件。
  - 如果继续产品详情页 UI，先复查 `ProductGallery` 当前视觉效果，再决定是否做移动端微调或统一图库按钮尺寸。
  - 如果准备提交，先确认是否只提交图库 UI，还是连同此前购物车功能一起分批提交。
- 备注：
  - 本轮没有新增第三方依赖。
  - 本轮没有修改 `.env.local`，没有暴露 Shopify token。
  - 前台页面文案保持英文；本交接记录按规则使用中文。

### 当前对话收尾 / 交接：Shopify 购物车基础可用流程完善

- 当前状态：
  - 已完成 Shopify 购物车基础可用流程实现，当前分支为 `codex-homepage-ui-v1`，本轮购物车改动尚未提交。
  - 本地 dev server 仍在 3000 端口运行，可通过 `http://localhost:3000` 继续预览。
  - 当前工作区还有 `public/images/home/` 下未跟踪的首页素材草稿文件，和本轮购物车功能无关，后续提交时不要误包含。
- 本次目标：
  - 完善 DTC 基础购物车流程：商品详情页 Add to Cart、Header 数量、购物车抽屉、数量调整、删除商品、继续 Shopify Checkout。
  - 保持 Buy Now 可用：为当前商品创建一件商品的 Shopify cart，并跳转到 Shopify checkout。
  - 商品列表和首页商品卡片本轮继续保持“进入详情页优先”，不做 quick add。
- 本次完成：
  - `lib/shopify.ts` 已新增 Shopify Cart API helper：创建 cart、读取 cart、添加 line、更新数量、删除 line，并返回 `checkoutUrl`。
  - 新增 `/api/cart` 与 `/api/cart/lines` 服务端 route，所有 Shopify Storefront API 调用仍在服务端执行，客户端只保存 Shopify `cartId`。
  - 新增全局 cart provider、cart drawer 和 Header cart count；购物车状态可在全站共享，并可从 `localStorage` 恢复。
  - 商品详情页 Add to Cart 已改为真实加购并打开 cart drawer；Buy Now 继续创建单商品 Shopify checkout。
- 验证结果：
  - 已通过：`git diff --check`。
  - 已通过：`pnpm lint`。
  - 已通过：`pnpm build`。
  - 已在 Chrome 本地 QA `/products/steam-train-1`：Add to Cart 打开抽屉，Header 数量更新，数量加减更新 totals / count，Remove 后购物车为空，关闭后重新打开可继续读取本地 cart 状态。
  - Continue to checkout 和 Buy Now 均可跳转 Shopify；当前 Shopify 店铺处于 password locked 状态，因此最终进入 `jiestartoys.myshopify.com/password`，这不是前端错误。
- 未完成事项：
  - 本轮购物车改动尚未提交。
  - 独立 `/cart` 页面、列表页 quick add、账号登录、折扣码 UI、运费估算、B2B cart 和 abandoned-cart 行为不在本轮范围。
  - 上线前建议在 Vercel / 生产环境再复查 Add to Cart、Checkout 跳转，以及 Shopify password / 正式开店状态。
  - 当前 Chrome 自动翻译仍可能影响视觉检查和 DOM 稳定性；上线前仍需决定是否恢复 notranslate 防护。
- 发现的问题：
  - Shopify 店铺当前仍有 storefront password，Checkout / Buy Now 会进入 Shopify password 页面。
  - 浏览器 QA 时 Chrome 自动翻译处于开启状态，部分可访问性树文本显示为中文；源码前台文案仍保持英文。
- 下一次对话建议目标：
  - 新对话开始后先读取本文件。
  - 先复查购物车 diff 和未跟踪文件边界，避免把首页素材草稿纳入购物车提交。
  - 如项目 owner 确认购物车体验，建议再运行 `git diff --check`、`pnpm lint`、`pnpm build`，然后提交购物车功能。
  - 后续可选方向：生产环境 Shopify checkout 复测、恢复 notranslate 防护，或单独做产品列表 quick add。
- 备注：
  - 本轮没有新增第三方依赖。
  - 本轮没有修改 `.env.local`，没有暴露 Shopify token。
  - 前台页面文案保持英文；本交接记录按规则使用中文。

## 2026-05-15

### 当前对话收尾 / 交接：首页 Hero Banner 真实产品合成图替换与网页显示优化

- 当前状态：
  - 已将首页 Hero 右侧从临时 Unsplash 汽车图替换为项目 owner 提供 / 调整的真实 JIESTAR 产品合成图。
  - 当前页面效果已在本地 `localhost:3000` 多轮预览调整：产品组合保留真实产品，右侧加入干净展示板、轻量边框、淡红斜切层、透明底部和投影，避免硬白底矩形，同时保留一定 3D 突出感。
  - 本轮准备提交最终页面使用文件；前面生成和整理的多版临时草稿素材目录不纳入本次提交。
- 本次目标：
  - 根据项目 owner 的 PS 草图和网页反馈，把 Banner 放进当前首页 Hero 实际版位中反复微调。
  - 避免 AI 生成产品不匹配的问题，确保 Banner 使用真实 JIESTAR 产品素材。
  - 在结束当前对话前更新交接日志并提交代码。
- 本次完成：
  - `components/sections/HomeHero.tsx` 已更新 Hero 文案和 CTA：突出 factory-direct、custom product solutions，并将第二按钮指向 `/custom-solutions`。
  - 首页 Hero 右侧图片已改为本轮最终网页专用素材：`public/images/home/jiestar-home-hero-user-composite-wechat-v2-web.png`。
  - 右侧视觉结构已从普通卡片改为产品合成图 + 背后展示板 + 底部透明突出 + 柔和投影的组合。
  - 已根据反馈移除多余红黄黑装饰色块，并把偏灰的展示板调得更干净、更接近白底高级感。
- 验证结果：
  - 已通过：`git diff --check`。
  - 已通过：`pnpm lint`。
  - 已在 Chrome / `localhost:3000` 视觉检查首页 Hero 当前落位。
- 未完成事项：
  - 最终上线前仍建议用 PS 对 `jiestar-home-hero-user-composite-wechat-v2-web.png` 做一次更精细的边缘抠图，尤其是白色飞机、火箭和浅色产品边缘。
  - 如果后续项目 owner 提供更精修的 PSD / PNG，可只替换同名最终素材或更新 `HomeHero.tsx` 的图片路径。
  - 当前 `public/images/home/` 下仍有此前试图、素材整理和 50 个产品参考图等未跟踪草稿文件，本次提交不包含这些临时素材。
- 发现的问题：
  - 右侧产品图如果直接用原始白底 PNG，会在网页里出现明显“白色方块贴图”感。
  - 如果把展示板背景调得过度接近 Hero 大背景，会削弱产品突出和 3D 层次。
  - 装饰色块过多会抢产品主体，最终应以干净展示板和产品本身为主。
- 下一次对话建议目标：
  - 新对话开始后先读取本文件。
  - 如果继续首页视觉，优先确认 Hero 当前版本是否作为阶段定稿；若定稿，再处理移动端 Hero 裁切和图片加载尺寸优化。
  - 如果继续素材，建议从 PSD 里导出最终透明 PNG，再替换当前 `jiestar-home-hero-user-composite-wechat-v2-web.png`。
- 备注：
  - 本轮没有新增第三方依赖。
  - 前台页面文案保持英文；本交接记录按规则使用中文。

### 当前对话收尾 / 交接：Shopify 分类完整性、产品类型过滤与内容检查阶段翻译调整

- 当前状态：
  - 已完成今天主线：商品详情页 Related Products Shopify 化、Shopify collections 分页读取、产品类型 collection 过滤、以及内容检查阶段临时恢复 Chrome / Google 页面翻译。
  - 当前分支为 `codex-homepage-ui-v1`，本轮改动尚未提交。
  - 当前工作区仍有未提交改动：`app/layout.tsx`、`app/products/[handle]/page.tsx`、`lib/shopify.ts`、`docs/11-shopify-runtime-troubleshooting.md`、`docs/09-daily-progress-log.md`。
- 本次目标：
  - 继续昨天 Shopify 稳定性修复后的产品体验整理。
  - 解决产品详情页 Related Products 混用本地 mock 数据的问题。
  - 确认首页 Featured Categories 和产品页 Shop by category 是否显示完整 Shopify 分类。
  - 避免未来新增品牌系列、专题系列后自动混入前台产品类型分类轮播。
  - 按“结束当前对话”规则更新交接日志。
- 本次完成：
  - `app/products/[handle]/page.tsx` 已新增 Related Products 选择逻辑：优先同 Shopify collection 商品，排除当前商品；同分类没有可推荐商品时，再退回 Shopify catalog，不再直接使用本地 mock products。
  - `app/layout.tsx` 已按项目 owner 当前内容检查需求，临时移除 `meta google:notranslate`、`html translate="no"` 和 `body.notranslate`，方便使用 Chrome / Google 页面翻译。
  - `docs/11-shopify-runtime-troubleshooting.md` 已记录：notranslate 防护当前是临时移除，上线前或再次遇到 Chrome 翻译导致的 `removeChild` / `NotFoundError` 时应恢复。
  - `lib/shopify.ts` 的 `getShopifyCollections()` 已从 `collections(first: 30)` 改为分页读取全部 Shopify collections；当前 Shopify 后台可读到 46 个 collections。
  - `lib/shopify.ts` 已新增产品类型 collection 过滤层：当前 46 个产品类型 collection handle 作为 allowlist；同时支持未来通过 Shopify collection metafield `custom.website_collection_type=product_type` 自动纳入。
  - 首页 Featured Categories、产品页 Shop by category、分类 sitemap 和静态分类页生成现在都只使用“产品类型 collection”，避免未来品牌系列 / 专题系列自动混入产品类型导航。
- 验证结果：
  - 已通过：`git diff --check`。
  - 已通过：`pnpm lint`。
  - 已通过：`pnpm build`。
  - 本地 HTTP 抽查通过：`/products`、`/products/steam-train-1`、`/products/sherlock-holmes-memorial-hall`、`/collections/trains`、`/collections/pirates`、`/collections/movie-game` 均返回 200。
  - 构建日志确认：`getShopifyCollections` 当前返回 `totalCount: 46`、`count: 46`、`filter: 'product_type'`。
  - 页面 HTML 已确认不再输出 `notranslate` / `translate="no"` / `google:notranslate`，方便当前阶段用浏览器翻译检查英文内容。
- 未完成事项：
  - 本轮改动尚未提交。
  - 上线前建议恢复 `app/layout.tsx` 的 notranslate 防护，降低 Chrome 自动翻译改写 React DOM 后触发 runtime overlay 的风险。
  - 如果后续新增新的“产品类型”collection，需要加入 `PRODUCT_TYPE_COLLECTION_HANDLES`，或在 Shopify collection metafield 设置 `custom.website_collection_type=product_type`。
  - 如果后续新增品牌系列 / 活动专题 / 子品牌系列，不要标记为 `product_type`，否则会进入首页和产品页分类轮播。
  - 仍建议用真实浏览器做一次首页和产品页分类轮播视觉检查，重点看 46 个分类横向滚动、图片、标题换行和移动端宽度。
- 发现的问题：
  - Shopify 的 Collections / 产品系列并不天然等同于网站“产品类型分类”；未来品牌系列也会使用 collection，因此前台必须做过滤。
  - Storefront API 可读取 collection metafield，但不能读取后台自动 collection 的 ruleSet，所以不能直接用“产品类型 等于 X”这个后台条件做前台判断。
  - 当前 Shopify 产品数量为 21，部分产品类型 collection 的产品数仍为 0；这是后台产品归属 / 数据完整性问题，不是前端渲染问题。
  - notranslate 防护和项目 owner 当前使用 Google 页面翻译检查内容的需求存在冲突；当前选择以内容检查便利优先，上线前再恢复稳定性防护。
- 下一次对话建议目标：
  - 新对话开始后先读取本文件。
  - 先复查当前未提交 diff，重点看 `lib/shopify.ts` 的产品类型 collection 过滤策略和 `app/products/[handle]/page.tsx` 的 Related Products 逻辑。
  - 如果视觉方向确认，做一次浏览器视觉回归后提交本轮改动。
  - 后续继续整理 Shopify 后台产品归属，优先处理产品数为 0 的产品类型 collection 是否需要保留在前台。
- 备注：
  - 本次没有新增第三方依赖。
  - 本次没有修改 `.env.local`，没有暴露 Shopify token。
  - 前台页面文案保持英文；本交接记录按规则使用中文。

## 2026-05-14

### 今日工作收尾 / 明日方向：Shopify 稳定性修复后续与产品体验整理

- 当前状态：
  - 今天主线已完成：Shopify 产品详情页 / 分类页间歇性 404、Shopify 图片偶发加载失败、Chrome 翻译触发 React runtime overlay 的排查与稳定性修复。
  - 最新提交为 `26e02ed feat: polish support pages and stabilize Shopify catalog`，当前分支为 `codex-homepage-ui-v1`。
  - 当前工作区仍有 1 个未提交改动：`app/layout.tsx`。
- 本次目标：
  - 按“结束今天的工作”规则更新项目交接日志。
  - 给明天继续推进的方向和大致内容，方便下一次对话直接进入执行。
- 本次完成：
  - 已复查今日日志，确认今天的核心修复已记录在下方“Shopify 产品 / 分类页间歇性 404 与图片加载失败修复”小项中。
  - 已复查当前 Git 状态：目前只有 `app/layout.tsx` 处于 modified 状态。
  - 已确认 `docs/11-shopify-runtime-troubleshooting.md` 已作为后续同类问题的优先排查文档。
- 验证结果：
  - 今日核心修复此前已通过：`git diff --check`、`pnpm lint`、`pnpm build`。
  - 今日核心修复此前已通过本地 HTTP 和 Chrome 路径复测，分类页和商品页均能返回 200，且未再出现 `removeChild` / `NotFoundError`。
  - 本次收尾仅更新交接日志，未重新运行完整 build。
- 未完成事项：
  - 明天开始前先确认 `app/layout.tsx` 的未提交改动是否保留。当前 diff 显示它移除了 `translate="no"`、`body.notranslate` 和 `google:notranslate`，这与 `docs/11-shopify-runtime-troubleshooting.md` 中规避 Chrome 自动翻译 DOM 改写的建议不一致。
  - 线上 Vercel 部署后仍建议再检查一次 `/products`、几个 `/products/[handle]` 和几个 `/collections/[handle]`。
  - 产品详情页 Related Products 仍建议改成真实 Shopify 同类 / 同 collection 商品，不要继续混用本地 mock related products。
  - 如果 Shopify collection 后续超过 30 个，需要补 `getShopifyCollections()` 分页逻辑。
- 发现的问题：
  - 当前未提交的 `app/layout.tsx` 改动可能会重新放大 Chrome 自动翻译导致的 `removeChild` / `NotFoundError` 风险；明天应先决定是否恢复 notranslate 标记。
  - Shopify 请求偶发失败仍可能存在，当前方案是增强韧性和避免误判为 404，不代表 Shopify 网络完全不会抖动。
- 明天建议方向：
  - 第一优先级：先处理 `app/layout.tsx` 未提交 diff，确认是否恢复 notranslate 标记，然后跑 `git diff --check`、`pnpm lint`、`pnpm build`。
  - 第二优先级：做一轮线上 / 本地产品路径抽查，重点看 `/products`、热门商品详情页、`/collections/trains`、`/collections/pirates`、`/collections/movie-game` 等路径。
  - 第三优先级：开始整理 Product Detail 的 Related Products，改为基于真实 Shopify catalog / collection 的推荐逻辑。
  - 第四优先级：继续补 Shopify 后台 collection 内容质量，包括英文简介、封面图、产品归属和 handle 规范。
- 下一次对话建议目标：
  - 新对话开始后先读取本文件。
  - 先复查 `git status --short --branch` 和 `app/layout.tsx` diff，再决定是否恢复 notranslate 标记。
  - 然后选择进入“产品详情页 Related Products Shopify 化”或“线上稳定性抽查 + collection 内容整理”。
- 备注：
  - 本次没有新增第三方依赖。
  - 本次没有修改 `.env.local`，没有暴露 Shopify token。
  - 前台页面文案保持英文；本交接记录按规则使用中文。

### 当前对话记录：Shopify 产品 / 分类页间歇性 404 与图片加载失败修复

- 当前状态：
  - 已定位并修复产品详情页、产品分类页偶发 404，以及 Shopify 图片偶发加载失败的问题。
  - 当前对话已收尾，3000 端口 dev server 已准备关闭。
- 本次目标：
  - 解决 `/products/[handle]` 和 `/collections/[handle]` 有时 404、过一会儿又正常的问题。
  - 解决 Shopify CDN 图片有时不显示或本地 Next 图片代理超时的问题。
  - 将处理方法记录下来，后续遇到同类问题可直接按固定流程排查。
- 本次完成：
  - `lib/shopify.ts` 的 Storefront API 请求已增加 3 次轻量重试，降低 `fetch failed`、`ECONNRESET`、`ConnectTimeoutError` 对页面和 build 的影响。
  - `getShopifyProduct()` 已增加 Shopify catalog 产品缓存快速路径，减少商品详情页在已有产品目录数据时再次等待单个 product 请求。
  - `getShopifyCollection()` 已增加 Shopify catalog 内存缓存快速路径，避免用户点击分类页时每个 collection 都重新等待单独的 Shopify 请求。
  - `app/collections/[handle]/page.tsx` 已显式启用 `dynamicParams = true`，避免静态参数列表不完整时真实 Shopify collection 被误判为 404。
  - `app/layout.tsx` 已加入 `translate="no"`、`body.notranslate` 和 `meta name="google" content="notranslate"`，用于规避 Chrome 自动翻译改写 React DOM 后触发 `removeChild` / `NotFoundError`。
  - 新增 `lib/images.ts`，统一判断 Shopify CDN 图片并绕过 Next 图片优化代理。
  - 首页 Featured Categories、产品页 Shop by category、产品分类页 banner、产品详情图和产品卡片图已使用统一的 Shopify 图片处理逻辑。
  - 新增 `docs/11-shopify-runtime-troubleshooting.md`，记录同类问题的根因、日志特征、当前方案和后续处理流程。
  - `AGENTS.md` 与 `CLAUDE.md` 已加入提示：遇到产品 / 分类页间歇性 404 或 Shopify 图片失败时，先查 `docs/11-shopify-runtime-troubleshooting.md`。
- 验证结果：
  - 已通过：`git diff --check`。
  - 已通过：`pnpm lint`。
  - 已通过：`pnpm build`。构建过程中曾出现 Shopify `ECONNRESET` 和 `ConnectTimeoutError`，但重试后继续完成，说明本次修复生效。
  - 已通过本地 HTTP 验证：`/collections/trains` 返回 200。
  - 已通过本地 HTTP 验证：`/collections/pirates` 返回 200。
  - 已通过本地 HTTP 验证：`/products/steam-train-1` 返回 200。
  - 二次复测：此前可慢到约 21 秒的 `/collections/movie-game`、`/collections/castle`、`/collections/weapon` 已降到约 0.35-0.41 秒返回 200；后续缓存命中日志显示可在几十毫秒级返回。
  - Chrome 复测：`/products/sherlock-holmes-memorial-hall` 正常显示，未出现 Next runtime overlay，控制台未再出现 `removeChild` / `NotFoundError`。
  - Chrome 路径复测：从 `/collections/movie-game` 再进入 `/products/sherlock-holmes-memorial-hall`，分类页和商品页均正常显示，控制台无相关错误。
- 未完成事项：
  - 线上 Vercel 部署后仍建议检查一次 `/products`、几个 `/products/[handle]` 和几个 `/collections/[handle]`，确认生产环境 Shopify 请求稳定。
  - 如果后续 Shopify collection 超过 30 个，需要继续调整 `getShopifyCollections()` 的分页逻辑，不要只取 `first: 30`。
- 发现的问题：
  - 同一个 URL 一会儿 404、一会儿正常，通常不是 handle 写错，而是 Shopify 请求失败后被误判成 `notFound()`。
  - 分类页如果“不是 404 但一直转圈”，通常是 Shopify 单个 collection 请求在等待超时和重试，需要优先走已加载 catalog 缓存。
  - 商品详情页如果在 Chrome 中出现 `Failed to execute 'removeChild' on 'Node'`，且刷新后恢复，优先怀疑 Chrome 自动翻译或翻译扩展改写了 React 管理的 DOM。
  - Next 图片优化代理拉 `cdn.shopify.com` 图片时会偶发 `upstream image response timed out`；Shopify CDN 图片更适合直连显示。
- 下一次对话建议目标：
  - 如果继续产品体验，优先处理真实 Shopify 商品详情页 Related Products，不再混用本地 mock related products。
  - 如果继续稳定性优化，优先补 Shopify collections 分页和请求日志的 retry attempt 记录。
- 备注：
  - 本次没有新增第三方依赖。
  - 本次没有修改 `.env.local`，没有暴露 Shopify token。
  - 本轮相关改动尚未提交；工作区仍包含此前政策页、页脚、缺件补件表单和分类图片等未提交改动，下一次继续前应先复查 `git status --short`。
  - 前台页面文案保持英文；本交接记录按规则使用中文。

## 2026-05-13

### 当前对话收尾 / 交接：子品牌展示、Logo 规范与短简介调整

- 当前状态：
  - 子品牌展示规则已完成并已落地到 About 和 Custom Solutions 页面。
  - 子品牌数据已统一到 `lib/sub-brands.ts`，后续新增子品牌只需要维护这一处数据源。
  - 当前工作区仍存在其他未提交改动，主要来自政策页、缺件补件表单、页脚和分类图片相关文件；本小项相关文件当前未显示未提交 diff。
- 本次目标：
  - 将 GULY、JAKI 加入子品牌展示。
  - 将子品牌展示从多列卡片改为横向单行滚动，适配后续更多子品牌。
  - 去掉左右方向按钮，保留自动无限滚动、鼠标悬停暂停和鼠标拖拽快速浏览。
  - 统一子品牌 logo 展示尺寸，避免 JAKI、GULY、iBlock 等视觉大小差距过大。
  - 将子品牌简介改为短定位文案，减少横向滚动卡片中的文字负担。
- 本次完成：
  - 新增并使用 `components/sections/SubBrandCarousel.tsx`，支持横向循环滚动、悬停暂停、鼠标拖拽和边界无感回到中间段。
  - 新增 `public/images/sub-brands/jaki-logo.png` 与 `public/images/sub-brands/guly-logo.png`，并裁掉 JAKI / GULY logo 外围多余白边。
  - `app/about/page.tsx` 和 `app/custom-solutions/page.tsx` 已改为复用统一子品牌数据和轮播组件。
  - `lib/sub-brands.ts` 已维护 5 个子品牌：JAKI、GULY、iBlock、Small Angle、Xbert。
  - 小角度展示名已改为 `Small Angle`。
  - 子品牌短简介已改为一行定位：
    - JAKI：`Oriental culture, display sets, space, plants and giftable brick products.`
    - GULY：`Technic-style cars, motorcycles, mechanical models and RC upgrade sets.`
    - iBlock：`Creative sets across military, city, insects, mecha and themed collections.`
    - Small Angle：`Compact vehicle models, mechanical subjects and MOC-style designs.`
    - Xbert：`Modular buildings, vehicles and fantasy-themed display sets.`
  - `docs/06-asset-checklist.md` 已记录新增子品牌 logo 规则：先裁掉外边距、保留真实宽高、不要为单个品牌写一-off Tailwind 尺寸，统一由 `SubBrandCarousel` 控制展示。
- 验证结果：
  - 已通过：`pnpm lint`。
  - 已通过：`pnpm build`（在子品牌轮播和拖拽逻辑调整后验证通过）。
  - 已通过本地 HTTP 验证：`/about` 返回 200。
  - 已通过本地 HTTP 验证：`/custom-solutions` 返回 200。
- 未完成事项：
  - 后续新增子品牌前，需要先确认是否允许公开展示。
  - 如果继续新增大量子品牌，建议优先准备裁边后的 PNG / SVG 规范素材，避免前端逐个做视觉补偿。
  - 仍建议用浏览器再做一次桌面端和移动端视觉回归，重点看自动滚动速度、拖拽手感、logo 视觉大小和短简介换行。
- 发现的问题：
  - 仅通过 Tailwind 放大 JAKI / GULY 会导致图片位置变大但白边仍在；正确处理方式是先裁掉源图边缘留白。
  - CSS transform marquee 与可拖拽滚动容器叠加时会暴露真实滚动尽头；已改为三段重复内容 + scrollLeft 归位的 JS 循环方案。
- 下一次对话建议目标：
  - 新对话开始后先读取本文件。
  - 先确认是否继续处理当前未提交的政策页 / 缺件补件表单 / 页脚改动，或回到子品牌模块做最终视觉回归。
  - 如果继续子品牌模块，优先用浏览器检查 `/about` 和 `/custom-solutions` 的桌面端、移动端、hover pause 和拖拽循环。
- 备注：
  - 本次没有新增第三方依赖。
  - 前台文案保持英文；本交接记录按规则使用中文。

### 当前对话收尾 / 交接：政策页面、缺件补件表单与页脚导航优化

- 当前状态：
  - 已完成本轮 5 个政策 / 支持页面文案与页面结构优化。
  - 已完成 Replacement Parts / Missing Pieces 页面专用缺件补件联系表单。
  - 已完成页脚导航去重和显示优化。
  - 当前分支为 `codex-homepage-ui-v1`，本轮改动尚未提交；本地分支显示 `ahead 1`，并存在未提交文件。
- 本次目标：
  - 完善配送政策、替换零件、退货与退款、隐私政策和服务条款页面，使其从占位文案升级为 V1 可上线草稿。
  - 避免写死未确认的配送时效、免邮门槛、30 天退货、退货地址或具体法域承诺。
  - 在 replacement-parts 页面加入顾客联系表单，先收集订单和联系方式，具体缺件信息后续建联确认。
  - 根据页面截图优化页脚，移除不合适的产品分类入口、重复入口和指向同一页面的变体链接。
- 本次完成：
  - `components/ui/PolicyPage.tsx` 已从简单段落组件升级为支持简介、更新时间、分区标题、列表、提示块、CTA 和页面专属内容插槽的结构化政策页组件。
  - `app/policies/shipping-policy/page.tsx` 已重写为 DTC checkout 确认 + B2B 单独确认的灵活配送政策。
  - `app/support/replacement-parts/page.tsx` 已重写缺件 / 错件 / 破损件支持说明，并加入 `ReplacementPartsForm`。
  - 新增 `components/forms/ReplacementPartsForm.tsx`，收集姓名、邮箱、国家 / 地区、订单号、购买渠道；产品名、SKU、WhatsApp、问题类型为辅助信息。
  - `app/policies/refund-policy/page.tsx` 已补齐未发货、已发货、质量问题、B2B / custom order 的退货退款处理口径。
  - `app/policies/privacy-policy/page.tsx` 已改为全球基础版隐私政策，覆盖 Shopify checkout、询盘、客服、支持请求和基础网站数据。
  - `app/policies/terms-of-service/page.tsx` 已补齐网站使用、产品信息、checkout、B2B 合作和政策更新条款。
  - `components/product/ProductCatalog.tsx` 已软化 `$49+ Free Shipping` 和 `30-Day Returns`，改为 checkout/support 确认口径。
  - `app/api/inquiry/route.ts` 已在日志中记录 replacement request 的订单号、购买渠道、产品名和 SKU，便于当前 MVP 接收缺件补件表单信息。
  - `components/layout/Footer.tsx` 已优化页脚：移除 Shopify collection 驱动的 Shop 列，改为 Explore 主站入口；去掉重复和同页变体链接。
  - 当前页脚结构为：Explore（Home / Products / Blog / Contact）、Support（Replacement Parts / Shipping Policy / Returns & Refunds / Contact Support）、Company（About Us / Quality & Safety）、Partnership（Wholesale / Custom Solutions / Business Contact）。
- 验证结果：
  - 已通过：`git diff --check`。
  - 已通过：`pnpm lint`。
  - 已通过：`pnpm build`；其中一次普通 build 在 Shopify 请求阶段偶发 `fetch failed`，随后授权网络重跑通过。
  - 已通过本地 HTTP 验证：`/support/replacement-parts` 返回 `200 OK`。
  - 已通过 API 验证：`POST /api/inquiry` 使用 replacement payload 返回 `{"ok":true}`。
  - 已用 in-app browser 验证：replacement 页面表单字段、标题层级和页脚链接存在。
  - 已用 in-app browser 验证：页脚不再显示产品分类列，且重复链接已去除。
- 未完成事项：
  - 本轮代码尚未提交。
  - 缺件补件表单当前仍提交到通用 `/api/inquiry`，后续如果要真正运营，需要接入邮件、CRM、Shopify customer/order lookup 或工单系统。
  - 表单暂不要求用户填写具体缺件编号、照片或零件数量；这些信息按本轮决策在建联后再确认。
  - 页脚 Newsletter 仍是前端占位按钮，尚未接入订阅服务。
- 发现的问题：
  - 直接在页脚读取 Shopify collections 会导致出现 `Home page` 或产品分类等不适合主页脚的入口；已改为固定主站入口。
  - 页脚中 `Help Center` / `Replacement Parts`、`OEM / ODM` / `Custom Solutions`、`Distributor Inquiry` / `Wholesale` 等存在同页重复；已去重。
  - in-app browser 自动填写 email input 时出现插件侧 `setRangeText` 限制；页面渲染和 API 提交已通过 DOM、截图和 curl POST 补充验证。
- 下一次对话建议目标：
  - 新对话开始后先读取本文件。
  - 先复查当前未提交 diff，重点检查政策页文案、`ReplacementPartsForm` 表单字段、`/api/inquiry` 日志字段和页脚最终结构。
  - 如页面方向确认，执行一次最终浏览器视觉回归后提交本轮政策页 + 页脚优化改动。
  - 后续可继续处理真实 Shopify 商品详情页 Related Products，或规划 inquiry / replacement request 的真实邮件与工单接收方式。
- 备注：
  - 本次没有新增第三方依赖。
  - 本次没有修改 `.env.local`，没有暴露 Shopify token。
  - 前台页面文案保持英文；本交接记录按规则使用中文。

## 2026-05-12

### 今日工作收尾 / 对话交接：产品筛选客户端化与分类轮播拖拽优化

- 当前状态：
  - 已完成今天产品页筛选交互、产品页分类轮播、首页 Featured Categories 分类轮播的 UI/UX 优化。
  - 当前分支为 `codex-homepage-ui-v1`，准备将本轮代码和进度日志一起提交。
- 本次目标：
  - 打开本地 3000 端口供项目 owner 检查网站。
  - 根据浏览器反馈修复产品页筛选刷新整页的问题。
  - 优化产品页和首页分类轮播，让分类卡片可鼠标拖拽横向滚动，并保留左右按钮。
  - 收尾时更新项目交接日志并提交代码。
- 本次完成：
  - 已启动本地开发服务：`http://localhost:3000`。
  - 产品页筛选器已去除右侧数量显示。
  - 产品页 toolbar 已去除 Grid/List 两个视图切换按钮。
  - `/products` 筛选逻辑已从服务端预筛选改为 `ProductCatalog` 客户端状态筛选；点击价格、分类、件数和排序时只更新产品列表区域，并通过 `history.pushState` 保留 URL query，不再触发整页路由刷新。
  - 产品页顶部 `Shop by category` 分类轮播已支持鼠标左键按住拖拽横向滚动；拖拽时取消卡片误点击，左右按钮继续按页平滑滚动。
  - 首页 `Featured Categories` 已改为显示全部 Shopify collections，不再只显示前 6 个；使用同样的横向拖拽滚动方案，左右按钮只在 hover / focus 时出现。
  - 已禁用分类卡片和图片的原生拖拽，避免拖动时误触发链接或图片拖拽行为。
- 验证结果：
  - 已通过：`pnpm lint`。
  - 已通过：`git diff --check`。
  - 已通过：`pnpm build`；第一次普通 build 在 Shopify 请求阶段偶发 `fetch failed`，随后使用网络权限重跑通过。
  - 已用 in-app browser 验证：`/products` 筛选后 URL 更新为 query，右侧产品列表变更，页面不再整页刷新。
  - 已用 in-app browser 验证：首页 `Featured Categories`、左右按钮、`Technic`、`New Arrivals` 等分类入口存在。
- 未完成事项：
  - Shopify 后台部分 collection 仍缺真实英文简介和封面图；当前缺图分类继续显示 `Image pending`。
  - 产品详情页 Related Products 仍待改为真实 Shopify 推荐或同 collection 商品。
  - 本轮没有做完整移动端截图回归；只做了浏览器 DOM/交互验证和构建验证。
- 发现的问题：
  - 产品页原筛选使用 `Link href="/products?...`，会触发 Next 路由刷新和重新请求页面；已改为客户端状态更新。
  - 横向分类轮播如果保留 `snap` 和 `scroll-smooth`，鼠标拖拽会像按钮翻页一样不跟手；已在拖拽态改为自由滚动。
  - `pnpm build` 依赖 Shopify Storefront API，网络不稳定时会在静态生成阶段偶发失败；允许网络访问后重跑通过。
- 下一次对话建议目标：
  - 新对话开始后先读取本文件。
  - 继续处理真实 Shopify 商品详情页 Related Products，改为同 collection 商品或 Shopify 推荐。
  - 继续补齐 Shopify collection 内容质量：英文简介、封面图、产品归属和 handle 规范。
  - 做一轮移动端产品页和首页分类轮播视觉回归，重点看拖拽手感、按钮悬停显示、卡片宽度和文字换行。
- 备注：
  - 本次没有新增第三方依赖。
  - 本次没有修改 `.env.local`，没有暴露 Shopify token。
  - 前台页面文案保持英文；本交接记录按规则使用中文。

### 当前对话收尾 / 交接：Vercel Shopify 环境变量修复与线上验证

- 当前状态：
  - 已完成本轮 Vercel Preview 不调用 Shopify、线上显示 mock 产品的问题排查和修复。
  - 当前分支为 `codex-homepage-ui-v1`，代码已提交并推送到 `origin/codex-homepage-ui-v1`。
  - 最新代码提交：`b2ed0c3 fix: surface Shopify data source failures`。
- 本次目标：
  - 验证 Vercel 线上为何仍显示旧的临时分类和产品。
  - 找出今天早上 Shopify collections / 产品筛选改动后线上断开 Shopify 的真实原因。
  - 修复线上静默 fallback 到 mock 数据导致问题不明显的风险。
- 本次完成：
  - 已用浏览器确认 Vercel 旧部署 `/products` 显示 4 个 mock 产品，`/products/flowers` 返回 404。
  - 已对比早上修改前后代码，确认新增 GraphQL 字段本地可用，问题不是 Shopify 查询字段本身。
  - `lib/shopify.ts` 已新增 Shopify 数据源诊断日志，输出 env 是否存在、API version、是否 Vercel、当前数据源为 `shopify` / `fallback` / `error`，不输出 token。
  - 已调整 fallback 策略：本地开发仍允许 mock fallback；生产 / Vercel 缺 env 或 Shopify 请求失败时不再静默显示 mock，而是抛出可见错误。
  - 新增 `/products` 和 `/collections/[handle]` 的 route error boundary，用于提示 Shopify catalog / collection 数据不可用。
  - 已提交并推送：`b2ed0c3 fix: surface Shopify data source failures`。
  - 已打开 Vercel 项目 Environment Variables 页面，确认此前项目没有任何环境变量。
  - 已将本地 `.env.local` 中的 `SHOPIFY_STORE_DOMAIN`、`SHOPIFY_STOREFRONT_ACCESS_TOKEN`、`SHOPIFY_API_VERSION` 添加到 Vercel，范围为 `Production and Preview`，变量值未打印到聊天或提交中。
  - 已重新触发 Vercel 部署，新部署已恢复 Shopify 数据。
- 验证结果：
  - 已通过本地 Shopify smoke check：返回 `flowers` 和真实 collection。
  - 已通过：`pnpm lint`。
  - 已通过：`pnpm build`。
  - 本地 build 日志显示 `source: 'shopify'`，读取到 21 个产品、12 个 collections，并生成 `/products/flowers`。
  - 本地浏览器验证：`/products` 显示 21 个 Shopify 产品，`/products/flowers` 正常打开，`/collections/technic` 正常打开。
  - Vercel 失败日志确认根因：`hasStorefrontAccessToken: false`、`reason: 'env_missing'`。
  - Vercel 变量保存后重新部署，线上 `/products/flowers` 已返回 `HTTP/2 200`，Chrome 验证标题为 `Flowers | JIESTAR Toys`。
  - 线上 `/products` 不再出现 mock 产品 `Velocity Super Car Building Set`。
- 未完成事项：
  - 本次进度日志更新尚未提交；如需要保持日志同步到 GitHub，下次可单独提交本文档。
  - 仍需后续继续处理产品详情页 Related Products，避免真实 Shopify 商品详情页混入本地 mock related products。
  - Shopify 后台部分 collection 仍缺真实英文简介或封面图，需要继续补齐。
- 发现的问题：
  - Vercel 项目此前没有配置 Shopify 环境变量；旧代码静默 fallback 到 mock，掩盖了线上未连接 Shopify 的真实问题。
  - Vercel 环境变量修改后必须重新部署才会生效。
  - `SHOPIFY_API_VERSION` 即使未在 Vercel 配置也会因代码默认值显示为存在，因此排查时应重点看 `SHOPIFY_STORE_DOMAIN` 和 `SHOPIFY_STOREFRONT_ACCESS_TOKEN`。
- 下一次对话建议目标：
  - 新对话开始后先读取本文件。
  - 先确认 Vercel 最新 Preview 页面 `/products`、`/products/flowers`、`/collections/technic` 是否仍正常读取 Shopify。
  - 如线上稳定，继续处理真实 Shopify 商品详情页 Related Products，改为同 collection 商品或 Shopify 推荐。
  - 继续补齐 Shopify collection 内容质量：英文简介、封面图、产品归属和 handle 规范。
- 备注：
  - 本次没有新增第三方依赖。
  - 本次没有修改 `.env.local`，也没有将 Shopify token 提交到 GitHub。
  - Vercel 环境变量已由用户授权后填写，敏感值未在对话中明文输出。

### 当前对话收尾 / 交接：真实 Shopify collections、产品筛选与分类轮播优化

- 当前状态：
  - 已完成本轮 Shopify collection 数据映射、产品页 URL 筛选落地，以及 `/products` 分类轮播和筛选器交互修复。
  - 当前分支为 `codex-homepage-ui-v1`，存在未提交改动；本轮没有执行 git commit。
- 本次目标：
  - 将前端分类来源从 V1 本地占位分类逐步切到真实 Shopify collections。
  - 让 `/products` 的 category、price、pieces、sort 筛选参数真正生效并可通过 URL 保留状态。
  - 修复产品页顶部分类卡片多行展示、筛选后右侧信息框变形、筛选器折叠和类别列表过长问题。
- 本次完成：
  - `lib/shopify.ts` 已读取 Shopify product 所属 collections，并新增 collection 列表和按 handle 获取 collection 商品的数据函数。
  - `Product.category` 和 `Product.collectionHandle` 优先来自 Shopify collection；本地 collections / products 保留为开发 fallback。
  - `/collections/[handle]` 的静态参数、metadata、hero 和商品列表优先使用 Shopify collection 数据；缺图显示中性 `Image pending`，不再用旧 Unsplash 分类图冒充真实图片。
  - 首页 Featured Categories、Products 分类入口、Footer、Sitemap、About portfolio chips 等分类入口已改为优先读取 Shopify collections。
  - `/products` 已接收 URL `searchParams`，支持 `category`、`pieces`、`price`、`sort` 单选筛选和排序；筛选状态、数量和清除链接基于真实过滤结果显示。
  - 新增 `components/product/CategoryCarousel.tsx`，产品页顶部分类入口改为单行横向轮播，左右箭头可按页滚动。
  - 分类轮播箭头默认隐藏，hover 整个分类区域或键盘 focus 时显示；已修复外层 hover 导致所有分类卡标题和箭头同时变红的问题。
  - 筛选器 Price、Category、Piece Count 改为原生 `details/summary` 可展开收起；Category 模块内部最多显示约 10 项，超出后在模块内滚动。
  - 修复筛选后右侧 toolbar 和筛选状态提示框被左侧筛选栏高度拉伸的问题。
- 验证结果：
  - 已通过：`git diff --check`。
  - 已通过：`pnpm lint`。
  - 已通过：`pnpm build`。
  - 已通过本地 HTTP 验证：`http://127.0.0.1:3002/products` 返回 200。
  - 已通过本地 HTTP 验证：`http://127.0.0.1:3002/products?price=50-100&category=technic` 返回 200。
  - 项目 owner 已在 in-app browser 中指出并确认需要修复分类轮播 hover 作用域问题；代码已按该反馈修复。
- 未完成事项：
  - 本轮改动尚未提交。
  - Shopify 后台 collection 仍需要继续补齐真实英文简介和封面图；当前缺图 collection 前端显示 `Image pending`。
  - 当前 `pnpm build` 期间 Shopify Storefront API 可能偶发连接超时，但 fallback 后构建可完成。
  - 本轮 in-app browser 自动化连接两次超时，未完成自动截图级视觉验证；主要依赖用户当前浏览器观察、本地 HTTP 和构建验证。
  - 产品详情页 Related Products 仍待后续改为真实 Shopify 推荐或同 collection 商品。
- 发现的问题：
  - Tailwind 同名 `group` 嵌套会让外层 hover 触发内层卡片 hover 样式；已用 `group/carousel` 隔离轮播箭头 hover 作用域。
  - Shopify collection handle 是前端 URL 和筛选参数的关键约束；如后台 handle 与期望 URL 不一致，应优先在 Shopify 后台修正。
- 下一次对话建议目标：
  - 新对话开始后先读取本文件。
  - 先复查当前未提交 diff，重点检查 `lib/shopify.ts`、`app/products/page.tsx`、`components/product/ProductCatalog.tsx`、`components/product/CategoryCarousel.tsx`。
  - 在浏览器中继续验证 `/products`、`/products?price=50-100&category=technic`、一个真实 collection 页面和一个空/缺图 collection 页面。
  - 若视觉和数据方向确认，整理并提交本轮 Shopify collection + filter + 产品页 UI 改动。
- 备注：
  - 本次没有新增第三方依赖。
  - 本次没有修改 `.env.local`，没有暴露 Shopify token。
  - 前台页面文案仍保持英文；本交接记录按规则使用中文。

## 2026-05-11

### 今日工作收尾 / 对话交接：Shopify 产品规格元字段迁移

- 当前状态：
  - 已完成今天工作收尾记录。
  - 当前分支为 `codex-homepage-ui-v1`，已同步到 `origin/codex-homepage-ui-v1`。
  - 最新代码提交：`267353a feat: read product specs from Shopify metafields`，已推送到 GitHub。
- 本次目标：
  - 在 Shopify 后台建立并填写产品规格元字段。
  - 将产品详情页 Details / Product Specifications 的主要规格数据源从本地 Markdown 切换到 Shopify product metafields。
- 本次完成：
  - Shopify 后台已保留 5 个产品规格元字段：`specs.difficulty_level`、`specs.piece_count`、`specs.recommended_age`、`specs.finished_model_size`、`specs.package_size`。
  - 已将本地 Markdown 中可匹配的第一批 21 个 Shopify 商品规格写入 Shopify 后台。
  - `lib/shopify.ts` 已通过 Storefront API 读取上述 5 个 metafields。
  - 产品详情页 Details 板块已改为显示：SKU、Difficulty Level、Piece Count、Recommended Age、Finished Model Size、Package Size、Material、Shipping。
  - SKU 仍来自 Shopify variant SKU；Material 和 Shipping 作为固定值显示，不从 Shopify 元字段读取。
  - `Piece Count` 在 Shopify 后台存纯数字，前台显示时格式化为 `739 pcs` 形式。
- 验证结果：
  - 已通过：`git diff --check`。
  - 已通过：`pnpm lint`。
  - 已通过：`pnpm build`，build 需要访问 Shopify Storefront API，网络授权后通过。
  - 已通过本地请求验证 `/products/flowers` 的 Details 区域显示 `JJ9236`、`Intermediate`、`739 pcs`、`8+`、`Variable`、`28 × 22 × 6 cm`、`ABS plastic`、`Calculated at checkout.`。
  - 已确认 Shopify 产品元字段定义列表中 5 个规格字段均显示已关联 21 个产品；`specs.material` 和 `specs.shipping` 未恢复。
- 未完成事项：
  - 当前产品详情页 Related Products 仍使用本地 mock 产品，真实 Shopify 商品详情页下仍可能混入 mock related products。
  - Shopify collection/category 仍主要依赖现有 fallback，尚未完成真实 Shopify collections/tags/metafields 映射。
  - Release Date 目前不再显示在 Details 板块；如后续需要展示发布时间，应新增 Shopify 元字段或明确数据来源。
  - 还未完成完整移动端截图回归。
- 发现的问题：
  - in-app browser 对本地 `localhost` / `127.0.0.1` 页面跳转出现 `ERR_BLOCKED_BY_CLIENT`，本次改用本地 HTTP 请求验证渲染结果。
  - `pnpm build` 在无网络权限时可能因 Shopify 请求超时失败，需要允许网络访问后重跑。
- 下一次对话建议目标：
  - 新对话开始后先读取本文件。
  - 优先处理真实 Shopify 商品详情页 Related Products，改为真实 Shopify 商品推荐或同 collection 商品。
  - 继续规划 Shopify collections/tags/metafields 映射，让产品分类、筛选和详情规格完全由 Shopify 后台维护。
  - 做一轮移动端产品详情页视觉回归，重点检查 Details 卡片、图库缩略图、Description 详情图和 CTA 区域。
- 备注：
  - 本次没有新增第三方依赖。
  - 本次没有修改 `.env.local`，没有暴露 Shopify token。
  - Shopify 后台数据已被修改；代码提交已推送到 GitHub。

### 当前对话收尾 / 交接：产品展示与 Shopify checkout 改动复查并提交

- 当前状态：
  - 已完成本轮复查、验证和提交。
  - 当前分支为 `codex-homepage-ui-v1`，工作区干净。
  - 最新提交：`14a98ba feat: connect Shopify checkout and product media details`。
- 本次目标：
  - 按上次交接计划复查 Shopify checkout MVP、产品规格映射、产品图库、产品卡片图片展示和 Description 区域。
  - 确认没有无关依赖、敏感配置或 `.env.local` 混入提交。
  - 通过验证后提交当前批次改动。
- 本次完成：
  - 已复查 staged 范围，提交内容包括 `/api/checkout`、Shopify 商品图片/描述读取、产品详情图库、产品卡片 hover 第二张图、本地产品规格索引、第一批产品 Markdown 和图片素材、以及本进度日志。
  - 已确认 `.env.local`、`package.json`、`pnpm-lock.yaml` 没有进入 diff。
  - 已用本地开发服务复查 `/products`、`/products/flowers`、`/products/steam-train-1`、`/products/full-featured-crawler-excavator`。
  - 已验证 Flowers 产品缩略图点击可切换主图。
  - 已验证 `Buy Now` 能调用 `/api/checkout` 并跳转到 Shopify；最终进入 `https://jiestartoys.myshopify.com/password`，原因是 Shopify 店铺仍处于 password / opening soon 状态。
- 验证结果：
  - 已通过：`git diff --check`。
  - 已通过：`pnpm lint`。
  - 已通过：`pnpm build`，本次 build 生成 35 个 app route，并包含 `/api/checkout`。
  - 已确认 `/products/flowers` 显示 Shopify 价格、图库、`JJ9236`、`739 pcs` 和 Product Details 区域。
  - 已确认 `/products/steam-train-1` 在 Shopify SKU 缺失时仍可通过 handle fallback 显示 `1277 pcs` 等本地规格，SKU 显示为 `Contact for SKU`。
  - 已确认 `/products/full-featured-crawler-excavator` 显示 `57023` 和 `1246 pcs`。
- 未完成事项：
  - 还未关闭 Shopify storefront password，因此无法完成真实顾客视角的 checkout 最终页面验证。
  - 当前 Related Products 仍使用本地 mock 产品，真实 Shopify 商品详情页下仍可能混入 mock related products。
  - Shopify collection/category 仍统一落到 `new-arrivals`，尚未做真实 Shopify collections/tags/metafields 映射。
  - 产品规格仍来自本地 Markdown，不是 Shopify metafields；上线后如需后台维护规格，需要迁移到 Shopify metafields 或其他 CMS。
  - 本轮未完成完整移动端截图回归；只做了桌面截图、DOM 检查和响应式结构确认。
- 发现的问题：
  - Next dev 提示部分 Shopify 主图是 LCP 图片，后续可考虑给首屏主图补充更明确的 eager / priority 策略做性能微调。
  - in-app 浏览器本轮切换移动视口能力受限，移动端仍建议下次用实际浏览器或可用截图工具复查。
- 下一次对话建议目标：
  - 新对话开始后先读取本文件。
  - 优先处理真实 Shopify 商品详情页的 Related Products：改为真实 Shopify 商品推荐或同 collection 商品。
  - 规划 Shopify 数据结构映射：collections/tags/metafields 对应 category、piece count、age、尺寸、发布时间等字段。
  - 决定是否关闭 Shopify storefront password，以完成完整 checkout 可视化验证。
  - 可顺手处理产品首屏图 LCP 提示和移动端截图回归。
- 备注：
  - 本次没有新增第三方依赖。
  - 本次没有提交 `.env.local`，没有暴露 Shopify token。
  - 前台文案保持英文；本进度记录按规则使用中文。

### 当前对话收尾 / 交接：产品图片展示、详情页图库与描述区优化

- 当前状态：
  - 已完成本轮产品图片展示和产品详情页优化，尚未提交。
  - 当前分支仍有 Shopify checkout MVP、产品规格映射、产品图片图库和本次视觉修正相关未提交改动。
- 本次目标：
  - 优化首页、产品列表、集合页、相关产品和 About 产品预览中的产品图片比例。
  - 产品卡片 hover 时显示第二张商品图。
  - 产品详情页改为主图 + 缩略图图库，点击缩略图可切换主图。
  - 删除产品详情页主图下方 `Pieces` 和 `Age` 两个内容框。
  - 在 `Details / Product Specifications` 下方新增 `Product Details` 描述板块，渲染 Shopify 商品描述和详情图。
  - 修复用户反馈的缩略图点击无效、产品图裁切、图片留白和 Description 区域大空白问题。
- 本次完成：
  - `lib/data.ts` 产品类型已支持 `images` 和 `descriptionHtml`。
  - `lib/shopify.ts` 已从 Storefront API 读取 `descriptionHtml` 和 `images(first: 12)`，第一张图作为默认主图，多张图写入 `product.images`。
  - 新增 `components/product/ProductImageSwap.tsx`，产品卡片支持第二张图 hover 淡入；无第二张图时保持单图展示。
  - 首页 Featured Products、`/products` 产品列表、collection 商品卡片、Related Products、About 产品预览已接入统一产品图组件。
  - 新增 `components/product/ProductGallery.tsx`，产品详情页主图下方显示缩略图，缩略图按钮支持点击切换、选中状态和键盘 focus。
  - `app/products/[handle]/page.tsx` 已替换为图库组件，并移除主图下方两个信息框。
  - 产品详情页新增 `Description / Product Details` 板块，优先渲染 Shopify `descriptionHtml`，为空时回退到本地纯文本描述。
  - 按最新反馈调整图片展示逻辑：产品卡片和详情页主图保持 1:1 稳定容器，但图片使用 `object-contain`，非 1:1 图片允许适当留白，不裁剪图片。
  - 已修复缩略图点击不能切换的问题：缩略图图片不再拦截点击，主图切换时按图片地址重新渲染。
  - 已修复 Description 区域大空白问题：渲染 Shopify 描述 HTML 前清理空段落、空 div、`<br>` 和 `&nbsp;` 组成的空富文本块，避免详情图被空标签顶下去。
- 验证结果：
  - 已通过：`pnpm lint`。
  - 已通过：`pnpm build`。
  - 已在本地开发服务 `http://127.0.0.1:3003` 查看过产品详情页和产品卡片效果；后续如继续视觉微调，应优先复查 `/products/flowers`、`/products/steam-train-1`、`/products/full-featured-crawler-excavator`。
- 未完成事项：
  - 本次改动尚未提交。
  - 真实 Shopify 商品描述内容质量仍取决于 Shopify 后台维护；前端已支持详情图和描述 HTML 渲染，但后台空白、过多空段落或过大的详情图仍需要在 Shopify 侧规范录入。
  - 当前 Related Products 仍主要基于本地 mock 产品列表，后续建议改为真实 Shopify 商品推荐或同 collection 商品。
  - 还未做完整移动端截图回归；下次继续时建议重点检查产品卡片、详情图库缩略图横向滚动、Description 详情图宽度。
- 发现的问题：
  - Shopify 富文本描述里可能包含大量空 `<p><br></p>`、空 `<div>` 或 `&nbsp;`，直接渲染会在 Description 顶部产生大面积空白。
  - 产品图不是 1:1 时，强制 `object-cover` 会裁剪主体；当前已改回 `object-contain`，允许非 1:1 图片在 1:1 容器中自然留白。
  - 浏览器里看到的中文导航或按钮可能来自 Chrome 自动翻译，页面源文案仍以英文为主。
- 下一次对话建议目标：
  - 新对话开始后先读取本文件。
  - 优先视觉复查 `Description / Product Details` 区域是否已经去掉大空白；如 Shopify 后台仍有异常 HTML，再针对实际 HTML 做更精确清理。
  - 继续做移动端和桌面端的视觉回归，尤其是产品卡片图片、详情页图库、缩略图切换和详情图展示。
  - 如视觉方向确认，建议整理当前未提交 diff，决定是否将 Shopify checkout MVP、产品规格映射、产品图库和描述区优化合并为一次提交或拆分提交。
- 备注：
  - 本次没有新增第三方依赖。
  - 本次没有修改 Shopify 后台数据，也没有暴露 Shopify token。
  - 前台文案保持英文；本进度记录按规则使用中文。

### 当前对话收尾 / 交接：第一批测试产品资料整理与规格映射

- 当前状态：
  - 已完成本次小项，尚未提交。
  - 当前分支仍有之前 Shopify checkout MVP、页面调整和本次产品资料映射相关未提交改动。
- 本次目标：
  - 整理根目录临时产品资料文件夹 `2026.05.08jiestar第一批临时上架产品`。
  - 将每个产品图片和 Markdown 资料放到项目合适位置。
  - 将 Markdown 中的 SKU、颗粒数、建议年龄、发布日期、包装尺寸、成品尺寸等字段映射到产品详情页 `Product Specifications`。
- 本次完成：
  - 已将临时产品资料拆分整理到：
    - `public/images/products/first-batch-2026-05-08/`
    - `content/products/first-batch-2026-05-08/`
  - 已按英文 slug 规范整理分类和产品文件夹。
  - 已迁移 21 个产品 Markdown 和 243 个图片文件。
  - 已清理 `.DS_Store`，未带入新目录。
  - 已修正火车站 SKU：`Train Station.md` 从 `sku 53016` 改为 `sku 89140`。
  - 新增 `lib/product-specifications.ts`，用于递归读取本地产品 Markdown 并生成规格索引。
  - Shopify 商品映射已支持按 `SKU -> handle -> title` 顺序匹配本地 Markdown，避免 Shopify 未填 SKU 时规格无法显示。
  - 产品详情页 `Product Specifications` 已显示本地 Markdown 规格：SKU、Release Date、Piece Count、Recommended Age、Finished Model Size、Package Size、Material、Shipping。
  - 已按要求从产品规格展示中移除 `Series` 和 `Difficulty Level`；顶部摘要卡也移除了 `Difficulty`。
  - 对 `成品 --` 的产品，成品尺寸显示为 `Variable`。
  - 已修正 `Flowers.md` 的颗粒数：`2926 pcs` 改为 `739 pcs`。
  - 开发环境下已禁用本地 Markdown 规格索引缓存，方便修改 md 后刷新页面查看最新值。
- 验证结果：
  - 已通过：`pnpm lint`。
  - 已通过：`pnpm build`。
  - 已通过本地页面验证：`/products/flowers` 显示 `739 pcs`、`JJ9236`、`2026年04月`、`Variable`、`28 × 22 × 6 cm`。
  - 已通过本地页面验证：`/products/steam-train-1` 即使 Shopify SKU 缺失，也能通过 handle 匹配到本地 `Steam Train.md`，显示 `1277 pcs` 等规格。
  - 已通过本地页面验证：`/products/full-featured-crawler-excavator` 显示 `57023`、`1246 pcs`、`34 × 27.5 × 10 cm`、`47.2 × 18.3 × 30 cm`。
- 未完成事项：
  - 本次改动尚未提交。
  - 当前产品详情页 Related Products 仍使用本地 mock 数据。
  - 当前 Shopify collection/category 仍统一落到 `new-arrivals`，分类 URL 还没有真实 Shopify collection 映射。
  - 当前产品规格来源是本地 Markdown，不是 Shopify metafields；上线后修改 Markdown 仍需要提交并重新部署。
  - Chrome 当前开启了自动翻译，浏览器中看到的中文是 Chrome 翻译结果，页面源文案仍为英文。
- 发现的问题：
  - 最初只按 SKU 匹配会导致 Shopify 未填 SKU 的商品无法映射规格；现已增加 handle/title fallback。
  - 模块级缓存会导致开发环境修改 Markdown 后刷新不更新；现已在 development 环境禁用缓存。
  - 如果直接在浏览器看到 `多变的`，这是 Chrome 把 `Variable` 自动翻译成中文，不是前端英文文案变化。
- 下一次对话建议目标：
  - 新对话开始后先读取本文件。
  - 优先复查当前未提交 diff，确认是否要提交 Shopify checkout MVP + 产品规格映射。
  - 后续可继续处理真实 Shopify 商品图片、本地产品图片替换、Related Products 改为真实 Shopify 商品、collection/category 映射。
- 备注：
  - 本次没有新增第三方依赖。
  - 本次没有把产品规格写入 Shopify metafields，也没有修改 Shopify 后台数据。
  - 前台文案保持英文；本进度记录按规则使用中文。

### 今日工作收尾 / 对话交接：Shopify Headless 真实联调

- 当前状态：
  - Shopify Storefront API 与 checkout MVP 已完成真实联调。
  - 当前分支仍为 `codex-homepage-ui-v1`，存在未提交代码改动。
  - 本地 `.env.local` 已创建并被 Git 忽略，包含 Shopify Storefront API 所需配置；日志不记录 token 明文。
- 本次目标：
  - 安装并配置 Shopify Headless channel。
  - 获取 Storefront API token，并验证 Next.js 能读取真实 Shopify 产品。
  - 验证产品详情页 `Buy Now` 能通过 `/api/checkout` 创建 Shopify checkout URL。
- 本次完成：
  - 已在 Shopify 后台安装官方 Headless 应用。
  - 已创建 Headless storefront：`Jie Star Toys Headless`。
  - 已创建本地 `.env.local`，配置：
    - `NEXT_PUBLIC_SITE_URL=http://localhost:3000`
    - `SHOPIFY_STORE_DOMAIN=jiestartoys.myshopify.com`
    - `SHOPIFY_STOREFRONT_ACCESS_TOKEN`
    - `SHOPIFY_API_VERSION=2026-01`
  - 已确认 Storefront API 权限包含产品读取和 checkout 读写相关权限。
  - 已验证 `/products` 能显示真实 Shopify 商品。
  - 已验证真实 Shopify 商品详情页可访问，例如 `/products/flowers`。
  - 已验证真实商品 `Flowers` 显示 Shopify 数据：价格 `$99.99`、SKU `JJ9236`，并显示 `Secure Shopify checkout`。
  - 已验证 `/api/checkout` 使用真实 variant ID 可返回 Shopify checkout URL。
  - 已重新打开侧边浏览器到 `http://127.0.0.1:3002/products/flowers` 给项目 owner 查看。
- 验证结果：
  - 已通过：`pnpm lint`。
  - 已通过：`pnpm build`，并确认 build 加载 `.env.local`。
  - 已通过：`/products` 返回 200 并显示真实 Shopify 商品。
  - 已通过：`/products/flowers` 返回真实 Shopify 商品详情。
  - 已通过：`/api/checkout` 缺少 `variantId` 时返回 `Missing Shopify variant ID.`。
  - 已通过：真实 variant ID 创建 checkout，返回状态 200 且获得 Shopify checkout URL。
  - 浏览器端点击 `Buy Now` 已触发 Shopify 跳转，但最终进入 `jiestartoys.myshopify.com/password`。
- 未完成事项：
  - 当前 Shopify 店铺仍处于 password / opening soon 保护状态；真实顾客 checkout 前需在 Shopify 后台关闭 storefront password。
  - 当前产品详情页 Related Products 仍使用本地 mock 数据，真实 Shopify 商品详情页下会混入 mock related products。
  - 当前 Shopify 产品映射仍使用保守占位字段：`category`、`collectionHandle`、`pieceCount`、`recommendedAge`、尺寸、难度等尚未从 Shopify tags/metafields/collections 读取。
  - 当前 `/products` 的分类计数仍不准确，因为真实 Shopify 商品暂未映射到现有本地 collection handles。
  - 今天未提交代码。
- 发现的问题：
  - 旧测试 URL `/products/semi-submersible-drilling-platform` 当前已 404，原因是当前 Shopify 可用商品列表/handle 已变化；今天可用测试商品为 `/products/flowers`。
  - Storefront API 已能读取真实商品，但产品描述可能为空，详情页描述区域会显得空，需要后续补 Shopify 商品描述或前端 fallback。
  - 若后续打开 checkout 仍进入 password 页面，优先检查 Shopify storefront password，而不是前端 checkout 代码。
- 下一次对话建议目标：
  - 新对话开始后先读取本文件。
  - 优先修复真实 Shopify 商品详情页下的 Related Products：改为使用 Shopify 产品列表，而不是本地 mock 产品。
  - 规划 Shopify 数据结构映射：collections/tags/metafields 对应 category、piece count、age、尺寸、难度等字段。
  - 决定是否关闭 Shopify storefront password 以完成完整 checkout 可视化验证。
  - 若当前 MVP 方向确认，可先提交 Shopify checkout MVP 相关代码，但不要提交 `.env.local`。
- 备注：
  - 本次创建了 Shopify Dev Dashboard app `JIESTAR Global Website`，但实际用于当前网站联调的是官方 Headless channel 生成的 Storefront API token。
  - 结束当前对话前已停止本地 3002 服务。
  - 前台文案保持英文；本进度记录按规则使用中文。

## 2026-05-07

### 今日工作收尾 / 对话交接：核心页面收口复查并提交

- 当前状态：
  - 已完成，准备提交当前未提交改动。
  - 当前分支为 `codex-homepage-ui-v1`。
- 本次目标：
  - 复查当前批量页面收口改动。
  - 提交今天完成的页面、表单、logo、子品牌与交接日志更新。
  - 暂停 Shopify 接入，留到下一次对话继续。
- 本次完成：
  - 已复查 Wholesale 轻量留资逻辑、`InquiryForm` 必填字段、`/api/inquiry` 校验逻辑、核心页面 UI 改动、logo / favicon / 子品牌资源引用。
  - 已确认当前改动没有新增依赖，没有暴露 Shopify token、API key 或其他敏感信息。
  - 已确认新增组件 `SiteLogo`、`HeroBannerButton`、`SubBrandCarousel` 与 `lib/sub-brands.ts` 的资源路径可对应到实际图片文件。
  - 已提交前指出一个非阻塞 review finding：Wholesale 表单成功提示已经写成“会发送 catalog 和 pricing”，但当前 API 仍只是 console 留资，真实邮件 / CRM / Google Sheet / catalog 发送链路尚未接入。
- 验证结果：
  - 已通过：`git diff --check`。
  - 已通过：`pnpm lint`。
  - 已通过：`pnpm build`。
  - `pnpm build` 已成功生成 34 个 app route，包括首页、核心页面、3 篇 blog detail、8 个 collection、4 个 product detail、robots 和 sitemap。
- 未完成事项：
  - Shopify 正式 product data、variant、cart、checkout 明天再接入。
  - Inquiry 真实交付链路仍未接入：邮件通知、CRM、Google Sheet、WhatsApp 联系方式、自动回复或 wholesale catalog PDF 发送方式都还没有实现。
  - 如果短期公开预览给外部用户，建议先把 Wholesale 表单成功提示改成更保守的 “Inquiry received” 口径；如果只给内部预览，可保留当前文案并在接入真实交付链路时补齐。
  - 当前网站仍有大量远程占位图，后续需要替换为真实 JIESTAR 产品、工厂、质检、包装、展会和 B2B 合作素材。
- 发现的问题：
  - 当前 ProductActions 仍是 Shopify checkout preview，Add to Cart / Buy Now 不会创建真实 checkout。
  - `/api/inquiry` 当前只校验字段并输出到 server console，没有持久化和通知能力。
- 下一次对话建议目标：
  - 新对话开始后先读取本文件。
  - 优先进入 `Shopify product data and checkout MVP`：确认 `.env.local` 配置、Shopify Storefront API 可用性、product variant ID 映射、Buy Now / checkout 行为。
  - 同时决定 Wholesale 表单交付链路方案：邮件通知 / Google Sheet / CRM / WhatsApp / catalog PDF 自动发送。
- 备注：
  - 今天不继续 Shopify 接入。
  - 前台文案保持英文；本进度记录按规则使用中文。

### 子项目 / 小项：Wholesale 页面转化思路与专业感重整

- 当前状态：
  - 已完成，尚未提交。
  - 当前分支 `codex-homepage-ui-v1` 仍有多处未提交页面改动；本小项是在既有未提交 diff 基础上的追加收口。
- 本次目标：
  - 将 `/wholesale` 从“完整批发介绍页”调整为更清晰的低门槛 B2B 留资页。
  - 保留“提交邮箱后发送带批发价产品目录，再通过 WhatsApp / email / 社交媒体继续沟通”的转化逻辑。
  - 避免页面显得过于简单或不专业，把流程表达升级为标准化 B2B 接待、目录匹配、私域跟进和订单规划流程。
- 本次完成：
  - `/wholesale` hero 文案调整为 `Request Wholesale Price Catalog`，突出 retailers、distributors、ecommerce sellers、channel buyers 等批发买家。
  - 删除 Wholesale 页面中单独铺开的 `Product catalog / Wholesale product categories` 板块，不再把产品目录作为公开页面区域展示。
  - `Get Catalog` / `How It Works` 等 CTA 继续保留有效锚点，跳转到页面内说明或表单区域。
  - Wholesale 中部流程从 `A simple catalog-first wholesale path` 改为 `Wholesale Catalog & Pricing Workflow`。
  - 流程视觉从三张普通说明卡升级为左侧说明 + 私密报价提示 + 右侧四步 timeline：
    - `Inquiry Review`
    - `Catalog Matching`
    - `Private Follow-Up`
    - `Order Planning`
  - 深色 CTA 区改为更商务的私密报价说明：批发价在 inquiry review 后私下发送，MOQ、物流、包装、选品和订单规划后续沟通确认。
  - Wholesale 底部表单改为轻量留资模式：只强制 `Email`，`Name`、`Company`、`Country / Region`、`WhatsApp / Social Media`、`Interested Product Category`、`Message` 均为辅助字段。
  - `InquiryForm` 针对 `type="wholesale"` 显示独立标题、说明、提交按钮和成功提示；`custom` / `contact` 表单保持原有详细询盘逻辑。
  - `/api/inquiry` 针对 `type="wholesale"` 只校验 `email`；其他类型继续校验 `name`、`country`、`email`、`message`。
  - 首页 `Quality You Can Build On` 板块 CTA 位置按项目 owner 标注调整到板块右上方，避免按钮掉在图片下方显得孤立。
- 验证结果：
  - 已通过：`pnpm lint`。
  - 已通过：`pnpm build`。
  - 已通过本地 HTTP 验证：`/wholesale` 返回 200。
  - 已刷新 in-app browser 到 `http://localhost:3000/wholesale`。
  - API 已验证：Wholesale 只填 Email 返回 `{"ok":true}`。
  - API 已验证：Wholesale 不填 Email 返回 `Missing fields: email`。
  - API 已验证：Wholesale 填 Email + WhatsApp + Message 返回 `{"ok":true}`。
  - API 已验证：Custom / Contact 只填 Email 仍返回缺少 `name, country, message`，未放松原有校验。
  - API 已验证：Custom / Contact 填完整基础字段返回 `{"ok":true}`。
- 未完成事项：
  - 本次改动尚未提交。
  - Wholesale 页面仍使用远程占位背景图，后续需要替换为真实 JIESTAR 产品、仓储、发货、展会或 B2B 沟通素材。
  - 当前 inquiry 仍只是写入 API console，没有接入真实邮件发送、CRM、Google Sheet、飞书、WhatsApp 链接或自动回复。
  - 批发价目录目前只以页面文案表达“提交后发送”，尚未接入真实 PDF、邮件模板或目录附件流程。
  - 需要项目 owner 再用浏览器检查 `/wholesale` 桌面端和移动端，重点看新版 workflow 专业感、深色 CTA、底部轻量表单是否符合预期。
- 发现的问题：
  - 之前的流程区使用 `simple`、`Leave your email` 等表达，容易让页面显得不够专业；本次已改成 inquiry review / catalog matching 等 B2B 流程语言。
  - 之前单独展示产品分类目录会让 Wholesale 页面重复、冗长，也和“目录私下发送”的逻辑冲突；本次已删除。
  - 首页 Quality 板块按钮原先位置两次调整后，最终放到板块右上角更符合项目 owner 标注。
- 下一次对话建议目标：
  - 新对话开始后先读取本文件。
  - 优先复查当前未提交 diff，尤其是 `/wholesale`、`components/forms/InquiryForm.tsx`、`app/api/inquiry/route.ts`、首页 `QualitySafety` 组件。
  - 如果视觉和转化方向确认，建议执行一次最终 `git diff --check`、`pnpm lint`、`pnpm build`，然后由项目 owner 决定是否提交当前批量页面收口改动。
  - 后续可规划真实 inquiry 交付链路：邮件通知 / Google Sheet / CRM / WhatsApp 联系方式 / wholesale catalog PDF 发送方式。
- 备注：
  - 本次未新增依赖。
  - 本次未接入 Shopify、邮件服务或真实目录下载。
  - 前台文案保持英文；本进度记录按规则使用中文。

### 子项目 / 小项：核心页面视觉与转化路径收口

- 当前状态：
  - 已完成，尚未提交。
  - 当前分支 `codex-homepage-ui-v1` 仍有多处未提交页面改动。
- 本次目标：
  - 收口 Products、Product Detail、Collections、Contact、Quality & Safety 等核心页面体验。
  - 统一核心入口页 hero 按钮样式。
  - 补齐首页 Wholesale Partnership 板块到 `/wholesale` 的转化入口。
- 本次完成：
  - `/products` 新增 `Shop by Category` 全部分类入口，8 个 collection 页面都可从产品总页进入。
  - `/products` 侧边栏分类恢复为 preview checkbox filter，不再跳转 collection 页面。
  - `/products/[handle]` 优化 DTC preview 购买区、产品规格、B2B cooperation 入口和相关产品区。
  - `/collections/[handle]` 优化为更完整的分类落地页，和新版产品目录卡片风格保持一致。
  - `/contact` 优化为 DTC / Wholesale / Custom Solutions / Customer Support 更清楚的联系入口页。
  - `InquiryForm` 增强必填字段标识、成功状态和错误状态说明。
  - `/quality-safety` 从基础卡片页升级为完整质量信任页，新增 hero、质量流程、DTC 支持、B2B 质量沟通和合规说明。
  - 多轮优化 `/quality-safety` hero 右侧信息框、workflow 卡片背景图、DTC / B2B 双栏协调性和 B2B 内容密度。
  - 新增 `components/ui/HeroBannerButton.tsx`，并将 `/blog`、`/wholesale`、`/custom-solutions`、`/about` 的 hero 按钮统一到同一视觉样式。
  - 首页 `Featured Categories` 的右侧链接文案从 `View all categories` 调整为 `Shop all products`。
  - 首页 `Wholesale Partnership` 板块新增 `Wholesale Cooperation` 按钮，跳转 `/wholesale`；同时保留 `Custom Solutions` 次入口。
- 验证结果：
  - 已通过：`pnpm lint`。
  - 已通过：`pnpm build`。
  - 已通过：`git diff --check`。
  - 已通过本地 HTTP 验证：`/`、`/products`、`/products/velocity-super-car`、`/collections/super-cars`、`/contact`、`/quality-safety` 返回 200。
  - 已通过 8 个 collection URL 的本地 HTTP 200 检查。
  - 已确认 `/api/inquiry` 有效请求返回 `{"ok":true}`，缺少必填字段时返回 400。
- 未完成事项：
  - 当前改动尚未提交，后续需要项目 owner 决定是否继续追加到 draft PR #1 或单独提交。
  - Shopify 正式 product data、variant、cart、checkout 尚未接入，产品购买按钮仍处于 preview / mock 阶段。
  - Products 侧边栏 filter、排序、分页、列表视图仍为 preview/static UI。
  - 当前页面仍大量使用 mock 数据和远程占位图，后续需要替换真实 JIESTAR 产品图、工厂图、质检图、团队图和合作素材。
  - GitHub CLI token 之前显示失效，如需 Codex 操作 PR，可能需要重新执行 `gh auth login -h github.com`。
- 发现的问题：
  - 主页 `Wholesale Partnership` 板块原先缺少直接进入 `/wholesale` 的 CTA，本次已补充。
  - `/quality-safety` 初版 hero 信息框和 B2B 内容卡片显得过大或空，本次已压缩和补充说明。
  - 当前仍不应展示 ISO、EN71、ASTM、CE、CPC 等未经验证的认证声明。
- 下一次对话建议目标：
  - 新对话开始后先读取本文件。
  - 优先复查当前未提交 diff，确认是否需要继续微调或提交。
  - 如页面方向确认，可进入 `Shopify product data and checkout MVP`：先接真实 Shopify product data、variant ID、Buy Now / checkout。
  - 在 Shopify 接入前，确认 `.env.example` 是否完整记录 Storefront API 所需变量。
- 备注：
  - 本次未新增依赖，未修改 Header/Footer，未改 Shopify API 基础结构。
  - 前台文案保持英文；本进度记录按规则使用中文。

### 子项目 / 小项：Logo 替换与首页/Wholesale 细节收尾

- 当前状态：
  - 已完成，尚未提交。
  - 当前分支 `codex-homepage-ui-v1` 仍保留多处未提交页面改动；本小项是在这些未提交改动基础上的追加微调。
- 本次目标：
  - 将项目中使用到的 JIESTAR 主 logo 替换为项目 owner 提供的彩色 logo 图。
  - 调整 Header logo 尺寸，使导航栏品牌识别更明显。
  - 修复首页 `Quality You Can Build On` 板块移动端卡片过高问题，同时避免影响桌面端布局。
  - 统一 Wholesale 页面 `Catalog inquiry first` 深色 CTA 区按钮 hover 样式。
- 本次完成：
  - 新增 `public/images/brand/jiestar-logo-color.png`，由原始 logo 压缩为 512px 网页版本。
  - 新增 `components/layout/SiteLogo.tsx`，统一渲染 JIESTAR 主 logo。
  - 替换 Header、Footer、首页 Brand Story 图片角标中的旧手写 `JIE / STAR` logo。
  - 将 `app/favicon.ico` 替换为同一 logo 的 256px favicon 版本。
  - Header logo 从 `size-12` 调整为 `size-16`。
  - 首页 `QualitySafety` 组件移动端质量卡片改为横向信息行：左侧图标、右侧标题和说明；桌面端保持两列卡片、左上角图标布局。
  - Wholesale 页面 `Catalog inquiry first` 区块按钮改为复用 `HeroBannerButton`，与 banner 按钮 hover 样式一致。
- 验证结果：
  - 已通过：`pnpm lint`。
  - 已通过：`pnpm build`。
  - 已通过：`git diff --check`。
  - 已确认本地 logo 资源 `http://localhost:3000/images/brand/jiestar-logo-color.png` 返回 200。
  - 已确认首页 HTML 中输出了新的 `JIESTAR logo` 图片引用。
- 未完成事项：
  - 本次改动尚未提交。
  - 尚未用真实浏览器截图最终复核所有断点；项目 owner 已通过截图指出并确认了部分视觉问题，后续如继续收尾建议再完整检查首页和 Wholesale 页面桌面/移动端。
  - 当前网站仍有大量 mock/远程素材图，后续需要替换真实 JIESTAR 产品、工厂、质检、合作素材。
- 发现的问题：
  - 第一次将质量卡片改为移动端横向布局时，桌面端图标被居中；已通过把图标容器调整为 `inline-flex` 修复。
  - Header logo 使用真实图片后初始尺寸偏小；已调大。
  - Wholesale 底部 CTA 原先使用 `LinkButton`，与 hero/banner 按钮 hover 不一致；已统一为 `HeroBannerButton`。
- 下一次对话建议目标：
  - 新对话开始后先读取本文件。
  - 优先复查当前未提交 diff，确认是否提交或继续视觉微调。
  - 建议用浏览器分别检查 `/` 和 `/wholesale` 的桌面端、移动端：Header logo、首页 Quality 板块、Wholesale hero 和 `Catalog inquiry first` 按钮 hover。
  - 页面视觉方向确认后，可继续进入 Shopify product data / cart / checkout MVP。
- 备注：
  - 本次未新增依赖，未修改 Shopify API、表单 API 或环境变量。
  - 前台文案保持现状；本进度记录使用中文。

## 2026-05-05

### 子项目 / 小项：核心入口页 banner 按钮样式与文案统一

- 当前状态：
  - 已完成，尚未提交。
  - `/blog`、`/wholesale`、`/custom-solutions`、`/about` 四个页面 hero / banner 大图中的按钮样式已统一。
- 本次目标：
  - 将 Wholesale、Custom Solutions、About、Blog 页面 banner 按钮统一为 Blog 当前视觉样式。
  - 统一按钮 hover 状态。
  - 缩短按钮英文文案，减少桌面端和移动端按钮文字过长的问题。
- 本次完成：
  - 新增 `components/ui/HeroBannerButton.tsx`，专用于深色 hero / banner 区域按钮。
  - 将四个页面 banner 按钮统一为相同主按钮和次按钮样式。
  - 主按钮 hover 统一为红底白字；次按钮 hover 统一为白色描边增强和浅色半透明背景。
  - 优化按钮文案：
    - Blog：`Latest Articles`、`Start Project`
    - Wholesale：`Send Inquiry`、`Get Catalog`、`View Products`
    - Custom Solutions：`Start Project`、`Partner Inquiry`、`Wholesale`
    - About：`View Products`、`Contact Us`
- 验证结果：
  - 已通过：`pnpm lint`。
  - 已通过：`pnpm build`。
  - 已通过：`git diff --check`。
- 未完成事项：
  - 本次未做浏览器截图复核；如项目 owner 继续微调视觉，可在下次对话打开四个页面确认按钮长度、换行和 hover 效果。
  - 当前改动尚未提交。
- 发现的问题：
  - `docs/09-daily-progress-log.md` 在本次开始前已有未提交改动；本次只追加交接记录，没有清理或重写旧记录。
- 下一次对话建议目标：
  - 新对话开始后先读取本文件。
  - 如继续视觉收尾，建议用浏览器依次检查 `/blog`、`/wholesale`、`/custom-solutions`、`/about` 桌面端和移动端首屏。
  - 后续可继续检查 Product Detail / Collections / Contact 页面视觉与交互体验，或开始规划 Shopify product data / cart / checkout 接入。
- 备注：
  - 本次未新增依赖，未修改 Shopify 集成、表单 API、Header/Footer 或全局样式。

### 今日工作收尾 / 对话交接

- 当前状态：
  - About 页面品牌信任页优化已完成。
  - 页面已通过项目 owner 在浏览器中的人工审核。
  - 代码已提交并推送到 GitHub 分支 `codex-homepage-ui-v1`。
- 本次完成：
  - 重新连接本地 dev server，供项目 owner 审核 `http://localhost:3000/about`。
  - 修复 About hero 远程背景图 404 导致的首屏破图问题。
  - 优化底部 `Next step` CTA 与 Footer 的视觉关系，避免深色区块连在一起。
  - 修复 `Contact Us`、`View Products`、`Custom Solutions` 三个 CTA 按钮在桌面端断成双行的问题。
  - 更新 About 页面交接记录。
- 验证结果：
  - 已通过：`git diff --check`。
  - 已通过：`pnpm lint`。
  - 已通过：`pnpm build`。
  - 已通过本地 HTTP 验证：`/about` 返回 200。
  - 已通过 in-app browser 视觉检查：首屏、移动端滚动、底部 CTA 与 Footer 过渡、CTA 按钮换行。
  - 已确认浏览器 console 无 error。
  - Git 提交已完成：`e6f3af0 feat: polish about brand page`。
  - 分支已推送：`codex-homepage-ui-v1`。
- 未完成事项：
  - About 页面仍使用远程占位图；后续需要替换为真实 JIESTAR 产品图、工厂图、团队图、办公图、证书/检测报告图。
  - GitHub CLI `gh auth status` 仍显示 token 失效；如需后续用 Codex 创建或更新 PR，需要重新执行 `gh auth login -h github.com`。
  - Shopify 正式 product data、cart、checkout、variant ID 仍未接入。
- 发现的问题：
  - About 页面质量文档模块当前是占位说明，不代表正式认证展示。
  - 当前 PR #1 仍为 draft，后续需要项目 owner 在 GitHub 上 review 后决定是否继续追加、mark ready 或 merge。
- 下一次对话建议目标：
  - 新对话开始后先读取本文件。
  - 优先继续检查 Product Detail / Collections / Contact 页面视觉与交互体验。
  - 如果页面视觉方向确认，可开始规划 Shopify product data / cart / checkout 接入。
- 备注：
  - About 页面代码提交后工作区曾为干净状态；本条进度日志为“结束今天的工作”触发的收工更新，尚未单独提交。

### 子项目 / 小项：Blog 页面与核心入口页 hero 统一优化

- 当前状态：
  - 已完成，并已提交推送到 GitHub 分支 `codex-homepage-ui-v1`。
  - `/blog` 页面已从基础文章列表升级为品牌知识中心样式。
  - `/blog`、`/wholesale`、`/custom-solutions`、`/about` 首屏 hero 已统一为深色背景、隐约背景图和半透明信息卡风格。
- 本次目标：
  - 使用 `frontend-ui-ux-pro` 优化 Blog 页面视觉体验。
  - 统一 Blog、Wholesale、Custom Solutions、About 四个内容/合作入口页的 hero 风格。
  - 缩短过长的 hero 标题，降低首屏文字压迫感。
  - 修正 `/blog` 移动端 DTC / B2B / OEM / ODM 信息卡过大问题。
- 本次完成：
  - `/blog` 新增深色图像 hero、面包屑、短标题 `Building Guides & Business Insights`、精选文章、topic chips、文章卡片和底部 B2B 转化 CTA。
  - `/blog` hero 中 DTC / B2B / OEM / ODM 信息区经过多版移动端调整，最终保留为三条紧凑横向信息条，不使用横向滑动卡片。
  - `/wholesale` hero 标题改为 `Factory-Direct Wholesale Supply`，并新增深色背景图遮罩。
  - `/custom-solutions` hero 标题改为 `Custom Building Block Solutions`，并新增深色背景图遮罩。
  - `/about` hero 标题改为 `Global Brand & Product Partner`，保留既有深色背景图和半透明品牌信息卡。
  - 本次没有新增依赖，没有修改 Shopify 集成、表单 API、Header/Footer 或全局样式。
- 验证结果：
  - 已通过：`pnpm lint`。
  - 已通过：`pnpm build`。
  - 已通过：`git diff --check`。
  - 已通过本地 HTTP 验证：`/blog`、`/about`、`/wholesale`、`/custom-solutions` 返回 200。
  - 已使用移动端截图检查 `/blog` 390px 宽度布局，确认信息卡不再大面积占屏或裁切文案。
  - Git 提交已完成：`ab2cd4c feat: polish content page hero sections`。
  - Git 提交已完成：`0a4e28b fix: compact blog hero cards on mobile`。
  - 分支已推送：`codex-homepage-ui-v1`。
- 未完成事项：
  - Blog、Wholesale、Custom Solutions、About 当前仍使用远程占位图；后续应替换为真实 JIESTAR 产品、工厂、样品、合作、办公或品牌素材。
  - Blog 文章数量仍较少，后续需要继续补 SEO 内容，覆盖 building blocks、wholesale、OEM / ODM、custom building blocks 等关键词方向。
  - Shopify 正式 product data、cart、checkout、variant ID 仍未接入。
- 发现的问题：
  - 移动端信息卡如果做三列固定布局会挤压并裁切 `OEM / ODM`；最终改成三条紧凑横向信息条更稳。
  - 当前 `docs/09-daily-progress-log.md` 是本次“结束当前对话”触发的交接更新，尚未单独提交。
- 下一次对话建议目标：
  - 新对话开始后先读取本文件。
  - 优先继续检查 Product Detail / Collections / Contact 页面视觉与交互体验。
  - 如果继续做内容页，可检查 Blog detail 页面排版、Markdown 渲染层级、文章内 CTA 和相关文章入口。
  - 如视觉方向确认，可开始规划 Shopify product data / cart / checkout 接入。
- 备注：
  - 本次页面代码已经提交并推送，进度日志更新不包含在上述 Git 提交中。

## 2026-05-04

### 当前项目状态快照

- 当前阶段：Version 1 页面基础设计和产品相关页面验证阶段。
- 已完成基础页面范围：Home、About、Products、Product Detail、Collections、Wholesale、Custom Solutions、Quality & Safety、Blog、Blog Detail、Contact、Policy pages、Replacement Parts、robots、sitemap。
- 当前重点：继续检查和优化 Products、Product Detail、Collections、Contact 等核心页面体验，并准备后续 Shopify product data / cart / checkout 接入规划。
- 当前边界：Shopify 正式产品、购物车和 checkout 尚未接入，产品购买按钮仍处于 preview/mock 数据阶段。
- 下一个对话开始时应优先确认：是否继续进行 Product Detail / Collections / Contact 页面视觉与交互检查，或先处理 Shopify product data / cart / checkout 接入规划。

### 子项目 / 小项：核心页面功能验证与产品页检查

- 当前状态：进行中。
- 本次目标：
  - 验证网站核心页面的基本功能。
  - 检查 Products、Product Detail、Collections、Wholesale、Custom Solutions、Contact 等页面体验。
  - 初步判断产品相关页面是否符合 premium、clean、international 的品牌方向。
  - 确认当前 preview/mock 产品数据阶段下，Shopify 接入前的功能边界是否表达清楚。
- 本次完成：
  - 创建进度记录文档，采用单文件持续追加模式。
  - 梳理需要验证的页面和功能范围。
  - 运行项目技术检查：`pnpm lint` 和 `pnpm build` 均通过。
  - 使用本地 dev server 快速验证代表性页面和 inquiry API。
- 验证结果：
  - 已通过构建验证：Home、About、Products、Product Detail、Collections、Wholesale、Custom Solutions、Quality & Safety、Blog、Blog Detail、Contact、Policy pages、Replacement Parts、robots、sitemap。
  - 已通过本地 HTTP 验证：`/products`、`/products/velocity-super-car`、`/collections/super-cars`、`/wholesale`、`/custom-solutions`、`/contact`、`/blog/oem-vs-odm-building-blocks`、`/policies/shipping-policy` 均返回 200。
  - 已确认：Products 页面、Product Detail 示例页面 `/products/velocity-super-car`、Collections 示例页面 `/collections/super-cars` 可访问。
  - 已确认：`pnpm build` 可成功生成 4 个产品详情静态页面和 8 个 collection 静态页面。
  - 已确认：`/api/inquiry` 有效请求返回 `{"ok":true}`。
  - 已确认：`/api/inquiry` 缺少必填字段时返回 400，并提示 `Missing fields: country, email, message`。
  - 已通过：`pnpm lint`。
  - 已通过：`pnpm build`。
- 未完成事项：
  - 待浏览器视觉检查：产品列表、产品卡片链接点击体验、产品详情首屏、规格信息、B2B 联系入口。
  - 待浏览器交互检查：Add to Cart / Buy Now 是否清楚表现为 Shopify preview 状态。
  - 待浏览器交互检查：Wholesale、Custom Solutions、Contact 页面表单字段、成功状态和错误状态的页面表现。
- 发现的问题：
  - 当前尚未完成完整浏览器视觉检查和移动端检查。
  - 当前 Shopify 正式产品、购物车和 checkout 尚未接入，产品购买按钮仍处于 preview/mock 数据阶段。
  - 需要继续检查产品页是否有廉价商城感、文字拥挤、按钮层级不清、移动端溢出等设计问题。
- 下一次对话建议目标：
  - 根据验证结果修复页面功能和设计问题。
  - 继续优化 Products 和 Product Detail 页面设计。
  - 检查产品页是否需要更清楚地区分 DTC 购买路径和 B2B inquiry 入口。
  - 为后续 Shopify 产品数据、variant ID、cart、checkout 接入做准备。
- 备注：
  - 2026-05-03 已完成页面基础设计。
  - 当前阶段不新增复杂 ecommerce backend。
  - Shopify 应继续作为 products、cart、checkout、orders、payments 的后端。

### 子项目 / 小项：进度日志与对话交接规则更新

- 当前状态：已完成。
- 本次目标：
  - 将进度日志从“每日工作记录”升级为“项目持续进度记忆 + 当前对话交接日志”。
  - 同步更新 `AGENTS.md` 和 `CLAUDE.md`，让 Codex 与 Claude Code 使用一致规则。
- 本次完成：
  - 已将 `docs/09-daily-progress-log.md` 标题和说明更新为“项目持续进度记忆 + 当前对话交接日志”。
  - 已新增推荐小项记录模板。
  - 已将现有 2026-05-04 内容整理出“当前项目状态快照”和“小项进度”结构，并保留原始每日记录归档。
  - 已同步更新 `AGENTS.md` 和 `CLAUDE.md` 的进度日志工作流。
- 验证结果：
  - 已确认三个文件都包含“结束当前对话 / 结束这个小项 / 结束今天的工作”触发规则。
  - 已确认三个文件都要求新对话开始相关项目工作前先读取 `docs/09-daily-progress-log.md`。
- 未完成事项：
  - 无。
- 发现的问题：
  - 无。
- 下一次对话建议目标：
  - 新对话开始时先读取本文件，确认当前项目状态和本次准备处理的小项。
- 备注：
  - 用户要求：完成一个小项并说“结束当前对话”时，更新本文件；下一个对话开始时调用本文件。

### 子项目 / 小项：Products 总产品页 UI 重设计

- 当前状态：已完成。
- 本次目标：
  - 根据参考图重新设计 `/products` 总产品页主体区域。
  - 保持全站 Header 不变，只优化产品目录正文。
  - 让产品列表更接近 premium、clean、international 的 JIESTAR 商品目录页。
- 本次完成：
  - 新增 Products 页面专用目录组件 `components/product/ProductCatalog.tsx`。
  - 新增 Products 页面专用商品卡片 `components/product/CatalogProductCard.tsx`，避免影响首页、集合页和产品详情页现有 `ProductGrid`。
  - `/products` 已改为使用新的目录 UI。
  - 新增面包屑、页面标题、免运费提示、桌面端筛选栏、排序/视图工具条、分页样式、移动端筛选/排序入口、Load More 按钮和底部信任条。
  - 产品图片区域已改为稳定 1:1 正方形，使用居中裁剪显示，卡片信息区间距已收紧。
  - 筛选按钮已改为 `Preview Filters`，并增加说明：当前筛选控件为视觉占位，需等 Shopify product filters 接入后启用真实功能。
  - 补充了目录 UI 需要的基础图标。
- 验证结果：
  - 已通过：`pnpm lint`。
  - 已通过：`pnpm build`。
  - 已在 in-app browser 刷新检查 `http://localhost:3000/products`，移动端双列卡片可读，图片已按正方形裁剪，标题、价格和按钮未见明显重叠。
- 未完成事项：
  - 筛选、排序、分页、网格/列表切换仍是前端静态 UI，暂未实现真实交互。
  - Add to Cart 仍链接到产品详情页，正式购物车和 checkout 需等 Shopify variant/cart 接入后实现。
  - 当前产品图片仍使用 mock/Shopify 返回图片；后续需要替换为真实 JIESTAR 产品图，避免 Unsplash 图片造成产品识别偏差。
- 发现的问题：
  - 当前 Shopify 映射中 `category`、`pieceCount` 等字段仍可能是占位值；真实筛选需要 Shopify collections、tags 或 metafields 提供结构化数据。
  - 图片使用 1:1 `object-cover` 后视觉更统一，但 mock 照片可能会裁掉部分背景；正式产品白底图或产品渲染图会更适合当前卡片样式。
- 下一次对话建议目标：
  - 优先继续检查 Products 桌面端完整首屏和移动端滚动体验，微调卡片尺寸、筛选栏高度、底部信任条。
  - 决定是否先做本地前端筛选，或直接规划 Shopify filters / metafields 数据结构。
  - 继续检查 Product Detail 页面是否需要与新版总产品页的卡片风格统一。
- 备注：
  - 当前工作区已有未提交改动，本次没有执行 commit。
  - 后续真实筛选建议使用 URL 参数驱动，正式数据来源优先考虑 Shopify collection、tags、price range 和 product metafields。

### 子项目 / 小项：首页 UI 优化与 GitHub 提交

- 当前状态：已完成。
- 本次目标：
  - 优化 Home 页面视觉表现，重点处理 Featured Categories、Featured Products、Hero banner、Wholesale Partnership、Quality Safety、Final CTA 和移动端布局。
  - 检查当前代码状态并提交到 GitHub。
- 本次完成：
  - 首页 Hero 移动端大图已改为 framed product showcase panel，按钮后直接展示产品大图，视觉层级更接近参考图。
  - Featured Categories 移动端改为更小的横向滑动卡片，隐藏滚动条，提升同屏信息密度。
  - Featured Products 移动端改为横向滑动商品卡片，并比分类卡片稍大，保持 1:1 图片比例。
  - Wholesale Partnership 流程卡片已垂直居中，移动端改为横向滑动。
  - Quality You Can Build On 增加图片视觉区，避免页面过素。
  - Final CTA 的 Partner With Us 按钮已改为红底白字白边，hover 为白底红字白边。
  - Products 总产品页新版目录 UI、首页 UI 优化、进度日志和 AI 规则更新已提交并推送。
  - 已创建 draft PR：`https://github.com/JIESTARTOYS/jiestar-global-website/pull/1`。
- 验证结果：
  - 已通过：`pnpm lint`。
  - 已通过：`pnpm build`。
  - 已在 in-app browser 检查 `http://localhost:3000/` 的移动端 Hero、分类、商品卡片和 CTA 关键区域。
  - Git 提交已完成：`ebc755d feat: polish homepage and product catalog UI`。
  - 分支已推送：`codex-homepage-ui-v1`。
- 未完成事项：
  - 当前 PR 仍为 draft，后续需要项目 owner 在 GitHub 上 review 后决定是否 mark ready / merge。
  - 首页和产品页仍使用 mock/远程素材图，后续应替换为真实 JIESTAR 产品图、工厂图、质检图和合作图。
  - Shopify 正式产品、cart、checkout、variant ID 仍未接入。
- 发现的问题：
  - Codex 进程无法直接读取用户终端中的 macOS keyring gh token，因此 PR 是由用户在本机终端用 `gh pr create --draft --fill --head codex-homepage-ui-v1` 创建。
  - 当前产品筛选、排序、分页、Add to Cart 仍属于 preview/static UI。
- 下一次对话建议目标：
  - 从 GitHub PR #1 开始 review 当前首页和 Products 页面改动。
  - 优先检查桌面端完整页面视觉、移动端真实滚动体验，以及是否需要继续替换 mock 图片。
  - 如果视觉方向确认，可以进入 Shopify product data / cart / checkout 接入规划。
- 备注：
  - 结束当前对话时已按规则更新本进度日志。

### 子项目 / 小项：Wholesale 与 Custom Solutions 页面初步优化

- 当前状态：已完成。
- 本次目标：
  - 使用 `frontend-ui-ux-pro` 初步优化 `/wholesale` 页面，让它更像 premium、clean、international 的 B2B wholesale 转化页。
  - 使用 `frontend-ui-ux-pro` 初步优化 `/custom-solutions` 页面，突出 OEM / ODM、产品共创、独家 SKU、长期产品线规划和子品牌合作。
  - 将 iBlock、小角度、Xbert 三个子品牌 logo 放入项目资产目录，并在 Custom Solutions 页面作为子品牌合作案例展示。
- 本次完成：
  - `/wholesale` 已从基础信息页升级为完整的 B2B wholesale 页面，新增 hero summary panel、buyer fit、wholesale advantages、product catalog CTA、cooperation process、catalog inquiry CTA、FAQ 和表单填写提示。
  - `/custom-solutions` 已从基础能力介绍页升级为更完整的 custom cooperation 页面，新增 hero summary panel、能力图标卡、子品牌合作案例、优化后的合作流程、FAQ 和表单填写提示。
  - 新增 `public/images/sub-brands/`，并保存三张子品牌 logo：`iblock-logo.png`、`xiaojiaodu-logo.png`、`zhuanyue-xbert-logo.png`。
  - 将两张较大的透明 logo 缩到 512px 长边，降低静态资源体积。
  - Custom Solutions 子品牌案例移动端改为横向滑动卡片，并隐藏移动端横向滚动条。
  - 将第三个子品牌展示名从 `Zhuanyue Xbert` 调整为 `Xbert`。
  - 已提交并推送到 GitHub 分支 `codex-homepage-ui-v1`。
- 验证结果：
  - 已通过：`pnpm lint`。
  - 已通过：`pnpm build`。
  - 已通过：`git diff --check`。
  - 已在 in-app browser 检查 `/wholesale` 移动端首屏、catalog/form 锚点、FAQ 和表单区。
  - 已在 in-app browser 检查 `/custom-solutions` 移动端首屏、子品牌 logo 横滑模块、`#project-form` 锚点和 console 日志。
  - 已确认三张本地 logo URL 返回 200。
  - 已确认 `/api/inquiry` 对 wholesale/custom 测试请求返回 `{"ok":true}`。
  - Git 提交已完成：`8a9a2d0 feat: polish b2b cooperation pages`。
  - 分支已推送：`codex-homepage-ui-v1`。
- 未完成事项：
  - 当前 draft PR #1 需要项目 owner 在 GitHub 上 review 后决定是否继续追加、mark ready 或 merge。
  - `gh auth status` 显示 GitHub CLI token 已失效，Codex 无法直接创建或更新 PR；如需后续 PR 操作，需要重新执行 `gh auth login -h github.com`。
  - Wholesale 和 Custom Solutions 页面仍需后续用真实产品图、工厂图、合作图或更多品牌素材替换当前纯 UI / logo 证明模块。
  - Shopify 正式产品、cart、checkout、variant ID 仍未接入。
- 发现的问题：
  - Custom Solutions 子品牌 logo 的移动端卡片需要控制宽度和隐藏横向滚动条；本次已完成修正。
  - 小角度和 Xbert logo 原始图片较大；本次已压缩到 512px 长边，后续如有正式透明矢量或高清规范 logo，可再替换。
  - 当前 GitHub CLI token 失效，但 `git push` 仍成功。
- 下一次对话建议目标：
  - 优先检查 Product Detail 页面是否需要与新版 Products / Wholesale / Custom Solutions 的视觉方向统一。
  - 继续检查 Collections 和 Contact 页面移动端体验、表单状态和 B2B / DTC 路径清晰度。
  - 如视觉方向确认，可进入 Shopify product data / cart / checkout 接入规划。
- 备注：
  - 本次提交没有修改 Header/Footer、Shopify 集成或 `InquiryForm` 的提交 API / payload。
  - 结束当前对话时已按规则更新本进度日志；该日志更新发生在提交 `8a9a2d0` 之后，尚未包含在该 GitHub 提交中。

### 子项目 / 小项：About 页面品牌信任页优化

- 当前状态：已完成，已通过项目 owner 浏览器审核，已提交并推送。
- 本次目标：
  - 使用 `frontend-ui-ux-pro` 优化 `/about` 页面，让页面从简单公司简介升级为完整品牌信任页。
  - 兼顾桌面端和移动端体验，补充 hero、公司简介、里程碑、制造能力、办公团队、作品展示、质量文档、子品牌和底部 CTA。
  - 缺少真实素材时先使用远程占位图，后续由项目 owner 提供素材后替换。
- 本次完成：
  - `/about` 已重构为完整品牌介绍页面。
  - 新增深色 hero、brand profile summary、company overview、timeline、facilities & manufacturing、office & team、portfolio / product directions、quality documentation、sub-brand cooperation 和底部 CTA。
  - Portfolio 区复用当前 `lib/data.ts` 的 mock products / collections，链接到已有产品和集合页面。
  - Sub-Brands 区复用已有 iBlock、小角度、Xbert 三个 logo。
  - Certificates / Awards 按已确认策略处理为 “Quality documentation / compliance-ready placeholder”，没有写未验证的 ISO、EN71、ASTM 或奖项声明。
  - 修复 About hero 远程背景图 404 导致的首屏破图问题。
  - 优化底部 `Next step` CTA：从全宽深色区块改为浅灰背景中的独立深色面板，避免与 Footer 连成一块。
  - 修复 `Contact Us`、`View Products`、`Custom Solutions` 三个 CTA 按钮在桌面端断成双行的问题。
  - 没有新增依赖，没有修改 Header/Footer、Shopify 集成、表单 API 或全局样式。
- 验证结果：
  - 已通过：`pnpm lint`。
  - 已通过：`pnpm build`。
  - 已通过：`git diff --check`。
  - 已通过本地 HTTP 验证：`http://localhost:3000/about` 返回 200。
  - 已使用 in-app browser 验证 `/about` 首屏、移动端滚动、底部 CTA 与 Footer 过渡、CTA 按钮换行问题。
  - 已确认浏览器 console 无 error。
  - 项目 owner 已在浏览器中完成 About 页面审核。
  - Git 提交已完成：`e6f3af0 feat: polish about brand page`。
  - 分支已推送：`codex-homepage-ui-v1`。
- 未完成事项：
  - 当前 About 页面仍使用远程占位图，后续需要替换为真实 JIESTAR 产品图、工厂图、团队图、办公图、证书/检测报告图。
- 发现的问题：
  - 页面中质量文档模块目前是占位说明，不代表正式认证展示。
  - `gh auth status` 仍显示 GitHub CLI token 失效；当前分支推送可继续使用 `git push`。
- 下一次对话建议目标：
  - 新对话开始后先读取本文件。
  - 继续检查 Product Detail / Collections / Contact 页面视觉与交互体验。
  - 如视觉方向确认，可开始 Shopify product data / cart / checkout 接入规划。
- 备注：
  - 2026-05-05 已完成提交并推送。

### 原始每日记录归档

### 今日目标

- 验证网站核心页面的基本功能。
- 检查 Products、Product Detail、Collections、Wholesale、Custom Solutions、Contact 等页面体验。
- 初步判断产品相关页面是否符合 premium、clean、international 的品牌方向。
- 确认当前 preview/mock 产品数据阶段下，Shopify 接入前的功能边界是否表达清楚。

### 今日完成

- 创建每日进度记录文档，采用单文件持续追加模式。
- 明确每日记录结构：日期、今日目标、今日完成、功能验证结果、页面设计检查、发现的问题、明日计划、备注。
- 梳理今日需要验证的页面和功能范围。
- 运行项目技术检查：`pnpm lint` 和 `pnpm build` 均通过。
- 使用本地 dev server 快速验证代表性页面和 inquiry API。

### 功能验证结果

- 页面访问范围：
  - 已通过构建验证：Home、About、Products、Product Detail、Collections、Wholesale、Custom Solutions、Quality & Safety、Blog、Blog Detail、Contact、Policy pages、Replacement Parts、robots、sitemap。
  - 已通过本地 HTTP 验证：`/products`、`/products/velocity-super-car`、`/collections/super-cars`、`/wholesale`、`/custom-solutions`、`/contact`、`/blog/oem-vs-odm-building-blocks`、`/policies/shipping-policy` 均返回 200。
- 产品相关：
  - 已确认：Products 页面可访问。
  - 已确认：Product Detail 示例页面 `/products/velocity-super-car` 可访问。
  - 已确认：Collections 示例页面 `/collections/super-cars` 可访问。
  - 已确认：`pnpm build` 可成功生成 4 个产品详情静态页面和 8 个 collection 静态页面。
  - 待浏览器视觉检查：产品列表、产品卡片链接点击体验、产品详情首屏、规格信息、B2B 联系入口。
  - 待浏览器交互检查：Add to Cart / Buy Now 是否清楚表现为 Shopify preview 状态。
- 表单相关：
  - 已确认：`/api/inquiry` 有效请求返回 `{"ok":true}`。
  - 已确认：`/api/inquiry` 缺少必填字段时返回 400，并提示 `Missing fields: country, email, message`。
  - 待浏览器交互检查：Wholesale、Custom Solutions、Contact 页面表单字段、成功状态和错误状态的页面表现。
- 技术检查：
  - 已通过：`pnpm lint`
  - 已通过：`pnpm build`

### 页面设计检查

- Products 页面需要重点检查：
  - 产品列表视觉是否清爽，不像廉价商城模板。
  - 产品卡片信息层级是否清楚。
  - 移动端按钮、价格、标题是否拥挤或溢出。
- Product Detail 页面需要重点检查：
  - 首屏产品图片、标题、价格、CTA 是否清楚。
  - 产品规格信息是否完整且易扫读。
  - B2B cooperation 入口是否自然，不干扰 DTC 购买路径。
- Wholesale 和 Custom Solutions 页面需要重点检查：
  - Wholesale 是否聚焦 existing products、factory-direct supply、MOQ、catalog inquiry。
  - Custom Solutions 是否清楚表达 OEM / ODM、product co-development、exclusive SKU、exclusive product line、sub-brand partnership。

### 发现的问题

- 当前尚未完成完整浏览器视觉检查和移动端检查。
- 当前 Shopify 正式产品、购物车和 checkout 尚未接入，产品购买按钮仍处于 preview/mock 数据阶段。
- 需要继续检查产品页是否有廉价商城感、文字拥挤、按钮层级不清、移动端溢出等设计问题。

### 明日计划

- 根据今天的验证结果修复页面功能和设计问题。
- 继续优化 Products 和 Product Detail 页面设计。
- 检查产品页是否需要更清楚地区分 DTC 购买路径和 B2B inquiry 入口。
- 为后续 Shopify 产品数据、variant ID、cart、checkout 接入做准备。

### 备注

- 2026-05-03 已完成页面基础设计。
- 当前阶段不新增复杂 ecommerce backend。
- Shopify 应继续作为 products、cart、checkout、orders、payments 的后端。
