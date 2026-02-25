import { TypeCompte } from '@prisma/client';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateCompteDto {
  @IsString()
  nom: string;

  @IsEnum(TypeCompte)
  type: TypeCompte;

  @IsNumber()
  soldeInitial: number;

  @IsOptional()
  @IsString()
  devise?: string;

  @IsOptional()
  @IsString()
  operateur: string;

  @IsOptional()
  @IsString()
  numeroTelephone: string;
}
