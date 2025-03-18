import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateAttractionDto } from './dto/create-attraction.dto';
import { UpdateAttractionDto } from './dto/update-attraction.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Attraction } from './entities/attraction.entity';
import { Repository } from 'typeorm';
import { AttractionStatus } from './enums/attraction-status.enums';
import { City } from '../cities/entities/city.entity';
import { Category } from '../categories/entities/category.entity';
import { User } from '../users/entities/user.entity';
import { PriceHistoryService } from '../price_history/price_history.service';

@Injectable()
export class AttractionsService {
  constructor(
    @InjectRepository(Attraction)
    private attractionsRepository: Repository<Attraction>,
    @InjectRepository(City)
    private citiesRepository: Repository<City>,
    @InjectRepository(Category)
    private categoriesRepository: Repository<Category>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private priceHistoryService: PriceHistoryService
  ) {}

  async create(createAttractionDto: CreateAttractionDto): Promise<Attraction> {
    try {
      const city = await this.citiesRepository.findOne({ 
        where: { id: createAttractionDto.cityId } 
      });
      if (!city) {
        throw new NotFoundException(`Ciudad con ID ${createAttractionDto.cityId} no encontrada`);
      }

      const category = await this.categoriesRepository.findOne({ 
        where: { id: createAttractionDto.categoryId } 
      });
      if (!category) {
        throw new NotFoundException(`Categoría con ID ${createAttractionDto.categoryId} no encontrada`);
      }

      const admin = await this.usersRepository.findOne({ 
        where: { id: createAttractionDto.adminId } 
      });
      if (!admin) {
        throw new NotFoundException(`Usuario con ID ${createAttractionDto.adminId} no encontrado`);
      }

      const newAttraction = this.attractionsRepository.create({
        name: createAttractionDto.name,
        description: createAttractionDto.description,
        opening_time: createAttractionDto.opening_time,
        closing_time: createAttractionDto.closing_time,
        price: createAttractionDto.price,
        location: createAttractionDto.location,
        images: createAttractionDto.images,
        status: createAttractionDto.status || AttractionStatus.PENDING,
        city,
        category,
        admin,
      });

      return await this.attractionsRepository.save(newAttraction);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Error al crear la atracción: ${error.message}`);
    }
  }

  async findAll(): Promise<Attraction[]> {
    try {
      return await this.attractionsRepository.find({
        relations: ['city', 'category', 'admin'],
      });
    } catch (error) {
      throw new BadRequestException(`Error al obtener las atracciones: ${error.message}`);
    }
  }

  async findByStatus(status: string): Promise<Attraction[]> {
    try {
      // Verificar si el status es válido
      if (!Object.values(AttractionStatus).includes(status as AttractionStatus)) {
        throw new BadRequestException(`Status inválido: ${status}`);
      }
      
      return await this.attractionsRepository.find({
        relations: ['city', 'category', 'admin'],
        where: { status: status as AttractionStatus },
      });
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Error al filtrar atracciones por status: ${error.message}`);
    }
  }

  async findOne(id: number): Promise<Attraction> {
    try {
      const attraction = await this.attractionsRepository.findOne({ 
        where: { id },
        relations: ['city', 'category', 'admin']
      });
      
      if (!attraction) {
        throw new NotFoundException(`Atracción con ID ${id} no encontrada`);
      }
      
      return attraction;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Error al buscar la atracción: ${error.message}`);
    }
  }

  async update(id: number, updateAttractionDto: UpdateAttractionDto, userId?: number): Promise<Attraction> {
    try {
      const existingAttraction = await this.attractionsRepository.findOne({ 
        where: { id },
        relations: ['city', 'category', 'admin']
      });
      
      if (!existingAttraction) {
        throw new NotFoundException(`Atracción con ID ${id} no encontrada`);
      }

      // Registrar cambio de precio si se está actualizando
      if (updateAttractionDto.price !== undefined && updateAttractionDto.price !== existingAttraction.price) {
        console.log(`Registrando cambio de precio para atracción ${id}. Usuario que realizó el cambio: ${userId}`);
        
        const priceHistoryData = {
          attractionId: id,
          previousPrice: existingAttraction.price,
          newPrice: updateAttractionDto.price,
          changedById: userId,
          reason: 'Actualización de precio'
        };
        
        console.log('Datos para el historial de precios:', priceHistoryData);
        
        await this.priceHistoryService.create(priceHistoryData);
      }

      // Actualizar relaciones si se proporcionan
      if (updateAttractionDto.cityId) {
        const city = await this.citiesRepository.findOne({ 
          where: { id: updateAttractionDto.cityId } 
        });
        if (!city) {
          throw new NotFoundException(`Ciudad con ID ${updateAttractionDto.cityId} no encontrada`);
        }
        existingAttraction.city = city;
      }

      if (updateAttractionDto.categoryId) {
        const category = await this.categoriesRepository.findOne({ 
          where: { id: updateAttractionDto.categoryId } 
        });
        if (!category) {
          throw new NotFoundException(`Categoría con ID ${updateAttractionDto.categoryId} no encontrada`);
        }
        existingAttraction.category = category;
      }

      if (updateAttractionDto.adminId) {
        const admin = await this.usersRepository.findOne({ 
          where: { id: updateAttractionDto.adminId } 
        });
        if (!admin) {
          throw new NotFoundException(`Administrador con ID ${updateAttractionDto.adminId} no encontrado`);
        }
        existingAttraction.admin = admin;
      }

      // Actualizar otros campos
      this.attractionsRepository.merge(existingAttraction, updateAttractionDto);
      
      // Guardar la atracción actualizada
      const updatedAttraction = await this.attractionsRepository.save(existingAttraction);
      return updatedAttraction;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Error al actualizar la atracción: ${error.message}`);
    }
  }

  async remove(id: number): Promise<void> {
    try {
      const attraction = await this.attractionsRepository.findOne({ where: { id } });
      
      if (!attraction) {
        throw new NotFoundException(`Atracción con ID ${id} no encontrada`);
      }
      
      // Realizar borrado lógico cambiando el estado a INACTIVE
      attraction.status = AttractionStatus.INACTIVE;
      await this.attractionsRepository.save(attraction);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Error al eliminar la atracción: ${error.message}`);
    }
  }
}
