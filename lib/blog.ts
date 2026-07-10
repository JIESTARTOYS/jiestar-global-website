import fs from "node:fs";
import path from "node:path";

export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  category: string;
  date: string;
  updatedAt?: string;
  coverImage: string;
  coverAlt: string;
  readingMinutes: number;
  content: string;
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
  return getBlogPosts()
    .filter((candidate) => candidate.slug !== post.slug)
    .sort((a, b) => {
      const aCategoryMatch = a.category === post.category ? 1 : 0;
      const bCategoryMatch = b.category === post.category ? 1 : 0;

      if (aCategoryMatch !== bCategoryMatch) {
        return bCategoryMatch - aCategoryMatch;
      }

      return b.date.localeCompare(a.date);
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
