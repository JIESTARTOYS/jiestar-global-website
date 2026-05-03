\# First Week Action Plan for JIESTAR Global Website



\## 1. Purpose of This Document



This document defines the first-week execution plan for building the JIESTAR global website.



The goal of the first week is not to complete the full website.



The goal is to:



\- Set up the development environment.

\- Create the project repository.

\- Establish the documentation foundation.

\- Build the first static homepage draft.

\- Confirm the visual direction.

\- Prepare the project for Shopify integration later.

\- Create a repeatable workflow for Claude Code and Codex.



The first week should focus on structure, direction, and execution rhythm.



Do not overbuild.



Do not connect Shopify too early.



Do not start with complex ecommerce logic.



\---



\## 2. First Week Core Goal



By the end of Week 1, the project should have:



\- A working Next.js project.

\- A clear documentation folder.

\- A GitHub repository.

\- A homepage static draft.

\- A basic layout system.

\- A header and footer.

\- Homepage sections based on the approved homepage structure.

\- A clean visual direction suitable for an international building block brand.

\- A working local development environment.

\- A successful production build.



Success means the website has a clear foundation, not that it is fully finished.



\---



\## 3. First Week Technical Scope



Use the following stack in Week 1:



\- Next.js

\- TypeScript

\- Tailwind CSS

\- Markdown documentation

\- GitHub

\- Vercel later, if the local build is stable



Do not add in Week 1 unless explicitly approved:



\- Shopify integration

\- Sanity

\- Advanced animations

\- Product database

\- Complex CMS

\- Multi-language system

\- B2B login system

\- CRM integration

\- Payment customization

\- 3D product display

\- Heavy UI libraries



\---



\## 4. Week 1 Deliverables



By the end of the week, the following files and features should exist.



\### Documentation



```text

docs/

├── 01-jiestar-website-requirements.md

├── 02-jiestar-sitemap.md

├── 03-jiestar-homepage-structure.md

├── 04-ai-development-rules.md

└── 05-first-week-action-plan.md

```



\### Project Structure



```text

jiestar-global-website/

├── app/

│   ├── page.tsx

│   ├── layout.tsx

│   └── globals.css

├── components/

│   ├── layout/

│   │   ├── Header.tsx

│   │   └── Footer.tsx

│   └── sections/

│       ├── HomeHero.tsx

│       ├── BrandStrength.tsx

│       ├── ProductCategories.tsx

│       ├── FeaturedProducts.tsx

│       ├── B2BCooperation.tsx

│       ├── CustomSolutions.tsx

│       ├── QualitySafety.tsx

│       ├── BrandStory.tsx

│       ├── BlogPreview.tsx

│       └── FinalCTA.tsx

├── content/

├── lib/

├── public/

├── docs/

└── README.md

```



\### Homepage Sections



The static homepage draft should include:



1\. Hero

2\. Brand Strength

3\. Product Categories

4\. Featured Products

5\. B2B Cooperation Overview

6\. Custom Solutions

7\. Quality \& Safety

8\. Brand Story

9\. Blog / Guides Preview

10\. Final CTA

11\. Header

12\. Footer



\---



\## 5. Development Principles for Week 1



During Week 1, follow these principles:



1\. Static first, dynamic later.

2\. Visual direction first, ecommerce integration later.

3\. Build sections one by one.

4\. Keep all copy in English.

5\. Use placeholder images if real product images are not ready.

6\. Do not add Shopify until homepage structure is approved.

7\. Do not add Sanity until content volume justifies it.

8\. Do not add heavy animation.

9\. Use Tailwind CSS only for styling.

10\. Keep the site mobile responsive from the beginning.

11\. Run `pnpm build` after major changes.

12\. Keep the project simple enough for one person to maintain.



\---



\## 6. Daily Plan Overview



\### Day 1



Focus:



\- Set up local development environment.

\- Create Next.js project.

\- Create documentation folder.

\- Add the five planning documents.

\- Initialize Git.



Main outcome:



\- Project runs locally.

\- Documentation is in place.



\---



\### Day 2



Focus:



\- Build base layout.

\- Create Header.

\- Create Footer.

\- Create homepage section structure.

\- Add basic global styling.



Main outcome:



\- The homepage has a complete skeleton.



\---



\### Day 3



Focus:



\- Build Hero section.

\- Build Brand Strength section.

\- Build Product Categories section.

\- Confirm first visual direction.



Main outcome:



\- The top half of the homepage starts to feel like a real international brand website.



\---



\### Day 4



Focus:



\- Build Featured Products section.

\- Build B2B Cooperation section.

\- Build Custom Solutions section.



Main outcome:



\- The homepage clearly separates DTC shopping, wholesale, and custom cooperation paths.



\---



\### Day 5



Focus:



\- Build Quality \& Safety section.

\- Build Brand Story section.

\- Build Blog Preview section.

\- Build Final CTA section.



Main outcome:



\- The full static homepage is complete.



\---



\### Day 6



Focus:



\- Improve responsive design.

\- Improve spacing, typography, and visual hierarchy.

\- Run lint and build checks.

\- Fix obvious layout issues.



Main outcome:



\- Homepage is usable on desktop and mobile.



\---



\### Day 7



Focus:



\- Review with Codex.

\- Refine based on review.

\- Prepare README.

\- Create first GitHub milestone.

\- Optionally deploy preview to Vercel.



Main outcome:



\- Week 1 foundation is complete and ready for Week 2.



\---



\# 7. Day 1 Detailed Plan



\## Goal



Set up the project foundation.



\## Tasks



\### 1. Create Project Folder



Recommended folder name:



```text

jiestar-global-website

```



\### 2. Create Next.js Project



Run:



```bash

pnpm create next-app@latest jiestar-global-website

```



Recommended selections:



```text

TypeScript: Yes

ESLint: Yes

Tailwind CSS: Yes

src directory: No

App Router: Yes

Turbopack: Yes

Import alias: Yes

```



\### 3. Enter Project



```bash

cd jiestar-global-website

```



\### 4. Start Local Development



```bash

pnpm dev

```



Open:



```text

http://localhost:3000

```



\### 5. Create Docs Folder



```bash

mkdir docs

```



Add these files:



```text

01-jiestar-website-requirements.md

02-jiestar-sitemap.md

03-jiestar-homepage-structure.md

04-ai-development-rules.md

05-first-week-action-plan.md

```



\### 6. Initialize Git



```bash

git init

git add .

git commit -m "docs: add initial JIESTAR website planning documents"

```



\## Day 1 Definition of Done



Day 1 is complete when:



\- Next.js project runs locally.

\- `docs/` folder exists.

\- Five planning documents exist.

\- Git repository is initialized.

\- First commit is created.



\---



\# 8. Day 2 Detailed Plan



\## Goal



Build the base website structure.



\## Tasks



\### 1. Create Layout Components



Create:



```text

components/layout/Header.tsx

components/layout/Footer.tsx

```



\### 2. Create Section Components



Create:



```text

components/sections/HomeHero.tsx

components/sections/BrandStrength.tsx

components/sections/ProductCategories.tsx

components/sections/FeaturedProducts.tsx

components/sections/B2BCooperation.tsx

components/sections/CustomSolutions.tsx

components/sections/QualitySafety.tsx

components/sections/BrandStory.tsx

components/sections/BlogPreview.tsx

components/sections/FinalCTA.tsx

```



\### 3. Update Homepage



Update:



```text

app/page.tsx

```



The homepage should import and render all homepage sections in order.



\### 4. Add Basic Header Navigation



Header navigation:



```text

Home

Products

Wholesale

Custom Solutions

About

Blog

Contact

```



Right-side CTA:



```text

Start a Project

```



\### 5. Add Footer Columns



Footer columns:



```text

Brand

Products

B2B Cooperation

Customer Support

Legal

```



\## Day 2 Definition of Done



Day 2 is complete when:



\- Header appears.

\- Footer appears.

\- Homepage renders all section placeholders.

\- Navigation matches the sitemap.

\- Page is responsive at a basic level.



\---



\# 9. Day 3 Detailed Plan



\## Goal



Build the upper homepage sections and confirm visual direction.



\## Sections to Build



\### 1. HomeHero



Must include:



\- Headline

\- Subheadline

\- Primary CTA: Explore Products

\- Secondary CTA: Start a Project

\- Product visual placeholder

\- Premium brand feel



Use this copy:



```text

Build Creative Worlds with JIESTAR

```



Subheadline:



```text

Factory-direct building block sets and custom product solutions for global retailers, ecommerce sellers, brand partners, and collectors.

```



\### 2. BrandStrength



Must include four cards:



```text

Founded in 1998

Factory-Direct Supply

Custom Product Development

Long-Term Brand Partnership

```



\### 3. ProductCategories



Must include:



```text

Technic Vehicles

Super Cars

Military Models

Trains

Architecture

Pirate Ships

Book Nooks

Educational Blocks

```



\## Day 3 Definition of Done



Day 3 is complete when:



\- Hero section looks like a premium international brand website.

\- Brand strength section clearly communicates trust.

\- Product categories are visible and structured.

\- Mobile layout is acceptable.

\- No unnecessary dependencies are added.



\---



\# 10. Day 4 Detailed Plan



\## Goal



Build the commercial conversion sections.



\## Sections to Build



\### 1. FeaturedProducts



Use placeholder products first.



Each product card should include:



\- Product image placeholder

\- Product name

\- Category

\- Price placeholder

\- One-sentence selling point

\- View Product button



Recommended number:



```text

4 to 8 products

```



\### 2. B2BCooperation



Must include the heading:



```text

More Than Wholesale. Build Products with JIESTAR.

```



Must include four cooperation cards:



```text

Wholesale Supply

OEM / ODM Customization

Product Co-Development

Sub-Brand Partnership

```



\### 3. CustomSolutions



Must include:



```text

Product Concept

Custom Design

Packaging Solution

Exclusive SKU

Sub-Brand Cooperation

Long-Term Product Development

```



\## Day 4 Definition of Done



Day 4 is complete when:



\- DTC shopping path is visible.

\- B2B wholesale path is visible.

\- Custom cooperation path is visible.

\- Sub-brand partnership is clearly mentioned.

\- CTA buttons guide users to Products and Custom Solutions.



\---



\# 11. Day 5 Detailed Plan



\## Goal



Complete the rest of the homepage.



\## Sections to Build



\### 1. QualitySafety



Must include:



```text

Material safety

Stable clutch power

Product inspection

International market compliance

Missing piece support

Customer service support

```



\### 2. BrandStory



Must include:



```text

Founded in 1998

Guangdong Jiexing Toys Industrial Co., Ltd.

Product development, production, and sales

Long-term cooperation with global partners

```



\### 3. BlogPreview



Must include article placeholders:



```text

How to Choose High-Quality Building Block Sets

Wholesale Building Blocks: A Guide for Retailers

OEM vs ODM Building Blocks: What Business Buyers Should Know

```



\### 4. FinalCTA



Must include:



```text

Looking for Reliable Building Block Products or Custom Solutions?

```



CTA buttons:



```text

Explore Products

Start a Project

```



\## Day 5 Definition of Done



Day 5 is complete when:



\- All homepage sections are implemented.

\- Homepage tells a complete brand and conversion story.

\- B2B and DTC paths are clear.

\- Final CTA is visible and strong.



\---



\# 12. Day 6 Detailed Plan



\## Goal



Improve design quality and responsiveness.



\## Tasks



\### 1. Responsive Review



Check:



\- Mobile layout

\- Tablet layout

\- Desktop layout

\- Header behavior

\- Product card grid

\- CTA button layout

\- Section spacing



\### 2. Visual Review



Improve:



\- Typography

\- Spacing

\- Background sections

\- Card consistency

\- Button consistency

\- Image placeholder consistency

\- Visual hierarchy



\### 3. Technical Check



Run:



```bash

pnpm lint

pnpm build

```



Fix any errors.



\## Day 6 Definition of Done



Day 6 is complete when:



\- Homepage works on mobile and desktop.

\- Visual hierarchy is clear.

\- `pnpm build` passes.

\- No obvious layout problems remain.



\---



\# 13. Day 7 Detailed Plan



\## Goal



Review, refine, and prepare for Week 2.



\## Tasks



\### 1. Codex Review



Ask Codex to review the current homepage.



Use this prompt:



```text

Review the current homepage implementation for the JIESTAR global website.



Focus on:

\- TypeScript correctness

\- Component structure

\- Tailwind consistency

\- Mobile responsiveness

\- SEO basics

\- Whether the visual direction matches a premium international building block brand

\- Whether B2B and DTC paths are both clear

\- Whether Custom Solutions, product co-development, and sub-brand partnership are properly communicated



Do not rewrite the whole page.

Only suggest targeted improvements.

```



\### 2. Apply Targeted Improvements



Apply only high-value suggestions.



Do not rebuild the whole homepage.



\### 3. Update README



README should include:



\- Project name

\- Project goal

\- Tech stack

\- Development commands

\- Documentation list

\- Version 1 scope



\### 4. Optional Vercel Preview



If local build passes, deploy a preview to Vercel.



\## Day 7 Definition of Done



Day 7 is complete when:



\- Codex review is completed.

\- Key improvements are applied.

\- README is updated.

\- `pnpm build` passes.

\- Project is ready for Week 2.



\---



\# 14. Claude Code Task Prompts for Week 1



\## Day 2 Prompt: Build Base Layout



```text

You are working on the JIESTAR global website.



Project goal:

Build an international, premium, maintainable building block brand website that supports DTC shopping and B2B cooperation, including wholesale, OEM/ODM, product co-development, and sub-brand partnership.



Current task:

Create the base layout, header, footer, and homepage section structure.



Read these docs first:

\- docs/01-jiestar-website-requirements.md

\- docs/02-jiestar-sitemap.md

\- docs/03-jiestar-homepage-structure.md

\- docs/04-ai-development-rules.md

\- docs/05-first-week-action-plan.md



Allowed files:

\- app/page.tsx

\- components/layout/Header.tsx

\- components/layout/Footer.tsx

\- components/sections/\*.tsx



Requirements:

\- Use Next.js + TypeScript + Tailwind CSS.

\- Write English website copy.

\- Main navigation: Home, Products, Wholesale, Custom Solutions, About, Blog, Contact.

\- Header CTA: Start a Project.

\- Footer should include Brand, Products, B2B Cooperation, Customer Support, and Legal columns.

\- Create placeholder homepage sections in the correct order.

\- Mobile responsive.

\- Do not add new dependencies.



Definition of done:

\- Homepage renders all sections.

\- Header and footer render correctly.

\- No TypeScript errors.

\- No unnecessary dependencies added.

\- Summarize changed files after completion.

```



\---



\## Day 3 Prompt: Build Hero, Brand Strength, and Categories



```text

You are working on the JIESTAR global website.



Current task:

Build the top homepage sections:

1\. HomeHero

2\. BrandStrength

3\. ProductCategories



Allowed files:

\- app/page.tsx

\- components/sections/HomeHero.tsx

\- components/sections/BrandStrength.tsx

\- components/sections/ProductCategories.tsx



Requirements:

\- Use a premium, clean, international visual direction.

\- Do not make the design childish.

\- Hero headline: Build Creative Worlds with JIESTAR

\- Hero subheadline: Factory-direct building block sets and custom product solutions for global retailers, ecommerce sellers, brand partners, and collectors.

\- Hero CTAs: Explore Products and Start a Project.

\- Brand cards: Founded in 1998, Factory-Direct Supply, Custom Product Development, Long-Term Brand Partnership.

\- Product categories: Technic Vehicles, Super Cars, Military Models, Trains, Architecture, Pirate Ships, Book Nooks, Educational Blocks.

\- Mobile responsive.

\- Do not add new dependencies.



Definition of done:

\- Top homepage sections are implemented.

\- Layout works on mobile and desktop.

\- Design direction feels premium and international.

\- Summarize changed files after completion.

```



\---



\## Day 4 Prompt: Build Featured Products and B2B Sections



```text

You are working on the JIESTAR global website.



Current task:

Build the commercial homepage sections:

1\. FeaturedProducts

2\. B2BCooperation

3\. CustomSolutions



Allowed files:

\- app/page.tsx

\- components/sections/FeaturedProducts.tsx

\- components/sections/B2BCooperation.tsx

\- components/sections/CustomSolutions.tsx



Requirements:

\- FeaturedProducts should use placeholder products for now.

\- B2BCooperation heading: More Than Wholesale. Build Products with JIESTAR.

\- B2BCooperation must include Wholesale Supply, OEM / ODM Customization, Product Co-Development, and Sub-Brand Partnership.

\- CustomSolutions must mention Product Concept, Custom Design, Packaging Solution, Exclusive SKU, Sub-Brand Cooperation, and Long-Term Product Development.

\- Clearly separate DTC shopping and B2B cooperation paths.

\- Mobile responsive.

\- Do not add Shopify yet.

\- Do not add new dependencies.



Definition of done:

\- Featured product cards render correctly.

\- B2B cooperation path is clear.

\- Custom Solutions path is clear.

\- Sub-brand partnership is clearly mentioned.

\- Summarize changed files after completion.

```



\---



\## Day 5 Prompt: Complete Homepage Sections



```text

You are working on the JIESTAR global website.



Current task:

Complete the remaining homepage sections:

1\. QualitySafety

2\. BrandStory

3\. BlogPreview

4\. FinalCTA



Allowed files:

\- app/page.tsx

\- components/sections/QualitySafety.tsx

\- components/sections/BrandStory.tsx

\- components/sections/BlogPreview.tsx

\- components/sections/FinalCTA.tsx



Requirements:

\- QualitySafety should mention material safety, stable clutch power, product inspection, international market compliance, missing piece support, and customer service support.

\- BrandStory should mention JIESTAR was founded in 1998 and Guangdong Jiexing Toys Industrial Co., Ltd. integrates product development, production, and sales.

\- BlogPreview should include both DTC and B2B article topics.

\- FinalCTA heading: Looking for Reliable Building Block Products or Custom Solutions?

\- FinalCTA buttons: Explore Products and Start a Project.

\- Mobile responsive.

\- Do not add new dependencies.



Definition of done:

\- Full homepage is complete.

\- Brand story is clear.

\- Quality trust points are clear.

\- Final CTA is strong.

\- Summarize changed files after completion.

```



\---



\# 15. Codex Review Prompt for Week 1



Use this after the static homepage is completed.



```text

Review the current Week 1 implementation of the JIESTAR global website.



Project goal:

Build an international, premium, maintainable building block brand website that supports DTC shopping and B2B cooperation, including wholesale, OEM/ODM, product co-development, and sub-brand partnership.



Please review:

\- TypeScript correctness

\- Component structure

\- Tailwind CSS consistency

\- Mobile responsiveness

\- SEO basics

\- Accessibility basics

\- Visual hierarchy

\- Whether the design feels premium and international

\- Whether the site avoids a cheap factory or dropshipping style

\- Whether DTC shopping path is clear

\- Whether B2B wholesale path is clear

\- Whether Custom Solutions, product co-development, and sub-brand partnership are clearly communicated

\- Whether the implementation is maintainable by one person



Do not rewrite the whole project.

Only provide targeted issues and recommended fixes.

Prioritize the most important 10 improvements.

```



\---



\# 16. Week 1 Final Checklist



Before ending Week 1, confirm:



\- \[ ] Next.js project runs locally.

\- \[ ] Git repository exists.

\- \[ ] Documentation files are complete.

\- \[ ] Header is implemented.

\- \[ ] Footer is implemented.

\- \[ ] Homepage Hero is implemented.

\- \[ ] Brand Strength section is implemented.

\- \[ ] Product Categories section is implemented.

\- \[ ] Featured Products section is implemented.

\- \[ ] B2B Cooperation section is implemented.

\- \[ ] Custom Solutions section is implemented.

\- \[ ] Quality \& Safety section is implemented.

\- \[ ] Brand Story section is implemented.

\- \[ ] Blog Preview section is implemented.

\- \[ ] Final CTA section is implemented.

\- \[ ] Mobile layout is acceptable.

\- \[ ] Desktop layout is acceptable.

\- \[ ] B2B and DTC paths are clear.

\- \[ ] Sub-brand partnership is mentioned clearly.

\- \[ ] `pnpm lint` passes.

\- \[ ] `pnpm build` passes.

\- \[ ] README is updated.

\- \[ ] Project is ready for Week 2.

