import api from './api';
import { Transaction, CreateTransactionRequest, UpdateTransactionRequest, MonthlyStats } from '@/types';

export const transactionService = {
  async getTransactions(
    accountbookId: number,
    params?: {
      startDate?: string;
      endDate?: string;
      type?: 'income' | 'expense';
      categoryId?: number;
    }
  ): Promise<{ transactions: Transaction[] }> {
    const response = await api.get(`/transactions/accountbook/${accountbookId}`, { params });
    return response.data;
  },

  async getTransaction(id: number): Promise<{ transaction: Transaction }> {
    const response = await api.get(`/transactions/${id}`);
    return response.data;
  },

  async createTransaction(data: CreateTransactionRequest): Promise<{ transaction: Transaction }> {
    const response = await api.post('/transactions', data);
    return response.data;
  },

  async updateTransaction(id: number, data: UpdateTransactionRequest): Promise<{ transaction: Transaction }> {
    const response = await api.put(`/transactions/${id}`, data);
    return response.data;
  },

  async deleteTransaction(id: number): Promise<void> {
    await api.delete(`/transactions/${id}`);
  },

  async getMonthlyStats(accountbookId: number, year: number, month: number): Promise<MonthlyStats> {
    const response = await api.get(`/transactions/accountbook/${accountbookId}/stats`, {
      params: { year, month },
    });
    return response.data;
  },
};
