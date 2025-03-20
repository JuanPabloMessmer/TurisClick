import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TicketService } from './ticket.service';
import { TicketController } from './ticket.controller';
import { Ticket } from './entities/ticket.entity';
import { Attraction } from '../attractions/entities/attraction.entity';
import { Sector } from '../sectors/entities/sector.entity';
import { User } from '../users/entities/user.entity';
import { SectorsModule } from '../sectors/sectors.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Ticket, Attraction, Sector, User]),
    SectorsModule
  ],
  controllers: [TicketController],
  providers: [TicketService],
  exports: [TicketService]
})
export class TicketModule {}
