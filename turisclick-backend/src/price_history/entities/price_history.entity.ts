import { Attraction } from 'src/attractions/entities/attraction.entity';
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
  } from 'typeorm';
  
  @Entity('price_history')
  export class PriceHistory {
    @PrimaryGeneratedColumn('increment')
    id: number;
  
    @Column({ type: 'float' })
    old_price: number;
  
    @Column({ type: 'float' })
    new_price: number;
  
    @CreateDateColumn()
    changed_at: Date;
  
    @ManyToOne(() => Attraction, (attraction) => attraction.priceHistory, {
      onDelete: 'CASCADE',
    })
    attraction: Attraction;
  }
  