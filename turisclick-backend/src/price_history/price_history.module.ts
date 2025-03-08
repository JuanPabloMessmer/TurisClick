import { Module } from '@nestjs/common';
import { PriceHistoryService } from './price_history.service';
import { PriceHistoryController } from './price_history.controller';

@Module({
  controllers: [PriceHistoryController],
  providers: [PriceHistoryService],
})
export class PriceHistoryModule {}
