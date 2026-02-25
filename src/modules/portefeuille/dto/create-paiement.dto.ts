import { IsNumber, IsString, Min, IsOptional } from 'class-validator';

export class CreatePaiementDto {
  @IsNumber()
  @Min(1)
  montant: number;

  @IsString()
  operateur: string;

  @IsString()
  numeroDestinataire: string;

  @IsString()
  @IsOptional()
  description: string;
}
