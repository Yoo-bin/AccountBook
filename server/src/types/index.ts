export interface User {
  id: number;
  email: string;
  password_hash: string;
  name: string;
  created_at: Date;
}

export interface AccountBook {
  id: number;
  name: string;
  description?: string;
  created_by: number;
  created_at: Date;
}

export interface AccountBookMember {
  id: number;
  accountbook_id: number;
  user_id: number;
  role: 'owner' | 'member';
  joined_at: Date;
}

export interface Category {
  id: number;
  accountbook_id: number;
  name: string;
  type: 'income' | 'expense';
  color: string;
  created_at: Date;
}

export interface Transaction {
  id: number;
  accountbook_id: number;
  type: 'income' | 'expense';
  amount: number;
  category_id: number | null;
  date: string; // YYYY-MM-DD format
  memo?: string;
  created_by: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface Invitation {
  id: number;
  accountbook_id: number;
  email: string;
  token: string;
  status: 'pending' | 'accepted' | 'expired';
  invited_by: number | null;
  expires_at: Date;
  created_at: Date;
}

export interface JWTPayload {
  userId: number;
  email: string;
}

export interface AuthRequest extends Request {
  user?: JWTPayload;
}

// DTO types
export interface CreateUserDTO {
  email: string;
  password: string;
  name: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface CreateAccountBookDTO {
  name: string;
  description?: string;
}

export interface CreateTransactionDTO {
  accountbook_id: number;
  type: 'income' | 'expense';
  amount: number;
  category_id?: number;
  date: string;
  memo?: string;
}

export interface UpdateTransactionDTO {
  type?: 'income' | 'expense';
  amount?: number;
  category_id?: number;
  date?: string;
  memo?: string;
}

export interface CreateCategoryDTO {
  accountbook_id: number;
  name: string;
  type: 'income' | 'expense';
  color?: string;
}

export interface InviteUserDTO {
  accountbook_id: number;
  email: string;
}

export interface MonthlyStats {
  month: string; // YYYY-MM format
  total_income: number;
  total_expense: number;
  balance: number;
  categories: {
    [key: string]: {
      name: string;
      amount: number;
      type: 'income' | 'expense';
    };
  };
}
