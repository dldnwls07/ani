-- CoupleConnect Supabase Database Schema & RLS Policies
-- 버전: 1.1 (멱등성 보장 - 여러 번 실행해도 안전)
-- 실행 방법: Supabase Dashboard > SQL Editor에서 전체 복사 후 Run

-- ============================================================
-- 0. 기존 정책(Policy) 및 함수 초기화 (안전한 재실행을 위해)
-- ============================================================
DROP POLICY IF EXISTS "Users can create own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile or partner" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

DROP POLICY IF EXISTS "Couples viewable by members" ON public.couples;
DROP POLICY IF EXISTS "Couples insertable by authenticated users" ON public.couples;
DROP POLICY IF EXISTS "Couples updatable by members" ON public.couples;

DROP POLICY IF EXISTS "Schedules viewable by couple" ON public.schedules;
DROP POLICY IF EXISTS "Schedules insertable by couple" ON public.schedules;
DROP POLICY IF EXISTS "Schedules updatable by couple" ON public.schedules;
DROP POLICY IF EXISTS "Schedules deletable by creator" ON public.schedules;

DROP POLICY IF EXISTS "Wishlists viewable by couple" ON public.wishlists;
DROP POLICY IF EXISTS "Wishlists insertable by couple" ON public.wishlists;
DROP POLICY IF EXISTS "Wishlists updatable by couple" ON public.wishlists;

DROP POLICY IF EXISTS "Anniversaries viewable by couple" ON public.anniversaries;
DROP POLICY IF EXISTS "Anniversaries insertable by couple" ON public.anniversaries;

-- ============================================================
-- 1. Extensions (필수 확장 모듈)
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 2. Tables (IF NOT EXISTS로 안전하게 생성)
-- ============================================================

-- 2.1 커플 정보 테이블 (Couples)
-- 가장 핵심이 되는 테이블로, 두 사용자를 하나로 묶어줍니다.
CREATE TABLE IF NOT EXISTS public.couples (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invite_code VARCHAR(6) UNIQUE NOT NULL, -- 초대 코드 (A7X9Q2 형식)
  partner_1_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  partner_2_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  connection_date DATE, -- 우리 사귄 날
  theme_preference JSONB DEFAULT '{"primary": "#FF6B6B", "secondary": "#4ECDC4"}'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- UNIQUE 제약 조건 (이미 있으면 무시)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_partner_1'
  ) THEN
    ALTER TABLE public.couples ADD CONSTRAINT unique_partner_1 UNIQUE (partner_1_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_partner_2'
  ) THEN
    ALTER TABLE public.couples ADD CONSTRAINT unique_partner_2 UNIQUE (partner_2_id);
  END IF;
END $$;

-- 2.2 사용자 프로필 테이블 (Profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname VARCHAR(50) NOT NULL,
  avatar_url TEXT,
  couple_id UUID REFERENCES public.couples(id) ON DELETE SET NULL,
  status_message VARCHAR(50) DEFAULT '온라인', -- '공부 중', '회의 중' 등
  status_updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.3 일정 테이블 (Schedules)
CREATE TABLE IF NOT EXISTS public.schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES public.profiles(id),
  title VARCHAR(100) NOT NULL,
  description TEXT,
  start_datetime TIMESTAMPTZ NOT NULL,
  end_datetime TIMESTAMPTZ NOT NULL,
  is_all_day BOOLEAN DEFAULT FALSE,
  location_data JSONB, -- { "name": "스타벅스", "lat": 12.3, "lng": 45.6 }
  schedule_type VARCHAR(20) DEFAULT 'SHARED', -- 'SHARED', 'PRIVATE', 'HIDDEN'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.4 데이트 위시리스트 (Wishlists)
CREATE TABLE IF NOT EXISTS public.wishlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES public.profiles(id),
  pioneer_url TEXT, -- 인스타그램/블로그 링크
  title VARCHAR(100) NOT NULL,
  category VARCHAR(30), -- 'CAFE', 'RESTAURANT', 'EXHIBITION'
  agreed_by VARCHAR(50)[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.5 기념일 (Anniversaries)
CREATE TABLE IF NOT EXISTS public.anniversaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  title VARCHAR(100) NOT NULL,
  anniversary_date DATE NOT NULL,
  is_recurring BOOLEAN DEFAULT TRUE, -- 매년 반복
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. RLS (Row Level Security) 활성화
-- ============================================================
ALTER TABLE public.couples ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anniversaries ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 3.1 Profiles 정책
-- ============================================================
CREATE POLICY "Users can create own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own profile or partner"
  ON public.profiles FOR SELECT
  USING (
    auth.uid() = id OR
    couple_id = (SELECT couple_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- ============================================================
-- 3.2 Couples 정책
-- ============================================================
CREATE POLICY "Couples viewable by members"
  ON public.couples FOR SELECT
  USING (auth.uid() = partner_1_id OR auth.uid() = partner_2_id);

CREATE POLICY "Couples insertable by authenticated users"
  ON public.couples FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Couples updatable by members"
  ON public.couples FOR UPDATE
  USING (auth.uid() = partner_1_id OR auth.uid() = partner_2_id);

-- ============================================================
-- 3.3 Schedules 정책
-- ============================================================
CREATE POLICY "Schedules viewable by couple"
  ON public.schedules FOR SELECT
  USING (couple_id = (SELECT couple_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Schedules insertable by couple"
  ON public.schedules FOR INSERT
  WITH CHECK (couple_id = (SELECT couple_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Schedules updatable by couple"
  ON public.schedules FOR UPDATE
  USING (couple_id = (SELECT couple_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Schedules deletable by creator"
  ON public.schedules FOR DELETE
  USING (creator_id = auth.uid());

-- ============================================================
-- 3.4 Wishlists & Anniversaries 정책
-- ============================================================
CREATE POLICY "Wishlists viewable by couple"
  ON public.wishlists FOR SELECT
  USING (couple_id = (SELECT couple_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Wishlists insertable by couple"
  ON public.wishlists FOR INSERT
  WITH CHECK (couple_id = (SELECT couple_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Wishlists updatable by couple"
  ON public.wishlists FOR UPDATE
  USING (couple_id = (SELECT couple_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Anniversaries viewable by couple"
  ON public.anniversaries FOR SELECT
  USING (couple_id = (SELECT couple_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Anniversaries insertable by couple"
  ON public.anniversaries FOR INSERT
  WITH CHECK (couple_id = (SELECT couple_id FROM public.profiles WHERE id = auth.uid()));

-- ============================================================
-- 4. RPC 함수: 초대 코드로 커플 매칭
-- ============================================================
CREATE OR REPLACE FUNCTION match_couple(p_invite_code VARCHAR)
RETURNS UUID AS $$
DECLARE
  v_couple_id UUID;
  v_partner_1 UUID;
  v_my_id UUID;
BEGIN
  v_my_id := auth.uid();

  -- 1. 코드에 해당하는 커플 레코드 탐색 및 검증
  SELECT id, partner_1_id INTO v_couple_id, v_partner_1
  FROM public.couples
  WHERE invite_code = p_invite_code AND partner_2_id IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION '유효하지 않거나 만료된 초대 코드입니다.';
  END IF;

  IF v_partner_1 = v_my_id THEN
    RAISE EXCEPTION '본인이 생성한 코드로는 매칭할 수 없습니다.';
  END IF;

  -- 2. partner_2_id 설정
  UPDATE public.couples
  SET partner_2_id = v_my_id
  WHERE id = v_couple_id;

  -- 3. 두 사용자의 profile에 couple_id 매핑
  UPDATE public.profiles
  SET couple_id = v_couple_id
  WHERE id IN (v_partner_1, v_my_id);

  RETURN v_couple_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2.6 채팅 메시지 테이블 (Messages)
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.profiles(id), -- NULL이면 AI가 보낸 메시지
  content TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'TEXT', -- 'TEXT', 'IMAGE', 'SYSTEM'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. RLS (Row Level Security) 활성화
-- ============================================================
ALTER TABLE public.couples ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anniversaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- ... (기타 정책 생략) ...

-- 3.5 Messages 정책
CREATE POLICY "Messages viewable by couple" ON public.messages FOR SELECT USING (couple_id = (SELECT couple_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Messages insertable by couple" ON public.messages FOR INSERT WITH CHECK (couple_id = (SELECT couple_id FROM public.profiles WHERE id = auth.uid()));

-- ============================================================
-- 4. RPC 함수: 초대 코드로 커플 매칭
-- ============================================================
-- ... (기본 match_couple 함수 유지) ...

-- ============================================================
-- 5. Realtime 통신 활성화
-- ============================================================
DO $$
BEGIN
  -- messages 테이블 realtime 등록
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE messages;
  END IF;
  
  -- 기존 테이블 유지...
END $$;

-- ============================================================
-- ✅ 스키마 적용 완료! Table Editor에서 테이블 5개를 확인하세요.
-- couples / profiles / schedules / wishlists / anniversaries
-- ============================================================
