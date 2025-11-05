import api from './api';
import { Category, CreateCategoryRequest } from '@/types';

export const categoryService = {
  async getCategories(accountbookId: number): Promise<{ categories: Category[] }> {
    const response = await api.get(`/categories/accountbook/${accountbookId}`);
    return response.data;
  },

  async createCategory(data: CreateCategoryRequest): Promise<{ category: Category }> {
    const response = await api.post('/categories', data);
    return response.data;
  },

  async updateCategory(
    id: number,
    data: { name?: string; color?: string }
  ): Promise<{ category: Category }> {
    const response = await api.put(`/categories/${id}`, data);
    return response.data;
  },

  async deleteCategory(id: number): Promise<void> {
    await api.delete(`/categories/${id}`);
  },
};
