// Walks /component-library, embeds each entry's manifest text with Gemini,
// and upserts the result into the Supabase `components` table.
//
// Usage: node scripts/seed-components.mjs   (run from backend/, or via `npm run seed:components`)

import "dotenv/config";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { GoogleGenAI } from "@google/genai";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const COMPONENT_LIBRARY_DIR = path.resolve(import.meta.dirname, "../../component-library");
const EMBEDDING_MODEL = "gemini-embedding-001";
const EMBEDDING_DIMENSIONS = 1536; // must match the `vector(1536)` column in Supabase
const DELAY_BETWEEN_CALLS_MS = 500;
const MAX_RETRIES = 4;
const BASE_BACKOFF_MS = 1000;

if (!process.env.GEMINI_API_KEY) {
  console.error("Missing GEMINI_API_KEY in backend/.env");
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error("Missing DATABASE_URL in backend/.env");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function embedText(text) {
  let lastError;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await ai.models.embedContent({
        model: EMBEDDING_MODEL,
        contents: text,
        config: {
          outputDimensionality: EMBEDDING_DIMENSIONS,
          taskType: "RETRIEVAL_DOCUMENT",
        },
      });
      const values = response?.embeddings?.[0]?.values;
      if (!Array.isArray(values) || values.length !== EMBEDDING_DIMENSIONS) {
        throw new Error(
          `Unexpected embedding shape: got ${values?.length ?? "none"} values, expected ${EMBEDDING_DIMENSIONS}`,
        );
      }
      return values;
    } catch (err) {
      lastError = err;
      if (attempt === MAX_RETRIES) break;
      const backoff = BASE_BACKOFF_MS * 2 ** attempt;
      console.warn(
        `  Gemini call failed (attempt ${attempt + 1}/${MAX_RETRIES + 1}): ${err.message}. Retrying in ${backoff}ms...`,
      );
      await sleep(backoff);
    }
  }
  throw lastError;
}

async function upsertComponent({ category, file, styleTags, description, examplePrompts, code, embedding }) {
  const existing = await prisma.$queryRaw`
    SELECT 1 FROM components WHERE category = ${category} AND file = ${file} LIMIT 1
  `;
  const isUpdate = existing.length > 0;

  const vectorLiteral = `[${embedding.join(",")}]`;

  await prisma.$executeRaw`
    INSERT INTO components (category, file, style_tags, description, example_prompts, code, embedding)
    VALUES (${category}, ${file}, ${styleTags}, ${description}, ${examplePrompts}, ${code}, ${vectorLiteral}::vector)
    ON CONFLICT (category, file) DO UPDATE SET
      style_tags = EXCLUDED.style_tags,
      description = EXCLUDED.description,
      example_prompts = EXCLUDED.example_prompts,
      code = EXCLUDED.code,
      embedding = EXCLUDED.embedding
  `;

  return isUpdate ? "updated" : "inserted";
}

async function isDirectory(p) {
  try {
    return (await stat(p)).isDirectory();
  } catch {
    return false;
  }
}

async function main() {
  const entries = await readdir(COMPONENT_LIBRARY_DIR);
  const categories = [];
  for (const entry of entries) {
    if (await isDirectory(path.join(COMPONENT_LIBRARY_DIR, entry))) {
      categories.push(entry);
    }
  }
  categories.sort();

  const summary = {}; // category -> { inserted, updated, failed: [{file, reason}] }

  for (const category of categories) {
    summary[category] = { inserted: 0, updated: 0, failed: [] };
    const categoryDir = path.join(COMPONENT_LIBRARY_DIR, category);
    const manifestPath = path.join(categoryDir, "manifest.json");

    let manifest;
    try {
      const raw = await readFile(manifestPath, "utf-8");
      manifest = JSON.parse(raw);
      if (!Array.isArray(manifest)) throw new Error("manifest.json is not an array");
    } catch (err) {
      console.error(`[${category}] Skipping category: could not read/parse manifest.json (${err.message})`);
      summary[category].failed.push({ file: "manifest.json", reason: err.message });
      continue;
    }

    console.log(`\n[${category}] ${manifest.length} entr${manifest.length === 1 ? "y" : "ies"} in manifest`);

    for (const entry of manifest) {
      const { file, style_tags, description, example_prompts } = entry ?? {};

      if (!file || typeof file !== "string") {
        console.error(`[${category}] Skipping entry: missing or invalid "file" field`);
        summary[category].failed.push({ file: file ?? "(unknown)", reason: 'missing/invalid "file" field' });
        continue;
      }
      if (!description || typeof description !== "string") {
        console.error(`[${category}/${file}] Skipping: missing or invalid "description" field`);
        summary[category].failed.push({ file, reason: 'missing/invalid "description" field' });
        continue;
      }

      const styleTags = Array.isArray(style_tags) ? style_tags : [];
      const examplePrompts = Array.isArray(example_prompts) ? example_prompts : [];

      const codePath = path.join(categoryDir, file);
      let code;
      try {
        code = await readFile(codePath, "utf-8");
      } catch (err) {
        console.error(`[${category}/${file}] Skipping: could not read code file (${err.message})`);
        summary[category].failed.push({ file, reason: `could not read code file: ${err.message}` });
        continue;
      }

      const embedText_ = [description, ...examplePrompts].join("\n\n");

      try {
        console.log(`[${category}/${file}] Embedding...`);
        const embedding = await embedText(embedText_);

        await sleep(DELAY_BETWEEN_CALLS_MS);

        const result = await upsertComponent({
          category,
          file,
          styleTags,
          description,
          examplePrompts,
          code,
          embedding,
        });

        summary[category][result] += 1;
        console.log(`[${category}/${file}] ${result}`);
      } catch (err) {
        console.error(`[${category}/${file}] Failed: ${err.message}`);
        summary[category].failed.push({ file, reason: err.message });
      }
    }
  }

  await prisma.$disconnect();

  // ── Summary ────────────────────────────────────────────────────────────
  console.log("\n\n=== Seed summary ===");
  let totalInserted = 0;
  let totalUpdated = 0;
  let totalFailed = 0;

  for (const category of categories) {
    const s = summary[category];
    totalInserted += s.inserted;
    totalUpdated += s.updated;
    totalFailed += s.failed.length;
    console.log(
      `${category}: ${s.inserted} inserted, ${s.updated} updated, ${s.failed.length} failed`,
    );
    for (const f of s.failed) {
      console.log(`  ✗ ${f.file}: ${f.reason}`);
    }
  }

  console.log("---");
  console.log(`Total: ${totalInserted} inserted, ${totalUpdated} updated, ${totalFailed} failed`);

  if (totalFailed > 0) {
    process.exitCode = 1;
  }
}

main().catch(async (err) => {
  console.error("Fatal error:", err);
  await prisma.$disconnect();
  process.exit(1);
});
