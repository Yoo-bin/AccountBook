import api from './api';
import { AccountBook, AccountBookMember, CreateAccountBookRequest } from '@/types';

export const accountbookService = {
  async getAccountBooks(): Promise<{ accountbooks: AccountBook[] }> {
    const response = await api.get('/accountbooks');
    return response.data;
  },

  async getAccountBook(id: number): Promise<{ accountbook: AccountBook; members: AccountBookMember[] }> {
    const response = await api.get(`/accountbooks/${id}`);
    return response.data;
  },

  async createAccountBook(data: CreateAccountBookRequest): Promise<{ accountbook: AccountBook }> {
    const response = await api.post('/accountbooks', data);
    return response.data;
  },

  async updateAccountBook(id: number, data: CreateAccountBookRequest): Promise<{ accountbook: AccountBook }> {
    const response = await api.put(`/accountbooks/${id}`, data);
    return response.data;
  },

  async deleteAccountBook(id: number): Promise<void> {
    await api.delete(`/accountbooks/${id}`);
  },
};
