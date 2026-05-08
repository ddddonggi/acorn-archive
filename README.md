# 도토리 감상 창고

AI와 친구처럼 대화하며 음악, 미디어, 영상 감상을 기록하고 감상문처럼 정리하는 Next.js App Router 기반 웹사이트입니다.

## 기술 스택

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- localStorage 기반 사용자/노트/대화 저장
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
```

2. Vercel 배포에서는 Project Settings > Environment Variables에 `GEMINI_API_KEY`를 추가합니다.
3. 모델을 바꾸고 싶으면 선택 사항으로 `GEMINI_MODEL`을 추가합니다. 없으면 `gemini-2.5-flash`를 사용합니다.

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

현재 사용자 데이터는 브라우저 `localStorage`에 저장되므로 사용자 브라우저별로 독립적으로 유지됩니다.
