import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoriesRepository: Repository<Category>,
  ) {}

  async findAll(onlyActive: boolean = false): Promise<Category[]> {
    if (onlyActive) {
      return this.categoriesRepository.find({ where: { isActive: true } });
    }
    return this.categoriesRepository.find();
  }

  async findOne(id: number): Promise<Category> {
    const category = await this.categoriesRepository.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException(`Categoría con ID ${id} no encontrada`);
    }
    return category;
  }

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    // Verificar si ya existe una categoría con el mismo nombre
    const existingCategory = await this.categoriesRepository.findOne({
      where: { name: createCategoryDto.name },
    });

    if (existingCategory) {
      throw new ConflictException(`Ya existe una categoría con el nombre '${createCategoryDto.name}'`);
    }

    const category = this.categoriesRepository.create(createCategoryDto);
    return this.categoriesRepository.save(category);
  }

  async update(id: number, updateCategoryDto: UpdateCategoryDto): Promise<Category> {
    // Primero verificamos que exista la categoría
    const category = await this.findOne(id);

    // Si se está actualizando el nombre, verificar que no exista otra categoría con ese nombre
    if (updateCategoryDto.name) {
      const existingCategory = await this.categoriesRepository.findOne({
        where: { name: updateCategoryDto.name },
      });

      if (existingCategory && existingCategory.id !== id) {
        throw new ConflictException(`Ya existe otra categoría con el nombre '${updateCategoryDto.name}'`);
      }
    }

    // Actualizar los campos
    Object.assign(category, updateCategoryDto);
    
    return this.categoriesRepository.save(category);
  }

  async remove(id: number): Promise<void> {
    const category = await this.findOne(id);
    await this.categoriesRepository.remove(category);
  }

  // Método para desactivar una categoría en lugar de eliminarla
  async deactivate(id: number): Promise<Category> {
    const category = await this.findOne(id);
    category.isActive = false;
    return this.categoriesRepository.save(category);
  }

  // Método opcional para poblar la base de datos con categorías iniciales
  async seedDefaultCategories(): Promise<void> {
    const defaultCategories = [
      { name: 'Tour', description: 'Recorridos guiados por lugares de interés' },
      { name: 'Actividad', description: 'Experiencias participativas como talleres o clases' },
      { name: 'Gastronomía', description: 'Experiencias culinarias como catas o clases de cocina' },
      { name: 'Aventura', description: 'Actividades al aire libre y deportes extremos' },
      { name: 'Cultural', description: 'Visitas a museos, monumentos o eventos culturales' },
    ];

    for (const categoryData of defaultCategories) {
      const existingCategory = await this.categoriesRepository.findOne({
        where: { name: categoryData.name },
      });

      if (!existingCategory) {
        await this.create(categoryData);
      }
    }
  }
}
