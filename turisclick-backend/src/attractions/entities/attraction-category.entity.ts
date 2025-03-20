import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Attraction } from './attraction.entity';
import { Category } from '../../categories/entities/category.entity';

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