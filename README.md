# 도토리 감상 창고

AI와 친구처럼 대화하며 음악, 미디어, 영상 감상을 기록하고 감상문처럼 정리하는 Next.js App Router 기반 웹사이트입니다.

## 기술 스택

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Vercel Marketplace Postgres 기반 사용자/노트/대화/감상문 저장
- Gemini API 기반 감상 대화와 감상문 정리

## 주요 페이지

- `/` 메인 페이지
- `/login` 로그인
- `/signup` 회원가입
- `/music` 음악 감상 노트
- `/media` 미디어 감상 노트
- `/video` 영상 감상 노트
- `/notes/[noteId]` AI 대화
- `/summary?noteId=...` 감상문 정리
- `/taste` 내 종합 취향

## Gemini API 키 설정

실제 API 키는 Google AI Studio에서 직접 발급해 사용합니다.

1. 로컬 개발에서는 `.env.local` 파일에 아래처럼 넣습니다.

```bash
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-2.5-flash
POSTGRES_URL=your-vercel-postgres-url
```

2. Vercel 배포에서는 Project Settings > Environment Variables에 `GEMINI_API_KEY`를 추가합니다.
3. 모델을 바꾸고 싶으면 선택 사항으로 `GEMINI_MODEL`을 추가합니다. 없으면 `gemini-2.5-flash`를 사용합니다.

## Vercel Postgres 설정

Vercel Dashboard에서 Project > Storage 또는 Marketplace로 이동해 Postgres 데이터베이스를 연결합니다. 연결이 끝나면 Vercel이 `POSTGRES_URL` 같은 데이터베이스 환경변수를 프로젝트에 주입합니다.

이 앱은 첫 API 요청 시 필요한 테이블을 자동으로 생성합니다.

- `acorn_users`
- `acorn_notes`
- `acorn_chat_messages`
- `acorn_summaries`

회원가입/로그인과 감상 기록은 이제 브라우저 localStorage가 아니라 Vercel Postgres에 저장됩니다. 다른 컴퓨터에서도 같은 아이디로 로그인하면 같은 기록을 불러올 수 있습니다.

`.env.local`은 Git에 커밋되지 않도록 `.gitignore`에 포함되어 있습니다. 공유 저장소에는 실제 API 키를 올리지 마세요.

## 로컬 실행

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3000`을 열어 확인합니다.

## 빌드 확인

```bash
npm run build
npm run start
```

## Vercel 배포

Vercel에서 GitHub 저장소를 연결하면 기본 설정으로 배포할 수 있습니다.

- Framework Preset: Next.js
- Build Command: `npm run build`
- Output Directory: Next.js 기본값 사용
- Install Command: `npm install`

현재 로그인 상태만 브라우저에 저장하고, 사용자 데이터와 감상 기록은 Vercel Postgres에 저장합니다.
