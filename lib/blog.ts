import fs from "node:fs";
import path from "node:path";

export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  category: string;
  date: string;
  updatedAt?: string;
  eventName?: string;
  eventStartDate?: string;
  eventEndDate?: string;
  eventLocation?: string;
  coverImage: string;
  coverAlt: string;
  readingMinutes: number;
  content: string;
};

export const BLOG_SECTION_SLUGS = [
  "jiestar-news",
  "new-releases",
  "build-and-collect",
  "business-insights",
] as const;

export type BlogSectionSlug = (typeof BLOG_SECTION_SLUGS)[number];

export type BlogSectionConfig = {
  slug: BlogSectionSlug;
  title: string;
  navigationLabel: string;
  description: string;
  categories: readonly string[];
};

export const BLOG_SECTIONS: Record<BlogSectionSlug, BlogSectionConfig> = {
  "jiestar-news": {
    slug: "jiestar-news",
    title: "JIESTAR News",
    navigationLabel: "News",
    description: "Company stories, international exhibitions, and field notes from the JIESTAR team.",
    categories: ["Company News", "Exhibitions"],
  },
  "new-releases": {
    slug: "new-releases",
    title: "New Releases",
    navigationLabel: "New Releases",
    description: "Recently added building block sets, product families, and new directions across the JIESTAR portfolio.",
    categories: ["New Releases"],
  },
  "build-and-collect": {
    slug: "build-and-collect",
    title: "Build & Collect",
    navigationLabel: "Build & Collect",
    description: "Practical guidance for choosing, building, displaying, and caring for building block models.",
    categories: ["Building Guides"],
  },
  "business-insights": {
    slug: "business-insights",
    title: "Business Insights",
    navigationLabel: "For Business",
    description: "Wholesale sourcing, OEM / ODM development, packaging, and product-line planning for global partners.",
    categories: ["Wholesale Tips", "Custom Solutions"],
  },
};

export type MarkdownInline =
  | {
      type: "text";
      text: string;
    }
  | {
      type: "link";
      text: string;
      href: string;
    };

export type MarkdownBlock =
  | {
      type: "heading";
      level: 2 | 3;
      text: string;
    }
  | {
      type: "paragraph";
      children: MarkdownInline[];
    }
  | {
      type: "list";
      items: string[];
    }
  | {
      type: "image";
      src: string;
      alt: string;
      caption?: string;
    };

const blogDirectory = path.join(process.cwd(), "content/blog");

function calculateReadingMinutes(content: string) {
  const wordCount = content
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[#*_`>-]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  return Math.max(1, Math.ceil(wordCount / 200));
}

function parsePost(fileContent: string, slug: string): BlogPost {
  const match = fileContent.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  const frontmatter = match?.[1] ?? "";
  const content = match?.[2] ?? fileContent;
  const fields = Object.fromEntries(
    frontmatter
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const [key, ...value] = line.split(":");
        return [key.trim(), value.join(":").trim().replace(/^"|"$/g, "")];
      }),
  ) as Record<string, string>;

  return {
    slug,
    title: fields.title ?? slug,
    description: fields.description ?? "",
    category: fields.category ?? "Guides",
    date: fields.date ?? "",
    updatedAt: fields.updatedAt || undefined,
    eventName: fields.eventName || undefined,
    eventStartDate: fields.eventStartDate || undefined,
    eventEndDate: fields.eventEndDate || undefined,
    eventLocation: fields.eventLocation || undefined,
    coverImage: fields.coverImage ?? "",
    coverAlt: fields.coverAlt ?? "",
    readingMinutes: calculateReadingMinutes(content),
    content,
  };
}

export function getBlogPosts(): BlogPost[] {
  if (!fs.existsSync(blogDirectory)) {
    return [];
  }

  return fs
    .readdirSync(blogDirectory)
    .filter((fileName) => fileName.endsWith(".md"))
    .map((fileName) => {
      const slug = fileName.replace(/\.md$/, "");
      const fileContent = fs.readFileSync(path.join(blogDirectory, fileName), "utf8");
      return parsePost(fileContent, slug);
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function getBlogPost(slug: string) {
  return getBlogPosts().find((post) => post.slug === slug);
}

export function getBlogSection(slug: string) {
  return BLOG_SECTION_SLUGS.includes(slug as BlogSectionSlug)
    ? BLOG_SECTIONS[slug as BlogSectionSlug]
    : undefined;
}

export function getBlogSectionForPost(post: BlogPost) {
  return BLOG_SECTION_SLUGS.find((slug) => BLOG_SECTIONS[slug].categories.includes(post.category));
}

export function getBlogContentDate(post: BlogPost) {
  return post.eventStartDate ?? post.date;
}

export function getBlogSectionPosts(slug: BlogSectionSlug) {
  const section = BLOG_SECTIONS[slug];

  return getBlogPosts()
    .filter((post) => section.categories.includes(post.category))
    .sort((a, b) => {
      const dateComparison = getBlogContentDate(b).localeCompare(getBlogContentDate(a));

      return dateComparison || a.title.localeCompare(b.title);
    });
}

export function getExhibitionPosts() {
  return getBlogPosts()
    .filter((post) => post.category === "Exhibitions" && post.eventStartDate)
    .sort((a, b) => (b.eventStartDate ?? "").localeCompare(a.eventStartDate ?? ""));
}

export function formatBlogDate(value: string) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

export function getRelatedBlogPosts(post: BlogPost, limit = 3) {
  const postSection = getBlogSectionForPost(post);

  return getBlogPosts()
    .filter((candidate) => candidate.slug !== post.slug)
    .sort((a, b) => {
      const aCategoryMatch = a.category === post.category ? 1 : 0;
      const bCategoryMatch = b.category === post.category ? 1 : 0;
      const aSectionMatch = getBlogSectionForPost(a) === postSection ? 1 : 0;
      const bSectionMatch = getBlogSectionForPost(b) === postSection ? 1 : 0;

      if (aSectionMatch !== bSectionMatch) {
        return bSectionMatch - aSectionMatch;
      }

      if (aCategoryMatch !== bCategoryMatch) {
        return bCategoryMatch - aCategoryMatch;
      }

      return getBlogContentDate(b).localeCompare(getBlogContentDate(a));
    })
    .slice(0, limit);
}

export function parseInlineMarkdown(text: string): MarkdownInline[] {
  const parts: MarkdownInline[] = [];
  const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = linkPattern.exec(text))) {
    if (match.index > cursor) {
      parts.push({ type: "text", text: text.slice(cursor, match.index) });
    }

    parts.push({ type: "link", text: match[1], href: match[2] });
    cursor = match.index + match[0].length;
  }

  if (cursor < text.length) {
    parts.push({ type: "text", text: text.slice(cursor) });
  }

  return parts.length ? parts : [{ type: "text", text }];
}

export function parseMarkdownBlocks(markdown: string): MarkdownBlock[] {
  const blocks: MarkdownBlock[] = [];
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  let paragraph: string[] = [];
  let listItems: string[] = [];

  function flushParagraph() {
    if (!paragraph.length) {
      return;
    }

    blocks.push({
      type: "paragraph",
      children: parseInlineMarkdown(paragraph.join(" ")),
    });
    paragraph = [];
  }

  function flushList() {
    if (!listItems.length) {
      return;
    }

    blocks.push({
      type: "list",
      items: listItems,
    });
    listItems = [];
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    const headingMatch = line.match(/^(#{2,3})\s+(.+)$/);

    if (headingMatch) {
      flushParagraph();
      flushList();
      blocks.push({
        type: "heading",
        level: headingMatch[1].length as 2 | 3,
        text: headingMatch[2].trim(),
      });
      continue;
    }

    const imageMatch = line.match(/^!\[([^\]]+)\]\((\/images\/\S+?)(?:\s+"([^"]+)")?\)$/);

    if (imageMatch) {
      flushParagraph();
      flushList();
      blocks.push({
        type: "image",
        src: imageMatch[2],
        alt: imageMatch[1].trim(),
        caption: imageMatch[3]?.trim() || undefined,
      });
      continue;
    }

    const listMatch = line.match(/^[-*]\s+(.+)$/);

    if (listMatch) {
      flushParagraph();
      listItems.push(listMatch[1].trim());
      continue;
    }

    flushList();
    paragraph.push(line);
  }

  flushParagraph();
  flushList();

  return blocks;
}
