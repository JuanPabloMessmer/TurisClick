import { IsNotEmpty, IsNumber, IsString, IsOptional, IsEnum } from 'class-validator';
import { AttractionStatus } from '../enums/attraction-status.enums';

export class CreateAttractionDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsString()
  opening_time: string;

  @IsNotEmpty()
  @IsString()
  closing_time: string;

  @IsNotEmpty()
  @IsNumber()
  price: number;

  @IsNotEmpty()
  @IsString()
  location: string;

  @IsOptional()
  @IsString()
  images?: string;

  @IsNotEmpty()
  @IsNumber()
  cityId: number;

  @IsNotEmpty()
  @IsNumber()
  categoryId: number;

  @IsOptional()
  @IsNumber()
  adminId?: number;

  @IsOptional()
  @IsEnum(AttractionStatus)
  status?: AttractionStatus;
}
