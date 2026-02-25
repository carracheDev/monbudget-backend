import { Module } from '@nestjs/common';
import { PortefeuilleService } from './portefeuille.service';
import { PortefeuilleController } from './portefeuille.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { FlutterwaveService } from './flutterwave.service';

@Module({
  imports: [
    PrismaModule,
    NotificationsModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET'),
        signOptions: { expiresIn: '15m' },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [PortefeuilleService, FlutterwaveService],
  controllers: [PortefeuilleController],
})
export class PortefeuilleModule {}
