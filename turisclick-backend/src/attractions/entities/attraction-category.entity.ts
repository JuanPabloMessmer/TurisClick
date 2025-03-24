import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Column } from 'typeorm';
import { Attraction } from './attraction.entity';
import { Category } from '../../categories/entities/category.entity';
import { Sector } from '../../sectors/entities/sector.entity';

@Entity('attraction_categories')
export class AttractionCategory {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Attraction, attraction => attraction.attractionCategories, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'attraction_id' })
  attraction: Attraction;

  @ManyToOne(() => Category, category => category.attractionCategories, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'category_id' })
  category: Category;
}

@Entity('operating_days')
export class OperatingDay {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  sectorId: number;

  @ManyToOne(() => Sector, sector => sector.operatingDays, { onDelete: 'CASCADE' })
  sector: Sector;

  @Column()
  dayOfWeek: number; // 0=Domingo, 1=Lunes, ..., 6=Sábado
}

