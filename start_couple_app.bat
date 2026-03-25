@echo off
title CoupleConnect Local Dev Server
color 0A

echo ========================================================
echo        CoupleConnect (커플 앱) 로컬 서버 시작 스크립트
echo ========================================================
echo.
echo [1/3] 환경 변수 세팅 확인 (.env.local 파일 검토 요망)
echo [2/3] 필요한 패키지 모듈 동기화 중... (npm install)
call npm install --silent

echo [3/3] 프론트엔드 (Next.js) 서버 구동을 시작합니다!
echo 브라우저에서 자동으로 http://localhost:3000 페이지가 열립니다.
echo.
echo (서버를 종료하려면 이 창을 닫거나 Ctrl+C를 누르세요.)
echo.

:: 기본 브라우저를 통해 http://localhost:3000 탭 열기 (비동기로 실행됨)
start http://localhost:3000

:: Next.js 개발 서버 실행 (현재 터미널 콘솔을 점유하여 로그 출력)
npm run dev
