import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateObjectifDto {
  @IsString()
  nom: string;

  @IsString()
  icone: string;

  @IsNumber()
  @Min(1)
  montantCible: number;

  @IsDateString()
  dateEcheance: string;

  @IsOptional()
  @IsString()
  description?: string;
}
