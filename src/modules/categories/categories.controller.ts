import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategorieDto } from './dto/create-categorie.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('categories')
@UseGuards(JwtAuthGuard) // ← AJOUTEZ CECI
export class CategoriesController {
  constructor(private categoriesService: CategoriesService) {}

  @Get()
  async findAll(@CurrentUser('sub') userId: string) {
    return this.categoriesService.findAll(userId);
  }

  @Post()
  async create(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateCategorieDto,
  ) {
    return this.categoriesService.create(userId, dto);
  }

  @Delete(':id')
  async remove(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.categoriesService.remove(userId, id);
  }
}
