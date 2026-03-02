import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  // ─────────────────────────────────────────────
  // INSCRIPTION
  // ─────────────────────────────────────────────
  async register(registerDto: RegisterDto) {
    this.logger.log(`Enregistrement de l'utilisateur : ${registerDto.email}`);

    // Vérifier si l'email existe déjà
    const existingUser = await this.prisma.utilisateur.findUnique({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Un utilisateur avec cet email existe déjà.');
    }

    // Hasher le mot de passe avec bcrypt (10 rounds)
    const hashedPassword = await bcrypt.hash(registerDto.motDePasse, 10);

    // Créer l'utilisateur en base
    const user = await this.prisma.utilisateur.create({
      data: {
        nomComplet: registerDto.nomComplet,
        email: registerDto.email,
        motDePasse: hashedPassword,
        firebaseUid: crypto.randomUUID(),
        emailVerifie: false,
      },
      select: {
        id: true,
        nomComplet: true,
        email: true,
        dateCreation: true,
      },
    });

    return {
      message: 'Inscription réussie. Vérifiez votre email.',
      user,
    };
  }

  // ─────────────────────────────────────────────
  // CONNEXION
  // ─────────────────────────────────────────────
  async login(loginDto: LoginDto) {
    this.logger.log(`Connexion de l'utilisateur : ${loginDto.email}`);

    // Trouver l'utilisateur par email
    const user = await this.prisma.utilisateur.findUnique({
      where: { email: loginDto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Email ou mot de passe incorrect.');
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(
      loginDto.motDePasse,
      user.motDePasse,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Email ou mot de passe incorrect.');
    }

    // Mettre à jour la dernière connexion
    await this.prisma.utilisateur.update({
      where: { id: user.id },
      data: { derniereConnexion: new Date() },
    });

    // Générer les tokens JWT
    const payload = { email: user.email, sub: user.id };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.config.get('JWT_SECRET'),
      expiresIn: '15m', // expire dans 15 minutes
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.config.get('JWT_REFRESH_SECRET'),
      expiresIn: '7d', // expire dans 7 jours
    });

    // Enregistrer la session en base
    // Cela permet de suivre les appareils connectés et révoquer à distance
    await this.prisma.session.create({
      data: {
        token: refreshToken,
        utilisateurId: user.id,
        dateExpiration: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // +7 jours
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 900,
      user: {
        id: user.id,
        nomComplet: user.nomComplet,
        email: user.email,
      },
    };
  }

  // ─────────────────────────────────────────────
  // RAFRAÎCHIR LE TOKEN
  // ─────────────────────────────────────────────
  async refresh(refreshToken: string) {
    try {
      // Vérifier la signature JWT du refresh token
      const payload = this.jwtService.verify<{ sub: string; email: string }>(
        refreshToken,
        { secret: this.config.get('JWT_REFRESH_SECRET') },
      );

      // Vérifier que la session est encore valide en base
      // Cela empêche l'utilisation d'un token révoqué (après logout)
      const session = await this.prisma.session.findUnique({
        where: { token: refreshToken },
      });

      if (!session || !session.estValide) {
        throw new UnauthorizedException('Session expirée ou révoquée');
      }

      // Vérifier que l'utilisateur existe encore
      const user = await this.prisma.utilisateur.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new UnauthorizedException('Utilisateur introuvable');
      }

      // Générer un nouveau access token
      const newAccessToken = this.jwtService.sign(
        { sub: user.id, email: user.email },
        { secret: this.config.get('JWT_SECRET'), expiresIn: '15m' },
      );

      return {
        accessToken: newAccessToken,
        refreshToken, // on retourne le même refresh token
        expiresIn: 900,
      };
    } catch {
      throw new UnauthorizedException('Refresh token invalide');
    }
  }

  // ─────────────────────────────────────────────
  // DÉCONNEXION
  // ─────────────────────────────────────────────
  async logout(refreshToken: string) {
    this.logger.log('Déconnexion utilisateur');

    // Révoquer la session en base
    // Le token ne pourra plus être utilisé même s'il n'est pas encore expiré
    await this.prisma.session.updateMany({
      where: { token: refreshToken },
      data: {
        estValide: false,
        dateRevocation: new Date(),
      },
    });

    return { message: 'Déconnexion réussie' };
  }

  // ─────────────────────────────────────────────
  // VÉRIFICATION EMAIL (TODO)
  // ─────────────────────────────────────────────
  verifyEmail(token: string) {
    this.logger.log(`Vérification email avec token: ${token}`);
    // TODO: Implémenter la logique de vérification
    return { message: 'Email vérifié avec succès' };
  }

  // auth.service.ts
async saveFcmToken(userId: string, fcmToken: string) {
  return this.prisma.utilisateur.update({
    where: { id: userId },
    data: { fcmToken },
  });
}
}
