import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { Theme, Langue } from '@prisma/client';

export class UpdateParametresDto {
  @IsOptional()
  @IsEnum(Theme)
  theme?: Theme;

  @IsOptional()
  @IsEnum(Langue)
  langue?: Langue;

  @IsOptional()
  @IsBoolean()
  biometrie?: boolean;

  @IsOptional()
  @IsBoolean()
  notificationsPush?: boolean;

  @IsOptional()
  @IsBoolean()
  notificationsEmail?: boolean;

  @IsOptional()
  @IsString()
  pinCode?: string;
}
