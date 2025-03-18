/* eslint-disable prettier/prettier */
import { City } from 'src/cities/entities/city.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Department } from '../../departments/entities/department.entity';

@Entity('countries')
export class Country {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ length: 50 })
  name: string;

  @OneToMany(() => Department, (department) => department.country)
  departments: Department[];
}
