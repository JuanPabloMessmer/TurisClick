import { IsArray, IsString, IsOptional } from 'class-validator';

export class CreateUserDto {
    @IsString()
    firstName: string;
    
    @IsString()
    lastName: string;
    
    @IsString()
    email: string;
    
    @IsString()
    password: string;
    
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    preferences?: string[];
}
  