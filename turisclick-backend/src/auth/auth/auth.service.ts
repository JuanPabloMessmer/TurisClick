import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async signup(firstName: string, lastName:string, email: string, password: string, preferences?: string[]): Promise<any> {
    // Debug para verificar preferencias
    console.log('Preferencias recibidas en auth.service:', preferences);

    const existingUser = await this.usersRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException('El email ya está registrado.');
    }
  
    const hashedPassword = await bcrypt.hash(password, 10);
  
    // Asegurarnos de que preferences sea un array
    const userPreferences: string[] = [];
    if (preferences && Array.isArray(preferences) && preferences.length > 0) {
      preferences.forEach(pref => {
        if (pref) userPreferences.push(pref.toString());
      });
    }
  
    try {
      // Crear el usuario con sus preferencias desde el principio
      const newUser = this.usersRepository.create({
        firstName,
        lastName,
        email,
        password: hashedPassword,
        preferences: userPreferences,
      });
      
      console.log('Creando usuario con preferencias:', {
        firstName,
        lastName,
        email,
        preferences: userPreferences
      });
      
      const savedUser = await this.usersRepository.save(newUser);
      console.log('Usuario guardado en la base de datos:', savedUser);
      
      // Si no se guardaron las preferencias, intentar una actualización directa
      if (userPreferences.length > 0 && (!savedUser.preferences || savedUser.preferences.length === 0)) {
        console.log('Las preferencias no se guardaron correctamente, intentando actualización directa...');
        
        // Actualizar directamente usando SQL nativo
        await this.usersRepository.query(
          `UPDATE users SET preferences = $1 WHERE id = $2`,
          [userPreferences, savedUser.id]
        );
        
        // Obtener el usuario actualizado
        const updatedUser = await this.usersRepository.findOne({ where: { id: savedUser.id } });
        console.log('Usuario después de actualizar preferencias:', updatedUser);
        
        if (updatedUser) {
          // Extraer información sin contraseña
          const { password: _, ...result } = updatedUser;
          return { message: 'Usuario creado exitosamente', user: result };
        }
      }
      
      // Extraer información sin contraseña
      const { password: _, ...result } = savedUser;
      return { message: 'Usuario creado exitosamente', user: result };
    } catch (error) {
      console.error('Error al crear usuario con preferencias:', error);
      throw error;
    }
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersRepository.findOne({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    return { userId: user.id, email: user.email, role: user.role };
  }

  login(user: any) {
    const payload = { email: user.email, sub: user.userId, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
