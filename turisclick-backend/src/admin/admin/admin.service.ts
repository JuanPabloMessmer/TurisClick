import { Injectable } from '@nestjs/common';

@Injectable()
export class AdminService {
  getDashboard() {
    return {
      message: 'Bienvenido al panel de administración',
      stats: {
        usuarios: 100,
        atracciones: 50,
        reservas: 20,
      },
    };
  }
}
