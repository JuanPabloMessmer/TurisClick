import { Controller, Get, Post, Body, Patch, Param, Delete, Query, HttpStatus, HttpCode, UseGuards } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { Category } from './entities/category.entity';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Roles } from 'src/roles/roles.decorator';
import { RolesGuard } from 'src/roles.guard';


@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener todas las categorías' })
  @ApiQuery({ name: 'active', required: false, type: Boolean, description: 'Filtrar solo categorías activas' })
  @ApiResponse({ status: 200, description: 'Lista de categorías obtenida exitosamente', type: [Category] })
  async findAll(@Query('active') active?: string) {
    const isActive = active === 'true';
    const categories = await this.categoriesService.findAll(isActive);
    return {
      status: 'success',
      message: 'Categorías obtenidas exitosamente',
      data: categories,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una categoría por ID' })
  @ApiParam({ name: 'id', description: 'ID de la categoría' })
  @ApiResponse({ status: 200, description: 'Categoría encontrada exitosamente', type: Category })
  @ApiResponse({ status: 404, description: 'Categoría no encontrada' })
  async findOne(@Param('id') id: string) {
    const category = await this.categoriesService.findOne(+id);
    return {
      status: 'success',
      message: 'Categoría obtenida exitosamente',
      data: category,
    };
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Crear una nueva categoría' })
  @ApiResponse({ status: 201, description: 'Categoría creada exitosamente', type: Category })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  @ApiResponse({ status: 409, description: 'Ya existe una categoría con ese nombre' })
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createCategoryDto: CreateCategoryDto) {
    const category = await this.categoriesService.create(createCategoryDto);
    return {
      status: 'success',
      message: 'Categoría creada exitosamente',
      data: category,
    };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Actualizar una categoría' })
  @ApiParam({ name: 'id', description: 'ID de la categoría a actualizar' })
  @ApiResponse({ status: 200, description: 'Categoría actualizada exitosamente', type: Category })
  @ApiResponse({ status: 404, description: 'Categoría no encontrada' })
  @ApiResponse({ status: 409, description: 'Ya existe otra categoría con ese nombre' })
  async update(@Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto) {
    const category = await this.categoriesService.update(+id, updateCategoryDto);
    return {
      status: 'success',
      message: 'Categoría actualizada exitosamente',
      data: category,
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Eliminar una categoría' })
  @ApiParam({ name: 'id', description: 'ID de la categoría a eliminar' })
  @ApiResponse({ status: 200, description: 'Categoría eliminada exitosamente' })
  @ApiResponse({ status: 404, description: 'Categoría no encontrada' })
  async remove(@Param('id') id: string) {
    await this.categoriesService.remove(+id);
    return {
      status: 'success',
      message: 'Categoría eliminada exitosamente',
    };
  }

  @Patch(':id/deactivate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Desactivar una categoría' })
  @ApiParam({ name: 'id', description: 'ID de la categoría a desactivar' })
  @ApiResponse({ status: 200, description: 'Categoría desactivada exitosamente', type: Category })
  @ApiResponse({ status: 404, description: 'Categoría no encontrada' })
  async deactivate(@Param('id') id: string) {
    const category = await this.categoriesService.deactivate(+id);
    return {
      status: 'success',
      message: 'Categoría desactivada exitosamente',
      data: category,
    };
  }

  @Post('seed')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Poblar la base de datos con categorías predeterminadas' })
  @ApiResponse({ status: 200, description: 'Categorías predeterminadas creadas exitosamente' })
  async seedDefaultCategories() {
    await this.categoriesService.seedDefaultCategories();
    return {
      status: 'success',
      message: 'Categorías predeterminadas creadas exitosamente',
    };
  }
}
