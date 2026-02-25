import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateParametresDto } from './dto/update-parametres.dto';

@Injectable()
export class ParametresService {
  constructor(private prisma: PrismaService) {}

  async getParametres(userId: string) {
    let parametres = await this.prisma.parametres.findUnique({
      where: { utilisateurId: userId },
    });

    if (!parametres) {
      parametres = await this.prisma.parametres.create({
        data: { utilisateurId: userId },
      });
    }

    return parametres;
  }

  async updateParametres(userId: string, dto: UpdateParametresDto) {
    // getParametres crée automatiquement si inexistant
    await this.getParametres(userId);

    return this.prisma.parametres.update({
      where: { utilisateurId: userId },
      data: { ...dto },
    });
  }
}
