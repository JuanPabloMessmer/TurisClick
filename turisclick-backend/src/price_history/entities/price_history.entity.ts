import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Attraction } from '../../attractions/entities/attraction.entity';
import { User } from '../../users/entities/user.entity';

@Entity()
export class PriceHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Attraction, { onDelete: 'CASCADE' })
  attraction: Attraction;

  @Column()
  attractionId: number;

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