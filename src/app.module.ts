import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { PrismaModule } from './prisma/prisma.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { BudgetsModule } from './modules/budgets/budgets.module';
import { EpargneModule } from './modules/epargne/epargne.module';
import { PortefeuilleModule } from './modules/portefeuille/portefeuille.module';
import { RapportsModule } from './modules/rapports/rapports.module';
import { ComptesModule } from './modules/comptes/comptes.module';
import { ParametresModule } from './modules/parametres/parametres.module';
import { FirebaseService } from './modules/firebase/firebase.service';
import { FirebaseModule } from './modules/firebase/firebase.module';

@Module({
  imports: [
    ConfigModule.forRoot({
       isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'production' ? '.env' : '.env.local',
      }),
    PrismaModule,
    AuthModule,
    CategoriesModule,
    TransactionsModule,
    NotificationsModule,
    BudgetsModule,
    EpargneModule,
    PortefeuilleModule,
    RapportsModule,
    ComptesModule,
    ParametresModule,
    FirebaseModule,
  ],
  providers: [FirebaseService],
})
export class AppModule {}
