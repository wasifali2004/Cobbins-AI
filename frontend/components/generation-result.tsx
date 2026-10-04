"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  ArrowLeft,
  CheckCircle2,
  Code2,
  Eye,
  GalleryVerticalEnd,
  LayoutTemplate,
  MinusCircle,
  WandSparkles,
} from "lucide-react";

import { DownloadIcon } from "@/components/icons/download-icon";
import { NotchNav, type NotchItemData } from "@/components/ui/adaptive-notch-navigation-bar";
import UniqueLoading from "@/components/ui/morph-loading";
import { ApiError, downloadExport, type GenerateResponse } from "@/lib/api-client";
import { takePendingGeneration } from "@/lib/pending-generations";
import { LivePreview } from "@/components/live-preview";

type ResultView = "preview" | "code";
const similarityFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

const NAV_ITEMS: NotchItemData[] = [
  { id: "preview", label: "Preview", icon: Eye },
  { id: "code", label: "Code", icon: Code2 },
];

export function GenerationResult({ generationId }: { generationId: string }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [building, setBuilding] = useState(false);
  const [buildError, setBuildError] = useState<string | null>(null);
  const [view, setView] = useState<ResultView>("preview");
  const [panelOpen, setPanelOpen] = useState(false);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  useEffect(() => {
    const pending = takePendingGeneration(generationId);
    if (pending) {
      setBuilding(true);
      setBuildError(null);
      pending
        .then((generated) => {
          setResult(generated);
          setActiveFile(Object.keys(generated.files)[0] ?? null);
          router.replace(`/generate/${generated.id}`);
        })
        .catch((err) => {
          setBuildError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
        })
        .finally(() => setBuilding(false));
      return;
    }

    const saved = window.sessionStorage.getItem(`cobbins-generation-${generationId}`);
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved) as GenerateResponse;
      setResult(parsed);
      setActiveFile(Object.keys(parsed.files)[0] ?? null);
    } catch {
      window.sessionStorage.removeItem(`cobbins-generation-${generationId}`);
    }
    // Only ever consult the pending registry/sessionStorage for the id this
    // component was first mounted with — router.replace above updates the
    // URL without remounting, and re-running this would just find nothing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fileNames = useMemo(() => (result ? Object.keys(result.files) : []), [result]);

  async function handleExport() {
    if (!session?.accessToken) return;
    setExporting(true);
    setExportError(null);
    try {
      const blob = await downloadExport(session.accessToken, generationId);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `landing-page-${generationId}.zip`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      setExportError("Could not download this page. Try again.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <NotchNav
      items={NAV_ITEMS}
      activeId={view}
      onActiveChange={(id) => setView(id as ResultView)}
      logo={
        <button
          className="flex items-center gap-2 outline-none"
          aria-label="Back to AI builder"
          onClick={() => router.push("/dashboard?view=generate")}
          type="button"
        >
          <ArrowLeft className="size-4" aria-hidden />
          <span className="hidden text-xs font-semibold sm:inline">Cobbins AI</span>
        </button>
      }
      rightContent={
        <div className="flex items-center gap-3">
          <button
            className="flex cursor-pointer items-center gap-1.5 text-xs font-medium outline-none"
            aria-pressed={panelOpen}
            onClick={() => setPanelOpen((open) => !open)}
            type="button"
          >
            <GalleryVerticalEnd className="size-3.5" aria-hidden />
            <span className="hidden sm:inline">Sections</span>
          </button>
          <button
            className="flex cursor-pointer items-center gap-1.5 text-xs font-medium outline-none disabled:cursor-not-allowed disabled:opacity-40"
            disabled={!result || exporting}
            onClick={handleExport}
            type="button"
          >
            <DownloadIcon size={14} isAnimated={!exporting} />
            <span className="hidden sm:inline">{exporting ? "Exporting…" : "Export"}</span>
          </button>
        </div>
      }
    >
      <div className="generation-result-canvas-wrap">
        {exportError ? <p className="dash2-generation-error" role="alert">{exportError}</p> : null}

        <section className="generation-result-workspace" data-references-open={panelOpen}>
          <div className="generation-result-main">
            <div className="generation-result-canvas">
              {building ? (
                <div className="generation-result-loading">
                  <UniqueLoading variant="morph" size="xl" />
                </div>
              ) : buildError ? (
                <div className="generation-result-empty">
                  <WandSparkles aria-hidden />
                  <h2>Generation failed</h2>
                  <p>{buildError}</p>
                  <button onClick={() => router.push("/dashboard?view=generate")} type="button">Return to AI builder</button>
                </div>
              ) : !result ? (
                <div className="generation-result-empty">
                  <WandSparkles aria-hidden />
                  <h2>No generated output found</h2>
                  <p>This generation couldn't be found in this browser session. Start a new one from the AI builder.</p>
                  <button onClick={() => router.push("/dashboard?view=generate")} type="button">Return to AI builder</button>
                </div>
              ) : (
                <>
                  <div className="generation-result-preview-wrap" hidden={view !== "preview"}>
                    <LivePreview files={result.files} theme={result.theme} />
                  </div>
                  {view === "code" ? (
                    <div className="generation-result-code-view">
                      <div className="generation-result-file-tabs">
                        {fileNames.map((file) => (
                          <button data-active={activeFile === file} key={file} onClick={() => setActiveFile(file)} type="button">{file}</button>
                        ))}
                      </div>
                      <pre className="generation-result-code"><code>{activeFile ? result.files[activeFile] : ""}</code></pre>
                    </div>
                  ) : null}
                </>
              )}
            </div>
          </div>

          <aside className="generation-result-references">
            <div><p>PAGE BREAKDOWN</p><h2>Sections generated</h2><span>Which library component (if any) each section was built from.</span></div>
            <div className="generation-result-reference-list">
              {result && result.sections.length > 0 ? result.sections.map((section) => {
                const Icon = section.source === "retrieved" ? CheckCircle2 : section.source === "default" ? LayoutTemplate : MinusCircle;
                return (
                  <article key={section.category} data-source={section.source}>
                    <Icon className="generation-result-reference-icon" aria-hidden />
                    <div>
                      <strong>{section.category}</strong>
                      <span>
                        {section.source === "retrieved" && section.similarity !== null
                          ? `Matched ${section.file} · ${similarityFormatter.format(section.similarity * 100)}% match`
                          : section.source === "default"
                            ? "Default template"
                            : "Skipped, no match found"}
                      </span>
                    </div>
                  </article>
                );
              }) : <div className="generation-result-reference-empty"><GalleryVerticalEnd aria-hidden /><strong>No section data</strong><span>Section details will appear here after generation.</span></div>}
            </div>
          </aside>
        </section>
      </div>
    </NotchNav>
  );
}
