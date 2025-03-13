import { Controller, Post, Body, HttpCode, ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  @HttpCode(201)
  async signup(
    @Body() signupDto: { firstName:string,lastName:string, email: string; password: string },
  ) {
    const userData = await this.authService.signup(
      signupDto.firstName,
      signupDto.lastName,
      signupDto.email,
      signupDto.password,
    );
    return {
      status: 'success',
      message: 'Usuario creado exitosamente',
      data: userData, 
    };
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
