export interface User {
  id: number;
  email: string;
  name: string;
  created_at: string;
}

export interface AccountBook {
  id: number;
  name: string;
  description?: string;
  created_by: number;
  created_by_name: string;
  created_at: string;
  role?: 'owner' | 'member';
  member_count?: number;
}

export interface AccountBookMember {
  id: number;
  email: string;
  name: string;
  role: 'owner' | 'member';
  joined_at: string;
}

export interface Category {
  id: number;
  accountbook_id: number;
  name: string;
  type: 'income' | 'expense';
  color: string;
  created_at: string;
}

export interface Transaction {
  id: number;
  accountbook_id: number;
  type: 'income' | 'expense';
  amount: number;
  category_id: number | null;
  category_name?: string;
  category_color?: string;
  date: string;
  memo?: string;
  created_by: number | null;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

export interface MonthlyStats {
  month: string;
  total_income: number;
  total_expense: number;
  balance: number;
  categories: CategoryStat[];
}

export interface CategoryStat {
  id: number;
  name: string;
  type: 'income' | 'expense';
  color: string;
  total: number;
}

export interface Invitation {
  id: number;
  accountbook_id: number;
  accountbook_name: string;
  email: string;
  token: string;
  status: 'pending' | 'accepted' | 'expired';
  invited_by: number | null;
  invited_by_name: string;
  expires_at: string;
  created_at: string;
}

// API Request/Response types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface CreateAccountBookRequest {
  name: string;
  description?: string;
}

export interface CreateTransactionRequest {
  accountbook_id: number;
  type: 'income' | 'expense';
  amount: number;
  category_id?: number;
  date: string;
  memo?: string;
}

export interface UpdateTransactionRequest {
  type?: 'income' | 'expense';
  amount?: number;
  category_id?: number;
  date?: string;
  memo?: string;
}

export interface CreateCategoryRequest {
  accountbook_id: number;
  name: string;
  type: 'income' | 'expense';
  color?: string;
}

export interface InviteUserRequest {
  accountbook_id: number;
  email: string;
}
