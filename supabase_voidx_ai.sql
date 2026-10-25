-- =====================================================================
-- THREAT STORM // VOIDX AI CYBER INTELLIGENCE SUPABASE SCHEMA
-- =====================================================================
-- HOW TO RUN:
--   1. Go to https://supabase.com/dashboard
--   2. Open your Supabase project
--   3. Click: SQL Editor → New Query
--   4. Paste this ENTIRE script and click "RUN"
-- =====================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create VoidX AI Chat & Threat Reasoning Sessions Table
CREATE TABLE IF NOT EXISTS public.voidx_ai_queries (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    query_text          TEXT NOT NULL,
    model_name          TEXT DEFAULT 'VoidX-Cyber-70B',
    persona             TEXT DEFAULT 'Lead SOC Commander',
    verdict             TEXT NOT NULL,
    summary             TEXT NOT NULL,
    actor               TEXT DEFAULT 'Dynamic Adversary Vector',
    origin              TEXT DEFAULT 'Global Cyber Threat Matrix',
    target_sector       TEXT DEFAULT 'Enterprise Critical Infrastructure',
    detected_iocs       JSONB DEFAULT '{"ips":[], "cves":[], "hashes":[]}',
    mitre_killchain     JSONB DEFAULT '[]',
    yara_rule           TEXT,
    containment_script  TEXT,
    remediation         JSONB DEFAULT '[]',
    latency_ms          INTEGER DEFAULT 24,
    tokens_generated    INTEGER DEFAULT 520,
    confidence_score    NUMERIC(5, 2) DEFAULT 98.40,
    cloud_engine        TEXT DEFAULT 'ThreatStorm Sovereign Engine',
    is_saved            BOOLEAN DEFAULT false,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.voidx_ai_queries ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
DO $$
BEGIN
    -- Allow authenticated analysts to view their own or team AI queries
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated analysts can view VoidX queries') THEN
        CREATE POLICY "Authenticated analysts can view VoidX queries"
            ON public.voidx_ai_queries FOR SELECT
            TO authenticated
            USING (true);
    END IF;

    -- Allow authenticated analysts to insert new VoidX AI queries
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated analysts can insert VoidX queries') THEN
        CREATE POLICY "Authenticated analysts can insert VoidX queries"
            ON public.voidx_ai_queries FOR INSERT
            TO authenticated
            WITH CHECK (true);
    END IF;

    -- Allow anon/guest users to read and insert (demo & SOC deck access)
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anon can read VoidX queries') THEN
        CREATE POLICY "Anon can read VoidX queries"
            ON public.voidx_ai_queries FOR SELECT
            TO anon
            USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anon can insert VoidX queries') THEN
        CREATE POLICY "Anon can insert VoidX queries"
            ON public.voidx_ai_queries FOR INSERT
            TO anon
            WITH CHECK (true);
    END IF;
END $$;

-- 5. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_voidx_created_at    ON public.voidx_ai_queries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_voidx_model         ON public.voidx_ai_queries(model_name);
CREATE INDEX IF NOT EXISTS idx_voidx_user_id       ON public.voidx_ai_queries(user_id);
CREATE INDEX IF NOT EXISTS idx_voidx_verdict       ON public.voidx_ai_queries(verdict);

-- 6. Enable Realtime Publications (Optional Live Feed)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
          AND schemaname = 'public' 
          AND tablename = 'voidx_ai_queries'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.voidx_ai_queries;
    END IF;
EXCEPTION
    WHEN undefined_object THEN
        -- If publication does not exist yet, ignore
        NULL;
END $$;

-- 7. Grant Permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT ON public.voidx_ai_queries TO anon, authenticated;

-- Verification
SELECT 'VoidX AI Table Provisioned Successfully' AS status, COUNT(*) AS total_records FROM public.voidx_ai_queries;
