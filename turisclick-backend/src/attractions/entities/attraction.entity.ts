import { Category } from 'src/categories/entities/category.entity';
import { City } from 'src/cities/entities/city.entity';
import { Favorite } from 'src/favorite/entities/favorite.entity';
import { PriceHistory } from 'src/price_history/entities/price_history.entity';
import { Reservation } from 'src/reservations/entities/reservation.entity';
import { Review } from 'src/reviews/entities/review.entity';
import { Sector } from 'src/sectors/entities/sector.entity';
import { Ticket } from 'src/ticket/entities/ticket.entity';
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    OneToMany,
    ManyToMany,
    JoinTable,
  } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { AttractionStatus } from '../enums/attraction-status.enums';
import { AttractionCategory } from './attraction-category.entity';

  
  @Entity('attractions')
  export class Attraction {
    @PrimaryGeneratedColumn('increment')
    id: number;
  
    @Column({ length: 80 })
    name: string;
  
    @Column({ length: 255 })
    description: string;
  
    @Column({ type: 'time' })
    opening_time: string;
  
    @Column({ type: 'time' })
    closing_time: string;
  

  
    @Column({ length: 80 })
    location: string;
    
    @Column({ type: 'float', nullable: true })
    latitude: number;
    
    @Column({ type: 'float', nullable: true })
    longitude: number;
    
    @Column({ length: 255, nullable: true })
    googleMapsUrl: string;
  
    @Column({ length: 255, nullable: true })
    images: string;
  
    @ManyToOne(() => City, { onDelete: 'CASCADE' })
    city: City;
  
    @ManyToOne(() => Category, { onDelete: 'CASCADE' })
    category: Category;
  
    @OneToMany(() => AttractionCategory, attractionCategory => attractionCategory.attraction, { cascade: true })
    attractionCategories: AttractionCategory[];
  
    @OneToMany(() => Review, (review) => review.attraction)
    reviews: Review[];
  
    @OneToMany(() => Favorite, (favorite) => favorite.attraction)
    favoritedBy: Favorite[];
  
    @OneToMany(() => PriceHistory, (priceHistory) => priceHistory.attraction)
    priceHistory: PriceHistory[];
  
    @OneToMany(() => Reservation, (reservation) => reservation.attraction)
    reservations: Reservation[];

    @OneToMany(() => Sector, (sector) => sector.attraction)
    sectors: Sector[];

    @OneToMany(() => Ticket, (ticket) => ticket.attraction)
    tickets: Ticket[];

    @ManyToOne(() => User, (user) => user.attractions, { nullable: true, onDelete: 'SET NULL' })
    admin: User;
    
    @Column({
      type: 'enum',
      enum: AttractionStatus,
      default: AttractionStatus.PENDING,
    })
    status: AttractionStatus;
  }
  