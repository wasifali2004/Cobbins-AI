import { Transform } from "class-transformer";
import { IsEmail, IsString, Length, MinLength } from "class-validator";

export class SignupDto {
  @IsString()
  @Length(2, 80)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? value.trim() : value,
  )
  name: string;

  @IsEmail()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? value.trim().toLowerCase() : value,
  )
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}
