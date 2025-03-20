import { IsNotEmpty, IsNumber, IsString, IsOptional, IsEnum, IsUrl, IsArray, Min, Max, IsNotEmptyObject, ArrayMinSize } from 'class-validator';
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

  /**
   * @deprecated Se recomienda definir precios por sector en lugar de un precio general para la atracción
   */
  @IsOptional()
  @IsNumber()
  price?: number;

  @IsNotEmpty()
  @IsString()
  location: string;
  
  @IsNotEmpty()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;
  
  @IsNotEmpty()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;
  
  @IsOptional()
  @IsUrl()
  googleMapsUrl?: string;

  @IsNotEmpty()
  @IsNumber()
  cityId: number;

  @IsOptional()
  @IsNumber()
  categoryId?: number;

  @IsArray()
  @IsNumber({}, { each: true })
  @ArrayMinSize(1)
  categoryIds: number[];

  @IsNotEmpty()
  @IsNumber()
  adminId: number;

  @IsArray()
  @IsOptional()
  images?: string[];

  @IsOptional()
  @IsEnum(AttractionStatus)
  status?: AttractionStatus;
}
