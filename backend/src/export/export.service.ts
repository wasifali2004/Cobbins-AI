import { Injectable, InternalServerErrorException, Logger, NotFoundException } from "@nestjs/common";
import archiver = require("archiver");

import { PrismaService } from "../prisma/prisma.service";
import { buildPackageJson, buildReadme, scanImports } from "./export-assets";

export interface ExportBundle {
  filename: string;
  buffer: Buffer;
}

@Injectable()
export class ExportService {
  private readonly logger = new Logger(ExportService.name);

  constructor(private readonly prisma: PrismaService) {}

  async buildZip(pageId: string, userId: string): Promise<ExportBundle> {
    const page = await this.prisma.generatedPage.findUnique({
      where: { id: pageId },
      select: { id: true, userId: true, code: true },
    });

    if (!page || page.userId !== userId) {
      throw new NotFoundException("Generated page not found.");
    }

    let files: Record<string, string>;
    try {
      files = JSON.parse(page.code) as Record<string, string>;
    } catch {
      this.logger.error(`Stored code for page ${pageId} is not valid JSON`);
      throw new NotFoundException("Generated page not found.");
    }

    const { npmPackages, localUiPaths } = scanImports(files);

    const archive = archiver("zip", { zlib: { level: 9 } });
    for (const [path, content] of Object.entries(files)) {
      archive.append(content, { name: path });
    }
    archive.append(buildPackageJson(npmPackages), { name: "package.json" });
    archive.append(buildReadme(files, localUiPaths), { name: "README.md" });

    // Buffer the whole (small) archive in memory and send it as one complete
    // response with a real Content-Length, rather than streaming it — a live
    // pipe through Nest's @Res() passthrough was producing a response some
    // browsers' fetch() couldn't parse (surfaced as a misleading CORS error),
    // even though curl and Node both read it back fine.
    const buffer = await new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      archive.on("data", (chunk: Buffer) => chunks.push(chunk));
      archive.on("error", (err) => reject(err));
      archive.on("end", () => resolve(Buffer.concat(chunks)));
      void archive.finalize();
    }).catch((err) => {
      this.logger.error(`Failed to build export archive for page ${pageId}`, err as Error);
      throw new InternalServerErrorException("Could not build the export archive.");
    });

    this.logger.log(`Export downloaded: page=${pageId} user=${userId} bytes=${buffer.length}`);

    return { filename: `landing-page-${pageId}.zip`, buffer };
  }
}
