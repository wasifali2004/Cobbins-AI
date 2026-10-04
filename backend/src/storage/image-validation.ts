import { BadRequestException } from "@nestjs/common";

export const ALLOWED_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_REFERENCE_IMAGE_BYTES = 5 * 1024 * 1024;

export function assertValidImage(file: { mimetype: string; size: number } | undefined, maxBytes: number): void {
  if (!file) throw new BadRequestException("No image file was provided.");
  if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.mimetype)) {
    throw new BadRequestException("Only JPG, PNG, or WEBP images are allowed.");
  }
  if (file.size > maxBytes) {
    throw new BadRequestException(`Image must be ${Math.round(maxBytes / 1024 / 1024)}MB or smaller.`);
  }
}

export function extensionFor(mimetype: string): string {
  return { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }[mimetype] ?? "bin";
}
