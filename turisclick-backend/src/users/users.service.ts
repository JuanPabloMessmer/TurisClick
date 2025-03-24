import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { AuthService } from '../auth/auth/auth.service';
import { Attraction } from '../attractions/entities/attraction.entity';
import { AttractionsService } from '../attractions/attractions.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private authService: AuthService,

  ) {}
  create(createUserDto: CreateUserDto) {
    return 'This action adds a new user';
  }

  findAll() {
    return `This action returns all users`;
  }

  async findOne(id: number): Promise<User> {
    console.log('findOne: Buscando usuario con ID:', id);
    
    // Asegurar que el ID es un número válido
    if (id === undefined || id === null || isNaN(id)) {
      console.error('findOne: ERROR - ID inválido:', id);
      throw new Error(`ID de usuario inválido: ${id}`);
    }
    
    try {
      const user = await this.usersRepository.findOne({ where: { id } });
      
      if (!user) {
        console.error('findOne: Usuario no encontrado con ID:', id);
        throw new NotFoundException(`Usuario con id ${id} no encontrado`);
      }
      
      console.log('findOne: Usuario encontrado -', 'ID:', user.id, 'Email:', user.email, 'isHost:', user.isHost);
      
      // Retornar el usuario sin la contraseña
      const { password, ...result } = user;
      return result as User;
    } catch (error) {
      console.error('findOne: Error al buscar usuario -', error.message);
      throw error;
    }
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<any> {
    console.log('update: Iniciando actualización para usuario ID:', id);
    console.log('update: Datos recibidos:', JSON.stringify(updateUserDto, null, 2));
    
    try {
      const existingUser = await this.usersRepository.findOne({ where: { id } });
      if (!existingUser) {
        console.error('update: Usuario no encontrado con ID:', id);
        throw new NotFoundException(`Usuario con id ${id} no encontrado`);
      }
      
      console.log('update: Usuario encontrado:', JSON.stringify(existingUser, null, 2));
      
      // Verificar explícitamente si hay preferencias para actualizar
      if (updateUserDto.preferences !== undefined) {
        console.log('update: Actualizando preferencias:', updateUserDto.preferences);
        // Asegurar que preferences siempre sea un array
        if (!Array.isArray(updateUserDto.preferences)) {
          console.warn('update: preferences no es un array, convirtiéndolo:', updateUserDto.preferences);
          updateUserDto.preferences = updateUserDto.preferences 
            ? [String(updateUserDto.preferences)] 
            : [];
        }
      }
      
      // Realizar la actualización
      console.log('update: Aplicando cambios al usuario');
      await this.usersRepository.update(id, updateUserDto);
      
      // Obtener el usuario actualizado
      const updatedUser = await this.usersRepository.findOne({ where: { id } });
      if (!updatedUser) {
        console.error('update: No se pudo obtener el usuario actualizado con ID:', id);
        throw new NotFoundException(`No se pudo obtener el usuario actualizado con id ${id}`);
      }
      
      console.log('update: Usuario actualizado exitosamente:', JSON.stringify(updatedUser, null, 2));
      
      // Retornar el usuario sin la contraseña
      const { password, ...result } = updatedUser;
      
      return {
        ...result,
        status: 'success',
        message: 'Perfil actualizado exitosamente'
      };
    } catch (error) {
      console.error('update: Error al actualizar usuario:', error);
      throw error;
    }
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }

  async makeHost(id: number): Promise<User> {
    console.log('makeHost: Recibido ID de usuario:', id, typeof id);
    
    // Asegurar que el ID es un número válido
    if (id === undefined || id === null || isNaN(id)) {
      console.error('makeHost: ERROR - ID inválido:', id);
      throw new Error(`ID de usuario inválido: ${id}`);
    }
    
    try {
      // Buscar el usuario por ID
      const user = await this.usersRepository.findOne({ where: { id } });
      
      if (!user) {
        console.error('makeHost: ERROR - Usuario no encontrado con ID:', id);
        throw new NotFoundException(`Usuario con id ${id} no encontrado`);
      }
      
      console.log('makeHost: Usuario encontrado -', 'ID:', user.id, 'Email:', user.email);
      console.log('makeHost: Cambiando isHost de', user.isHost, 'a true');
      
      // Actualizar el estado de host
      user.isHost = true;
      await this.usersRepository.save(user);
      
      console.log('makeHost: Usuario actualizado exitosamente');
      
      // Retornar el usuario sin la contraseña
      const { password, ...result } = user;
      return result as User;
    } catch (error) {
      console.error('makeHost: Error al procesar la solicitud -', error.message);
      throw error;
    }
  }
}
