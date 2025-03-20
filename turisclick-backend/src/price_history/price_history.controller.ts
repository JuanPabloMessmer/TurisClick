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
  NotFoundException
} from '@nestjs/common';
import { PriceHistoryService } from './price_history.service';
import { CreatePriceHistoryDto } from './dto/create-price_history.dto';
import { UpdatePriceHistoryDto } from './dto/update-price_history.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('price-history')
export class PriceHistoryController {
  constructor(private readonly priceHistoryService: PriceHistoryService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createPriceHistoryDto: CreatePriceHistoryDto) {
    const priceHistory = await this.priceHistoryService.create(createPriceHistoryDto);
    return {
      status: 'success',
      message: 'Historial de precio creado exitosamente',
      data: priceHistory
    };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll() {
    const priceHistories = await this.priceHistoryService.findAll();
    return {
      status: 'success',
      message: 'Historiales de precio obtenidos exitosamente',
      data: priceHistories
    };
  }

  @Get('attraction/:attractionId')
  @HttpCode(HttpStatus.OK)
  async findAllByAttractionId(@Param('attractionId') attractionId: string) {
    const priceHistories = await this.priceHistoryService.findAllByAttractionId(+attractionId);
    return {
      status: 'success',
      message: `Historiales de precio para la atracción ${attractionId} obtenidos exitosamente`,
      data: priceHistories
    };
  }

  @Get('sector/:sectorId')
  @HttpCode(HttpStatus.OK)
  async findAllBySectorId(@Param('sectorId') sectorId: string) {
    const priceHistories = await this.priceHistoryService.findAllBySectorId(+sectorId);
    return {
      status: 'success',
      message: `Historiales de precio para el sector ${sectorId} obtenidos exitosamente`,
      data: priceHistories
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string) {
    try {
      const priceHistory = await this.priceHistoryService.findOne(+id);
      return {
        status: 'success',
        message: 'Historial de precio obtenido exitosamente',
        data: priceHistory
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async update(@Param('id') id: string, @Body() updatePriceHistoryDto: UpdatePriceHistoryDto) {
    try {
      const updatedPriceHistory = await this.priceHistoryService.update(+id, updatePriceHistoryDto);
      return {
        status: 'success',
        message: 'Historial de precio actualizado exitosamente',
        data: updatedPriceHistory
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    try {
      await this.priceHistoryService.remove(+id);
      return {
        status: 'success',
        message: 'Historial de precio eliminado exitosamente'
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw error;
    }
  }
}
