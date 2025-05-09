// src/app.module.ts
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard, seconds } from '@nestjs/throttler';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { JwtStrategy } from './jwt.strategy';

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
import { DepartmentsModule } from './departments/departments.module';
import { SectorsModule } from './sectors/sectors.module';
import { TicketModule } from './ticket/ticket.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST'),
        port: +config.get('DB_PORT'),
        username: config.get('DB_USER'),
        password: config.get('DB_PASS'),
        database: config.get('DB_NAME'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: config.get('NODE_ENV') !== 'production',
      }),
    }),
    ThrottlerModule.forRoot([
      {
        ttl: seconds(1800),
        limit: 5,

      },
    ]),
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
    DepartmentsModule,
    SectorsModule,
    TicketModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    JwtStrategy,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
