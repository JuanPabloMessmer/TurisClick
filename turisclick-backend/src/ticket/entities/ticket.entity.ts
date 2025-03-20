import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Attraction } from '../../attractions/entities/attraction.entity';
import { Sector } from '../../sectors/entities/sector.entity';
import { User } from '../../users/entities/user.entity';

export enum TicketStatus {
  ACTIVE = 'ACTIVE',
  USED = 'USED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED'
}

@Entity()
export class Ticket {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  code: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'date' })
  validFor: Date;

  @Column({
    type: 'enum',
    enum: TicketStatus,
    default: TicketStatus.ACTIVE
  })
  status: TicketStatus;

  @ManyToOne(() => Attraction, attraction => attraction.tickets, { onDelete: 'CASCADE' })
  attraction: Attraction;

  @Column()
  attractionId: number;

  @ManyToOne(() => Sector, sector => sector.tickets, { onDelete: 'CASCADE' })
  sector: Sector;

  @Column()
  sectorId: number;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  buyer: User;

  @Column({ nullable: true })
  buyerId: number;

  @CreateDateColumn()
  purchaseDate: Date;

  @Column({ nullable: true })
  usedDate: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;
}
