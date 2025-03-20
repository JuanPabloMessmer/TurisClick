import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PriceHistoryService } from './price_history.service';
import { PriceHistoryController } from './price_history.controller';
import { PriceHistory } from './entities/price_history.entity';
import { Sector } from '../sectors/entities/sector.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PriceHistory, Sector])],
  controllers: [PriceHistoryController],
  providers: [PriceHistoryService],
  exports: [PriceHistoryService]
})
export class PriceHistoryModule {}
