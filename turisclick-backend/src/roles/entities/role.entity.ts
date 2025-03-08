import { User } from 'src/users/entities/user.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn('increment')
  role_id: number;

  @Column({ length: 50 })
  name: string;

  @OneToMany(() => User, (user) => user.role)
  users: User[];
}
