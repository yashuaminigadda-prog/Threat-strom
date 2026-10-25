/**
 * ═════════════════════════════════════════════════════════════════════════
 * THREAT STORM // MILITARY-GRADE CRT REALISTIC RADAR SUBSYSTEM
 * High-Fidelity Pulse-Doppler Polar Scope with Phosphor Decay Simulation
 * ═════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    class RealisticRadar {
        constructor(canvasId) {
            this.canvas = document.getElementById(canvasId);
            if (!this.canvas) return;

            this.ctx = this.canvas.getContext('2d');
            this.sweepAngle = 0; // in radians
            this.sweepSpeed = 0.024; // radians per frame (~2.6s per rotation)
            this.pulseRadius = 0;
            this.pulseSpeed = 1.2;

            this.mousePos = null;
            this.isHovered = false;
            this.isScanning = false;

            // Telemetry Readout Elements
            this.elAz = document.getElementById('radar-live-az');
            this.elTargets = document.getElementById('radar-live-targets');
            this.elMode = document.getElementById('radar-live-mode');
            this.elStatus = document.getElementById('radar-sweep-status');

            // Contacts (Target Blips)
            // angle in radians, distNorm from 0 (center) to 1 (outer ring)
            this.contacts = [
                {
                    id: 'TGT-01',
                    label: 'evil-phish-bank.xyz',
                    ip: '185.220.101.44',
                    angle: 0.85, // ~48 deg
                    distNorm: 0.65,
                    type: 'hostile',
                    color: '#ef4444',
                    brightness: 0.2,
                    isPrimary: true,
                    riskScore: 94,
                    vectorAngle: 1.2,
                    speed: 0.0003
                },
                {
                    id: 'C2-BCN',
                    label: 'update-win-payload.cc',
                    ip: '45.154.255.89',
                    angle: 3.45, // ~197 deg
                    distNorm: 0.82,
                    type: 'warning',
                    color: '#f59e0b',
                    brightness: 0.2,
                    isPrimary: false,
                    riskScore: 82,
                    vectorAngle: 3.8,
                    speed: 0.0002
                },
                {
                    id: 'TOR-EXIT',
                    label: 'TOR Exit Node #404',
                    ip: '198.51.100.23',
                    angle: 5.3, // ~303 deg
                    distNorm: 0.44,
                    type: 'hostile',
                    color: '#f43f5e',
                    brightness: 0.2,
                    isPrimary: false,
                    riskScore: 78,
                    vectorAngle: 4.8,
                    speed: 0.0004
                },
                {
                    id: 'SOC-RELAY',
                    label: 'Perimeter Defense Gateway',
                    ip: '10.14.0.1',
                    angle: 2.1, // ~120 deg
                    distNorm: 0.32,
                    type: 'friendly',
                    color: '#10b981',
                    brightness: 0.2,
                    isPrimary: false,
                    riskScore: 4,
                    vectorAngle: 1.9,
                    speed: 0.0001
                }
            ];

            this.isVisible = true;
            if ('IntersectionObserver' in window) {
                const observer = new IntersectionObserver((entries) => {
                    this.isVisible = entries[0].isIntersecting;
                }, { threshold: 0.05 });
                observer.observe(this.canvas);
            }
            document.addEventListener('visibilitychange', () => {
                this.isVisible = !document.hidden;
            }, { passive: true });

            this.initCanvas();
            this.bindEvents();
            this.animate = this.animate.bind(this);
            requestAnimationFrame(this.animate);
        }

        initCanvas() {
            const rect = this.canvas.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;
            const size = Math.min(rect.width || 300, rect.height || 300);
            
            this.size = size;
            this.canvas.width = size * dpr;
            this.canvas.height = size * dpr;
            this.canvas.style.width = `${size}px`;
            this.canvas.style.height = `${size}px`;
            
            this.ctx.scale(dpr, dpr);
            this.center = size / 2;
            this.radius = this.center - 22; // Outer bezel clearance
        }

        bindEvents() {
            window.addEventListener('resize', () => {
                this.initCanvas();
            });

            this.canvas.addEventListener('mousemove', (e) => {
                const rect = this.canvas.getBoundingClientRect();
                this.mousePos = {
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top
                };
                this.isHovered = true;
            });

            this.canvas.addEventListener('mouseleave', () => {
                this.isHovered = false;
                this.mousePos = null;
            });
        }

        setScanning(isScanning) {
            this.isScanning = isScanning;
            this.sweepSpeed = isScanning ? 0.048 : 0.024; // Speed up sweep during scan
            if (this.elMode) {
                this.elMode.textContent = isScanning ? 'INTERCEPT // LOCKING...' : 'TWS // AUTO-ACQUIRE';
                this.elMode.style.color = isScanning ? '#f59e0b' : '#38bdf8';
            }
            if (this.elStatus) {
                this.elStatus.textContent = isScanning ? 'SCAN IN PROGRESS' : 'SWEEPER ACTIVE';
                this.elStatus.className = isScanning ? 'ev-badge-chip ev-chip--gold' : 'ev-badge-chip ev-chip--green';
            }
        }

        setPrimaryTarget(targetHost, ip, riskScore) {
            const primary = this.contacts[0];
            if (primary) {
                primary.label = targetHost || 'Target Intercept';
                primary.ip = ip || 'Active Probe';
                primary.riskScore = riskScore;
                primary.type = riskScore >= 50 ? 'hostile' : 'friendly';
                primary.color = riskScore >= 50 ? '#ef4444' : '#10b981';
                // Move target slightly to simulate lock-on repositioning
                primary.angle = (this.sweepAngle + 1.2) % (Math.PI * 2);
                primary.distNorm = 0.55 + Math.random() * 0.25;
                primary.brightness = 1.0;
            }

            if (this.elStatus) {
                this.elStatus.textContent = riskScore >= 50 ? 'HOSTILE LOCK-ON' : 'BENIGN VERIFIED';
                this.elStatus.style.color = riskScore >= 50 ? '#ef4444' : '#10b981';
            }
            if (this.elTargets) {
                this.elTargets.textContent = `TARGET: ${riskScore >= 50 ? 'HOSTILE' : 'CLEAN'} (${riskScore}%)`;
            }
        }

        animate() {
            if (this.isVisible) {
                this.update();
                this.draw();
            }
            requestAnimationFrame(this.animate);
        }

        update() {
            // Update Sweep Beam Angle
            this.sweepAngle = (this.sweepAngle + this.sweepSpeed) % (Math.PI * 2);

            // Update Azimuth Telemetry
            if (this.elAz) {
                const deg = ((this.sweepAngle * 180 / Math.PI) % 360).toFixed(1);
                this.elAz.textContent = `AZ: ${String(deg).padStart(5, '0')}°`;
            }

            // Expanding Sonar Ping Ring
            this.pulseRadius += this.pulseSpeed;
            if (this.pulseRadius > this.radius) {
                this.pulseRadius = 0;
            }

            // Update Targets (Drift + Phosphor Decay)
            for (const c of this.contacts) {
                // Subtle orbital drift
                c.angle = (c.angle + c.speed) % (Math.PI * 2);

                // Phosphor decay calculation
                let angleDiff = this.sweepAngle - c.angle;
                while (angleDiff < 0) angleDiff += Math.PI * 2;
                while (angleDiff >= Math.PI * 2) angleDiff -= Math.PI * 2;

                // When sweep line just passed over the contact
                if (angleDiff < 0.12) {
                    c.brightness = 1.0; // Instant full flare
                } else {
                    c.brightness *= 0.991; // Phosphor decay half-life
                    if (c.brightness < 0.18) c.brightness = 0.18; // Residual glow
                }
            }
        }

        draw() {
            const ctx = this.ctx;
            const cx = this.center;
            const cy = this.center;
            const r = this.radius;

            // Clear Canvas
            ctx.clearRect(0, 0, this.size, this.size);

            // 1. Draw Outer Tactical Metal Bezel & Azimuth Compass Ring
            this.drawOuterBezel(cx, cy, r);

            // 2. Clip inside circular CRT Scope
            ctx.save();
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.clip();

            // 2A. CRT Phosphor Screen Background
            const bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
            bgGrad.addColorStop(0, '#031322');
            bgGrad.addColorStop(0.65, '#020b14');
            bgGrad.addColorStop(1, '#01050a');
            ctx.fillStyle = bgGrad;
            ctx.fillRect(cx - r, cy - r, r * 2, r * 2);

            // 2B. CRT Scanlines Texture
            this.drawScanlines(cx, cy, r);

            // 2C. Concentric Polar Range Rings
            this.drawPolarGrid(cx, cy, r);

            // 2D. Expanding Pulse / Sonar Wave
            if (this.pulseRadius > 0) {
                const alpha = (1 - (this.pulseRadius / r)) * 0.35;
                ctx.beginPath();
                ctx.arc(cx, cy, this.pulseRadius, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
                ctx.lineWidth = 1.5;
                ctx.stroke();
            }

            // 2E. Phosphor Sweep Beam (Trailing Conic Glow)
            this.drawSweepBeam(cx, cy, r);

            // 2F. Draw Realistic Target Blips
            this.drawTargets(cx, cy, r);

            // 2G. Interactive Cursor / Hover Reticle
            if (this.isHovered && this.mousePos) {
                this.drawHoverCrosshair(cx, cy, r);
            }

            // 2H. CRT Glass Vignette & Lens Reflection
            this.drawGlassLens(cx, cy, r);

            ctx.restore(); // End clipping
        }

        drawOuterBezel(cx, cy, r) {
            const ctx = this.ctx;

            // Outer dark metallic ring
            ctx.beginPath();
            ctx.arc(cx, cy, r + 18, 0, Math.PI * 2);
            ctx.fillStyle = '#060d17';
            ctx.fill();
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
            ctx.stroke();

            // Inner bezel rim
            ctx.beginPath();
            ctx.arc(cx, cy, r + 2, 0, Math.PI * 2);
            ctx.lineWidth = 2;
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
            ctx.stroke();

            // Tactical Rivet Screws (4 corners)
            const rivetAngles = [Math.PI * 0.25, Math.PI * 0.75, Math.PI * 1.25, Math.PI * 1.75];
            for (const a of rivetAngles) {
                const rx = cx + Math.cos(a) * (r + 11);
                const ry = cy + Math.sin(a) * (r + 11);
                ctx.beginPath();
                ctx.arc(rx, ry, 2, 0, Math.PI * 2);
                ctx.fillStyle = '#1e293b';
                ctx.fill();
                ctx.strokeStyle = '#38bdf8';
                ctx.lineWidth = 0.8;
                ctx.stroke();
            }

            // Azimuth Degree Tick Marks & Labels around the circumference
            ctx.font = '7px "JetBrains Mono", monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            for (let deg = 0; deg < 360; deg += 10) {
                const rad = (deg - 90) * Math.PI / 180;
                const isMajor = deg % 30 === 0;
                const isCardinal = deg % 90 === 0;

                const innerR = r + 2;
                const outerR = isMajor ? (r + 7) : (r + 4);

                const x1 = cx + Math.cos(rad) * innerR;
                const y1 = cy + Math.sin(rad) * innerR;
                const x2 = cx + Math.cos(rad) * outerR;
                const y2 = cy + Math.sin(rad) * outerR;

                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.strokeStyle = isMajor ? '#38bdf8' : 'rgba(56, 189, 248, 0.35)';
                ctx.lineWidth = isMajor ? 1.2 : 0.8;
                ctx.stroke();

                // Numbers for major ticks
                if (isMajor) {
                    const textR = r + 11;
                    const tx = cx + Math.cos(rad) * textR;
                    const ty = cy + Math.sin(rad) * textR;

                    if (isCardinal) {
                        const cardText = deg === 0 ? 'N' : (deg === 90 ? 'E' : (deg === 180 ? 'S' : 'W'));
                        ctx.fillStyle = deg === 0 ? '#38bdf8' : '#94a3b8';
                        ctx.font = 'bold 8px "JetBrains Mono", monospace';
                        ctx.fillText(cardText, tx, ty);
                    } else {
                        ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
                        ctx.font = '6px "JetBrains Mono", monospace';
                        ctx.fillText(String(deg).padStart(3, '0'), tx, ty);
                    }
                }
            }
        }

        drawScanlines(cx, cy, r) {
            const ctx = this.ctx;
            ctx.save();
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.22)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            for (let y = cy - r; y <= cy + r; y += 3) {
                ctx.moveTo(cx - r, y);
                ctx.lineTo(cx + r, y);
            }
            ctx.stroke();
            ctx.restore();
        }

        drawPolarGrid(cx, cy, r) {
            const ctx = this.ctx;

            // 4 Range Rings: 25km, 50km, 75km, 100km
            const ringFractions = [0.25, 0.50, 0.75, 1.0];
            const ringLabels = ['25KM', '50KM', '75KM', '100KM'];

            ctx.lineWidth = 1;
            ctx.setLineDash([3, 4]); // Tactical dashed rings

            for (let i = 0; i < ringFractions.length; i++) {
                const ringR = r * ringFractions[i];
                ctx.beginPath();
                ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
                ctx.strokeStyle = i === ringFractions.length - 1 ? 'rgba(56, 189, 248, 0.45)' : 'rgba(56, 189, 248, 0.22)';
                ctx.stroke();

                // Distance text
                if (i < 3) {
                    ctx.setLineDash([]);
                    ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
                    ctx.font = '7px "JetBrains Mono", monospace';
                    ctx.textAlign = 'left';
                    ctx.fillText(ringLabels[i], cx + 4, cy - ringR + 8);
                    ctx.setLineDash([3, 4]);
                }
            }

            // Radial Spokes (Every 30 degrees)
            ctx.setLineDash([2, 5]);
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.18)';
            for (let deg = 0; deg < 360; deg += 30) {
                const rad = deg * Math.PI / 180;
                ctx.beginPath();
                ctx.moveTo(cx, cy);
                ctx.lineTo(cx + Math.cos(rad) * r, cy + Math.sin(rad) * r);
                ctx.stroke();
            }

            // Solid Center Crosshairs
            ctx.setLineDash([]);
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
            ctx.lineWidth = 1;

            ctx.beginPath();
            ctx.moveTo(cx - r, cy);
            ctx.lineTo(cx + r, cy);
            ctx.moveTo(cx, cy - r);
            ctx.lineTo(cx, cy + r);
            ctx.stroke();

            // Center Reticle Bulls-Eye
            ctx.beginPath();
            ctx.arc(cx, cy, 3, 0, Math.PI * 2);
            ctx.fillStyle = '#38bdf8';
            ctx.fill();
        }

        drawSweepBeam(cx, cy, r) {
            const ctx = this.ctx;
            const sweepA = this.sweepAngle;

            // Draw fading phosphor pie trail (approx 50 degrees behind sweep ray)
            const trailAngle = 0.85; // ~48 deg
            const segments = 16;
            for (let i = 0; i < segments; i++) {
                const startA = sweepA - (trailAngle * ((i + 1) / segments));
                const endA = sweepA - (trailAngle * (i / segments));
                const alpha = (1 - (i / segments)) * 0.28;

                ctx.beginPath();
                ctx.moveTo(cx, cy);
                ctx.arc(cx, cy, r, startA, endA);
                ctx.closePath();
                ctx.fillStyle = `rgba(56, 189, 248, ${alpha})`;
                ctx.fill();
            }

            // High-intensity Leading Edge Ray
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            const xHead = cx + Math.cos(sweepA) * r;
            const yHead = cy + Math.sin(sweepA) * r;
            ctx.lineTo(xHead, yHead);
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.6;
            ctx.shadowColor = '#38bdf8';
            ctx.shadowBlur = 8;
            ctx.stroke();
            ctx.shadowBlur = 0; // reset
        }

        drawTargets(cx, cy, r) {
            const ctx = this.ctx;

            for (const c of this.contacts) {
                const tx = cx + Math.cos(c.angle) * (c.distNorm * r);
                const ty = cy + Math.sin(c.angle) * (c.distNorm * r);
                const bright = c.brightness;

                ctx.save();
                ctx.globalAlpha = Math.min(1.0, bright + 0.15);

                // Target Halo Glow
                const haloGrad = ctx.createRadialGradient(tx, ty, 0, tx, ty, 14);
                haloGrad.addColorStop(0, c.color);
                haloGrad.addColorStop(1, 'transparent');
                ctx.fillStyle = haloGrad;
                ctx.beginPath();
                ctx.arc(tx, ty, 14, 0, Math.PI * 2);
                ctx.fill();

                // Vector Velocity Trail line
                if (c.vectorAngle) {
                    ctx.beginPath();
                    ctx.moveTo(tx, ty);
                    ctx.lineTo(tx + Math.cos(c.vectorAngle) * 12, ty + Math.sin(c.vectorAngle) * 12);
                    ctx.strokeStyle = c.color;
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }

                // Target Icon (Diamond for Hostile, Square for Friendly)
                if (c.type === 'friendly') {
                    ctx.fillStyle = '#10b981';
                    ctx.fillRect(tx - 3, ty - 3, 6, 6);
                } else {
                    // Hostile Diamond
                    ctx.fillStyle = c.color;
                    ctx.beginPath();
                    ctx.moveTo(tx, ty - 4);
                    ctx.lineTo(tx + 4, ty);
                    ctx.lineTo(tx, ty + 4);
                    ctx.lineTo(tx - 4, ty);
                    ctx.closePath();
                    ctx.fill();
                }

                // Primary Lock-On Reticle Bracket [ ◇ ]
                if (c.isPrimary) {
                    const bSize = 8;
                    ctx.strokeStyle = c.color;
                    ctx.lineWidth = 1.2;

                    // Corner brackets
                    ctx.beginPath();
                    // Top-left
                    ctx.moveTo(tx - bSize, ty - bSize + 3);
                    ctx.lineTo(tx - bSize, ty - bSize);
                    ctx.lineTo(tx - bSize + 3, ty - bSize);
                    // Top-right
                    ctx.moveTo(tx + bSize - 3, ty - bSize);
                    ctx.lineTo(tx + bSize, ty - bSize);
                    ctx.lineTo(tx + bSize, ty - bSize + 3);
                    // Bottom-left
                    ctx.moveTo(tx - bSize, ty + bSize - 3);
                    ctx.lineTo(tx - bSize, ty + bSize);
                    ctx.lineTo(tx - bSize + 3, ty + bSize);
                    // Bottom-right
                    ctx.moveTo(tx + bSize - 3, ty + bSize);
                    ctx.lineTo(tx + bSize, ty + bSize);
                    ctx.lineTo(tx + bSize, ty + bSize - 3);
                    ctx.stroke();
                }

                // Target Text Label
                ctx.font = '7px "JetBrains Mono", monospace';
                ctx.fillStyle = c.color;
                ctx.textAlign = 'left';
                ctx.fillText(`${c.id}: ${c.label}`, tx + 7, ty - 2);

                ctx.font = '6px "JetBrains Mono", monospace';
                ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
                ctx.fillText(`${c.ip} | RISK: ${c.riskScore}%`, tx + 7, ty + 6);

                ctx.restore();
            }
        }

        drawHoverCrosshair(cx, cy, r) {
            const ctx = this.ctx;
            const mx = this.mousePos.x;
            const my = this.mousePos.y;

            // Distance from center
            const dx = mx - cx;
            const dy = my - cy;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > r) return; // Outside radar scope

            let angleRad = Math.atan2(dy, dx);
            if (angleRad < 0) angleRad += Math.PI * 2;
            const angleDeg = ((angleRad * 180 / Math.PI) % 360).toFixed(0);
            const km = ((dist / r) * 100).toFixed(0);

            // Crosshair lines
            ctx.save();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.setLineDash([2, 2]);
            ctx.lineWidth = 1;

            ctx.beginPath();
            ctx.moveTo(mx - 10, my);
            ctx.lineTo(mx + 10, my);
            ctx.moveTo(mx, my - 10);
            ctx.lineTo(mx, my + 10);
            ctx.stroke();

            // Polar readouts
            ctx.setLineDash([]);
            ctx.fillStyle = '#38bdf8';
            ctx.font = '7px "JetBrains Mono", monospace';
            ctx.fillText(`R:${km}km θ:${angleDeg}°`, mx + 8, my - 6);
            ctx.restore();
        }

        drawGlassLens(cx, cy, r) {
            const ctx = this.ctx;

            // Curved glass specular highlight on top rim
            const glassGrad = ctx.createLinearGradient(cx, cy - r, cx, cy + r);
            glassGrad.addColorStop(0, 'rgba(255, 255, 255, 0.12)');
            glassGrad.addColorStop(0.3, 'rgba(56, 189, 248, 0.03)');
            glassGrad.addColorStop(0.7, 'transparent');
            glassGrad.addColorStop(1, 'rgba(0, 0, 0, 0.45)');

            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.fillStyle = glassGrad;
            ctx.fill();
        }
    }

    // Attach to global window object
    window.addEventListener('DOMContentLoaded', () => {
        window.RealisticRadar = new RealisticRadar('realistic-radar-canvas');
    });
})();
