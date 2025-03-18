import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateFavoriteDto } from './dto/create-favorite.dto';
import { Favorite } from './entities/favorite.entity';
import { User } from '../users/entities/user.entity';
import { Attraction } from '../attractions/entities/attraction.entity';

@Injectable()
export class FavoriteService {
  constructor(
    @InjectRepository(Favorite)
    private favoriteRepository: Repository<Favorite>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Attraction)
    private attractionRepository: Repository<Attraction>,
  ) {}

  async create(userId: number, createFavoriteDto: CreateFavoriteDto): Promise<Favorite> {
    // Verificar si el usuario existe
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${userId} no encontrado`);
    }

    // Verificar si la atracción existe
    const attraction = await this.attractionRepository.findOne({ 
      where: { id: createFavoriteDto.attractionId } 
    });
    if (!attraction) {
      throw new NotFoundException(
        `Atracción con ID ${createFavoriteDto.attractionId} no encontrada`
      );
    }

    // Verificar si ya existe el favorito
    const existingFavorite = await this.favoriteRepository.findOne({
      where: { 
        userId: userId,
        attractionId: createFavoriteDto.attractionId 
      },
    });

    if (existingFavorite) {
      throw new ConflictException('Esta atracción ya está marcada como favorita');
    }

    // Crear nuevo favorito
    const favorite = this.favoriteRepository.create({
      userId,
      attractionId: createFavoriteDto.attractionId,
      user,
      attraction,
    });

    return this.favoriteRepository.save(favorite);
  }

  async findAllByUser(userId: number): Promise<Favorite[]> {
    // Verificar si el usuario existe
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${userId} no encontrado`);
    }

    return this.favoriteRepository.find({
      where: { userId },
      relations: ['attraction'],
    });
  }

  async findOne(userId: number, attractionId: number): Promise<Favorite> {
    const favorite = await this.favoriteRepository.findOne({
      where: { userId, attractionId },
      relations: ['attraction'],
    });

    if (!favorite) {
      throw new NotFoundException('Favorito no encontrado');
    }

    return favorite;
  }

  async remove(userId: number, attractionId: number): Promise<void> {
    const favorite = await this.favoriteRepository.findOne({
      where: { userId, attractionId },
    });

    if (!favorite) {
      throw new NotFoundException('Favorito no encontrado');
    }

    await this.favoriteRepository.remove(favorite);
  }

  async isFavorite(userId: number, attractionId: number): Promise<boolean> {
    const favorite = await this.favoriteRepository.findOne({
      where: { userId, attractionId },
    });

    return !!favorite;
  }
}
