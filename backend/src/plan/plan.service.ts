import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { Type } from "@google/genai";

import { GeminiService } from "../gemini/gemini.service";

export interface PagePlan {
  sections: string[];
  style: string;
}

interface RawPlanResult {
  safe: boolean;
  sections: string[];
  style: string;
}

const KNOWN_CATEGORIES = [
  "hero",
  "background",
  "button",
  "faqs",
  "pricing",
  "testimonial",
  "features",
  "footer",
  "navbar",
  "cta",
];

const PLAN_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    safe: {
      type: Type.BOOLEAN,
      description: "false only if the request is hateful, sexual content involving minors, or asks for violence/weapons/malware instructions",
    },
    sections: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "ordered list of landing page section categories",
    },
    style: {
      type: Type.STRING,
      description: "one or two word style descriptor, e.g. bold, minimal, playful, corporate, luxurious",
    },
  },
  required: ["safe", "sections", "style"],
};

// The model sometimes returns a plural/singular variant of a known category
// (e.g. "testimonials" instead of "testimonial"). Normalize so it still
// matches the component library's actual folder names and default templates.
function normalizeCategory(raw: string): string {
  const trimmed = raw.trim().toLowerCase();
  if (KNOWN_CATEGORIES.includes(trimmed)) return trimmed;
  const singular = trimmed.endsWith("s") ? trimmed.slice(0, -1) : `${trimmed}s`;
  return KNOWN_CATEGORIES.includes(singular) ? singular : trimmed;
}

@Injectable()
export class PlanService {
  private readonly logger = new Logger(PlanService.name);

  constructor(private readonly gemini: GeminiService) {}

  async createPlan(prompt: string): Promise<PagePlan> {
    const instruction = `You are a landing-page architect. Given a user's description of a landing page they want built, decide:

1. Whether the request is safe and appropriate. Ordinary business, product, or personal-site descriptions are always safe. Only mark unsafe if it is clearly hateful, sexual content involving minors, or requests instructions for violence, weapons, or malware.
2. An ordered list of landing-page sections needed. Prefer these category names where they fit: ${KNOWN_CATEGORIES.join(", ")}. Only include sections the page actually needs; do not pad the list. Order them the way a real landing page reads top to bottom: "navbar" first if included, then "hero", then supporting sections such as "features", "pricing", "testimonial", and "faqs" in whichever order best fits the request, then a "cta" section near the end to drive action, and "footer" last if included.
3. A short one-or-two-word style descriptor (e.g. "bold", "minimal", "playful", "corporate", "luxurious") inferred from the tone of the description.

User's page description:
"""
${prompt}
"""`;

    const result = await this.gemini.generateJson<RawPlanResult>(instruction, PLAN_SCHEMA);

    if (!result.safe) {
      throw new BadRequestException(
        "This request can't be processed. Please describe a landing page you'd like to build.",
      );
    }
    if (!Array.isArray(result.sections) || result.sections.length === 0 || !result.style) {
      throw new BadRequestException("Could not determine a plan for this page. Try describing it differently.");
    }

    const sections = result.sections.map(normalizeCategory);
    this.logger.log(`Plan created: ${sections.length} sections, style="${result.style}"`);
    return { sections, style: result.style };
  }
}
