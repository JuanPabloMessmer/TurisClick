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

  async signup(firstName: string, lastName:string, email: string, password: string): Promise<any> {
    const existingUser = await this.usersRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException('El email ya está registrado.');
    }
  
    const hashedPassword = await bcrypt.hash(password, 10);
  
    const newUser = this.usersRepository.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
    });
  
    const savedUser = await this.usersRepository.save(newUser);
  
    const { password: _, ...result } = savedUser;
    return { message: 'Usuario creado exitosamente', user: result };
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
