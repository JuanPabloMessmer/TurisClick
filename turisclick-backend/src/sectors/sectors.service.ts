import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateSectorDto } from './dto/create-sector.dto';
import { UpdateSectorDto } from './dto/update-sector.dto';
import { Sector } from './entities/sector.entity';
import { Attraction } from '../attractions/entities/attraction.entity';
import { PriceHistoryService } from '../price_history/price_history.service';
import { PriceChangeType } from '../price_history/entities/price_history.entity';
import { Ticket, TicketStatus } from '../ticket/entities/ticket.entity';

@Injectable()
export class SectorsService {
  constructor(
    @InjectRepository(Sector)
    private sectorRepository: Repository<Sector>,
    @InjectRepository(Attraction)
    private attractionRepository: Repository<Attraction>,
    @InjectRepository(Ticket)
    private ticketRepository: Repository<Ticket>,
    private priceHistoryService: PriceHistoryService
  ) {}

  async create(createSectorDto: CreateSectorDto): Promise<Sector> {
    try {
      // Verificar si existe la atracción
      const attraction = await this.attractionRepository.findOne({
        where: { id: createSectorDto.attractionId }
      });
      
      if (!attraction) {
        throw new NotFoundException(`Atracción con ID ${createSectorDto.attractionId} no encontrada`);
      }
      
      const sector = this.sectorRepository.create(createSectorDto);
      return await this.sectorRepository.save(sector);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Error al crear el sector: ${error.message}`);
    }
  }

  async findAll(): Promise<Sector[]> {
    return await this.sectorRepository.find({
      relations: ['attraction']
    });
  }

  async findByAttraction(attractionId: number): Promise<Sector[]> {
    return await this.sectorRepository.find({
      where: { attractionId },
      order: { price: 'ASC' }
    });
  }

  async findOne(id: number): Promise<Sector> {
    const sector = await this.sectorRepository.findOne({
      where: { id },
      relations: ['attraction']
    });
    
    if (!sector) {
      throw new NotFoundException(`Sector con ID ${id} no encontrado`);
    }
    
    return sector;
  }

  async update(id: number, updateSectorDto: UpdateSectorDto, userId?: number): Promise<Sector> {
    try {
      const sector = await this.findOne(id);
      
      // Si se intenta cambiar la atracción, verificar que exista
      if (updateSectorDto.attractionId && updateSectorDto.attractionId !== sector.attractionId) {
        const attraction = await this.attractionRepository.findOne({
          where: { id: updateSectorDto.attractionId }
        });
        
        if (!attraction) {
          throw new NotFoundException(`Atracción con ID ${updateSectorDto.attractionId} no encontrada`);
        }
      }
      
      // Registrar cambio de precio si se está actualizando
      if (updateSectorDto.price !== undefined && updateSectorDto.price !== sector.price) {
        await this.priceHistoryService.create({
          changeType: PriceChangeType.SECTOR,
          attractionId: sector.attractionId,
          sectorId: id,
          previousPrice: sector.price,
          newPrice: updateSectorDto.price,
          changedById: userId,
          reason: 'Actualización de precio de sector'
        });
      }
      
      // Actualizar los campos
      Object.assign(sector, updateSectorDto);
      
      return await this.sectorRepository.save(sector);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Error al actualizar el sector: ${error.message}`);
    }
  }

  async remove(id: number): Promise<void> {
    const sector = await this.findOne(id);
    await this.sectorRepository.remove(sector);
  }

  /**
   * Verifica la capacidad disponible en un sector para una fecha determinada
   * @param sectorId ID del sector
   * @param date Fecha para la que se quiere verificar la capacidad
   * @returns Cantidad de espacios disponibles
   */
  async checkCapacityAvailable(sectorId: number, date: Date): Promise<number> {
    try {
      // Obtener el sector para verificar su capacidad máxima
      const sector = await this.sectorRepository.findOne({
        where: { id: sectorId }
      });
      
      if (!sector) {
        throw new NotFoundException(`Sector con ID ${sectorId} no encontrado`);
      }
      
      if (!sector.maxCapacity) {
        // Si no hay capacidad máxima definida, consideramos que hay capacidad ilimitada
        return Number.MAX_SAFE_INTEGER;
      }
      
      // Convertir la fecha a un formato sin tiempo (solo fecha)
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      
      // Obtener los tickets existentes para esta fecha y sector
      const existingTickets = await this.ticketRepository.count({
        where: {
          sectorId: sectorId,
          validFor: targetDate,
          status: TicketStatus.ACTIVE // Solo contar tickets activos
        }
      });
      
      // Calcular capacidad disponible
      const availableCapacity = sector.maxCapacity - existingTickets;
      return Math.max(0, availableCapacity); // No permitir valores negativos
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Error al verificar capacidad disponible: ${error.message}`);
    }
  }
}
