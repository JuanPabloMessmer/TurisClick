import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy, StrategyOptionsWithoutRequest } from 'passport-jwt';

interface JwtPayload {
  sub: number;
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private configService: ConfigService) {
    const options: StrategyOptionsWithoutRequest = {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET')!,
    };
    super(options);
  }

  async validate(payload: JwtPayload): Promise<{ userId: number; email: string; role: string }> {
    const userId = typeof payload.sub === 'number' ? payload.sub : Number(payload.sub);
    
    console.log('Token JWT validado. ID de usuario extraído:', userId);
    
    if (isNaN(userId)) {
      console.error('Error: El ID de usuario extraído del token JWT es inválido', payload);
      throw new Error('Invalid user ID in JWT token');
    }
    
    return { 
      userId, 
      email: payload.email, 
      role: payload.role 
    };
  }
}
