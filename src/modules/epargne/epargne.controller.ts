import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { EpargneService } from './epargne.service';
import { CreateContributionDto } from './dto/create-contribution.dto';
import { CreateObjectifDto } from './dto/create-objectif.dto';

@Controller('epargne')
@UseGuards(JwtAuthGuard)
export class EpargneController {
  constructor(private epargneService: EpargneService) {}

  @Get()
  async findAll(@CurrentUser('sub') userId: string) {
    return this.epargneService.findAll(userId);
  }

  @Post()
  async create(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateObjectifDto,
  ) {
    return this.epargneService.create(userId, dto);
  }

  @Delete(':id')
  async remove(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.epargneService.remove(userId, id);
  }

  @Post('contribution')
  async addContribution(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateContributionDto,
  ) {
    return this.epargneService.addContribution(userId, dto);
  }
}
