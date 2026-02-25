import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RapportsService } from './rapports.service';
import { FilterRapportDto } from './dto/filter-rapport.dto';
import express from 'express';

@Controller('rapports')
@UseGuards(JwtAuthGuard)
export class RapportsController {
  constructor(private rapportService: RapportsService) {}

  @Get('resume')
  async resume(
    @CurrentUser('sub') userId: string,
    @Query() dto: FilterRapportDto,
  ) {
    return this.rapportService.getResume(userId, dto);
  }

  @Get('categories')
  async categories(
    @CurrentUser('sub') userId: string,
    @Query() dto: FilterRapportDto,
  ) {
    return this.rapportService.getParCategorie(userId, dto);
  }

  @Get('tendance')
  async tentance(@CurrentUser('sub') userId: string) {
    return this.rapportService.getTendance(userId);
  }

  @Get('export/pdf')
  async exportPDF(
    @CurrentUser('sub') userId: string,
    @Query() dot: FilterRapportDto,
    @Res() res: express.Response,
  ) {
    return this.rapportService.exportPDF(userId, dot, res);
  }

  @Get('export/excel')
  async exportExcel(
    @CurrentUser('sub') userId: string,
    @Query() dto: FilterRapportDto,
    @Res() res: express.Response,
  ) {
    return this.rapportService.exportExcel(userId, dto, res);
  }
}
