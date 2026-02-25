import { IsNumber, IsString, Min } from 'class-validator';

export class CreateRechargeDto {
  @IsNumber()
  @Min(1)
  montant: number;

  @IsString()
  operateur: string;

  @IsString()
  numeroTelephone: string;
}
