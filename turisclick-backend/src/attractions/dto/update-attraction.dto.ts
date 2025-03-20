import { PartialType } from '@nestjs/mapped-types';
import { IsNumber, IsString, IsOptional, IsEnum, IsUrl, IsArray } from 'class-validator';
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
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsUrl()
  googleMapsUrl?: string;

  @IsOptional()
  @IsEnum(AttractionStatus)
  status?: AttractionStatus;

  @IsOptional()
  @IsNumber()
  cityId?: number;

  @IsOptional()
  @IsNumber()
  categoryId?: number;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  categoryIds?: number[];

  @IsOptional()
  @IsNumber()
  adminId?: number;

  @IsOptional()
  @IsArray()
  images?: string[];
}
