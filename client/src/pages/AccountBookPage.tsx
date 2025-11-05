import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Plus,
  TrendingUp,
  TrendingDown,
  Mail,
  Calendar,
  Pencil,
  Trash2,
} from 'lucide-react';
import { accountbookService } from '@/services/accountbookService';
import { transactionService } from '@/services/transactionService';
import { categoryService } from '@/services/categoryService';
import { invitationService } from '@/services/invitationService';
import { socketService } from '@/services/socket';
import {
  AccountBook,
  Transaction,
  Category,
  MonthlyStats,
  AccountBookMember,
} from '@/types';

export default function AccountBookPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [accountbook, setAccountbook] = useState<AccountBook | null>(null);
  const [members, setMembers] = useState<AccountBookMember[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stats, setStats] = useState<MonthlyStats | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  });

  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const [transactionForm, setTransactionForm] = useState({
    type: 'expense' as 'income' | 'expense',
    amount: '',
    category_id: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    memo: '',
  });

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    if (id) {
      loadData();
      socketService.joinAccountBook(parseInt(id));

      // Listen to real-time updates
      socketService.on('transaction-created', handleTransactionCreated);
      socketService.on('transaction-updated', handleTransactionUpdated);
      socketService.on('transaction-deleted', handleTransactionDeleted);
    }

    return () => {
      if (id) {
        socketService.leaveAccountBook(parseInt(id));
        socketService.off('transaction-created', handleTransactionCreated);
        socketService.off('transaction-updated', handleTransactionUpdated);
        socketService.off('transaction-deleted', handleTransactionDeleted);
      }
    };
  }, [id]);

  useEffect(() => {
    if (id) {
      loadTransactions();
      loadStats();
    }
  }, [id, selectedMonth]);

  const loadData = async () => {
    try {
      const [accountbookData, categoriesData] = await Promise.all([
        accountbookService.getAccountBook(parseInt(id!)),
        categoryService.getCategories(parseInt(id!)),
      ]);

      setAccountbook(accountbookData.accountbook);
      setMembers(accountbookData.members);
      setCategories(categoriesData.categories);
    } catch (error: any) {
      toast.error('데이터를 불러오는데 실패했습니다');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async () => {
    try {
      const startDate = `${selectedMonth.year}-${String(selectedMonth.month).padStart(2, '0')}-01`;
      const endDate = new Date(selectedMonth.year, selectedMonth.month, 0);
      const endDateStr = format(endDate, 'yyyy-MM-dd');

      const data = await transactionService.getTransactions(parseInt(id!), {
        startDate,
        endDate: endDateStr,
      });
      setTransactions(data.transactions);
    } catch (error: any) {
      toast.error('거래 내역을 불러오는데 실패했습니다');
    }
  };

  const loadStats = async () => {
    try {
      const data = await transactionService.getMonthlyStats(
        parseInt(id!),
        selectedMonth.year,
        selectedMonth.month
      );
      setStats(data);
    } catch (error: any) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleTransactionCreated = (transaction: Transaction) => {
    if (transaction.accountbook_id === parseInt(id!)) {
      setTransactions((prev) => [transaction, ...prev]);
      loadStats();
      toast.success('새 거래가 추가되었습니다');
    }
  };

  const handleTransactionUpdated = (transaction: Transaction) => {
    if (transaction.accountbook_id === parseInt(id!)) {
      setTransactions((prev) =>
        prev.map((t) => (t.id === transaction.id ? transaction : t))
      );
      loadStats();
    }
  };

  const handleTransactionDeleted = ({ id: transactionId }: { id: number }) => {
    setTransactions((prev) => prev.filter((t) => t.id !== transactionId));
    loadStats();
  };

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await transactionService.createTransaction({
        accountbook_id: parseInt(id!),
        type: transactionForm.type,
        amount: parseFloat(transactionForm.amount),
        category_id: transactionForm.category_id ? parseInt(transactionForm.category_id) : undefined,
        date: transactionForm.date,
        memo: transactionForm.memo || undefined,
      });

      setShowTransactionModal(false);
      resetTransactionForm();
      loadTransactions();
      loadStats();
      toast.success('거래가 추가되었습니다');
    } catch (error: any) {
      toast.error('거래 추가에 실패했습니다');
    }
  };

  const handleUpdateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTransaction) return;

    try {
      await transactionService.updateTransaction(editingTransaction.id, {
        type: transactionForm.type,
        amount: parseFloat(transactionForm.amount),
        category_id: transactionForm.category_id ? parseInt(transactionForm.category_id) : undefined,
        date: transactionForm.date,
        memo: transactionForm.memo || undefined,
      });

      setShowTransactionModal(false);
      setEditingTransaction(null);
      resetTransactionForm();
      loadTransactions();
      loadStats();
      toast.success('거래가 수정되었습니다');
    } catch (error: any) {
      toast.error('거래 수정에 실패했습니다');
    }
  };

  const handleDeleteTransaction = async (transactionId: number) => {
    if (!confirm('이 거래를 삭제하시겠습니까?')) return;

    try {
      await transactionService.deleteTransaction(transactionId);
      loadTransactions();
      loadStats();
      toast.success('거래가 삭제되었습니다');
    } catch (error: any) {
      toast.error('거래 삭제에 실패했습니다');
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);

    try {
      await invitationService.inviteUser({
        accountbook_id: parseInt(id!),
        email: inviteEmail,
      });
      toast.success('초대 이메일이 전송되었습니다');
      setShowInviteModal(false);
      setInviteEmail('');
    } catch (error: any) {
      toast.error(error.response?.data?.error || '초대에 실패했습니다');
    } finally {
      setInviting(false);
    }
  };

  const openEditModal = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setTransactionForm({
      type: transaction.type,
      amount: transaction.amount.toString(),
      category_id: transaction.category_id?.toString() || '',
      date: transaction.date,
      memo: transaction.memo || '',
    });
    setShowTransactionModal(true);
  };

  const resetTransactionForm = () => {
    setTransactionForm({
      type: 'expense',
      amount: '',
      category_id: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      memo: '',
    });
    setEditingTransaction(null);
  };

  const changeMonth = (delta: number) => {
    setSelectedMonth((prev) => {
      let newMonth = prev.month + delta;
      let newYear = prev.year;

      if (newMonth > 12) {
        newMonth = 1;
        newYear++;
      } else if (newMonth < 1) {
        newMonth = 12;
        newYear--;
      }

      return { year: newYear, month: newMonth };
    });
  };

  const filteredCategories = categories.filter((c) => c.type === transactionForm.type);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate('/')} className="btn-secondary">
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{accountbook?.name}</h1>
                <p className="text-sm text-gray-600">{members.length}명의 멤버</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowInviteModal(true)}
                className="btn-secondary flex items-center gap-2"
              >
                <Mail size={18} />
                초대
              </button>
              <button
                onClick={() => {
                  resetTransactionForm();
                  setShowTransactionModal(true);
                }}
                className="btn-primary flex items-center gap-2"
              >
                <Plus size={20} />
                거래 추가
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Month Selector */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => changeMonth(-1)}
              className="btn-secondary px-3 py-2"
            >
              ←
            </button>
            <div className="flex items-center gap-2">
              <Calendar size={20} className="text-gray-600" />
              <span className="text-lg font-medium">
                {selectedMonth.year}년 {selectedMonth.month}월
              </span>
            </div>
            <button
              onClick={() => changeMonth(1)}
              className="btn-secondary px-3 py-2"
            >
              →
            </button>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="card p-6">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="text-green-600" size={24} />
                <span className="text-sm text-gray-600">수입</span>
              </div>
              <p className="text-2xl font-bold text-green-600">
                +{stats.total_income.toLocaleString()}원
              </p>
            </div>
            <div className="card p-6">
              <div className="flex items-center gap-3 mb-2">
                <TrendingDown className="text-red-600" size={24} />
                <span className="text-sm text-gray-600">지출</span>
              </div>
              <p className="text-2xl font-bold text-red-600">
                -{stats.total_expense.toLocaleString()}원
              </p>
            </div>
            <div className="card p-6">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-sm text-gray-600">잔액</span>
              </div>
              <p className={`text-2xl font-bold ${stats.balance >= 0 ? 'text-primary-600' : 'text-red-600'}`}>
                {stats.balance >= 0 ? '+' : ''}{stats.balance.toLocaleString()}원
              </p>
            </div>
          </div>
        )}

        {/* Transactions */}
        <div className="card">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold">거래 내역</h2>
          </div>
          <div className="divide-y">
            {transactions.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                이번 달 거래 내역이 없습니다
              </div>
            ) : (
              transactions.map((transaction) => (
                <div key={transaction.id} className="p-4 hover:bg-gray-50 flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      {transaction.category_color && (
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: transaction.category_color }}
                        />
                      )}
                      <span className="font-medium">{transaction.category_name || '미분류'}</span>
                      <span className="text-xs text-gray-500">{transaction.date}</span>
                    </div>
                    {transaction.memo && (
                      <p className="text-sm text-gray-600">{transaction.memo}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      작성자: {transaction.created_by_name || '알 수 없음'}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className={`text-lg font-semibold ${
                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {transaction.type === 'income' ? '+' : '-'}
                      {transaction.amount.toLocaleString()}원
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditModal(transaction)}
                        className="p-2 hover:bg-gray-200 rounded"
                      >
                        <Pencil size={16} className="text-gray-600" />
                      </button>
                      <button
                        onClick={() => handleDeleteTransaction(transaction.id)}
                        className="p-2 hover:bg-gray-200 rounded"
                      >
                        <Trash2 size={16} className="text-red-600" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Transaction Modal */}
      {showTransactionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="card w-full max-w-md p-6">
            <h3 className="text-xl font-semibold mb-4">
              {editingTransaction ? '거래 수정' : '거래 추가'}
            </h3>
            <form onSubmit={editingTransaction ? handleUpdateTransaction : handleCreateTransaction}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">유형</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setTransactionForm({ ...transactionForm, type: 'income' })}
                    className={`flex-1 py-2 rounded-lg ${
                      transactionForm.type === 'income'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200'
                    }`}
                  >
                    수입
                  </button>
                  <button
                    type="button"
                    onClick={() => setTransactionForm({ ...transactionForm, type: 'expense' })}
                    className={`flex-1 py-2 rounded-lg ${
                      transactionForm.type === 'expense'
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-200'
                    }`}
                  >
                    지출
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <label htmlFor="amount" className="block text-sm font-medium mb-2">
                  금액
                </label>
                <input
                  id="amount"
                  type="number"
                  className="input"
                  value={transactionForm.amount}
                  onChange={(e) => setTransactionForm({ ...transactionForm, amount: e.target.value })}
                  placeholder="10000"
                  required
                />
              </div>

              <div className="mb-4">
                <label htmlFor="category" className="block text-sm font-medium mb-2">
                  카테고리
                </label>
                <select
                  id="category"
                  className="input"
                  value={transactionForm.category_id}
                  onChange={(e) =>
                    setTransactionForm({ ...transactionForm, category_id: e.target.value })
                  }
                >
                  <option value="">선택 안함</option>
                  {filteredCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label htmlFor="date" className="block text-sm font-medium mb-2">
                  날짜
                </label>
                <input
                  id="date"
                  type="date"
                  className="input"
                  value={transactionForm.date}
                  onChange={(e) => setTransactionForm({ ...transactionForm, date: e.target.value })}
                  required
                />
              </div>

              <div className="mb-4">
                <label htmlFor="memo" className="block text-sm font-medium mb-2">
                  메모
                </label>
                <textarea
                  id="memo"
                  className="input"
                  value={transactionForm.memo}
                  onChange={(e) => setTransactionForm({ ...transactionForm, memo: e.target.value })}
                  placeholder="메모를 입력하세요 (선택사항)"
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowTransactionModal(false);
                    resetTransactionForm();
                  }}
                  className="btn-secondary flex-1"
                >
                  취소
                </button>
                <button type="submit" className="btn-primary flex-1">
                  {editingTransaction ? '수정' : '추가'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="card w-full max-w-md p-6">
            <h3 className="text-xl font-semibold mb-4">멤버 초대</h3>
            <form onSubmit={handleInvite}>
              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  이메일
                </label>
                <input
                  id="email"
                  type="email"
                  className="input"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="friend@example.com"
                  required
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowInviteModal(false);
                    setInviteEmail('');
                  }}
                  className="btn-secondary flex-1"
                  disabled={inviting}
                >
                  취소
                </button>
                <button type="submit" className="btn-primary flex-1" disabled={inviting}>
                  {inviting ? '초대 중...' : '초대'}
                </button>
              </div>
            </form>

            <div className="mt-6 pt-6 border-t">
              <h4 className="text-sm font-medium mb-3">현재 멤버 ({members.length})</h4>
              <div className="space-y-2">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <p className="text-gray-500">{member.email}</p>
                    </div>
                    {member.role === 'owner' && (
                      <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded">
                        소유자
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
