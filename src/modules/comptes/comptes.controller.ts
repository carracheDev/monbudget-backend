import {
  Controller,
  UseGuards,
  Get,
  Body,
  Post,
  Patch,
  Delete,
  Param,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ComptesService } from './comptes.service';
import { CreateCompteDto } from './dto/create-compte.dto';
import { UpdateCompteDto } from './dto/update-compte.dto';

@Controller('comptes')
@UseGuards(JwtAuthGuard)
export class ComptesController {
  constructor(private compteService: ComptesService) {}

  @Get()
  async findAll(@CurrentUser('sub') userId: string) {
    return this.compteService.findAll(userId);
  }

  @Post()
  async create(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateCompteDto,
  ) {
    return this.compteService.create(userId, dto);
  }

  @Patch(':id')
  async update(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCompteDto,
  ) {
    return this.compteService.update(userId, id, dto);
  }

  @Delete(':id')
  async remove(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.compteService.remove(userId, id);
  }

  @Patch(':id/defaut')
  async setDefaut(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.compteService.setDefaut(userId, id);
  }
}
