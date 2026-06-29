---
name: catalog-design
description: Use when creating product catalogs, brand brochures, distributor brochures, trade show brochures, product detail sheets, wholesale catalogs, Canva/Figma/PPT/PDF catalog structures, or polished B2B sales materials for building block, toy, model, gift, or children's product brands.
---

# Catalog Design

## Purpose

Use this skill to turn product materials, SKU tables, product images, brand information, and sales requirements into a polished overseas product catalog or commercial brochure. The output should help global distributors, wholesale buyers, agents, trade show visitors, and retail partners understand the brand, product line, and cooperation path quickly.

The default mindset is professional overseas product catalog designer, not ecommerce listing writer. The result must feel premium, clean, commercial, trustworthy, and suitable for toy, building block, model, children's product, and gift brands.

## Invocation

Primary command:

- `/catalog-design`

Supported aliases:

- `/product-catalog`
- `/brochure-design`
- `/画册设计`
- `/产品画册`
- `/招商画册`

When any alias is used, follow this skill before generating catalog copy, layouts, PPT/PDF structures, Canva structures, Figma structures, or HTML catalog pages.

## Catalog Types

Support these deliverables:

- Product Catalog
- Brand Brochure
- Distributor Brochure
- Trade Show Brochure
- New Arrival Catalog
- Product Detail Sheet
- B2B Wholesale Catalog
- PDF product directory
- PPTX catalog structure
- Canva editable page structure
- Figma page structure
- Markdown catalog outline
- HTML catalog page
- A4 print catalog
- 16:9 presentation catalog
- Square social preview catalog

## Visual Direction

Design for overseas B2B and premium retail contexts.

The catalog should be:

- Premium, clean, modern, and commercial
- Product-image led, with text used to support buying decisions
- Structured with generous whitespace and consistent grids
- Easy for distributors and trade show buyers to scan
- Suitable for European and North American business audiences
- Professional enough for wholesale negotiation, OEM/ODM discussion, and brand partnership

Use international toy and model brand catalog standards as reference points for hierarchy, product clarity, and production polish. Do not copy layouts, logos, trade dress, proprietary assets, or brand language from LEGO, Mattel, Bandai, Mega Bloks, Mould King, or any other brand.

Avoid:

- Taobao detail-page styling
- Crowded Chinese ecommerce promotion design
- Cheap discount-heavy graphics
- Overly childish visual language
- Excessive glow, lens flare, saturation, gradients, or AI-looking imagery
- Busy backgrounds that compete with products
- Long blocks of machine-translated English

## Default Sizes

Choose the format that matches the requested use case:

- A4 Vertical: default for PDF and print catalogs
- 16:9 Horizontal: default for presentation decks, trade show screens, and PPTX
- Square: default for social preview images and compact promotional previews

For print work, include safe margins and bleed notes when relevant. For presentation work, prioritize screen readability and stronger hero imagery.

## Typography

English-first font options:

- Montserrat
- Poppins
- Inter
- Helvetica
- Roboto

Chinese fallback options:

- Noto Sans SC
- Source Han Sans / 思源黑体
- Alibaba PuHuiTi / 阿里巴巴普惠体

Use a clean sans-serif system. Keep heading hierarchy clear. Avoid decorative fonts unless the user explicitly asks for a themed campaign.

## Color System

If brand colors are provided, use them conservatively.

If brand colors are missing, default to:

- White
- Light Gray
- Dark Navy
- Black
- One controlled accent color: Yellow, Red, or Blue depending on product category and brand tone

Do not overuse vivid accents. Product images should carry most of the visual energy.

## Image Rules

Use real product assets whenever available.

Image placement:

- White-background product images: product listing pages and SKU grids
- Scene images: cover pages and category pages
- Packaging images: product detail pages
- Detail images: feature and selling-point pages
- Factory or production images: brand/company capability pages, only when provided

Do not:

- Invent product appearances
- Change real product color, shape, structure, or packaging
- Generate fake product photos when real images are required
- Use obvious AI-style images for actual product representation
- Use unauthorized brand logos or third-party IP

If images are missing, mark them explicitly as `[Product Image Placeholder]`, `[Scene Image Placeholder]`, `[Packaging Image Placeholder]`, or `[Detail Image Placeholder]`.

## Copywriting Rules

Write English copy that is natural, concise, commercial, and suitable for overseas buyers. It should not read like machine translation.

Good tone:

> This model features a detailed structure, rich building experience, and display-friendly design, making it suitable for both retail shelves and gift markets.

Avoid:

> Amazing! Super cool! Best gift ever! Hot sale! Must buy!

Use product names naturally. Terms may include:

- Building Block Set
- Construction Toy Set
- Creative Brick Set
- Vehicle Building Set
- Military Building Block Set
- City Building Toy Set
- Display Model
- Gift Market
- Retail Shelf
- Wholesale Program
- OEM / ODM Customization
- Product Co-Development
- Private Label Support
- Exclusive SKU
- Exclusive Product Line
- Distributor Cooperation

Do not mechanically repeat "Building Block Set" in every title. Adapt to the product category.

## Required Workflow

### Step 1: Read Product Materials

Extract only what is present or clearly supplied:

- SKU
- Product Name
- Pieces
- Recommended Age
- Product Size
- Package Size
- Category
- Price, if supplied
- MOQ, if supplied
- Carton Info, if supplied
- Product Images
- Packaging Images
- Detail Images

### Step 2: Organize Products

Group products using available data:

- By series or product category
- By price band
- By piece count
- By age range
- By new arrivals or featured SKUs

If category is not supplied, infer from product name or SKU only when useful, and mark it as `inferred category`.

### Step 3: Generate Catalog Structure

Use a professional sequence:

1. Cover
2. Table of Contents
3. Brand Introduction
4. Category Pages
5. Product Listing Pages
6. Featured Product Detail Pages
7. Distributor / Wholesale Cooperation Page
8. Contact Page

Adjust the sequence only when the requested deliverable requires it, such as a single product sheet or trade show one-pager.

### Step 4: Define Visual System

Specify:

- Page size
- Grid system
- Margins
- Fonts
- Color palette
- Image ratios
- Heading hierarchy
- Product card style
- Icon style, if any
- Spacing rules

### Step 5: Generate Page Content

For each page, provide:

- Page title
- Layout description
- English copy
- Product card content
- Selling points
- Image requirements
- Placeholder labels for missing materials

### Step 6: Output Target Format

Adapt the structure to the requested output:

- PPTX: slide-by-slide structure with editable text and image placeholders
- PDF: print-aware page plan with margins and reading sequence
- Canva: editable modules per page with layer names and placeholder guidance
- Figma: frames, sections, component naming, layout grids, and reusable card components
- Markdown: clean outline that can later be converted to PDF, PPT, or web
- HTML: semantic sections, clean CSS, responsive layout, and real image placeholders
- A4 Print: print margins, bleed notes, cover/back-cover logic
- 16:9 Presentation: stronger hero pages, larger type, simpler product grids

## Page Requirements

### Cover Page

Must include:

- Brand Logo
- Brand Name
- Catalog Title
- Year / Season
- Hero Product Image
- Concise brand slogan

Recommended title examples:

- 2026 Product Catalog
- Building Block Sets Collection
- Creative Building Toys for Global Distributors

### Brand Introduction

Include only verified or provided information:

- Company Profile
- Brand Story
- Product Categories
- Factory Strength
- OEM / ODM Ability
- Quality Control
- Global Wholesale Support

Keep the tone professional and restrained. If brand or factory details are missing, create fillable placeholders instead of inventing facts.

### Category Page

Example categories:

- Military Series
- City Series
- Vehicle Series
- Technic Series
- Architecture Series
- Creator Series
- Space Series
- Dinosaur Series
- Girls Series
- Mini Blocks Series

Each category page needs:

- Category title
- One short introduction
- Representative product image
- Clean visual division from other categories

### Product Listing Page

Use one consistent card system per catalog.

Each product card may include:

- Product Image
- SKU
- Product Name
- Pieces
- Recommended Age
- Product Size
- Package Size
- Carton Info, if supplied
- MOQ, if supplied

Layout:

- 4 products per page for image-led or information-heavy catalogs
- 6 products per page for balanced B2B catalogs
- 8 products per page only when images and data are compact

Never squeeze text until the page feels crowded. Keep image ratios consistent.

### Product Detail Page

Use for priority SKUs and hero products.

Include:

- Large product image
- Detail images
- Packaging image
- Product name
- SKU
- Pieces
- Recommended Age
- Product Size
- Package Size
- Features
- Selling Points
- Short Description

Acceptable layouts:

- Large image on the left, information on the right
- Hero image at top, specifications below
- Magazine-style large image layout with controlled text blocks

### Distributor / Wholesale Page

Content may include:

- Wholesale Supply
- OEM / ODM Service
- Private Label Support
- Stable Production Capacity
- Fast Delivery
- Product Customization
- Global Distributor Cooperation

Use a calm B2B tone. Do not write like a domestic investment-franchise advertisement.

### Contact Page

Include:

- Website
- Email
- WhatsApp
- Phone
- Address
- QR Code placeholder
- Social Media

Use placeholders when contact details are missing: `[Website]`, `[Email]`, `[WhatsApp]`, `[Phone]`, `[Address]`.

## Missing Information Rules

Never hide missing data.

- Missing product image: `[Product Image Placeholder]`
- Missing pieces: `[Missing: Pieces]`
- Missing age: `[Missing: Recommended Age]`
- Missing size: `[Missing: Product Size]`
- Missing package size: `[Missing: Package Size]`
- Missing MOQ: omit if not necessary, or mark `[Missing: MOQ]` for wholesale pages
- Missing brand introduction: create a fillable brand profile template
- Missing contact details: use `[Website]`, `[Email]`, `[WhatsApp]`
- Missing category: infer only when helpful and label as `inferred category`

## Prohibited Content

Do not:

- Fabricate product parameters
- Fabricate certifications
- Fabricate factory size, production capacity, export markets, or client names
- Claim official LEGO authorization
- Say "compatible with LEGO" unless the user has explicitly approved the legal wording
- Use the LEGO logo or any unauthorized brand logo
- Use unauthorized brand terms as main titles
- Present third-party IP as owned by the user
- Create low-end promotion pages
- Overload a page with text
- Put too much information on one page
- Use obvious AI-style product images
- Change the real product appearance
- Make unverified safety, age, or compliance claims

## Default Output For A General Request

When the user says something like:

> `/catalog-design 帮我生成一份 2026 产品画册`

Return:

1. Catalog Positioning
2. Page Directory
3. Page-by-Page Design Notes
4. Page-by-Page English Copy
5. Product Information Layout Rules
6. Image Requirement List
7. Structured Content Hand-Off for a designer or AI tool to generate PPT/PDF/Canva/Figma output

If product data is not supplied, create a professional fillable structure and clearly mark all placeholders.

## Recommended Response Shape

Use this order unless the user asks for a specific file format:

```md
# Catalog Positioning

# Recommended Format

# Page Directory

# Visual System

# Page-by-Page Content

# Product Card System

# Image Requirement List

# Missing Information

# Next Input Needed
```

For very large SKU sets, summarize the rules first and generate a repeatable page system instead of manually writing hundreds of cards inline.

## Quality Bar

Before finalizing, check:

- Does the catalog feel premium and international?
- Is it readable for overseas B2B buyers?
- Are product images the center of the page?
- Are all missing facts clearly marked?
- Are risky IP or certification claims avoided?
- Is the English natural and restrained?
- Can a designer, Canva user, Figma user, or AI tool continue from the structure without guessing?
