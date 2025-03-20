import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { PriceChangeType } from '../entities/price_history.entity';

export class CreatePriceHistoryDto {
  @IsOptional()
  @IsEnum(PriceChangeType)
  changeType?: PriceChangeType = PriceChangeType.ATTRACTION;

  @IsNotEmpty()
  @IsNumber()
  attractionId: number;
  
  @IsOptional()
  @IsNumber()
  sectorId?: number;
  
  @IsNotEmpty()
  @IsNumber()
  previousPrice: number;
  
  @IsNotEmpty()
  @IsNumber()
  newPrice: number;
  
  @IsOptional()
  @IsNumber()
  changedById?: number;
  
  @IsOptional()
  @IsString()
  reason?: string;
}
