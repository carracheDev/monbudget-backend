import { Body, Get, Controller, Post, Query, UseGuards } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { FilterTransactionDto } from './dto/filter-transaction.dto';
import { CreateTransactionDto } from './dto/create-transaction.dto';

@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(private transactionsService: TransactionsService) {}

  @Post()
  async create(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateTransactionDto,
  ) {
    return this.transactionsService.create(userId, dto);
  }

  @Get()
  async findAll(
    @CurrentUser('sub') userId: string,
    @Query() filters: FilterTransactionDto,
  ) {
    return this.transactionsService.findAll(userId, filters);
  }

  // AJOUTER ces routes
  @Get('stats/mois')
  async getResumeMois(@CurrentUser('sub') userId: string) {
    return this.transactionsService.getResumeMois(userId);
  }

  @Get('stats/depenses')
  async getDepensesMois(@CurrentUser('sub') userId: string) {
    return this.transactionsService.getTotalDepensesMois(userId);
  }
}
