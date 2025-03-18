import { IsNotEmpty, IsNumber } from 'class-validator';

export class CreateFavoriteDto {
  @IsNotEmpty()
  @IsNumber()
  attractionId: number;
}
