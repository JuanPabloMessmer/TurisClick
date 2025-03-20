import { Injectable, NotFoundException, BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { CreateAttractionDto } from './dto/create-attraction.dto';
import { UpdateAttractionDto } from './dto/update-attraction.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Attraction } from './entities/attraction.entity';
import { Repository, In, DeepPartial } from 'typeorm';
import { AttractionStatus } from './enums/attraction-status.enums';
import { City } from '../cities/entities/city.entity';
import { Category } from '../categories/entities/category.entity';
import { User } from '../users/entities/user.entity';
import { PriceHistoryService } from '../price_history/price_history.service';
import * as fs from 'fs';
import * as path from 'path';
import { AttractionCategory } from './entities/attraction-category.entity';

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
    @InjectRepository(AttractionCategory)
    private attractionCategoryRepository: Repository<AttractionCategory>,
    private priceHistoryService: PriceHistoryService
  ) {}

  async create(createAttractionDto: CreateAttractionDto): Promise<Attraction> {
    try {
      // Verificar si existe la ciudad
      const city = await this.citiesRepository.findOne({ 
        where: { id: createAttractionDto.cityId } 
      });
      if (!city) {
        throw new NotFoundException(`Ciudad con ID ${createAttractionDto.cityId} no encontrada`);
      }

      // Identificar las categorías a asociar con la atracción
      const categoryIds = createAttractionDto.categoryIds && createAttractionDto.categoryIds.length > 0 
        ? createAttractionDto.categoryIds 
        : (createAttractionDto.categoryId ? [createAttractionDto.categoryId] : []);
      
      if (categoryIds.length === 0) {
        throw new BadRequestException('Debe proporcionar al menos una categoría');
      }
      
      // Verificar que todas las categorías existan
      const categories = await this.categoriesRepository.find({
        where: { id: In(categoryIds) }
      });
      
      if (categories.length !== categoryIds.length) {
        const foundIds = categories.map(cat => cat.id);
        const missingIds = categoryIds.filter(id => !foundIds.includes(id));
        throw new NotFoundException(`No se encontraron las siguientes categorías: ${missingIds.join(', ')}`);
      }
      
      // Asignar la primera categoría como la principal
      const primaryCategory = categories.find(cat => cat.id === categoryIds[0]);

      // Verificar que el adminId (que ahora viene del token JWT) sea válido
      const admin = await this.usersRepository.findOne({ 
        where: { id: createAttractionDto.adminId } 
      });
      if (!admin) {
        throw new NotFoundException(`Usuario con ID ${createAttractionDto.adminId} no encontrado`);
      }

      // Crear y guardar la atracción básica primero
      const newAttraction = this.attractionsRepository.create({
        name: createAttractionDto.name,
        description: createAttractionDto.description,
        opening_time: createAttractionDto.opening_time,
        closing_time: createAttractionDto.closing_time,
        location: createAttractionDto.location,
        latitude: createAttractionDto.latitude,
        longitude: createAttractionDto.longitude,
        googleMapsUrl: createAttractionDto.googleMapsUrl,
        images: Array.isArray(createAttractionDto.images) ? createAttractionDto.images.join(',') : createAttractionDto.images,
        status: createAttractionDto.status || AttractionStatus.PENDING,
        city,
        category: primaryCategory, // Asignamos la primera categoría como la principal
        admin,
      } as DeepPartial<Attraction>);

      const savedAttraction = await this.attractionsRepository.save(newAttraction);
      
      // Crear las relaciones para todas las categorías en la tabla many-to-many
      const attractionCategories = categories.map(category => {
        return this.attractionCategoryRepository.create({
          attraction: savedAttraction,
          category
        } as DeepPartial<AttractionCategory>);
      });
      
      await this.attractionCategoryRepository.save(attractionCategories);
      
      console.log(`Atracción creada con las siguientes categorías: ${categoryIds.join(', ')}`);

      // Recargar la atracción con todas sus relaciones
      const completeAttraction = await this.findOne(savedAttraction.id);
      return completeAttraction;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Error al crear la atracción: ${error.message}`);
    }
  }

  async findAll(): Promise<Attraction[]> {
    try {
      const attractions = await this.attractionsRepository.find({
        relations: ['city', 'category', 'admin', 'attractionCategories', 'attractionCategories.category'],
      });

      return attractions;
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
        relations: ['city', 'category', 'admin', 'attractionCategories', 'attractionCategories.category'],
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
        relations: ['city', 'category', 'admin', 'attractionCategories', 'attractionCategories.category'],
      });

      if (!attraction) {
        throw new NotFoundException(`Atracción con ID ${id} no encontrada`);
      }

      // Transformar la respuesta para incluir todas las categorías en un array
      (attraction as any).allCategories = attraction.attractionCategories.map(ac => ac.category);

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
        relations: ['city', 'category', 'admin', 'attractionCategories', 'attractionCategories.category']
      });
      
      if (!existingAttraction) {
        throw new NotFoundException(`Atracción con ID ${id} no encontrada`);
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

      // Actualizar categorías si se proporcionan
      if (updateAttractionDto.categoryIds && updateAttractionDto.categoryIds.length > 0) {
        // Obtener todas las categorías
        const categories = await this.categoriesRepository.find({
          where: { id: In(updateAttractionDto.categoryIds) }
        });
        
        if (categories.length !== updateAttractionDto.categoryIds.length) {
          const foundIds = categories.map(cat => cat.id);
          const missingIds = updateAttractionDto.categoryIds.filter(id => !foundIds.includes(id));
          throw new NotFoundException(`No se encontraron las siguientes categorías: ${missingIds.join(', ')}`);
        }

        // Eliminar las relaciones existentes
        await this.attractionCategoryRepository.delete({ attraction: { id } });
        
        // Crear nuevas relaciones
        const attractionCategories = categories.map(category => {
          return this.attractionCategoryRepository.create({
            attraction: existingAttraction,
            category
          } as DeepPartial<AttractionCategory>);
        });
        
        await this.attractionCategoryRepository.save(attractionCategories);
        
        // Actualizar la categoría principal
        existingAttraction.category = categories[0];
      } else if (updateAttractionDto.categoryId) {
        // Si solo se proporciona categoryId, actualizar la categoría principal
        const category = await this.categoriesRepository.findOne({ 
          where: { id: updateAttractionDto.categoryId } 
        });
        
        if (!category) {
          throw new NotFoundException(`Categoría con ID ${updateAttractionDto.categoryId} no encontrada`);
        }
        
        existingAttraction.category = category;
        
        // Asegurarse de que esta categoría esté en las relaciones
        const existingRelation = await this.attractionCategoryRepository.findOne({
          where: {
            attraction: { id },
            category: { id: updateAttractionDto.categoryId }
          }
        });
        
        if (!existingRelation) {
          const newRelation = this.attractionCategoryRepository.create({
            attraction: existingAttraction,
            category
          } as DeepPartial<AttractionCategory>);
          
          await this.attractionCategoryRepository.save(newRelation);
        }
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

      if (updateAttractionDto.images) {
        // Si las imágenes ya vienen como array, mantenerlas así
        if (Array.isArray(updateAttractionDto.images)) {
          // Usar el DTO tal como está, sin modificar
          console.log(`Actualizando imágenes con array: ${updateAttractionDto.images}`);
          this.attractionsRepository.merge(existingAttraction, {
            ...updateAttractionDto,
            images: updateAttractionDto.images.join(',') // Convertir a string para almacenar
          } as DeepPartial<Attraction>);
        } 
        // Si es un string, verificar si ya tiene formato CSV
        else if (typeof updateAttractionDto.images === 'string') {
          console.log(`Actualizando imágenes con string: ${updateAttractionDto.images}`);
          this.attractionsRepository.merge(existingAttraction, updateAttractionDto as DeepPartial<Attraction>);
        }
      } else {
        // Para otros campos, usar el comportamiento normal
        this.attractionsRepository.merge(existingAttraction, updateAttractionDto as DeepPartial<Attraction>);
      }
      
      const updatedAttraction = await this.attractionsRepository.save(existingAttraction);
      
      return this.findOne(updatedAttraction.id);
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

  // Método para manejar la subida de imágenes
  async uploadImages(files: Express.Multer.File[]): Promise<string[]> {
    try {
      const uploadDir = 'uploads/attractions';
      
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const savedPaths: string[] = [];

      for (const file of files) {
        try {
          console.log('Archivo recibido:', file);
          
          // En algunos entornos móviles, el archivo puede no tener buffer
          // pero está disponible como un stream o tiene la propiedad path
          if (!file.buffer && !file.path && !(file as any).stream) {
            console.error('Archivo sin contenido adecuado:', file.originalname);
            
            // Si estamos en producción, intentar usar el objeto completo como datos
            if (typeof file === 'object' && Object.keys(file).length > 0) {
              // Intentamos guardar el archivo de todos modos
              const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
              const ext = path.extname(file.originalname || 'image.jpg') || '.jpg';
              const filename = `image-${uniqueSuffix}${ext}`;
              
              const filePath = path.join(uploadDir, filename);
              
              // Si tenemos los datos brutos como una propiedad
              if ((file as any).data) {
                await fs.promises.writeFile(filePath, (file as any).data);
              } else if ((file as any).base64) {
                // Si tenemos datos en base64
                const buffer = Buffer.from((file as any).base64, 'base64');
                await fs.promises.writeFile(filePath, buffer);
              } else {
                throw new HttpException(
                  `No se pudo procesar el archivo: ${file.originalname}`,
                  HttpStatus.BAD_REQUEST,
                );
              }
              
              const relativePath = `${uploadDir}/${filename}`;
              savedPaths.push(relativePath);
              
              console.log(`Archivo guardado exitosamente: ${filePath}`);
              continue;
            }
            
            throw new HttpException(
              `Archivo sin contenido: ${file.originalname}`,
              HttpStatus.BAD_REQUEST,
            );
          }

          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
          const ext = path.extname(file.originalname || 'image.jpg') || '.jpg';
          const filename = `image-${uniqueSuffix}${ext}`;
          
          const filePath = path.join(uploadDir, filename);
          
          // Usar buffer si existe, de lo contrario leer desde path
          if (file.buffer) {
            await fs.promises.writeFile(filePath, file.buffer);
          } else if (file.path) {
            // Copiar desde path
            const fileContent = await fs.promises.readFile(file.path);
            await fs.promises.writeFile(filePath, fileContent);
          }
          
          const relativePath = `${uploadDir}/${filename}`;
          savedPaths.push(relativePath);
          
          console.log(`Archivo guardado exitosamente: ${filePath}`);
        } catch (error) {
          console.error('Error al guardar archivo individual:', error);
          throw new HttpException(
            `Error al guardar archivo: ${error.message}`,
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }
      }

      return savedPaths;
    } catch (error) {
      console.error('Error al subir las imágenes:', error);
      throw new HttpException(
        `Error al subir las imágenes: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
