import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttractionsService } from './attractions.service';
import { AttractionsController } from './attractions.controller';
import { Attraction } from './entities/attraction.entity';
import { City } from '../cities/entities/city.entity';
import { Category } from '../categories/entities/category.entity';
import { User } from '../users/entities/user.entity';
import { PriceHistoryModule } from '../price_history/price_history.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Attraction, City, Category, User]),
    PriceHistoryModule
  ],
  controllers: [AttractionsController],
  providers: [AttractionsService],
  exports: [AttractionsService]
})
export class AttractionsModule {}
