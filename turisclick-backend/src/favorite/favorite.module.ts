import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FavoriteService } from './favorite.service';
import { FavoriteController } from './favorite.controller';
import { Favorite } from './entities/favorite.entity';
import { User } from '../users/entities/user.entity';
import { Attraction } from '../attractions/entities/attraction.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Favorite, User, Attraction])],
  controllers: [FavoriteController],
  providers: [FavoriteService],
  exports: [FavoriteService],
})
export class FavoriteModule {}
