import express from 'express';
import {
  createTransaction,
  getTransactions,
  getTransaction,
  updateTransaction,
  deleteTransaction,
  getMonthlyStats,
} from '../controllers/transactionController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

router.use(authenticateToken);

router.post('/', createTransaction);
router.get('/accountbook/:accountbookId', getTransactions);
router.get('/accountbook/:accountbookId/stats', getMonthlyStats);
router.get('/:id', getTransaction);
router.put('/:id', updateTransaction);
router.delete('/:id', deleteTransaction);

export default router;
