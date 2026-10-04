import { Injectable } from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";
import { StorageService } from "../storage/storage.service";
import { assertValidImage, extensionFor } from "../storage/image-validation";

export const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

export interface ProfileResult {
  id: string;
  name: string;
  email: string;
  image: string | null;
}

@Injectable()
export class ProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async updateProfile(userId: string, name: string, avatar?: Express.Multer.File): Promise<ProfileResult> {
    let imageUrl: string | undefined;
    if (avatar) {
      assertValidImage(avatar, MAX_AVATAR_BYTES);
      imageUrl = await this.storage.uploadPublicImage(
        `avatars/${userId}`,
        `avatar.${extensionFor(avatar.mimetype)}`,
        avatar.buffer,
        avatar.mimetype,
      );
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { name, ...(imageUrl ? { image: imageUrl } : {}) },
      select: { id: true, name: true, email: true, image: true },
    });
  }
}
