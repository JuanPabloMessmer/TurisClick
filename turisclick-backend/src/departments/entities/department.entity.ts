import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { Country } from '../../countries/entities/country.entity';
import { City } from '../../cities/entities/city.entity';

@Entity('departments')
export class Department {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  @ManyToOne(() => Country, (country) => country.departments, { onDelete: 'CASCADE' })
  country: Country;

  @OneToMany(() => City, (city) => city.department)
  cities: City[];
}
