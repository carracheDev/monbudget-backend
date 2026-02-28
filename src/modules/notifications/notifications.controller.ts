import { Controller, Get, Param, Post, Delete, UseGuards, Body } from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Post(':id/lue')
  async marqueLue(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.notificationsService.marquerCommeLue(id, userId);
  }

  @Delete(':id')
  async supprimer(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.notificationsService.supprimerNotification(id, userId);
  }

  @Get()
  async getAll(@CurrentUser('sub') userId: string) {
    return this.notificationsService.getAllNotifications(userId);
  }

@Get('non-lues')
async getNonLues(@CurrentUser('sub') userId: string) {
  return this.notificationsService.getNotificationsNonLues(userId);
}
}
