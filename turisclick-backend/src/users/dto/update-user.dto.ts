import { IsOptional, IsArray, IsString, ArrayNotEmpty, IsUrl } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty({ message: 'Las preferencias no pueden estar vacías si se proporcionan' })
  @IsString({ each: true, message: 'Cada preferencia debe ser un texto' })
  preferences?: string[];

  @IsOptional()
  @IsString()
  @IsUrl()
  profile_image?: string;
}
