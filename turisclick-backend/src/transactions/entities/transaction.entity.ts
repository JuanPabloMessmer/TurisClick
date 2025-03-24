import { PaymentMethod } from 'src/payment_methods/entities/payment_method.entity';
import { Reservation } from 'src/reservations/entities/reservation.entity';
import { User } from 'src/users/entities/user.entity';
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
    UpdateDateColumn,
    JoinColumn,
  } from 'typeorm';

export enum TransactionStatus {
  PENDING = 'PENDING',
  AUTHORIZED = 'AUTHORIZED',
  REJECTED = 'REJECTED',
  FRAUD = 'FRAUD',
  TECHNICAL_ERROR = 'TECHNICAL_ERROR',
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  REJECTED_BY_BANK = 'REJECTED_BY_BANK',
  HONOR_ISSUE = 'HONOR_ISSUE',
  RETAINED = 'RETAINED'
}

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('increment')
  id: number;
  
  @Column({ type: 'varchar', length: 255, unique: true })
  scrumPayTransactionId: string;
  
  @Column({ type: 'varchar', length: 50, nullable: true })
  scrumPayAuthorizationCode: string;
  
  @Column({ type: 'varchar', length: 255 })
  internalTransactionCode: string;
  
  @Column({ type: 'float' })
  amount: number;
  
  @Column({ type: 'varchar', length: 3, default: 'BOB' })
  currency: string;
  
  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.PENDING
  })
  status: TransactionStatus;
  
  @Column({ type: 'varchar', length: 20, nullable: true })
  paymentForm: string;
  
  @Column({ type: 'varchar', length: 30, nullable: true })
  maskedCardNumber: string;
  
  @Column({ type: 'varchar', length: 10, nullable: true })
  expirationDate: string;
  
  @Column({ type: 'varchar', length: 250, nullable: true })
  token: string;
  
  @CreateDateColumn()
  createdAt: Date;
  
  @UpdateDateColumn()
  updatedAt: Date;
  
  @ManyToOne(() => User, (user) => user.id, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User;
  
  @Column({ nullable: true })
  userId: number;
  
  @ManyToOne(() => PaymentMethod, (paymentMethod) => paymentMethod.transactions, {
    onDelete: 'CASCADE',
  })
  paymentMethod: PaymentMethod;
  
  @ManyToOne(() => Reservation, (reservation) => reservation.id, {
    onDelete: 'CASCADE',
    nullable: true
  })
  reservation: Reservation;
  
  @Column({ type: 'json', nullable: true })
  additionalData: Record<string, any>;
}
  