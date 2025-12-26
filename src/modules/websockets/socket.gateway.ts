import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { Logger, UseGuards, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from 'src/common/guards';
import { WebsocketTokenService } from './token.service'; 
import { UserDocument } from 'src/database/models';

interface AuthenticatedSocket extends Socket {
  user?: UserDocument;
}

@WebSocketGateway({
  cors: {
    origin: '*', 
    credentials: true,
  },
  namespace: '/socket', 
})
@UseGuards(AuthGuard) 
export class SocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(SocketGateway.name);
  private connectedClients = new Map<string, AuthenticatedSocket[]>(); 

  constructor(private websocketTokenService: WebsocketTokenService) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
  }

  async handleConnection(@ConnectedSocket() client: AuthenticatedSocket) {
    this.logger.log(`Client connected: ${client.id}`);
    try {
      const token =
        client.handshake.auth.token ||
        client.handshake.headers.authorization?.split(' ')[1] ||
        (client.handshake.query.token as string);

      if (!token) {
        throw new UnauthorizedException('Authentication token not provided');
      }

      const user = await this.websocketTokenService.verifyAccessToken(token);
      client.user = user; 
      this.logger.log(`Client ${client.id} authenticated as user: ${user.email}`);

      if (!this.connectedClients.has(user._id.toString())) {
        this.connectedClients.set(user._id.toString(), []);
      }
      this.connectedClients.get(user._id.toString())?.push(client);

      client.emit('connectionSuccess', { message: 'Successfully connected and authenticated' });

    } catch (error) {
      this.logger.error(`Authentication failed for client ${client.id}: ${error.message}`);
      client.emit('authError', { message: error.message });
      client.disconnect(true); 
    }
  }

  handleDisconnect(@ConnectedSocket() client: AuthenticatedSocket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    if (client.user) {
      const userId = client.user._id.toString();
      const userSockets = this.connectedClients.get(userId);
      if (userSockets) {
        const updatedSockets = userSockets.filter((socket) => socket.id !== client.id);
        if (updatedSockets.length > 0) {
          this.connectedClients.set(userId, updatedSockets);
        } else {
          this.connectedClients.delete(userId);
        }
      }

    }
  }

  @SubscribeMessage('sendMessage')
  handleMessage(
    @MessageBody() data: any,
    @ConnectedSocket() client: AuthenticatedSocket,
  ): void {
    this.logger.log(`Received message from ${client.user?.email || 'unauthenticated client'}: ${JSON.stringify(data)}`);

    client.emit('messageReceived', `You said: ${JSON.stringify(data)}`);

    this.server.emit('broadcastMessage', {
      sender: client.user?.email || 'Anonymous',
      message: data,
    });
  }

  sendNotificationToUser(userId: string, event: string, payload: any) {
    const userSockets = this.connectedClients.get(userId);
    if (userSockets) {
      userSockets.forEach(socket => {
        socket.emit(event, payload);
      });
      this.logger.log(`Sent ${event} to user ${userId} on ${userSockets.length} sockets.`);
    } else {
      this.logger.warn(`User ${userId} not found among connected clients.`);
    }
  }

  sendGeneralNotification(event: string, payload: any) {
    this.server.emit(event, payload);
    this.logger.log(`Sent general ${event} notification to all clients.`);
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @MessageBody('room') room: string,
    @ConnectedSocket() client: AuthenticatedSocket,
  ): void {
    client.join(room);
    this.logger.log(`${client.user?.email || 'Anonymous'} joined room: ${room}`);
    client.emit('joinedRoom', `You have joined ${room}`);
    this.server.to(room).emit('roomMessage', `${client.user?.email || 'Anonymous'} has joined the room.`);
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(
    @MessageBody('room') room: string,
    @ConnectedSocket() client: AuthenticatedSocket,
  ): void {
    client.leave(room);
    this.logger.log(`${client.user?.email || 'Anonymous'} left room: ${room}`);
    client.emit('leftRoom', `You have left ${room}`);
    this.server.to(room).emit('roomMessage', `${client.user?.email || 'Anonymous'} has left the room.`);
  }

  @SubscribeMessage('roomMessage')
  handleRoomMessage(
    @MessageBody() data: { room: string; message: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ): void {
    this.logger.log(`Received room message from ${client.user?.email || 'Anonymous'} in ${data.room}: ${data.message}`);
    this.server.to(data.room).emit('roomMessage', {
      sender: client.user?.email || 'Anonymous',
      message: data.message,
      timestamp: new Date().toISOString(),
    });
  }
}

