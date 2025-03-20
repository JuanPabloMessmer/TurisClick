import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SectorsService } from './sectors.service';
import { SectorsController } from './sectors.controller';
import { Sector } from './entities/sector.entity';
import { Attraction } from '../attractions/entities/attraction.entity';
import { PriceHistoryModule } from '../price_history/price_history.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Sector, Attraction]),
    PriceHistoryModule
  ],
  controllers: [SectorsController],
  providers: [SectorsService],
  exports: [SectorsService]
})
export class SectorsModule {}
