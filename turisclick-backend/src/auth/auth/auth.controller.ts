import { Controller, Post, Body, HttpCode, ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import {SkipThrottle, Throttle} from '@nestjs/throttler';


@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @SkipThrottle()
  @Post('signup')
  @HttpCode(201)
  async signup(
    @Body() signupDto: { firstName:string, lastName:string, email: string; password: string; preferences?: string[] },
  ) {
    try {
      console.log('Datos recibidos en signup:', {
        firstName: signupDto.firstName,
        lastName: signupDto.lastName,
        email: signupDto.email,
        preferences: signupDto.preferences
      });

      // Asegurarnos de que preferences sea un array
      let preferences = signupDto.preferences || [];
      if (preferences && !Array.isArray(preferences)) {
        try {
          // Si viene como string, intentar convertirlo a array
          preferences = JSON.parse(preferences as any);
        } catch (e) {
          // Si falla el parse, asumimos que es un string simple y lo convertimos a array
          preferences = preferences ? [preferences.toString()] : [];
        }
      }

      const userData = await this.authService.signup(
        signupDto.firstName,
        signupDto.lastName,
        signupDto.email,
        signupDto.password,
        preferences
      );

      console.log('Usuario creado:', userData);

      return {
        status: 'success',
        message: 'Usuario creado exitosamente',
        data: userData,
      };
    } catch (error) {
      console.error('Error en el proceso de signup:', error);
      throw error;
    }
  }

  @Post('login')
  @HttpCode(200)
  async login(@Body() loginDto: { email: string; password: string }) {
    const user = await this.authService.validateUser(loginDto.email, loginDto.password);
    const token = this.authService.login(user);
    return {
      status: 'success',
      message: 'Login exitoso',
      data: token,
    };
  }
}
