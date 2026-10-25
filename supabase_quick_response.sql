-- =====================================================================
-- THREAT STORM — QUICK INCIDENT RESPONSE & CONTAINMENT SCHEMA
-- =====================================================================
-- Run this in your Supabase Dashboard: SQL Editor -> New Query -> Run
-- =====================================================================

-- 1. Enable UUID extension if not already present
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create the Quick Response Incidents Table
CREATE TABLE IF NOT EXISTS public.quick_responses (
    id TEXT PRIMARY KEY DEFAULT ('QR-' || to_char(CURRENT_TIMESTAMP, 'YYYY') || '-' || floor(1000 + random() * 9000)::text),
    severity TEXT NOT NULL CHECK (severity IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO')),
    target_asset TEXT NOT NULL,
    threat_type TEXT NOT NULL,
    attacker_source TEXT DEFAULT '185.220.101.45 (Tor Ingress)',
    sector TEXT DEFAULT 'Financial Systems',
    
    -- Auto-Containment Actions Executed
    act_isolate_network BOOLEAN DEFAULT true,
    act_firewall_drop BOOLEAN DEFAULT true,
    act_revoke_sso BOOLEAN DEFAULT true,
    act_alert_commander BOOLEAN DEFAULT true,
    
    -- Forensic Notes & Telemetry
    notes TEXT,
    cvss_score NUMERIC(3,1) DEFAULT 9.8,
    mitre_technique TEXT DEFAULT 'T1486 / Data Encrypted for Impact',
    status TEXT NOT NULL DEFAULT 'CONTAINED' CHECK (status IN ('DISPATCHED', 'CONTAINED', 'INVESTIGATING', 'RESOLVED', 'FALSE_POSITIVE')),
    
    -- Analyst & Audit Tracking
    dispatched_by TEXT DEFAULT 'Commander Yash K. (SOC Lead)',
    dispatched_by_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Row Level Security (RLS) Setup
ALTER TABLE public.quick_responses ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies: Allow Read and Dispatch (Anon + Authenticated)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'quick_responses' AND policyname = 'Allow public and auth read on quick_responses'
    ) THEN
        CREATE POLICY "Allow public and auth read on quick_responses" 
        ON public.quick_responses FOR SELECT 
        TO anon, authenticated 
        USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'quick_responses' AND policyname = 'Allow public and auth insert on quick_responses'
    ) THEN
        CREATE POLICY "Allow public and auth insert on quick_responses" 
        ON public.quick_responses FOR INSERT 
        TO anon, authenticated 
        WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'quick_responses' AND policyname = 'Allow public and auth update on quick_responses'
    ) THEN
        CREATE POLICY "Allow public and auth update on quick_responses" 
        ON public.quick_responses FOR UPDATE 
        TO anon, authenticated 
        USING (true)
        WITH CHECK (true);
    END IF;
END
$$;

-- 5. Performance Indexes for Incident Grid & Filtering
CREATE INDEX IF NOT EXISTS idx_qr_severity ON public.quick_responses(severity);
CREATE INDEX IF NOT EXISTS idx_qr_status ON public.quick_responses(status);
CREATE INDEX IF NOT EXISTS idx_qr_created_at ON public.quick_responses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_qr_target_asset ON public.quick_responses(target_asset);
CREATE INDEX IF NOT EXISTS idx_qr_threat_type ON public.quick_responses(threat_type);

-- 6. Realtime Publication (Enables instant WebSocket broadcast to SOC HUD)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'quick_responses'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.quick_responses;
    END IF;
EXCEPTION WHEN OTHERS THEN
    -- Fallback if publication doesn't exist yet
    NULL;
END
$$;

-- 7. Verification Sample Seeds
INSERT INTO public.quick_responses (
    id, severity, target_asset, threat_type, attacker_source, sector,
    act_isolate_network, act_firewall_drop, act_revoke_sso, act_alert_commander,
    notes, cvss_score, mitre_technique, status, dispatched_by
) VALUES 
(
    'QR-2026-8812',
    'CRITICAL',
    'dc01.corp.internal (192.168.1.10)',
    'Ransomware Outbreak (LockBit 3.0)',
    '185.220.101.45 (Tor Exit Node)',
    'Financial Systems',
    true, true, true, true,
    'Immediate host NIC isolation triggered. Domain admin credentials revoked and Kerberos TGT flushed across forest.',
    9.8,
    'T1486 / Data Encrypted for Impact',
    'CONTAINED',
    'Commander Yash K. (SOC Lead)'
),
(
    'QR-2026-9430',
    'HIGH',
    'prod-api-ingress-02.cloud.internal',
    'Cobalt Strike C2 Beacon',
    '91.240.118.172 (Bulletproof VPS)',
    'Cloud Core Infrastructure',
    true, true, true, false,
    'Outbound TCP 443 beacon detected to rogue domain. Edge firewall drop injected and active worker container destroyed.',
    8.6,
    'T1071.001 / Web Protocols C2',
    'CONTAINED',
    'Automated Sentinel Bot'
)
ON CONFLICT (id) DO NOTHING;
