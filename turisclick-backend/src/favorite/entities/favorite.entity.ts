import { Attraction } from 'src/attractions/entities/attraction.entity';
import { User } from 'src/users/entities/user.entity';
import {
    Entity,
    ManyToOne,
    CreateDateColumn,
    PrimaryColumn,
  } from 'typeorm';

  
  @Entity('favorites')
  export class Favorite {
    @PrimaryColumn()
    userId: number;
  
    @PrimaryColumn()
    attractionId: number;
  
    @CreateDateColumn()
    created_at: Date;
  
    @ManyToOne(() => User, (user) => user.favorites, {
      onDelete: 'CASCADE',
      eager: false,
    })
    user: User;
  
    @ManyToOne(() => Attraction, (attraction) => attraction.favoritedBy, {
      onDelete: 'CASCADE',
      eager: false,
    })
    attraction: Attraction;
  }
  