import { Attraction } from 'src/attractions/entities/attraction.entity';
import { User } from 'src/users/entities/user.entity';
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
  } from 'typeorm';

  
  @Entity('reservations')
  export class Reservation {
    @PrimaryGeneratedColumn('increment')
    id: number;
  
    // For simplicity, using timestamp columns:
    @Column({ type: 'timestamp' })
    date: Date;
  
    @Column({ type: 'timestamp', nullable: true })
    checkin_date: Date;
  
    @Column({ type: 'timestamp', nullable: true })
    checkout_date: Date;
  
    @Column({ length: 20 })
    status: string;
  
    @ManyToOne(() => User, (user) => user.reservations, { onDelete: 'CASCADE' })
    user: User;
  
    @ManyToOne(() => Attraction, (attraction) => attraction.reservations, {
      onDelete: 'CASCADE',
    })
    attraction: Attraction;
  }
  