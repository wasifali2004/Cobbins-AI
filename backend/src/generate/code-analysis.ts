// Figures out which symbol a section's code exports as its main component,
// so the assembled page can import it correctly without hardcoding per-file
// knowledge of the component library.

export interface ExportInfo {
  hasDefault: boolean;
  importName: string | null; // symbol to import; null if none could be found
}

// Strips markdown code fences (```tsx ... ```) and, defensively, a bare
// language-name line the model sometimes emits on its own without a fence
// (e.g. a lone "typescript" line before the real code starts).
const LANGUAGE_LABEL_RE = /^(?:typescript|javascript|tsx?|jsx?)$/i;

export function stripCodeFence(text: string): string {
  let result = text.trim();
  result = result.replace(/^```[a-z]*\n?/i, "").replace(/\n?```$/, "").trim();

  const firstNewline = result.indexOf("\n");
  const firstLine = (firstNewline === -1 ? result : result.slice(0, firstNewline)).trim();
  if (LANGUAGE_LABEL_RE.test(firstLine)) {
    result = (firstNewline === -1 ? "" : result.slice(firstNewline + 1)).trim();
  }

  return result;
}

export function analyzeMainExport(code: string): ExportInfo {
  if (/export\s+default\s+/.test(code)) {
    const namedDefault = code.match(/export\s+default\s+(?:function\s+(\w+)|class\s+(\w+))/);
    const name = namedDefault?.[1] ?? namedDefault?.[2];
    if (name) return { hasDefault: true, importName: name };

    const bareDefault = code.match(/export\s+default\s+(\w+)\s*;?\s*$/m);
    return { hasDefault: true, importName: bareDefault?.[1] ?? null };
  }

  const firstNamed = code.match(/export\s+(?:function|const|class)\s+(\w+)/);
  return { hasDefault: false, importName: firstNamed?.[1] ?? null };
}
