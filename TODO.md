# 프로젝트 진행 상황 (TODO.md)

## 📌 상시 핵심 태스크
- [ ] PLAN.md 및 TODO.md 최신화 유지
- [ ] Supabase RLS 보안 정책 준수

## 🚀 단계별 진행 현황

### Phase 1: 비즈니스 및 기술 기획 ✅ 완료
- [x] 실시간 시장 조사 및 경쟁사(Between, Sumone 등) 분석 완료 (@biz-strategist)
- [x] 타당성 평가(Feasibility) 및 비즈니스/수익 모델 설계 완료 (@biz-strategist)
- [x] 신사업 수준 초상세 마스터 플랜 작성 완료 (@biz-strategist)
- [x] 초상세 기술 스펙, 시스템 워크플로우 및 통합 아키텍처 명세 완료 (@prompt-planner)
- [x] 상세 User Flow, 와이어프레임 및 UI/UX 디자인 시스템 가이드 도출 (@ux-designer)

### Phase 2: 인프라 및 핵심 기능 구축 ✅ 완료
- [x] Supabase 프로젝트 생성 및 테이블 정의 (@be-dev)
- [x] API 키 관리 환경 변수(.env.local) - **Gemini 2.5 Flash 연동 완료** (@be-dev)
- [x] Row Level Security (RLS) 정책 적용 완료 (@be-dev)
- [x] 초대 코드 기반 커플 매칭 RPC(match_couple) 적용 완료 (@be-dev)
- [x] **AI 채팅 비서(ani-Assistant) Gemini 연동 완료** (@agent-skill-dev)
- [x] **[고도화] Superpowers(obra/superpowers) 에이전트 방법론 통합 완료** (@prompt-planner)

### Phase 3: 도메인 고도화 및 데이터 연동 (진행 중 🔥)
- [x] DDD 아키텍처 전환 완료 (domain / application / infrastructure / app) (@fe-dev)
- [x] 대시보드 무한 로딩 해결 및 상태 관리 최적화 (@fe-dev)
- [x] **[핵심 1] 캘린더 일정 CRUD (등록/수정/삭제) 실전화** (@be-dev)
- [x] **[핵심 2] 위시리스트 저장고 기능 구현** (@fe-dev)
- [x] **[핵심 3] 데이트 플래너 AI 엔진 Gemini 2.5 Flash 탑재** (@agent-skill-dev)
- [x] **[고도화] 하네스 엔지니어링(Planner-Generator-Evaluator) 엔진 설계 및 구현** (@prompt-planner)
- [x] 캘린더 화면 AI 데이트 코스 추천 UI 연동 완료 (@fe-dev)
- [x] **[검증] 하네스 기반 고정밀 데이트 코스 테스트셋 및 루틴 구축** (@qa-tester)
- [x] 로그인/회원가입 및 온보딩 Flow 구현 (@fe-dev)
- [x] **[보완] Mock 데이터 환경 에러 가드 및 렌더링 이슈 해결** (@be-dev)

### Phase 3.5: 코드 고도화 및 UX 완성 (완료 ✅) - **2026-04-01**
- [x] **[버그] D-Day 하드코딩 → connectionDate 기반 실제 계산** (@fe-dev)
- [x] **[버그] 캘린더 AI 추천이 존재하지 않는 Edge Function 호출 → /api/date-planner 연동** (@fe-dev)
- [x] **[UX] 공통 BottomNav 컴포넌트 분리 및 전 페이지 적용** (@fe-dev)
- [x] **[기능] DatePlannerModal '전체 일정 등록' 실제 구현** (@fe-dev)
- [x] **[경고] Next.js metadata viewport 분리 (Viewport export)** (@fe-dev)
- [x] **[아키텍처] Supabase 클라이언트 중복 제거 (lib → infrastructure 통합)** (@be-dev)
- [x] **[품질] TypeScript 타입 안전성 강화 (any 제거)** (@fe-dev)
- [x] **[기능] 기념일 자동 계산 (100일, 200일, 1주년 등)** (@fe-dev)
- [x] **[기능] 콕 찌르기 인터랙션 구현** (@fe-dev)
- [x] **[기능] 실시간 동기화(Realtime) 활성화** (@be-dev)
- [x] **[AI] 하네스 엔지니어링 Multi-Agent 루프 실제 구현** (@agent-skill-dev)
- [x] **[버그] 캘린더 페이지 하단 AI 버튼 BottomNav 겹침/가림 현상 해결 및 QA 검증 완료** (@fe-dev, @qa-tester)
- [x] **[UI/UX] 캘린더 상세 섹션 스크롤링 하단 여백 스페이서(h-40) 추가** (@fe-dev)

### Phase 4: 외부 연동 및 자동화 (완료 ✅)
- [x] 외부 알림 연동 및 자동화(Zapier/MCP) 설계 및 Edge Function 작성 (@automation-eng)

### Phase 5: 최종 테스트 및 배포 (완료 ✅)
- [x] 최종 QA 엣지 케이스 시나리오 도출 및 매트릭스 작성 완료 (@qa-tester)
- [x] Vercel 배포 설정 및 최종 결과 보고서 작성 완료 (@ops-manager)

### Phase 10: Git 저장소 동기화 ✅ 완료
- [x] GitHub 저장소(origin/main) 동기화 및 푸시 (@git-manager)

---
*마지막 업데이트: 2026-04-01 10:35 KST | @qa-tester*
**STATUS: PROJECT FINISHED (모든 개발 플로우 완료 🚀)**

