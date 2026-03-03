import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private app: admin.app.App;
  private readonly logger = new Logger(FirebaseService.name);
  private isFirebaseInitialized = false;

  constructor(private config: ConfigService) {}

  onModuleInit() {
    this.initializeFirebase();
  }

  private initializeFirebase() {
    const projectId = this.config.get('FIREBASE_PROJECT_ID');
    const clientEmail = this.config.get('FIREBASE_CLIENT_EMAIL');
    const privateKey = this.config.get('FIREBASE_PRIVATE_KEY');

    // Check if all required Firebase credentials are present
    if (!projectId || !clientEmail || !privateKey) {
      this.logger.warn('⚠️ Firebase credentials not configured. Firebase notifications will be disabled.');
      this.logger.warn(`  - FIREBASE_PROJECT_ID: ${projectId ? 'set' : 'MISSING'}`);
      this.logger.warn(`  - FIREBASE_CLIENT_EMAIL: ${clientEmail ? 'set' : 'MISSING'}`);
      this.logger.warn(`  - FIREBASE_PRIVATE_KEY: ${privateKey ? 'set' : 'MISSING'}`);
      this.isFirebaseInitialized = false;
      return;
    }

    if (!admin.apps.length) {
      try {
        this.app = admin.initializeApp({
          credential: admin.credential.cert({
            projectId: projectId,
            clientEmail: clientEmail,
            privateKey: privateKey.replace(/\\n/g, '\n'),
          }),
        });
        this.isFirebaseInitialized = true;
        this.logger.log('✅ Firebase initialisé avec succès');
      } catch (error) {
        this.logger.error('❌ Erreur lors de l\'initialisation de Firebase:', error);
        this.isFirebaseInitialized = false;
      }
    }
  }

  async sendNotification(fcmToken: string, title: string, body: string, data?: Record<string, string>) {
    if (!this.isFirebaseInitialized) {
      this.logger.warn('⚠️ Firebase non initialisé. Notification non envoyée.');
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
      this.logger.log('✅ Notification envoyée:', title);
    } catch (error) {
      this.logger.error('❌ Erreur notification:', error);
    }
  }
