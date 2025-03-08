import { Category } from 'src/categories/entities/category.entity';
import { City } from 'src/cities/entities/city.entity';
import { Favorite } from 'src/favorite/entities/favorite.entity';
import { PriceHistory } from 'src/price_history/entities/price_history.entity';
import { Reservation } from 'src/reservations/entities/reservation.entity';
import { Review } from 'src/reviews/entities/review.entity';
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    OneToMany,
  } from 'typeorm';

  
  @Entity('attractions')
  export class Attraction {
    @PrimaryGeneratedColumn('increment')
    id: number;
  
    @Column({ length: 80 })
    name: string;
  
    @Column({ length: 80 })
    description: string;
  
    @Column({ length: 80 })
    opening_time: string;
  
    @Column({ length: 80 })
    closing_time: string;
  
    @Column({ type: 'float' })
    price: number;
  
    @Column({ length: 80 })
    location: string;
  
    @Column({ length: 255, nullable: true })
    images: string;
  
    @ManyToOne(() => City, { onDelete: 'CASCADE' })
    city: City;
  
    @ManyToOne(() => Category, { onDelete: 'CASCADE' })
    category: Category;
  
    @OneToMany(() => Review, (review) => review.attraction)
    reviews: Review[];
  
    @OneToMany(() => Favorite, (favorite) => favorite.attraction)
    favoritedBy: Favorite[];
  
    @OneToMany(() => PriceHistory, (priceHistory) => priceHistory.attraction)
    priceHistory: PriceHistory[];
  
    @OneToMany(() => Reservation, (reservation) => reservation.attraction)
    reservations: Reservation[];
  }
  