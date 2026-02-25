import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ParametresService } from './parametres.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { UpdateParametresDto } from './dto/update-parametres.dto';

@Controller('parametres')
@UseGuards(JwtAuthGuard)
export class ParametresController {
  constructor(private parametreService: ParametresService) {}

  @Get()
  async getParametres(@CurrentUser('sub') userId: string) {
    return this.parametreService.getParametres(userId);
  }

  @Patch()
  async update(
    @CurrentUser('sub') userId: string,
    @Body() dto: UpdateParametresDto,
  ) {
    return this.parametreService.updateParametres(userId, dto);
  }
}
