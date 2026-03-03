import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);
  private isInitialized = false;

  constructor(private config: ConfigService) {}

  onModuleInit() {
    const projectId = this.config.get<string>('FIREBASE_PROJECT_ID') || process.env.FIREBASE_PROJECT_ID;
    const clientEmail = this.config.get<string>('FIREBASE_CLIENT_EMAIL') || process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = (this.config.get<string>('FIREBASE_PRIVATE_KEY') || process.env.FIREBASE_PRIVATE_KEY)?.replace(/\\n/g, '\n');

    if (!projectId || !clientEmail || !privateKey) {
      this.logger.warn('⚠️ Firebase credentials not configured. Firebase notifications will be disabled.');
      if (!projectId) this.logger.warn('  - FIREBASE_PROJECT_ID: MISSING');
      if (!clientEmail) this.logger.warn('  - FIREBASE_CLIENT_EMAIL: MISSING');
      if (!privateKey) this.logger.warn('  - FIREBASE_PRIVATE_KEY: MISSING');
      return;
    }

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      this.isInitialized = true;
      this.logger.log('✅ Firebase Admin SDK initialisé');
    }
  }

  async sendNotification(fcmToken: string, title: string, body: string, data?: Record<string, string>) {
    if (!this.isInitialized) {
      this.logger.warn('⚠️ Firebase non initialisé — notification ignorée');
      return;
    }
    try {
      await admin.messaging().send({
        token: fcmToken,
        notification: { title, body },
        data: data ?? {},
        android: {
          notification: {
            channelId: 'monbudget_channel',
            priority: 'high',
            sound: 'default',
          },
        },
      });
      this.logger.log(`✅ Notification envoyée: ${title}`);
    } catch (e) {
      this.logger.error(`❌ Erreur notification: ${e}`);
    }
  }
}