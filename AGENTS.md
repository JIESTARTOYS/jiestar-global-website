\# AI Development Rules for JIESTAR Global Website



\## 1. Project Overview



This project is the official global website for JIESTAR.



The website should serve as:



\- An international building block brand website

\- A DTC ecommerce storefront

\- A B2B wholesale cooperation gateway

\- A custom product development and sub-brand partnership gateway

\- A long-term SEO content hub



The website must support both:



1\. DTC customers who want to browse and buy building block sets.

2\. B2B customers who want wholesale supply, OEM / ODM customization, product co-development, long-term product line cooperation, or sub-brand partnership.



The B2B side must not only focus on wholesale. It must clearly communicate that JIESTAR can work with global partners on custom product development, exclusive product lines, and long-term sub-brand cooperation.



\---



\## 2. Core Positioning



The core positioning of the website is:



> JIESTAR's global website should serve as an international building block brand hub, supporting both direct-to-consumer shopping and B2B cooperation, including wholesale supply, custom product development, product co-creation, and long-term sub-brand partnerships.



The website should not feel like:



\- A traditional Chinese factory website

\- A generic Shopify template store

\- A cheap dropshipping website

\- A low-end product listing website

\- An overly childish toy website



The website should feel:



\- International

\- Premium

\- Clean

\- Modern

\- Trustworthy

\- Brand-oriented

\- Suitable for B2B buyers

\- Suitable for DTC collectors and fans



\---



\## 3. Technology Stack



Use the following stack unless the project owner explicitly changes it.



\### Frontend



\- Next.js

\- TypeScript

\- Tailwind CSS



\### Commerce Backend



\- Shopify



\### Content



\- Markdown first

\- Sanity can be added later if needed



\### Deployment



\- Vercel



\### Code Management



\- GitHub



\### Development Tools



\- Claude Code

\- Codex



Important principle:



> Shopify should handle products, cart, checkout, orders, payments, customers, inventory, refunds, and email notifications. Next.js should handle custom frontend design, page structure, SEO, and user experience.



Do not build a full custom ecommerce backend in Version 1.



\---



\## 4. Development Workflow



For every medium or large task, follow this workflow:



1\. Explore

2\. Plan

3\. Implement

4\. Review

5\. Test

6\. Summarize



Do not jump directly into large implementation without first explaining the implementation plan.



For small tasks, direct implementation is acceptable, but changes still need to be summarized afterward.



\### Project Progress & Conversation Handoff Workflow



Use `docs/09-daily-progress-log.md` as the project progress memory and conversation handoff log.



When the project owner says "结束当前对话", "结束这个小项", or "结束今天的工作":



\- Update `docs/09-daily-progress-log.md` with the current small task / sub-project progress, validation results, discovered issues, unfinished items, and recommended next conversation goal.

\- Keep the entry in Chinese.

\- Use the existing single-file log structure instead of creating a new file.

\- Keep the record concise, but clear enough that the next conversation can understand where the project currently stands and what work the next conversation should prepare to complete.



When starting a new relevant project conversation or when the project owner asks to begin work:



\- Read `docs/09-daily-progress-log.md` first.

\- Understand the current project status, open issues, unfinished items, and the intended goal for the current conversation before making a new plan or editing files.



\---



\## 5. Task Execution Rules



When working on a task, always follow these rules:



1\. Read the relevant documentation files before making changes.

2\. Confirm which files need to be changed.

3\. Modify only the necessary files.

4\. Avoid unrelated refactoring.

5\. Avoid introducing new dependencies unless clearly necessary.

6\. Keep changes small, reviewable, and reversible.

7\. Preserve the project's visual direction and brand positioning.

8\. Keep the code maintainable for a one-person team.

9\. After implementation, explain what was changed and why.

10\. If a build or test command is available, run it before finishing.



For large tasks, first create a short implementation plan.



\---



\## 6. File Modification Rules



Do not modify files outside the requested scope unless necessary.



Before modifying files, identify:



\- Which files will be changed

\- Which files will be created

\- Whether the task affects layout, styling, data fetching, SEO, forms, or Shopify integration



Do not:



\- Delete existing files unless specifically instructed

\- Rename routes, components, or folders without explaining the reason

\- Change global styles unless the task requires it

\- Change environment variable names unless required

\- Expose API tokens, private keys, or secrets in code



\---



\## 7. Recommended Project Structure



Use a structure similar to the following:



```text

jiestar-global-website/

├── app/

│   ├── page.tsx

│   ├── products/

│   ├── collections/

│   ├── wholesale/

│   ├── custom-solutions/

│   ├── about/

│   ├── quality-safety/

│   ├── blog/

│   ├── contact/

│   ├── support/

│   └── policies/

├── components/

│   ├── layout/

│   ├── sections/

│   ├── product/

│   ├── forms/

│   └── ui/

├── content/

│   ├── blog/

│   ├── pages/

│   └── seo/

├── lib/

│   ├── shopify.ts

│   ├── seo.ts

│   └── utils.ts

├── public/

│   ├── images/

│   └── icons/

├── docs/

│   ├── 01-jiestar-website-requirements.md

│   ├── 02-jiestar-sitemap.md

│   ├── 03-jiestar-homepage-structure.md

│   └── 04-ai-development-rules.md

└── README.md

```



Do not overcomplicate the structure in Version 1.



\---



\## 8. Page Scope for Version 1



Version 1 should focus on these pages:



\- Home

\- Products

\- Product detail page

\- Wholesale

\- Custom Solutions

\- About

\- Quality \& Safety

\- Blog

\- Blog detail page

\- Contact

\- Shipping Policy

\- Replacement Parts / Missing Pieces

\- Returns \& Refunds

\- Privacy Policy

\- Terms of Service



Version 1 should not prioritize:



\- Multi-language system

\- B2B account system

\- Complex distributor portal

\- Product comparison system

\- Complex CRM integration

\- 3D product display

\- Advanced product filtering

\- Fully custom ecommerce backend



\---



\## 9. Navigation Rules



Main navigation for Version 1:



\- Home

\- Products

\- Wholesale

\- Custom Solutions

\- About

\- Blog

\- Contact



Navigation meaning:



\- Wholesale = existing product wholesale, channel procurement, distributor cooperation

\- Custom Solutions = OEM / ODM, product customization, product co-development, sub-brand partnership



Do not split the main navigation into too many B2B items in Version 1.



Avoid separate top-level items like:



\- OEM / ODM

\- Product Co-Development

\- Sub-Brand Partnership



These should be sections under Custom Solutions.



\---



\## 10. Visual Design Rules



The visual style should be:



\- Premium

\- International

\- Clean

\- Modern

\- Professional

\- Trustworthy

\- Brand-oriented

\- Suitable for building block products

\- Suitable for both B2B and DTC users



Avoid:



\- Cheap discount-heavy design

\- Excessive bright colors

\- Random gradients

\- Crowded product grids

\- Too many animations

\- Cartoonish childish styling

\- Generic Shopify template style

\- Traditional factory website layout



Use:



\- Strong spacing

\- Clear typography

\- High-quality product images

\- Clean section hierarchy

\- Premium cards

\- Clear CTA buttons

\- Subtle hover effects

\- Mobile-first responsive layout



The site should feel creative, but not childish.



\---



\## 11. Copywriting Rules



Default website copy should be written in English.



The tone should be:



\- Clear

\- Professional

\- International

\- Trustworthy

\- Direct

\- B2B-friendly

\- Still accessible to DTC users



Avoid:



\- Overly exaggerated claims

\- Cheap sales language

\- Excessive emojis

\- Overly casual language

\- Unverified certification claims

\- Long unreadable paragraphs



Important B2B terms to use:



\- Wholesale supply

\- Factory-direct supply

\- OEM / ODM customization

\- Product co-development

\- Custom building block solutions

\- Exclusive SKU

\- Exclusive product line

\- Sub-brand partnership

\- Long-term product development

\- Global business cooperation



Important DTC terms to use:



\- Building block sets

\- Display models

\- Collectors

\- Building experience

\- Piece count

\- Finished model size

\- Missing piece support

\- Secure checkout



\---



\## 12. B2B Content Rules



B2B content must clearly communicate that JIESTAR supports more than wholesale.



The B2B value proposition should include:



\- Wholesale supply

\- OEM customization

\- ODM development

\- Product co-development

\- Packaging customization

\- Brand logo customization

\- Exclusive SKU

\- Exclusive product line

\- Sub-brand partnership

\- Long-term product line planning



The Wholesale page should focus on:



\- Existing products

\- Product catalog

\- Factory-direct supply

\- MOQ

\- Product categories

\- Wholesale inquiry



The Custom Solutions page should focus on:



\- OEM / ODM

\- Custom product development

\- Product co-development

\- Packaging and brand customization

\- Exclusive SKU

\- Exclusive product line

\- Sub-brand partnership

\- Long-term cooperation



Do not make Custom Solutions look like a basic wholesale page.



\---



\## 13. DTC Ecommerce Rules



DTC product pages should support conversion.



Product detail pages should include:



\- Product title

\- Product image gallery

\- Price

\- Key selling points

\- Add to Cart

\- Buy Now

\- Product description

\- Product specifications

\- SKU

\- Piece count

\- Recommended age

\- Finished model size

\- Package size

\- Difficulty level

\- Shipping information

\- Missing piece support

\- Related products

\- FAQ



Product pages should also include a small B2B entry:



> Interested in wholesale or custom versions of this product? Contact us for business cooperation.



\---



\## 14. Shopify Integration Rules



Shopify should be used as the commerce backend.



Use Shopify for:



\- Products

\- Collections

\- Inventory

\- Cart

\- Checkout

\- Orders

\- Payments

\- Customer data

\- Refunds

\- Email notifications



The custom frontend can fetch product and collection data through Shopify Storefront API.



Do not:



\- Store Shopify private tokens in client-side code

\- Expose sensitive Shopify credentials

\- Implement a custom checkout in Version 1



Use environment variables for Shopify configuration.



Suggested environment variable names:



```text

SHOPIFY\_STORE\_DOMAIN=

SHOPIFY\_STOREFRONT\_ACCESS\_TOKEN=

SHOPIFY\_API\_VERSION=

```



Use Shopify checkout for transaction stability.



When product or collection pages intermittently show 404, or Shopify images intermittently fail to load, check `docs/11-shopify-runtime-troubleshooting.md` before changing routes, handles, or product data. Treat repeated `fetch failed`, `ConnectTimeoutError`, `ShopifyUnavailableError`, and `upstream image response timed out` logs as Shopify/network resilience issues first.



\---



\## 15. SEO Rules



Every important page must include:



\- Unique SEO title

\- Meta description

\- Clear H1

\- Proper H2 structure

\- Image alt text

\- Internal links

\- Clean URL

\- Mobile-friendly layout



Core SEO keyword directions:



\- building blocks

\- building block sets

\- construction toys

\- display model kits

\- educational building blocks

\- technic building blocks

\- wholesale building blocks

\- building block manufacturer

\- OEM building blocks

\- ODM building blocks

\- custom building blocks

\- custom building block sets

\- building block supplier

\- building block manufacturer China



Do not keyword stuff.



SEO copy should read naturally.



\---



\## 16. Performance Rules



The website should be fast and mobile-friendly.



Follow these rules:



\- Optimize images before use.

\- Use responsive images.

\- Avoid loading unnecessary JavaScript.

\- Avoid heavy animation libraries unless necessary.

\- Do not use oversized hero images.

\- Use lazy loading where appropriate.

\- Keep homepage sections clean and focused.

\- Avoid excessive third-party scripts in Version 1.



Before finalizing major pages, check:



\- Mobile layout

\- Desktop layout

\- Image size

\- Lighthouse score if possible

\- Core Web Vitals if possible



\---



\## 17. Accessibility Rules



Basic accessibility should be included.



Use:



\- Semantic HTML

\- Proper heading hierarchy

\- Descriptive alt text

\- Visible focus states

\- Accessible button labels

\- Sufficient text contrast

\- Keyboard-accessible navigation



Do not use buttons without accessible labels.



Do not use images without alt text unless they are decorative.



\---



\## 18. Form Rules



Inquiry forms should be simple and clear.



\### Wholesale Form Fields



\- Name

\- Company

\- Country / Region

\- Email

\- WhatsApp

\- Business Type

\- Interested Product Category

\- Estimated Order Quantity

\- Target Sales Channel

\- Message



\### Custom Solutions Form Fields



\- Name

\- Company

\- Country / Region

\- Email

\- WhatsApp

\- Business Type

\- Cooperation Type

\- Interested Product Category

\- Customization Needs

\- Estimated Order Quantity

\- Target Market

\- Message



\### Cooperation Type Options



\- Wholesale

\- OEM Customization

\- ODM Development

\- Product Co-Development

\- Sub-Brand Partnership

\- Not Sure Yet



Do not make forms too long in the first version.



If needed, use progressive disclosure or optional fields.



\---



\## 19. Content Management Rules



Version 1 should use Markdown for content unless otherwise instructed.



Use Markdown for:



\- Blog articles

\- Static page copy

\- SEO copy drafts

\- Policy drafts



Sanity can be added later if:



\- Blog content grows significantly

\- Non-technical editing is required

\- Product story pages become more complex

\- The website needs structured content management



Do not add Sanity in Version 1 unless explicitly requested.



\---



\## 20. Dependency Rules



Do not add new dependencies unless necessary.



Before adding a dependency, explain:



\- Why it is needed

\- What problem it solves

\- Whether the same result can be achieved without it

\- Whether it increases bundle size or maintenance complexity



Allowed or likely acceptable dependencies:



\- Tailwind CSS

\- clsx

\- tailwind-merge

\- lucide-react

\- framer-motion, only for subtle animations

\- Shopify Storefront API client if needed

\- Markdown parsing library if needed



Avoid:



\- Heavy UI frameworks

\- Large animation libraries

\- Unnecessary state management libraries

\- Complex CMS integration in Version 1

\- Unnecessary ecommerce packages



\---



\## 21. Component Rules



Components should be:



\- Reusable

\- Typed with TypeScript

\- Easy to read

\- Easy to modify

\- Mobile responsive

\- Visually consistent



Recommended component categories:



\- Layout components

\- Homepage sections

\- Product components

\- B2B section components

\- Form components

\- SEO components

\- UI primitives



Avoid huge components with too much logic.



Split large pages into clear sections.



\---



\## 22. Styling Rules



Use Tailwind CSS for styling.



Do not use random inline styles unless necessary.



Keep spacing consistent.



Use a clear design system for:



\- Colors

\- Typography

\- Buttons

\- Cards

\- Section spacing

\- Product grids

\- Forms



Avoid hardcoding too many one-off styles.



The design should be premium and restrained.



\---



\## 23. Git and Commit Rules



Before major changes:



\- Check current branch

\- Understand current file state

\- Avoid overwriting user changes



After implementation:



\- Summarize changed files

\- Summarize main changes

\- Mention any follow-up work

\- Mention any commands run



Suggested commit message format:



```text

feat: add homepage hero and brand sections

fix: correct product card responsive layout

refactor: split homepage into reusable sections

docs: update JIESTAR website planning documents

seo: add metadata for core pages

```



Do not commit unless instructed by the project owner.



\---



\## 24. Testing and Validation Rules



Before finishing a major task, run available checks.



Suggested commands:



```bash

pnpm lint

pnpm build

```



If the project has tests later:



```bash

pnpm test

```



If a command fails:



1\. Read the error.

2\. Identify the root cause.

3\. Fix only the relevant issue.

4\. Run the command again.

5\. Report the result.



Do not ignore build errors.



Do not hide failed checks.



\---



\## 25. Security Rules



Never expose:



\- Shopify tokens

\- API keys

\- Private credentials

\- Email service keys

\- GitHub tokens

\- Vercel tokens

\- Customer data

\- Order data



Use environment variables for secrets.



Do not commit `.env` files.



Use `.env.example` for documentation.



Suggested `.env.example`:



```text

SHOPIFY\_STORE\_DOMAIN=

SHOPIFY\_STOREFRONT\_ACCESS\_TOKEN=

SHOPIFY\_API\_VERSION=

CONTACT\_EMAIL=

SUPPORT\_EMAIL=

```



\---



\## 26. Windows and Mac Development Rules



The project may start on Windows and later move to Mac.



To keep the project portable:



\- Use cross-platform scripts.

\- Avoid Windows-only paths.

\- Avoid hardcoded absolute paths.

\- Use forward slashes in project paths.

\- Keep environment variables documented.

\- Use WSL2 for Windows development where possible.

\- Keep all project files in GitHub for easy migration.



Do not rely on local machine-specific configuration.



\---



\## 27. AI Prompting Rules



When asking Claude Code or Codex to work on this project, include:



\- Project goal

\- Current task

\- Relevant files

\- Files allowed to modify

\- Visual requirements

\- Technical constraints

\- Definition of done



Example task prompt:



```text

You are working on the JIESTAR global website.



Project goal:

Build an international, premium, maintainable building block brand website that supports DTC shopping and B2B cooperation, including wholesale, OEM/ODM, product co-development, and sub-brand partnership.



Current task:

Create the homepage hero section.



Allowed files:

\- app/page.tsx

\- components/sections/HomeHero.tsx



Requirements:

\- Use Next.js + TypeScript + Tailwind CSS.

\- Write English website copy.

\- Visual style should be premium, clean, international, and not childish.

\- Include two CTA buttons: Explore Products and Start a Project.

\- Mobile responsive.

\- Do not add new dependencies.

\- Summarize changed files after completion.



Definition of done:

\- Homepage renders correctly.

\- Hero section is responsive.

\- No TypeScript errors.

\- No unnecessary dependencies added.

```



\---



\## 28. Claude Code Usage Rules



Claude Code should be used mainly for:



\- Exploring the codebase

\- Creating page sections

\- Building components

\- Refactoring components

\- Debugging errors

\- Improving layout

\- Adjusting Tailwind styles

\- Creating page-level SEO metadata

\- Writing or improving website copy

\- Reviewing implementation plans



For complex changes, ask Claude Code to first produce a plan before editing files.



Do not let Claude Code rebuild the whole website in one prompt.



Work section by section.



\---



\## 29. Codex Usage Rules



Codex should be used mainly for:



\- Code review

\- Bug fixing

\- Build error diagnosis

\- TypeScript error fixing

\- API integration review

\- Shopify integration review

\- Performance review

\- Security review

\- SEO metadata review

\- Refactoring suggestions



For Codex tasks, provide a clear definition of done.



Example Codex review prompt:



```text

Review the current homepage implementation for the JIESTAR global website.



Focus on:

\- TypeScript correctness

\- Component structure

\- Tailwind consistency

\- Mobile responsiveness

\- SEO basics

\- Whether the design direction matches a premium international building block brand

\- Whether B2B and DTC paths are both clear



Do not rewrite the whole page.

Only suggest targeted improvements.

```



\---



\## 30. Definition of Done for Version 1



Version 1 is done when:



\- Homepage is complete.

\- Products page is complete.

\- Product detail template is complete.

\- Wholesale page is complete.

\- Custom Solutions page is complete.

\- About page is complete.

\- Quality \& Safety page is complete.

\- Contact page is complete.

\- Blog index and blog detail template are complete.

\- Policy pages are complete.

\- Shopify product data can be displayed.

\- Shopify checkout flow works.

\- Inquiry forms work.

\- Basic SEO metadata is implemented.

\- Mobile layout is acceptable.

\- `pnpm build` passes.

\- The website can be deployed to Vercel.

\- The project owner can maintain the website alone.



\---



\## 31. Final Reminder



This project should prioritize:



\- Brand trust

\- Clear product presentation

\- B2B inquiry conversion

\- DTC checkout conversion

\- SEO foundation

\- Maintainability

\- Fast implementation



Do not overbuild Version 1.



Do not turn this into a complex custom ecommerce system.



Do not sacrifice clarity for visual effects.



The first version should be premium, clear, fast, and maintainable.



\---



\## 32. Project AI Skills



Reusable project-level AI Skills live in `skills/`.



Current Skill:



\- `skills/catalog-design/SKILL.md` — premium overseas product catalog, brand brochure, distributor brochure, trade show brochure, product detail sheet, wholesale catalog, PDF/PPTX/Canva/Figma/Markdown/HTML catalog structure.



Supported command-style aliases:



\- `/catalog-design`

\- `/product-catalog`

\- `/brochure-design`

\- `/画册设计`

\- `/产品画册`

\- `/招商画册`



Command entry files are registered under `.claude/commands/`, `.opencode/commands/`, and `.codex/commands/`. When a catalog or brochure command is used, read `skills/catalog-design/SKILL.md` first and follow its rules for missing data, image placeholders, B2B tone, overseas catalog design, and prohibited claims.



\---



\## 33. Project Blog Content Agent



The reusable JIESTAR blog content agent lives at:



\- `agents/blog-content-agent.md`



Use this Agent whenever the project owner asks to write a blog, turn supplied images and rough content into a blog article, organize ideas into an article, rewrite a blog, or express the project owner's meaning clearly to website customers.



Common trigger phrases include:



\- 写博客

\- 图片生成博客

\- 整理成文章

\- 博客改写

\- 把这些内容写成英文博客



Before creating or changing blog content or blog images, read `agents/blog-content-agent.md` completely and follow its rules for English website copy, Chinese review summaries, category selection, image handling, fact verification, SEO, prohibited claims, repository output, and validation.



The Blog Content Agent may create or update `content/blog/*.md` and related optimized assets under `public/images/blog/` when requested. It must not commit, push, deploy, publish, or change the blog runtime unless the project owner explicitly requests that separate action.

