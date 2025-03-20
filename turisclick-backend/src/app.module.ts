import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
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
import { DepartmentsModule } from './departments/departments.module';
import { SectorsModule } from './sectors/sectors.module';
import { TicketModule } from './ticket/ticket.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: +configService.get('DB_PORT'),
        username: configService.get('DB_USER'),
        password: configService.get('DB_PASS'),
        database: configService.get('DB_NAME'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: configService.get('NODE_ENV') !== 'production',
      }),
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
    DepartmentsModule,
    SectorsModule,
    TicketModule,
  ],
  controllers: [AppController],
  providers: [AppService,
    JwtStrategy
  ],
})
export class AppModule {}
