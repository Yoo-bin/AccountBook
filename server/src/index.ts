import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { setupSocket } from './socket';

// Import routes
import authRoutes from './routes/authRoutes';
import accountbookRoutes from './routes/accountbookRoutes';
import transactionRoutes from './routes/transactionRoutes';
import categoryRoutes from './routes/categoryRoutes';
import invitationRoutes from './routes/invitationRoutes';

// Load environment variables
dotenv.config();

const app = express();
const httpServer = http.createServer(app);

// Setup Socket.io
export const io = setupSocket(httpServer);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'AccountBook API is running' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/accountbooks', accountbookRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/invitations', invitationRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
