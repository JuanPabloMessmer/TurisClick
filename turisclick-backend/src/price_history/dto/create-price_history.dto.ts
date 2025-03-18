import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreatePriceHistoryDto {
  @IsNotEmpty()
  @IsNumber()
  attractionId: number;
  
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
