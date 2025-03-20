import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { AttractionsService } from './attractions.service';
import { AttractionsController } from './attractions.controller';
import { Attraction } from './entities/attraction.entity';
import { City } from '../cities/entities/city.entity';
import { Category } from '../categories/entities/category.entity';
import { User } from '../users/entities/user.entity';
import { PriceHistoryModule } from '../price_history/price_history.module';
import * as fs from 'fs';
import { AttractionCategory } from './entities/attraction-category.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Attraction, City, Category, User, AttractionCategory]),
    PriceHistoryModule,
    MulterModule.register({
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = './uploads/attractions';
          // Crear el directorio si no existe
          if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
          }
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
          cb(null, `image-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
          return cb(new Error('Solo se permiten archivos de imagen'), false);
        }
        cb(null, true);
      },
    }),
  ],
  controllers: [AttractionsController],
  providers: [AttractionsService],
  exports: [AttractionsService]
})
export class AttractionsModule {}
