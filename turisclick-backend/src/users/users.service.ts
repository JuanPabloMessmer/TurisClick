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

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const existingUser = await this.usersRepository.findOne({ where: { id } });
    if (!existingUser) {
      throw new NotFoundException(`Usuario con id ${id} no encontrado`);
    }
    await this.usersRepository.update(id, updateUserDto);
    const updatedUser = await this.usersRepository.findOne({ where: { id } });
    if (!updatedUser) {
      throw new NotFoundException(`No se pudo obtener el usuario actualizado con id ${id}`);
    }
    const { password, ...result } = updatedUser;
    return result as User;
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
