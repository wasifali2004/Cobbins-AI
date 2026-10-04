import { Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
import { Type } from "@google/genai";

import { GENERATION_CREDIT_COST, CreditsService } from "../credits/credits.service";
import { GeminiService } from "../gemini/gemini.service";
import { PrismaService } from "../prisma/prisma.service";
import { PlanService } from "../plan/plan.service";
import { RetrieveService } from "../retrieve/retrieve.service";
import { assertValidImage, extensionFor, MAX_REFERENCE_IMAGE_BYTES } from "../storage/image-validation";
import { StorageService } from "../storage/storage.service";
import { analyzeMainExport, stripCodeFence } from "./code-analysis";
import { DEFAULT_SECTION_TEMPLATES } from "./default-sections";

export interface PageTheme {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
}

export interface SectionOutcome {
  category: string;
  source: "retrieved" | "default" | "skipped";
  file: string | null;
  similarity: number | null;
}

export interface GenerateResult {
  id: string;
  files: Record<string, string>;
  sections: SectionOutcome[];
  theme: PageTheme;
  referenceStyle: string | null;
}

// Below this similarity, a retrieved component is a "weak" structural match:
// still used as-is (never discarded for a generic default), but the
// adaptation pass is told to push copy noticeably harder to compensate.
const WEAK_MATCH_THRESHOLD = 0.6;

const THEME_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    primaryColor: { type: Type.STRING, description: "hex color, e.g. #1a1a1a" },
    secondaryColor: { type: Type.STRING, description: "hex color" },
    accentColor: { type: Type.STRING, description: "hex color" },
    backgroundColor: { type: Type.STRING, description: "hex color" },
    textColor: { type: Type.STRING, description: "hex color" },
    fontFamily: { type: Type.STRING, description: "a real Google Font name, e.g. Inter, Poppins, Playfair Display" },
  },
  required: ["primaryColor", "secondaryColor", "accentColor", "backgroundColor", "textColor", "fontFamily"],
};

@Injectable()
export class GenerateService {
  private readonly logger = new Logger(GenerateService.name);

  constructor(
    private readonly gemini: GeminiService,
    private readonly prisma: PrismaService,
    private readonly planService: PlanService,
    private readonly retrieveService: RetrieveService,
    private readonly creditsService: CreditsService,
    private readonly storageService: StorageService,
  ) {}

  private async deriveTheme(prompt: string, style: string, referenceStyle: string | null): Promise<PageTheme> {
    const instruction = `Given a landing page described as "${style}" in style, with this description:
"""
${prompt}
"""
${referenceStyle ? `The user also provided a reference image. Its visual style should guide the palette and font choice above all else:\n"""\n${referenceStyle}\n"""\n` : ""}Pick one cohesive color palette (5 hex colors) and one Google Font family for the whole page. Return only the requested fields.`;
    return this.gemini.generateJson<PageTheme>(instruction, THEME_SCHEMA);
  }

  private async adaptSection(
    code: string,
    prompt: string,
    theme: PageTheme,
    isWeakMatch: boolean,
    referenceStyle: string | null,
  ): Promise<string> {
    const exportInfo = analyzeMainExport(code);
    const instruction = `You are adapting a React/TypeScript landing page section for a specific user request. This section will be rendered stacked directly below other independently-adapted sections in normal document flow, in the order: hero, then supporting sections, then a call-to-action, then a footer — it must behave as a well-mannered, self-contained block that never bleeds into or overlaps its neighbors. Rewrite the code below so that:
- Text content (headings, body copy, button labels, testimonial names/quotes, etc.) reflects this user request: "${prompt}"
- Any obviously placeholder values (lorem ipsum, generic company/product names, placeholder image URLs) are replaced with something fitting
- Colors and theme-related values are adjusted to this shared palette: ${JSON.stringify(theme)}
- Spacing and sizing values may be nudged for visual balance
- The section must stay fully responsive on every viewport from ~360px mobile up through desktop: never remove or weaken existing Tailwind responsive prefixes (sm:, md:, lg:, xl:); if a value you touch (width, padding, font size, grid/flex columns) has no responsive variants at all, add sensible ones (e.g. a fixed "w-[640px]" should become "w-full max-w-[640px]", a multi-column grid without a mobile fallback should collapse to a single column below "md:"); text must wrap instead of overflowing or getting clipped; never introduce a fixed pixel width or height wider/taller than its container
- The section's outermost/root element must lay out in normal document flow: it must not be "fixed" or "sticky" positioned (that would pin it over every other section on the page) unless this is unmistakably a site header/navbar section — and even then, only the header may do this; if the root element is "absolute", change it to a normal flow position unless removing it would break a decorative effect that stays fully inside this section's own bounds
- The root element must not carry a negative top margin, a negative "translate-y", or any transform that would pull it up into whatever renders above it — those tricks only made sense in the section's original standalone demo, not stacked between unrelated sections
- Every JSX tag you touch must remain correctly opened, closed, and nested — no orphaned or mismatched tags
${referenceStyle ? `- The user provided a reference image with this visual style; align colors, mood, and spacing/sizing with it: "${referenceStyle}"\n` : ""}${isWeakMatch ? `- This section is only a loose structural match for the request. Push the text/copy to be noticeably more specific and tailored to the user's request than usual, to compensate for the loose fit.\n` : ""}- Otherwise, the component's structure, JSX tree, animations, hooks, and logic are preserved as-is — do not restructure, reorder, rename, add, or remove imports, functions, sections, or exported symbols beyond the layout fixes above
- The file must still export the same symbol(s) as the original (${exportInfo.importName ?? "unknown"})

Return ONLY the final code for the file, no markdown fences, no explanation.

Original code:
${code}`;

    const adapted = await this.gemini.generateText(instruction);
    const cleaned = stripCodeFence(adapted);

    const adaptedExport = analyzeMainExport(cleaned);
    if (!cleaned || adaptedExport.importName !== exportInfo.importName) {
      this.logger.warn("Adaptation produced an invalid or mismatched export; keeping original code for this section");
      return code;
    }
    return cleaned;
  }

  async generate(prompt: string, userId: string, referenceImage?: Express.Multer.File): Promise<GenerateResult> {
    await this.creditsService.assertSufficientCredits(userId, GENERATION_CREDIT_COST);

    let referenceImageUrl: string | null = null;
    let referenceStyle: string | null = null;
    if (referenceImage) {
      assertValidImage(referenceImage, MAX_REFERENCE_IMAGE_BYTES);
      referenceImageUrl = await this.storageService.uploadPublicImage(
        `references/${userId}`,
        `ref-${Date.now()}.${extensionFor(referenceImage.mimetype)}`,
        referenceImage.buffer,
        referenceImage.mimetype,
      );
      try {
        referenceStyle = await this.gemini.describeImageStyle(referenceImage.buffer, referenceImage.mimetype);
        this.logger.log(`Reference image style extracted for user=${userId}`);
      } catch (err) {
        this.logger.error("Failed to extract style from reference image; continuing without it", err as Error);
      }
    }

    const plan = await this.planService.createPlan(prompt);
    const theme = await this.deriveTheme(prompt, plan.style, referenceStyle);
    const retrievalQuerySuffix = referenceStyle ? ` ${referenceStyle}` : "";

    const files: Record<string, string> = {};
    const outcomes: SectionOutcome[] = [];
    const imports: { importName: string; path: string; hasDefault: boolean }[] = [];

    for (let i = 0; i < plan.sections.length; i++) {
      const category = plan.sections[i];
      const slug = `${String(i + 1).padStart(2, "0")}-${category}`;

      let rawCode: string | null = null;
      let source: SectionOutcome["source"] = "skipped";
      let matchedFile: string | null = null;
      let similarity: number | null = null;
      let isWeakMatch = false;

      try {
        const retrieval = await this.retrieveService.retrieve(category, `${plan.style} ${prompt}${retrievalQuerySuffix}`);
        if (retrieval.match) {
          rawCode = retrieval.match.code;
          matchedFile = retrieval.match.file;
          similarity = retrieval.match.similarity;
          source = "retrieved";
          isWeakMatch = similarity < WEAK_MATCH_THRESHOLD;
          if (isWeakMatch) {
            this.logger.warn(
              `Weak match used: component=${retrieval.match.id} category="${category}" similarity=${similarity.toFixed(3)}`,
            );
          }
        } else if (DEFAULT_SECTION_TEMPLATES[category]) {
          rawCode = DEFAULT_SECTION_TEMPLATES[category];
          source = "default";
        }
      } catch (err) {
        this.logger.error(`Retrieval failed for category "${category}"`, err as Error);
        if (DEFAULT_SECTION_TEMPLATES[category]) {
          rawCode = DEFAULT_SECTION_TEMPLATES[category];
          source = "default";
        }
      }

      if (!rawCode) {
        outcomes.push({ category, source: "skipped", file: null, similarity: null });
        this.logger.log(`Section skipped: category="${category}" had no match and no default`);
        continue;
      }

      let adapted: string;
      try {
        adapted = await this.adaptSection(rawCode, prompt, theme, isWeakMatch, referenceStyle);
      } catch (err) {
        this.logger.error(`Adaptation failed for category "${category}"; using original code`, err as Error);
        adapted = rawCode;
      }

      const exportInfo = analyzeMainExport(adapted);
      if (!exportInfo.importName) {
        outcomes.push({ category, source: "skipped", file: matchedFile, similarity });
        this.logger.warn(`Section skipped: category="${category}" produced no detectable export`);
        continue;
      }

      files[`sections/${slug}.tsx`] = adapted;
      imports.push({ importName: exportInfo.importName, path: `./sections/${slug}`, hasDefault: exportInfo.hasDefault });
      outcomes.push({ category, source, file: matchedFile, similarity });
    }

    if (imports.length === 0) {
      throw new InternalServerErrorException("Could not generate any sections for this page.");
    }

    const importLines = imports
      .map((imp, idx) =>
        imp.hasDefault
          ? `import Section${idx} from "${imp.path}";`
          : `import { ${imp.importName} as Section${idx} } from "${imp.path}";`,
      )
      .join("\n");
    const renderLines = imports.map((_, idx) => `      <Section${idx} />`).join("\n");

    files["page.tsx"] = `${importLines}

export default function GeneratedPage() {
  return (
    <div style={{ fontFamily: "${theme.fontFamily}, sans-serif", width: "100%", maxWidth: "100vw", overflowX: "hidden" }}>
${renderLines}
    </div>
  );
}
`;

    const saved = await this.prisma.generatedPage.create({
      data: {
        userId,
        prompt,
        sections: outcomes as unknown as object,
        code: JSON.stringify(files),
        referenceImageUrl,
        referenceStyle,
      },
      select: { id: true },
    });

    await this.creditsService.deductCredits(userId, GENERATION_CREDIT_COST, `Landing page generation (${saved.id})`);

    this.logger.log(
      `Generation success: user=${userId} sections=${outcomes.length} rendered=${imports.length} referenceImage=${Boolean(referenceImageUrl)}`,
    );

    return { id: saved.id, files, sections: outcomes, theme, referenceStyle };
  }
}
