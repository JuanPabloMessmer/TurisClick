import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsString } from 'class-validator';
import { CreatePriceHistoryDto } from './create-price_history.dto';

export class UpdatePriceHistoryDto extends PartialType(CreatePriceHistoryDto) {
  // Solo permitimos actualizar la razón del cambio, no los precios ni la atracción
  @IsOptional()
  @IsString()
  reason?: string;
}
