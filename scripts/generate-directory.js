#!/usr/bin/env node
/**
 * Generate a Project Directory list in README.md between the markers:
 * <!-- PROJECT-DIRECTORY:START -->
 * <!-- PROJECT-DIRECTORY:END -->
 *
 * It groups projects by their parent folder (e.g., solana/my-app -> category "solana"),
 * attempts to extract the first H1 from each project's README.md for display text,
 * and falls back to the folder name when a title is missing.
 *
 * Descriptions are pulled from package.json "description" when available.
 */

const fs = require("fs");
const path = require("path");

const REPO_ROOT = path.resolve(__dirname, "..");
const README_PATH = path.join(REPO_ROOT, "README.md");

const START_MARK = "<!-- PROJECT-DIRECTORY:START -->";
const END_MARK = "<!-- PROJECT-DIRECTORY:END -->";

const IGNORE = new Set([
  ".git",
  ".github",
  ".idea",
  ".vscode",
  ".next",
  ".turbo",
  ".cache",
  ".claude",
  "node_modules",
  "dist",
  "build",
  ".DS_Store",
  "Scripts",
  "scripts",
]);

/**
 * Manual overrides for category display names.
 * Add entries here for categories that need special formatting.
 */
const CATEGORY_OVERRIDES = {
  AI: "AI",
  api: "API",
  defi: "DeFi",
  nft: "NFT",
  "sample-dapps": "Sample dApps",
  "console-api": "Console API",
  "enhanced-apis": "Enhanced APIs",
};

/**
 * Format a category name for display.
 * Uses manual overrides first, then falls back to Title Case.
 */
function formatCategory(name) {
  if (CATEGORY_OVERRIDES[name]) {
    return CATEGORY_OVERRIDES[name];
  }

  // Default: Title Case with hyphen-to-space conversion
  return name
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function readDirNames(dir) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !IGNORE.has(entry.name))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));
}

function findReadme(dirPath) {
  const candidates = ["README.md", "readme.md", "Readme.md"];
  for (const file of candidates) {
    const p = path.join(dirPath, file);
    if (fs.existsSync(p) && fs.statSync(p).isFile()) {
      return p;
    }
  }
  return null;
}

function extractTitle(dirPath, fallback) {
  const readmePath = findReadme(dirPath);
  if (!readmePath) return fallback;

  const content = fs.readFileSync(readmePath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("# ")) {
      return trimmed.replace(/^#\s+/, "").trim() || fallback;
    }
  }
  return fallback;
}

function extractDescription(dirPath) {
  const pkgPath = path.join(dirPath, "package.json");
  if (!fs.existsSync(pkgPath)) return "";
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    if (pkg && typeof pkg.description === "string") {
      return pkg.description.trim();
    }
  } catch (err) {
    // Ignore malformed package.json
  }
  return "";
}

function gatherProjects(rootDir) {
  const categories = [];
  const uncategorized = [];

  const topLevelDirs = readDirNames(rootDir);

  for (const dir of topLevelDirs) {
    const dirPath = path.join(rootDir, dir);
    const children = readDirNames(dirPath);

    if (children.length === 0) {
      // Treat as a standalone project if it has a README.
      const title = extractTitle(dirPath, dir);
      const description = extractDescription(dirPath);
      const relPath = `./${dir}`;
      if (findReadme(dirPath)) {
        uncategorized.push({ title, path: relPath, description });
      }
      continue;
    }

    const projects = children.map((child) => {
      const childPath = path.join(dirPath, child);
      const title = extractTitle(childPath, child);
      const description = extractDescription(childPath);
      const relPath = `./${dir}/${child}`;
      return { title, path: relPath, description };
    });

    if (projects.length > 0) {
      categories.push({ category: dir, projects });
    }
  }

  // Add uncategorized as a separate group if any.
  if (uncategorized.length > 0) {
    categories.push({ category: "uncategorized", projects: uncategorized });
  }

  // Sort categories alphabetically; projects are already sorted by directory name.
  categories.sort((a, b) => a.category.localeCompare(b.category));
  return categories;
}

function renderMarkdown(categories) {
  const lines = [];
  for (const { category, projects } of categories) {
    const displayName = formatCategory(category);
    lines.push(`### ${displayName}`);
    for (const project of projects) {
      const desc = project.description ? ` - *${project.description}*` : "";
      lines.push(`- [${project.title}](${project.path})${desc}`);
    }
    lines.push(""); // blank line between categories
  }
  return lines.join("\n").trimEnd();
}

function injectIntoReadme(markdownBlock) {
  const content = fs.readFileSync(README_PATH, "utf8");
  const startIdx = content.indexOf(START_MARK);
  const endIdx = content.indexOf(END_MARK);

  if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) {
    throw new Error(
      "Project directory markers not found in README.md. Please add them:\n" +
        `${START_MARK}\n...generated content...\n${END_MARK}\n`
    );
  }

  const before = content.slice(0, startIdx + START_MARK.length);
  const after = content.slice(endIdx);
  const newContent = `${before}\n\n${markdownBlock}\n\n${after}`;

  fs.writeFileSync(README_PATH, newContent, "utf8");
}

function main() {
  const categories = gatherProjects(REPO_ROOT);
  const block = renderMarkdown(categories);
  injectIntoReadme(block);
}

if (require.main === module) {
  try {
    main();
  } catch (err) {
    console.error("✗ Error:", err.message || err);
    process.exit(1);
  }
}
