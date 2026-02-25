import { PeriodeBudget } from '@prisma/client';
import { IsEnum, IsNumber, IsOptional } from 'class-validator';

export class FilterRapportDto {
  @IsEnum(PeriodeBudget)
  periode: PeriodeBudget;

  @IsOptional()
  @IsNumber()
  mois?: string; // ex: "2026-02"

  @IsOptional()
  @IsNumber()
  annee?: string; // ex: 2026
}
