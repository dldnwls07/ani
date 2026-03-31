# 우리사이 AI 하네스 프롬프트 가이드

## 1. Planner 에이전트 (Contract)
- **목표**: 사용자의 모호한 요청을 정형화된 계약(JSON)으로 변환.
- **필수 항목**: 위치 반경, 예산 범위, 선호 카테고리, 금지 사항.

## 2. Generator 에이전트 (Proposer)
- **목표**: 계약을 충실히 따르는 장소 후보군 제안.
- **규칙**: 반드시 실제 주소와 검색 가능한 정확한 상호명을 포함함.

## 3. Validator 에이전트 (Evaluator)
- **목표**: 제안된 장소의 실시간 데이터 검증 및 계약 이행 평가.
- **검증 항목**:
    - 영업 상태 (Open/Closed)
    - 폐업 여부 (Recent Reviews check)
    - 이동 동선 (Google Distance Matrix 시뮬레이션)
