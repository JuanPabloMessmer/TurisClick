import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { Ticket, TicketStatus } from './entities/ticket.entity';
import { Attraction } from '../attractions/entities/attraction.entity';
import { User } from '../users/entities/user.entity';
import { Sector } from '../sectors/entities/sector.entity';
import { SectorsService } from '../sectors/sectors.service';

@Injectable()
export class TicketService {
  constructor(
    @InjectRepository(Ticket)
    private ticketRepository: Repository<Ticket>,
    @InjectRepository(Attraction)
    private attractionRepository: Repository<Attraction>,
    @InjectRepository(Sector)
    private sectorRepository: Repository<Sector>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private sectorsService: SectorsService
  ) {}

  async create(createTicketDto: CreateTicketDto, userId: number): Promise<Ticket> {
    try {
      // Verificar si existe la atracción
      const attraction = await this.attractionRepository.findOne({
        where: { id: createTicketDto.attractionId }
      });
      
      if (!attraction) {
        throw new NotFoundException(`Atracción con ID ${createTicketDto.attractionId} no encontrada`);
      }
      
      // Verificar si existe el sector
      const sector = await this.sectorRepository.findOne({
        where: { id: createTicketDto.sectorId, attractionId: createTicketDto.attractionId }
      });
      
      if (!sector) {
        throw new NotFoundException(`Sector con ID ${createTicketDto.sectorId} no encontrado para la atracción ${createTicketDto.attractionId}`);
      }
      
      // Verificar si el usuario existe
      const user = await this.userRepository.findOne({
        where: { id: userId }
      });
      
      if (!user) {
        throw new NotFoundException(`Usuario con ID ${userId} no encontrado`);
      }
      
      // Usar el precio del sector si no se proporciona uno
      const price = createTicketDto.price || sector.price;
      
      // Generar código único si no se proporciona uno
      const code = createTicketDto.code || `${uuidv4().substring(0, 8).toUpperCase()}`;
      
      const ticket = this.ticketRepository.create({
        ...createTicketDto,
        code,
        price,
        buyer: user,
        buyerId: userId,
        status: TicketStatus.ACTIVE
      });
      
      return await this.ticketRepository.save(ticket);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Error al crear el ticket: ${error.message}`);
    }
  }

  async findAll(): Promise<Ticket[]> {
    return await this.ticketRepository.find({
      relations: ['attraction', 'sector', 'buyer'],
      order: { purchaseDate: 'DESC' }
    });
  }

  async findByUser(userId: number): Promise<Ticket[]> {
    return await this.ticketRepository.find({
      where: { buyerId: userId },
      relations: ['attraction', 'sector'],
      order: { purchaseDate: 'DESC' }
    });
  }

  async findByAttraction(attractionId: number): Promise<Ticket[]> {
    return await this.ticketRepository.find({
      where: { attractionId },
      relations: ['sector', 'buyer'],
      order: { purchaseDate: 'DESC' }
    });
  }

  async findByCode(code: string): Promise<Ticket> {
    const ticket = await this.ticketRepository.findOne({
      where: { code },
      relations: ['attraction', 'sector', 'buyer']
    });
    
    if (!ticket) {
      throw new NotFoundException(`Ticket con código ${code} no encontrado`);
    }
    
    return ticket;
  }

  async findOne(id: number): Promise<Ticket> {
    const ticket = await this.ticketRepository.findOne({
      where: { id },
      relations: ['attraction', 'sector', 'buyer']
    });
    
    if (!ticket) {
      throw new NotFoundException(`Ticket con ID ${id} no encontrado`);
    }
    
    return ticket;
  }

  async update(id: number, updateTicketDto: UpdateTicketDto): Promise<Ticket> {
    const ticket = await this.findOne(id);
    
    // Si se está actualizando el estado a USADO, establecer la fecha de uso
    if (updateTicketDto.status === TicketStatus.USED && ticket.status !== TicketStatus.USED) {
      updateTicketDto.usedDate = new Date();
    }
    
    Object.assign(ticket, updateTicketDto);
    
    return await this.ticketRepository.save(ticket);
  }

  async useTicket(id: number): Promise<Ticket> {
    const ticket = await this.findOne(id);
    
    if (ticket.status !== TicketStatus.ACTIVE) {
      throw new BadRequestException(`El ticket no puede ser usado, estado actual: ${ticket.status}`);
    }
    
    // Verificar si el ticket es válido para la fecha actual
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const validForDate = new Date(ticket.validFor);
    validForDate.setHours(0, 0, 0, 0);
    
    if (today.getTime() !== validForDate.getTime()) {
      throw new BadRequestException(`El ticket solo es válido para la fecha ${ticket.validFor.toISOString().split('T')[0]}`);
    }
    
    ticket.status = TicketStatus.USED;
    ticket.usedDate = new Date();
    
    return await this.ticketRepository.save(ticket);
  }

  async cancel(id: number): Promise<Ticket> {
    const ticket = await this.findOne(id);
    
    if (ticket.status !== TicketStatus.ACTIVE) {
      throw new BadRequestException(`El ticket no puede ser cancelado, estado actual: ${ticket.status}`);
    }
    
    ticket.status = TicketStatus.CANCELLED;
    
    return await this.ticketRepository.save(ticket);
  }

  async remove(id: number): Promise<void> {
    const ticket = await this.findOne(id);
    await this.ticketRepository.remove(ticket);
  }
}
