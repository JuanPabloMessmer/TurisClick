import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
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
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: "postgres",
      password: "hwcrhh330",
      database: "turisClick",
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
      logging: true, 

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
    AuthModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
