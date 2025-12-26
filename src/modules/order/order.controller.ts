import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  Query,
  UseGuards,
  ForbiddenException,
  Req,
  RawBodyRequest,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { ParseMongoIdPipe } from 'src/common/pipes';
import { QueryOrderDto } from './dto/query-order.dto';
import { Roles, User } from 'src/common/decorators';
import { UserDocument, UserRole } from 'src/database/models';
import { RolesGuard } from 'src/common/guards';
import { PaymentMethod, OrderStatus } from 'src/common/enums';
import { Public } from 'src/common/decorators/public.decorator';

@Controller('orders')
@UseGuards(RolesGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @Roles(UserRole.USER)
  @UsePipes(new ValidationPipe({ transform: true }))
  async createOrder(@Body() createOrderDto: CreateOrderDto, @User('_id') userId: string) {
    const order = await this.orderService.createOrder(createOrderDto, userId);

    if (order.paymentMethod === PaymentMethod.CARD) {
      const { sessionUrl } = await this.orderService.processCardPayment(order._id.toString(), userId);
      return {
        statusCode: HttpStatus.CREATED,
        message: 'Order created, redirecting for payment',
        data: { order, paymentUrl: sessionUrl },
      };
    }

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Order placed successfully (Cash on Delivery)',
      data: order,
    };
  }

  @Post('webhook')
  @Public() 
  async handleStripeWebhook(@Req() req: RawBodyRequest<Request>) {
    const signature = req.headers['stripe-signature'];
    const payload = req.rawBody;
    await this.orderService.handleStripeWebhook(payload, signature as string);
    return { received: true };
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.USER)
  @UsePipes(new ValidationPipe({ transform: true }))
  async findAllOrders(@Query() queryDto: QueryOrderDto, @User('_id') userId: string, @User('role') userRole: UserRole) {
    const isAdmin = userRole === UserRole.ADMIN;
    const { data, currentPage, totalPages, totalItems } = await this.orderService.findAllOrders(queryDto, userId, isAdmin);
    return {
      statusCode: HttpStatus.OK,
      message: 'Orders retrieved successfully',
      data,
      meta: { currentPage, totalPages, totalItems },
    };
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.USER)
  async findOrderById(@Param('id', ParseMongoIdPipe) id: string, @User('_id') userId: string, @User('role') userRole: UserRole) {
    const isAdmin = userRole === UserRole.ADMIN;
    const order = await this.orderService.findOrderById(id, userId, isAdmin);
    return {
      statusCode: HttpStatus.OK,
      message: 'Order retrieved successfully',
      data: order,
    };
  }

  @Patch('cancel/:id')
  @Roles(UserRole.ADMIN, UserRole.USER)
  @UsePipes(new ValidationPipe({ transform: true }))
  async cancelOrder(
    @Param('id', ParseMongoIdPipe) id: string,
    @User('_id') userId: string,
    @User('role') userRole: UserRole,
    @Body('cancelReason') cancelReason?: string,
  ) {
    const isAdmin = userRole === UserRole.ADMIN;
    const order = await this.orderService.cancelOrder(id, userId, isAdmin, cancelReason);
    return {
      statusCode: HttpStatus.OK,
      message: 'Order cancelled successfully',
      data: order,
    };
  }

  @Patch('status/:id')
  @Roles(UserRole.ADMIN)
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateOrderStatus(
    @Param('id', ParseMongoIdPipe) id: string,
    @Body('status') newStatus: OrderStatus,
    @User('_id') userId: string,
  ) {
    const order = await this.orderService.updateOrderStatus(id, newStatus, userId);
    return {
      statusCode: HttpStatus.OK,
      message: `Order status updated to ${newStatus} successfully`,
      data: order,
    };
  }

  @Patch('soft-delete/:id')
  @Roles(UserRole.ADMIN)
  async softDeleteOrder(@Param('id', ParseMongoIdPipe) id: string, @User('_id') userId: string) {
    const result = await this.orderService.softDeleteOrder(id, userId);
    return {
      statusCode: HttpStatus.OK,
      message: result.message,
    };
  }

  @Patch('restore/:id')
  @Roles(UserRole.ADMIN)
  async restoreOrder(@Param('id', ParseMongoIdPipe) id: string) {
    const result = await this.orderService.restoreOrder(id);
    return {
      statusCode: HttpStatus.OK,
      message: result.message,
    };
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async deleteOrder(@Param('id', ParseMongoIdPipe) id: string) {
    const result = await this.orderService.deleteOrder(id);
    return {
      statusCode: HttpStatus.OK,
      message: result.message,
    };
  }
}

