import { PartialType } from '@nestjs/mapped-types';
import { IsNumber, IsString, IsOptional, IsEnum } from 'class-validator';
import { CreateAttractionDto } from './create-attraction.dto';
import { AttractionStatus } from '../enums/attraction-status.enums';

export class UpdateAttractionDto extends PartialType(CreateAttractionDto) {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  opening_time?: string;

  @IsOptional()
  @IsString()
  closing_time?: string;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  images?: string;

  @IsOptional()
  @IsNumber()
  cityId?: number;

  @IsOptional()
  @IsNumber()
  categoryId?: number;

  @IsOptional()
  @IsNumber()
  adminId?: number;

  @IsOptional()
  @IsEnum(AttractionStatus)
  status?: AttractionStatus;
}
