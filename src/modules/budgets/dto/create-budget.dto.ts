import { PeriodeBudget } from '@prisma/client';
import {
  IsEnum,
  IsNumber,
  IsUUID,
  Min,
  IsOptional,
  IsDateString,
} from 'class-validator';

export class CreateBudgetDto {
  @IsNumber()
  @Min(1)
  montantLimite: number;

  @IsEnum(PeriodeBudget)
  periode: PeriodeBudget;

  @IsUUID()
  categorieId: string;

  @IsOptional()
  @IsDateString()
  dateDebut: string;

  @IsOptional()
  @IsDateString()
  dateFin: string;
}
