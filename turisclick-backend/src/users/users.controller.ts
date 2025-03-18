import { Controller, Get, Post, Patch, Delete, Param, Body, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  updateProfile(@Req() req: Request, @Body() updateUserDto: UpdateUserDto) {
    try {
      // Obtener el ID del usuario de manera segura
      const userId = (req.user as any).userId;
      
      // Validar que el ID del usuario es un número válido
      if (!userId || isNaN(userId)) {
        throw new Error(`ID de usuario inválido: ${userId}`);
      }
      
      // Convertir explícitamente a número
      return this.usersService.update(Number(userId), updateUserDto);
    } catch (error) {
      console.error('Error en updateProfile:', error);
      throw error;
    }
  }
  
  @UseGuards(JwtAuthGuard)
  @Patch('host-status')
  updateHostStatus(@Req() req: Request, @Body() body: { enabled?: boolean }) {
    try {
      console.log('Actualizando estado de host del usuario autenticado');
      
      // Obtener el ID directamente del token JWT
      const userId = (req.user as any).userId;
      console.log('ID de usuario extraído del token:', userId, typeof userId);
      
      // Validar que el ID del usuario es un número válido
      if (!userId || isNaN(Number(userId))) {
        throw new Error(`ID de usuario inválido en el token: ${userId}`);
      }
      
      // Convertir a número para asegurar compatibilidad
      const numericId = Number(userId);
      
      // Si no se especifica enabled, asumimos true
      const enabled = body.enabled !== undefined ? body.enabled : true;
      console.log(`Actualizando isHost a ${enabled} para usuario con ID: ${numericId}`);
      
      // Activar o desactivar el estado de host según el valor de 'enabled'
      if (enabled) {
        return this.usersService.makeHost(numericId);
      } else {
        return this.usersService.update(numericId, { isHost: false } as UpdateUserDto);
      }
    } catch (error) {
      console.error('Error al actualizar estado de host:', error);
      throw error;
    }
  }
  
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }
  
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(+id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }
}
