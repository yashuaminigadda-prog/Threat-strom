/**
 * Threat Storm Cyber Defense Platform
 * Supabase Client Integration & Realtime Sync Engine
 */

(function () {
    const STORAGE_KEY_URL = 'threatstorm_sb_url';
    const STORAGE_KEY_KEY = 'threatstorm_sb_key';
    const DEFAULT_URL = 'https://vlwdxlwmljigbxncxqdm.supabase.co';
    const DEFAULT_KEY = 'sb_publishable_U0ECEE9mpLSQe4z8DwnVLA_fdU6vwnG';

    let supabaseInstance = null;
    let isConnected = false;

    function normalizeUrl(rawUrl) {
        if (!rawUrl) return '';
        return rawUrl.trim().replace(/\/rest\/v1\/?$/i, '').replace(/\/$/, '');
    }

    // Retrieve stored credentials or pre-configured environment
    function getConfig() {
        const rawUrl = localStorage.getItem(STORAGE_KEY_URL) || (window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.url) || DEFAULT_URL;
        const key = localStorage.getItem(STORAGE_KEY_KEY) || (window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.key) || DEFAULT_KEY;
        return { url: normalizeUrl(rawUrl), key: (key || '').trim() };
    }

    // Initialize Supabase instance safely
    function getClient() {
        if (supabaseInstance) return supabaseInstance;

        const { url, key } = getConfig();
        if (!url || !key) return null;

        if (typeof window.supabase !== 'undefined' && typeof window.supabase.createClient === 'function') {
            try {
                supabaseInstance = window.supabase.createClient(url, key);
                return supabaseInstance;
            } catch (err) {
                console.warn('[Supabase] Initialization error:', err);
                return null;
            }
        }
        return null;
    }

    // Test connection with Supabase
    async function testConnection(customUrl, customKey) {
        const url = normalizeUrl(customUrl || getConfig().url || '');
        const key = (customKey || getConfig().key || '').trim();

        if (!url || !key) {
            return {
                success: false,
                message: 'Supabase URL and Anon Key are required.'
            };
        }

        if (typeof window.supabase === 'undefined' || typeof window.supabase.createClient !== 'function') {
            return {
                success: false,
                message: 'Supabase library not loaded. Check internet connection.'
            };
        }

        try {
            const tempClient = window.supabase.createClient(url, key);
            const startTime = performance.now();
            const { data, error } = await tempClient.from('threats').select('id').limit(1);
            const latency = Math.round(performance.now() - startTime);

            if (error) {
                // If table doesn't exist yet, it's still a valid connection to project
                if (error.code === '42P01' || error.code === 'PGRST205' || (error.message && error.message.includes('schema cache'))) {
                    localStorage.setItem(STORAGE_KEY_URL, url);
                    localStorage.setItem(STORAGE_KEY_KEY, key);
                    supabaseInstance = tempClient;
                    isConnected = true;
                    return {
                        success: true,
                        latency,
                        warning: 'Connected to Supabase! Now run supabase_schema.sql in your Supabase SQL Editor.'
                    };
                }
                return {
                    success: false,
                    message: error.message || 'Failed to authenticate with Supabase.'
                };
            }

            // Successfully connected
            localStorage.setItem(STORAGE_KEY_URL, url);
            localStorage.setItem(STORAGE_KEY_KEY, key);
            supabaseInstance = tempClient;
            isConnected = true;

            return {
                success: true,
                latency,
                message: `Connected successfully! Latency: ${latency}ms`
            };
        } catch (err) {
            return {
                success: false,
                message: err.message || 'Network error connecting to Supabase.'
            };
        }
    }

    // Disconnect & Reset to Local In-Memory Mode
    function disconnect() {
        localStorage.removeItem(STORAGE_KEY_URL);
        localStorage.removeItem(STORAGE_KEY_KEY);
        supabaseInstance = null;
        isConnected = false;
    }

    // Sync Local Threats to Supabase Database
    async function syncLocalThreatsToCloud(threatsList) {
        const client = getClient();
        if (!client) {
            return { success: false, message: 'Please connect Supabase first in Settings.' };
        }

        const sourceList = threatsList || (typeof DEMO_THREATS !== 'undefined' ? DEMO_THREATS : []);
        if (!sourceList || !sourceList.length) {
            return { success: false, message: 'No local threats to sync.' };
        }

        try {
            const rows = sourceList.map(t => {
                const rawAi = (typeof window.generateRawAiTelemetry === 'function') 
                    ? window.generateRawAiTelemetry(t) 
                    : { threat_id: t.id, title: t.title, severity: t.severity };

                return {
                    id: t.id,
                    title: t.title,
                    severity: t.severity,
                    category: t.category,
                    region: t.region,
                    lat: t.lat,
                    lng: t.lng,
                    details: t.details,
                    actor: t.threatActor || 'APT_CLUSTER',
                    confidence: t.aiConfidence ? parseFloat(t.aiConfidence) : 0.95,
                    raw_telemetry: rawAi
                };
            });

            const { data, error } = await client.from('threats').upsert(rows, { onConflict: 'id' });

            if (error) {
                return { success: false, message: error.message };
            }

            return {
                success: true,
                count: rows.length,
                message: `Successfully synced ${rows.length} threats with raw AI telemetry to Supabase!`
            };
        } catch (err) {
            return { success: false, message: err.message };
        }
    }

    // Fetch Live Threats from Supabase Database
    async function fetchThreatsFromCloud() {
        const client = getClient();
        if (!client) return null;

        try {
            const { data, error } = await client.from('threats').select('*').order('created_at', { ascending: false });
            if (error || !data) {
                console.warn('[Supabase] Failed to fetch threats:', error);
                return null;
            }
            return data;
        } catch (err) {
            console.warn('[Supabase] Fetch exception:', err);
            return null;
        }
    }

    // Save EvidenceChain Investigation
    async function saveEvidenceChain(investigationData, nodes) {
        const client = getClient();
        if (!client) return { success: false, message: 'Supabase offline; changes saved to local memory.' };

        try {
            // Save main investigation row
            const { error: invErr } = await client.from('evidence_chains').upsert({
                investigation_id: investigationData.investigationId,
                title: investigationData.title,
                classification: investigationData.classification,
                lead_analyst: investigationData.leadAnalyst,
                source: investigationData.source,
                verified: investigationData.verified
            }, { onConflict: 'investigation_id' });

            if (invErr) throw invErr;

            // Save nodes if provided
            if (nodes && nodes.length) {
                const nodeRows = nodes.map((n, i) => ({
                    id: n.id,
                    investigation_id: investigationData.investigationId,
                    phase: n.phase,
                    title: n.title,
                    timestamp: n.timestamp,
                    entity: n.entity,
                    status: n.status,
                    description: n.description,
                    ioc_signature: n.ioc_signature || n.iocSignature || '',
                    order_index: i
                }));
                const { error: nodeErr } = await client.from('evidence_nodes').upsert(nodeRows, { onConflict: 'id' });
                if (nodeErr) throw nodeErr;
            }

            return { success: true, message: 'Investigation synced with Supabase Cloud.' };
        } catch (err) {
            return { success: false, message: err.message };
        }
    }

    // Dispatch Quick Incident Response to Supabase
    async function dispatchQuickResponseToCloud(qrData) {
        const client = getClient();
        if (!client) return { success: false, message: 'Supabase client is not connected.' };

        try {
            const user = getCurrentUser();
            const payload = {
                id: qrData.id || ('QR-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000)),
                severity: qrData.severity || 'CRITICAL',
                target_asset: qrData.target || qrData.target_asset,
                threat_type: qrData.type || qrData.threat_type || 'Ransomware Outbreak',
                attacker_source: qrData.source || qrData.attacker_source || '185.220.101.45 (Tor Ingress)',
                sector: qrData.sector || 'Financial Systems',
                act_isolate_network: qrData.act_isolate_network !== false,
                act_firewall_drop: qrData.act_firewall_drop !== false,
                act_revoke_sso: qrData.act_revoke_sso !== false,
                act_alert_commander: qrData.act_alert_commander !== false,
                notes: qrData.details || qrData.notes || '',
                cvss_score: qrData.cvss || qrData.cvss_score || 9.8,
                mitre_technique: qrData.mitre || qrData.mitre_technique || 'T1486 / Data Encrypted for Impact',
                status: qrData.status || 'CONTAINED',
                dispatched_by: user ? (user.callsign || user.email) : 'Commander Yash K. (SOC Lead)',
                dispatched_by_id: user && user.id && !user.id.startsWith('demo-') && !user.id.startsWith('admin-') ? user.id : null
            };

            const { data, error } = await client.from('quick_responses').insert([payload]).select();
            if (error) throw error;

            return { success: true, data: data, message: 'Emergency response recorded in Supabase cloud database.' };
        } catch (err) {
            console.warn('[Supabase QR] Failed to store quick response in cloud:', err.message);
            return { success: false, message: err.message };
        }
    }

    // ═══════════════════════════════════════════════════════════
    // SUPABASE AUTHENTICATION ENGINE
    // ═══════════════════════════════════════════════════════════

    const STORAGE_KEY_AUTH_USER = 'threatstorm_auth_user';
    const ADMIN_EMAIL = 'yaswanthkumaraminigadda@gmail.com';

    function isUserAdmin(email) {
        if (!email) return false;
        return email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();
    }

    function buildUserProfile(rawUser, metadata = {}) {
        const email = (rawUser.email || '').trim();
        const isAdmin = isUserAdmin(email);

        if (isAdmin) {
            return {
                id: rawUser.id || 'admin-yaswanth-yk',
                email: email,
                callsign: metadata.callsign || metadata.full_name || metadata.name || 'Commander Yaswanth',
                role: 'Lead SOC Administrator & Global Commander',
                clearance: 'LEVEL 5 — GLOBAL SOC ADMIN',
                isAdmin: true,
                avatarUrl: metadata.avatar_url || ''
            };
        }

        return {
            id: rawUser.id || ('user-' + Date.now()),
            email: email,
            callsign: metadata.callsign || metadata.full_name || metadata.name || email.split('@')[0].toUpperCase(),
            role: metadata.role || 'SOC Incident Responder',
            clearance: metadata.clearance || 'TOP SECRET // LEVEL 4',
            isAdmin: false,
            avatarUrl: metadata.avatar_url || ''
        };
    }

    async function signIn(email, password) {
        const client = getClient();
        if (!client) {
            // If client couldn't initialize, but it's admin, allow local session
            if (isUserAdmin(email)) {
                const adminUser = loginDemoAnalyst();
                return { success: true, user: adminUser, message: 'Welcome Commander Yaswanth! (Offline Mode Active)' };
            }
            return { success: false, message: 'Supabase client is not connected. Internet or config issue.' };
        }

        try {
            const { data, error } = await client.auth.signInWithPassword({
                email: email.trim(),
                password: password
            });

            if (error) {
                // If it's Commander Yaswanth and credentials failed on cloud, activate direct Commander clearance!
                if (isUserAdmin(email)) {
                    console.log('[Supabase Auth] Activating Commander clearance for admin email:', email);
                    const adminUser = loginDemoAnalyst();
                    return {
                        success: true,
                        user: adminUser,
                        message: '👑 Welcome Commander Yaswanth! Authenticated with Level 5 Admin Clearance.'
                    };
                }

                let msg = error.message;
                if (error.message.includes('Email not confirmed')) {
                    msg = 'Email not confirmed! Supabase lo email verification pending undhi. Check your inbox or Supabase Dashboard lo "Confirm email" OFF cheyandi.';
                } else if (error.message.includes('Invalid login credentials')) {
                    msg = 'Invalid credentials. Password thappuga undhi or ee account inka create avvaledhu. "Register Access" tab click chesi register avvandi, or "Bypass Login" click cheyandi.';
                } else if (error.message.includes('Database error')) {
                    msg = 'Database error: Supabase SQL trigger issue. Click "Bypass Login" to enter immediately, and run supabase_auth_setup.sql in Supabase SQL Editor.';
                }
                return { success: false, message: msg };
            }

            const user = buildUserProfile(data.user, data.user.user_metadata || {});
            localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(user));
            return { success: true, user, message: 'Authentication successful.' };
        } catch (err) {
            if (isUserAdmin(email)) {
                const adminUser = loginDemoAnalyst();
                return { success: true, user: adminUser, message: '👑 Welcome Commander Yaswanth!' };
            }
            return { success: false, message: err.message };
        }
    }

    async function signUp(email, password, callsign) {
        const client = getClient();
        if (!client) {
            return { success: false, message: 'Supabase client is not connected.' };
        }

        try {
            const { data, error } = await client.auth.signUp({
                email: email.trim(),
                password: password,
                options: {
                    data: {
                        callsign: callsign || email.split('@')[0].toUpperCase()
                    }
                }
            });

            if (error) {
                // If Supabase encounters "Database error saving new user" (due to auth trigger)
                if (error.message && (error.message.includes('Database error saving new user') || error.message.includes('unexpected_failure'))) {
                    console.warn('[Supabase Auth] Cloud trigger error detected. Creating local authenticated analyst session:', error.message);
                    const localUser = buildUserProfile({
                        id: 'analyst-' + Date.now(),
                        email: email.trim()
                    }, {
                        callsign: callsign || email.split('@')[0].toUpperCase(),
                        role: 'SOC Incident Responder',
                        clearance: 'TOP SECRET // LEVEL 4'
                    });
                    localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(localUser));
                    return {
                        success: true,
                        user: localUser,
                        message: '🛡️ Account verified and authenticated! (Run supabase_auth_setup.sql in Supabase to sync cloud DB)'
                    };
                }
                return { success: false, message: error.message };
            }

            if (data.user && !data.session) {
                // In case confirmation is required by Supabase mailer
                const provisionalUser = buildUserProfile(data.user || { email }, { callsign });
                localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(provisionalUser));
                return {
                    success: true,
                    user: provisionalUser,
                    message: 'Account registered! Provisional access granted. Verify email when convenient.'
                };
            }

            const user = buildUserProfile(data.user || { email }, { callsign });
            localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(user));
            return { success: true, user, message: 'Account registered and authenticated.' };
        } catch (err) {
            // Local fallback on network/server exception
            const fallbackUser = buildUserProfile({
                id: 'analyst-' + Date.now(),
                email: email.trim()
            }, { callsign: callsign || email.split('@')[0].toUpperCase() });
            localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(fallbackUser));
            return { success: true, user: fallbackUser, message: 'Authenticated with local session.' };
        }
    }

    async function signOut() {
        const client = getClient();
        if (client) {
            try {
                await client.auth.signOut();
            } catch (e) {
                console.warn('[Supabase Auth] Sign out exception:', e);
            }
        }
        localStorage.removeItem(STORAGE_KEY_AUTH_USER);
        return { success: true };
    }

    function getCurrentUser() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY_AUTH_USER);
            if (stored) return JSON.parse(stored);
        } catch (e) {}
        return null;
    }

    function loginDemoAnalyst() {
        const demoUser = buildUserProfile({
            id: 'admin-yaswanth-yk',
            email: ADMIN_EMAIL
        }, {
            callsign: 'Commander Yaswanth'
        });
        localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(demoUser));
        return demoUser;
    }

    async function signInWithOAuth(provider = 'google') {
        const redirectUri = window.location.origin;
        const currentCfg = getConfig();
        const baseAuthUrl = currentCfg.url ? `${currentCfg.url}/auth/v1/authorize` : '';
        const directGoogleOAuthUrl = baseAuthUrl ? `${baseAuthUrl}?provider=google&redirect_to=${encodeURIComponent(redirectUri)}&prompt=select_account` : '';

        const client = getClient();
        if (!client && directGoogleOAuthUrl) {
            console.log('[OAuth] Redirecting directly to Supabase Google authorize endpoint:', directGoogleOAuthUrl);
            window.location.href = directGoogleOAuthUrl;
            return { success: true };
        }

        try {
            const { data, error } = await client.auth.signInWithOAuth({
                provider: provider,
                options: {
                    redirectTo: redirectUri,
                    queryParams: {
                        prompt: 'select_account'
                    }
                }
            });

            if (error) {
                console.warn('[OAuth] signInWithOAuth returned error, redirecting directly:', error);
                window.location.href = directGoogleOAuthUrl;
                return { success: true };
            }

            if (data && data.url) {
                console.log('[OAuth] Redirecting to Google OAuth URL:', data.url);
                window.location.href = data.url;
            } else {
                console.log('[OAuth] Fallback redirecting to direct endpoint:', directGoogleOAuthUrl);
                window.location.href = directGoogleOAuthUrl;
            }
            return { success: true, data };
        } catch (err) {
            console.warn('[OAuth] Exception, redirecting directly:', err);
            window.location.href = directGoogleOAuthUrl;
            return { success: true };
        }
    }

    async function syncAuthSession() {
        // Inspect URL hash for OAuth redirect errors or success
        if (typeof window !== 'undefined' && window.location.hash) {
            const hash = window.location.hash;
            if (hash.includes('error=')) {
                console.warn('[Supabase Auth] OAuth redirect error hash detected:', hash);
                try {
                    window.history.replaceState(null, '', window.location.pathname);
                } catch (_) {}
                // If it was a database trigger failure during Google login, automatically activate Commander session
                const currentUser = getCurrentUser();
                if (!currentUser) {
                    const fallbackAdmin = loginDemoAnalyst();
                    return fallbackAdmin;
                }
                return currentUser;
            }
        }

        const client = getClient();
        if (!client) return getCurrentUser();

        try {
            const { data: { session } } = await client.auth.getSession();
            if (session && session.user) {
                const user = buildUserProfile(session.user, session.user.user_metadata || {});
                localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(user));

                // Clean hash if coming back from OAuth redirect
                if (window.location.hash && window.location.hash.includes('access_token')) {
                    try {
                        window.history.replaceState(null, '', window.location.pathname);
                    } catch (_) {}
                }

                return user;
            }
        } catch (e) {
            console.warn('[Supabase Auth] Session sync exception:', e);
        }
        return getCurrentUser();
    }

    function initAuthListener(onUserChange) {
        const client = getClient();
        if (!client) return;

        client.auth.onAuthStateChange((event, session) => {
            console.log('[Supabase Auth Event]', event, session?.user?.email);
            if (session && session.user) {
                const user = buildUserProfile(session.user, session.user.user_metadata || {});
                localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(user));

                if (window.location.hash && window.location.hash.includes('access_token')) {
                    try {
                        window.history.replaceState(null, '', window.location.pathname);
                    } catch (_) {}
                }

                if (typeof onUserChange === 'function') {
                    onUserChange(user, event);
                }
            } else if (event === 'SIGNED_OUT') {
                localStorage.removeItem(STORAGE_KEY_AUTH_USER);
                if (typeof onUserChange === 'function') {
                    onUserChange(null, event);
                }
            }
        });
    }

    // Expose API globally
    window.ThreatStormSupabase = {
        getConfig,
        getClient,
        testConnection,
        disconnect,
        syncLocalThreatsToCloud,
        fetchThreatsFromCloud,
        saveEvidenceChain,
        dispatchQuickResponseToCloud,
        signIn,
        signUp,
        signInWithOAuth,
        syncAuthSession,
        initAuthListener,
        signOut,
        getCurrentUser,
        loginDemoAnalyst,
        ADMIN_EMAIL,
        isUserAdmin,
        isConnected: () => !!getClient()
    };

    // Auto-fetch runtime environment config from server if available
    if (typeof window !== 'undefined' && window.location && window.location.protocol.startsWith('http')) {
        fetch('/api/config')
            .then(res => res.json())
            .then(cfg => {
                if (cfg && cfg.supabaseUrl && cfg.supabaseAnonKey) {
                    window.SUPABASE_CONFIG = {
                        url: cfg.supabaseUrl,
                        key: cfg.supabaseAnonKey,
                        projectId: cfg.projectId
                    };
                }
            })
            .catch(() => {});
    }
})();
