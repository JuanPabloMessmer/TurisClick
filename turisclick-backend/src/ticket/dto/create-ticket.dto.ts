import { IsDate, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTicketDto {
  @IsOptional()
  @IsString()
  code?: string; // Puede ser generado automáticamente en el servicio
  
  @IsNotEmpty()
  @IsNumber()
  attractionId: number;
  
  @IsNotEmpty()
  @IsNumber()
  sectorId: number;
  
  @IsOptional()
  @IsNumber()
  price?: number; // Puede obtenerse del sector
  
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  validFor: Date; // Fecha para la que es válido el ticket
  
  @IsOptional()
  @IsString()
  notes?: string;
}
