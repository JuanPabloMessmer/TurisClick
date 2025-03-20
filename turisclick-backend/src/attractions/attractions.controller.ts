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
  Req,
  UseInterceptors,
  UploadedFiles,
  HttpException,
} from '@nestjs/common';
import { Request } from 'express';
import { AttractionsService } from './attractions.service';
import { CreateAttractionDto } from './dto/create-attraction.dto';
import { UpdateAttractionDto } from './dto/update-attraction.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FilesInterceptor } from '@nestjs/platform-express';

@Controller('attractions')
export class AttractionsController {
  constructor(private readonly attractionsService: AttractionsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('upload-images')
  @UseInterceptors(FilesInterceptor('images', 10, {
    limits: {
      fileSize: 10 * 1024 * 1024,
    }
  }))
  @HttpCode(HttpStatus.OK)
  async uploadImages(@UploadedFiles() files: Express.Multer.File[]) {
    try {
      if (!files || files.length === 0) {
        throw new HttpException(
          'No se proporcionaron archivos',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Validar cada archivo
      files.forEach(file => {
        console.log('Procesando archivo:', {
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          buffer: file.buffer ? 'Buffer presente' : 'Buffer ausente',
          keys: Object.keys(file)
        });

        // Validar tipo de archivo de manera más flexible
        if (!file.mimetype || !file.mimetype.startsWith('image/')) {
          throw new HttpException(
            `Tipo de archivo no válido: ${file.mimetype}`,
            HttpStatus.BAD_REQUEST,
          );
        }
      });

      console.log('Iniciando subida de imágenes...');
      const imageUrls = await this.attractionsService.uploadImages(files);
      console.log('Imágenes subidas exitosamente:', imageUrls);

      return {
        status: 'success',
        message: 'Imágenes subidas exitosamente',
        data: imageUrls,
      };
    } catch (error) {
      console.error('Error en uploadImages controller:', error);
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Req() req: Request, @Body() createAttractionDto: CreateAttractionDto) {
    // Obtener el ID del usuario del token JWT
    const userId = (req.user as any).userId;
    
    // Asignar el userId como adminId en el DTO
    createAttractionDto.adminId = userId;
    
    const attraction = await this.attractionsService.create(createAttractionDto);
    return {
      status: 'success',
      message: 'Atracción creada exitosamente',
      data: attraction,
    };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll() {
    const attractions = await this.attractionsService.findAll();
    return {
      status: 'success',
      message: 'Atracciones obtenidas exitosamente',
      data: attractions,
    };
  }

  @Get('status/:status')
  @HttpCode(HttpStatus.OK)
  async findByStatus(@Param('status') status: string) {
    const attractions = await this.attractionsService.findByStatus(status);
    return {
      status: 'success',
      message: `Atracciones con status ${status} obtenidas exitosamente`,
      data: attractions,
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string) {
    const attraction = await this.attractionsService.findOne(+id);
    return {
      status: 'success',
      message: 'Atracción obtenida exitosamente',
      data: attraction,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async update(@Req() req: Request, @Param('id') id: string, @Body() updateAttractionDto: UpdateAttractionDto) {
    // Obtener el ID del usuario del token JWT
    const userId = (req.user as any).userId;
    
    console.log(`Token JWT validado. ID de usuario extraído: ${userId}`);
    
    // Asignar el userId al DTO para el registro del historial de precios
    const attraction = await this.attractionsService.update(+id, updateAttractionDto, userId);
    return {
      status: 'success',
      message: `Atracción con ID ${id} actualizada exitosamente`,
      data: attraction,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    await this.attractionsService.remove(+id);
    return {
      status: 'success',
      message: `Atracción con ID ${id} eliminada exitosamente`,
    };
  }
}
