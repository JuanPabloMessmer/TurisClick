import { PartialType } from '@nestjs/mapped-types';
import { CreatePriceHistoryDto } from './create-price_history.dto';

export class UpdatePriceHistoryDto extends PartialType(CreatePriceHistoryDto) {}
