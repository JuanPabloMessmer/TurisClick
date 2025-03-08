import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/roles.guard';
import { Roles } from 'src/roles/roles.decorator';



@Controller('admin')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class AdminController {
  @Get('dashboard')
  @Roles('superadmin', 'admin')
  getDashboard() {
    return { message: 'Welcome to the admin dashboard' };
  }
}
