import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { verifyToken } from '../utils/jwt';

export const setupSocket = (httpServer: HTTPServer) => {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true,
    },
  });

  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication error'));
    }

    try {
      const decoded = verifyToken(token);
      socket.data.user = decoded;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.data.user.userId}`);

    // Join accountbook room
    socket.on('join-accountbook', (accountbookId: number) => {
      socket.join(`accountbook-${accountbookId}`);
      console.log(`User ${socket.data.user.userId} joined accountbook ${accountbookId}`);
    });

    // Leave accountbook room
    socket.on('leave-accountbook', (accountbookId: number) => {
      socket.leave(`accountbook-${accountbookId}`);
      console.log(`User ${socket.data.user.userId} left accountbook ${accountbookId}`);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.data.user.userId}`);
    });
  });

  return io;
};

// Event types for real-time updates
export const emitTransactionCreated = (
  io: SocketIOServer,
  accountbookId: number,
  transaction: any
) => {
  io.to(`accountbook-${accountbookId}`).emit('transaction-created', transaction);
};

export const emitTransactionUpdated = (
  io: SocketIOServer,
  accountbookId: number,
  transaction: any
) => {
  io.to(`accountbook-${accountbookId}`).emit('transaction-updated', transaction);
};

export const emitTransactionDeleted = (
  io: SocketIOServer,
  accountbookId: number,
  transactionId: number
) => {
  io.to(`accountbook-${accountbookId}`).emit('transaction-deleted', { id: transactionId });
};

export const emitCategoryCreated = (
  io: SocketIOServer,
  accountbookId: number,
  category: any
) => {
  io.to(`accountbook-${accountbookId}`).emit('category-created', category);
};

export const emitCategoryUpdated = (
  io: SocketIOServer,
  accountbookId: number,
  category: any
) => {
  io.to(`accountbook-${accountbookId}`).emit('category-updated', category);
};

export const emitCategoryDeleted = (
  io: SocketIOServer,
  accountbookId: number,
  categoryId: number
) => {
  io.to(`accountbook-${accountbookId}`).emit('category-deleted', { id: categoryId });
};
