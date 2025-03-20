import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePriceHistoryDto } from './dto/create-price_history.dto';
import { UpdatePriceHistoryDto } from './dto/update-price_history.dto';
import { PriceChangeType, PriceHistory } from './entities/price_history.entity';
import { Sector } from '../sectors/entities/sector.entity';

@Injectable()
export class PriceHistoryService {
  constructor(
    @InjectRepository(PriceHistory)
    private priceHistoryRepository: Repository<PriceHistory>,
    @InjectRepository(Sector)
    private sectorRepository: Repository<Sector>
  ) {}

  async create(createPriceHistoryDto: CreatePriceHistoryDto): Promise<PriceHistory> {
    console.log('Creando historial de precios con datos:', createPriceHistoryDto);
    
    // Validar que si el tipo es SECTOR, se proporcione un sectorId
    if (createPriceHistoryDto.changeType === PriceChangeType.SECTOR && !createPriceHistoryDto.sectorId) {
      throw new BadRequestException('Para cambios de precio en sectores, se debe proporcionar un sectorId');
    }
    
    // Asegurarse de que changedById sea un número si existe
    if (createPriceHistoryDto.changedById === undefined) {
      console.log('ADVERTENCIA: changedById es undefined');
    } else if (createPriceHistoryDto.changedById === null) {
      console.log('ADVERTENCIA: changedById es null');
    } else {
      console.log(`changedById establecido correctamente como: ${createPriceHistoryDto.changedById}`);
    }
    
    const priceHistory = this.priceHistoryRepository.create(createPriceHistoryDto);
    console.log('Entidad PriceHistory creada:', priceHistory);
    
    const savedPriceHistory = await this.priceHistoryRepository.save(priceHistory);
    console.log('Historial de precios guardado:', savedPriceHistory);
    
    return savedPriceHistory;
  }

  async findAll(): Promise<PriceHistory[]> {
    return await this.priceHistoryRepository.find({
      relations: ['attraction', 'sector', 'changedBy'],
      order: { changedAt: 'DESC' }
    });
  }

  async findAllByAttractionId(attractionId: number): Promise<PriceHistory[]> {
    return await this.priceHistoryRepository.find({
      where: { attractionId },
      relations: ['sector', 'changedBy'],
      order: { changedAt: 'DESC' }
    });
  }

  async findAllBySectorId(sectorId: number): Promise<PriceHistory[]> {
    return await this.priceHistoryRepository.find({
      where: { sectorId, changeType: PriceChangeType.SECTOR },
      relations: ['attraction', 'changedBy'],
      order: { changedAt: 'DESC' }
    });
  }

  async findOne(id: number): Promise<PriceHistory> {
    const priceHistory = await this.priceHistoryRepository.findOne({
      where: { id },
      relations: ['attraction', 'sector', 'changedBy']
    });
    
    if (!priceHistory) {
      throw new NotFoundException(`Historial de precio con ID ${id} no encontrado`);
    }
    
    return priceHistory;
  }

  async update(id: number, updatePriceHistoryDto: UpdatePriceHistoryDto): Promise<PriceHistory> {
    const priceHistory = await this.findOne(id);
    
    // Solo permitimos actualizar la razón del cambio
    if (updatePriceHistoryDto.reason) {
      priceHistory.reason = updatePriceHistoryDto.reason;
    }
    
    return await this.priceHistoryRepository.save(priceHistory);
  }

  async remove(id: number): Promise<void> {
    const priceHistory = await this.findOne(id);
    await this.priceHistoryRepository.remove(priceHistory);
  }
}