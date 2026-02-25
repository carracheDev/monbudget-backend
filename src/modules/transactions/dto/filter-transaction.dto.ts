import { TypeTransaction } from '@prisma/client';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';

export class FilterTransactionDto {
  @IsEnum(TypeTransaction)
  @IsOptional()
  type?: TypeTransaction;

  @IsUUID()
  @IsOptional()
  categorieId?: string;

  @IsUUID()
  @IsOptional()
  compteId?: string;
}
