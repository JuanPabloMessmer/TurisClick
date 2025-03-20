import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Attraction } from '../../attractions/entities/attraction.entity';
import { AttractionCategory } from '../../attractions/entities/attraction-category.entity';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50, unique: true })
  name: string;

  @Column({ length: 255, nullable: true })
  description: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @OneToMany(() => Attraction, attraction => attraction.category)
  attractions: Attraction[];

  @OneToMany(() => AttractionCategory, attractionCategory => attractionCategory.category)
  attractionCategories: AttractionCategory[];
}
