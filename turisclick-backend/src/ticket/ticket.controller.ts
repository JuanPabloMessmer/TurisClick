import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, HttpCode, HttpStatus, Req } from '@nestjs/common';
import { Request } from 'express';
import { TicketService } from './ticket.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('tickets')
export class TicketController {
  constructor(private readonly ticketService: TicketService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Req() req: Request, @Body() createTicketDto: CreateTicketDto) {
    const userId = (req.user as any).userId;
    const ticket = await this.ticketService.create(createTicketDto, userId);
    return {
      status: 'success',
      message: 'Ticket creado exitosamente',
      data: ticket
    };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll() {
    const tickets = await this.ticketService.findAll();
    return {
      status: 'success',
      message: 'Tickets obtenidos exitosamente',
      data: tickets
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-tickets')
  @HttpCode(HttpStatus.OK)
  async findMyTickets(@Req() req: Request) {
    const userId = (req.user as any).userId;
    const tickets = await this.ticketService.findByUser(userId);
    return {
      status: 'success',
      message: 'Mis tickets obtenidos exitosamente',
      data: tickets
    };
  }

  @Get('attraction/:attractionId')
  @HttpCode(HttpStatus.OK)
  async findByAttraction(@Param('attractionId') attractionId: string) {
    const tickets = await this.ticketService.findByAttraction(+attractionId);
    return {
      status: 'success',
      message: `Tickets para la atracción ${attractionId} obtenidos exitosamente`,
      data: tickets
    };
  }

  @Get('code/:code')
  @HttpCode(HttpStatus.OK)
  async findByCode(@Param('code') code: string) {
    const ticket = await this.ticketService.findByCode(code);
    return {
      status: 'success',
      message: 'Ticket obtenido exitosamente',
      data: ticket
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string) {
    const ticket = await this.ticketService.findOne(+id);
    return {
      status: 'success',
      message: 'Ticket obtenido exitosamente',
      data: ticket
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async update(@Param('id') id: string, @Body() updateTicketDto: UpdateTicketDto) {
    const ticket = await this.ticketService.update(+id, updateTicketDto);
    return {
      status: 'success',
      message: `Ticket con ID ${id} actualizado exitosamente`,
      data: ticket
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/use')
  @HttpCode(HttpStatus.OK)
  async useTicket(@Param('id') id: string) {
    const ticket = await this.ticketService.useTicket(+id);
    return {
      status: 'success',
      message: `Ticket con ID ${id} utilizado exitosamente`,
      data: ticket
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/cancel')
  @HttpCode(HttpStatus.OK)
  async cancelTicket(@Param('id') id: string) {
    const ticket = await this.ticketService.cancel(+id);
    return {
      status: 'success',
      message: `Ticket con ID ${id} cancelado exitosamente`,
      data: ticket
    };
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    await this.ticketService.remove(+id);
    return {
      status: 'success',
      message: `Ticket con ID ${id} eliminado exitosamente`
    };
  }
}
