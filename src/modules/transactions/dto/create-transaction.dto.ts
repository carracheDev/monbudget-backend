import { TypeTransaction } from '@prisma/client';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  IsDateString,
  Min,
} from 'class-validator';

export class CreateTransactionDto {
  @IsNumber()
  @Min(0.01)
  montant: number;

  @IsEnum(TypeTransaction)
  type: TypeTransaction;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID()
  categorieId: string;

  @IsUUID()
  @IsOptional()
  compteId?: string; // Si non précisé, compte par défaut

  @IsDateString()
  @IsOptional()
  date?: string;
}
