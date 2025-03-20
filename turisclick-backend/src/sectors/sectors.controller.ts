import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  UseGuards,
  HttpCode,
  HttpStatus,
  Req
} from '@nestjs/common';
import { Request } from 'express';
import { SectorsService } from './sectors.service';
import { CreateSectorDto } from './dto/create-sector.dto';
import { UpdateSectorDto } from './dto/update-sector.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

/**
 * Controlador de Sectores.
 * 
 * Los sectores representan diferentes categorías de tickets (como Adulto, Niño, Estudiante)
 * para una atracción. Cada sector tiene su propio precio, por lo que una atracción puede
 * tener múltiples opciones de precio dependiendo del tipo de visitante.
 * 
 * Este enfoque reemplaza el uso del precio general en la atracción, proporcionando
 * una forma más flexible de manejar diferentes tarifas y tipos de entrada.
 */
@Controller('sectors')
export class SectorsController {
  constructor(private readonly sectorsService: SectorsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createSectorDto: CreateSectorDto) {
    const sector = await this.sectorsService.create(createSectorDto);
    return {
      status: 'success',
      message: 'Sector creado exitosamente',
      data: sector
    };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll() {
    const sectors = await this.sectorsService.findAll();
    return {
      status: 'success',
      message: 'Sectores obtenidos exitosamente',
      data: sectors
    };
  }

  @Get('attraction/:attractionId')
  @HttpCode(HttpStatus.OK)
  async findByAttraction(@Param('attractionId') attractionId: string) {
    const sectors = await this.sectorsService.findByAttraction(+attractionId);
    return {
      status: 'success',
      message: `Sectores para la atracción ${attractionId} obtenidos exitosamente`,
      data: sectors
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string) {
    const sector = await this.sectorsService.findOne(+id);
    return {
      status: 'success',
      message: 'Sector obtenido exitosamente',
      data: sector
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async update(@Req() req: Request, @Param('id') id: string, @Body() updateSectorDto: UpdateSectorDto) {
    const userId = (req.user as any).userId;
    const sector = await this.sectorsService.update(+id, updateSectorDto, userId);
    return {
      status: 'success',
      message: `Sector con ID ${id} actualizado exitosamente`,
      data: sector
    };
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    await this.sectorsService.remove(+id);
    return {
      status: 'success',
      message: `Sector con ID ${id} eliminado exitosamente`
    };
  }
}
