/* eslint-disable prettier/prettier */
import { City } from 'src/cities/entities/city.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';

@Entity('countries')
export class Country {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ length: 50 })
  name: string;

  @OneToMany(() => City, (city) => city.country)
  cities: City[];
}
