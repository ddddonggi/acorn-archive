# 취향 책장

음악, 미디어, 영상을 감상한 뒤 AI와 대화하고, 나만의 감상문으로 차곡차곡 쌓아가는 공간.

🔗 **배포 주소:** https://acorn-archive.vercel.app

---

## 소개

**취향 책장**은 콘텐츠를 소비한 뒤의 감정과 생각을 기록하는 AI 감상 아카이브입니다.

AI가 감상문을 대신 써주는 것이 아니라, 사용자가 자신의 말로 이야기할 수 있도록 질문을 던지고 대화를 이끌어갑니다. 대화가 쌓이면 AI가 그 내용을 바탕으로 담백한 감상문으로 정리해줍니다.

---

## 주요 기능

### 카테고리별 감상 기록
- **음악** — 가사, 멜로디, 분위기, 듣고 싶은 상황
- **미디어** — 책, 웹툰, 만화의 캐릭터, 서사, 세계관
- **영상** — 영화, 영상의 장면, 인물, 연출, 메시지

### AI 대화
- 각 카테고리 특성에 맞는 질문으로 감상을 끌어냄
- 사용자가 말하지 않은 내용은 추가하지 않는 원칙
- Google Gemini API 기반

### 감상문 자동 정리
- 대화 내용을 바탕으로 짧고 담백한 감상문 생성
- 제목, 한 줄 감상, 본문, 감정 태그, 키워드, 취향 힌트 포함
- 음악의 경우 아티스트 정보 포함

### 내 취향 분석
- 누적된 감상문을 바탕으로 사용자 취향 프로필 생성
- 카테고리별 취향 요약 및 전체 취향 분석
- 취향 기반 콘텐츠 추천 (최근 감상 기반 / 전체 취향 기반)

### 커버 이미지
- 노트마다 커버 이미지 업로드 가능 (Vercel Blob 저장)

---

## 기술 스택

| 분류 | 기술 |
|------|------|
| 프레임워크 | Next.js 16 (App Router) |
| 언어 | TypeScript |
| 스타일링 | Tailwind CSS |
| 데이터베이스 | Neon PostgreSQL (`@neondatabase/serverless`) |
| AI | Google Gemini API |
| 파일 저장 | Vercel Blob |
| 인증 | 자체 구현 (bcryptjs + localStorage) |
| 배포 | Vercel |

---

## 프로젝트 구조

```
acorn-archive/
├── app/
│   ├── api/
│   │   ├── auth/             # 로그인·회원가입
│   │   ├── notes/            # 노트 CRUD
│   │   ├── messages/         # 대화 메시지
│   │   ├── chat/             # Gemini 채팅
│   │   ├── summaries/        # 감상문 저장·조회
│   │   ├── summary/          # Gemini 감상문 생성
│   │   ├── images/           # 커버 이미지 업로드
│   │   ├── recommendations/  # 콘텐츠 추천
│   │   ├── category-tastes/  # 카테고리별 취향
│   │   └── overall-summary/  # 전체 취향 요약
│   └── (pages)/              # 홈, 카테고리, 노트, 취향 페이지
├── components/               # UI 컴포넌트
├── lib/
│   ├── ai/                   # Gemini API, 프롬프트
│   └── server/               # DB 연결, 추천 로직
└── public/
    └── home-bg.png           # 홈 배경 일러스트
```

---
