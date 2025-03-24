import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, HttpCode, HttpStatus, Req, BadRequestException, NotFoundException } from '@nestjs/common';
import { Request } from 'express';
import { TicketService } from './ticket.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Public } from '../auth/public.decorator';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';

@Controller('ticket')
export class TicketController {
  constructor(
    private readonly ticketService: TicketService,
    private readonly configService: ConfigService
  ) {}

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

  @Get('user/:userId')
  @Public()
  @HttpCode(HttpStatus.OK)
  async findByUser(@Param('userId') userId: string) {
    console.log(`Buscando tickets para el usuario con ID: ${userId}`);
    
    try {
      const tickets = await this.ticketService.findByUser(+userId);
      
      console.log(`Se encontraron ${tickets.length} tickets para el usuario ${userId}`);
      
      return {
        status: 'success',
        message: `Tickets del usuario ${userId} obtenidos exitosamente`,
        data: tickets
      };
    } catch (error) {
      console.error(`Error al obtener tickets del usuario ${userId}:`, error);
      return {
        status: 'error',
        message: `Error al obtener tickets: ${error.message}`,
        error: error.message
      };
    }
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

  /**
   * Verifica un ticket cifrado enviado desde la app
   * Formato esperado: {datos_base64}.{firma}
   */
  @Post('verify-encrypted')
  @Public()
  @HttpCode(HttpStatus.OK)
  async verifyEncryptedTicket(@Body() body: { encryptedData: string }) {
    try {
      console.log('Verificando ticket cifrado:', body.encryptedData);
      
      // Obtener la clave secreta de encriptación
      const secretKey = this.configService.get<string>('TICKET_SECRET_KEY');
      
      if (!secretKey) {
        throw new BadRequestException('Clave de encriptación no configurada en el servidor');
      }
      
      // Separar datos y firma
      const [encodedData, signature] = body.encryptedData.split('.');
      
      if (!encodedData || !signature) {
        throw new BadRequestException('Formato de datos inválido');
      }
      
      // Verificar la firma
      const expectedSignature = crypto
        .createHash('sha256')
        .update(encodedData + secretKey)
        .digest('hex')
        .substring(0, 16);
      
      if (signature !== expectedSignature) {
        throw new BadRequestException('Firma inválida, el ticket ha sido manipulado');
      }
      
      // Decodificar datos
      let ticketData;
      try {
        const decodedData = Buffer.from(encodedData, 'base64').toString('utf-8');
        ticketData = JSON.parse(decodedData);
      } catch (error) {
        throw new BadRequestException('Error al decodificar datos del ticket');
      }
      
      if (!ticketData.code || !ticketData.id) {
        throw new BadRequestException('Datos de ticket incompletos');
      }
      
      // Verificar que el ticket existe
      const ticket = await this.ticketService.findOne(ticketData.id);
      
      if (!ticket) {
        throw new NotFoundException(`Ticket con ID ${ticketData.id} no encontrado`);
      }
      
      // Verificar que el código coincide
      if (ticket.code !== ticketData.code) {
        throw new BadRequestException('Código de ticket inválido');
      }
      
      // Verificar que el ticket esté activo
      if (ticket.status !== 'ACTIVE') {
        return {
          status: 'error',
          message: `Este ticket no está activo. Estado actual: ${ticket.status}`,
          ticketStatus: ticket.status
        };
      }
      
      // Verificar timestamp (opcional: añadir una verificación de que el código no sea muy antiguo)
      
      return {
        status: 'success',
        message: 'Ticket verificado con éxito',
        data: {
          id: ticket.id,
          code: ticket.code,
          status: ticket.status,
          attraction: ticket.attraction.name,
          sector: ticket.sector.name,
          validFor: ticket.validFor
        }
      };
    } catch (error) {
      console.error('Error al verificar ticket cifrado:', error);
      
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Error al verificar ticket',
        error: error instanceof Error ? error.message : error
      };
    }
  }
}
