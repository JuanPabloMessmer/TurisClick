import { Transaction } from 'src/transactions/entities/transaction.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';

@Entity('payment_methods')
export class PaymentMethod {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ length: 100 })
  name: string;

  @OneToMany(() => Transaction, (transaction) => transaction.paymentMethod)
  transactions: Transaction[];
}
