import { Type } from 'class-transformer';
import { IsArray, IsDate, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { CreateTicketDto } from './create-ticket.dto';

export class TicketPurchaseItem {
  @IsNotEmpty()
  @IsNumber()
  attractionId: number;
  
  @IsNotEmpty()
  @IsNumber()
  sectorId: number;
  
  @IsNotEmpty()
  @IsNumber()
  quantity: number;
  
  @IsOptional()
  @IsNumber()
  price?: number;
  
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  validFor: Date;
}

export class CreateTicketsTransactionDto {
  @IsNotEmpty()
  @IsString()
  transactionId: string;
  
  @IsNotEmpty()
  @IsNumber()
  userId: number;
  
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TicketPurchaseItem)
  items: TicketPurchaseItem[];
  
  @IsOptional()
  @IsString()
  notes?: string;
} 