import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import * as crypto from 'crypto';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { Transaction, TransactionStatus } from './entities/transaction.entity';
import { ConfigService } from '@nestjs/config';
import { User } from 'src/users/entities/user.entity';
import { PaymentMethod } from 'src/payment_methods/entities/payment_method.entity';
import { Logger } from '@nestjs/common';

@Injectable()
export class TransactionsService {
  private readonly scrumPayTestApiUrl: string;
  private readonly scrumPayProdApiUrl: string;
  private readonly username: string;
  private readonly password: string;
  private readonly idComercio: string;
  private readonly isProduction: boolean;
  private readonly logger = new Logger(TransactionsService.name);

  constructor(
    @InjectRepository(Transaction)
    private transactionsRepository: Repository<Transaction>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(PaymentMethod)
    private paymentMethodsRepository: Repository<PaymentMethod>,
    private configService: ConfigService
  ) {
    this.scrumPayTestApiUrl = 'https://pay.scrum-technology.com/api/v2test/consulta_transaccion.php';
    this.scrumPayProdApiUrl = 'https://pay.scrum-technology.com/api/v2pro/consulta_transaccion.php';
    this.username = this.configService.get<string>('SCRUM_PAY_USERNAME', 'test_BeeRentBeeRentBeeRentB');
    this.password = this.configService.get<string>('SCRUM_PAY_PASSWORD', 'dd23de5_789789uu');
    this.idComercio = this.configService.get<string>('SCRUM_PAY_ID_COMERCIO', 'BeeRentBeeRentBeeRentBeeRentBeeRent');
    this.isProduction = this.configService.get<string>('NODE_ENV', 'development') === 'production';
  }

  /**
   * Crea una nueva transacción en la base de datos
   */
  async create(createTransactionDto: CreateTransactionDto): Promise<Transaction> {
    try {
      const transaction = this.transactionsRepository.create(createTransactionDto);
      
      // Si hay usuario, buscar que exista
      if (createTransactionDto.userId) {
        const user = await this.usersRepository.findOne({
          where: { id: createTransactionDto.userId }
        });
        
        if (!user) {
          throw new NotFoundException(`Usuario con ID ${createTransactionDto.userId} no encontrado`);
        }
        
        transaction.user = user;
      }
      
      // Si hay método de pago, buscar que exista
      if (createTransactionDto.paymentMethodId) {
        const paymentMethod = await this.paymentMethodsRepository.findOne({
          where: { id: createTransactionDto.paymentMethodId }
        });
        
        if (!paymentMethod) {
          throw new NotFoundException(`Método de pago con ID ${createTransactionDto.paymentMethodId} no encontrado`);
        }
        
        transaction.paymentMethod = paymentMethod;
      }
      
      return await this.transactionsRepository.save(transaction);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Error al crear la transacción: ${error.message}`);
    }
  }
  
  /**
   * Consulta el estado de una transacción en SCRUM PAY
   */
  async consultScrumPayTransaction(transactionId: string): Promise<any> {
    try {
      // Determinar la URL del servicio según ambiente
      const apiUrl = this.isProduction ? this.scrumPayProdApiUrl : this.scrumPayTestApiUrl;
      
      // Datos para la consulta
      const requestData = {
        id_comercio: this.idComercio,
        id_transaccion: transactionId
      };
      
      // Crear la autorización básica
      const auth = Buffer.from(`${this.username}:${this.password}`).toString('base64');
      
      // Cabeceras con autenticación básica
      const headers = {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      };
      
      console.log('Consultando estado de transacción en SCRUM PAY:', transactionId);
      
      // Realizar la petición HTTP
      const response = await axios.post(apiUrl, requestData, { headers });
      
      console.log('Respuesta de consulta de transacción SCRUM PAY:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('Error al consultar estado de transacción en SCRUM PAY:', error);
      throw new BadRequestException('Error al consultar estado de transacción en SCRUM PAY');
    }
  }
  
  /**
   * Actualiza el estado de una transacción basado en la respuesta de SCRUM PAY
   */
  async updateTransactionStatusFromScrumPay(transactionId: string): Promise<Transaction> {
    // Buscar la transacción en la base de datos
    const transaction = await this.findByTransactionId(transactionId);
    
    if (!transaction) {
      throw new NotFoundException(`Transacción con ID ${transactionId} no encontrada`);
    }
    
    // Consultar el estado en SCRUM PAY
    const scrumPayResponse = await this.consultScrumPayTransaction(transactionId);
    
    if (scrumPayResponse.error !== '0') {
      throw new BadRequestException(`Error en la consulta a SCRUM PAY: ${scrumPayResponse.mensaje || 'Error desconocido'}`);
    }
    
    // Mapear el estatus de SCRUM PAY a nuestro enum TransactionStatus
    let status: TransactionStatus;
    
    switch (scrumPayResponse.estatus) {
      case '0':
        status = TransactionStatus.AUTHORIZED;
        break;
      case '1':
        status = TransactionStatus.REJECTED;
        break;
      case '2':
        status = TransactionStatus.FRAUD;
        break;
      case '3':
        status = TransactionStatus.TECHNICAL_ERROR;
        break;
      case '4':
        status = TransactionStatus.INSUFFICIENT_FUNDS;
        break;
      case '5':
        status = TransactionStatus.REJECTED_BY_BANK;
        break;
      case '6':
        status = TransactionStatus.HONOR_ISSUE;
        break;
      case '7':
        status = TransactionStatus.RETAINED;
        break;
      case '8':
        status = TransactionStatus.PENDING;
        break;
      default:
        status = TransactionStatus.PENDING;
    }
    
    // Actualizar la transacción con los datos de SCRUM PAY
    transaction.status = status;
    transaction.paymentForm = scrumPayResponse.fop;
    transaction.maskedCardNumber = scrumPayResponse.numeroTarjeta;
    transaction.scrumPayAuthorizationCode = scrumPayResponse.codigoAutorizacion;
    transaction.expirationDate = scrumPayResponse.expiracion;
    transaction.token = scrumPayResponse.token;
    
    // Guardar datos adicionales JSON
    transaction.additionalData = {
      monto_cobrado: scrumPayResponse.monto_cobrado,
      moneda: scrumPayResponse.moneda,
      ...transaction.additionalData
    };
    
    return await this.transactionsRepository.save(transaction);
  }

  async findAll(): Promise<Transaction[]> {
    return await this.transactionsRepository.find({
      relations: ['user', 'paymentMethod', 'reservation'],
      order: { createdAt: 'DESC' }
    });
  }

  async findByUser(userId: number): Promise<Transaction[]> {
    return await this.transactionsRepository.find({
      where: { userId },
      relations: ['paymentMethod', 'reservation'],
      order: { createdAt: 'DESC' }
    });
  }

  async findOne(id: number): Promise<Transaction> {
    const transaction = await this.transactionsRepository.findOne({
      where: { id },
      relations: ['user', 'paymentMethod', 'reservation']
    });
    
    if (!transaction) {
      throw new NotFoundException(`Transacción con ID ${id} no encontrada`);
    }
    
    return transaction;
  }

  /**
   * Encuentra una transacción por su ID completo generado por SCRUM PAY
   * @param scrumPayTransactionId ID completo de transacción generado por SCRUM PAY
   * @returns La transacción encontrada o null si no existe
   */
  async findByTransactionId(scrumPayTransactionId: string): Promise<Transaction> {
    try {
      this.logger.log(`Buscando transacción con ID completo: ${scrumPayTransactionId}`);
      
      // Buscar directamente con el ID completo de SCRUM PAY
      const transaction = await this.transactionsRepository.findOne({
        where: { scrumPayTransactionId },
        relations: ['user', 'paymentMethod']
      });
      
      if (transaction) {
        this.logger.log(`Transacción encontrada con ID: ${transaction.id}`);
        return transaction;
      }
      
      this.logger.warn(`No se encontró transacción con ID: ${scrumPayTransactionId}`);
      return null as unknown as Transaction;
    } catch (error) {
      this.logger.error(`Error al buscar transacción por ID: ${error}`);
      throw new Error(`Error al buscar transacción: ${error.message}`);
    }
  }

  async findByInternalCode(internalCode: string): Promise<Transaction> {
    const transaction = await this.transactionsRepository.findOne({
      where: { internalTransactionCode: internalCode },
      relations: ['user', 'paymentMethod', 'reservation']
    });
    
    if (!transaction) {
      throw new NotFoundException(`Transacción con código interno ${internalCode} no encontrada`);
    }
    
    return transaction;
  }

  async update(id: number, updateTransactionDto: UpdateTransactionDto): Promise<Transaction> {
    const transaction = await this.findOne(id);
    
    // Actualizar campos
    Object.assign(transaction, updateTransactionDto);
    
    return await this.transactionsRepository.save(transaction);
  }

  async remove(id: number): Promise<void> {
    const transaction = await this.findOne(id);
    await this.transactionsRepository.remove(transaction);
  }
}
