import { Controller, Get, Post, Body, Patch, Param, Delete, HttpException, HttpStatus, ConflictException, NotFoundException, UseInterceptors, UploadedFiles, Query, Req, Res, BadRequestException, HttpCode, UseGuards } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { ApiTags, ApiResponse, ApiBody } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from './entities/transaction.entity';
import { TransactionStatus } from './entities/transaction.entity';
import { Response } from 'express';
import { Public } from 'src/auth/public.decorator';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/roles.guard';
import { Roles } from 'src/roles/roles.decorator';
import { RoleType } from 'src/roles/role.enum';
import { TicketService } from 'src/ticket/ticket.service';
import { CreateTicketsTransactionDto } from 'src/ticket/dto/create-tickets-transaction.dto';
import { User } from '../users/entities/user.entity';


@Controller('transactions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TransactionsController {
  constructor(
    private readonly transactionsService: TransactionsService,
    private readonly ticketService: TicketService,
    @InjectRepository(Transaction)
    private readonly transactionsRepository: Repository<Transaction>
  ) {}

  @Post()
  @Roles(RoleType.ADMIN, RoleType.MANAGER)
  async create(@Body() createTransactionDto: CreateTransactionDto) {
    return this.transactionsService.create(createTransactionDto);
  }

  @Post('create-pending')
  @Public()
  async createPending(@Body() createTransactionDto: CreateTransactionDto) {
    try {
      console.log('Creando transacción pendiente:', createTransactionDto);
      
      // Asegurarse de que el estado sea PENDING
      createTransactionDto.status = TransactionStatus.PENDING;
      
      const result = await this.transactionsService.create(createTransactionDto);
      return {
        status: 'success',
        data: result
      };
    } catch (error) {
      console.error('Error al crear transacción pendiente:', error);
      throw new BadRequestException(
        `Error al crear transacción pendiente: ${error.message}`
      );
    }
  }

  @Get()
  @Roles(RoleType.ADMIN, RoleType.MANAGER)
  findAll() {
    return this.transactionsService.findAll();
  }

  @Get('user/:userId')
  @Roles(RoleType.ADMIN, RoleType.MANAGER, RoleType.USER)
  findByUser(@Param('userId') userId: string) {
    return this.transactionsService.findByUser(+userId);
  }

  @Get(':id')
  @Roles(RoleType.ADMIN, RoleType.MANAGER, RoleType.USER)
  findOne(@Param('id') id: string) {
    return this.transactionsService.findOne(+id);
  }

  @Patch(':id')
  @Roles(RoleType.ADMIN, RoleType.MANAGER)
  update(@Param('id') id: string, @Body() updateTransactionDto: UpdateTransactionDto) {
    return this.transactionsService.update(+id, updateTransactionDto);
  }

  @Delete(':id')
  @Roles(RoleType.ADMIN)
  remove(@Param('id') id: string) {
    return this.transactionsService.remove(+id);
  }

  /**
   * Verifica el estado de una transacción en SCRUM PAY
   * @param transactionId ID de la transacción de SCRUM PAY
   * @returns Información actualizada del estado de la transacción
   */
  @Get('verify/:id')
  @Public()
  async verifyTransaction(@Param('id') id: string) {
    try {
      console.log('Verificando transacción con ID completo:', id);
      
      // IMPORTANTE: Usar el ID exactamente como viene, sin intentar recortarlo
      // o extraer partes. El ID completo es necesario para la verificación con SCRUM PAY.
      const transaction = await this.transactionsService.findByTransactionId(id);
      
      if (!transaction) {
        return {
          status: 'error',
          message: `No se encontró ninguna transacción con ID ${id}`
        };
      }
      
      // Verificar con SCRUM PAY el estado actual de la transacción
      try {
        const scrumPayResponse = await this.transactionsService.consultScrumPayTransaction(id);
        console.log('Respuesta de SCRUM PAY para verificación:', scrumPayResponse);
        
        // Si SCRUM PAY confirma que el pago fue exitoso, actualizar el estado de la transacción
        if (scrumPayResponse.error === '0' && 
           (scrumPayResponse.estatus === '0' || 
            (scrumPayResponse.datos && scrumPayResponse.datos.estado === 'pagado'))) {
          
          console.log('SCRUM PAY confirma pago exitoso, actualizando estado a AUTHORIZED');
          
          // Actualizar el estado de la transacción a AUTHORIZED
          transaction.status = TransactionStatus.AUTHORIZED;
          
          // Actualizar otros campos si están disponibles
          if (scrumPayResponse.codigoAutorizacion) {
            transaction.scrumPayAuthorizationCode = scrumPayResponse.codigoAutorizacion;
          }
          
          if (scrumPayResponse.fop) {
            transaction.paymentForm = scrumPayResponse.fop;
          }
          
          if (scrumPayResponse.numeroTarjeta) {
            transaction.maskedCardNumber = scrumPayResponse.numeroTarjeta;
          }
          
          await this.transactionsRepository.save(transaction);
          console.log('Transacción actualizada a AUTHORIZED');
        }
      } catch (scrumPayError) {
        console.error('Error al consultar SCRUM PAY:', scrumPayError);
        // Continuar con la verificación usando datos locales
      }
      
      // Verificar si el ID de transacción en nuestra base de datos debe actualizarse
      // (puede tener una versión más corta del ID)
      if (transaction.scrumPayTransactionId !== id) {
        // Actualizamos el ID almacenado con el ID completo
        transaction.scrumPayTransactionId = id;
        await this.transactionsRepository.save(transaction);
        console.log(`ID de transacción actualizado de ${transaction.scrumPayTransactionId} a ${id}`);
      }
      
      return {
        status: 'success',
        data: transaction
      };
    } catch (error) {
      console.error('Error al verificar transacción:', error);
      
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Error al verificar la transacción',
        error: error
      };
    }
  }

  /**
   * Crea tickets asociados a una transacción exitosa
   */
  @Post('create-tickets')
  @Public()
  @Roles(RoleType.ADMIN, RoleType.MANAGER, RoleType.USER)
  @HttpCode(HttpStatus.CREATED)
  async createTicketsFromTransaction(@Body() createTicketsDto: CreateTicketsTransactionDto) {
    try {
      // 1. Verificar que la transacción existe y su estado
      let transaction;
      try {
        transaction = await this.transactionsService.findByTransactionId(createTicketsDto.transactionId);
      } catch (error) {
        // Si no existe, consultar SCRUM PAY y crear la transacción
        const scrumPayResponse = await this.transactionsService.consultScrumPayTransaction(
          createTicketsDto.transactionId
        );
        
        if (scrumPayResponse.error !== '0') {
          throw new BadRequestException(
            `Error en la consulta a SCRUM PAY: ${scrumPayResponse.mensaje || 'Error desconocido'}`
          );
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
        
        // Crear la transacción en nuestra base de datos
        transaction = await this.transactionsService.create({
          scrumPayTransactionId: createTicketsDto.transactionId,
          scrumPayAuthorizationCode: scrumPayResponse.codigoAutorizacion,
          internalTransactionCode: scrumPayResponse.codigoTransaccion || `TRN-${Date.now()}`,
          amount: parseFloat(scrumPayResponse.monto_cobrado) || 0,
          currency: scrumPayResponse.moneda || 'BOB',
          status,
          paymentForm: scrumPayResponse.fop,
          maskedCardNumber: scrumPayResponse.numeroTarjeta,
          expirationDate: scrumPayResponse.expiracion,
          token: scrumPayResponse.token,
          userId: createTicketsDto.userId
        });
      }
      
      // 2. Verificar que la transacción está autorizada
      if (transaction.status !== TransactionStatus.AUTHORIZED) {
        throw new BadRequestException(
          `No se pueden crear tickets para una transacción con estado ${transaction.status}`
        );
      }
      
      // 3. Crear los tickets
      const tickets = await this.ticketService.createTicketsFromTransaction(
        createTicketsDto.transactionId,
        createTicketsDto.userId,
        createTicketsDto.items,
        createTicketsDto.notes
      );
      
      return {
        status: 'success',
        data: tickets
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      
      throw new BadRequestException(
        `Error al crear tickets para la transacción: ${error.message}`
      );
    }
  }

  @Get('payment-response')
  @Public()
  @HttpCode(HttpStatus.OK)
  async paymentResponse(@Query() query: any, @Res() res: Response) {
    try {
      console.log('Parámetros recibidos en payment-response:', query);
      
      // Obtener el ID de transacción
      const transactionId = query.id_transaccion;
      const errorCode = query.error;
      
      // Construct app deep link URL
      const appDeepLink = `turisclick://payment/complete?id=${transactionId || ''}&error=${errorCode || ''}`;
      
      if (errorCode === '1') {
        // Error en el pago
        const errorMsg = query.mensaje || 'Error desconocido en el pago';
        
        // Retornar una página HTML con mensaje de error y botón para volver a la app
        return res.send(`
          <html>
            <head>
              <title>Error en el Pago</title>
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <style>
                body {
                  font-family: Arial, sans-serif;
                  text-align: center;
                  padding: 20px;
                  background-color: #f8f8f8;
                }
                .container {
                  max-width: 600px;
                  margin: 0 auto;
                  background-color: white;
                  padding: 20px;
                  border-radius: 10px;
                  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                .error {
                  color: #e53935;
                  font-size: 20px;
                  margin-bottom: 20px;
                }
                .details {
                  color: #666;
                  margin-bottom: 30px;
                }
                .transaction-id {
                  font-size: 14px;
                  color: #777;
                  margin-top: 20px;
                }
                .btn {
                  display: inline-block;
                  padding: 12px 24px;
                  background-color: #4CAF50;
                  color: white;
                  text-decoration: none;
                  border-radius: 4px;
                  font-weight: bold;
                  margin-top: 20px;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <h1 class="error">Error en el Pago</h1>
                <p class="details">${errorMsg}</p>
                <p>Por favor, inténtelo nuevamente o contacte a soporte.</p>
                ${transactionId ? `<p class="transaction-id">ID de Transacción: ${transactionId}</p>` : ''}
                <a href="${appDeepLink}" class="btn">Volver a la Aplicación</a>
              </div>
              <script>
                // Auto redirect back to the app after 2 seconds
                setTimeout(function() {
                  window.location.href = "${appDeepLink}";
                }, 2000);
              </script>
            </body>
          </html>
        `);
      } else if (transactionId) {
        // Intenta verificar el estado de la transacción
        let transaction;
        try {
          transaction = await this.transactionsService.consultScrumPayTransaction(transactionId);
        } catch (err) {
          console.error('Error al consultar transacción en SCRUM PAY:', err);
          // Continuar a pesar del error para mostrar la página de éxito
        }
        
        // Retornar una página HTML con mensaje de éxito y botón para volver a la app
        return res.send(`
          <html>
            <head>
              <title>¡Pago Exitoso!</title>
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <style>
                body {
                  font-family: Arial, sans-serif;
                  text-align: center;
                  padding: 20px;
                  background-color: #f8f8f8;
                }
                .container {
                  max-width: 600px;
                  margin: 0 auto;
                  background-color: white;
                  padding: 20px;
                  border-radius: 10px;
                  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                .success {
                  color: #4caf50;
                  font-size: 20px;
                  margin-bottom: 20px;
                }
                .details {
                  color: #666;
                  margin-bottom: 30px;
                }
                .transaction-id {
                  font-size: 14px;
                  color: #777;
                  margin-top: 20px;
                }
                .btn {
                  display: inline-block;
                  padding: 12px 24px;
                  background-color: #4CAF50;
                  color: white;
                  text-decoration: none;
                  border-radius: 4px;
                  font-weight: bold;
                  margin-top: 20px;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <h1 class="success">¡Pago Exitoso!</h1>
                <p class="details">Su transacción ha sido procesada correctamente.</p>
                <p>Puedes ver tus tickets en la sección de Viajes.</p>
                <p class="transaction-id">ID de Transacción: ${transactionId}</p>
                <a href="${appDeepLink}" class="btn">Volver a la Aplicación</a>
              </div>
              <script>
                // Auto redirect back to the app after 2 seconds
                setTimeout(function() {
                  window.location.href = "${appDeepLink}";
                }, 2000);
              </script>
            </body>
          </html>
        `);
      } else {
        // No hay ID de transacción pero tampoco error
        return res.send(`
          <html>
            <head>
              <title>Respuesta de Pago</title>
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <style>
                body {
                  font-family: Arial, sans-serif;
                  text-align: center;
                  padding: 20px;
                  background-color: #f8f8f8;
                }
                .container {
                  max-width: 600px;
                  margin: 0 auto;
                  background-color: white;
                  padding: 20px;
                  border-radius: 10px;
                  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                .warning {
                  color: #ff9800;
                  font-size: 20px;
                  margin-bottom: 20px;
                }
                .details {
                  color: #666;
                  margin-bottom: 30px;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <h1 class="warning">Procesando Pago</h1>
                <p class="details">No se pudo determinar el resultado de la transacción.</p>
                <p>Por favor, verifique en la aplicación el estado de su compra.</p>
              </div>
            </body>
          </html>
        `);
      }
    } catch (error) {
      console.error('Error en el endpoint payment-response:', error);
      return res.status(500).send(`
        <html>
          <head>
            <title>Error en el Servidor</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
              h1 { color: #d32f2f; }
            </style>
          </head>
          <body>
            <h1>Error en el Servidor</h1>
            <p>Ocurrió un error procesando la respuesta de pago.</p>
          </body>
        </html>
      `);
    }
  }

  @Patch('update-transaction-id')
  @Public()
  async updateTransactionId(@Body() updateData: { internalCode: string, scrumPayTransactionId: string }) {
    try {
      console.log('Actualizando transacción con ID SCRUM PAY completo');
      console.log('Código interno:', updateData.internalCode);
      console.log('ID SCRUM PAY completo:', updateData.scrumPayTransactionId);
      
      // Buscar la transacción por el código interno
      const transaction = await this.transactionsRepository.findOne({
        where: { internalTransactionCode: updateData.internalCode }
      });
      
      if (!transaction) {
        return {
          status: 'error',
          message: `No se encontró transacción con código interno ${updateData.internalCode}`
        };
      }
      
      // Actualizar el ID de SCRUM PAY completo
      transaction.scrumPayTransactionId = updateData.scrumPayTransactionId;
      await this.transactionsRepository.save(transaction);
      
      return {
        status: 'success',
        message: 'ID de transacción actualizado correctamente',
        data: {
          id: transaction.id,
          scrumPayTransactionId: transaction.scrumPayTransactionId
        }
      };
    } catch (error) {
      console.error('Error al actualizar ID de transacción:', error);
      
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Error al actualizar ID de transacción',
        error: error
      };
    }
  }
}
