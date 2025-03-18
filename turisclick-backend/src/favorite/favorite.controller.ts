import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Delete, 
  UseGuards, 
  Req,
  HttpStatus,
  HttpCode
} from '@nestjs/common';
import { Request } from 'express';
import { FavoriteService } from './favorite.service';
import { CreateFavoriteDto } from './dto/create-favorite.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('favorites')
export class FavoriteController {
  constructor(private readonly favoriteService: FavoriteService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Req() req: Request, @Body() createFavoriteDto: CreateFavoriteDto) {
    const userId = (req.user as any).userId;
    return this.favoriteService.create(userId, createFavoriteDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAllByUser(@Req() req: Request) {
    const userId = (req.user as any).userId;
    return this.favoriteService.findAllByUser(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('check/:attractionId')
  async isFavorite(@Req() req: Request, @Param('attractionId') attractionId: string) {
    const userId = (req.user as any).userId;
    const isFavorite = await this.favoriteService.isFavorite(userId, +attractionId);
    return { isFavorite };
  }

  @UseGuards(JwtAuthGuard)
  @Get(':attractionId')
  async findOne(@Req() req: Request, @Param('attractionId') attractionId: string) {
    const userId = (req.user as any).userId;
    return this.favoriteService.findOne(userId, +attractionId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':attractionId')
  @HttpCode(HttpStatus.OK)
  async remove(@Req() req: Request, @Param('attractionId') attractionId: string) {
    const userId = (req.user as any).userId;
    await this.favoriteService.remove(userId, +attractionId);
    return {
      status: 'success',
      message: 'Favorito eliminado exitosamente'
    };
  }
}
