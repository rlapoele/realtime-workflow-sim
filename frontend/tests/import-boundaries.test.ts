import { readFileSync, readdirSync } from "node:fs";
import { extname, join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const frontendRoot = process.cwd();
const checkedRoots = [join(frontendRoot, "src"), join(frontendRoot, "tests")];
const sourceExtensions = new Set([".astro", ".ts", ".tsx"]);
const importPattern = /(?:from\s+|import\s+)["']([^"']+)["']/g;

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return sourceExtensions.has(extname(entry.name)) ? [path] : [];
  });
}

describe("frontend import boundaries", () => {
  it("uses @/ across frontend directories and relative paths only for local collaborators", () => {
    const violations = checkedRoots.flatMap(sourceFiles).flatMap((file) => {
      const imports = [...readFileSync(file, "utf8").matchAll(importPattern)].map(
        (match) => match[1]!,
      );

      return imports
        .filter((specifier) => {
          if (specifier.includes("/shared/")) return false;
          if (specifier.startsWith("../")) return true;
          return specifier.startsWith("./") && specifier.slice(2).includes("/");
        })
        .map((specifier) => `${relative(frontendRoot, file)} -> ${specifier}`);
    });

    expect(violations).toEqual([]);
  });
});
