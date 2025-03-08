import { PaymentMethod } from 'src/payment_methods/entities/payment_method.entity';
import { Reservation } from 'src/reservations/entities/reservation.entity';
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
  } from 'typeorm';

  
  @Entity('transactions')
  export class Transaction {
    @PrimaryGeneratedColumn('increment')
    id: number;
  
    @Column({ type: 'float' })
    amount: number;
  
    @Column({ length: 20 })
    status: string;
  
    @Column({ type: 'timestamp' })
    timestamp: Date;
  
    @ManyToOne(() => PaymentMethod, (paymentMethod) => paymentMethod.transactions, {
      onDelete: 'CASCADE',
    })
    paymentMethod: PaymentMethod;
  
    @ManyToOne(() => Reservation, (reservation) => reservation.id, {
      onDelete: 'CASCADE',
    })
    reservation: Reservation;
  }
  