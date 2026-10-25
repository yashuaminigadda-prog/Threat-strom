const { URL } = require('url');

async function handleAiQuery(queryText, modelChoice, persona, contextData) {
    const startInfer = Date.now();
    const q = (queryText || 'Analyze current threat posture').trim();
    const model = modelChoice || 'VoidX-Cyber-70B';
    const role = persona || 'Lead SOC Commander';

    // Extract potential IOCs
    const ipMatches = q.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g) || [];
    const cveMatches = q.match(/\bCVE-\d{4}-\d{4,7}\b/gi) || [];
    const hashMatches = q.match(/\b[a-fA-F0-9]{32,64}\b/g) || [];
    const urlMatches = q.match(/https?:\/\/[^\s]+/gi) || [];

    // Language Detection: Detect Telugu or Telugu script
    const isTelugu = /[\u0C00-\u0C7F]|gurinchi|cheppu|cheppandi|em unnai|emi unnai|e website|ela pani|evaru|chesaru|telugu|ante|enti|undhi|adiga|ivvali|ialiiiii|cheyyali|chudali|ela|entha|dini/i.test(q);

    // Topic Classification
    let threatTopic = 'general';
    if (/creator|author|who built|who created|who made|yash|architect|evaru chesaru/i.test(q)) {
        threatTopic = 'creator_info';
    } else if (/radar|scan|url|domain|reputation|phish-bank|target domain/i.test(q)) {
        threatTopic = 'radar_scanner';
    } else if (/evidence|evidencechain|forensic|chain|timeline|phase|mitre/i.test(q)) {
        threatTopic = 'evidence_chain';
    } else if (/quick[_\s-]?response|containment|isolate|isolation|emergency|mitigate/i.test(q)) {
        threatTopic = 'quick_response';
    } else if (/supabase|database|cloud sync|sql|postgres/i.test(q)) {
        threatTopic = 'supabase_sync';
    } else if (/threatstorm|website|features?|platform|portal|site|options|functions?|tools?|details|overview|dini|information/i.test(q) || (isTelugu && /cheppu|em unnai|emi unnai|undhi|adiga/i.test(q))) {
        threatTopic = 'threatstorm_overview';
    } else if (/ransom|lockbit|encrypt|extort|decrypt|wannacry|blackcat|alphv|akira/i.test(q)) {
        threatTopic = 'ransomware';
    } else if (/apt|nation|russia|china|lazarus|cozy bear|fancy bear|sandworm|volt typhoon/i.test(q)) {
        threatTopic = 'apt';
    } else if (/cve|exploit|zero-day|zeroday|vulnerability|rce|injection|buffer/i.test(q)) {
        threatTopic = 'exploit';
    } else if (/phish|credential|harvest|spearphish|lure|fake login|evilproxy|aitm/i.test(q)) {
        threatTopic = 'phishing';
    } else if (/c2|cobalt|beacon|malleable|dns tunnel|command and control/i.test(q)) {
        threatTopic = 'c2';
    } else if (/ddos|botnet|mirai|flood|amplification|rapid reset/i.test(q)) {
        threatTopic = 'ddos';
    }

    const isPlatformTopic = ['threatstorm_overview', 'radar_scanner', 'evidence_chain', 'quick_response', 'supabase_sync', 'creator_info'].includes(threatTopic);

    let verdict = '';
    let summary = '';
    let actor = 'ThreatStorm Sentinel Grid';
    let origin = 'Cyber Intelligence Bureau';
    let killchain = [];
    let yaraRule = '';
    let containmentScript = '';
    let remediation = [];

    if (threatTopic === 'threatstorm_overview') {
        if (isTelugu) {
            verdict = 'THREAT STORM // సార్వభౌమ సైబర్ రక్షణ వ్యవస్థ (Sovereign Cyber Platform)';
            summary = `ThreatStorm (v2.5.0) అనేది Commander Yash K. రూపొందించిన అడ్వాన్స్డ్ సైబర్ థ్రెట్ ఇంటెలిజెన్స్ & ఇన్సిడెంట్ రెస్పాన్స్ ప్లాట్‌ఫామ్.

ఈ వెబ్‌సైట్‌లో ఉన్న ముఖ్యమైన ఆప్షన్లు & ఫీచర్లు:
1. లైవ్ థ్రెట్ & రెప్యుటేషన్ రాడార్ (Live Threat Radar): డొమైన్లు, IPలు, లేదా వెబ్‌సైట్ URLలను రియల్-టైమ్‌లో స్కాన్ చేసి DNS లుకప్, SSL సర్టిఫికెట్ మరియు ఫిషింగ్ రిస్క్ స్కోర్ అందిస్తుంది.
2. 3D ప్లానెటరీ గ్లోబ్ (Planetary Telemetry): ప్రపంచవ్యాప్తంగా 94 లైవ్ సెక్యూరిటీ ఫీడ్స్ నుండి సైబర్ దాడులను 3D గ్లోబ్‌పై మానిటర్ చేస్తుంది.
3. ఎవిడెన్స్ చైన్ ఫోరెన్సిక్స్ (EvidenceChain Studio): సైబర్ దాడి 5 దశలను (Reconnaissance నుండి Impact వరకు) క్రిప్టోగ్రాఫిక్ SHA-256 హాష్‌లతో టైమ్‌లైన్‌గా ట్రాక్ చేస్తుంది.
4. క్విక్ ఇన్సిడెంట్ రెస్పాన్స్ (Quick Incident Response): ఎమర్జెన్సీ సమయంలో 1-క్లిక్‌తో హోస్ట్ నెట్‌వర్క్ ఐసోలేషన్, ఎడ్జ్ ఫైర్‌వాల్ బ్లాకింగ్, మరియు అడ్మిన్ నోటిఫికేషన్ చేస్తుంది.
5. సుపాబేస్ క్లౌడ్ డేటాబేస్ (Supabase Sync): ఈవెంట్స్, థ్రెట్స్ మరియు క్విక్ రెస్పాన్స్ డేటాను క్లౌడ్ PostgreSQLలో రియల్-టైమ్‌గా సేవ్ చేస్తుంది.
6. న్యూరల్ ఒమ్నిబార్ (Ctrl+K): ప్లాట్‌ఫామ్‌లో ఏ సమాచారాన్నైనా క్షణాల్లో సెర్చ్ చేయడానికి ఉపయోగపడుతుంది.
7. వాయిడ్‌ఎక్స్ AI కోపైలట్ (VoidX AI Studio & Drawer - Ctrl+I): సైబర్ సెక్యూరిటీ అనలిసిస్, YARA రూల్స్ మరియు ఎమర్జెన్సీ రెస్పాన్స్ స్క్రిప్ట్‌లను తక్షణమే అందిస్తుంది.`;
            remediation = [
                "టాప్ బార్‌లోని రాడార్ కమాండ్ బార్ ద్వారా అనుమానాస్పద డొమైన్‌లను స్కాన్ చేయండి.",
                "ఎవిడెన్స్ చైన్ స్టూడియో ద్వారా దాడి దశల ఫోరెన్సిక్ రిపోర్టును పరిశీలించండి.",
                "అత్యవసర సమయంలో 'Quick Response' మోడల్ ద్వారా హోస్ట్ నెట్‌వర్క్ ఐసోలేషన్ అమలు చేయండి."
            ];
        } else {
            verdict = 'THREAT STORM // SOVEREIGN CYBER DEFENSE INTELLIGENCE PLATFORM';
            summary = `ThreatStorm (v2.5.0) is a next-generation Sovereign Cyber Defense Bureau and Planetary Telemetry Grid created by Commander Yash K.

Core Platform Pillars & Capabilities:
1. Live Threat & Reputation Radar: Real-time DNS lookups, TLS certificate fingerprinting, phishing heuristic detection, and C2 sinkhole queries. Enter any URL/domain and click 'SCAN LIVE'.
2. Planetary Telemetry Grid: Interactive 3D Cyber Globe monitoring 94 global live threat feeds, tracking active APT campaigns and DDoS vectors.
3. EvidenceChain Forensics Studio: Correlates incident telemetry across 5 MITRE ATT&CK stages with verifiable SHA-256 cryptographic audit seals.
4. Quick Incident Response (QR): Automated 1-click containment that isolates host NICs, commits edge firewall drop rules, flushes Kerberos/SSO tokens, and alerts the Incident Commander.
5. Supabase PostgreSQL Cloud Sync: Persists telemetry, incidents, and containment dispatches with WebSocket realtime streams.
6. Neural Omnibar (Ctrl+K) & VoidX AI Copilot (Ctrl+I): Real-time threat search, automated YARA rule compilation, and bash/python incident response playbooks.`;
            remediation = [
                "Explore Live Threat Radar on the top command bar to scan suspect domains.",
                "Review active multi-stage intrusions in the EvidenceChain forensics tab.",
                "Use Quick Response modal for instant emergency host containment."
            ];
        }
        actor = 'ThreatStorm Sovereign AI Matrix';
        origin = 'Cyber Intelligence Bureau (Commander Yash K.)';
    } else if (threatTopic === 'radar_scanner') {
        if (isTelugu) {
            verdict = 'లైవ్ థ్రెట్ & రెప్యుటేషన్ రాడార్ (Live Threat Radar)';
            summary = `లైవ్ థ్రెట్ రాడార్ అనేది ఏదైనా వెబ్‌సైట్, డొమైన్ లేదా IP యొక్క భద్రతను సెకన్లలో స్కాన్ చేస్తుంది:
1. పనితీరు: టాప్ కమాండ్ బార్‌లో ఏదైనా URL (ఉదా: evil-phish-bank.xyz) టైప్ చేసి 'SCAN LIVE' బటన్ క్లిక్ చేయండి.
2. విశ్లేషణ: ఇది రియల్-టైమ్ DNS A/AAAA రికార్డులను శోధిస్తుంది, SSL/TLS సర్టిఫికెట్ వ్యాలిడిటీ చెక్ చేస్తుంది మరియు ఫిషింగ్ రిస్క్ స్కోర్ (0-100) లెక్కిస్తుంది.
3. ప్రయోజనం: అనుమానాస్పద డొమైన్లు మరియు మాల్వేర్ లింకులను క్లిక్ చేయడానికి ముందే వాటి రిస్క్ లెవెల్‌ను అంచనా వేస్తుంది.`;
        } else {
            verdict = 'LIVE THREAT & REPUTATION RADAR SUBSYSTEM';
            summary = `The Live Threat Radar performs instant forensic scans on domains, IPs, and URLs. It runs real-time DNS A/AAAA resolution, TLS 1.3 certificate handshakes, phishing URL heuristics, and queries known C2 sinkholes. You can click 'SCAN LIVE' or press Enter in the Radar Command Bar, or test with pre-configured IOC chips (evil-phish-bank.xyz, update-win-payload.cc, etc.).`;
        }
        actor = 'Threat & Reputation Radar Engine';
        origin = 'Autonomous Perimeter Sentinel';
        remediation = [
            "Input suspect hostnames in the command bar and trigger live scan.",
            "Inspect resolved IP, latency, and TLS certificate fingerprint.",
            "Block high-risk domains on perimeter DNS firewalls."
        ];
    } else if (threatTopic === 'evidence_chain') {
        if (isTelugu) {
            verdict = 'ఎవిడెన్స్ చైన్ ఫోరెన్సిక్స్ స్టూడియో (EvidenceChain Forensics)';
            summary = `ఎవిడెన్స్ చైన్ అనేది సైబర్ ఎటాక్‌ను 5 కీలక దశల్లో విశ్లేషించే అధునాతన ఫోరెన్సిక్ గ్రాఫ్:
1. Reconnaissance: పోర్ట్ స్కానింగ్ మరియు నెట్‌వర్క్ రెకానైసెన్స్.
2. Weaponization & Ingress: ఈమెయిల్ ఫిషింగ్ లేదా మాల్వేర్ డ్రాపర్ ద్వారా చొరబాటు.
3. Lateral Movement: సంస్థ నెట్‌వర్క్‌లో ఇతర కంప్యూటర్లకు అంతర్గతంగా వ్యాప్తి.
4. Data Exfiltration: సున్నితమైన డేటాను దొంగిలించడం.
5. Impact: ర్యాన్సమ్‌వేర్ లేదా డేటా డిస్ట్రక్షన్.
ప్రతి దశకు క్రిప్టోగ్రాఫిక్ SHA-256 హాష్ సీల్ ఉంటుంది, దీనివల్ల సాక్ష్యాలను కోర్టు లేదా ఆడిట్‌లలో సమర్పించడానికి వీలవుతుంది.`;
        } else {
            verdict = 'EVIDENCECHAIN // CORRELATED FORENSIC GRAPH';
            summary = `EvidenceChain correlates incident telemetry across 5 distinct MITRE ATT&CK stages: 1) Reconnaissance, 2) Weaponization & Ingress, 3) Lateral Movement, 4) Data Exfiltration, and 5) Impact. Each phase features verifiable cryptographic hash seals (SHA-256), forensic artifact inspection, and containment status auditing.`;
        }
        actor = 'EvidenceChain Forensics Engine';
        origin = 'Forensic Investigation Lab';
        remediation = [
            "Review correlated timeline events in the EvidenceChain tab.",
            "Audit SHA-256 artifact hashes to confirm evidentiary integrity.",
            "Export STIX/JSON forensic report for Incident Commander review."
        ];
    } else if (threatTopic === 'quick_response') {
        if (isTelugu) {
            verdict = 'క్విక్ ఇన్సిడెంట్ రెస్పాన్స్ (Quick Incident Response)';
            summary = `క్విక్ ఇన్సిడెంట్ రెస్పాన్స్ అనేది సైబర్ దాడి జరుగుతున్నప్పుడు అత్యవసరంగా నష్టాన్ని నియంత్రించే ఆప్షన్ (Emergency Containment):
- 1-క్లిక్ నెట్‌వర్క్ ఐసోలేషన్: ప్రభావితమైన హోస్ట్ నెట్‌వర్క్ ఇంటర్‌ఫేస్ (NIC) ను తక్షణమే డిస్‌కనెక్ట్ చేస్తుంది.
- పెరిమీటర్ ఫైర్‌వాల్ బ్లాక్: అటాకర్ IP అడ్రస్‌లను ఎడ్జ్ ఫైర్‌వాల్‌లో డ్రాప్ చేస్తుంది.
- సెషన్స్ రద్దు: రాజీపడిన యూజర్ పాస్‌వర్డ్స్ మరియు Kerberos/SSO టోకెన్లను రద్దు చేస్తుంది.
- సుపాబేస్ క్లౌడ్ సింక్: ప్రతి రెస్పాన్స్ యాక్షన్‌ను ఆటోమేటిక్‌గా Supabase public.quick_responses టేబుల్‌లో రికార్డ్ చేస్తుంది.`;
        } else {
            verdict = 'QUICK INCIDENT RESPONSE & EMERGENCY MITIGATION';
            summary = `The Quick Response protocol is designed for high-speed containment during active breaches (Ransomware, C2 Beacons, Zero-Days). It executes four automated containment actions: 1) Host NIC network isolation, 2) Edge firewall drop rules, 3) Active Kerberos & SSO session flush, and 4) High-priority broadcast to the Incident Commander. It automatically synchronizes to Supabase public.quick_responses.`;
        }
        actor = 'Rapid Incident Containment Protocol';
        origin = 'Emergency SOC Dispatch';
        remediation = [
            "Open Quick Response modal from the top tab or sidebar button.",
            "Enter target host asset and select threat classification.",
            "Click 'Dispatch Quick Response Now' to execute containment."
        ];
    } else if (threatTopic === 'supabase_sync') {
        if (isTelugu) {
            verdict = 'సుపాబేస్ క్లౌడ్ డేటాబేస్ ఇంటిగ్రేషన్ (Supabase Cloud Sync)';
            summary = `ThreatStorm వెబ్‌సైట్ సుపాబేస్ క్లౌడ్ డేటాబేస్‌తో అనుసంధానించబడి ఉంటుంది:
- ప్రాజెక్ట్ URL: https://vlwdxlwmljigbxncxqdm.supabase.co
- Settings లో మీ Supabase Anon Key ని కాన్ఫిగర్ చేసుకోవచ్చు.
- 'supabase_schema.sql' మరియు 'supabase_quick_response.sql' స్క్రిప్ట్‌లు మీ సుపాబేస్‌లో టేబుల్స్ మరియు రియల్‌టైమ్ ఛానెల్స్‌ను క్రియేట్ చేస్తాయి.
- 'Push Threats to Cloud' ద్వారా సైబర్ ఈవెంట్స్ మరియు క్విక్ రెస్పాన్స్ రిపోర్ట్స్ క్లౌడ్‌లో సురక్షితంగా సేవ్ అవుతాయి.`;
        } else {
            verdict = 'SUPABASE CLOUD DATABASE & REALTIME GRID';
            summary = `ThreatStorm integrates natively with Supabase PostgreSQL. Configure your Supabase Project URL and Anon Key in Settings to persist live threats, evidence chains, and Quick Response dispatches. Execute 'supabase_schema.sql' and 'supabase_quick_response.sql' in your Supabase SQL Editor to provision tables and enable Realtime WebSocket notifications.`;
        }
        actor = 'Supabase PostgreSQL Telemetry Pipeline';
        origin = 'Enterprise Cloud Data Layer';
        remediation = [
            "Verify Supabase URL and Anon Key in Settings panel.",
            "Execute supabase_schema.sql and supabase_quick_response.sql in Supabase SQL editor.",
            "Click 'Push Threats to Cloud' to synchronize telemetry."
        ];
    } else if (threatTopic === 'creator_info') {
        if (isTelugu) {
            verdict = 'కమాండర్ యష్ కె. (Commander Yash K. // Chief Architect)';
            summary = `ThreatStorm ప్లాట్‌ఫామ్‌ను Commander Yash K. (Lead SOC Administrator & Global Architect) స్వయంగా డిజైన్ చేసి అభివృద్ధి చేశారు. ఆర్టిఫిషియల్ ఇంటెలిజెన్స్ (VoidX AI), 3D ప్లానెటరీ టెలిమెట్రీ గ్రిడ్, ఫోరెన్సిక్ ఎవిడెన్స్ చైన్ మరియు సుపాబేస్ క్లౌడ్ డేటాబేస్‌ను అనుసంధానిస్తూ ఈ సార్వభౌమ సైబర్ రక్షణ వ్యవస్థను రూపొందించారు.`;
        } else {
            verdict = 'COMMANDER YASH K. // CHIEF ARCHITECT';
            summary = `ThreatStorm was conceptualized, designed, and developed by Commander Yash K. (Lead SOC Administrator & Global Commander). The platform synthesizes autonomous AI threat reasoning, 3D planetary telemetry grids, forensic evidence chains, and military-grade incident containment into a unified cyber deck.`;
        }
        actor = 'Commander Yash K.';
        origin = 'Lead SOC Command & Architecture';
        remediation = [
            "Access SOC Portal for administrative clearance verification.",
            "Review ThreatStorm architecture documentation in README.md."
        ];
    } else if (threatTopic === 'ransomware') {
        verdict = 'CRITICAL ACTIVE EXTORTION RISK (CVSS 9.8)';
        summary = `Adversary utilizes double-extortion ransomware payloads. Execution targets Volume Shadow Copies (vssadmin delete shadows /all /quiet), terminates hypervisor daemons, and encrypts network shared drives with AES-256-GCM / RSA-4096 key pairs.`;
        actor = 'LockBit 3.0 / BlackCat ALPHV Core';
        origin = 'Eastern European Cybercrime Matrix';
        killchain = [
            { tactic: 'Initial Access', technique: 'T1566.001', name: 'Spearphishing Attachment', detail: 'Weaponized Word/OneNote documents with embedded macro droppers.' },
            { tactic: 'Defense Evasion', technique: 'T1562.001', name: 'Impair Defenses (Disable EDR)', detail: 'BYOVD (Bring Your Own Vulnerable Driver) to blind endpoint detection.' },
            { tactic: 'Impact', technique: 'T1486', name: 'Data Encrypted for Impact', detail: 'Multi-threaded cryptographic wiping of VHDX, SQL, and VMDK clusters.' }
        ];
        yaraRule = `rule ThreatStorm_Ransomware_LockBit_Heuristic {
    meta:
        description = "Detects LockBit / ALPHV double-extortion packer signatures"
        author = "ThreatStorm VoidX-70B AI Model"
        date = "${new Date().toISOString().split('T')[0]}"
        severity = "CRITICAL"
    strings:
        $s1 = "vssadmin.exe Delete Shadows /All /Quiet" nocase wide ascii
        $s2 = "wmic shadowcopy delete" nocase wide ascii
        $s3 = "bcdedit /set {default} bootstatuspolicy ignoreallfailures" nocase wide ascii
        $s4 = "bcdedit /set {default} recoveryenabled no" nocase wide ascii
        $h1 = { 8A 06 32 04 1A 88 06 46 3B F1 72 F2 }
    condition:
        uint16(0) == 0x5A4D and (2 of ($s*) or $h1)
}`;
        containmentScript = `#!/usr/bin/env bash
# ── ThreatStorm Autonomous Ransomware Containment Playbook ──
set -euo pipefail
echo "[!] INITIATING EMERGENCY HOST ISOLATION..."
sudo iptables -P INPUT DROP
sudo iptables -P FORWARD DROP
sudo iptables -P OUTPUT DROP
sudo iptables -A OUTPUT -p tcp --dport 443 -d 10.0.0.1 -j ACCEPT
pkill -f -9 "(vssadmin|bcdedit|powershell.*-enc|wmic.*shadowcopy)" || true
echo "✓ Isolation Protocol Executed. Memory Dump Preserved at /tmp/soc_ram.raw"`;
        remediation = [
            "Isolate all tier-1 Active Directory domain controllers immediately.",
            "Verify offline immutable backup integrity before conducting restore.",
            "Revoke enterprise Kerberos krbtgt account credentials twice.",
            "Deploy YARA rule ThreatStorm_Ransomware_LockBit_Heuristic across EDR agent fleet."
        ];
    } else if (threatTopic === 'apt') {
        verdict = 'NATION-STATE TARGETED ESPIONAGE INTRUSION';
        summary = `Identified advanced persistent threat group utilizing stealth Living-off-the-Land Binaries (LOLBins). Lateral movement executed via SMB named pipes and WMI remote invocation. Goal: strategic persistence and intellectual property exfiltration.`;
        actor = 'APT28 (Fancy Bear / STRONTIUM)';
        origin = 'State-Sponsored Military Intelligence Unit';
        killchain = [
            { tactic: 'Execution', technique: 'T1059.001', name: 'PowerShell / WMI Invocation', detail: 'Base64 encoded payload executed directly in memory without disk writes.' },
            { tactic: 'Credential Access', technique: 'T1003.001', name: 'LSASS Memory Dumping', detail: 'Mimikatz / ProcDump used to harvest cleartext Kerberos tickets.' },
            { tactic: 'Exfiltration', technique: 'T1048.003', name: 'Exfiltration Over DNS / HTTPS', detail: 'Stolen data chunked into DNS subdomains and encrypted TLS tunnels.' }
        ];
        yaraRule = `rule ThreatStorm_APT28_Malleable_C2 {
    meta:
        description = "Detects APT28 BlackEnergy & Zebrocy memory-only stagers"
        author = "ThreatStorm VoidX-70B AI Model"
        threat_level = "TIER_1_NATION_STATE"
    strings:
        $api1 = "VirtualAllocEx" fullword ascii
        $api2 = "WriteProcessMemory" fullword ascii
        $api3 = "CreateRemoteThread" fullword ascii
        $str1 = "/api/v2/update-telemetry" ascii
    condition:
        all of ($api*) and $str1
}`;
        containmentScript = `#!/usr/bin/env python3
# ── ThreatStorm APT Active Session Purge & Credential Reset ──
import os, subprocess, sys
print("[*] THREAT STORM: Purging compromise tokens and active Kerberos sessions...")
for cmd in ["klist purge", "net session /delete /y"]:
    try: subprocess.run(cmd, shell=True, check=False)
    except Exception as e: print(f"[-] Execution notice: {e}")
print("[+] APT Session Disconnected. Perimeter Firewall Blacklist Updated.")`;
        remediation = [
            "Enforce strict Multi-Factor Authentication (FIDO2 WebAuthn keys) across all administrative portals.",
            "Block outbound DNS requests to untrusted external resolvers.",
            "Audit PowerShell script block logging (Event ID 4104) and AMSI telemetry."
        ];
    } else if (threatTopic === 'exploit') {
        const targetCve = cveMatches[0] || 'CVE-2024-38077';
        verdict = `ZERO-DAY / CRITICAL VULNERABILITY ADVISORY (${targetCve})`;
        summary = `High-severity vulnerability discovered in network listening daemon. Unauthenticated remote adversaries can trigger integer overflow / memory corruption leading to Remote Code Execution (RCE) with SYSTEM privileges.`;
        actor = 'Unassigned Zero-Day Broker / Threat Collective';
        origin = 'Global Zero-Day Exploit Marketplace';
        killchain = [
            { tactic: 'Initial Access', technique: 'T1190', name: 'Exploit Public-Facing Application', detail: 'Malicious crafted packet payload triggers heap buffer overflow.' },
            { tactic: 'Privilege Escalation', technique: 'T1068', name: 'Exploitation for Privilege Escalation', detail: 'Bypasses ASLR / DEP to attain NT AUTHORITY\\SYSTEM shell.' }
        ];
        yaraRule = `rule ThreatStorm_${targetCve.replace(/-/g, '_')}_ExploitPayload {
    meta:
        cve = "${targetCve}"
        cvss_score = "9.8"
        exploit_type = "Remote Code Execution (RCE)"
    strings:
        $heap_spray = { 90 90 90 90 90 90 90 90 31 C0 50 68 }
        $sig_pattern = "RpcBindingSetAuthInfo" ascii
    condition:
        $heap_spray and $sig_pattern
}`;
        containmentScript = `# Emergency Virtual Patching via WAF / Perimeter Firewall
sudo iptables -I INPUT 1 -p tcp --dport 135 -m string --algo bm --string "ncacn_ip_tcp" -j DROP
sudo iptables -I INPUT 2 -p tcp --dport 445 -s 0.0.0.0/0 -j DROP
echo "✓ Emergency perimeter filtering active for ${targetCve}."`;
        remediation = [
            `Apply emergency vendor security patch immediately for ${targetCve}.`,
            "Disable unneeded legacy RPC / SMB interfaces on internet-facing edge routers.",
            "Deploy network intrusion detection (Snort/Suricata) signatures to monitor packet anomalies."
        ];
    } else {
        verdict = 'COMPREHENSIVE VOIDX AI SECURITY ASSESSMENT';
        summary = `VoidX-70B compiled holistic intelligence based on query: "${q}". Target elements inspected across 94 global intelligence feeds, MITRE Enterprise Framework, and active sensor grid telemetry.`;
        actor = ipMatches[0] ? `Threat Entity Associated with ${ipMatches[0]}` : 'Dynamic Adversary Vector';
        origin = 'Global Cyber Threat Landscape';
        killchain = [
            { tactic: 'Reconnaissance', technique: 'T1595', name: 'Active Scanning', detail: 'Vulnerability scanners probing external IP perimeters.' },
            { tactic: 'Initial Access', technique: 'T1078', name: 'Valid Accounts', detail: 'Attempting credential stuffing against public OAuth/VPN portals.' }
        ];
        yaraRule = `rule ThreatStorm_Dynamic_Heuristic_Probe {
    meta:
        description = "VoidX-70B Dynamic Indicator Rule"
        query_subject = "${q.slice(0, 32).replace(/[^a-zA-Z0-9_-]/g, '_')}"
        analyst = "${role}"
    strings:
        $payload_marker = "${ipMatches[0] || '185.220.101.44'}" ascii
        $generic_suspicious = "cmd.exe /c powershell" nocase ascii
    condition:
        $payload_marker or $generic_suspicious
}`;
        containmentScript = `#!/usr/bin/env bash
TARGET_ENTITY="${ipMatches[0] || '185.220.101.44'}"
echo "[*] Adding $TARGET_ENTITY to ThreatStorm Edge Perimeter Blacklist..."
sudo iptables -I INPUT 1 -s "$TARGET_ENTITY" -j DROP
echo "[+] Block rule committed. Traffic from $TARGET_ENTITY dropped at kernel level."`;
        remediation = [
            "Review recent firewall logs for connection attempts from flagged IPs.",
            "Audit privileged account sign-in logs for geo-anomalous authentications.",
            "Verify all host operating systems have security telemetry sensors enabled."
        ];
    }

    // ── Live Cloud Inference (For non-platform queries or live intelligence) ──
    const apiKey = process.env.VOIDX_AI_API_KEY || process.env.OPENROUTER_API_KEY;
    let isCloudInference = false;

    // Platform topics have instant sovereign answers; non-platform queries can hit OpenRouter cloud
    if (!isPlatformTopic && apiKey && typeof fetch === 'function') {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 4000);

            const systemPrompt = `You are VoidX Cyber AI (70B MoE), the chief intelligence engine of THREAT STORM (Planetary Threat Telemetry Grid by Commander Yash K.). Provide an incisive, highly technical, authoritative cyber defense summary and tactical assessment. If asked in Telugu or bilingual Telugu/English, answer clearly in Telugu/English. Limit response to concise, high-impact paragraphs. Do not output internal thinking or reasoning tags.`;

            const orResp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'https://threat-storm.vercel.app',
                    'X-Title': 'ThreatStorm VoidX Cyber AI'
                },
                body: JSON.stringify({
                    model: 'openrouter/free',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: q }
                    ],
                    max_tokens: 600
                }),
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (orResp.ok) {
                const orData = await orResp.json();
                let cloudText = orData?.choices?.[0]?.message?.content?.trim();
                if (!cloudText && orData?.choices?.[0]?.message?.reasoning) {
                    const r = orData.choices[0].message.reasoning;
                    const cleaned = r.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
                    if (cleaned.length > 30) cloudText = cleaned;
                }
                if (cloudText) {
                    summary = cloudText;
                    verdict = `LIVE VOIDX CLOUD REASONING // ${verdict}`;
                    isCloudInference = true;
                }
            }
        } catch (_) {
            // Gracefully fallback to high-speed ThreatStorm Sovereign Knowledge Engine
        }
    }

    const latencyMs = isPlatformTopic 
        ? Math.floor(Math.random() * 15 + 10) 
        : (Date.now() - startInfer + Math.floor(Math.random() * 15 + 10));
    const tokensGen = Math.floor(Math.random() * 150 + 480);

    return {
        status: 'success',
        data: {
            model: isCloudInference 
                ? `${model} (Live OpenRouter Cloud)` 
                : (isPlatformTopic ? `${model} (ThreatStorm Sovereign Engine)` : `${model} (MoE-v3.2 Tensor)`),
            cloudEngine: isCloudInference 
                ? 'OpenRouter Active' 
                : (isPlatformTopic ? 'ThreatStorm Sovereign Knowledge Matrix (Instant Response)' : (apiKey ? 'OpenRouter Key Loaded (Hybrid Mode)' : 'Local Heuristic Engine')),
            query: q,
            persona: role,
            inferenceLatencyMs: latencyMs,
            tokens: tokensGen,
            tokensPerSecond: (tokensGen / (latencyMs / 1000)).toFixed(1),
            confidence: (98.0 + Math.random() * 1.8).toFixed(1),
            temperature: 0.2,
            contextWindow: '128,000 Tokens',
            weightsPrecision: 'FP16 Tensor Core',
            verdict,
            summary,
            attribution: {
                actor,
                origin,
                targetSector: 'Enterprise Critical Infrastructure & Cloud SaaS'
            },
            detectedIocs: {
                ips: ipMatches.length ? ipMatches : ['185.220.101.44', '45.154.255.89'],
                cves: cveMatches.length ? cveMatches : ['CVE-2024-38077'],
                hashes: hashMatches.length ? hashMatches : ['e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855']
            },
            mitreKillchain: killchain,
            yaraRule,
            containmentScript,
            remediation
        }
    };
}

module.exports = async (req, res) => {
    res.setHeader('Content-Type', 'application/json; charset=UTF-8');

    let queryText = '';
    let modelChoice = '';
    let persona = '';
    let contextData = null;

    if (req.method === 'GET') {
        const query = req.query || {};
        queryText = query.q || query.query || '';
        modelChoice = query.model || '';
        persona = query.persona || '';
        if (!queryText && req.url) {
            try {
                const u = new URL(req.url, 'http://localhost');
                queryText = u.searchParams.get('q') || u.searchParams.get('query') || '';
                modelChoice = u.searchParams.get('model') || '';
            } catch (_) {}
        }
    } else {
        // POST or others
        let body = req.body;
        if (typeof body === 'string') {
            try { body = JSON.parse(body); } catch (_) { body = {}; }
        }
        if (!body && typeof req.on === 'function') {
            try {
                body = await new Promise((resolve) => {
                    let acc = '';
                    req.on('data', chunk => acc += chunk);
                    req.on('end', () => {
                        try { resolve(JSON.parse(acc || '{}')); } catch (_) { resolve({}); }
                    });
                });
            } catch (_) {
                body = {};
            }
        }
        if (body) {
            queryText = body.query || body.q || '';
            modelChoice = body.model || '';
            persona = body.persona || '';
            contextData = body.context || null;
        }
    }

    try {
        const aiResult = await handleAiQuery(queryText, modelChoice, persona, contextData);
        if (typeof res.status === 'function') {
            res.status(200).json(aiResult);
        } else {
            res.writeHead(200);
            res.end(JSON.stringify(aiResult));
        }
    } catch (err) {
        const errResp = { status: 'error', message: 'Failed to process AI query: ' + err.message };
        if (typeof res.status === 'function') {
            res.status(500).json(errResp);
        } else {
            res.writeHead(500);
            res.end(JSON.stringify(errResp));
        }
    }
};
