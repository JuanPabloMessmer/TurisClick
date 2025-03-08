import { Attraction } from 'src/attractions/entities/attraction.entity';
import { User } from 'src/users/entities/user.entity';
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
  } from 'typeorm';
  
  
  @Entity('reviews')
  export class Review {
    @PrimaryGeneratedColumn('increment')
    id: number;
  
    @Column({ type: 'int' })
    rating: number;
  
    @Column({ length: 255 })
    comment: string;
  
    @ManyToOne(() => User, (user) => user.reviews, { onDelete: 'CASCADE' })
    user: User;
  
    @ManyToOne(() => Attraction, (attraction) => attraction.reviews, {
      onDelete: 'CASCADE',
    })
    attraction: Attraction;
  }
  