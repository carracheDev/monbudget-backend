import { IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateContributionDto {
  @IsNumber()
  @Min(1)
  montant: number;

  @IsUUID()
  objectifId: string;

  @IsOptional()
  @IsString()
  note?: string;
}
