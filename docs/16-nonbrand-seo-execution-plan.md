# JIESTAR 非品牌 SEO 执行台账

本轮依据项目所有者 2026-09-07 的明确授权执行：修改、事实核验、测试通过后自动提交发布，随后核验生产页面。范围为本文件的 SEO 修复及内容批次。原项目工作目录可能含其他未完成工作；每次从核实过的最新生产版本创建独立工作目录，只提交本批文件。

## 调度与恢复

- 自动化：`jiestar-seo`，名称「JIESTAR 非品牌 SEO 持续优化」，绑定原 SEO 对话。
- 计划：Asia/Shanghai，北京时间每个工作日 14:30；首次 2026-09-08。以应用的下次运行记录为准，实际启动时间另行记录。
- 每次先读取 `docs/09-daily-progress-log.md`、本台账、生产部署和原工作目录交接记录。
- 根据北京时间，从最早到期未完成项继续；一次最多一个内容批次。技术检查及数据复盘可与内容批次同次完成。
- 完成必须记录：日期、状态、验证、生产网址、提交与部署、证据位置、下一项。失败保留工作目录；缺关键事实标记待补，推进已能确认的部分。
- 已完成行跳过；每周检查以周一日期去重，漏过的检查下一次补做；不重复发布相同文章。
- 只在完成批次、重要变化、失败或需要用户处理时通知。无到期工作且无变化时保持安静。
- 11 月 30 日完成复盘并处理遗留后，使用应用 automation_update 暂停本轮；不修改旧的已暂停新品博客草稿任务。
- 本地运行依赖电脑开机、Codex 桌面应用运行、项目和必要服务可访问。首轮实际调度记录须在触发后核验，保存配置不代表实际运行成功。

## 一次性内容批次

| ID | 到期日 | 工作 | 状态 | 完成证据 |
| --- | --- | --- | --- | --- |
| foundation | 2026-09-07 | 恢复两篇原网址；核验六个核心页；非品牌基线；内链与站点地图 | 验证中 | 待生产回读 |
| b2b-pages | 2026-09-14 | 批发与定制：采购信息、制造证据、关键词、内部链接 | 待执行 | — |
| collections | 2026-09-21 | 花卉、车辆、船舶、建筑街景独立分类内容 | 待执行 | — |
| buyer-guides | 2026-09-28 | MOQ/报价、私人品牌、OEM/ODM、定制包装四篇现有指南 | 待执行 | — |
| evidence-article-1 | 2026-10-05 | 一篇有真实资料支持的采购文章或定制案例 | 待执行 | — |
| evidence-article-2 | 2026-10-19 | 一篇有真实资料支持的采购文章或定制案例 | 待执行 | — |
| evidence-article-3 | 2026-11-02 | 一篇有真实资料支持的采购文章或定制案例 | 待执行 | — |
| evidence-article-4 | 2026-11-16 | 一篇有真实资料支持的采购文章或定制案例 | 待执行 | — |
| final-review | 2026-11-30 | 阶段复盘、处理遗留后暂停 | 待执行 | — |

## 核心网址与页面职责

生产域名统一为 `https://www.jiestartoys.com`，保持原网址。

| URL | 主要搜索意图 | 2026-09-07 Google 网址检查 |
| --- | --- | --- |
| `/wholesale` | wholesale building blocks、供应与采购 | 已收录 |
| `/custom-solutions` | custom building block sets、OEM/ODM、私人品牌 | 已发现，尚未收录；17:10 实时测试可收录 |
| `/collections/flowers-botanical` | flower building block sets | 已发现，尚未收录 |
| `/collections/vehicles` | vehicle building block sets、car model kits | 已发现，尚未收录 |
| `/collections/ships-boats` | ship building block sets、ship model kits | 已发现，尚未收录 |
| `/collections/buildings-street-scenes` | building and street scene sets | 已收录 |

六页 HTTP、canonical、robots/noindex、站点地图的技术状态与 Google 实际索引分开记录；技术通过不能标为“已收录”。现有 robots 分页策略没有确认问题，不因未收录而随意放开筛选参数。9 月 21 日按真实商品和分类意图补独立内容，不复制同一段分类介绍。

恢复文章：

- `/blog/new-jiestar-ship-model-x78009`
- `/blog/new-jiestar-architecture-street-view-x68003-x68004`

9 月 28 日编辑现有文章：

- `content/blog/building-block-sets-wholesale-moq-pricing-packaging-shipping.md`
- `content/blog/private-label-building-blocks-for-retailers.md`
- `content/blog/oem-vs-odm-building-blocks.md`
- `content/blog/custom-packaging-for-building-block-toys.md`

每篇内容先核对对应商品、工厂素材或实际业务资料；不编造案例、客户、认证、MOQ、交期、产能与合作结果。保留原发布日期，用真实 updatedAt 记录修改；复用网站现有样式和组件。

## 技术周检记录

每周一检查以上六页、两篇恢复文章、相关图片及商品链接、博客入口、站点地图和收录变化。每次增加一行，记录周一日期与实际执行日。

| 周次 | 实际执行日 | 状态 | 证据 / 待处理 |
| --- | --- | --- | --- |
| 2026-09-07 | 2026-09-07 | 验证中 | 首批发布后补生产回读 |

## 28 天复盘

| ID | 到期日 | 状态 |
| --- | --- | --- |
| metrics-1 | 2026-10-05 | 待执行 |
| metrics-2 | 2026-11-02 | 待执行 |
| metrics-3 | 2026-11-30 | 待执行 |

- 基线源：Search Console 的 `jiestartoys.com` 域名属性，网络搜索，无国家和设备筛选，2026-08-09 至 2026-09-05，共 28 个完整日。
- 原始数据和报告保存在常用项目目录 `output/seo/2026-09-07/`，该目录不提交 Git。公开仓库只保存方法，不保存私有查询明细、询盘数据及账户数据。
- 使用 `scripts/gsc_baseline_report.py --current <本期CSV目录> --previous <比较期CSV目录> --output <output/seo/报告.md>`。分别比较本轮基线和上个可比周期，注明实际日期、筛选、可比性。
- 品牌归类包含 JIESTAR 的常见拼写及 GULY、JIQI、Xbert、iBlock、TK TWO、Zoin。分类版本 `2026-09-07-v1`；规则变化时对基线与比较期一并重新计算。
- 全站总量来自图表 CSV；查询表仅为公开查询。未公开或截断的差额不能归为非品牌。
- 非品牌分 B2B、DTC 和其他/意图不清。有效询盘需要核实搜索来源及业务资格；缺数据写“不可得”，不能写零或拿所有表单提交替代。
- 先用最近完整 28 天和相同属性/筛选比较；数据延迟、缺文件、归类变更均需注明。

## 外链与通知边界

展会、行业目录和经销商机会先核实官方页面、公司身份及真实关系，再整理机会和联系稿。本轮不自动向他人发送消息，也不购买外链。

## 执行记录

- 2026-09-07：隔离工作目录基于已核实的生产提交 `ffc0d9b`；两篇文章正文规格与线上三个商品页匹配。保留 8 月 22 日原发布日期，补 9 月 7 日更新日期及准确分类内链。本地 85 项网站测试、5 项统计工具测试、lint、build、36 项 HTTP 检查及四页桌面/手机验收通过；等待生产回读。

- 2026-09-07：自动化已启用；本地调度器对固定周期加入 0–119 秒偏移。当前下一次为北京时间 2026-09-08 14:31:39；尚无实际运行记录，首轮触发后补记。
