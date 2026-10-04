import { Transform } from "class-transformer";
import { IsString, Length } from "class-validator";

export class UpdateProfileDto {
  @IsString()
  @Length(2, 80)
  @Transform(({ value }: { value: unknown }) => (typeof value === "string" ? value.trim() : value))
  name!: string;
}
