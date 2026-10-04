import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class RetrieveRequestDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  category!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  styleQuery!: string;
}
