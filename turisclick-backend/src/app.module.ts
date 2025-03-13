import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AttractionsModule } from './attractions/attractions.module';
import { CountriesModule } from './countries/countries.module';
import { CitiesModule } from './cities/cities.module';
import { CategoriesModule } from './categories/categories.module';
import { RolesModule } from './roles/roles.module';
import { ReviewsModule } from './reviews/reviews.module';
import { ReservationsModule } from './reservations/reservations.module';
import { PaymentMethodsModule } from './payment_methods/payment_methods.module';
import { TransactionsModule } from './transactions/transactions.module';
import { FavoriteModule } from './favorite/favorite.module';
import { PriceHistoryModule } from './price_history/price_history.module';
import { AdminModule } from './admin/admin.module';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // Cargar variables de entorno de .env
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST ,
      port: 5432,
      username: process.env.DB_USER ,
      password: process.env.DB_PASS ,
      database: process.env.DB_NAME ,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: process.env.DB_SYNC === 'true', 
      logging: process.env.DB_LOGGING === 'true',
    }),
    AuthModule,
    UsersModule,
    AttractionsModule,
    CountriesModule,
    CitiesModule,
    CategoriesModule,
    RolesModule,
    ReviewsModule,
    ReservationsModule,
    PaymentMethodsModule,
    TransactionsModule,
    FavoriteModule,
    PriceHistoryModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService,
    JwtStrategy
  ],
})
export class AppModule {}
