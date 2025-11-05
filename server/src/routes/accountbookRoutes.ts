import express from 'express';
import {
  createAccountBook,
  getAccountBooks,
  getAccountBook,
  updateAccountBook,
  deleteAccountBook,
} from '../controllers/accountbookController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

router.use(authenticateToken);

router.post('/', createAccountBook);
router.get('/', getAccountBooks);
router.get('/:id', getAccountBook);
router.put('/:id', updateAccountBook);
router.delete('/:id', deleteAccountBook);

export default router;
