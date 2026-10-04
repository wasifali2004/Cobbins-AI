import { IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

export class GenerateRequestDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  prompt!: string;

  // Accepted for API-shape compatibility; the persisted owner is always the
  // authenticated user from the JWT, never this client-supplied value.
  @IsOptional()
  @IsString()
  userId?: string;
}
