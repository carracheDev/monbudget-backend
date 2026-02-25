import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { PortefeuilleService } from './portefeuille.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CreateRechargeDto } from './dto/create-recharge.dto';
import { CreatePaiementDto } from './dto/create-paiement.dto';

@Controller('portefeuille')
@UseGuards(JwtAuthGuard)
export class PortefeuilleController {
  constructor(private portefeuilleService: PortefeuilleService) {}

  @Get()
  async getPortefeuille(@CurrentUser('sub') userId: string) {
    return this.portefeuilleService.getPortefeuille(userId);
  }

  @Post('recharger')
  async recharger(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateRechargeDto,
  ) {
    return this.portefeuilleService.recharger(userId, dto);
  }

  @Post('payer')
  async payer(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreatePaiementDto,
  ) {
    return this.portefeuilleService.payer(userId, dto);
  }

  @Get('recharges')
  async getRecharges(@CurrentUser('sub') userId: string) {
    return this.portefeuilleService.getRecharges(userId);
  }

  @Get('paiements')
  async getPaiements(@CurrentUser('sub') userId: string) {
    return this.portefeuilleService.getPaiement(userId);
  }
}
