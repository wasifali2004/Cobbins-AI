import { Transform } from "class-transformer";
import { IsEmail, IsOptional, IsString, IsUrl, Length } from "class-validator";

export class OAuthLoginDto {
  @IsString()
  @Length(1, 80)
  @Transform(({ value }: { value: unknown }) => (typeof value === "string" ? value.trim() : value))
  name: string;

  @IsEmail()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? value.trim().toLowerCase() : value,
  )
  email: string;

  @IsOptional()
  @IsUrl()
  image?: string;
}
