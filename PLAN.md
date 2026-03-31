# [공식] 프로젝트 기획 및 아키텍처 (PLAN.md)

## 1. Business Strategy & Goals
- **시장 목표**: 2030 직장인 및 학생 커플을 타겟으로 한 '지능형 라이프 매니지먼트 플랫폼' 런칭, 1년 내 시장 점유율 10% 확보.
- **수익 모델**: 프리미엄 멤버십(구독) 및 데이트 코스 제휴 수수료.
- **AI 전략**: **Google Gemini 2.5 Flash**를 도입하여 비용 효율적이고 초고성능인 AI 비서 환경 구축 완료.

## 2. 프로젝트 비전
**"단순한 일정 공유를 넘어, 커플의 일상을 조율하고 유대감을 강화하는 든든한 파트너"**
본 프로젝트는 커플 전용 라이프 매니지먼트 플랫폼으로, AI 기반의 스마트한 일정 제안과 정서적 교감을 위한 인터페이스를 제공함과 동시에 실제 출시를 목표로 하는 상용화 수준의 퀄리티를 지향합니다.

## 3. 타겟 오디언스 & 핵심 가치
- **Primary**: 일정 조율에 리소스를 많이 쓰는 2030 직장인 커플 (효율성 극대화)
- **Secondary**: 기념일과 기록을 중요시하는 1020 커플 (감성적 유대감)
- **핵심 가치**: 실시간 동기화, 지능적 데이트 제안, 프라이버시가 보장되는 둘만의 공간.

## 4. 기술 스택 (Tech Stack)
- **Frontend**: Next.js 14 (App Router), Tailwind CSS, Framer Motion, Lucide-react.
- **Backend/DB**: Supabase (PostgreSQL, Realtime Sync, Storage).
- **AI Model**: **Google Gemini 2.5 Flash** (Chat, Planning, Analysis).
- **AI Harness**: **[Planner-Generator-Evaluator]** 다중 에이전트 루프 기반 고신뢰성 응답 엔진. (Harness Engineering 적용 - 생성자와 검증자가 목표 성능에 도달할 때까지 무한 루프를 도는 구조)
- **HDD (Harness-Driven Development)**: 모든 에이전트 사이의 결과물은 검증단계를 거치며, 통과하지 못할 경우 피드백과 함께 이전 단계로 루프백(Infinite Loop) 함.
- **Security**: Row Level Security (RLS)를 통한 철저한 커플간 데이터 격리.
- **Automation**: Zapier/MCP 기반의 외부 알림 및 데이터 연동.

## 5. 핵심 기능 명세 (Phase 3.5 고도화 과제)
1. **Intelligent Chat (ani-Assistant)**: 일정을 이해하고 위시리스트를 분석하는 AI 채팅 비서.
2. **Dynamic Calendar**: 일정을 실시간(Supabase)으로 저장, 관리하는 인터랙티브 달력.
3. **Harness AI Planner**: 하네스 설계(Sprint Contract)가 적용된 고정밀 데이트 코스 제안 엔진.
4. **Shared Wishlist**: 커플이 가고 싶은 곳을 공유하고 카테고리별로 관리하는 위시 저장소.

## 6. 고도화 단계별 개발 로드맵 (Refined)
1. **MVP (완료)**: 커플 매칭, 기본 UI, AI 채팅 기초 연동, 실시간 상태 동기화.
2. **Domain Growth (진행 중)**: 캘린더 CRUD 실전화, 위시리스트 구축, 데이트 플래너 AI 엔진 탑재.
3. **Beta (완료 ✅)**: 하네스 엔지니어링 기반 AI 엔진 고도화, 기념일 자동 계산, 알림 자동화(Zapier).
4. **Launch (완료 ✅)**: 프로덕션 빌드 무결성 검증, 최종 배포 준비.

**🎯 프로젝트 최종 완료 (PROJECT FINISHED) - 2026-04-01**

---
*본 문서는 프로젝트의 나침반 역할을 하며, 기획 고도화에 따라 지속적으로 업데이트됩니다.*
