import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { BudgetsService } from './budgets.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateBudgetDto } from './dto/create-budget.dto';

@Controller('budgets')
@UseGuards(JwtAuthGuard)
export class BudgetsController {
  constructor(private budgetService: BudgetsService) {}

  @Get()
  async findAll(@CurrentUser('sub') userId: string) {
    return this.budgetService.findAll(userId);
  }

  @Post()
  async create(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateBudgetDto,
  ) {
    return this.budgetService.create(userId, dto);
  }

  @Delete(':id')
  async remove(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string, // ← 'id' entre guillemets
  ) {
    return this.budgetService.remove(userId, id);
  }
}
