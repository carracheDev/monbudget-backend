// ✅ CORRIGER filter-rapport.dto.ts
import { PeriodeBudget } from '@prisma/client';
import { IsEnum, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class FilterRapportDto {
  @IsEnum(PeriodeBudget)
  periode: PeriodeBudget;

  @IsOptional()
  @IsNumber()
  @Type(() => Number) // ✅ convertit string → number automatiquement
  mois?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number) // ✅ convertit string → number automatiquement
  annee?: number;
}