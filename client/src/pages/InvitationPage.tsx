import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Mail, CheckCircle, XCircle, Clock } from 'lucide-react';
import { invitationService } from '@/services/invitationService';
import { Invitation } from '@/types';

export default function InvitationPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    if (token) {
      loadInvitation();
    }
  }, [token]);

  const loadInvitation = async () => {
    try {
      const data = await invitationService.getInvitation(token!);
      setInvitation(data.invitation);
    } catch (error: any) {
      toast.error('초대장을 찾을 수 없습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    setAccepting(true);
    try {
      const result = await invitationService.acceptInvitation(token!);
      toast.success('초대를 수락했습니다!');
      navigate(`/accountbook/${result.accountbook.id}`);
    } catch (error: any) {
      toast.error(error.response?.data?.error || '초대 수락에 실패했습니다');
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">로딩 중...</div>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="card max-w-md p-8 text-center">
          <XCircle size={64} className="mx-auto mb-4 text-red-500" />
          <h1 className="text-2xl font-bold mb-2">초대장을 찾을 수 없습니다</h1>
          <p className="text-gray-600 mb-6">
            이 초대 링크는 유효하지 않거나 만료되었습니다.
          </p>
          <button onClick={() => navigate('/')} className="btn-primary">
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  const isExpired = invitation.status === 'expired' || new Date(invitation.expires_at) < new Date();
  const isAccepted = invitation.status === 'accepted';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
      <div className="card max-w-md p-8 m-4">
        <div className="text-center mb-6">
          {isAccepted ? (
            <CheckCircle size={64} className="mx-auto mb-4 text-green-500" />
          ) : isExpired ? (
            <Clock size={64} className="mx-auto mb-4 text-gray-400" />
          ) : (
            <Mail size={64} className="mx-auto mb-4 text-primary-600" />
          )}
        </div>

        <h1 className="text-2xl font-bold text-center mb-2">
          {isAccepted
            ? '이미 수락한 초대입니다'
            : isExpired
            ? '초대가 만료되었습니다'
            : '가계부 초대'}
        </h1>

        {!isExpired && !isAccepted && (
          <>
            <p className="text-center text-gray-600 mb-6">
              <strong>{invitation.invited_by_name}</strong>님이 "<strong>{invitation.accountbook_name}</strong>" 가계부에 초대했습니다.
            </p>

            <div className="space-y-3">
              <button
                onClick={handleAccept}
                className="btn-primary w-full"
                disabled={accepting}
              >
                {accepting ? '수락 중...' : '초대 수락하기'}
              </button>
              <button
                onClick={() => navigate('/')}
                className="btn-secondary w-full"
              >
                나중에 하기
              </button>
            </div>
          </>
        )}

        {isAccepted && (
          <button
            onClick={() => navigate(`/accountbook/${invitation.accountbook_id}`)}
            className="btn-primary w-full mt-6"
          >
            가계부로 이동
          </button>
        )}

        {isExpired && !isAccepted && (
          <>
            <p className="text-center text-gray-600 mb-6">
              이 초대는 만료되었습니다. 새로운 초대를 요청해주세요.
            </p>
            <button onClick={() => navigate('/')} className="btn-primary w-full">
              홈으로 돌아가기
            </button>
          </>
        )}
      </div>
    </div>
  );
}
