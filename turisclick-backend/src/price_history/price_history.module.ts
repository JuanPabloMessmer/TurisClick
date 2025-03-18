import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PriceHistoryService } from './price_history.service';
import { PriceHistoryController } from './price_history.controller';
import { PriceHistory } from './entities/price_history.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PriceHistory])],
  controllers: [PriceHistoryController],
  providers: [PriceHistoryService],
  exports: [PriceHistoryService]
})
export class PriceHistoryModule {}
