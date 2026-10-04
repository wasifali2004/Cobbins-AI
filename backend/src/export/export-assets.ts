// Builds the package.json and README that accompany an exported page,
// inferred from the actual import statements in the generated files rather
// than hardcoded per-component knowledge.

interface ScannedImports {
  npmPackages: Set<string>;
  localUiPaths: Set<string>;
}

export function scanImports(files: Record<string, string>): ScannedImports {
  const npmPackages = new Set<string>();
  const localUiPaths = new Set<string>();
  const importRe = /from\s+["']([^"']+)["']/g;

  for (const content of Object.values(files)) {
    let match: RegExpExecArray | null;
    while ((match = importRe.exec(content))) {
      const spec = match[1];
      if (spec.startsWith(".")) continue;
      if (spec.startsWith("@/")) {
        localUiPaths.add(spec);
        continue;
      }
      const pkgName = spec.startsWith("@") ? spec.split("/").slice(0, 2).join("/") : spec.split("/")[0];
      npmPackages.add(pkgName);
    }
  }
  return { npmPackages, localUiPaths };
}

export function buildPackageJson(npmPackages: Set<string>): string {
  const dependencies: Record<string, string> = { react: "^19.0.0", "react-dom": "^19.0.0" };
  for (const pkg of npmPackages) {
    if (pkg === "react" || pkg === "react-dom") continue;
    dependencies[pkg] = "latest";
  }
  const isNext = npmPackages.has("next");

  return JSON.stringify(
    {
      name: "generated-landing-page",
      version: "0.1.0",
      private: true,
      scripts: isNext
        ? { dev: "next dev", build: "next build", start: "next start" }
        : { build: "tsc --noEmit" },
      dependencies,
      devDependencies: {
        typescript: "^5.7.2",
        "@types/react": "^19.0.0",
        "@types/node": "^22.10.2",
      },
    },
    null,
    2,
  );
}

export function buildReadme(files: Record<string, string>, localUiPaths: Set<string>): string {
  const fileList = Object.keys(files)
    .sort()
    .map((f) => `- \`${f}\``)
    .join("\n");

  const uiSection = localUiPaths.size
    ? `\n## Required UI components\n\nThis page imports the following local components that are not included in this export. Add them under \`components/ui/\` (e.g. via the shadcn CLI) or replace the imports:\n\n${[...localUiPaths]
        .sort()
        .map((p) => `- \`${p}\``)
        .join("\n")}\n`
    : "";

  return `# Generated Landing Page

This page was generated automatically. It's plain React/TypeScript (Next.js conventions), split into one file per section.

## Files

${fileList}
${uiSection}
## Getting started

1. Copy these files into a Next.js app (e.g. \`page.tsx\` and \`sections/\` under \`app/\`).
2. \`npm install\`
3. Add any required UI components listed above.
4. \`npm run dev\` to preview.
`;
}
