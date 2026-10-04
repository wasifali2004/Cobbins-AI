import { Injectable, Logger } from "@nestjs/common";

import { EMBEDDING_DIMENSIONS, GeminiService } from "../gemini/gemini.service";
import { PrismaService } from "../prisma/prisma.service";

export interface ComponentMatch {
  id: string;
  file: string;
  code: string;
  description: string;
  styleTags: string[];
  similarity: number;
}

export interface RetrieveResult {
  category: string;
  match: ComponentMatch | null;
  similarity: number | null;
}

interface ComponentRow {
  id: string;
  file: string;
  code: string;
  description: string;
  style_tags: string[];
  similarity: number;
}

@Injectable()
export class RetrieveService {
  private readonly logger = new Logger(RetrieveService.name);

  constructor(
    private readonly gemini: GeminiService,
    private readonly prisma: PrismaService,
  ) {}

  async retrieve(category: string, styleQuery: string): Promise<RetrieveResult> {
    const embedding = await this.gemini.embed(styleQuery, "RETRIEVAL_QUERY");
    if (embedding.length !== EMBEDDING_DIMENSIONS) {
      throw new Error("Unexpected query embedding dimensionality");
    }
    const vectorLiteral = `[${embedding.join(",")}]`;

    // No similarity cutoff here: we always surface the closest match for the
    // category (if one exists) and let the caller decide how to use it.
    const rows = await this.prisma.$queryRaw<ComponentRow[]>`
      SELECT id, file, code, description, style_tags,
             1 - (embedding <=> ${vectorLiteral}::vector) AS similarity
      FROM components
      WHERE category = ${category}
      ORDER BY embedding <=> ${vectorLiteral}::vector
      LIMIT 1
    `;

    const row = rows[0];
    const match: ComponentMatch | null = row
      ? {
          id: row.id,
          file: row.file,
          code: row.code,
          description: row.description,
          styleTags: row.style_tags,
          similarity: row.similarity,
        }
      : null;

    this.logger.log(`Retrieve category="${category}": ${match ? `similarity=${match.similarity.toFixed(3)}` : "no rows"}`);

    return { category, match, similarity: match?.similarity ?? null };
  }
}
