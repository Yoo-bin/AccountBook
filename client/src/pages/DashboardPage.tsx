import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, BookOpen, Users, LogOut } from 'lucide-react';
import { useAuthStore } from '@/hooks/useAuthStore';
import { accountbookService } from '@/services/accountbookService';
import { AccountBook } from '@/types';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, clearAuth } = useAuthStore();
  const [accountbooks, setAccountbooks] = useState<AccountBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAccountbookName, setNewAccountbookName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadAccountBooks();
  }, []);

  const loadAccountBooks = async () => {
    try {
      const data = await accountbookService.getAccountBooks();
      setAccountbooks(data.accountbooks);
    } catch (error: any) {
      toast.error('가계부 목록을 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccountBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccountbookName.trim()) {
      toast.error('가계부 이름을 입력해주세요');
      return;
    }

    setCreating(true);
    try {
      await accountbookService.createAccountBook({ name: newAccountbookName });
      toast.success('가계부가 생성되었습니다');
      setNewAccountbookName('');
      setShowCreateModal(false);
      loadAccountBooks();
    } catch (error: any) {
      toast.error('가계부 생성에 실패했습니다');
    } finally {
      setCreating(false);
    }
  };

  const handleLogout = () => {
    clearAuth();
    toast.success('로그아웃되었습니다');
  };

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
            <h1 className="text-2xl font-bold text-gray-900">가계부</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{user?.name}님</span>
              <button
                onClick={handleLogout}
                className="btn-secondary flex items-center gap-2"
              >
                <LogOut size={18} />
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">내 가계부</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={20} />
            새 가계부
          </button>
        </div>

        {accountbooks.length === 0 ? (
          <div className="card p-12 text-center">
            <BookOpen size={48} className="mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium mb-2">가계부가 없습니다</h3>
            <p className="text-gray-600 mb-6">첫 가계부를 만들어보세요!</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary"
            >
              가계부 만들기
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {accountbooks.map((accountbook) => (
              <div
                key={accountbook.id}
                onClick={() => navigate(`/accountbook/${accountbook.id}`)}
                className="card p-6 cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <BookOpen size={32} className="text-primary-600" />
                  {accountbook.role === 'owner' && (
                    <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs font-medium rounded">
                      소유자
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-semibold mb-2">{accountbook.name}</h3>
                {accountbook.description && (
                  <p className="text-sm text-gray-600 mb-4">{accountbook.description}</p>
                )}
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Users size={16} />
                  <span>{accountbook.member_count || 1}명</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="card w-full max-w-md p-6">
            <h3 className="text-xl font-semibold mb-4">새 가계부 만들기</h3>
            <form onSubmit={handleCreateAccountBook}>
              <div className="mb-4">
                <label htmlFor="name" className="block text-sm font-medium mb-2">
                  가계부 이름
                </label>
                <input
                  id="name"
                  type="text"
                  className="input"
                  value={newAccountbookName}
                  onChange={(e) => setNewAccountbookName(e.target.value)}
                  placeholder="예: 우리집 가계부"
                  autoFocus
                  required
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewAccountbookName('');
                  }}
                  className="btn-secondary flex-1"
                  disabled={creating}
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1"
                  disabled={creating}
                >
                  {creating ? '생성 중...' : '생성'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
