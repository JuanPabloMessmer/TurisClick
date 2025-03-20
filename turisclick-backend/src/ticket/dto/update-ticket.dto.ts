import { PartialType } from '@nestjs/mapped-types';
import { IsDate, IsEnum, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateTicketDto } from './create-ticket.dto';
import { TicketStatus } from '../entities/ticket.entity';

export class UpdateTicketDto extends PartialType(CreateTicketDto) {
  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;
  
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  usedDate?: Date;
}
