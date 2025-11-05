# 가계부 (AccountBook)

공유 가능한 가계부 웹 애플리케이션

## 주요 기능

- ✅ **사용자 인증**: 이메일/비밀번호 기반 회원가입 및 로그인
- ✅ **공유 가계부**: 여러 사람과 가계부 공유
- ✅ **실시간 동기화**: Socket.io를 통한 실시간 거래 내역 동기화
- ✅ **거래 관리**: 수입/지출 추가, 수정, 삭제
- ✅ **카테고리**: 커스텀 카테고리 생성 및 관리
- ✅ **월별 통계**: 월별 수입/지출 통계 및 차트
- ✅ **이메일 초대**: 이메일을 통한 가계부 멤버 초대

## 기술 스택

### Backend
- Node.js + Express + TypeScript
- PostgreSQL
- Socket.io (실시간 통신)
- JWT (인증)
- Nodemailer (이메일)

### Frontend
- React + TypeScript
- Vite
- Tailwind CSS
- Zustand (상태 관리)
- Socket.io Client
- React Router
- Axios
- React Hot Toast
- Lucide React (아이콘)
- date-fns (날짜 포맷)

## 시작하기

### 사전 요구사항

- Node.js 18+
- PostgreSQL 12+
- npm or yarn

### 데이터베이스 설정

1. PostgreSQL 데이터베이스 생성:
```bash
createdb accountbook
```

2. 스키마 적용:
```bash
psql -d accountbook -f server/src/config/database.sql
```

### 백엔드 설정

1. 환경 변수 설정:
```bash
cd server
cp .env.example .env
```

2. `.env` 파일 수정하여 데이터베이스 및 SMTP 설정

3. 의존성 설치 및 실행:
```bash
npm install
npm run dev
```

서버는 `http://localhost:5000`에서 실행됩니다.

### 프론트엔드 설정

1. 환경 변수 설정:
```bash
cd client
cp .env.example .env
```

2. 의존성 설치 및 실행:
```bash
npm install
npm run dev
```

클라이언트는 `http://localhost:5173`에서 실행됩니다.

## 프로젝트 구조

```
AccountBook/
├── server/              # Backend
│   ├── src/
│   │   ├── config/      # 데이터베이스 설정
│   │   ├── controllers/ # API 컨트롤러
│   │   ├── middleware/  # 인증 미들웨어
│   │   ├── routes/      # API 라우트
│   │   ├── socket/      # Socket.io 설정
│   │   ├── types/       # TypeScript 타입
│   │   ├── utils/       # 유틸리티
│   │   └── index.ts     # 서버 엔트리포인트
│   └── package.json
│
└── client/              # Frontend
    ├── src/
    │   ├── hooks/       # Custom hooks & stores
    │   ├── pages/       # 페이지 컴포넌트
    │   ├── services/    # API 서비스
    │   ├── types/       # TypeScript 타입
    │   ├── App.tsx
    │   └── main.tsx
    └── package.json
```

## API 엔드포인트

### 인증
- `POST /api/auth/register` - 회원가입
- `POST /api/auth/login` - 로그인
- `GET /api/auth/me` - 현재 사용자 정보

### 가계부
- `GET /api/accountbooks` - 가계부 목록
- `POST /api/accountbooks` - 가계부 생성
- `GET /api/accountbooks/:id` - 가계부 상세
- `PUT /api/accountbooks/:id` - 가계부 수정
- `DELETE /api/accountbooks/:id` - 가계부 삭제

### 거래
- `GET /api/transactions/accountbook/:id` - 거래 목록
- `POST /api/transactions` - 거래 추가
- `PUT /api/transactions/:id` - 거래 수정
- `DELETE /api/transactions/:id` - 거래 삭제
- `GET /api/transactions/accountbook/:id/stats` - 월별 통계

### 카테고리
- `GET /api/categories/accountbook/:id` - 카테고리 목록
- `POST /api/categories` - 카테고리 생성
- `PUT /api/categories/:id` - 카테고리 수정
- `DELETE /api/categories/:id` - 카테고리 삭제

### 초대
- `POST /api/invitations` - 사용자 초대
- `GET /api/invitations/:token` - 초대 정보
- `POST /api/invitations/:token/accept` - 초대 수락

## Socket.io 이벤트

### Client → Server
- `join-accountbook` - 가계부 룸 참가
- `leave-accountbook` - 가계부 룸 나가기

### Server → Client
- `transaction-created` - 새 거래 추가됨
- `transaction-updated` - 거래 수정됨
- `transaction-deleted` - 거래 삭제됨
- `category-created` - 카테고리 추가됨
- `category-updated` - 카테고리 수정됨
- `category-deleted` - 카테고리 삭제됨

## 향후 개발 계획

- [ ] 자동 입력 기능 (SMS/이메일 파싱)
- [ ] 차트 및 그래프 개선
- [ ] 예산 설정 및 알림
- [ ] 반복 거래 기능
- [ ] 영수증 이미지 업로드
- [ ] 다중 통화 지원
- [ ] 모바일 앱

## 라이선스

ISC