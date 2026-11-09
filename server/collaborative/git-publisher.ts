import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function resolveSectionDir(baseDir: string, section: string): string {
  const normalized = section.trim();
  const candidates = [
    normalized,
    normalized.replace(/-/g, " "),
    normalized.replace(/\s+/g, "-"),
    slugify(normalized),
  ];

  for (const candidate of candidates) {
    const candidatePath = path.join(baseDir, candidate);
    if (fs.existsSync(candidatePath) && fs.statSync(candidatePath).isDirectory()) {
      return candidatePath;
    }
  }

  // Fallback: create slugified or raw candidate
  const fallback = path.join(baseDir, normalized.includes(" ") ? normalized : slugify(normalized));
  fs.mkdirSync(fallback, { recursive: true });
  return fallback;
}

function resolveCategoryDir(sectionDir: string, category: string): string {
  const normalized = category.trim();
  const candidates = [
    normalized,
    slugify(normalized),
    normalized.replace(/\s+/g, "-").toLowerCase(),
  ];

  for (const candidate of candidates) {
    const candidatePath = path.join(sectionDir, candidate);
    if (fs.existsSync(candidatePath) && fs.statSync(candidatePath).isDirectory()) {
      return candidatePath;
    }
  }

  const fallback = path.join(sectionDir, slugify(normalized) || "general");
  fs.mkdirSync(fallback, { recursive: true });
  return fallback;
}

export type PublishResult = {
  filePath: string;
  relativePath: string;
  gitCommitted: boolean;
  gitPushed: boolean;
  gitMessage?: string;
  error?: string;
};

export async function publishDocumentToFileAndGit(doc: {
  title: string;
  category: string;
  section: string;
  content: string;
  description?: string | null;
  documentId: string;
}): Promise<PublishResult> {
  const contentBase = path.resolve(process.cwd(), "client/src/content");
  if (!fs.existsSync(contentBase)) {
    fs.mkdirSync(contentBase, { recursive: true });
  }

  const sectionDir = resolveSectionDir(contentBase, doc.section);
  const categoryDir = resolveCategoryDir(sectionDir, doc.category);

  const fileSlug = slugify(doc.title) || doc.documentId;
  const targetFile = path.join(categoryDir, `${fileSlug}.mdx`);
  const relativePath = path.relative(process.cwd(), targetFile);

  // Prepare MDX content with frontmatter if not present
  let mdxContent = doc.content.trim();
  if (!mdxContent.startsWith("---")) {
    const frontmatter = [
      "---",
      `title: ${JSON.stringify(doc.title)}`,
      `section: ${JSON.stringify(doc.section)}`,
      `category: ${JSON.stringify(doc.category)}`,
      `description: ${JSON.stringify(doc.description || doc.title)}`,
      "---",
      "",
      "",
    ].join("\n");
    mdxContent = `${frontmatter}${mdxContent}\n`;
  } else if (!mdxContent.endsWith("\n")) {
    mdxContent += "\n";
  }

  // 1. Write file to filesystem
  fs.writeFileSync(targetFile, mdxContent, "utf8");

  let gitCommitted = false;
  let gitPushed = false;
  let gitMessage = "";

  // 2. Perform git add, commit, and push
  try {
    await execAsync(`git add "${relativePath}"`);

    // Check if there are changes staged
    try {
      await execAsync("git diff --cached --quiet");
      gitMessage = "File content is already up-to-date in repository.";
    } catch {
      // Differences exist, commit them
      const commitMsg = `docs(${doc.section}): publish "${doc.title}"`;
      await execAsync(`git commit -m "${commitMsg.replace(/"/g, '\\"')}"`);
      gitCommitted = true;
      gitMessage = `Committed as: ${commitMsg}`;
    }

    // Push changes to origin
    try {
      const { stdout, stderr } = await execAsync("git push origin HEAD", { timeout: 20000 });
      gitPushed = true;
      gitMessage += ` | Pushed to GitHub: ${stdout || stderr || "OK"}`;
    } catch (pushErr: any) {
      gitMessage += ` | Git push notice: ${pushErr.message}`;
    }
  } catch (err: any) {
    return {
      filePath: targetFile,
      relativePath,
      gitCommitted,
      gitPushed,
      gitMessage,
      error: `Git operation failed: ${err.message}`,
    };
  }

  return {
    filePath: targetFile,
    relativePath,
    gitCommitted,
    gitPushed,
    gitMessage,
  };
}

