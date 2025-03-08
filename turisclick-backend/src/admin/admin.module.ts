import { Module } from '@nestjs/common';
import { AdminController } from './admin/admin.controller';
import { AdminService } from './admin/admin.service';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  controllers: [AdminController],
  providers: [AdminService],
  imports: [AuthModule]
})
export class AdminModule {}
