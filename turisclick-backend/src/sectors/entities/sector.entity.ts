import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { Attraction } from '../../attractions/entities/attraction.entity';
import { Ticket } from '../../ticket/entities/ticket.entity';
import { OperatingDay } from '../../attractions/entities/attraction-category.entity';

@Entity()
export class Sector {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  maxCapacity: number;

  @ManyToOne(() => Attraction, attraction => attraction.sectors, { onDelete: 'CASCADE' })
  attraction: Attraction;

  @Column()
  attractionId: number;

  @OneToMany(() => Ticket, ticket => ticket.sector)
  tickets: Ticket[];
  
  @OneToMany(() => OperatingDay, operatingDay => operatingDay.sector)
  operatingDays: OperatingDay[];
}
