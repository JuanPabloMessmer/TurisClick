import { Favorite } from 'src/favorite/entities/favorite.entity';
import { Reservation } from 'src/reservations/entities/reservation.entity';
import { Review } from 'src/reviews/entities/review.entity';
import { Role } from 'src/roles/entities/role.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
} from 'typeorm';


@Entity('users')
export class User {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ length: 75, unique: true })
  username: string;

  @Column({ length: 255, unique: true })
  email: string;

  @Column({ length: 255 })
  password: string;

  @Column({ length: 255, nullable: true })
  preferences: string;

  @Column({ length: 255, nullable: true })
  profile_image: string;

  @ManyToOne(() => Role, (role) => role.users, { onDelete: 'SET NULL' })
  role: Role;

  @OneToMany(() => Review, (review) => review.user)
  reviews: Review[];

  @OneToMany(() => Favorite, (favorite) => favorite.user)
  favorites: Favorite[];

  @OneToMany(() => Reservation, (reservation) => reservation.user)
  reservations: Reservation[];
}
