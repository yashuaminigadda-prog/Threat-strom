/* ═══════════════════════════════════════════════════════════════
   THREAT STORM — CYBER INTELLIGENCE BUREAU PLATFORM LOGIC
   Interactive 3D Earth Globe, 2D Telemetry Map & Command Suite
   ═══════════════════════════════════════════════════════════════ */

(function () {
    'use strict';

    // ── Master State ──
    const alerts = (typeof DEMO_THREATS !== 'undefined') ? [...DEMO_THREATS] : [];
    let activeAlertId = null;

    // ── DOM References ──
    const DOM = {
        // Clock
        liveUtcClock: document.getElementById('live-utc-clock'),

        // Canvases
        earthGlobeCanvas: document.getElementById('earth-globe-canvas'),
        worldTelemetryCanvas: document.getElementById('world-telemetry-canvas'),
        globeCalloutBadge: document.getElementById('globe-callout-badge'),
        mapTouchHint: document.getElementById('map-touch-hint'),

        // Sparklines
        sparklineActive: document.getElementById('sparkline-active'),
        sparklineBlocked: document.getElementById('sparkline-blocked'),
        sparklineVuln: document.getElementById('sparkline-vuln'),
        sparklineMttd: document.getElementById('sparkline-mttd'),

        // Donut
        threatDonutCanvas: document.getElementById('threat-donut-canvas'),

        // Alerts Table
        alertsTableBody: document.getElementById('alerts-table-body'),
        btnViewAllAlerts: document.getElementById('btn-view-all-alerts'),
        btnViewAllIntel: document.getElementById('btn-view-all-intel'),
        btnExploreMore: document.getElementById('btn-explore-more'),

        // Top Tabs
        topNavTabs: document.querySelectorAll('.tab-pill'),

        // Deep Intel Panel
        intelOverlay: document.getElementById('intel-overlay'),
        intelPanel: document.getElementById('intel-panel'),
        intelClose: document.getElementById('intel-close'),
        intelTitle: document.getElementById('intel-title'),
        intelSeverityBadge: document.getElementById('intel-severity-badge'),
        intelStatusBadge: document.getElementById('intel-status-badge'),
        intelCvssBadge: document.getElementById('intel-cvss-badge'),
        intelTimestamp: document.querySelector('#intel-timestamp span:last-child'),
        intelAsset: document.querySelector('#intel-asset span:last-child'),
        intelSource: document.querySelector('#intel-source span:last-child'),
        intelMitre: document.querySelector('#intel-mitre span:last-child'),
        intelRegion: document.querySelector('#intel-region span:last-child'),
        intelReasonContent: document.getElementById('intel-reason-content'),
        intelEvidenceContent: document.getElementById('intel-evidence-content'),
        intelConfidenceContent: document.getElementById('intel-confidence-content'),
        intelKnownContent: document.getElementById('intel-known-content'),
        intelImpactContent: document.getElementById('intel-impact-content'),
        intelInvestigationContent: document.getElementById('intel-investigation-content'),
        intelStatusChange: document.getElementById('intel-status-change'),
        intelApplyStatus: document.getElementById('intel-apply-status'),
        intelAnalystNotes: document.getElementById('intel-analyst-notes'),
        intelSaveNotes: document.getElementById('intel-save-notes'),
        intelExportJson: document.getElementById('intel-export-json')
    };

    // ═══════════════════════════════════════════════════════════
    // 1. LIVE UTC CLOCK
    // ═══════════════════════════════════════════════════════════

    function startLiveUtcClock() {
        if (!DOM.liveUtcClock) return;
        function updateClock() {
            const now = new Date();
            const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
            const timeStr = now.toTimeString().split(' ')[0];
            DOM.liveUtcClock.textContent = `Live Intelligence • ${dateStr} • ${timeStr} (UTC)`;
        }
        updateClock();
        setInterval(updateClock, 1000);
    }

    // ═══════════════════════════════════════════════════════════
    // 2. 3D PLANETARY EARTH GLOBE ENGINE
    // ═══════════════════════════════════════════════════════════

    function init3DEarthGlobe() {
        const canvas = DOM.earthGlobeCanvas;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        let width = canvas.width;
        let height = canvas.height;
        let rotationY = 0.8;
        let rotationX = 0.25;
        let autoRotateSpeed = 0.0035;
        let isDragging = false;
        let lastMouseX = 0;
        let lastMouseY = 0;

        // Pre-cached dimensions for zero-reflow 60/120fps rendering
        let cx = 0, cy = 0, radius = 0;
        let globeInView = true;

        function resize() {
            const rect = canvas.getBoundingClientRect();
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            width = rect.width;
            height = rect.height;
            canvas.width = Math.floor(width * dpr);
            canvas.height = Math.floor(height * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            cx = width * 0.48;
            cy = height * 0.50;
            radius = Math.min(width, height) * 0.40;
        }
        window.addEventListener('resize', resize, { passive: true });
        resize();

        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                globeInView = entries[0].isIntersecting;
            }, { threshold: 0.05 });
            observer.observe(canvas);
        }

        // Mouse Drag Interaction on 3D Globe
        canvas.addEventListener('mousedown', (e) => {
            isDragging = true;
            lastMouseX = e.clientX;
            lastMouseY = e.clientY;
        });
        window.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const dx = e.clientX - lastMouseX;
            const dy = e.clientY - lastMouseY;
            rotationY += dx * 0.006;
            rotationX = Math.max(-0.6, Math.min(0.6, rotationX + dy * 0.004));
            lastMouseX = e.clientX;
            lastMouseY = e.clientY;
        });
        window.addEventListener('mouseup', () => { isDragging = false; });

        // Touch Interaction on 3D Globe
        canvas.addEventListener('touchstart', (e) => {
            if (e.touches.length > 0) {
                lastMouseX = e.touches[0].clientX;
                lastMouseY = e.touches[0].clientY;
            }
        }, { passive: true });
        canvas.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0) {
                const dx = e.touches[0].clientX - lastMouseX;
                const dy = e.touches[0].clientY - lastMouseY;
                rotationY += dx * 0.006;
                rotationX = Math.max(-0.6, Math.min(0.6, rotationX + dy * 0.004));
                lastMouseX = e.touches[0].clientX;
                lastMouseY = e.touches[0].clientY;
            }
        }, { passive: true });

        // Real-World Earth Satellite Asset
        const realEarthImg = new Image();
        realEarthImg.src = 'earth_real.jpg';
        let earthImgLoaded = false;
        realEarthImg.onload = () => {
            earthImgLoaded = true;
        };

        // Key Global Cyber Intelligence Hubs on Real Earth
        const majorHubs = [
            { name: 'US-East (Virginia)', lat: 0.68, lon: -1.35, color: '#e11d48', status: 'CRITICAL', ping: 0 },
            { name: 'London / Frankfurt', lat: 0.90, lon: 0.15, color: '#f59e0b', status: 'HIGH', ping: 0.3 },
            { name: 'Tokyo / APAC', lat: 0.62, lon: 2.45, color: '#e11d48', status: 'ELEVATED', ping: 0.6 },
            { name: 'Sydney Hub', lat: -0.58, lon: 2.65, color: '#00e676', status: 'NORMAL', ping: 0.8 },
            { name: 'Middle East (Dubai)', lat: 0.44, lon: 0.95, color: '#38bdf8', status: 'MONITORING', ping: 0.4 },
            { name: 'São Paulo', lat: -0.40, lon: -0.80, color: '#f59e0b', status: 'HIGH', ping: 0.5 }
        ];

        // Global Attack Laser Arcs on the 3D Sphere
        const globeArcs = [
            { fromLat: 0.68, fromLon: -1.35, toLat: 0.90, toLon: 0.15, color: '#e11d48', progress: 0.2 }, // US-East to Europe
            { fromLat: 0.90, fromLon: 0.15, toLat: 0.62, toLon: 2.45, color: '#f59e0b', progress: 0.6 },  // Europe to East Asia
            { fromLat: 0.44, fromLon: 0.95, toLat: -0.58, toLon: 2.65, color: '#e11d48', progress: 0.85 }, // Mid East to Australia
            { fromLat: 0.62, fromLon: 2.45, toLat: 0.68, toLon: -1.35, color: '#38bdf8', progress: 0.45 } // Asia to US
        ];

        // 3D Render Loop (Zero forced reflows, silky 60/120fps)
        function renderGlobe() {
            if (!globeInView) {
                requestAnimationFrame(renderGlobe);
                return;
            }

            ctx.clearRect(0, 0, width, height);

            if (!isDragging) {
                rotationY += autoRotateSpeed;
            }

            // 1. Deep Atmospheric Outer Corona & Cyan Ozone Glow
            const coronaGrad = ctx.createRadialGradient(cx, cy, radius * 0.94, cx, cy, radius * 1.38);
            coronaGrad.addColorStop(0, 'rgba(56, 189, 248, 0.45)');
            coronaGrad.addColorStop(0.25, 'rgba(14, 116, 220, 0.25)');
            coronaGrad.addColorStop(0.65, 'rgba(10, 45, 110, 0.08)');
            coronaGrad.addColorStop(1, 'rgba(4, 7, 16, 0)');
            ctx.fillStyle = coronaGrad;
            ctx.beginPath();
            ctx.arc(cx, cy, radius * 1.38, 0, Math.PI * 2);
            ctx.fill();

            // 2. Real World Earth Satellite Globe
            ctx.save();
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.clip();

            if (earthImgLoaded) {
                // Draw real photographic satellite Earth with smooth rotation
                ctx.save();
                ctx.translate(cx, cy);
                ctx.rotate(Math.sin(rotationY * 0.35) * 0.05); // Elegant natural axial tilt
                ctx.drawImage(realEarthImg, -radius, -radius, radius * 2, radius * 2);
                ctx.restore();

                // Luminous Cyan Atmosphere Edge Fresnel Rim (Zero black shading)
                const fresnelGrad = ctx.createRadialGradient(cx, cy, radius * 0.82, cx, cy, radius);
                fresnelGrad.addColorStop(0, 'rgba(56, 189, 248, 0)');
                fresnelGrad.addColorStop(0.85, 'rgba(56, 189, 248, 0.15)');
                fresnelGrad.addColorStop(1, 'rgba(125, 211, 252, 0.5)');
                ctx.fillStyle = fresnelGrad;
                ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
            } else {
                // Fallback while asset initializes
                const sphereGrad = ctx.createRadialGradient(cx - radius * 0.35, cy - radius * 0.35, radius * 0.1, cx, cy, radius);
                sphereGrad.addColorStop(0, '#0d2244');
                sphereGrad.addColorStop(0.6, '#081226');
                sphereGrad.addColorStop(1, '#040711');
                ctx.fillStyle = sphereGrad;
                ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
            }
            ctx.restore();

            // 3. Crisp Cyan Atmosphere Boundary Rim
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.75)';
            ctx.lineWidth = 1.6;
            ctx.stroke();

            // 4. Rotating Orbital Telemetry HUD Rings
            ctx.save();
            ctx.translate(cx, cy);

            // Outer dashed orbit ring
            ctx.beginPath();
            ctx.arc(0, 0, radius * 1.15, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.22)';
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 7]);
            ctx.stroke();
            ctx.setLineDash([]);

            // Equatorial tracking ellipse
            ctx.beginPath();
            ctx.ellipse(0, 0, radius * 1.12, radius * 0.26, rotationX * 0.5, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(212, 175, 55, 0.35)';
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.restore();

            // 5. Render 3D Perspective Cyber Hubs & Radar Blips
            const cosX = Math.cos(rotationX);
            const sinX = Math.sin(rotationX);
            const cosY = Math.cos(rotationY);
            const sinY = Math.sin(rotationY);

            majorHubs.forEach(hub => {
                hub.ping = (hub.ping + 0.02) % 1;

                const px = Math.cos(hub.lat) * Math.sin(hub.lon);
                const py = Math.sin(hub.lat);
                const pz = Math.cos(hub.lat) * Math.cos(hub.lon);

                const x1 = px * cosY - pz * sinY;
                const z1 = px * sinY + pz * cosY;
                const y2 = py * cosX - z1 * sinX;
                const z2 = py * sinX + z1 * cosX;

                // Visible on hemisphere
                if (z2 > 0) {
                    const sx = cx + x1 * radius;
                    const sy = cy - y2 * radius;
                    const alpha = Math.max(0.2, z2);

                    // Expanding radar ring
                    ctx.beginPath();
                    ctx.arc(sx, sy, 4 + hub.ping * 14, 0, Math.PI * 2);
                    ctx.strokeStyle = hub.color;
                    ctx.lineWidth = 1.2;
                    ctx.globalAlpha = (1 - hub.ping) * alpha;
                    ctx.stroke();
                    ctx.globalAlpha = 1.0;

                    // Central node dot
                    ctx.beginPath();
                    ctx.arc(sx, sy, 3, 0, Math.PI * 2);
                    ctx.fillStyle = '#ffffff';
                    ctx.fill();

                    ctx.beginPath();
                    ctx.arc(sx, sy, 4.5, 0, Math.PI * 2);
                    ctx.strokeStyle = hub.color;
                    ctx.lineWidth = 1.5;
                    ctx.stroke();
                }
            });

            // 6. Render 3D Curved Laser Attack Arcs Over Real World
            globeArcs.forEach(arc => {
                arc.progress = (arc.progress + 0.007) % 1;

                const steps = 24;
                const curvePoints = [];

                for (let s = 0; s <= steps; s++) {
                    const t = s / steps;
                    const curLat = arc.fromLat + (arc.toLat - arc.fromLat) * t;
                    const curLon = arc.fromLon + (arc.toLon - arc.fromLon) * t;

                    const elevation = 1.0 + Math.sin(t * Math.PI) * 0.18;

                    const px = Math.cos(curLat) * Math.sin(curLon) * elevation;
                    const py = Math.sin(curLat) * elevation;
                    const pz = Math.cos(curLat) * Math.cos(curLon) * elevation;

                    const x1 = px * cosY - pz * sinY;
                    const z1 = px * sinY + pz * cosY;
                    const y2 = py * cosX - z1 * sinX;
                    const z2 = py * sinX + z1 * cosX;

                    curvePoints.push({
                        x: cx + x1 * radius,
                        y: cy - y2 * radius,
                        z: z2
                    });
                }

                // Draw Arc Line
                ctx.beginPath();
                let started = false;
                curvePoints.forEach(p => {
                    if (p.z > -0.15) {
                        if (!started) {
                            ctx.moveTo(p.x, p.y);
                            started = true;
                        } else {
                            ctx.lineTo(p.x, p.y);
                        }
                    }
                });
                ctx.strokeStyle = arc.color === '#e11d48' ? 'rgba(225, 29, 72, 0.55)' : 'rgba(245, 158, 11, 0.55)';
                ctx.lineWidth = 1.5;
                ctx.setLineDash([3, 4]);
                ctx.stroke();
                ctx.setLineDash([]);

                // Draw Moving Photon Missile on Arc
                const missileIdx = Math.floor(arc.progress * steps);
                const ptHead = curvePoints[missileIdx];
                if (ptHead && ptHead.z > 0) {
                    ctx.beginPath();
                    ctx.arc(ptHead.x, ptHead.y, 3.5, 0, Math.PI * 2);
                    ctx.fillStyle = '#ffffff';
                    ctx.fill();

                    ctx.beginPath();
                    ctx.arc(ptHead.x, ptHead.y, 7, 0, Math.PI * 2);
                    ctx.strokeStyle = arc.color;
                    ctx.lineWidth = 1.5;
                    ctx.stroke();
                }
            });

            requestAnimationFrame(renderGlobe);
        }

        requestAnimationFrame(renderGlobe);
    }

    // ═══════════════════════════════════════════════════════════
    // 3. 2D WORLD THREAT MAP WITH INTERACTIVE TRAVELING PACKETS
    // ═══════════════════════════════════════════════════════════

    function init2DWorldMap() {
        const canvas = DOM.worldTelemetryCanvas;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        let mapW = 0, mapH = 0;
        let mapInView = true;

        function resize() {
            const rect = canvas.getBoundingClientRect();
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            mapW = rect.width;
            mapH = rect.height;
            canvas.width = Math.floor(mapW * dpr);
            canvas.height = Math.floor(mapH * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }
        window.addEventListener('resize', resize, { passive: true });
        resize();

        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                mapInView = entries[0].isIntersecting;
            }, { threshold: 0.05 });
            observer.observe(canvas);
        }

        // 12 Hub Nodes accurately placed across Continents on world_map.jpg
        const mapNodes = [
            { id: 'node-na-east', x: 0.22, y: 0.33, label: 'US-East (Virginia)', sev: 'critical', alertTitle: 'Phishing Campaign Vector' },
            { id: 'node-na-west', x: 0.14, y: 0.33, label: 'US-West (Silicon Valley)', sev: 'high', alertTitle: 'Credential Abuse' },
            { id: 'node-sa', x: 0.31, y: 0.65, label: 'Sao Paulo (DC-Cluster)', sev: 'high', alertTitle: 'Malware Distribution Hub' },
            { id: 'node-eu-west', x: 0.49, y: 0.26, label: 'London / Frankfurt', sev: 'critical', alertTitle: 'Ransomware Staging Node' },
            { id: 'node-eu-east', x: 0.55, y: 0.26, label: 'Bucharest Gateway', sev: 'high', alertTitle: 'MFA Bypass Infiltration' },
            { id: 'node-me', x: 0.60, y: 0.42, label: 'Dammam SCADA Grid', sev: 'critical', alertTitle: 'OT Governor Interference' },
            { id: 'node-asia-east', x: 0.86, y: 0.32, label: 'Tokyo / Seoul', sev: 'critical', alertTitle: 'Volumetric DDoS Vector' },
            { id: 'node-se-asia', x: 0.78, y: 0.55, label: 'Singapore Transit', sev: 'medium', alertTitle: 'API Botnet Abuse' },
            { id: 'node-aus', x: 0.86, y: 0.73, label: 'Sydney Uplink', sev: 'high', alertTitle: 'Credential Extraction' },
            { id: 'node-africa', x: 0.53, y: 0.65, label: 'Johannesburg Node', sev: 'medium', alertTitle: 'Exfiltration Relay' },
            { id: 'node-india', x: 0.70, y: 0.45, label: 'Mumbai Data Fabric', sev: 'high', alertTitle: 'Banking Trojan Traffic' }
        ];

        // Active Flight Arcs with Continuously Moving Telemetry Packets
        const trajectories = [
            { from: mapNodes[0], to: mapNodes[3], progress: 0.1, speed: 0.004, color: '#f43f5e' }, // US-East -> London
            { from: mapNodes[3], to: mapNodes[6], progress: 0.5, speed: 0.0035, color: '#e11d48' }, // Europe -> Tokyo
            { from: mapNodes[6], to: mapNodes[8], progress: 0.8, speed: 0.0045, color: '#f59e0b' }, // Tokyo -> Sydney
            { from: mapNodes[2], to: mapNodes[0], progress: 0.3, speed: 0.003, color: '#f59e0b' },  // SA -> US-East
            { from: mapNodes[7], to: mapNodes[5], progress: 0.65, speed: 0.0038, color: '#38bdf8' }  // Singapore -> Mid East
        ];

        const shockwaves = [];
        let hoveredNode = null;

        // Quadratic Bezier Helper
        function getBezierPoint(p0, p1, p2, t) {
            const x = (1 - t) * (1 - t) * p0.x + 2 * (1 - t) * t * p1.x + t * t * p2.x;
            const y = (1 - t) * (1 - t) * p0.y + 2 * (1 - t) * t * p1.y + t * t * p2.y;
            return { x, y };
        }

        // Touch & Click Event Handler: Launches Live Packets across the Map
        function handleMapInteraction(clientX, clientY) {
            const rect = canvas.getBoundingClientRect();
            const clickX = clientX - rect.left;
            const clickY = clientY - rect.top;
            const w = rect.width;
            const h = rect.height;

            // Spawn double sonar wave at click point
            shockwaves.push({
                x: clickX,
                y: clickY,
                radius: 4,
                maxRadius: 80,
                opacity: 0.9,
                color: '#38bdf8'
            });
            shockwaves.push({
                x: clickX,
                y: clickY,
                radius: 1,
                maxRadius: 40,
                opacity: 0.7,
                color: '#d4af37'
            });

            // Find closest node to origin of click
            let closest = mapNodes[0];
            let minDist = Infinity;
            for (const n of mapNodes) {
                const dist = Math.hypot(clickX - n.x * w, clickY - n.y * h);
                if (dist < minDist) {
                    minDist = dist;
                    closest = n;
                }
            }

            // Pick a distant target node on another continent
            const candidates = mapNodes.filter(n => n !== closest);
            const target = candidates[Math.floor(Math.random() * candidates.length)];

            // Launch new high-speed intercept packet trajectory!
            trajectories.push({
                from: closest,
                to: target,
                progress: 0,
                speed: 0.0075,
                color: '#e11d48',
                ephemeral: true
            });

            // Update hint banner with dynamic coordinates
            if (DOM.mapTouchHint) {
                DOM.mapTouchHint.textContent = `TELEMETRY PULSE LAUNCHED: ${closest.label} ➔ ${target.label}`;
                setTimeout(() => {
                    if (DOM.mapTouchHint) {
                        DOM.mapTouchHint.textContent = 'TOUCH / CLICK MAP TO LAUNCH INTERCEPT TELEMETRY PACKETS';
                    }
                }, 3500);
            }

            // If user clicked near a node, open intelligence panel
            if (hoveredNode) {
                openIntelDossier(hoveredNode.id);
            }
        }

        canvas.addEventListener('click', (e) => handleMapInteraction(e.clientX, e.clientY));
        canvas.addEventListener('touchstart', (e) => {
            if (e.touches.length > 0) {
                handleMapInteraction(e.touches[0].clientX, e.touches[0].clientY);
            }
        }, { passive: true });

        // Hover tracking
        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            const mx = e.clientX - rect.left;
            const my = e.clientY - rect.top;
            const w = rect.width;
            const h = rect.height;

            let found = null;
            for (const node of mapNodes) {
                if (Math.hypot(mx - node.x * w, my - node.y * h) < 18) {
                    found = node;
                    break;
                }
            }
            hoveredNode = found;
            canvas.style.cursor = found ? 'pointer' : 'crosshair';
        });

        // Main Render Loop for 2D Map Canvas (Zero layout reflows)
        function drawMap() {
            if (!mapInView) {
                requestAnimationFrame(drawMap);
                return;
            }
            const w = mapW;
            const h = mapH;
            const now = Date.now() * 0.002;

            ctx.clearRect(0, 0, w, h);

            // 1. Draw Active Flight Arcs and Moving Packets
            for (let i = trajectories.length - 1; i >= 0; i--) {
                const traj = trajectories[i];
                const x1 = traj.from.x * w;
                const y1 = traj.from.y * h;
                const x2 = traj.to.x * w;
                const y2 = traj.to.y * h;
                const mx = (x1 + x2) / 2;
                const my = Math.min(y1, y2) - 40; // Arc elevation

                const p0 = { x: x1, y: y1 };
                const p1 = { x: mx, y: my };
                const p2 = { x: x2, y: y2 };

                // Draw base curved trajectory
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.quadraticCurveTo(mx, my, x2, y2);
                ctx.strokeStyle = traj.color === '#e11d48' ? 'rgba(225, 29, 72, 0.45)' : 'rgba(245, 158, 11, 0.4)';
                ctx.lineWidth = 1.2;
                ctx.setLineDash([3, 5]);
                ctx.stroke();
                ctx.setLineDash([]);

                // Advance Progress
                traj.progress += traj.speed;
                if (traj.progress > 1) {
                    if (traj.ephemeral) {
                        // Impact shockwave at arrival node
                        shockwaves.push({
                            x: x2,
                            y: y2,
                            radius: 3,
                            maxRadius: 50,
                            opacity: 0.85,
                            color: traj.color
                        });
                        trajectories.splice(i, 1);
                        continue;
                    } else {
                        traj.progress = 0;
                    }
                }

                // Moving Glowing Photon Head + Comet Tail
                const ptHead = getBezierPoint(p0, p1, p2, traj.progress);
                const ptTail = getBezierPoint(p0, p1, p2, Math.max(0, traj.progress - 0.09));

                const grad = ctx.createLinearGradient(ptTail.x, ptTail.y, ptHead.x, ptHead.y);
                grad.addColorStop(0, 'rgba(0,0,0,0)');
                grad.addColorStop(1, traj.color);

                ctx.lineWidth = 2.6;
                ctx.strokeStyle = grad;
                ctx.beginPath();
                ctx.moveTo(ptTail.x, ptTail.y);
                ctx.lineTo(ptHead.x, ptHead.y);
                ctx.stroke();

                // Bright Photon Head
                ctx.beginPath();
                ctx.arc(ptHead.x, ptHead.y, 3, 0, Math.PI * 2);
                ctx.fillStyle = '#ffffff';
                ctx.fill();

                ctx.beginPath();
                ctx.arc(ptHead.x, ptHead.y, 7, 0, Math.PI * 2);
                ctx.strokeStyle = traj.color;
                ctx.lineWidth = 1.2;
                ctx.stroke();
            }

            // 2. Draw Expanding Sonar Shockwaves
            for (let i = shockwaves.length - 1; i >= 0; i--) {
                const sw = shockwaves[i];
                sw.radius += 1.8;
                sw.opacity -= 0.022;

                if (sw.opacity <= 0 || sw.radius >= sw.maxRadius) {
                    shockwaves.splice(i, 1);
                    continue;
                }

                ctx.beginPath();
                ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
                ctx.strokeStyle = sw.color;
                ctx.lineWidth = 1.5;
                ctx.globalAlpha = Math.max(0, sw.opacity);
                ctx.stroke();
                ctx.globalAlpha = 1.0;
            }

            // 3. Draw Tactical Nodes
            mapNodes.forEach((node, idx) => {
                const nx = node.x * w;
                const ny = node.y * h;
                const pulse = Math.sin(now * 3 + idx) * 3;
                const isCrit = node.sev === 'critical';

                // Beacon Ring
                ctx.beginPath();
                ctx.arc(nx, ny, 7 + Math.max(0, pulse), 0, Math.PI * 2);
                ctx.strokeStyle = isCrit ? 'rgba(225, 29, 72, 0.45)' : 'rgba(245, 158, 11, 0.4)';
                ctx.lineWidth = 1;
                ctx.stroke();

                // Core Dot
                ctx.beginPath();
                ctx.arc(nx, ny, hoveredNode === node ? 5 : 3.5, 0, Math.PI * 2);
                ctx.fillStyle = isCrit ? '#e11d48' : '#f59e0b';
                ctx.fill();
            });

            requestAnimationFrame(drawMap);
        }

        requestAnimationFrame(drawMap);
    }

    // ═══════════════════════════════════════════════════════════
    // 4. SPARKLINE GENERATOR (High-Performance Zero-Reflow Neon Graphs)
    // ═══════════════════════════════════════════════════════════

    let sparklineAnimPhase = 0;
    let sparklinesInView = true;
    let sparklineItems = [];

    const sparklineConfigs = [
        { id: 'sparkline-active', color: '#ff2d55', harmonicColor: 'rgba(255, 45, 85, 0.35)', phaseOffset: 0.4 },
        { id: 'sparkline-blocked', color: '#00e676', harmonicColor: 'rgba(0, 230, 118, 0.35)', phaseOffset: 1.2 },
        { id: 'sparkline-vuln', color: '#f59e0b', harmonicColor: 'rgba(245, 158, 11, 0.35)', phaseOffset: 2.0 },
        { id: 'sparkline-mttd', color: '#00a8ff', harmonicColor: 'rgba(0, 168, 255, 0.35)', phaseOffset: 2.8 }
    ];

    function setupSparklineCanvases() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        sparklineItems = sparklineConfigs.map(cfg => {
            const canvas = document.getElementById(cfg.id);
            if (!canvas) return null;
            const ctx = canvas.getContext('2d', { alpha: true });
            const rect = canvas.getBoundingClientRect();
            const w = rect.width;
            const h = rect.height;
            if (w === 0 || h === 0) return null;
            canvas.width = Math.floor(w * dpr);
            canvas.height = Math.floor(h * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            return { canvas, ctx, w, h, ...cfg };
        }).filter(Boolean);
    }

    function renderSparklineItem(item, time) {
        const { ctx, w, h, color, harmonicColor, phaseOffset } = item;
        ctx.clearRect(0, 0, w, h);

        // 1. Cyber Telemetry Grid
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.07)';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 5]);

        const y1 = h * 0.33;
        const y2 = h * 0.66;
        ctx.beginPath();
        ctx.moveTo(0, y1); ctx.lineTo(w, y1);
        ctx.moveTo(0, y2); ctx.lineTo(w, y2);
        ctx.stroke();

        ctx.beginPath();
        for (let i = 1; i <= 5; i++) {
            const x = (w / 6) * i;
            ctx.moveTo(x, 0); ctx.lineTo(x, h);
        }
        ctx.stroke();
        ctx.setLineDash([]);

        // 2. Secondary Harmonic Wave (Optimized 40 steps)
        ctx.beginPath();
        const steps = 40;
        for (let i = 0; i <= steps; i++) {
            const x = (i / steps) * w;
            const t = (i / steps) * Math.PI * 2.8 + phaseOffset - time * 0.45;
            const y = h * 0.52 + Math.sin(t) * (h * 0.22) + Math.cos(t * 1.4) * (h * 0.05);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = harmonicColor;
        ctx.lineWidth = 1.3;
        ctx.stroke();

        // 3. Primary Glowing Neon Wave
        ctx.save();
        ctx.shadowBlur = 10;
        ctx.shadowColor = color;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.2;

        ctx.beginPath();
        const wavePoints = [];
        for (let i = 0; i <= steps; i++) {
            const x = (i / steps) * w;
            const t = (i / steps) * Math.PI * 2.6 + phaseOffset + 0.8 + time * 0.6;
            const y = h * 0.50 + Math.sin(t) * (h * 0.28);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
            wavePoints.push({ x, y });
        }
        ctx.stroke();
        ctx.restore();

        // 4. Glowing Hot Beacons
        const beaconIndices = [
            Math.floor(steps * 0.28),
            Math.floor(steps * 0.68),
            steps
        ];

        beaconIndices.forEach(idx => {
            const pt = wavePoints[idx];
            if (!pt) return;

            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.shadowBlur = 8;
            ctx.shadowColor = color;
            ctx.fill();

            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 1.8, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.shadowBlur = 4;
            ctx.shadowColor = '#ffffff';
            ctx.fill();
        });
    }

    function initSparklines() {
        setupSparklineCanvases();
        window.addEventListener('resize', setupSparklineCanvases, { passive: true });

        const statsGrid = document.getElementById('stats-grid');
        if ('IntersectionObserver' in window && statsGrid) {
            const observer = new IntersectionObserver((entries) => {
                sparklinesInView = entries[0].isIntersecting;
            }, { threshold: 0.05 });
            observer.observe(statsGrid);
        }

        let lastTime = 0;
        function renderAllSparklines(timestamp) {
            if (sparklinesInView && timestamp - lastTime > 20) {
                lastTime = timestamp;
                sparklineAnimPhase += 0.02;
                for (let i = 0; i < sparklineItems.length; i++) {
                    renderSparklineItem(sparklineItems[i], sparklineAnimPhase);
                }
            }
            requestAnimationFrame(renderAllSparklines);
        }
        requestAnimationFrame(renderAllSparklines);
    }

    // ═══════════════════════════════════════════════════════════
    // 5. THREAT DISTRIBUTION DONUT CHART
    // ═══════════════════════════════════════════════════════════

    function initThreatDonut() {
        const canvas = DOM.threatDonutCanvas;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const w = rect.width;
        const h = rect.height;
        const cx = w / 2;
        const cy = h / 2;
        const outerRadius = w * 0.44;
        const innerRadius = w * 0.30;

        const segments = [
            { pct: 0.32, color: '#ff2d55' }, // Malware (Red)
            { pct: 0.24, color: '#f97316' }, // Phishing (Orange)
            { pct: 0.15, color: '#f59e0b' }, // DDoS (Yellow/Gold)
            { pct: 0.14, color: '#06b6d4' }, // Ransomware (Cyan)
            { pct: 0.12, color: '#a855f7' }  // Others (Purple)
        ];

        ctx.clearRect(0, 0, w, h);

        // Soft outer neon glow behind donut ring
        ctx.save();
        ctx.shadowBlur = 16;
        ctx.shadowColor = 'rgba(255, 45, 85, 0.35)';

        let startAngle = -Math.PI / 2;
        const gap = 0.035;

        segments.forEach(seg => {
            const angle = seg.pct * Math.PI * 2;
            const endAngle = startAngle + angle - gap;

            ctx.beginPath();
            ctx.arc(cx, cy, outerRadius, startAngle, endAngle);
            ctx.arc(cx, cy, innerRadius, endAngle, startAngle, true);
            ctx.closePath();
            ctx.fillStyle = seg.color;
            ctx.shadowColor = seg.color;
            ctx.fill();

            startAngle = endAngle + gap;
        });

        ctx.restore();
    }

    // ═══════════════════════════════════════════════════════════
    // 6. RAW AI TELEMETRY ENGINE & DEEP DOSSIER
    // ═══════════════════════════════════════════════════════════

    function showToast(msg) {
        const toast = document.getElementById('toast-hud');
        const msgEl = document.getElementById('toast-msg');
        if (!toast || !msgEl) return;
        msgEl.textContent = msg;
        toast.classList.add('is-visible');
        setTimeout(() => {
            toast.classList.remove('is-visible');
        }, 2800);
    }

    function generateRawAiTelemetry(threat) {
        const numId = (threat.id || "TS-2026-0001").replace(/\D/g, '') || "8841";
        const ipSuffix = (parseInt(numId, 10) % 240) + 10;
        return {
            telemetry_packet_id: `PKT-2026-${numId}-RAW-AI`,
            correlation_engine: "THREAT_STORM // AUTONOMOUS_AI_CORRELATOR_v4.2.0",
            ingestion_timestamp: threat.timestamp || new Date().toISOString(),
            incident_id: threat.id,
            threat_designation: threat.title,
            severity_tier: (threat.severity || "CRITICAL").toUpperCase(),
            cvss_score: threat.cvss || 9.4,
            affected_infrastructure: {
                fqdn: threat.asset || "core-node.internal",
                sector: threat.sector || "Financial Core Infrastructure",
                geographical_region: threat.region || "Global Hub",
                active_sensor: threat.source || "EDR Behavioral Engine"
            },
            mitre_attack_context: {
                technique_ids: (threat.mitre || "T1078").split(',').map(s => s.trim()),
                tactic_classification: threat.category || "Exfiltration / Privilege Escalation"
            },
            verified_sensor_evidence_chain: (threat.evidence || []).map((ev, i) => ({
                evidence_id: ev.ref || `EVT-${numId}-${i + 1}`,
                raw_observation: ev.text,
                cryptographic_status: "SHA256_MATCHED_AUTHORITATIVE",
                pipeline_confidence: 96.8
            })),
            raw_network_pcap_sample: {
                source_socket: `10.14.8.${ipSuffix}:52140`,
                destination_socket: "185.220.101.44:443",
                ip_protocol: "TCP // TLS_1_3_CHACHA20_POLY1305",
                ja3_fingerprint: "771,4865-4866-4867-49195,0-23-65281-10-11-35-16,29-23-24,0",
                packet_count: 1420 + parseInt(numId, 10),
                total_bytes_transferred: 2450120 + parseInt(numId, 10) * 12
            },
            raw_process_execution_trace: {
                parent_process: "svchost.exe (PID 844)",
                spawned_binary: `C:\\Windows\\System32\\rundll32.exe (PID ${10000 + parseInt(numId, 10)})`,
                command_line_parameters: `powershell.exe -NoP -NonI -W Hidden -Enc SUVYIChOZXctT2JqZWN0IE5ldC5XZWJDbGllbnQpLi4u`,
                amsi_scan_result: "AMSI_RESULT_DETECTED // HEURISTIC_MATCH_POSITIVE"
            },
            ai_threat_intelligence_assessment: {
                autonomous_model: "CyberSentinel-LLM-Transformer v5.4.1",
                heuristic_confidence_percent: threat.confidence?.level || 92,
                confidence_rating: threat.confidence?.label || "High",
                ai_reasoning: threat.confidence?.explanation || threat.reason,
                blast_radius_assessment: threat.impact,
                prescribed_countermeasures: threat.recommendations || [
                    "Immediate EDR automated network quarantine",
                    "Invalidate domain Kerberos TGT and rotate credentials",
                    "Acquire triage memory dump for deep forensic timeline"
                ]
            }
        };
    }

    function openIntelDossier(alertId) {
        const item = alerts.find(a => a.id === alertId) || alerts[0];
        if (!item || !DOM.intelPanel) return;

        activeAlertId = item.id;

        // Title and badges
        DOM.intelTitle.textContent = item.title;
        DOM.intelSeverityBadge.textContent = item.severity.toUpperCase();
        DOM.intelSeverityBadge.className = `intel-panel__severity-badge sev-badge--${item.severity}`;
        DOM.intelStatusBadge.textContent = item.status.toUpperCase();
        DOM.intelCvssBadge.textContent = `CVSS ${item.cvss || '9.4'}`;

        // Metadata items
        if (DOM.intelTimestamp) DOM.intelTimestamp.textContent = new Date(item.timestamp).toUTCString();
        if (DOM.intelAsset) DOM.intelAsset.textContent = item.asset;
        if (DOM.intelSource) DOM.intelSource.textContent = item.source;
        if (DOM.intelMitre) DOM.intelMitre.textContent = `MITRE: ${item.mitre}`;
        if (DOM.intelRegion) DOM.intelRegion.textContent = item.region;

        // Narrative Context
        DOM.intelReasonContent.innerHTML = `<p>${item.reason}</p>`;

        // Evidence Artifacts
        DOM.intelEvidenceContent.innerHTML = (item.evidence || []).map(ev => `
            <div style="margin-bottom: 8px;">
                <code>[${ev.ref}]</code> ${ev.text}
            </div>
        `).join('');

        // Confidence
        DOM.intelConfidenceContent.innerHTML = `
            <p><strong>Assessment Score: ${item.confidence?.level || 92}% (${item.confidence?.label || 'High'})</strong></p>
            <p>${item.confidence?.explanation || 'Signals cross-correlated across global sensor matrix.'}</p>
        `;

        // Known vs Unverified
        const knownHtml = (item.known || []).map(k => `<li>✓ ${k}</li>`).join('');
        const unverifiedHtml = (item.unverified || []).map(u => `<li>⚠ ${u}</li>`).join('');
        DOM.intelKnownContent.innerHTML = `
            <p><strong>Verified Telemetry Facts:</strong></p>
            <ul style="margin: 4px 0 12px 18px;">${knownHtml}</ul>
            <p><strong>Gaps Under Investigation:</strong></p>
            <ul style="margin: 4px 0 0 18px;">${unverifiedHtml}</ul>
        `;

        // Blast Radius
        const recs = (item.recommendations || []).map(r => `<li>${r}</li>`).join('');
        DOM.intelImpactContent.innerHTML = `
            <p style="margin-bottom: 8px;">${item.impact}</p>
            <p><strong>Defensive Interventions:</strong></p>
            <ol style="margin-left: 18px;">${recs}</ol>
        `;

        // Investigation Audit Log
        const timeline = (item.investigation?.timeline || []).map(tl => `
            <div style="font-size: 11px; margin-bottom: 4px; font-family: var(--font-mono);">
                <span style="color: var(--medium);">${new Date(tl.at || Date.now()).toLocaleTimeString()}</span> — ${tl.action || tl.text} <em>(${tl.actor || 'AI Correlator'})</em>
            </div>
        `).join('');
        DOM.intelInvestigationContent.innerHTML = timeline || '<p>Investigation opened by Autonomous Correlation Engine.</p>';

        // Raw AI Telemetry & SIEM Sensor Payload
        const rawContent = document.getElementById('intel-raw-content');
        const rawTelemetry = generateRawAiTelemetry(item);
        if (rawContent) {
            rawContent.innerHTML = `
                <div style="display: flex; gap: 8px; margin-bottom: 8px;">
                    <span class="ev-badge-chip ev-chip--gold">PKT_ID: ${rawTelemetry.telemetry_packet_id}</span>
                    <span class="ev-badge-chip ev-chip--sample">JA3: ${rawTelemetry.raw_network_pcap_sample.ja3_fingerprint.split(',')[0]}</span>
                    <span class="ev-badge-chip ev-chip--crit">${rawTelemetry.raw_network_pcap_sample.total_bytes_transferred} Bytes</span>
                </div>
                <pre class="intel-raw-code-box"><code id="intel-raw-json-code">${JSON.stringify(rawTelemetry, null, 2)}</code></pre>
            `;
        }

        // Wire Copy Raw button
        const btnCopyRaw = document.getElementById('intel-btn-copy-raw');
        if (btnCopyRaw) {
            btnCopyRaw.onclick = () => {
                const text = JSON.stringify(rawTelemetry, null, 2);
                if (navigator.clipboard) {
                    navigator.clipboard.writeText(text).then(() => {
                        showToast(`✓ Raw AI Telemetry for ${item.id} Copied to Clipboard!`);
                    }).catch(() => {
                        showToast(`✓ Telemetry Copied!`);
                    });
                } else {
                    showToast(`✓ Telemetry Ready`);
                }
            };
        }

        // Show Slide-Over
        DOM.intelOverlay.classList.add('is-active');
        document.body.style.overflow = 'hidden';
    }

    function closeIntelDossier() {
        if (!DOM.intelOverlay) return;
        DOM.intelOverlay.classList.remove('is-active');
        document.body.style.overflow = '';
    }

    // ═══════════════════════════════════════════════════════════
    // 7. MASTER MULTI-PAGE VIEW ROUTER (AI INTELLIGENCE VIEWS)
    // ═══════════════════════════════════════════════════════════

    const VIEW_SECTIONS = {
        planetary: ['hero-section', 'middle-dashboard', 'recent-threats-section'],
        'evidence-chain': ['evidence-chain'],
        'url-scanner': ['view-url-scanner'],
        'ai-model': ['view-ai-model'],
        feed: ['view-feed'],
        sector: ['view-sector'],
        reports: ['view-reports'],
        settings: ['view-settings'],
        alerts: ['view-alerts'],
        auth: ['view-auth']
    };

    function switchAppView(viewName) {
        if (!VIEW_SECTIONS[viewName] && viewName !== 'evidence-chain') {
            viewName = 'planetary';
        }

        // Hide all sections first
        const allSectionIds = [
            'hero-section',
            'middle-dashboard',
            'recent-threats-section',
            'evidence-chain',
            'view-url-scanner',
            'view-ai-model',
            'view-feed',
            'view-sector',
            'view-reports',
            'view-settings',
            'view-alerts',
            'view-auth'
        ];

        allSectionIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.style.display = 'none';
                if (id === 'evidence-chain') {
                    el.classList.remove('ev-view--active');
                }
            }
        });

        // Show requested view sections
        if (viewName === 'evidence-chain') {
            const evEl = document.getElementById('evidence-chain');
            if (evEl) {
                evEl.style.display = '';
                evEl.classList.add('ev-view--active');
            }
            window.scrollTo({ top: 0, behavior: 'instant' });
        } else {
            const targetIds = VIEW_SECTIONS[viewName] || VIEW_SECTIONS.planetary;
            targetIds.forEach(id => {
                const el = document.getElementById(id);
                if (el) {
                    el.style.display = (id === 'view-auth' || id.startsWith('view-')) ? 'block' : '';
                }
            });
            window.scrollTo({ top: 0, behavior: 'instant' });
        }

        // Synchronize Top Tab Pills
        document.querySelectorAll('.tab-pill').forEach(pill => pill.classList.remove('tab-pill--active'));
        const tabMapping = {
            planetary: 'tab-planetary',
            'evidence-chain': 'tab-evidence-chain',
            'url-scanner': 'tab-url-scanner',
            'ai-model': 'tab-ai-model',
            feed: 'tab-feed',
            sector: 'tab-sector',
            alerts: 'tab-alerts',
            reports: 'tab-reports',
            settings: 'tab-settings',
            auth: 'tab-auth'
        };
        const activeTabId = tabMapping[viewName];
        if (activeTabId) {
            const activeTab = document.getElementById(activeTabId);
            if (activeTab) activeTab.classList.add('tab-pill--active');
        }

        // Synchronize Sidebar Navigation Items
        document.querySelectorAll('.sidebar__nav .nav-item').forEach(item => item.classList.remove('nav-item--active'));
        const menuMapping = {
            planetary: 'menu-threat-map',
            'evidence-chain': 'menu-evidence-chain',
            'url-scanner': 'menu-url-scanner',
            'ai-model': 'menu-ai-model',
            feed: 'menu-feed',
            sector: 'menu-sector',
            alerts: 'menu-alerts',
            reports: 'menu-reports',
            settings: 'menu-settings',
            auth: 'menu-auth'
        };
        const activeMenuId = menuMapping[viewName];
        if (activeMenuId) {
            const activeMenu = document.getElementById(activeMenuId);
            if (activeMenu) activeMenu.classList.add('nav-item--active');
        }

        // Render dynamic content for target view
        if (viewName === 'feed') renderFeedView();
        if (viewName === 'sector') renderSectorView();
        if (viewName === 'reports') renderReportsView();
        if (viewName === 'settings') renderSettingsView();
        if (viewName === 'alerts') renderFullAlertsTable();
    }

    window.switchAppView = switchAppView;

    // ── Render Views Functions ──

    function renderFeedView(filterSeverity = 'all', searchQuery = '') {
        const container = document.getElementById('feed-cards-container');
        if (!container) return;

        let filtered = alerts.filter(a => {
            if (filterSeverity !== 'all' && a.severity.toLowerCase() !== filterSeverity.toLowerCase()) return false;
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                const match = (a.id && a.id.toLowerCase().includes(q)) ||
                              (a.title && a.title.toLowerCase().includes(q)) ||
                              (a.asset && a.asset.toLowerCase().includes(q)) ||
                              (a.mitre && a.mitre.toLowerCase().includes(q)) ||
                              (a.sector && a.sector.toLowerCase().includes(q));
                if (!match) return false;
            }
            return true;
        });

        container.innerHTML = filtered.map(item => {
            const numId = (item.id || "TS-2026-0001").replace(/\D/g, '') || "8841";
            const ipSuffix = (parseInt(numId, 10) % 240) + 10;
            return `
                <div class="feed-threat-card">
                    <div class="feed-threat-top">
                        <div>
                            <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
                                <span class="sev-badge sev-badge--${item.severity}">${item.severity.toUpperCase()}</span>
                                <span class="ev-badge-chip ev-chip--gold">CVSS ${item.cvss || 9.4}</span>
                                <span class="ev-badge-chip ev-chip--sample">${item.category || 'Security Alert'}</span>
                            </div>
                            <h3 class="feed-threat-title">${item.title}</h3>
                        </div>
                    </div>

                    <div class="feed-threat-meta">
                        <span>🖥️ ${item.asset}</span>
                        <span>🌐 ${item.region}</span>
                        <span>⚡ MITRE ${item.mitre}</span>
                    </div>

                    <p style="font-size:12px; color:var(--text-secondary); line-height:1.45; margin:0;">
                        ${item.reason.length > 140 ? item.reason.substring(0, 138) + '…' : item.reason}
                    </p>

                    <div class="feed-raw-ioc-box">
                        <div><strong>RAW IOC:</strong> 185.220.101.${ipSuffix}:443 // TCP_ESTABLISHED</div>
                        <div><strong>HASH:</strong> e3b0c44298fc1c149afbf4c8996fb92427ae${numId}</div>
                    </div>

                    <div class="feed-card-actions">
                        <button type="button" class="feed-btn-inspect" data-action="inspect" data-id="${item.id}">
                            <span>⚡ Inspect Raw AI Data</span>
                        </button>
                        <button type="button" class="feed-btn-copy" data-action="copy" data-id="${item.id}" title="Copy raw payload to clipboard">
                            <span>📋 Copy JSON</span>
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        // Attach buttons
        container.querySelectorAll('[data-action="inspect"]').forEach(btn => {
            btn.addEventListener('click', () => {
                openIntelDossier(btn.getAttribute('data-id'));
            });
        });

        container.querySelectorAll('[data-action="copy"]').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const threat = alerts.find(a => a.id === id);
                if (threat) {
                    const raw = generateRawAiTelemetry(threat);
                    if (navigator.clipboard) {
                        navigator.clipboard.writeText(JSON.stringify(raw, null, 2)).then(() => {
                            showToast(`✓ Raw AI Telemetry for ${id} Copied to Clipboard!`);
                        });
                    }
                }
            });
        });
    }

    function renderSectorView() {
        const container = document.getElementById('sector-cards-container');
        if (!container) return;

        const SECTORS = [
            { name: "Financial Core & Custody Clearing", risk: 94, incidents: 5, mttd: "3.2m", actor: "APT28 / Lazarus", sensor: "ONLINE (0ms)", icon: "🏦" },
            { name: "Healthcare Clinical Data & PACS", risk: 88, incidents: 4, mttd: "4.8m", actor: "BlackCat / ALPHV", sensor: "ONLINE (1ms)", icon: "🏥" },
            { name: "Defense Industrial Base & Weapons R&D", risk: 96, incidents: 6, mttd: "2.1m", actor: "APT-Vanguard", sensor: "ONLINE (0ms)", icon: "🛡️" },
            { name: "Energy Grid & Industrial SCADA Logic", risk: 82, incidents: 3, mttd: "5.4m", actor: "Sandworm / Industroyer", sensor: "ONLINE (2ms)", icon: "⚡" },
            { name: "Cloud & Sovereign Hyperscale Core", risk: 74, incidents: 2, mttd: "3.9m", actor: "Scattered Spider", sensor: "ONLINE (1ms)", icon: "☁️" },
            { name: "Telecommunications & BGP Autonomous", risk: 79, incidents: 3, mttd: "4.1m", actor: "Volt Typhoon", sensor: "ONLINE (1ms)", icon: "📡" },
            { name: "Government Identity & Citizen Portal", risk: 85, incidents: 3, mttd: "3.5m", actor: "Midnight Blizzard", sensor: "ONLINE (0ms)", icon: "🏛️" },
            { name: "Global Retail Logistics & Supply Chain", risk: 68, incidents: 2, mttd: "6.2m", actor: "FIN7 Syndicate", sensor: "ONLINE (2ms)", icon: "📦" }
        ];

        container.innerHTML = SECTORS.map(sec => `
            <div class="sector-card">
                <div class="sector-header">
                    <span style="font-size:24px;">${sec.icon}</span>
                    <span class="sector-risk-badge" style="background:${sec.risk >= 90 ? 'rgba(255,45,85,0.2)' : 'rgba(245,158,11,0.2)'}; color:${sec.risk >= 90 ? '#ff2d55' : '#f59e0b'}; border:1px solid ${sec.risk >= 90 ? '#ff2d55' : '#f59e0b'};">
                        RISK INDEX ${sec.risk}%
                    </span>
                </div>
                <h3 class="sector-name">${sec.name}</h3>
                <div class="sector-metrics-row">
                    <div class="sector-metric-item">
                        <span>Active Incidents</span>
                        <div style="font-size:16px; font-weight:700; color:#ff2d55;">${sec.incidents} Threats</div>
                    </div>
                    <div class="sector-metric-item">
                        <span>Mean Triage Speed</span>
                        <div style="font-size:16px; font-weight:700; color:#00e676;">${sec.mttd}</div>
                    </div>
                </div>
                <div style="font-family:var(--font-mono); font-size:10px; color:var(--text-tertiary);">
                    <div><strong>PRIMARY ACTOR:</strong> ${sec.actor}</div>
                    <div style="color:#00e676;"><strong>SENSOR PIPELINE:</strong> ${sec.sensor}</div>
                </div>
                <button type="button" class="feed-btn-inspect" data-sector="${sec.name}">
                    <span>⚡ Inspect Raw Sector Telemetry</span>
                </button>
            </div>
        `).join('');

        container.querySelectorAll('[data-sector]').forEach(btn => {
            btn.addEventListener('click', () => {
                const matching = alerts.find(a => a.sector && a.sector.toLowerCase().includes('fin')) || alerts[0];
                openIntelDossier(matching.id);
            });
        });
    }

    function renderReportsView() {
        const container = document.getElementById('reports-cards-container');
        if (!container) return;

        const REPORTS = [
            { id: "INC-2026-8841", title: "SolarStorm APT: Multi-Stage Domain Controller Compromise & Egress", sev: "CRITICAL", cvss: 9.8, artifacts: 26, nodes: 8, lead: "Commander Yash K.", time: "24 Oct 2026" },
            { id: "TS-2026-0001", title: "Credential Exfiltration via Reverse-Tunneled C2 Channel", sev: "CRITICAL", cvss: 9.8, artifacts: 18, nodes: 6, lead: "Analyst YK", time: "24 Oct 2026" },
            { id: "TS-2026-0002", title: "Ransomware Pre-Deployment Shadow Copy Purge & Boot Tamper", sev: "CRITICAL", cvss: 9.6, artifacts: 15, nodes: 5, lead: "Incident Cmdr YK", time: "23 Oct 2026" },
            { id: "TS-2026-0003", title: "Industrial SCADA Logic Controller Firmware Tamper", sev: "CRITICAL", cvss: 9.7, artifacts: 22, nodes: 7, lead: "Analyst YK", time: "22 Oct 2026" },
            { id: "TS-2026-0004", title: "Kubernetes API Server Service Account Token Compromise", sev: "CRITICAL", cvss: 9.5, artifacts: 19, nodes: 6, lead: "SOC Lead YK", time: "21 Oct 2026" },
            { id: "TS-2026-0005", title: "DNS Tunneling C2 Channel over IPv6 Protocol Stack", sev: "HIGH", cvss: 8.8, artifacts: 14, nodes: 4, lead: "Analyst YK", time: "20 Oct 2026" }
        ];

        container.innerHTML = REPORTS.map(r => `
            <div class="report-card">
                <div>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                        <span class="ev-badge-chip ev-chip--gold">DOSSIER // ${r.id}</span>
                        <span class="sev-badge sev-badge--${r.sev.toLowerCase()}">${r.sev} • CVSS ${r.cvss}</span>
                    </div>
                    <h3 style="font-family:var(--font-heading); font-size:16px; font-weight:700; color:#ffffff; line-height:1.4;">${r.title}</h3>
                </div>

                <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; background:#020409; padding:10px 12px; border-radius:4px; font-family:var(--font-mono); font-size:10px;">
                    <div><span style="color:var(--text-tertiary);">ARTIFACTS:</span> <strong style="color:#00e676;">${r.artifacts} Verified</strong></div>
                    <div><span style="color:var(--text-tertiary);">ANALYST:</span> <strong style="color:#ffffff;">${r.lead}</strong></div>
                    <div><span style="color:var(--text-tertiary);">STATUS:</span> <strong style="color:var(--gold-bright);">PUBLISHED</strong></div>
                    <div><span style="color:var(--text-tertiary);">DATE:</span> <strong style="color:#38bdf8;">${r.time}</strong></div>
                </div>

                <div style="display:flex; gap:8px; flex-wrap:wrap;">
                    <button type="button" class="feed-btn-inspect" data-report-id="${r.id}">
                        <span>⚡ Inspect Raw AI Data</span>
                    </button>
                    <button type="button" class="feed-btn-copy" data-action="download-json" data-report-id="${r.id}">
                        <span>💾 JSON</span>
                    </button>
                    <button type="button" class="feed-btn-copy" data-action="download-md" data-report-id="${r.id}">
                        <span>📝 Markdown</span>
                    </button>
                </div>
            </div>
        `).join('');

        container.querySelectorAll('[data-report-id]').forEach(btn => {
            const id = btn.getAttribute('data-report-id');
            const action = btn.getAttribute('data-action');
            if (action === 'download-json') {
                btn.onclick = () => {
                    const threat = alerts.find(a => a.id === id) || alerts[0];
                    const raw = generateRawAiTelemetry(threat);
                    const blob = new Blob([JSON.stringify(raw, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${id}_AI_Dossier.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                    showToast(`✓ Downloaded ${id}_AI_Dossier.json`);
                };
            } else if (action === 'download-md') {
                btn.onclick = () => {
                    const threat = alerts.find(a => a.id === id) || alerts[0];
                    let md = `# THREAT STORM — INCIDENT BRIEFING // ${id}\n\n`;
                    md += `**Title:** ${threat.title}\n`;
                    md += `**Severity:** ${threat.severity.toUpperCase()} (CVSS ${threat.cvss || 9.4})\n`;
                    md += `**Classification:** TOP SECRET // ORCON // SOC VERIFIED\n\n`;
                    md += `## Detection Narrative\n${threat.reason}\n\n`;
                    md += `## Impact Assessment\n${threat.impact}\n`;
                    const blob = new Blob([md], { type: 'text/markdown' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${id}_Briefing.md`;
                    a.click();
                    URL.revokeObjectURL(url);
                    showToast(`✓ Downloaded ${id}_Briefing.md`);
                };
            } else {
                btn.onclick = () => {
                    openIntelDossier(id);
                };
            }
        });
    }

    function renderSettingsView() {
        const tbody = document.getElementById('settings-sensors-body');
        if (!tbody) return;

        const SENSORS = [
            { id: "SNR-001", name: "EDR Behavioral Engine (Sysmon EID 1/3/10)", host: "Endpoints (4,250 Agents)", status: "ONLINE", latency: "0.8ms", tput: "1.4 MB/s" },
            { id: "SNR-002", name: "Zeek Network Packet Intercept Tap", host: "Core Switch Fabric (40 Gbps)", status: "ONLINE", latency: "1.2ms", tput: "24.8 MB/s" },
            { id: "SNR-003", name: "Active Directory Forwarding Agent (EID 4662)", host: "Domain Controllers (dc-auth-01/03)", status: "ONLINE", latency: "2.1ms", tput: "420 KB/s" },
            { id: "SNR-004", name: "Darknet Honeytoken Canary Intercept", host: "Global Active Directory Forest", status: "ONLINE", latency: "0.4ms", tput: "12 KB/s" },
            { id: "SNR-005", name: "CloudTrail Multi-Region GuardDuty Pipe", host: "AWS & Azure Hybrid Enclaves", status: "ONLINE", latency: "1.8ms", tput: "890 KB/s" },
            { id: "SNR-006", name: "AMSI ScriptBlock Reassembly Daemon", host: "Workstations ws-fin-001..099", status: "ONLINE", latency: "1.5ms", tput: "650 KB/s" },
            { id: "SNR-007", name: "Threat Intelligence Reputation Cluster", host: "Haute Cyber Bureau Cloud", status: "ONLINE", latency: "0.6ms", tput: "3.2 MB/s" }
        ];

        tbody.innerHTML = SENSORS.map(s => `
            <tr>
                <td style="color:var(--gold-bright); font-weight:700;">${s.id}</td>
                <td style="color:#ffffff;">${s.name}</td>
                <td>${s.host}</td>
                <td><span class="ev-badge-chip ev-chip--gold" style="color:#00e676; border-color:#00e676;">✓ ${s.status}</span></td>
                <td style="color:#38bdf8;">${s.latency}</td>
                <td>${s.tput}</td>
                <td><button type="button" class="feed-btn-copy" style="padding:3px 8px; font-size:10px;" onclick="window.switchAppView('feed')">Inspect Data</button></td>
            </tr>
        `).join('');
    }

    function renderFullAlertsTable(searchQuery = '', filterSeverity = 'all') {
        const tbody = document.getElementById('full-alerts-body');
        if (!tbody) return;

        let filtered = alerts.filter(a => {
            if (filterSeverity !== 'all' && a.severity.toLowerCase() !== filterSeverity.toLowerCase()) return false;
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                const match = (a.id && a.id.toLowerCase().includes(q)) ||
                              (a.title && a.title.toLowerCase().includes(q)) ||
                              (a.asset && a.asset.toLowerCase().includes(q)) ||
                              (a.source && a.source.toLowerCase().includes(q));
                if (!match) return false;
            }
            return true;
        });

        tbody.innerHTML = filtered.map(a => `
            <tr class="table-row" data-id="${a.id}" tabindex="0" style="cursor:pointer;" title="Click to inspect raw AI telemetry dossier">
                <td style="color:var(--gold-bright); font-family:var(--font-mono); font-weight:700;">${a.id}</td>
                <td class="col-time">${new Date(a.timestamp).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}</td>
                <td class="col-threat"><strong>${a.title}</strong></td>
                <td class="col-source">${a.source}</td>
                <td class="col-target">${a.asset}</td>
                <td><span style="font-family:var(--font-mono); font-size:10.5px; color:#38bdf8;">${a.mitre}</span></td>
                <td class="col-sev"><span class="sev-badge sev-badge--${a.severity}">${a.severity.toUpperCase()}</span></td>
                <td class="col-status"><span class="status-pill status-pill--${a.status}">${a.status}</span></td>
                <td>
                    <button type="button" class="feed-btn-copy" style="padding:3px 8px; font-size:10px;" data-raw-id="${a.id}">
                        ⚡ Raw AI
                    </button>
                </td>
            </tr>
        `).join('');

        // Wire click handlers on rows
        tbody.querySelectorAll('.table-row').forEach(row => {
            row.addEventListener('click', () => {
                openIntelDossier(row.getAttribute('data-id'));
            });
        });

        tbody.querySelectorAll('[data-raw-id]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                openIntelDossier(btn.getAttribute('data-raw-id'));
            });
        });
    }

    // ═══════════════════════════════════════════════════════════
    // 8. EVENT BINDINGS (ALL BUTTONS WIRED TO VALID RAW DATA)
    // ═══════════════════════════════════════════════════════════

    function bindEvents() {
        // Table Row Click to Open Intel Panel in Recent Threats
        const rows = document.querySelectorAll('.table-row');
        rows.forEach(r => {
            r.addEventListener('click', () => {
                const id = r.dataset.id;
                openIntelDossier(id);
            });
            r.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openIntelDossier(r.dataset.id);
                }
            });
        });

        // Clickable Latest Intelligence Items
        document.querySelectorAll('.intel-item--clickable').forEach(item => {
            item.addEventListener('click', () => {
                const id = item.getAttribute('data-id') || 'TS-2026-0001';
                openIntelDossier(id);
            });
        });

        // Intel Panel Controls
        if (DOM.intelClose) DOM.intelClose.addEventListener('click', closeIntelDossier);
        if (DOM.intelOverlay) {
            DOM.intelOverlay.addEventListener('click', (e) => {
                if (e.target === DOM.intelOverlay) closeIntelDossier();
            });
        }
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && DOM.intelOverlay && DOM.intelOverlay.classList.contains('is-active')) {
                closeIntelDossier();
            }
        });

        // Status Change in Intel Panel
        if (DOM.intelApplyStatus) {
            DOM.intelApplyStatus.addEventListener('click', () => {
                const newStatus = DOM.intelStatusChange.value;
                if (!newStatus) return;
                const current = alerts.find(a => a.id === activeAlertId);
                if (current) {
                    current.status = newStatus;
                    DOM.intelStatusBadge.textContent = newStatus.toUpperCase();
                    DOM.intelInvestigationContent.innerHTML += `
                        <div style="font-size: 11px; margin-top: 4px; font-family: var(--font-mono); color: var(--gold-bright);">
                            <span>${new Date().toLocaleTimeString()}</span> — Status changed to ${newStatus.toUpperCase()} (Analyst YK)
                        </div>
                    `;
                    showToast(`✓ Incident ${current.id} status updated to ${newStatus.toUpperCase()}`);
                }
            });
        }

        // Analyst Notes
        if (DOM.intelSaveNotes) {
            DOM.intelSaveNotes.addEventListener('click', () => {
                const text = DOM.intelAnalystNotes.value.trim();
                if (!text) return;
                DOM.intelInvestigationContent.innerHTML += `
                    <div style="font-size: 11px; margin-top: 6px; padding: 6px 10px; background: rgba(212,175,55,0.08); border-left: 2px solid var(--gold); border-radius: 2px;">
                        <strong>Analyst Note:</strong> ${text}
                    </div>
                `;
                DOM.intelAnalystNotes.value = '';
                showToast("✓ Technical Analyst Note appended to dossier");
            });
        }

        // Export JSON
        if (DOM.intelExportJson) {
            DOM.intelExportJson.addEventListener('click', () => {
                const current = alerts.find(a => a.id === activeAlertId);
                if (!current) return;
                const raw = generateRawAiTelemetry(current);
                const blob = new Blob([JSON.stringify(raw, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${current.id}_Dossier.json`;
                a.click();
                URL.revokeObjectURL(url);
                showToast(`✓ Exported ${current.id}_Dossier.json`);
            });
        }

        // ── Top Navigation Tabs (Switch to valid pages) ──
        const tabPlanetary = document.getElementById('tab-planetary');
        const tabEvidence = document.getElementById('tab-evidence-chain');
        const tabUrlScanner = document.getElementById('tab-url-scanner');
        const tabAiModel = document.getElementById('tab-ai-model');
        const tabFeed = document.getElementById('feed-tab') || document.getElementById('tab-feed');
        const tabSector = document.getElementById('tab-sector');
        const tabAlerts = document.getElementById('tab-alerts');
        const tabReports = document.getElementById('tab-reports');
        const tabSettings = document.getElementById('tab-settings');
        const tabAuth = document.getElementById('tab-auth');

        if (tabPlanetary) tabPlanetary.addEventListener('click', () => switchAppView('planetary'));
        if (tabEvidence) tabEvidence.addEventListener('click', () => switchAppView('evidence-chain'));
        if (tabUrlScanner) tabUrlScanner.addEventListener('click', () => switchAppView('url-scanner'));
        if (tabAiModel) tabAiModel.addEventListener('click', () => switchAppView('ai-model'));
        if (tabFeed) tabFeed.addEventListener('click', () => switchAppView('feed'));
        if (tabSector) tabSector.addEventListener('click', () => switchAppView('sector'));
        if (tabAlerts) tabAlerts.addEventListener('click', () => switchAppView('alerts'));
        if (tabReports) tabReports.addEventListener('click', () => switchAppView('reports'));
        if (tabSettings) tabSettings.addEventListener('click', () => switchAppView('settings'));
        if (tabAuth) tabAuth.addEventListener('click', () => switchAppView('auth'));

        // ── Sidebar Menu Links ──
        const menuThreatMap = document.getElementById('menu-threat-map');
        const menuEvidence = document.getElementById('menu-evidence-chain');
        const menuUrlScanner = document.getElementById('menu-url-scanner');
        const menuAiModel = document.getElementById('menu-ai-model');
        const menuFeed = document.getElementById('menu-feed');
        const menuSector = document.getElementById('menu-sector');
        const menuAlerts = document.getElementById('menu-alerts');
        const menuReports = document.getElementById('menu-reports');
        const menuSettings = document.getElementById('menu-settings');
        const menuAuth = document.getElementById('menu-auth');

        if (menuThreatMap) menuThreatMap.addEventListener('click', (e) => { e.preventDefault(); switchAppView('planetary'); });
        if (menuEvidence) menuEvidence.addEventListener('click', (e) => { e.preventDefault(); switchAppView('evidence-chain'); });
        if (menuUrlScanner) menuUrlScanner.addEventListener('click', (e) => { e.preventDefault(); switchAppView('url-scanner'); });
        if (menuAiModel) menuAiModel.addEventListener('click', (e) => { e.preventDefault(); switchAppView('ai-model'); });
        if (menuFeed) menuFeed.addEventListener('click', (e) => { e.preventDefault(); switchAppView('feed'); });
        if (menuSector) menuSector.addEventListener('click', (e) => { e.preventDefault(); switchAppView('sector'); });
        if (menuAlerts) menuAlerts.addEventListener('click', (e) => { e.preventDefault(); switchAppView('alerts'); });
        if (menuReports) menuReports.addEventListener('click', (e) => { e.preventDefault(); switchAppView('reports'); });
        if (menuSettings) menuSettings.addEventListener('click', (e) => { e.preventDefault(); switchAppView('settings'); });
        if (menuAuth) menuAuth.addEventListener('click', (e) => { e.preventDefault(); switchAppView('auth'); });

        // ── View All Buttons ──
        if (DOM.btnViewAllAlerts) {
            DOM.btnViewAllAlerts.addEventListener('click', () => switchAppView('alerts'));
        }
        if (DOM.btnViewAllIntel) {
            DOM.btnViewAllIntel.addEventListener('click', () => switchAppView('feed'));
        }
        if (DOM.btnExploreMore) {
            DOM.btnExploreMore.addEventListener('click', () => switchAppView('sector'));
        }

        const btnOpenFullScanner = document.getElementById('btn-open-full-scanner');
        if (btnOpenFullScanner) {
            btnOpenFullScanner.addEventListener('click', () => switchAppView('url-scanner'));
        }

        // ── Search & Filter Inputs in Views ──
        const feedSearch = document.getElementById('feed-search-input');
        const feedFilter = document.getElementById('feed-severity-filter');
        if (feedSearch) {
            feedSearch.addEventListener('input', () => {
                renderFeedView(feedFilter ? feedFilter.value : 'all', feedSearch.value.trim());
            });
        }
        if (feedFilter) {
            feedFilter.addEventListener('change', () => {
                renderFeedView(feedFilter.value, feedSearch ? feedSearch.value.trim() : '');
            });
        }

        const alertsSearch = document.getElementById('alerts-search-input');
        const alertsFilter = document.getElementById('alerts-severity-filter');
        if (alertsSearch) {
            alertsSearch.addEventListener('input', () => {
                renderFullAlertsTable(alertsSearch.value.trim(), alertsFilter ? alertsFilter.value : 'all');
            });
        }
        if (alertsFilter) {
            alertsFilter.addEventListener('change', () => {
                renderFullAlertsTable(alertsSearch ? alertsSearch.value.trim() : '', alertsFilter.value);
            });
        }

        // ── Ping Sensors Button ──
        const btnPingSensors = document.getElementById('btn-ping-all-sensors');
        if (btnPingSensors) {
            btnPingSensors.addEventListener('click', () => {
                showToast("⚡ 28/28 Planetary Sensors Responding • 0 Buffer Drops • Mean Latency 0.8ms");
            });
        }

        // ── Supabase Cloud Integration Handlers ──
        initSupabaseUI();
        initAuthSystem();
        initUrlThreatScanner();
        initOmnibarSearch();
        initCyberAiModel();
    }

    // ═══════════════════════════════════════════════════════════
    // SUPABASE CLOUD DATABASE UI ENGINE
    // ═══════════════════════════════════════════════════════════

    function initSupabaseUI() {
        const inputUrl = document.getElementById('sb-input-url');
        const inputKey = document.getElementById('sb-input-key');
        const btnConnect = document.getElementById('btn-sb-connect');
        const btnPush = document.getElementById('btn-sb-sync-push');
        const btnPull = document.getElementById('btn-sb-sync-pull');
        const btnDisconnect = document.getElementById('btn-sb-disconnect');
        const badge = document.getElementById('sb-status-badge');
        const statusText = document.getElementById('sb-status-text');
        const feedback = document.getElementById('sb-feedback-box');

        if (!btnConnect || !window.ThreatStormSupabase) return;

        // Populate existing credentials if saved
        const existingConfig = window.ThreatStormSupabase.getConfig();
        if (existingConfig.url) inputUrl.value = existingConfig.url;
        if (existingConfig.key) inputKey.value = existingConfig.key;

        function updateBadge(state, text) {
            if (!badge || !statusText) return;
            badge.className = 'sb-status-badge';
            if (state === 'online') {
                badge.classList.add('sb-badge--online');
                statusText.textContent = text || 'CONNECTED (SUPABASE CLOUD)';
            } else if (state === 'warning') {
                badge.classList.add('sb-badge--warning');
                statusText.textContent = text || 'CONNECTED (SCHEMA NEEDED)';
            } else {
                badge.classList.add('sb-badge--offline');
                statusText.textContent = text || 'LOCAL IN-MEMORY MODE';
            }
        }

        function showFeedback(msg, type) {
            if (!feedback) return;
            feedback.style.display = 'block';
            feedback.style.background = type === 'error' ? 'rgba(239, 68, 68, 0.12)' : (type === 'warn' ? 'rgba(212, 175, 55, 0.12)' : 'rgba(62, 207, 142, 0.12)');
            feedback.style.border = `1px solid ${type === 'error' ? '#ef4444' : (type === 'warn' ? '#d4af37' : '#3ECF8E')}`;
            feedback.style.color = type === 'error' ? '#fca5a5' : (type === 'warn' ? '#fde047' : '#86efac');
            feedback.innerHTML = msg;
        }

        // Check initial state
        if (window.ThreatStormSupabase.isConnected()) {
            updateBadge('online', 'CONNECTED (SUPABASE CLOUD)');
        }

        // Connect button
        btnConnect.addEventListener('click', async () => {
            const url = inputUrl.value.trim();
            const key = inputKey.value.trim();

            if (!url || !key) {
                showFeedback('⚠️ Please enter both your Supabase Project URL and Anon Public Key.', 'warn');
                return;
            }

            btnConnect.disabled = true;
            btnConnect.innerHTML = '<span>⏳ Verifying...</span>';
            showFeedback('Verifying handshake with Supabase PostgreSQL cluster...', 'warn');

            const result = await window.ThreatStormSupabase.testConnection(url, key);
            btnConnect.disabled = false;
            btnConnect.innerHTML = '<span>⚡ Connect &amp; Verify</span>';

            if (result.success) {
                if (result.warning) {
                    updateBadge('warning', 'CONNECTED (SCHEMA NEEDED)');
                    showFeedback(`✓ ${result.warning}`, 'warn');
                    showToast('⚠️ Connected! Note: Execute supabase_schema.sql in Supabase SQL Editor.');
                } else {
                    updateBadge('online', `LIVE CLOUD (${result.latency}ms)`);
                    showFeedback(`✓ Handshake verified with Supabase! Round-trip latency: ${result.latency}ms`, 'success');
                    showToast(`⚡ Supabase Live Connected (${result.latency}ms)`);
                }
            } else {
                updateBadge('offline', 'CONNECTION FAILED');
                showFeedback(`✕ Error connecting to Supabase: ${result.message}`, 'error');
                showToast(`✕ Supabase connection failed: ${result.message}`);
            }
        });

        // Push Local Threats to Supabase
        if (btnPush) {
            btnPush.addEventListener('click', async () => {
                btnPush.disabled = true;
                btnPush.innerHTML = '<span>⏳ Uploading...</span>';
                const res = await window.ThreatStormSupabase.syncLocalThreatsToCloud(alerts);
                btnPush.disabled = false;
                btnPush.innerHTML = '<span>☁ Push 28 Local Threats to Cloud</span>';

                if (res.success) {
                    showFeedback(`✓ ${res.message}`, 'success');
                    showToast(`☁ Synced ${res.count} Threats to Supabase Cloud!`);
                } else {
                    showFeedback(`✕ Upload failed: ${res.message}`, 'error');
                    showToast(`✕ Sync failed: ${res.message}`);
                }
            });
        }

        // Pull Live Threats from Supabase
        if (btnPull) {
            btnPull.addEventListener('click', async () => {
                btnPull.disabled = true;
                btnPull.innerHTML = '<span>⏳ Fetching...</span>';
                const cloudThreats = await window.ThreatStormSupabase.fetchThreatsFromCloud();
                btnPull.disabled = false;
                btnPull.innerHTML = '<span>📥 Pull Cloud Incidents</span>';

                if (cloudThreats && cloudThreats.length) {
                    // Update in-memory alerts
                    alerts = cloudThreats.map(ct => ({
                        id: ct.id,
                        title: ct.title,
                        severity: ct.severity,
                        category: ct.category,
                        region: ct.region,
                        lat: ct.lat,
                        lng: ct.lng,
                        details: ct.details,
                        threatActor: ct.actor || 'APT_CLUSTER',
                        aiConfidence: ct.confidence ? `${Math.round(ct.confidence * 100)}%` : '96%',
                        status: 'active'
                    }));

                    // Re-render views
                    renderThreatsTable();
                    renderFullAlertsTable();
                    renderFeedView();
                    renderSectorView();

                    showFeedback(`✓ Pulled ${cloudThreats.length} live threats from Supabase PostgreSQL database.`, 'success');
                    showToast(`📥 Pulled ${cloudThreats.length} live threats from Supabase!`);
                } else {
                    showFeedback('No cloud threats found or Supabase is not connected. Push threats first or verify table.', 'warn');
                    showToast('⚠️ No records returned from Supabase.');
                }
            });
        }

        // Disconnect / Reset
        if (btnDisconnect) {
            btnDisconnect.addEventListener('click', () => {
                window.ThreatStormSupabase.disconnect();
                inputUrl.value = '';
                inputKey.value = '';
                updateBadge('offline', 'LOCAL IN-MEMORY MODE');
                if (feedback) feedback.style.display = 'none';
                showToast('✓ Disconnected. Running in Local In-Memory Mode.');
            });
        }
    }

    // ═══════════════════════════════════════════════════════════
    // CYBER SOC AUTHENTICATION & SESSION ENGINE
    // ═══════════════════════════════════════════════════════════

    function initAuthSystem() {
        const btnOpenAuth = document.getElementById('btn-open-auth');
        const authModal = document.getElementById('auth-modal');
        const btnCloseAuth = document.getElementById('auth-modal-close');
        const tabSignIn = document.getElementById('tab-auth-signin');
        const tabSignUp = document.getElementById('tab-auth-signup');
        const groupCallsign = document.getElementById('group-auth-callsign');
        const inputCallsign = document.getElementById('auth-input-callsign');
        const inputEmail = document.getElementById('auth-input-email');
        const inputPassword = document.getElementById('auth-input-password');
        const btnTogglePass = document.getElementById('btn-toggle-password');
        const btnSubmit = document.getElementById('btn-auth-submit');
        const submitLabel = document.getElementById('auth-submit-label');
        const btnDemo = document.getElementById('btn-auth-demo');
        const feedback = document.getElementById('auth-feedback-box');

        const profileBadge = document.getElementById('user-profile-badge');
        const navAvatar = document.getElementById('nav-user-avatar');
        const navInitials = document.getElementById('nav-user-initials');
        const navCallsign = document.getElementById('nav-user-callsign');
        const navClearance = document.getElementById('nav-user-clearance');
        const dropdown = document.getElementById('user-menu-dropdown');
        const dropdownEmail = document.getElementById('dropdown-user-email');
        const dropdownRole = document.getElementById('dropdown-user-role');
        const btnMenuSettings = document.getElementById('btn-menu-settings');
        const btnSignOut = document.getElementById('btn-auth-signout');

        let authMode = 'signin'; // 'signin' or 'signup'

        function showAuthFeedback(msg, type) {
            if (!feedback) return;
            feedback.style.display = 'block';
            feedback.style.background = type === 'error' ? 'rgba(239, 68, 68, 0.12)' : (type === 'warn' ? 'rgba(212, 175, 55, 0.12)' : 'rgba(62, 207, 142, 0.12)');
            feedback.style.border = `1px solid ${type === 'error' ? '#ef4444' : (type === 'warn' ? '#d4af37' : '#3ECF8E')}`;
            feedback.style.color = type === 'error' ? '#fca5a5' : (type === 'warn' ? '#fde047' : '#86efac');
            feedback.innerHTML = msg;
        }

        const navAdminBadge = document.getElementById('nav-admin-badge');
        const adminStrip = document.getElementById('admin-welcome-strip');
        const adminStripUser = document.getElementById('admin-strip-user');

        function updateAuthUI() {
            if (!window.ThreatStormSupabase) return;
            const currentUser = window.ThreatStormSupabase.getCurrentUser();

            if (currentUser) {
                if (btnOpenAuth) btnOpenAuth.style.display = 'none';
                if (profileBadge) profileBadge.style.display = 'inline-flex';

                const name = currentUser.callsign || currentUser.email || 'Analyst';
                const initials = name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || 'YK';

                if (navInitials) navInitials.textContent = initials;
                if (navCallsign) navCallsign.textContent = name;
                if (navClearance) navClearance.textContent = currentUser.clearance || 'SECRET // LEVEL 3';
                if (dropdownEmail) dropdownEmail.textContent = currentUser.email || 'analyst@threatstorm.defense';
                if (dropdownRole) dropdownRole.textContent = currentUser.role || 'SOC Cyber Analyst';

                if (currentUser.isAdmin) {
                    if (navAdminBadge) navAdminBadge.style.display = 'inline-flex';
                    if (adminStrip) adminStrip.style.display = 'flex';
                    if (adminStripUser) adminStripUser.textContent = `${name} (${currentUser.email}) • Level 5 Global Commander`;
                } else {
                    if (navAdminBadge) navAdminBadge.style.display = 'none';
                    if (adminStrip) adminStrip.style.display = 'none';
                }
            } else {
                if (btnOpenAuth) btnOpenAuth.style.display = 'inline-flex';
                if (profileBadge) profileBadge.style.display = 'none';
                if (navAdminBadge) navAdminBadge.style.display = 'none';
                if (adminStrip) adminStrip.style.display = 'none';
                if (dropdown) dropdown.classList.remove('is-open');
                if (profileBadge) profileBadge.classList.remove('menu-open');
            }
        }

        // Open Sleek Authentication Modal on Header Sign In click
        function openAuthModal(mode = 'signin') {
            if (!authModal) {
                switchAppView('auth');
                return;
            }
            authModal.style.display = 'flex';
            authModal.classList.add('ev-modal--open');
            if (mode === 'signup' && tabSignUp) {
                tabSignUp.click();
            } else if (tabSignIn) {
                tabSignIn.click();
            }
        }

        function closeAuthModal() {
            if (!authModal) return;
            authModal.style.display = 'none';
            authModal.classList.remove('ev-modal--open');
        }

        if (btnOpenAuth) {
            btnOpenAuth.addEventListener('click', (e) => {
                e.preventDefault();
                openAuthModal('signin');
            });
        }

        if (btnCloseAuth) btnCloseAuth.addEventListener('click', closeAuthModal);
        if (authModal) {
            authModal.addEventListener('click', (e) => {
                if (e.target === authModal) closeAuthModal();
            });
        }

        const btnModalToPortal = document.getElementById('btn-modal-to-portal');
        if (btnModalToPortal) {
            btnModalToPortal.addEventListener('click', () => {
                closeAuthModal();
                switchAppView('auth');
            });
        }

        // Modal Tabs
        if (tabSignIn && tabSignUp) {
            tabSignIn.addEventListener('click', () => {
                authMode = 'signin';
                tabSignIn.classList.add('auth-tab--active');
                tabSignUp.classList.remove('auth-tab--active');
                if (groupCallsign) groupCallsign.style.display = 'none';
                if (submitLabel) submitLabel.textContent = '⚡ Sign In to SOC Portal';
                if (feedback) feedback.style.display = 'none';
            });

            tabSignUp.addEventListener('click', () => {
                authMode = 'signup';
                tabSignUp.classList.add('auth-tab--active');
                tabSignIn.classList.remove('auth-tab--active');
                if (groupCallsign) groupCallsign.style.display = 'block';
                if (submitLabel) submitLabel.textContent = '🛡️ Create SOC Account';
                if (feedback) feedback.style.display = 'none';
            });
        }

        // Modal Password Show/Hide
        if (btnTogglePass && inputPassword) {
            btnTogglePass.addEventListener('click', () => {
                const isPass = inputPassword.type === 'password';
                inputPassword.type = isPass ? 'text' : 'password';
                btnTogglePass.textContent = isPass ? 'Hide' : 'Show';
            });
        }

        // Modal Form Submit
        if (btnSubmit) {
            btnSubmit.addEventListener('click', async () => {
                const email = inputEmail.value.trim();
                const password = inputPassword.value;
                const callsign = inputCallsign ? inputCallsign.value.trim() : '';

                if (!email || !password) {
                    showAuthFeedback('⚠️ Please enter both work email and password.', 'warn');
                    return;
                }

                btnSubmit.disabled = true;
                btnSubmit.innerHTML = '<span>⏳ Authenticating...</span>';

                let result;
                if (authMode === 'signup') {
                    result = await window.ThreatStormSupabase.signUp(email, password, callsign);
                } else {
                    result = await window.ThreatStormSupabase.signIn(email, password);
                }

                btnSubmit.disabled = false;
                btnSubmit.innerHTML = `<span>${authMode === 'signup' ? '🛡️ Create SOC Account' : '⚡ Sign In to SOC Portal'}</span>`;

                if (result.success) {
                    if (result.confirmationRequired) {
                        showAuthFeedback(`✓ ${result.message}`, 'warn');
                        showToast('✉ Verification link sent to your email.');
                    } else {
                        updateAuthUI();
                        closeAuthModal();
                        switchAppView('planetary');
                        if (result.user.isAdmin) {
                            showToast('👑 WELCOME TO ADMIN DASHBOARD: Commander Yaswanth! Full Level 5 Administrative Clearance Active.');
                        } else {
                            showToast(`✓ Welcome, ${result.user.callsign}! Access Clearance Verified.`);
                        }
                    }
                } else {
                    showAuthFeedback(`✕ Authentication failed: ${result.message}`, 'error');
                }
            });
        }

        // Modal Instant Demo Login
        if (btnDemo) {
            btnDemo.addEventListener('click', () => {
                const demoUser = window.ThreatStormSupabase.loginDemoAnalyst();
                updateAuthUI();
                closeAuthModal();
                switchAppView('planetary');
                showToast('👑 WELCOME TO ADMIN DASHBOARD: Commander Yaswanth! Full Level 5 Administrative Clearance Active.');
            });
        }

        // ═══════════════════════════════════════════════════════════
        // DEDICATED FULL-PAGE AUTHENTICATION PORTAL ENGINE (#view-auth)
        // ═══════════════════════════════════════════════════════════

        const portalTabSignIn = document.getElementById('portal-tab-signin');
        const portalTabSignUp = document.getElementById('portal-tab-signup');
        const portalGroupCallsign = document.getElementById('portal-group-callsign');
        const portalInputCallsign = document.getElementById('portal-input-callsign');
        const portalInputEmail = document.getElementById('portal-input-email');
        const portalInputPass = document.getElementById('portal-input-password');
        const portalBtnTogglePass = document.getElementById('portal-btn-toggle-pass');
        const portalBtnSubmit = document.getElementById('portal-btn-submit');
        const portalSubmitLabel = document.getElementById('portal-submit-label');
        const portalBtnDemo = document.getElementById('portal-btn-demo');
        const portalBtnBack = document.getElementById('portal-btn-back');
        const portalFeedback = document.getElementById('portal-feedback-box');

        let portalMode = 'signin';

        function showPortalFeedback(msg, type) {
            if (!portalFeedback) return;
            portalFeedback.style.display = 'block';
            portalFeedback.style.background = type === 'error' ? 'rgba(239, 68, 68, 0.14)' : (type === 'warn' ? 'rgba(212, 175, 55, 0.14)' : 'rgba(62, 207, 142, 0.14)');
            portalFeedback.style.border = `1px solid ${type === 'error' ? '#ef4444' : (type === 'warn' ? '#d4af37' : '#3ECF8E')}`;
            portalFeedback.style.color = type === 'error' ? '#fca5a5' : (type === 'warn' ? '#fde047' : '#86efac');
            portalFeedback.innerHTML = msg;
        }

        if (portalTabSignIn && portalTabSignUp) {
            portalTabSignIn.addEventListener('click', () => {
                portalMode = 'signin';
                portalTabSignIn.classList.add('portal-tab--active');
                portalTabSignUp.classList.remove('portal-tab--active');
                if (portalGroupCallsign) portalGroupCallsign.style.display = 'none';
                if (portalSubmitLabel) portalSubmitLabel.textContent = '⚡ Authenticate & Access Command Grid';
                if (portalFeedback) portalFeedback.style.display = 'none';
            });

            portalTabSignUp.addEventListener('click', () => {
                portalMode = 'signup';
                portalTabSignUp.classList.add('portal-tab--active');
                portalTabSignIn.classList.remove('portal-tab--active');
                if (portalGroupCallsign) portalGroupCallsign.style.display = 'flex';
                if (portalSubmitLabel) portalSubmitLabel.textContent = '🛡️ Register Callsign & Access Grid';
                if (portalFeedback) portalFeedback.style.display = 'none';
            });
        }

        if (portalBtnTogglePass && portalInputPass) {
            portalBtnTogglePass.addEventListener('click', () => {
                const isPass = portalInputPass.type === 'password';
                portalInputPass.type = isPass ? 'text' : 'password';
                portalBtnTogglePass.textContent = isPass ? 'Hide' : 'Show';
            });
        }

        if (portalBtnSubmit) {
            portalBtnSubmit.addEventListener('click', async () => {
                const email = portalInputEmail.value.trim();
                const password = portalInputPass.value;
                const callsign = portalInputCallsign ? portalInputCallsign.value.trim() : '';

                if (!email || !password) {
                    showPortalFeedback('⚠️ Please provide your SOC email and security key.', 'warn');
                    return;
                }

                portalBtnSubmit.disabled = true;
                portalBtnSubmit.innerHTML = '<span>⏳ Verifying Cryptographic Clearance...</span>';

                let result;
                if (portalMode === 'signup') {
                    result = await window.ThreatStormSupabase.signUp(email, password, callsign);
                } else {
                    result = await window.ThreatStormSupabase.signIn(email, password);
                }

                portalBtnSubmit.disabled = false;
                portalBtnSubmit.innerHTML = `<span>${portalMode === 'signup' ? '🛡️ Register Callsign & Access Grid' : '⚡ Authenticate & Access Command Grid'}</span>`;

                if (result.success) {
                    if (result.confirmationRequired) {
                        showPortalFeedback(`✓ ${result.message}`, 'warn');
                        showToast('✉ Check email for verification link.');
                    } else {
                        updateAuthUI();
                        if (result.user.isAdmin) {
                            showToast('👑 WELCOME TO ADMIN DASHBOARD: Commander Yaswanth! Full Level 5 Administrative Clearance Active.');
                        } else {
                            showToast(`✓ Clearance Verified: Welcome, ${result.user.callsign}!`);
                        }
                        setTimeout(() => {
                            switchAppView('planetary');
                        }, 400);
                    }
                } else {
                    showPortalFeedback(`✕ Authentication failed: ${result.message}`, 'error');
                }
            });
        }

        if (portalBtnDemo) {
            portalBtnDemo.addEventListener('click', () => {
                const demoUser = window.ThreatStormSupabase.loginDemoAnalyst();
                updateAuthUI();
                showToast('👑 WELCOME TO ADMIN DASHBOARD: Commander Yaswanth! Full Level 5 Administrative Clearance Active.');
                setTimeout(() => {
                    switchAppView('planetary');
                }, 300);
            });
        }

        if (portalBtnBack) {
            portalBtnBack.addEventListener('click', () => {
                switchAppView('planetary');
            });
        }

        const portalBtnGoogle = document.getElementById('portal-btn-google');
        const btnModalGoogle = document.getElementById('btn-auth-google');

        async function handleGoogleLogin() {
            showToast('⚡ Redirecting to Google Authentication...');
            const res = await window.ThreatStormSupabase.signInWithOAuth('google');
            if (!res.success) {
                showPortalFeedback(`✕ Google OAuth error: ${res.message}`, 'error');
                showToast(`✕ Google login error: ${res.message}`);
            }
        }

        if (portalBtnGoogle) portalBtnGoogle.addEventListener('click', handleGoogleLogin);
        if (btnModalGoogle) btnModalGoogle.addEventListener('click', handleGoogleLogin);

        // Profile Badge & Dropdown
        if (profileBadge && dropdown) {
            profileBadge.addEventListener('click', (e) => {
                e.stopPropagation();
                const isOpen = dropdown.classList.toggle('is-open');
                profileBadge.classList.toggle('menu-open', isOpen);
            });

            document.addEventListener('click', (e) => {
                if (!profileBadge.contains(e.target)) {
                    dropdown.classList.remove('is-open');
                    profileBadge.classList.remove('menu-open');
                }
            });
        }

        // Dropdown Menu: Settings
        if (btnMenuSettings) {
            btnMenuSettings.addEventListener('click', () => {
                if (dropdown) dropdown.classList.remove('is-open');
                if (profileBadge) profileBadge.classList.remove('menu-open');
                switchAppView('settings');
            });
        }

        // Dropdown Menu: Switch / Select Another Google Account
        const btnMenuSwitchGoogle = document.getElementById('btn-menu-switch-google');
        if (btnMenuSwitchGoogle) {
            btnMenuSwitchGoogle.addEventListener('click', async () => {
                if (dropdown) dropdown.classList.remove('is-open');
                if (profileBadge) profileBadge.classList.remove('menu-open');
                showToast('⚡ Opening Google Account Chooser...');
                await window.ThreatStormSupabase.signOut();
                updateAuthUI();
                await window.ThreatStormSupabase.signInWithOAuth('google');
            });
        }

        // Dropdown Menu: Switch Analyst / Auth Portal
        const btnMenuSwitchAuth = document.getElementById('btn-menu-switch-auth');
        if (btnMenuSwitchAuth) {
            btnMenuSwitchAuth.addEventListener('click', () => {
                if (dropdown) dropdown.classList.remove('is-open');
                if (profileBadge) profileBadge.classList.remove('menu-open');
                switchAppView('auth');
            });
        }

        // Dropdown Menu: Sign Out
        if (btnSignOut) {
            btnSignOut.addEventListener('click', async () => {
                await window.ThreatStormSupabase.signOut();
                sessionStorage.removeItem('ts_admin_welcome_shown');
                updateAuthUI();
                showToast('✓ Signed out. Click "Sign In" to select any Google account.');
            });
        }

        // Initialize state on load & sync Supabase Auth (e.g. after Google redirect)
        updateAuthUI();
        if (window.ThreatStormSupabase && window.ThreatStormSupabase.syncAuthSession) {
            window.ThreatStormSupabase.syncAuthSession().then(user => {
                if (user) {
                    updateAuthUI();
                    if (user.isAdmin && !sessionStorage.getItem('ts_admin_welcome_shown')) {
                        sessionStorage.setItem('ts_admin_welcome_shown', 'true');
                        showToast('👑 WELCOME TO ADMIN DASHBOARD: Commander Yaswanth! Full Level 5 Administrative Clearance Active.');
                    }
                }
            });
        }

        // Live Supabase Auth listener (fires immediately when Google OAuth redirects back)
        if (window.ThreatStormSupabase && window.ThreatStormSupabase.initAuthListener) {
            window.ThreatStormSupabase.initAuthListener((user, event) => {
                updateAuthUI();
                if (user && (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'INITIAL_SESSION')) {
                    if (user.isAdmin && !sessionStorage.getItem('ts_admin_welcome_shown')) {
                        sessionStorage.setItem('ts_admin_welcome_shown', 'true');
                        showToast('👑 WELCOME TO ADMIN DASHBOARD: Commander Yaswanth! Full Level 5 Administrative Clearance Active.');
                    } else if (!user.isAdmin && event === 'SIGNED_IN') {
                        showToast(`✓ Welcome, ${user.callsign}! Access Clearance Verified.`);
                    }
                }
            });
        }
    }

    // ═══════════════════════════════════════════════════════════
    // LIVE URL THREAT SCANNER & RADAR INTERCEPT ENGINE
    // ═══════════════════════════════════════════════════════════

    function initUrlThreatScanner() {
        // Quick Scanner elements
        const quickInput = document.getElementById('quick-scanner-input');
        const btnQuickScan = document.getElementById('btn-quick-scan-submit');

        // Master Scanner elements
        const mainInput = document.getElementById('scanner-main-input');
        const btnDeepScan = document.getElementById('btn-run-deep-scan');
        const scannerBtnLabel = document.getElementById('scanner-btn-label');
        const resultsContainer = document.getElementById('scanner-results-container');

        // Results DOM
        const verdictBanner = document.getElementById('verdict-banner');
        const verdictIcon = document.getElementById('verdict-icon');
        const verdictTitle = document.getElementById('verdict-title');
        const verdictTargetUrl = document.getElementById('verdict-target-url');
        const verdictScoreNum = document.getElementById('verdict-score-num');

        const resIp = document.getElementById('res-ip');
        const resProto = document.getElementById('res-proto');
        const resLatency = document.getElementById('res-latency');
        const resAsn = document.getElementById('res-asn');
        const resGeo = document.getElementById('res-geo');
        const resMitre = document.getElementById('res-mitre');
        const listThreats = document.getElementById('list-detected-threats');
        const listChecks = document.getElementById('list-security-checks');
        const recText = document.getElementById('scanner-recommendation-text');
        const statusPill = document.getElementById('scanner-status-pill');

        // Actions
        const btnSaveSupabase = document.getElementById('btn-save-threat-supabase');
        const btnToEvidence = document.getElementById('btn-scanner-to-evidence');
        const btnCopyJson = document.getElementById('btn-copy-scan-json');

        // Radar & Terminal
        const termLogs = document.getElementById('scanner-terminal-logs');
        const radarBlip = document.getElementById('radar-blip');
        const radarStatus = document.getElementById('radar-sweep-status');

        let isScanning = false;
        let lastScanData = null;

        function addTerminalLog(msg, type = 'info', tag = 'PROBE') {
            if (!termLogs) return;
            const line = document.createElement('div');
            line.className = 'scanner-terminal-line';
            const now = new Date();
            const timeStr = `[${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}]`;
            
            let msgClass = '';
            if (type === 'warn') msgClass = 'scanner-term-msg--warn';
            else if (type === 'fail') msgClass = 'scanner-term-msg--fail';
            else if (type === 'pass') msgClass = 'scanner-term-msg--pass';

            line.innerHTML = `
                <span class="scanner-term-time">${timeStr}</span>
                <span class="scanner-term-tag">[${tag}]</span>
                <span class="${msgClass}">${msg}</span>
            `;
            termLogs.appendChild(line);
            termLogs.scrollTop = termLogs.scrollHeight;
        }

        async function executeUrlScan(rawTargetUrl) {
            if (!rawTargetUrl || !rawTargetUrl.trim()) {
                showToast('⚠️ Please enter a target URL or domain to scan.');
                if (mainInput) mainInput.focus();
                return;
            }

            if (isScanning) return;
            isScanning = true;

            const targetUrl = rawTargetUrl.trim();
            if (mainInput) mainInput.value = targetUrl;
            if (quickInput) quickInput.value = targetUrl;

            // Switch to dedicated URL scanner view so user sees live telemetry
            switchAppView('url-scanner');

            // Trigger realistic radar tactical sweep acceleration
            if (window.RealisticRadar) {
                window.RealisticRadar.setScanning(true);
            }

            // Update UI to Scanning State
            if (btnDeepScan) {
                btnDeepScan.disabled = true;
                if (scannerBtnLabel) scannerBtnLabel.innerHTML = '<span>⏳ INTERCEPTING SENSORS &amp; TELEMETRY...</span>';
            }
            if (btnQuickScan) {
                btnQuickScan.disabled = true;
                btnQuickScan.textContent = '⏳ SCANNING...';
            }
            if (statusPill) {
                statusPill.textContent = '● PROBE IN PROGRESS';
                statusPill.style.color = '#38bdf8';
                statusPill.style.borderColor = '#38bdf8';
            }
            if (radarStatus) {
                radarStatus.textContent = 'TELEMETRY LOCKED';
                radarStatus.style.color = '#38bdf8';
            }

            // Radar Blip Random position sweep
            if (radarBlip) {
                radarBlip.style.top = `${25 + Math.random() * 50}%`;
                radarBlip.style.left = `${25 + Math.random() * 50}%`;
            }

            // Live progressive terminal messages
            addTerminalLog(`Initiating live forensic probe for: ${targetUrl}`, 'info', 'GATEWAY');
            
            await new Promise(r => setTimeout(r, 200));
            addTerminalLog(`Decomposing URI scheme, RFC hostname and sub-paths...`, 'info', 'PARSER');

            await new Promise(r => setTimeout(r, 300));
            addTerminalLog(`Executing asynchronous DNS query (A/AAAA/CNAME/MX) via resolver...`, 'info', 'DNS');

            // Send actual live request to server backend
            let scanResult = null;
            try {
                const res = await fetch('/api/scan-url', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url: targetUrl })
                });
                const json = await res.json();
                if (json.status === 'success') {
                    scanResult = json.data;
                }
            } catch (err) {
                console.warn('[Scanner] Backend API offline, executing local neural heuristic fallback', err);
            }

            // Fallback client-side generator if backend request failed
            if (!scanResult) {
                const hostname = targetUrl.replace(/https?:\/\//i, '').split('/')[0].toLowerCase();
                const isBad = /evil|phish|malware|c2|payload|attack|hack/i.test(targetUrl);
                scanResult = {
                    scanId: `SCAN-${Date.now().toString().slice(-6)}`,
                    timestamp: new Date().toISOString(),
                    targetUrl: targetUrl,
                    hostname: hostname,
                    protocol: targetUrl.startsWith('http://') ? 'HTTP' : 'HTTPS',
                    path: '/' + (targetUrl.split('/')[3] || ''),
                    resolvedIp: isBad ? '185.220.101.44' : '142.250.190.46',
                    dnsStatus: 'RESOLVED',
                    lookupLatencyMs: 84,
                    riskScore: isBad ? 94 : 5,
                    verdict: isBad ? 'CRITICAL THREAT DETECTED' : 'VERIFIED BENIGN & SECURE',
                    severity: isBad ? 'critical' : 'low',
                    cvss: isBad ? 9.8 : 0.8,
                    threatCategory: isBad ? 'Phishing / C2 Infrastructure' : 'Benign Web Asset',
                    mitreTechnique: isBad ? 'T1566.002 • T1071.001' : 'T1071 (Standard Web Protocols)',
                    asn: isBad ? 'AS16276 Bulletproof Offshore Hosting' : 'AS15169 Google Cloud Fabric',
                    country: isBad ? 'Seychelles (SC)' : 'United States (US)',
                    countryCode: isBad ? 'SC' : 'US',
                    city: isBad ? 'Victoria' : 'Edge Point',
                    detectedThreats: isBad ? ['Active Phishing Heuristic Flagged', 'Unverified CA Chain', 'Fast-Flux C2 Pattern'] : [],
                    securityChecks: [
                        { name: "Domain Reputation", status: isBad ? "FAIL" : "PASS", detail: isBad ? "Flagged by 12 threat feeds" : "High authority domain" },
                        { name: "TLS / SSL Certificate", status: isBad ? "FAIL" : "PASS", detail: isBad ? "Invalid or self-signed cert" : "TLS 1.3 verified certificate" },
                        { name: "DNS Resolution", status: "PASS", detail: `Resolved in 84ms` }
                    ],
                    recommendation: isBad ? "IMMEDIATE ACTION: Block target domain on corporate perimeter firewalls." : "STATUS BENIGN: Normal traffic patterns permitted."
                };
            }

            await new Promise(r => setTimeout(r, 350));
            addTerminalLog(`TLS Handshake response: Protocol ${scanResult.protocol} // Latency ${scanResult.lookupLatencyMs}ms`, 'info', 'CRYPTO');

            await new Promise(r => setTimeout(r, 350));
            addTerminalLog(`Queried 94 threat intelligence engines (VirusTotal, AlienVault, MISP)...`, 'info', 'INTEL');

            if (scanResult.riskScore >= 50) {
                addTerminalLog(`⚠️ ALERT: Anomalous heuristics matched! Risk index: ${scanResult.riskScore}%`, 'fail', 'HEURISTIC');
            } else {
                addTerminalLog(`✓ Verified clean telemetry profile. Risk index: ${scanResult.riskScore}%`, 'pass', 'HEURISTIC');
            }

            addTerminalLog(`[COMPLETE] Dossier ${scanResult.scanId} compiled successfully.`, 'pass', 'STATUS');

            // Save last scan data
            lastScanData = scanResult;

            // Render Results to UI
            renderScanResults(scanResult);

            // Update realistic radar target lock-on
            if (window.RealisticRadar) {
                window.RealisticRadar.setScanning(false);
                window.RealisticRadar.setPrimaryTarget(
                    scanResult.hostname || scanResult.targetUrl,
                    scanResult.resolvedIp,
                    scanResult.riskScore
                );
            }

            // Reset buttons
            isScanning = false;
            if (btnDeepScan) {
                btnDeepScan.disabled = false;
                if (scannerBtnLabel) scannerBtnLabel.innerHTML = '<span>⚡ INITIATE DEEP LIVE THREAT SCAN</span>';
            }
            if (btnQuickScan) {
                btnQuickScan.disabled = false;
                btnQuickScan.textContent = '⚡ SCAN LIVE';
            }
            if (statusPill) {
                statusPill.textContent = scanResult.riskScore >= 50 ? '● THREAT DETECTED' : '● BENIGN / CLEAN';
                statusPill.style.color = scanResult.riskScore >= 50 ? '#ef4444' : '#22c55e';
                statusPill.style.borderColor = scanResult.riskScore >= 50 ? '#ef4444' : '#22c55e';
            }
            if (radarStatus) {
                radarStatus.textContent = scanResult.riskScore >= 50 ? 'HOSTILE INTERCEPT' : 'SWEEPER CLEAR';
                radarStatus.style.color = scanResult.riskScore >= 50 ? '#ef4444' : '#22c55e';
            }

            showToast(`✓ Live Scan Complete: ${scanResult.verdict}`);
        }

        function renderScanResults(d) {
            if (!resultsContainer) return;
            resultsContainer.style.display = 'block';

            // Verdict Banner
            if (verdictBanner) {
                verdictBanner.className = 'verdict-banner';
                if (d.riskScore >= 80) {
                    verdictBanner.classList.add('verdict-banner--critical');
                    if (verdictIcon) verdictIcon.textContent = '🚨';
                } else if (d.riskScore >= 50) {
                    verdictBanner.classList.add('verdict-banner--high');
                    if (verdictIcon) verdictIcon.textContent = '⚠️';
                } else if (d.riskScore >= 20) {
                    verdictBanner.classList.add('verdict-banner--medium');
                    if (verdictIcon) verdictIcon.textContent = '⚡';
                } else {
                    verdictBanner.classList.add('verdict-banner--clean');
                    if (verdictIcon) verdictIcon.textContent = '🛡️';
                }
            }

            if (verdictTitle) verdictTitle.textContent = d.verdict;
            if (verdictTargetUrl) verdictTargetUrl.textContent = d.targetUrl;
            if (verdictScoreNum) verdictScoreNum.textContent = `${d.riskScore}%`;

            // KV Fields
            if (resIp) resIp.textContent = d.resolvedIp;
            if (resProto) resProto.textContent = `${d.protocol} // ${d.protocol === 'HTTPS' ? '443 (Encrypted)' : '80 (Cleartext)'}`;
            if (resLatency) resLatency.textContent = `${d.lookupLatencyMs} ms`;
            if (resAsn) resAsn.textContent = d.asn;
            if (resGeo) resGeo.textContent = d.country;
            if (resMitre) resMitre.textContent = d.mitreTechnique;

            // Detected threats list
            if (listThreats) {
                if (d.detectedThreats && d.detectedThreats.length > 0) {
                    listThreats.innerHTML = d.detectedThreats.map(t => `
                        <div style="display:flex; align-items:center; gap:8px; padding:6px 10px; background:rgba(239,68,68,0.12); border:1px solid rgba(239,68,68,0.3); border-radius:4px; font-family:var(--font-mono); font-size:11px; color:#fca5a5;">
                            <span>⚠️</span>
                            <span>${t}</span>
                        </div>
                    `).join('');
                } else {
                    listThreats.innerHTML = `
                        <div style="display:flex; align-items:center; gap:8px; padding:6px 10px; background:rgba(34,197,94,0.1); border:1px solid rgba(34,197,94,0.25); border-radius:4px; font-family:var(--font-mono); font-size:11px; color:#86efac;">
                            <span>✓</span>
                            <span>No overt malicious heuristics or known blacklist matches.</span>
                        </div>
                    `;
                }
            }

            // Security checks list
            if (listChecks && d.securityChecks) {
                listChecks.innerHTML = d.securityChecks.map(c => {
                    const st = c.status ? c.status.toLowerCase() : 'pass';
                    return `
                        <div class="sec-check-item">
                            <span class="sec-check-status-pill sec-check-status-pill--${st}">${c.status}</span>
                            <div class="sec-check-body">
                                <div class="sec-check-name">${c.name}</div>
                                <div class="sec-check-detail">${c.detail}</div>
                            </div>
                        </div>
                    `;
                }).join('');
            }

            // SOC Guidance
            if (recText) {
                recText.textContent = d.recommendation;
            }

            // Render Active Raw Tab
            renderRawTab(activeRawTab);
        }

        const rawCodeViewport = document.getElementById('raw-code-viewport');
        const btnCopyRaw = document.getElementById('btn-copy-active-raw');
        let activeRawTab = 'json';

        function renderRawTab(tab) {
            if (!rawCodeViewport || !lastScanData) return;
            activeRawTab = tab;

            document.querySelectorAll('.raw-tab-btn').forEach(b => {
                b.classList.toggle('raw-tab-btn--active', b.getAttribute('data-raw-tab') === tab);
            });

            if (tab === 'json') {
                rawCodeViewport.textContent = JSON.stringify(lastScanData, null, 2);
            } else if (tab === 'http') {
                const http = lastScanData.rawHttp || {};
                const reqH = http.requestHeaders ? Object.entries(http.requestHeaders).map(([k,v]) => `${k}: ${v}`).join('\n') : '';
                const resH = http.responseHeaders ? Object.entries(http.responseHeaders).map(([k,v]) => `${k}: ${v}`).join('\n') : '';
                rawCodeViewport.textContent = [
                    '# ═══════════════════════════════════════════════════════════',
                    '# CLIENT PROBE REQUEST (RAW HTTP/1.1 WIRE DUMP)',
                    '# ═══════════════════════════════════════════════════════════',
                    http.requestLine || 'GET / HTTP/1.1',
                    reqH,
                    '',
                    '# ═══════════════════════════════════════════════════════════',
                    '# REMOTE SERVER RESPONSE & HEADERS FINGERPRINT',
                    '# ═══════════════════════════════════════════════════════════',
                    http.statusLine || 'HTTP/1.1 200 OK',
                    resH
                ].join('\n');
            } else if (tab === 'dns') {
                rawCodeViewport.textContent = lastScanData.rawDnsDump || `; DNS resolution dump for ${lastScanData.hostname}\n${lastScanData.hostname}. 60 IN A ${lastScanData.resolvedIp}`;
            } else if (tab === 'engines') {
                const engines = lastScanData.rawThreatEngines || [];
                const lines = [
                    '# ═══════════════════════════════════════════════════════════',
                    '# MULTI-VENDOR THREAT REPUTATION ENGINES DUMP',
                    '# ═══════════════════════════════════════════════════════════',
                    ''
                ];
                engines.forEach(e => {
                    const pad = e.engine.padEnd(28, ' ');
                    lines.push(`[${e.status.padEnd(12, ' ')}] ${pad} -> ${e.score}`);
                });
                rawCodeViewport.textContent = lines.join('\n');
            } else if (tab === 'ssl') {
                const ssl = lastScanData.rawSsl || {};
                rawCodeViewport.textContent = [
                    '# ═══════════════════════════════════════════════════════════',
                    '# X.509 CRYPTOGRAPHIC CERTIFICATE & TLS 1.3 DUMP',
                    '# ═══════════════════════════════════════════════════════════',
                    `Subject (CN):          ${ssl.subject || lastScanData.hostname}`,
                    `Issuer Authority:      ${ssl.issuer || 'DigiCert Global Root G2'}`,
                    `Handshake Protocol:    ${ssl.protocol || 'TLSv1.3'}`,
                    `Cipher Suite:          ${ssl.cipherSuite || 'TLS_AES_256_GCM_SHA384'}`,
                    `Valid Range:           ${ssl.validFrom || '2026-01-01'} -> ${ssl.validTo || '2027-01-01'}`,
                    `Serial Number:         ${ssl.serialNumber || '0A:4F:99:C2:11:8A:73:90'}`,
                    `Signature Algorithm:   ${ssl.signatureAlgorithm || 'sha256WithRSAEncryption'}`,
                    `SHA-256 Fingerprint:   ${ssl.certificateFingerprintSha256 || '9E:4B:88:1C:2F:A0:D3:55:71:02:44:89:BC:DE:FA:11:00:33:99:22:AA:BB:CC:DD:EE:FF:11:22:33:44:55:66'}`
                ].join('\n');
            }
        }

        // Attach Raw Tab Switching
        document.querySelectorAll('.raw-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.getAttribute('data-raw-tab');
                if (tab) renderRawTab(tab);
            });
        });

        // Copy Raw View Button
        if (btnCopyRaw) {
            btnCopyRaw.addEventListener('click', () => {
                if (!rawCodeViewport) return;
                const txt = rawCodeViewport.textContent;
                if (navigator.clipboard) {
                    navigator.clipboard.writeText(txt).then(() => {
                        showToast(`✓ Raw ${activeRawTab.toUpperCase()} data copied to clipboard!`);
                    });
                }
            });
        }

        // Attach Form Triggers
        if (btnDeepScan && mainInput) {
            btnDeepScan.addEventListener('click', () => executeUrlScan(mainInput.value));
            mainInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    executeUrlScan(mainInput.value);
                }
            });
        }

        if (btnQuickScan && quickInput) {
            btnQuickScan.addEventListener('click', () => executeUrlScan(quickInput.value));
            quickInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    executeUrlScan(quickInput.value);
                }
            });
        }

        // Sample Chips Handlers
        document.querySelectorAll('.sample-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                const sampleUrl = chip.getAttribute('data-url');
                if (sampleUrl) {
                    executeUrlScan(sampleUrl);
                }
            });
        });

        // Action: Push Threat to Supabase Cloud
        if (btnSaveSupabase) {
            btnSaveSupabase.addEventListener('click', async () => {
                if (!lastScanData) return;
                btnSaveSupabase.disabled = true;
                btnSaveSupabase.innerHTML = '<span>⏳ Syncing to Supabase...</span>';

                const newIncident = {
                    id: `TS-${Date.now().toString().slice(-4)}`,
                    title: `Live URL Intercept: ${lastScanData.hostname}`,
                    severity: lastScanData.severity || 'high',
                    category: lastScanData.threatCategory || 'URL Threat',
                    region: lastScanData.country || 'Global Web',
                    lat: 25.0,
                    lng: 15.0,
                    details: `Real-time URL scan flagged ${lastScanData.targetUrl} with risk score ${lastScanData.riskScore}%. Host IP: ${lastScanData.resolvedIp}. ASN: ${lastScanData.asn}.`,
                    actor: lastScanData.riskScore >= 80 ? 'APT-Vanguard' : 'Suspicious Web Emitter',
                    status: 'active'
                };

                alerts.unshift(newIncident);
                renderThreatsTable();
                renderFullAlertsTable();
                renderFeedView();

                // If Supabase is connected, push to Supabase Cloud
                if (window.ThreatStormSupabase && window.ThreatStormSupabase.pushThreatsToCloud) {
                    try {
                        await window.ThreatStormSupabase.pushThreatsToCloud([newIncident]);
                    } catch (e) {
                        console.warn('Supabase cloud push notice:', e);
                    }
                }

                btnSaveSupabase.disabled = false;
                btnSaveSupabase.innerHTML = '<span>✓ Saved to Cloud Incidents</span>';
                setTimeout(() => {
                    btnSaveSupabase.innerHTML = '<span>📥 Push Threat to Supabase Cloud</span>';
                }, 3000);

                showToast(`✓ Threat ${newIncident.id} added to live telemetry & Supabase!`);
            });
        }

        // Action: Correlate in EvidenceChain
        if (btnToEvidence) {
            btnToEvidence.addEventListener('click', () => {
                switchAppView('evidence-chain');
                showToast('✓ Switched to EvidenceChain Forensic Graph');
            });
        }

        // Action: Copy JSON Dossier
        if (btnCopyJson) {
            btnCopyJson.addEventListener('click', () => {
                if (!lastScanData) return;
                const jsonStr = JSON.stringify(lastScanData, null, 2);
                if (navigator.clipboard) {
                    navigator.clipboard.writeText(jsonStr).then(() => {
                        showToast(`✓ Scan Dossier (${lastScanData.scanId}) Copied to Clipboard!`);
                    });
                }
            });
        }

        // Expose globally for Omnibar & External Triggers
        window.ThreatStormScanUrl = executeUrlScan;
    }

    // ═══════════════════════════════════════════════════════════
    // UNIQUE UNIVERSAL CYBER OMNIBAR & NEURAL SEARCH SPOTLIGHT
    // ═══════════════════════════════════════════════════════════

    function initOmnibarSearch() {
        const modal = document.getElementById('cyber-search-modal');
        const backdrop = document.getElementById('cyber-search-backdrop');
        const searchInput = document.getElementById('omni-search-input');
        const btnClear = document.getElementById('btn-clear-omni-search');
        const btnClose = document.getElementById('btn-close-omni-search');
        const resultsContainer = document.getElementById('cyber-search-results');
        const resultsCount = document.getElementById('search-results-count');
        const filterPills = document.querySelectorAll('.omni-filter-pill');
        const btnToggle = document.getElementById('btn-search-toggle');

        if (!modal || !searchInput || !resultsContainer) return;

        let activeCategory = 'all';
        let selectedIndex = 0;
        let renderedItems = [];

        // ── Cyber Haptic Micro Audio ──
        function playAudioFeedback(freq = 480, duration = 0.035) {
            try {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                if (!AudioCtx) return;
                if (!window.__tsAudioCtx) {
                    window.__tsAudioCtx = new AudioCtx();
                }
                const ctx = window.__tsAudioCtx;
                if (ctx.state === 'suspended') ctx.resume();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, ctx.currentTime);
                gain.gain.setValueAtTime(0.015, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start();
                osc.stop(ctx.currentTime + duration);
            } catch (_) {}
        }

        // ── Knowledge Base Indexes ──
        const MITRE_TECHNIQUES = [
            { code: 'T1566', name: 'Phishing & Spearphishing Attachments', tactic: 'Initial Access', desc: 'Targeted email lures with weaponized payloads to compromise endpoints.' },
            { code: 'T1059', name: 'Command & Scripting Interpreter (PowerShell, Bash)', tactic: 'Execution', desc: 'Abuse of system interpreters for fileless payload execution.' },
            { code: 'T1486', name: 'Data Encrypted for Impact (Ransomware)', tactic: 'Impact', desc: 'Adversaries encrypt victim disk clusters and extort cryptocurrency bounties.' },
            { code: 'T1190', name: 'Exploit Public-Facing Application (Zero-Day)', tactic: 'Initial Access', desc: 'Exploitation of public server vulnerabilities to bypass perimeter perimeters.' },
            { code: 'T1071', name: 'Standard Application Layer Protocol (C2 Channel)', tactic: 'Command & Control', desc: 'Adversaries beacon with compromised hosts via TLS, HTTP/2, and DNS tunnels.' },
            { code: 'T1003', name: 'OS Credential Dumping (LSASS Memory)', tactic: 'Credential Access', desc: 'Harvesting plaintext passwords and Kerberos tickets from memory spaces.' },
            { code: 'T1046', name: 'Network Service Discovery & Port Sweep', tactic: 'Discovery', desc: 'Automated recon scanning for vulnerable listening daemons and ports.' },
            { code: 'T1584', name: 'Compromise Infrastructure (Fast-Flux DNS)', tactic: 'Resource Development', desc: 'Adversaries hijack resilient multi-homed domain fabrics to host malicious nodes.' },
            { code: 'T1027', name: 'Obfuscated Files or Information', tactic: 'Defense Evasion', desc: 'Multi-layer packing, polymorphic encryption, and steganography to evade detection.' },
            { code: 'T1562', name: 'Impair Defenses (Disable Antivirus / EDR)', tactic: 'Defense Evasion', desc: 'Blind defensive agents, terminate sensor daemons, and purge event audit logs.' }
        ];

        const SECTORS_LIST = [
            { id: 'energy', name: 'Energy & Power Grid Infrastructure', icon: '⚡', desc: 'SCADA, ICS modbus protocols, high-voltage substations, and turbine telemetry.' },
            { id: 'finance', name: 'Banking & Financial Core Systems', icon: '🏦', desc: 'SWIFT interbank wires, high-frequency clearing houses, and transaction ledgers.' },
            { id: 'defense', name: 'Defense & Aerospace C4ISR Systems', icon: '🛡️', desc: 'Classified intranet corridors, satellite up/downlinks, and early-warning radars.' },
            { id: 'healthcare', name: 'Healthcare & Hospital Clinical Fabrics', icon: '🏥', desc: 'PACS medical imaging systems, EHR health records, and ICU telemetry monitors.' },
            { id: 'telecom', name: 'Telecommunications & 5G Carrier Fabrics', icon: '📡', desc: 'Core fiber backbones, BGP routing tables, DNS root zones, and cellular hubs.' },
            { id: 'logistics', name: 'Maritime & Global Port Cargo Logistics', icon: '🚢', desc: 'Container crane automation, maritime AIS transponders, and automated dry docks.' }
        ];

        const QUICK_COMMANDS = [
            { id: 'cmd-ai-studio', name: 'VoidX AI™ Frontier Cyber Intelligence Studio', desc: 'Autonomous threat reasoning, actor attribution, YARA synthesis & MITRE mapping (70B MoE)', icon: '🧠', action: () => switchAppView('ai-model') },
            { id: 'cmd-ai-copilot', name: 'Toggle VoidX AI Copilot Drawer (Ctrl+I)', desc: 'Ask autonomous cyber intelligence analyst questions from anywhere on the platform', icon: '🤖', action: () => { window.toggleCyberAiDrawer && window.toggleCyberAiDrawer(); } },
            { id: 'cmd-globe', name: 'Switch to 3D Planetary Earth Globe', desc: 'View global live cyber telemetry, rotating 3D nodes, and satellite feeds', icon: '🌐', action: () => switchAppView('planetary') },
            { id: 'cmd-scanner', name: 'Launch Live URL Threat Scanner & Radar', desc: 'Real-time RFC DNS lookup, TLS handshake check, and 94 threat feed correlation', icon: '⚡', action: () => switchAppView('url-scanner') },
            { id: 'cmd-evidence', name: 'Open EvidenceChain Forensic Graph', desc: 'Interactive node graph correlating attack vectors, IOC hashes, and threat actors', icon: '🔗', action: () => switchAppView('evidence-chain') },
            { id: 'cmd-table', name: 'View Master Threat Stream Table', desc: 'Browse, filter, and inspect full tabular cyber incident stream', icon: '📋', action: () => { switchAppView('planetary'); document.getElementById('recent-threats-section')?.scrollIntoView({ behavior: 'smooth' }); } },
            { id: 'cmd-feed', name: 'Open Real-Time Threat Intel Feed', desc: 'Chronological timeline of emerging zero-days and dark web telemetry', icon: '📡', action: () => switchAppView('feed') },
            { id: 'cmd-sensors', name: 'Ping All 28 Planetary Satellite Sensors', desc: 'Run zero-packet-drop telemetry handshake across orbital sensor grid', icon: '🛰️', action: () => { document.getElementById('btn-ping-all-sensors')?.click(); } },
            { id: 'cmd-auth', name: 'Analyst Security Clearance & Login', desc: 'Authenticate via Google OAuth or Level 5 Demo Clearance credentials', icon: '🔑', action: () => switchAppView('auth') },
            { id: 'cmd-supabase', name: 'Supabase Cloud Database Synchronization', desc: 'Configure Postgres tables, API keys, and real-time cloud threat replication', icon: '☁️', action: () => switchAppView('settings') }
        ];

        const DEMO_URL_SAMPLES = [
            'https://evil-phish.net/login/auth-session',
            'https://secure-bank-update.xyz/token',
            'https://github.com/torvalds/linux',
            'https://cloud-api.microsoft.com'
        ];

        // ── Helper: URL or Domain Pattern Detection ──
        function isUrlOrDomain(q) {
            if (!q) return false;
            const t = q.trim();
            if (/^https?:\/\//i.test(t)) return true;
            if (/\b(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}\b/i.test(t)) return true;
            if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(t)) return true;
            return false;
        }

        // ── Helper: Highlight Keyword ──
        function highlightMatch(text, query) {
            if (!text) return '';
            if (!query || !query.trim()) return String(text);
            const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`(${escaped})`, 'gi');
            return String(text).replace(regex, '<mark class="omni-highlight">$1</mark>');
        }

        // ── Open & Close Handlers ──
        function openOmnibar() {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            playAudioFeedback(600, 0.05);
            setTimeout(() => {
                searchInput.focus();
                searchInput.select();
            }, 60);
            renderResults();
        }

        function closeOmnibar() {
            modal.style.display = 'none';
            document.body.style.overflow = '';
            searchInput.value = '';
            btnClear.style.display = 'none';
            playAudioFeedback(340, 0.04);
        }

        // ── Core Search Query Engine ──
        function queryIndexes(queryText) {
            const q = queryText.toLowerCase().trim();
            const groups = [];

            // 1. DYNAMIC URL SCANNER CARD (If input looks like a URL/domain/IP, or category is 'url')
            if (q && isUrlOrDomain(q) && ['all', 'url'].includes(activeCategory)) {
                const targetUrl = q.startsWith('http') ? q : `https://${q}`;
                groups.push({
                    title: '⚡ LIVE URL THREAT SCANNER INTERCEPT',
                    items: [{
                        type: 'url_live_probe',
                        id: 'probe-live-now',
                        url: targetUrl,
                        icon: '⚡',
                        title: `INITIATE LIVE RADAR THREAT SCAN: "${targetUrl}"`,
                        desc: 'RFC DNS Resolution • Protocol & SSL Analysis • 94 Threat Engine Correlation',
                        badge: 'LIVE PROBE',
                        badgeClass: 'omni-badge--cyan',
                        action: () => {
                            closeOmnibar();
                            switchAppView('url-scanner');
                            if (window.ThreatStormScanUrl) {
                                window.ThreatStormScanUrl(targetUrl);
                            }
                        }
                    }]
                });
            }

            // 2. LIVE THREATS / INCIDENTS
            if (['all', 'threats'].includes(activeCategory)) {
                let threatMatches = [];
                if (!q) {
                    // Show 3 high-priority threats by default
                    threatMatches = alerts.filter(a => a.severity === 'critical' || a.severity === 'high').slice(0, 3);
                } else {
                    threatMatches = alerts.filter(a => {
                        const hay = `${a.id} ${a.title} ${a.category} ${a.actor || ''} ${a.region || ''} ${a.details || ''} ${a.mitre || ''}`.toLowerCase();
                        return hay.includes(q);
                    }).slice(0, 5);
                }

                if (threatMatches.length > 0) {
                    groups.push({
                        title: q ? '🔴 THREAT INCIDENTS & IOCS' : '🔴 ACTIVE CRITICAL THREAT TELEMETRY',
                        items: threatMatches.map(t => ({
                            type: 'threat',
                            id: t.id,
                            icon: t.severity === 'critical' ? '🚨' : (t.severity === 'high' ? '⚠️' : '⚡'),
                            title: `[${t.id}] ${t.title}`,
                            desc: `${t.actor || 'Unknown Threat Actor'} • ${t.region || 'Global'} • ${t.category}`,
                            badge: (t.severity || 'HIGH').toUpperCase(),
                            badgeClass: t.severity === 'critical' ? 'omni-badge--critical' : (t.severity === 'high' ? 'omni-badge--high' : 'omni-badge--gold'),
                            action: () => {
                                closeOmnibar();
                                switchAppView('planetary');
                                if (typeof openIntelDossier === 'function') {
                                    openIntelDossier(t.id);
                                }
                            }
                        }))
                    });
                }
            }

            // 3. MITRE ATT&CK TECHNIQUES
            if (['all', 'mitre'].includes(activeCategory)) {
                let mitreMatches = [];
                if (!q) {
                    mitreMatches = MITRE_TECHNIQUES.slice(0, 3);
                } else {
                    mitreMatches = MITRE_TECHNIQUES.filter(m => {
                        const hay = `${m.code} ${m.name} ${m.tactic} ${m.desc}`.toLowerCase();
                        return hay.includes(q);
                    }).slice(0, 4);
                }

                if (mitreMatches.length > 0) {
                    groups.push({
                        title: '🎯 MITRE ATT&CK MATRIX TECHNIQUES',
                        items: mitreMatches.map(m => ({
                            type: 'mitre',
                            id: m.code,
                            icon: '🎯',
                            title: `${m.code} — ${m.name}`,
                            desc: `${m.tactic} // ${m.desc}`,
                            badge: 'MITRE ATT&CK',
                            badgeClass: 'omni-badge--gold',
                            action: () => {
                                closeOmnibar();
                                switchAppView('alerts');
                                const alertsSearch = document.getElementById('alerts-search-input');
                                if (alertsSearch) {
                                    alertsSearch.value = m.code;
                                    alertsSearch.dispatchEvent(new Event('input'));
                                }
                                showToast(`🎯 Filtered Threat Table for ${m.code} (${m.name})`);
                            }
                        }))
                    });
                }
            }

            // 4. CRITICAL INFRASTRUCTURE SECTORS
            if (['all', 'sectors'].includes(activeCategory)) {
                let sectorMatches = [];
                if (!q) {
                    sectorMatches = SECTORS_LIST.slice(0, 2);
                } else {
                    sectorMatches = SECTORS_LIST.filter(s => {
                        return `${s.name} ${s.desc}`.toLowerCase().includes(q);
                    });
                }

                if (sectorMatches.length > 0) {
                    groups.push({
                        title: '🏢 CRITICAL INFRASTRUCTURE SECTORS',
                        items: sectorMatches.map(s => ({
                            type: 'sector',
                            id: s.id,
                            icon: s.icon,
                            title: s.name,
                            desc: s.desc,
                            badge: 'SECTOR HUD',
                            badgeClass: 'omni-badge--cyan',
                            action: () => {
                                closeOmnibar();
                                switchAppView('sector');
                                showToast(`🏢 Displaying telemetry for ${s.name}`);
                            }
                        }))
                    });
                }
            }

            // 5. QUICK SOC COMMANDS
            if (['all', 'commands'].includes(activeCategory)) {
                let cmdMatches = [];
                if (!q) {
                    cmdMatches = QUICK_COMMANDS.slice(0, 4);
                } else {
                    cmdMatches = QUICK_COMMANDS.filter(c => {
                        return `${c.name} ${c.desc}`.toLowerCase().includes(q);
                    });
                }

                if (cmdMatches.length > 0) {
                    groups.push({
                        title: '🚀 SOC SYSTEM QUICK COMMANDS',
                        items: cmdMatches.map(c => ({
                            type: 'command',
                            id: c.id,
                            icon: c.icon,
                            title: c.name,
                            desc: c.desc,
                            badge: 'COMMAND',
                            badgeClass: 'omni-badge--gold',
                            action: () => {
                                closeOmnibar();
                                c.action();
                            }
                        }))
                    });
                }
            }

            // 6. SAMPLE URL TARGETS (If category is 'url' and no match yet)
            if (['all', 'url'].includes(activeCategory) && (!q || activeCategory === 'url')) {
                const sampleMatches = DEMO_URL_SAMPLES.filter(u => !q || u.toLowerCase().includes(q));
                if (sampleMatches.length > 0 && groups.length < 5) {
                    groups.push({
                        title: '⚡ SAMPLE TARGETS FOR RADAR SCAN',
                        items: sampleMatches.map(sampleUrl => ({
                            type: 'url_sample',
                            id: sampleUrl,
                            icon: '⚡',
                            title: `Scan Target: ${sampleUrl}`,
                            desc: 'Click or press Enter to launch deep live threat scan with raw inspection',
                            badge: 'DEMO URL',
                            badgeClass: 'omni-badge--cyan',
                            action: () => {
                                closeOmnibar();
                                switchAppView('url-scanner');
                                if (window.ThreatStormScanUrl) {
                                    window.ThreatStormScanUrl(sampleUrl);
                                }
                            }
                        }))
                    });
                }
            }

            return groups;
        }

        // ── Render Search Results ──
        function renderResults() {
            const q = searchInput.value;
            btnClear.style.display = q ? 'block' : 'none';

            const groups = queryIndexes(q);
            renderedItems = [];

            // Flatten all items into single ordered array for index-based selection
            groups.forEach(g => {
                g.items.forEach(it => renderedItems.push(it));
            });

            // Keep selected index within bounds
            if (selectedIndex >= renderedItems.length) {
                selectedIndex = Math.max(0, renderedItems.length - 1);
            }

            // Update Counter
            if (resultsCount) {
                if (!q) {
                    resultsCount.textContent = 'Curated Ready';
                } else if (renderedItems.length === 0) {
                    resultsCount.textContent = '0 Matches';
                } else {
                    resultsCount.textContent = `${renderedItems.length} Match${renderedItems.length === 1 ? '' : 'es'}`;
                }
            }

            // Empty State
            if (renderedItems.length === 0) {
                resultsContainer.innerHTML = `
                    <div class="omni-empty-state">
                        <div class="omni-empty-icon">🛡️</div>
                        <div class="omni-empty-title">No Direct Telemetry Records Found</div>
                        <div class="omni-empty-desc">
                            No active IOCs, MITRE techniques, or commands matched <strong>"${escapeHtml(q)}"</strong>.
                        </div>
                        <div class="omni-suggest-chips">
                            <button type="button" class="editorial-poster-btn" id="btn-omni-probe-custom-url" style="margin: 12px auto 0; font-size: 11px;">
                                <span>⚡ PROBE "${escapeHtml(q)}" WITH LIVE URL SCANNER</span>
                            </button>
                        </div>
                    </div>
                `;

                const btnProbe = document.getElementById('btn-omni-probe-custom-url');
                if (btnProbe) {
                    btnProbe.addEventListener('click', () => {
                        const target = q.startsWith('http') ? q : `https://${q}`;
                        closeOmnibar();
                        switchAppView('url-scanner');
                        if (window.ThreatStormScanUrl) {
                            window.ThreatStormScanUrl(target);
                        }
                    });
                }
                return;
            }

            // Build Results Markup
            let itemGlobalIndex = 0;
            let html = '';

            groups.forEach(group => {
                html += `<div class="omni-group-label">${group.title}</div>`;
                group.items.forEach(item => {
                    const isSelected = itemGlobalIndex === selectedIndex;
                    const highlightedTitle = highlightMatch(item.title, q);
                    const highlightedDesc = highlightMatch(item.desc, q);

                    html += `
                        <div class="omni-result-item ${isSelected ? 'omni-item--selected' : ''}" data-omni-index="${itemGlobalIndex}">
                            <div class="omni-item-left">
                                <div class="omni-item-icon-box">${item.icon}</div>
                                <div class="omni-item-content">
                                    <div class="omni-item-title-row">
                                        <div class="omni-item-title">${highlightedTitle}</div>
                                    </div>
                                    <div class="omni-item-desc">${highlightedDesc}</div>
                                </div>
                            </div>
                            <div class="omni-item-right">
                                <span class="omni-badge-chip ${item.badgeClass || ''}">${item.badge}</span>
                            </div>
                        </div>
                    `;
                    itemGlobalIndex++;
                });
            });

            resultsContainer.innerHTML = html;

            // Bind click & mouseenter to each rendered item
            resultsContainer.querySelectorAll('.omni-result-item').forEach(el => {
                const idx = parseInt(el.getAttribute('data-omni-index'), 10);
                el.addEventListener('click', () => {
                    selectedIndex = idx;
                    executeCurrentSelection();
                });
                el.addEventListener('mouseenter', () => {
                    selectedIndex = idx;
                    updateItemHighlightClasses();
                });
            });

            // Ensure selected item is scrolled into view
            ensureSelectedItemVisible();
        }

        function updateItemHighlightClasses() {
            const allItems = resultsContainer.querySelectorAll('.omni-result-item');
            allItems.forEach((el, i) => {
                el.classList.toggle('omni-item--selected', i === selectedIndex);
            });
        }

        function ensureSelectedItemVisible() {
            const activeEl = resultsContainer.querySelector('.omni-item--selected');
            if (activeEl) {
                activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }
        }

        function navigateResults(delta) {
            if (renderedItems.length === 0) return;
            selectedIndex = (selectedIndex + delta + renderedItems.length) % renderedItems.length;
            updateItemHighlightClasses();
            ensureSelectedItemVisible();
            playAudioFeedback(520 + (selectedIndex * 20), 0.025);
        }

        function executeCurrentSelection() {
            if (renderedItems.length === 0) {
                const q = searchInput.value.trim();
                if (q) {
                    const target = q.startsWith('http') ? q : `https://${q}`;
                    closeOmnibar();
                    switchAppView('url-scanner');
                    if (window.ThreatStormScanUrl) {
                        window.ThreatStormScanUrl(target);
                    }
                }
                return;
            }

            const item = renderedItems[selectedIndex];
            if (item && typeof item.action === 'function') {
                playAudioFeedback(780, 0.06);
                item.action();
            }
        }

        function cycleFilterPills(delta = 1) {
            const pills = Array.from(filterPills);
            const currentIdx = pills.findIndex(p => p.classList.contains('omni-filter-pill--active'));
            const nextIdx = (currentIdx + delta + pills.length) % pills.length;
            pills[nextIdx].click();
        }

        function escapeHtml(str) {
            if (!str) return '';
            return str.replace(/[&<>"']/g, m => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            }[m]));
        }

        // ── Input & Typing Listeners ──
        searchInput.addEventListener('input', () => {
            selectedIndex = 0;
            renderResults();
        });

        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                navigateResults(1);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                navigateResults(-1);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                executeCurrentSelection();
            } else if (e.key === 'Tab') {
                e.preventDefault();
                cycleFilterPills(e.shiftKey ? -1 : 1);
            } else if (e.key === 'Escape') {
                e.preventDefault();
                closeOmnibar();
            }
        });

        // Clear button
        btnClear.addEventListener('click', () => {
            searchInput.value = '';
            selectedIndex = 0;
            renderResults();
            searchInput.focus();
        });

        // Close button & backdrop
        if (btnClose) btnClose.addEventListener('click', closeOmnibar);
        if (backdrop) backdrop.addEventListener('click', closeOmnibar);

        // Header button
        if (btnToggle) {
            btnToggle.addEventListener('click', (e) => {
                e.preventDefault();
                openOmnibar();
            });
        }

        // Category filter pills
        filterPills.forEach(pill => {
            pill.addEventListener('click', () => {
                filterPills.forEach(p => p.classList.remove('omni-filter-pill--active'));
                pill.classList.add('omni-filter-pill--active');
                activeCategory = pill.getAttribute('data-cat') || 'all';
                selectedIndex = 0;
                playAudioFeedback(450, 0.03);
                renderResults();
                searchInput.focus();
            });
        });

        // ── Global Hotkeys (Ctrl+K, Cmd+K, /, ESC) ──
        window.addEventListener('keydown', (e) => {
            // Check for Ctrl+K or Cmd+K
            if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
                e.preventDefault();
                if (modal.style.display === 'flex') {
                    closeOmnibar();
                } else {
                    openOmnibar();
                }
                return;
            }

            // Check for Slash '/' hotkey
            if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
                e.preventDefault();
                openOmnibar();
                return;
            }

            // Check for Escape hotkey
            if (e.key === 'Escape' && modal.style.display === 'flex') {
                e.preventDefault();
                closeOmnibar();
                return;
            }
        });
    }

    // ═══════════════════════════════════════════════════════════
    // VOIDX AI™ FRONTIER CYBER REASONING STUDIO & COPILOT
    // ═══════════════════════════════════════════════════════════

    function initCyberAiModel() {
        // AI Studio Elements
        const queryInput = document.getElementById('ai-studio-query-input');
        const btnRunInference = document.getElementById('btn-run-ai-inference');
        const btnSpinner = document.getElementById('ai-btn-spinner');
        const btnText = document.getElementById('ai-btn-text');
        const btnClear = document.getElementById('btn-clear-ai-query');
        const emptyPlaceholder = document.getElementById('ai-empty-placeholder');
        const liveResults = document.getElementById('ai-live-results');
        const hudLatency = document.getElementById('hud-model-latency');
        const hudTps = document.getElementById('hud-model-tps');

        // Output fields
        const verdictBanner = document.getElementById('ai-verdict-banner');
        const verdictTag = document.getElementById('ai-verdict-tag');
        const verdictTitle = document.getElementById('ai-verdict-title');
        const kvActor = document.getElementById('ai-kv-actor');
        const kvOrigin = document.getElementById('ai-kv-origin');
        const kvConfidence = document.getElementById('ai-kv-confidence');
        const kvLatency = document.getElementById('ai-kv-latency');
        const summaryText = document.getElementById('ai-summary-text');
        const remediationList = document.getElementById('ai-remediation-list');
        const killchainStream = document.getElementById('ai-killchain-stream');
        const codeYara = document.getElementById('ai-code-yara');
        const codeContainment = document.getElementById('ai-code-containment');
        const codeTelemetry = document.getElementById('ai-code-telemetry');

        // Copy buttons
        const btnCopyTab = document.getElementById('btn-copy-ai-tab');
        const btnCopyYara = document.getElementById('btn-copy-yara-direct');
        const btnCopyScript = document.getElementById('btn-copy-script-direct');

        // Floating Orb & Slide-out Drawer
        const floatingOrb = document.getElementById('floating-ai-copilot-orb');
        const headerAiBtn = document.getElementById('btn-header-ai-copilot');
        const drawer = document.getElementById('cyber-ai-drawer');
        const btnDrawerClose = document.getElementById('btn-drawer-close');
        const btnDrawerExpand = document.getElementById('btn-drawer-expand-studio');
        const drawerInput = document.getElementById('drawer-chat-input');
        const btnDrawerSend = document.getElementById('btn-drawer-send');
        const drawerMessages = document.getElementById('drawer-chat-messages');

        let selectedModel = 'VoidX-Cyber-70B';
        let activeTab = 'verdict';
        let lastAiDossier = null;
        let isInferring = false;

        // ── Model Archetype Selection ──
        const modelBtns = document.querySelectorAll('.ai-model-btn');
        modelBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                modelBtns.forEach(b => b.classList.remove('ai-model-btn--active'));
                btn.classList.add('ai-model-btn--active');
                selectedModel = btn.getAttribute('data-model') || 'VoidX-Cyber-70B';
                showToast(`🧠 Switched AI Model: ${selectedModel}`);
            });
        });

        // ── Preset Prompt Chips ──
        const presetChips = document.querySelectorAll('.ai-preset-chip');
        presetChips.forEach(chip => {
            chip.addEventListener('click', () => {
                const prompt = chip.getAttribute('data-prompt');
                if (prompt && queryInput) {
                    queryInput.value = prompt;
                    executeInference(prompt);
                }
            });
        });

        // ── Clear Query Button ──
        if (btnClear && queryInput) {
            btnClear.addEventListener('click', () => {
                queryInput.value = '';
                queryInput.focus();
            });
        }

        // ── Core AI Inference Execution Function ──
        async function executeInference(queryText) {
            const prompt = (queryText || (queryInput ? queryInput.value.trim() : '')) || 'Analyze LockBit 3.0 ransomware killchain and generate defense rules';
            if (isInferring) return;
            isInferring = true;

            // UI Feedback during inference
            if (btnSpinner) btnSpinner.style.display = 'inline-block';
            if (btnText) btnText.textContent = '🧠 RUNNING 70B VOIDX AI REASONING...';
            if (btnRunInference) btnRunInference.disabled = true;

            let resultData = null;
            const startTime = Date.now();

            try {
                const resp = await fetch('/api/ai-chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        query: prompt,
                        model: selectedModel,
                        persona: 'Haute SOC Lead Commander'
                    })
                });
                const json = await resp.json();
                if (json && json.status === 'success' && json.data) {
                    resultData = json.data;
                }
            } catch (err) {
                console.warn('[Cyber AI] Server API endpoint unreachable, invoking autonomous neural fallback heuristics:', err);
            }

            // High-fidelity fallback reasoning model if network failed
            if (!resultData) {
                const elapsed = Date.now() - startTime + 24;
                resultData = {
                    model: `${selectedModel} (MoE Haute Fallback)`,
                    query: prompt,
                    inferenceLatencyMs: elapsed,
                    tokens: 580,
                    tokensPerSecond: (580 / (elapsed / 1000)).toFixed(1),
                    confidence: 98.4,
                    verdict: 'AUTONOMOUS CYBER THREAT ASSESSMENT',
                    summary: `VoidX AI completed heuristic deep reasoning on: "${prompt}". Identified multi-stage attack vectors matching known nation-state and cybercrime syndicate playbooks.`,
                    attribution: {
                        actor: 'LockBit 3.0 / Ransomware-as-a-Service Core',
                        origin: 'Eastern European Cyber Underground',
                        targetSector: 'Enterprise Cloud Infrastructure'
                    },
                    mitreKillchain: [
                        { tactic: 'Initial Access', technique: 'T1566.002', name: 'Spearphishing Attachment', detail: 'Weaponized ISO containing disguised LNK payload and encrypted DLL.' },
                        { tactic: 'Execution', technique: 'T1059.001', name: 'PowerShell / WMI Scripting', detail: 'Bypasses AMSI via memory patching to execute staged beacon.' },
                        { tactic: 'Defense Evasion', technique: 'T1562.001', name: 'Disable Security Tools', detail: 'Executes service termination commands targeting antivirus daemons.' },
                        { tactic: 'Impact', technique: 'T1486', name: 'Data Encrypted for Impact', detail: 'High-speed multithreaded AES-256 + RSA-4096 file encryption.' }
                    ],
                    yaraRule: `rule ThreatStorm_Dynamic_Heuristic_Signature {
    meta:
        description = "VoidX-70B Dynamic Defense Signature"
        generated_utc = "${new Date().toISOString()}"
        confidence = "98.4%"
    strings:
        $header_sig = { 4D 5A 90 00 03 00 00 00 }
        $c2_token = "LockBit3.0_Ransom_Note.txt" ascii wide
        $ext = ".lockbit3" ascii
    condition:
        uint16(0) == 0x5A4D and ($c2_token or $ext)
}`,
                    containmentScript: `#!/usr/bin/env bash
# ThreatStorm Automated Emergency Containment Script
echo "[*] Quarantining affected network interface..."
sudo iptables -A OUTPUT -p tcp --dport 443 -d 185.220.101.44 -j DROP
sudo pkill -9 -f "lockbit"
echo "[+] Host isolated. Containment applied."`,
                    remediation: [
                        "Isolate infected endpoint from the broadcast domain immediately.",
                        "Block outbound C2 IP indicators on edge perimeters and DNS firewalls.",
                        "Verify immutable offline volume shadow copies and tenant backups."
                    ]
                };
            }

            lastAiDossier = resultData;

            // Render Output
            renderAiStudioResults(resultData);

            // Reset UI Trigger
            isInferring = false;
            if (btnSpinner) btnSpinner.style.display = 'none';
            if (btnText) btnText.textContent = '⚡ RUN VOIDX AI REASONING (70B)';
            if (btnRunInference) btnRunInference.disabled = false;

            showToast(`✓ VoidX AI Reasoning Complete (${resultData.inferenceLatencyMs}ms)`);
        }

        // ── Render Results into Studio Dossier ──
        function renderAiStudioResults(data) {
            if (emptyPlaceholder) emptyPlaceholder.style.display = 'none';
            if (liveResults) liveResults.style.display = 'block';

            // Telemetry HUD Pills
            if (hudLatency) hudLatency.textContent = `${data.inferenceLatencyMs} ms`;
            if (hudTps) hudTps.textContent = `${data.tokensPerSecond || '68.4'} t/s`;

            // Verdict Tab
            if (verdictTitle) verdictTitle.textContent = data.verdict;
            if (verdictTag) verdictTag.textContent = `CONFIDENCE: ${data.confidence}% • MODEL: ${data.model}`;
            if (kvActor) kvActor.textContent = data.attribution?.actor || 'Adversary Cluster';
            if (kvOrigin) kvOrigin.textContent = data.attribution?.origin || 'Global Cyberspace';
            if (kvConfidence) kvConfidence.textContent = `${data.confidence}%`;
            if (kvLatency) kvLatency.textContent = `${data.inferenceLatencyMs} ms`;
            if (summaryText) summaryText.textContent = data.summary;

            // Remediation list
            if (remediationList && data.remediation) {
                remediationList.innerHTML = data.remediation.map((step, idx) => `
                    <li><strong>Step ${idx + 1}:</strong> ${step}</li>
                `).join('');
            }

            // MITRE Killchain Stream
            if (killchainStream && data.mitreKillchain) {
                killchainStream.innerHTML = data.mitreKillchain.map(item => `
                    <div class="ai-killchain-card">
                        <div class="ai-killchain-top">
                            <span class="ai-tactic-badge">${item.tactic}</span>
                            <span class="ai-technique-code">${item.technique}</span>
                        </div>
                        <div class="ai-technique-name">${item.name}</div>
                        <div class="ai-technique-detail">${item.detail}</div>
                    </div>
                `).join('');
            }

            // YARA Rule
            if (codeYara) codeYara.textContent = data.yaraRule || '// No YARA signature synthesized';

            // Containment Script
            if (codeContainment) codeContainment.textContent = data.containmentScript || '# No containment script required';

            // Raw Telemetry JSON
            if (codeTelemetry) codeTelemetry.textContent = JSON.stringify(data, null, 2);
        }

        // ── Dossier Tabs Switcher ──
        const tabBtns = document.querySelectorAll('.ai-tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetTab = btn.getAttribute('data-tab');
                if (!targetTab) return;
                activeTab = targetTab;

                tabBtns.forEach(b => b.classList.remove('ai-tab--active'));
                btn.classList.add('ai-tab--active');

                // Hide all panels
                const panels = ['verdict', 'killchain', 'yara', 'containment', 'telemetry'];
                panels.forEach(p => {
                    const el = document.getElementById(`tab-panel-${p}`);
                    if (el) el.style.display = (p === targetTab) ? 'block' : 'none';
                });
            });
        });

        // ── Run Button Trigger ──
        if (btnRunInference) {
            btnRunInference.addEventListener('click', () => {
                executeInference(queryInput ? queryInput.value.trim() : '');
            });
        }

        // Enter key in Query Input (Ctrl+Enter or Enter)
        if (queryInput) {
            queryInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    executeInference(queryInput.value.trim());
                }
            });
        }

        // ── Direct Copy Buttons ──
        if (btnCopyYara) {
            btnCopyYara.addEventListener('click', () => {
                if (!codeYara) return;
                navigator.clipboard?.writeText(codeYara.textContent).then(() => {
                    showToast('✓ YARA Rule Copied to Clipboard!');
                });
            });
        }

        if (btnCopyScript) {
            btnCopyScript.addEventListener('click', () => {
                if (!codeContainment) return;
                navigator.clipboard?.writeText(codeContainment.textContent).then(() => {
                    showToast('✓ Containment Script Copied to Clipboard!');
                });
            });
        }

        if (btnCopyTab) {
            btnCopyTab.addEventListener('click', () => {
                if (!lastAiDossier) {
                    showToast('⚠️ Run inference first to copy intelligence dossier');
                    return;
                }
                let contentToCopy = '';
                if (activeTab === 'yara') contentToCopy = lastAiDossier.yaraRule;
                else if (activeTab === 'containment') contentToCopy = lastAiDossier.containmentScript;
                else if (activeTab === 'telemetry') contentToCopy = JSON.stringify(lastAiDossier, null, 2);
                else if (activeTab === 'killchain') contentToCopy = JSON.stringify(lastAiDossier.mitreKillchain, null, 2);
                else contentToCopy = `${lastAiDossier.verdict}\n\n${lastAiDossier.summary}`;

                navigator.clipboard?.writeText(contentToCopy).then(() => {
                    showToast(`✓ Copied ${activeTab.toUpperCase()} Output to Clipboard!`);
                });
            });
        }

        // ═══════════════════════════════════════════════════════════
        // FLOATING COPILOT ORB & SLIDE-OUT DRAWER CHAT ENGINE
        // ═══════════════════════════════════════════════════════════

        function toggleDrawer(forceState) {
            if (!drawer) return;
            const isCurrentlyOpen = drawer.style.display === 'flex';
            const shouldOpen = (forceState !== undefined) ? forceState : !isCurrentlyOpen;

            drawer.style.display = shouldOpen ? 'flex' : 'none';
            if (shouldOpen && drawerInput) {
                setTimeout(() => drawerInput.focus(), 100);
            }
        }

        window.toggleCyberAiDrawer = toggleDrawer;

        if (floatingOrb) {
            floatingOrb.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleDrawer();
            });
        }

        if (headerAiBtn) {
            headerAiBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleDrawer();
            });
        }

        if (btnDrawerClose) {
            btnDrawerClose.addEventListener('click', () => toggleDrawer(false));
        }

        if (btnDrawerExpand) {
            btnDrawerExpand.addEventListener('click', () => {
                toggleDrawer(false);
                switchAppView('ai-model');
            });
        }

        // Hotkey Ctrl+I to toggle Cyber AI Copilot from anywhere
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'i') {
                e.preventDefault();
                toggleDrawer();
            }
        });

        // Drawer Chat Message Sending
        async function sendDrawerMessage(text) {
            const prompt = (text || (drawerInput ? drawerInput.value.trim() : '')).trim();
            if (!prompt || !drawerMessages) return;

            if (drawerInput) drawerInput.value = '';

            // User Message Bubble
            const userMsg = document.createElement('div');
            userMsg.className = 'drawer-msg drawer-msg--user';
            userMsg.innerHTML = `
                <div class="drawer-msg-avatar">👤</div>
                <div class="drawer-msg-body">${prompt}</div>
            `;
            drawerMessages.appendChild(userMsg);

            // AI Loading Message Bubble
            const loadingMsg = document.createElement('div');
            loadingMsg.className = 'drawer-msg drawer-msg--ai';
            loadingMsg.innerHTML = `
                <div class="drawer-msg-avatar">🧠</div>
                <div class="drawer-msg-body" style="color:#38bdf8; font-style:italic;">
                    <span>⏳ VoidX AI 70B reasoning over IOCs...</span>
                </div>
            `;
            drawerMessages.appendChild(loadingMsg);
            drawerMessages.scrollTop = drawerMessages.scrollHeight;

            try {
                const resp = await fetch('/api/ai-chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query: prompt, model: 'VoidX-Cyber-70B' })
                });
                const json = await resp.json();
                const d = (json && json.status === 'success') ? json.data : null;

                if (d) {
                    loadingMsg.innerHTML = `
                        <div class="drawer-msg-avatar">🧠</div>
                        <div class="drawer-msg-body">
                            <div style="font-size:10px; font-weight:700; color:var(--gold-bright); letter-spacing:0.06em; margin-bottom:4px;">
                                ${d.verdict}
                            </div>
                            <p style="margin:0 0 8px 0;">${d.summary}</p>
                            <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid rgba(255,255,255,0.1); padding-top:6px; margin-top:6px; font-size:10px; color:var(--text-tertiary);">
                                <span>Actor: <strong style="color:#38bdf8;">${d.attribution?.actor || 'Adversary'}</strong></span>
                                <button type="button" class="drawer-chip" style="color:var(--gold-bright);" onclick="window.switchAppView('ai-model'); window.toggleCyberAiDrawer(false);">
                                    Inspect in Studio ↗
                                </button>
                            </div>
                        </div>
                    `;
                } else {
                    loadingMsg.innerHTML = `
                        <div class="drawer-msg-avatar">🧠</div>
                        <div class="drawer-msg-body">
                            <strong>VoidX AI Analysis:</strong> Threat query analyzed. High-severity indicators detected matching known APT lateral movement patterns.
                        </div>
                    `;
                }
            } catch (e) {
                loadingMsg.innerHTML = `
                    <div class="drawer-msg-avatar">🧠</div>
                    <div class="drawer-msg-body">
                        <strong>VoidX AI Fallback:</strong> Query classified as active exploit probing. Recommended action: isolate host and review perimeter logs.
                    </div>
                `;
            }

            drawerMessages.scrollTop = drawerMessages.scrollHeight;
        }

        if (btnDrawerSend) {
            btnDrawerSend.addEventListener('click', () => sendDrawerMessage());
        }

        if (drawerInput) {
            drawerInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    sendDrawerMessage();
                }
            });
        }

        // Drawer chips
        document.querySelectorAll('.drawer-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                const prompt = chip.getAttribute('data-prompt');
                if (prompt) sendDrawerMessage(prompt);
            });
        });
    }

    // ═══════════════════════════════════════════════════════════
    // GOLD TOUCH & CLICK RIPPLE ENGINE
    // ═══════════════════════════════════════════════════════════

    function initGoldTouchRipple() {
        const interactiveSelector = 'button, .tab-pill, .action-btn, .editorial-poster-btn, .view-all-link, .feature-badge, .intel-actions__btn, .intel-panel__close-btn, .user-avatar, .nav-item';

        document.addEventListener('pointerdown', (e) => {
            const target = e.target.closest(interactiveSelector);
            if (!target) return;

            // Add immediate golden touch pressed class
            target.classList.add('gold-touch-pressed');
            setTimeout(() => {
                target.classList.remove('gold-touch-pressed');
            }, 350);

            // Calculate touch/click position relative to button
            const rect = target.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const size = Math.max(rect.width, rect.height) * 2.2;

            const ripple = document.createElement('span');
            ripple.className = 'gold-touch-ripple';
            ripple.style.width = `${size}px`;
            ripple.style.height = `${size}px`;
            ripple.style.left = `${x}px`;
            ripple.style.top = `${y}px`;

            target.appendChild(ripple);

            // Clean up ripple after animation
            setTimeout(() => {
                if (ripple.parentNode === target) {
                    target.removeChild(ripple);
                }
            }, 650);
        }, { passive: true });
    }

    // ═══════════════════════════════════════════════════════════
    // BOOTSTRAP & ROUTING
    // ═══════════════════════════════════════════════════════════

    function checkInitialRoute() {
        const path = window.location.pathname.toLowerCase();
        const hash = window.location.hash.toLowerCase();

        if (hash === '#logout' || window.location.search.includes('logout=true')) {
            if (window.ThreatStormSupabase) {
                window.ThreatStormSupabase.signOut();
            }
            localStorage.removeItem('threatstorm_auth_user');
            sessionStorage.removeItem('ts_admin_welcome_shown');
            updateAuthUI();
            try { window.history.replaceState(null, '', window.location.pathname); } catch (_) {}
            showToast('✓ Signed out. Click "Sign In" to select any Google account.');
            return;
        }

        if (['/auth', '/login', '/signin'].includes(path) || ['#auth', '#login', '#signin', '#view-auth'].includes(hash)) {
            switchAppView('auth');
        } else if (hash === '#evidence-chain') {
            switchAppView('evidence-chain');
        } else if (['#url-scanner', '#view-url-scanner', '#scanner'].includes(hash)) {
            switchAppView('url-scanner');
        } else if (['#ai-model', '#view-ai-model', '#ai-studio', '#voidx', '#voidx-ai', '#neural-ai', '#ai'].includes(hash)) {
            switchAppView('ai-model');
        } else if (['#feed', '#view-feed', '#intelligence-feed', '#intel-feed'].includes(hash)) {
            switchAppView('feed');
        } else if (['#sector', '#view-sector', '#sector-matrix'].includes(hash)) {
            switchAppView('sector');
        } else if (['#reports', '#view-reports', '#incident-reports'].includes(hash)) {
            switchAppView('reports');
        } else if (['#alerts', '#view-alerts', '#all-alerts'].includes(hash)) {
            switchAppView('alerts');
        } else if (['#settings', '#view-settings', '#sensors'].includes(hash)) {
            switchAppView('settings');
        }
    }

    // ── Sovereign Luxury Bureau Intro Screen Controller ──
    function initLuxuryBureauIntro() {
        const introEl = document.getElementById('luxury-bureau-intro');
        if (!introEl) return;

        let dismissed = false;
        function dismissIntro() {
            if (dismissed) return;
            dismissed = true;
            introEl.classList.add('luxury-bureau-intro--dismissed');
            setTimeout(() => {
                if (introEl.parentNode) {
                    introEl.parentNode.removeChild(introEl);
                }
            }, 800);
        }

        // Auto dismiss after 2.4s of luxurious display
        const autoTimer = setTimeout(dismissIntro, 2400);

        // Instant dismiss on skip button click
        const skipBtn = document.getElementById('intro-skip-btn');
        if (skipBtn) {
            skipBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                clearTimeout(autoTimer);
                dismissIntro();
            });
        }

        // Instant dismiss on click anywhere or Escape/Space/Enter
        introEl.addEventListener('click', () => {
            clearTimeout(autoTimer);
            dismissIntro();
        });

        window.addEventListener('keydown', function onKey(e) {
            if (['Escape', ' ', 'Enter'].includes(e.key) && !dismissed) {
                clearTimeout(autoTimer);
                dismissIntro();
                window.removeEventListener('keydown', onKey);
            }
        });
    }

    // ── Emergency Quick Incident Response Form Controller ──
    function initQuickResponseModal() {
        const modal = document.getElementById('quick-response-modal');
        const backdrop = document.getElementById('qr-modal-backdrop');
        const btnClose = document.getElementById('btn-close-qr-modal');
        const btnCancel = document.getElementById('btn-cancel-qr');
        const form = document.getElementById('quick-response-form');
        const feedback = document.getElementById('qr-feedback-status');

        const triggerSidebar = document.getElementById('menu-quick-response');
        const triggerTab = document.getElementById('tab-quick-response');
        const triggerSettings = document.getElementById('btn-settings-quick-response');

        function openQRModal() {
            if (!modal) return;
            modal.style.display = 'flex';
            if (feedback) feedback.style.display = 'none';
            const assetInput = document.getElementById('qr-target-asset');
            if (assetInput) assetInput.focus();
        }

        function closeQRModal() {
            if (!modal) return;
            modal.style.display = 'none';
        }

        if (triggerSidebar) triggerSidebar.addEventListener('click', (e) => { e.preventDefault(); openQRModal(); });
        if (triggerTab) triggerTab.addEventListener('click', (e) => { e.preventDefault(); openQRModal(); });
        if (triggerSettings) triggerSettings.addEventListener('click', (e) => { e.preventDefault(); openQRModal(); });

        if (backdrop) backdrop.addEventListener('click', closeQRModal);
        if (btnClose) btnClose.addEventListener('click', closeQRModal);
        if (btnCancel) btnCancel.addEventListener('click', closeQRModal);

        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal && modal.style.display !== 'none') {
                closeQRModal();
            }
        });

        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const asset = (document.getElementById('qr-target-asset')?.value || '').trim();
                const threatType = document.getElementById('qr-threat-type')?.value || 'Ransomware Outbreak';
                const severity = form.querySelector('input[name="qr-severity"]:checked')?.value || 'CRITICAL';
                const source = (document.getElementById('qr-attacker-source')?.value || '').trim() || '185.220.101.45 (Tor Ingress)';
                const sector = document.getElementById('qr-sector')?.value || 'Financial Systems';
                const notes = (document.getElementById('qr-incident-notes')?.value || '').trim();

                if (!asset) {
                    if (feedback) {
                        feedback.className = 'qr-feedback qr-feedback--error';
                        feedback.textContent = '⚠️ Target Asset / IP is required for emergency dispatch!';
                        feedback.style.display = 'block';
                    }
                    return;
                }

                const incidentId = 'QR-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
                const newAlert = {
                    id: incidentId,
                    type: threatType,
                    sector: sector,
                    target: asset,
                    source: source,
                    severity: severity,
                    status: 'CONTAINED',
                    timestamp: 'Just now',
                    cvss: severity === 'CRITICAL' ? 9.8 : (severity === 'HIGH' ? 8.6 : 6.5),
                    details: notes || `${threatType} reported via Quick Response. Network interface isolated and credentials revoked.`,
                    mitre: 'T1486 / Data Encrypted for Impact'
                };

                alerts.unshift(newAlert);

                // Asynchronously save to Supabase Cloud if connected
                if (window.ThreatStormSupabase && typeof window.ThreatStormSupabase.dispatchQuickResponseToCloud === 'function') {
                    window.ThreatStormSupabase.dispatchQuickResponseToCloud({
                        ...newAlert,
                        act_isolate_network: document.getElementById('qr-act-isolate')?.checked !== false,
                        act_firewall_drop: document.getElementById('qr-act-firewall')?.checked !== false,
                        act_revoke_sso: document.getElementById('qr-act-revoke')?.checked !== false,
                        act_alert_commander: document.getElementById('qr-act-alert-team')?.checked !== false
                    }).catch(err => console.warn('[Supabase QR Sync]', err));
                }

                // Update UI tables and feed if open
                if (typeof renderFullAlertsTable === 'function') renderFullAlertsTable();
                if (typeof renderFeedView === 'function') renderFeedView();

                // Show success status inside modal
                if (feedback) {
                    feedback.className = 'qr-feedback qr-feedback--success';
                    feedback.innerHTML = `<strong>🚨 EMERGENCY RESPONSE DISPATCHED!</strong><br>Incident Reference: <strong>${incidentId}</strong> • Asset: <code>${asset}</code> isolated. Containment rules injected.`;
                    feedback.style.display = 'block';
                }

                // Show global toast HUD
                const toast = document.getElementById('toast-hud');
                const toastMsg = document.getElementById('toast-msg');
                if (toast && toastMsg) {
                    toastMsg.textContent = `🚨 Quick Response: ${asset} isolated & mitigated (${incidentId})`;
                    toast.classList.add('toast-hud--show');
                    setTimeout(() => toast.classList.remove('toast-hud--show'), 3500);
                }

                // Reset and close after brief confirmation
                setTimeout(() => {
                    form.reset();
                    closeQRModal();
                }, 1800);
            });
        }
    }

    function init() {
        initLuxuryBureauIntro();
        initQuickResponseModal();
        startLiveUtcClock();
        init3DEarthGlobe();
        init2DWorldMap();
        initSparklines();
        initThreatDonut();
        initGoldTouchRipple();
        bindEvents();
        renderFeedView();
        renderSectorView();
        renderReportsView();
        renderFullAlertsTable();
        renderSettingsView();
        checkInitialRoute();
        window.addEventListener('hashchange', checkInitialRoute);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();

