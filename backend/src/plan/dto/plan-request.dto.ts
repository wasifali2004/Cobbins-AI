import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class PlanRequestDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  prompt!: string;
}
