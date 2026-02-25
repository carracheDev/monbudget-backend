import { IsString, IsOptional, IsEnum, IsHexColor } from 'class-validator';
import { TypeCategorie } from '@prisma/client';

export class CreateCategorieDto {
  @IsString()
  nom: string;

  @IsOptional()
  @IsString()
  icone?: string;

  @IsOptional()
  @IsHexColor()
  couleur?: string;

  @IsOptional()
  @IsEnum(TypeCategorie)
  type?: TypeCategorie = TypeCategorie.DEPENSE;
}
