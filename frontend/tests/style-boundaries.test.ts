import { readFileSync, readdirSync } from "node:fs";
import { extname, join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const frontendRoot = process.cwd();
const sourceRoot = join(frontendRoot, "src");
const sourceExtensions = new Set([".astro", ".css", ".ts", ".tsx"]);
const semanticArbitraryValue = /\[[^\]]*var\(--(?!available-height|anchor-width|transform-origin)[^)]+\)[^\]]*\]/g;

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return sourceExtensions.has(extname(entry.name)) ? [path] : [];
  });
}

describe("frontend style boundaries", () => {
  it("uses named theme utilities instead of semantic CSS-variable arbitrary values", () => {
    const violations = sourceFiles(sourceRoot).flatMap((file) =>
      [...readFileSync(file, "utf8").matchAll(semanticArbitraryValue)].map(
        (match) => `${relative(frontendRoot, file)} -> ${match[0]}`,
      ),
    );

    expect(violations).toEqual([]);
  });

  it("bridges semantic tokens and layers custom styles", () => {
    const stylesheet = readFileSync(join(sourceRoot, "styles/global.css"), "utf8");

    expect(stylesheet).toContain("@theme inline");
    expect(stylesheet).toContain("--color-background: var(--background);");
    expect(stylesheet).toContain("--radius-panel: var(--app-radius-panel);");
    expect(stylesheet).toContain("--tracking-label: 0.12em;");
    expect(stylesheet).toContain("@layer base");
    expect(stylesheet).toContain("@layer components");
  });
});
