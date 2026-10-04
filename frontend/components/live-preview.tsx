"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as Babel from "@babel/standalone";

import type { GenerateResponse } from "@/lib/api-client";

type PageTheme = GenerateResponse["theme"];

// Everything the generated code is allowed to import from outside itself.
// Real packages are loaded from esm.sh (kept in sync with react/react-dom via
// the ?external flag so every CDN package shares one React instance); the
// rest are tiny local shims since they're app-specific or Next.js-specific.
const REACT_VERSION = "19";
const CDN_IMPORTS: Record<string, string> = {
  react: `https://esm.sh/react@${REACT_VERSION}`,
  "react/jsx-runtime": `https://esm.sh/react@${REACT_VERSION}/jsx-runtime`,
  "react-dom": `https://esm.sh/react-dom@${REACT_VERSION}?external=react`,
  "react-dom/client": `https://esm.sh/react-dom@${REACT_VERSION}/client?external=react`,
  "framer-motion": `https://esm.sh/framer-motion@12?external=react,react-dom`,
  "motion/react": `https://esm.sh/framer-motion@12?external=react,react-dom`,
  "lucide-react": `https://esm.sh/lucide-react@0.468.0?external=react`,
  "@number-flow/react": `https://esm.sh/@number-flow/react?external=react`,
};

const SHIM_SOURCES: Record<string, string> = {
  "next/link": `
    import React from "react";
    export default function Link({ href, children, ...props }) {
      return React.createElement("a", { href: href ?? "#", ...props }, children);
    }
  `,
  "next/image": `
    import React from "react";
    export default function Image({ src, alt, fill, ...props }) {
      return React.createElement("img", { src, alt: alt ?? "", ...props });
    }
  `,
  "@/lib/utils": `
    export function cn(...args) {
      return args.flat(Infinity).filter(Boolean).join(" ");
    }
  `,
  "@/components/ui/button": `
    import React from "react";
    const SIZE = { default: "px-5 py-2.5 text-sm", sm: "px-3.5 py-1.5 text-xs", lg: "px-6 py-3 text-base", icon: "p-2.5" };
    const VARIANT = {
      primary: "bg-neutral-900 text-white hover:bg-neutral-700 dark:bg-white dark:text-neutral-900",
      secondary: "bg-neutral-100 text-neutral-900 hover:bg-neutral-200",
      ghost: "bg-transparent hover:bg-neutral-100",
    };
    export function Button({ className, variant, size, asChild, children, ...props }) {
      if (asChild) return children;
      const cls = ["inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors", SIZE[size] || SIZE.default, VARIANT[variant] || VARIANT.primary, className].filter(Boolean).join(" ");
      return React.createElement("button", { className: cls, ...props }, children);
    }
  `,
  "@/components/ui/textarea": `
    import React from "react";
    export const Textarea = React.forwardRef(function Textarea({ className, ...props }, ref) {
      return React.createElement("textarea", { ref, className: ["w-full rounded-md border px-3 py-2 text-sm", className].filter(Boolean).join(" "), ...props });
    });
  `,
};

function toPascalCase(name: string): string {
  return name.replace(/(^|[-_])([a-z])/g, (_match, _sep, c: string) => c.toUpperCase());
}

// Best-effort stand-in for any @/components/ui/* file we don't have a
// hand-written shim for: every named binding the generated code actually
// imports from it (e.g. Accordion, AccordionItem, AccordionTrigger) becomes
// a generic passthrough component, so the module always has what's asked of it.
function genericUiShim(specifier: string, namedExports: Set<string>, needsDefault: boolean): string {
  const fallbackName = toPascalCase(specifier.split("/").pop() ?? "component");
  const names = new Set(namedExports);
  if (names.size === 0) names.add(fallbackName);
  const exportLines = [...names].map((name) => `export const ${name} = GenericShim;`).join("\n    ");
  return `
    import React from "react";
    function GenericShim({ children, ...props }) { return React.createElement("div", props, children); }
    ${needsDefault ? "export default GenericShim;" : ""}
    ${exportLines}
  `;
}

function parseImportClause(clause: string): { hasDefault: boolean; named: string[] } {
  const braceMatch = clause.match(/\{([^}]*)\}/);
  const beforeBrace = (braceMatch ? clause.slice(0, braceMatch.index) : clause).replace(/,\s*$/, "").trim();
  const hasDefault = beforeBrace.length > 0 && !beforeBrace.startsWith("*");
  const named = braceMatch
    ? braceMatch[1]
        .split(",")
        .map((part) => part.trim().split(/\s+as\s+/)[0].trim())
        .filter(Boolean)
    : [];
  return { hasDefault, named };
}

function transpile(code: string): string {
  return Babel.transform(code, {
    presets: [
      ["typescript", { isTSX: true, allExtensions: true }],
      ["react", { runtime: "automatic" }],
    ],
    filename: "generated.tsx",
  }).code ?? "";
}

function buildPreviewDocument(files: Record<string, string>, theme: PageTheme): string {
  const importMap: Record<string, string> = { ...CDN_IMPORTS };
  const usedKnownShims = new Set<string>();
  const genericShimNeeds = new Map<string, { hasDefault: boolean; named: Set<string> }>();

  function collectAndTranspile(path: string, code: string): string {
    const transpiled = transpile(code);
    // Rewrite every static import specifier to a stable, unique key, then
    // point that key at the right place in the import map (CDN, shim, or a
    // sibling generated file). Also record exactly which bindings each
    // generic shim needs to export, since it can't know that ahead of time.
    return transpiled.replace(/import\s+([^;]+?)\s+from\s+(["'])([^"']+)\2/g, (match, clause: string, _quote: string, spec: string) => {
      if (spec.startsWith(".")) {
        const resolved = new URL(spec, `https://gen.local/${path}`).pathname.replace(/^\//, "");
        const withExt = files[resolved] !== undefined ? resolved : `${resolved}.tsx`;
        return match.replace(spec, `gen:${withExt}`);
      }
      if (CDN_IMPORTS[spec]) return match;
      if (SHIM_SOURCES[spec]) {
        usedKnownShims.add(spec);
        return match.replace(spec, `shim:${spec}`);
      }
      if (spec.startsWith("@/components/ui/")) {
        const { hasDefault, named } = parseImportClause(clause);
        const existing = genericShimNeeds.get(spec) ?? { hasDefault: false, named: new Set<string>() };
        existing.hasDefault = existing.hasDefault || hasDefault;
        named.forEach((n) => existing.named.add(n));
        genericShimNeeds.set(spec, existing);
        return match.replace(spec, `shim:${spec}`);
      }
      // Unknown external package: best-effort load from esm.sh directly.
      importMap[spec] = `https://esm.sh/${spec}?external=react,react-dom`;
      return match;
    });
  }

  // Sandboxed iframes without allow-same-origin can't dereference blob: URLs
  // created by the parent's origin, so encode each module as a data: URL
  // instead — self-contained, no origin ownership check involved.
  function registerModule(key: string, source: string) {
    importMap[key] = `data:text/javascript;charset=utf-8,${encodeURIComponent(source)}`;
  }

  for (const [path, code] of Object.entries(files)) {
    if (path === "page.tsx") continue;
    registerModule(`gen:${path}`, collectAndTranspile(path, code));
  }
  registerModule("gen:page.tsx", collectAndTranspile("page.tsx", files["page.tsx"] ?? ""));

  for (const spec of usedKnownShims) registerModule(`shim:${spec}`, SHIM_SOURCES[spec]);
  for (const [spec, need] of genericShimNeeds) registerModule(`shim:${spec}`, genericUiShim(spec, need.named, need.hasDefault));

  const fontLink = theme.fontFamily
    ? `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=${encodeURIComponent(theme.fontFamily)}:wght@400;500;600;700&display=swap">`
    : "";

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
${fontLink}
<script src="https://cdn.tailwindcss.com"></script>
<style>
  :root {
    --preview-primary: ${theme.primaryColor};
    --preview-secondary: ${theme.secondaryColor};
    --preview-accent: ${theme.accentColor};
    --preview-bg: ${theme.backgroundColor};
    --preview-text: ${theme.textColor};
  }
  html, body { margin: 0; background: ${theme.backgroundColor}; color: ${theme.textColor}; font-family: "${theme.fontFamily}", sans-serif; }
  #preview-error { display: none; padding: 32px; font-family: monospace; font-size: 13px; white-space: pre-wrap; color: #b91c1c; background: #fef2f2; }
</style>
<script type="importmap">${JSON.stringify({ imports: importMap })}</script>
</head>
<body>
<div id="root"></div>
<div id="preview-error"></div>
<script type="module">
  import React from "react";
  import { createRoot } from "react-dom/client";
  try {
    const mod = await import("gen:page.tsx");
    const Page = mod.default;
    createRoot(document.getElementById("root")).render(React.createElement(Page));
    window.parent.postMessage({ cobbinsPreview: "ready" }, "*");
  } catch (err) {
    document.getElementById("preview-error").style.display = "block";
    document.getElementById("preview-error").textContent = String(err && err.stack || err);
    window.parent.postMessage({ cobbinsPreview: "error", message: String(err && err.message || err) }, "*");
  }
</script>
</body>
</html>`;
}

export function LivePreview({ files, theme }: { files: Record<string, string>; theme: PageTheme }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const srcDoc = useMemo(() => buildPreviewDocument(files, theme), [files, theme]);

  useEffect(() => {
    setStatus("loading");
    setErrorMessage(null);
    const timeout = window.setTimeout(() => setStatus((current) => (current === "loading" ? "error" : current)), 12_000);

    function onMessage(event: MessageEvent) {
      if (event.data?.cobbinsPreview === "ready") setStatus("ready");
      if (event.data?.cobbinsPreview === "error") {
        setStatus("error");
        setErrorMessage(event.data.message ?? "Unknown error");
      }
    }
    window.addEventListener("message", onMessage);
    return () => {
      window.removeEventListener("message", onMessage);
      window.clearTimeout(timeout);
    };
  }, [srcDoc]);

  return (
    <div className="live-preview">
      {status === "error" ? (
        <div className="generation-result-empty">
          <h2>Live preview couldn't render this page</h2>
          <p>{errorMessage ?? "Something in the generated code didn't run in the browser sandbox."} View the code tab instead.</p>
        </div>
      ) : null}
      <iframe
        ref={iframeRef}
        title="Generated page preview"
        className="live-preview-frame"
        style={{ display: status === "error" ? "none" : "block" }}
        sandbox="allow-scripts"
        srcDoc={srcDoc}
      />
      {status === "loading" ? <div className="live-preview-loading">Rendering preview…</div> : null}
    </div>
  );
}
