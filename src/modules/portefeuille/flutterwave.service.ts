import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Flutterwave from 'flutterwave-node-v3';

@Injectable()
export class FlutterwaveService {
  private readonly logger = new Logger(FlutterwaveService.name);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private flw: any;

  constructor(private config: ConfigService) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
    this.flw = new Flutterwave(
      this.config.get('FLW_PUBLIC_KEY'),
      this.config.get('FLW_SECRET_KEY'),
    );
  }

  async initierPaiementMobileMoney(
    montant: number,
    operateur: string,
    numero: string,
    userId: string,
  ): Promise<{ status: string; data?: { flw_ref?: string } }> {
    const payload = {
      phone_number: numero,
      amount: montant,
      currency: 'XOF',
      country: 'BJ', // ← ajouter le pays Bénin !
      email: `${userId}@monbudget.app`,
      tx_ref: `MB-${Date.now()}-${userId}`,
      network: operateur,
      fullname: 'MonBudget User',
    };

    this.logger.log(`Initiation paiement: ${JSON.stringify(payload)}`);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    return await this.flw.MobileMoney.franco_phone(payload);
  }

  async verifierPaiement(
    transactionId: string,
  ): Promise<{ status: string; data?: unknown }> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    return await this.flw.Transaction.verify({ id: transactionId });
  }
}
