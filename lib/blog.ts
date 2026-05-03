import fs from "node:fs";
import path from "node:path";

export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  category: string;
  date: string;
  content: string;
};

const blogDirectory = path.join(process.cwd(), "content/blog");

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
