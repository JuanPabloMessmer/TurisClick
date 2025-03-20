import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Attraction } from '../../attractions/entities/attraction.entity';
import { User } from '../../users/entities/user.entity';
import { Sector } from '../../sectors/entities/sector.entity';

export enum PriceChangeType {
  ATTRACTION = 'ATTRACTION',
  SECTOR = 'SECTOR'
}

@Entity()
export class PriceHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: PriceChangeType,
    default: PriceChangeType.ATTRACTION
  })
  changeType: PriceChangeType;

  @ManyToOne(() => Attraction, { onDelete: 'CASCADE' })
  attraction: Attraction;

  @Column()
  attractionId: number;

  @ManyToOne(() => Sector, { onDelete: 'CASCADE', nullable: true })
  sector: Sector;

  @Column({ nullable: true })
  sectorId: number;

  @Column('decimal', { precision: 10, scale: 2 })
  previousPrice: number;

  @Column('decimal', { precision: 10, scale: 2 })
  newPrice: number;

  @ManyToOne(() => User, { nullable: true })
  changedBy: User;

  @Column({ nullable: true })
  changedById: number;

  @CreateDateColumn()
  changedAt: Date;

  @Column({ nullable: true })
  reason: string;
}