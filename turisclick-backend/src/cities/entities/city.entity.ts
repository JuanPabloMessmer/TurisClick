import { Attraction } from 'src/attractions/entities/attraction.entity';
import { Country } from 'src/countries/entities/country.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';


@Entity('cities')
export class City {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ length: 50 })
  name: string;

  @ManyToOne(() => Country, (country) => country.cities, { onDelete: 'CASCADE' })
  country: Country;

  @OneToMany(() => Attraction, (attraction) => attraction.city)
  attractions: Attraction[];
}
