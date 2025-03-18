import { Attraction } from 'src/attractions/entities/attraction.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ length: 40 })
  name: string;

  @Column({ length: 255 })
  description: string;

  @OneToMany(() => Attraction, (attraction) => attraction.category)
  attractions: Attraction[];
}
