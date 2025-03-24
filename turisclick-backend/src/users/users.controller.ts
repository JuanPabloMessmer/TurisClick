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
  @Get('profile')
  async getProfile(@Req() req: Request) {
    try {
      // Obtener el ID del usuario desde el token JWT
      const userId = (req.user as any).userId;
      
      // Validar que el ID del usuario es un número válido
      if (!userId || isNaN(Number(userId))) {
        throw new Error(`ID de usuario inválido: ${userId}`);
      }
      
      // Obtener los datos del usuario
      const user = await this.usersService.findOne(Number(userId));
      
      // Logs para depuración
      console.log('Datos de usuario obtenidos en getProfile:', JSON.stringify(user, null, 2));
      
      return {
        status: 'success',
        data: user,
        message: 'Perfil de usuario obtenido exitosamente'
      };
    } catch (error) {
      console.error('Error en getProfile:', error);
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  async updateProfile(@Req() req: Request, @Body() updateUserDto: UpdateUserDto) {
    try {
      // Obtener el ID del usuario de manera segura
      const userId = (req.user as any).userId;
      
      // Validar que el ID del usuario es un número válido
      if (!userId || isNaN(userId)) {
        throw new Error(`ID de usuario inválido: ${userId}`);
      }
      
      console.log('Actualizando perfil del usuario:', userId);
      console.log('Datos recibidos:', JSON.stringify(updateUserDto, null, 2));
      
      // Convertir explícitamente a número
      const updatedUser = await this.usersService.update(Number(userId), updateUserDto);
      
      // Devolver respuesta estructurada
      return {
        status: 'success',
        data: updatedUser,
        message: 'Perfil actualizado exitosamente'
      };
    } catch (error) {
      console.error('Error en updateProfile:', error);
      // Devolver respuesta estructurada de error
      return {
        status: 'error',
        message: error.message || 'Error al actualizar el perfil del usuario',
        error: error
      };
    }
  }
  
  @UseGuards(JwtAuthGuard)
  @Patch('host-status')
  async updateHostStatus(@Req() req: Request, @Body() body: { enabled?: boolean }) {
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
      let updatedUser;
      if (enabled) {
        updatedUser = await this.usersService.makeHost(numericId);
      } else {
        updatedUser = await this.usersService.update(numericId, { isHost: false } as UpdateUserDto);
      }
      
      // Si llegamos aquí, la operación fue exitosa, devolver respuesta estructurada
      console.log('Usuario actualizado correctamente:', updatedUser);
      return {
        status: 'success',
        message: 'Estado de host actualizado exitosamente',
        data: updatedUser
      };
    } catch (error) {
      console.error('Error al actualizar estado de host:', error);
      // Devolver respuesta estructurada en lugar de lanzar el error
      return {
        status: 'error',
        message: error.message || 'Error al actualizar el estado de host',
        data: null
      };
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
