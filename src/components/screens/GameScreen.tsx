
import React, { useEffect, useState, useRef } from 'react';
import { GameState, GameAction, Player, Team, MapObject, Vector2 } from '../../types';
import { resolveMovement, checkAABB } from '../../engine/physics';
import { Character } from '../game/Character';
import { MAP_REGISTRY } from '../../data/mapRegistry';
import { HUD } from '../game/HUD';
import { TaskModal } from '../game/TaskModal';
import { Wrench, Zap, Database, Droplet, Activity, Lock, FlaskConical, Globe, ScanLine, Radio, TriangleAlert, Cpu, Wind, Flame, Siren, ArrowBigUp } from 'lucide-react';

const INTERACT_RANGE = 90;

// --- SOUND UTILS ---
const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
let globalAudioCtx: AudioContext | null = null;

const getAudioCtx = () => {
    if (!globalAudioCtx) globalAudioCtx = new AudioContextClass();
    if (globalAudioCtx.state === 'suspended') globalAudioCtx.resume();
    return globalAudioCtx;
};

const playSuccessSound = () => {
    try {
        const ctx = getAudioCtx();
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine'; osc1.frequency.setValueAtTime(880, ctx.currentTime); osc1.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.1); 
        gain1.gain.setValueAtTime(0.1, ctx.currentTime); gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc1.connect(gain1); gain1.connect(ctx.destination); osc1.start(); osc1.stop(ctx.currentTime + 0.5);
    } catch (e) { }
};

const playDoorLockSound = () => {
    try {
        const ctx = getAudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        // Heavy metallic thud
        osc.type = 'square';
        osc.frequency.setValueAtTime(100, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(10, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(); osc.stop(ctx.currentTime + 0.4);
    } catch (e) {}
};

// Procedural loops for sabotage
class SoundLoop {
    ctx: AudioContext;
    gain: GainNode;
    source: AudioScheduledSourceNode | null = null;
    type: 'ALARM' | 'STATIC' | 'HISS' = 'ALARM';

    constructor(type: 'ALARM' | 'STATIC' | 'HISS') {
        this.ctx = getAudioCtx();
        this.gain = this.ctx.createGain();
        this.gain.connect(this.ctx.destination);
        this.gain.gain.value = 0;
        this.type = type;
    }

    start() {
        if (this.source) return;
        this.gain.gain.setValueAtTime(0, this.ctx.currentTime);
        this.gain.gain.linearRampToValueAtTime(this.type === 'ALARM' ? 0.2 : 0.1, this.ctx.currentTime + 1);

        if (this.type === 'ALARM') {
            const osc = this.ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(800, this.ctx.currentTime);
            // Siren LFO effect
            const lfo = this.ctx.createOscillator();
            lfo.type = 'sine';
            lfo.frequency.value = 2; // 2Hz siren
            const lfoGain = this.ctx.createGain();
            lfoGain.gain.value = 400; // Modulate by +/- 400Hz
            lfo.connect(lfoGain);
            lfoGain.connect(osc.frequency);
            lfo.start();
            osc.start();
            this.source = osc;
        } else if (this.type === 'STATIC' || this.type === 'HISS') {
            const bufferSize = this.ctx.sampleRate * 2;
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;
            noise.loop = true;
            
            if (this.type === 'HISS') {
                const filter = this.ctx.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.value = 500;
                noise.connect(filter);
                filter.connect(this.gain);
            } else {
                noise.connect(this.gain);
            }
            noise.start();
            this.source = noise;
        }
    }

    stop() {
        if (!this.source) return;
        const src = this.source;
        this.source = null;
        this.gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.5);
        setTimeout(() => { try { src.stop(); } catch(e){} }, 600);
    }
}

// --- VISUAL COMPONENTS ---

const WiringVisual = ({ isNear }: { isNear: boolean }) => (
  <svg viewBox="0 0 100 100" className="overflow-visible drop-shadow-md">
    <rect x="10" y="10" width="80" height="80" rx="4" fill="#334155" stroke="#1e293b" strokeWidth="4" />
    <rect x="15" y="15" width="70" height="70" rx="2" fill="#0f172a" />
    <path d="M15 30 C 35 30, 45 40, 85 30" stroke="#ef4444" strokeWidth="4" fill="none" />
    <path d="M15 50 C 35 50, 45 60, 85 45" stroke="#3b82f6" strokeWidth="4" fill="none" />
    <path d="M15 70 C 35 70, 45 50, 85 75" stroke="#eab308" strokeWidth="4" fill="none" />
    {isNear && (
      <>
         <path d="M85 30 L90 25 M85 30 L90 35" stroke="#ef4444" strokeWidth="2" className="animate-pulse" />
         <circle cx="85" cy="30" r="3" fill="#fff" className="animate-ping" style={{animationDuration: '0.5s'}} />
      </>
    )}
    <path d="M90 10 L110 90 L90 90 Z" fill="#475569" opacity="0.6" />
  </svg>
);

const DataVisual = ({ isNear }: { isNear: boolean }) => (
  <svg viewBox="0 0 100 100" className="overflow-visible">
    <path d="M10 80 L20 60 L80 60 L90 80 Z" fill="#475569" stroke="#334155" strokeWidth="2" />
    <rect x="40" y="50" width="20" height="10" fill="#1e293b" />
    <path d="M20 50 L10 10 L90 10 L80 50 Z" fill="url(#hologram-grad)" opacity="0.6" className="animate-pulse" style={{animationDuration: '3s'}} />
    <defs>
      <linearGradient id="hologram-grad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.1" />
        <stop offset="50%" stopColor="#0ea5e9" stopOpacity="0.4" />
        <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.7" />
      </linearGradient>
    </defs>
    <line x1="25" y1="20" x2="75" y2="20" stroke="#bae6fd" strokeWidth="2" opacity="0.8" />
    <line x1="25" y1="30" x2="65" y2="30" stroke="#bae6fd" strokeWidth="2" opacity="0.6" />
    <line x1="25" y1="40" x2="55" y2="40" stroke="#bae6fd" strokeWidth="2" opacity="0.4" />
    {isNear && <rect x="30" y="65" width="40" height="10" fill="#0ea5e9" className="animate-pulse" />}
  </svg>
);

const EngineVisual = ({ isNear }: { isNear: boolean }) => (
  <svg viewBox="0 0 100 100" className="overflow-visible">
     <rect x="20" y="10" width="60" height="80" rx="10" fill="#f59e0b" stroke="#78350f" strokeWidth="4" />
     <rect x="35" y="25" width="30" height="50" rx="5" fill="#fef3c7" opacity="0.3" />
     <rect x="35" y="45" width="30" height="30" rx="2" fill="#d97706" opacity="0.8">
        <animate attributeName="height" values="30;20;30" dur="4s" repeatCount="indefinite" />
        <animate attributeName="y" values="45;55;45" dur="4s" repeatCount="indefinite" />
     </rect>
     <path d="M20 20 H10 V80 H20" stroke="#92400e" strokeWidth="6" fill="none" />
     <path d="M80 20 H90 V80 H80" stroke="#92400e" strokeWidth="6" fill="none" />
     <path d="M20 85 L80 85" stroke="#000" strokeWidth="4" strokeDasharray="5,5" />
  </svg>
);

const ScanVisual = ({ isNear }: { isNear: boolean }) => (
    <svg viewBox="0 0 100 100" className="overflow-visible">
        <circle cx="50" cy="50" r="40" fill="#1e293b" stroke="#10b981" strokeWidth="3" />
        <circle cx="50" cy="50" r="30" fill="#064e3b" opacity="0.5" />
        <line x1="20" y1="50" x2="80" y2="50" stroke="#34d399" strokeWidth="4" className={isNear ? "animate-scan" : ""} />
        <style>{`@keyframes scan { 0% { transform: translateY(-20px); opacity: 0; } 50% { opacity: 1; } 100% { transform: translateY(20px); opacity: 0; } } .animate-scan { animation: scan 2s infinite linear; transform-box: fill-box; transform-origin: center; }`}</style>
    </svg>
);

const FuseVisual = ({ isNear }: { isNear: boolean }) => (
    <svg viewBox="0 0 100 100" className="overflow-visible">
        <rect x="15" y="15" width="70" height="70" rx="5" fill="#2d2d2d" stroke="#a855f7" strokeWidth="3" />
        <circle cx="50" cy="50" r="25" stroke="#a855f7" strokeWidth="3" fill="none" strokeDasharray="6 4" className="animate-spin" style={{animationDuration: '8s'}} />
        <circle cx="50" cy="50" r="15" fill="#581c87" />
        {isNear && <circle cx="50" cy="50" r="10" fill="#a855f7" className="animate-pulse" />}
    </svg>
);

const MixVisual = ({ isNear }: { isNear: boolean }) => (
    <svg viewBox="0 0 100 100" className="overflow-visible">
        <path d="M30 85 L30 45 L20 30 H80 L70 45 V85 H30 Z" fill="#db2777" opacity="0.2" stroke="#fbcfe8" strokeWidth="3" />
        <path d="M32 83 H68 V60 H32 V83 Z" fill="#be185d" opacity="0.8" />
        <circle cx="45" cy="55" r="3" fill="white" className="animate-bounce" style={{animationDuration: '2s'}}/>
        <circle cx="55" cy="70" r="2" fill="white" className="animate-bounce" style={{animationDuration: '1.5s'}}/>
        <rect x="25" y="85" width="50" height="5" fill="#831843" />
    </svg>
);

const GravityVisual = ({ isNear }: { isNear: boolean }) => (
    <svg viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="40" stroke="#06b6d4" strokeWidth="2" fill="#083344" fillOpacity="0.4"/>
        <ellipse cx="50" cy="50" rx="35" ry="10" stroke="#22d3ee" strokeWidth="3" fill="none" className="animate-spin" style={{transformOrigin: '50px 50px', animationDuration: '4s'}} />
        <ellipse cx="50" cy="50" rx="10" ry="35" stroke="#67e8f9" strokeWidth="3" fill="none" className="animate-spin" style={{transformOrigin: '50px 50px', animationDuration: '6s', animationDirection: 'reverse'}} />
        <circle cx="50" cy="50" r="8" fill="#06b6d4" className={isNear ? "animate-ping" : ""} style={{animationDuration: '2s'}}/>
    </svg>
);

const LockVisual = ({ isNear }: { isNear: boolean }) => (
    <svg viewBox="0 0 100 100">
        <rect x="15" y="15" width="70" height="70" rx="5" fill="#374151" stroke="#9ca3af" strokeWidth="3"/>
        <rect x="25" y="25" width="50" height="20" fill="#111827" />
        <circle cx="25" cy="35" r="3" fill={isNear ? "#22c55e" : "#ef4444"} className={isNear ? "animate-pulse" : ""} />
        <g fill="#1f2937">
           <rect x="25" y="50" width="12" height="10" rx="2"/>
           <rect x="44" y="50" width="12" height="10" rx="2"/>
           <rect x="63" y="50" width="12" height="10" rx="2"/>
           <rect x="25" y="65" width="12" height="10" rx="2"/>
           <rect x="44" y="65" width="12" height="10" rx="2"/>
           <rect x="63" y="65" width="12" height="10" rx="2"/>
        </g>
    </svg>
);

const CalibrateVisual = ({ isNear }: { isNear: boolean }) => (
    <svg viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="40" fill="#4b5563" stroke="#9ca3af" strokeWidth="4"/>
        <path d="M50 50 L50 20" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" className="animate-spin" style={{transformOrigin: '50px 50px', animationDuration: '5s'}}/>
        <circle cx="50" cy="20" r="4" fill="#f59e0b"/>
        <g fill="#374151">
            <circle cx="70" cy="40" r="5"/>
            <circle cx="70" cy="60" r="5"/>
            <circle cx="50" cy="75" r="5"/>
            <circle cx="30" cy="60" r="5"/>
            <circle cx="30" cy="40" r="5"/>
        </g>
        <circle cx="50" cy="50" r="8" fill="#1f2937"/>
    </svg>
);

const MechanicalVisual = ({ isNear, type }: { isNear: boolean, type: string }) => (
    <svg viewBox="0 0 100 100" className="overflow-visible">
        <rect x="15" y="15" width="70" height="70" rx="4" fill="#334155" stroke="#1e293b" strokeWidth="4" />
        <circle cx="50" cy="50" r="25" fill="#1e293b" stroke="#475569" strokeWidth="2" />
        <path d="M50 25 L50 75 M25 50 L75 50" stroke="#475569" strokeWidth="4" />
        {isNear && <circle cx="50" cy="50" r="12" fill="#22c55e" className="animate-pulse" />}
    </svg>
);

const RepairVisual = ({ type, isNear }: { type: string, isNear: boolean }) => {
    let Icon = Activity;
    let color = '#fff';
    let bgColor = '#1f2937';

    if (type.includes('lights')) { Icon = Zap; color = '#eab308'; bgColor = '#422006'; }
    else if (type.includes('reactor')) { Icon = Flame; color = '#ef4444'; bgColor = '#450a0a'; }
    else if (type.includes('oxygen')) { Icon = Wind; color = '#3b82f6'; bgColor = '#172554'; }
    else if (type.includes('comms')) { Icon = Radio; color = '#9ca3af'; bgColor = '#111827'; }
    else if (type.includes('emergency')) { Icon = Siren; color = '#ef4444'; bgColor = '#450a0a'; }

    if (type === 'emergency_button') {
        return (
            <svg viewBox="0 0 100 100" className="overflow-visible">
                <rect x="10" y="30" width="80" height="50" rx="8" fill="#333" stroke="#555" strokeWidth="3" />
                <circle cx="50" cy="45" r="25" fill="#ef4444" stroke="#991b1b" strokeWidth="4" className={isNear ? "animate-pulse" : ""} />
                <path d="M50 20 L50 70" stroke="rgba(0,0,0,0.2)" strokeWidth="4" />
                {/* Glass Cover */}
                <path d="M25 45 Q50 10 75 45" fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
                {isNear && <circle cx="50" cy="45" r="30" stroke="#ef4444" strokeWidth="2" className="animate-ping" opacity="0.5"/>}
            </svg>
        )
    }

    return (
        <svg viewBox="0 0 100 100" className="overflow-visible">
            {/* Base Station */}
            <rect x="10" y="20" width="80" height="60" rx="8" fill={bgColor} stroke={color} strokeWidth="3" />
            <path d="M10 80 L20 95 H80 L90 80" fill={bgColor} stroke={color} strokeWidth="2" opacity="0.8"/>
            
            {/* Screen Area */}
            <rect x="20" y="30" width="60" height="40" rx="2" fill="black" opacity="0.6" />
            
            {/* Status Indicator */}
            <circle cx="80" cy="25" r="4" fill={color} className="animate-pulse" />
            
            {/* Icon Overlay */}
            <g transform="translate(25, 35)">
                <Icon size={30} color={color} className={isNear ? "animate-bounce" : ""} />
            </g>

            {isNear && (
                <g className="animate-pulse">
                     <rect x="5" y="15" width="90" height="70" rx="10" fill="none" stroke={color} strokeWidth="2" strokeDasharray="5,5" opacity="0.5"/>
                </g>
            )}
        </svg>
    )
};

const VentNavigation = ({ currentVent, allMapObjects, onNavigate }: { currentVent: MapObject | undefined, allMapObjects: MapObject[], onNavigate: (id: string) => void }) => {
    if (!currentVent || !currentVent.connectedVents) return null;

    return (
        <div className="fixed inset-0 z-50 pointer-events-none">
            {currentVent.connectedVents.map((vid: string) => {
                const target = allMapObjects.find((o: any) => o.id === vid);
                if (!target) return null;
                
                // Calculate angle from current vent center to target vent center
                const curX = currentVent.x + currentVent.width / 2;
                const curY = currentVent.y + currentVent.height / 2;
                const tarX = target.x + target.width / 2;
                const tarY = target.y + target.height / 2;
                
                const dx = tarX - curX;
                const dy = tarY - curY;
                const angle = Math.atan2(dy, dx) * (180 / Math.PI);
                
                // Position arrow at a radius from center of screen
                const radius = 200; 
                const rad = angle * (Math.PI / 180);
                // Center of screen
                const cx = window.innerWidth / 2;
                const cy = window.innerHeight / 2;
                
                const x = cx + Math.cos(rad) * radius;
                const y = cy + Math.sin(rad) * radius;

                return (
                    <button
                        key={vid}
                        onClick={() => onNavigate(vid)}
                        className="absolute w-20 h-20 bg-gray-900/80 border-4 border-white rounded-full flex items-center justify-center hover:bg-gray-700 hover:scale-110 transition-all pointer-events-auto shadow-[0_0_20px_rgba(0,0,0,0.8)] z-50 animate-pulse"
                        style={{
                            left: x, top: y,
                            transform: `translate(-50%, -50%) rotate(${angle + 90}deg)`
                        }}
                    >
                        <ArrowBigUp fill="white" size={40} className="text-white drop-shadow-md" />
                    </button>
                )
            })}
        </div>
    )
};


// --- PROP RENDERER ---
const PropRenderer = ({ prop }: { prop: MapObject }) => {
    const { propType, rotation } = prop;
    const style = { 
        width: '100%', height: '100%', 
        transform: `rotate(${rotation || 0}deg)`,
        filter: 'drop-shadow(2px 4px 6px rgba(0,0,0,0.5))'
    };

    switch (propType) {
        case 'desk':
            return (
                <svg viewBox="0 0 100 80" style={style} className="overflow-visible">
                    <rect x="5" y="10" width="90" height="60" rx="5" fill="#334155" stroke="#1e293b" strokeWidth="2" />
                    <rect x="10" y="15" width="80" height="50" rx="2" fill="#475569" />
                    <path d="M20 30 L80 30 L70 50 L30 50 Z" fill="#0ea5e9" opacity="0.3" className="animate-pulse" />
                    <rect x="40" y="55" width="20" height="5" fill="#1e293b" />
                </svg>
            );
        case 'bed':
            return (
                <svg viewBox="0 0 50 80" style={style}>
                    <rect x="2" y="2" width="46" height="76" rx="8" fill="#1e293b" stroke="#0f172a" strokeWidth="2" />
                    <rect x="5" y="20" width="40" height="55" rx="4" fill="#3b82f6" opacity="0.5" />
                    <rect x="5" y="5" width="40" height="12" rx="2" fill="#cbd5e1" />
                </svg>
            );
        case 'engine':
            return (
                <svg viewBox="0 0 100 100" style={style}>
                    <circle cx="50" cy="50" r="48" fill="#1f2937" stroke="#000" strokeWidth="2" />
                    <circle cx="50" cy="50" r="35" fill="#111827" stroke="#f59e0b" strokeWidth="2" strokeDasharray="5,5" className="animate-spin-slow" />
                    <circle cx="50" cy="50" r="15" fill="#f59e0b" className="animate-pulse" />
                </svg>
            );
        case 'monitor':
             return (
                 <svg viewBox="0 0 60 40" style={style}>
                     <rect x="2" y="2" width="56" height="36" rx="4" fill="#1e293b" stroke="#475569" strokeWidth="2" />
                     <rect x="5" y="5" width="50" height="30" rx="2" fill="#000" />
                     <rect x="8" y="8" width="44" height="24" rx="1" fill="#10b981" opacity="0.2" className="animate-pulse" />
                     <path d="M10 20 H50" stroke="#10b981" strokeWidth="1" strokeDasharray="2,2" opacity="0.5" />
                 </svg>
             );
        case 'crate':
            return (
                <svg viewBox="0 0 50 50" style={style}>
                    <rect x="2" y="2" width="46" height="46" rx="2" fill="#854d0e" stroke="#451a03" strokeWidth="2" />
                    <line x1="2" y1="2" x2="48" y2="48" stroke="#451a03" strokeWidth="1" opacity="0.5" />
                    <line x1="48" y1="2" x2="2" y2="48" stroke="#451a03" strokeWidth="1" opacity="0.5" />
                    <rect x="10" y="10" width="30" height="30" fill="none" stroke="#451a03" strokeWidth="2" opacity="0.3" />
                </svg>
            );
        default:
            return <div className="w-full h-full bg-gray-600 border border-gray-400 rounded" />;
    }
}

// --- TASK RENDERER ---
const TaskObject: React.FC<{ obj: MapObject, taskType: string, player: Player, hasTask: boolean, isSystem?: boolean }> = ({ obj, taskType, player, hasTask, isSystem = false }) => {
    const center = { x: obj.x + obj.width/2, y: obj.y + obj.height/2 };
    const dist = Math.hypot(center.x - player.position.x, center.y - player.position.y);
    const isNear = dist < INTERACT_RANGE;
    
    // Icon Selection
    const TaskIcon = () => {
        if (taskType === 'emergency_button') return <Siren size={16} className="text-white animate-pulse" strokeWidth={3} />;
        if (isSystem) return <TriangleAlert size={16} className="text-red-500 animate-pulse" strokeWidth={3} />;
        switch(taskType) {
            case 'fix_wiring': return <Wrench size={16} className="text-black" strokeWidth={3} />;
            case 'upload_data': return <Database size={16} className="text-black" strokeWidth={3} />;
            case 'fuel_engines': return <Droplet size={16} className="text-black" strokeWidth={3} />;
            case 'scan_sample': return <ScanLine size={16} className="text-black" strokeWidth={3} />;
            case 'align_fuse': return <Zap size={16} className="text-black" strokeWidth={3} />;
            case 'mix_chemical': return <FlaskConical size={16} className="text-black" strokeWidth={3} />;
            case 'stabilize_gravity': return <Globe size={16} className="text-black" strokeWidth={3} />;
            case 'unlock_manifold': return <Lock size={16} className="text-black" strokeWidth={3} />;
            case 'calibrate_distributor': return <Radio size={16} className="text-black" strokeWidth={3} />;
            default: return <Activity size={16} className="text-black" strokeWidth={3} />;
        }
    }

    const Visual = () => {
         if (isSystem) return <RepairVisual type={taskType} isNear={isNear} />;
         switch(taskType) {
            case 'fix_wiring': return <WiringVisual isNear={isNear} />;
            case 'upload_data': return <DataVisual isNear={isNear} />;
            case 'fuel_engines': return <EngineVisual isNear={isNear} />;
            case 'scan_sample': return <ScanVisual isNear={isNear} />;
            case 'align_fuse': return <FuseVisual isNear={isNear} />;
            case 'mix_chemical': return <MixVisual isNear={isNear} />;
            case 'stabilize_gravity': return <GravityVisual isNear={isNear} />;
            case 'unlock_manifold': return <LockVisual isNear={isNear} />;
            case 'calibrate_distributor': return <CalibrateVisual isNear={isNear} />;
            default: return <MechanicalVisual isNear={isNear} type={taskType} />;
         }
    }

    return (
        <div style={{ left: obj.x, top: obj.y, width: obj.width, height: obj.height, zIndex: Math.floor(obj.y) }} className="absolute flex flex-col items-center justify-center">
             
             {/* Glow Halo */}
             <div className={`absolute inset-[-10px] rounded-full blur-xl transition-all duration-300 pointer-events-none ${isNear ? 'opacity-100 scale-125' : 'opacity-0 scale-75'} ${taskType === 'emergency_button' ? 'bg-red-500/50' : isSystem ? 'bg-red-500/40' : 'bg-neon-cyan/20'}`} />

             {/* Interaction Ring */}
             <div className={`absolute inset-[-12px] rounded-full border-2 pointer-events-none transition-all duration-300 ${isNear ? 'opacity-100 scale-100' : 'opacity-0 scale-50'} ${taskType === 'emergency_button' ? 'border-red-600' : isSystem ? 'border-red-500/60' : 'border-neon-cyan/60'}`}>
                 <div className={`absolute inset-0 rounded-full animate-pulse ${isSystem ? 'bg-red-500/10' : 'bg-neon-cyan/5'}`} />
             </div>

             {/* Floating Icon */}
             {hasTask && (
                 <div className="absolute -top-14 left-1/2 -translate-x-1/2 animate-bounce z-30 pointer-events-none flex flex-col items-center">
                     <div className={`p-1.5 rounded-full shadow-[0_0_15px_#facc15] border-2 border-white transition-colors ${taskType === 'emergency_button' ? 'bg-red-600' : isNear ? 'bg-neon-green' : 'bg-neon-yellow'}`}>
                         <TaskIcon />
                     </div>
                     <div className={`w-0 h-0 border-l-[6px] border-l-transparent border-t-[8px] border-r-[6px] border-r-transparent mt-[-2px] ${isNear ? 'border-t-white' : 'border-t-white'}`}></div>
                 </div>
             )}
             
             {/* Visual Component */}
             <div className={`relative w-full h-full transition-all duration-300 ${isNear ? 'filter drop-shadow-[0_0_8px_rgba(0,242,255,0.6)] scale-110' : ''}`}>
                 <Visual />
             </div>
        </div>
    )
}

// --- MAIN SCREEN ---
export const GameScreen: React.FC<{ state: GameState; dispatch: React.Dispatch<GameAction> }> = ({ state, dispatch }) => {
    const myPlayer = state.players.find(p => p.id === state.myPlayerId);
    const [viewport, setViewport] = useState({ w: 800, h: 600 });
    const [keys, setKeys] = useState<Record<string, boolean>>({});
    const activeMap = MAP_REGISTRY[state.activeMapId];
    const theme = activeMap.theme;
    
    // Smooth Camera
    const camRef = useRef({ x: 0, y: 0 });
    // Visual State
    const [successFlash, setSuccessFlash] = useState(false);
    const [showSabotageMap, setShowSabotageMap] = useState(false);
    // Local Task State (for systems)
    const [activeRepair, setActiveRepair] = useState<string | null>(null);
    const [activeStationId, setActiveStationId] = useState<string | null>(null);
    const [emergencyCalled, setEmergencyCalled] = useState(false);
    
    // Sound Loop Managers
    const alarmRef = useRef<SoundLoop | null>(null);
    const staticRef = useRef<SoundLoop | null>(null);
    const hissRef = useRef<SoundLoop | null>(null);
    const prevSabotageRef = useRef<string | null>(null);
    const lockedDoorsRef = useRef<string[]>([]);

    useEffect(() => {
        const handleResize = () => setViewport({ w: window.innerWidth, h: window.innerHeight });
        window.addEventListener('resize', handleResize); handleResize();
        const down = (e: KeyboardEvent) => setKeys(k => ({...k, [e.key.toLowerCase()]: true}));
        const up = (e: KeyboardEvent) => setKeys(k => ({...k, [e.key.toLowerCase()]: false}));
        window.addEventListener('keydown', down); window.addEventListener('keyup', up);
        return () => { window.removeEventListener('resize', handleResize); window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); }
    }, []);

    // Game Loop
    useEffect(() => {
        if (!myPlayer || myPlayer.isDead || state.activeTask || activeRepair || myPlayer.isInVent) return; 
        const interval = setInterval(() => {
            let dx = 0, dy = 0;
            if (keys['w'] || keys['arrowup']) dy -= 1; if (keys['s'] || keys['arrowdown']) dy += 1;
            if (keys['a'] || keys['arrowleft']) dx -= 1; if (keys['d'] || keys['arrowright']) dx += 1;
            if (dx !== 0 && dy !== 0) { const len = Math.sqrt(dx*dx + dy*dy); dx /= len; dy /= len; }

            const isMoving = dx !== 0 || dy !== 0;
            if (isMoving) {
                const speed = state.settings.playerSpeed;
                const delta = { x: dx * speed, y: dy * speed };
                const newPos = resolveMovement(myPlayer.position, delta, state.map);
                dispatch({ type: 'MOVE_PLAYER', payload: { id: myPlayer.id, position: newPos, direction: dx < 0 ? 'left' : dx > 0 ? 'right' : myPlayer.direction, isMoving: true } });
            } else if (myPlayer.isMoving) {
                 dispatch({ type: 'MOVE_PLAYER', payload: { id: myPlayer.id, position: myPlayer.position, direction: myPlayer.direction, isMoving: false } });
            }
        }, 16); 
        return () => clearInterval(interval);
    }, [keys, myPlayer, state.map, state.activeTask, activeRepair]);

    // Handle Emergency Animation
    useEffect(() => {
        if (state.phase === 'MEETING' && state.deadBodyReported === 'emergency_button') {
            setEmergencyCalled(true);
            setTimeout(() => setEmergencyCalled(false), 2000); // 2s duration for overlay
        }
    }, [state.phase, state.deadBodyReported]);

    // Handle Audio & Visual Sabotage Effects
    useEffect(() => {
        // Init loops if missing
        if (!alarmRef.current) alarmRef.current = new SoundLoop('ALARM');
        if (!staticRef.current) staticRef.current = new SoundLoop('STATIC');
        if (!hissRef.current) hissRef.current = new SoundLoop('HISS');

        const active = state.activeSabotage;
        
        // Stop all first
        if (prevSabotageRef.current !== active) {
            alarmRef.current.stop();
            staticRef.current.stop();
            hissRef.current.stop();
        }

        if (active === 'REACTOR') alarmRef.current.start();
        if (active === 'COMMS') staticRef.current.start();
        if (active === 'OXYGEN') hissRef.current.start();
        
        prevSabotageRef.current = active;

        // Check for new locked doors
        const currentLocked = state.map.filter(o => o.type === 'door' && o.isLocked).map(o => o.id);
        if (currentLocked.length > lockedDoorsRef.current.length) {
            playDoorLockSound();
        }
        lockedDoorsRef.current = currentLocked;

        return () => {
             // Cleanup on unmount or phase change usually handled by ref persistence
        };
    }, [state.activeSabotage, state.map]);

    if (!myPlayer) return null;

    // Check for nearby dead bodies
    const canReport = state.players.some(p => p.isDead && Math.hypot(p.position.x - myPlayer.position.x, p.position.y - myPlayer.position.y) < INTERACT_RANGE);

    // Camera Lerp
    camRef.current.x += ((myPlayer.position.x - viewport.w / 2) - camRef.current.x) * 0.1;
    camRef.current.y += ((myPlayer.position.y - viewport.h / 2) - camRef.current.y) * 0.1;

    let visionSize = 450;
    if (state.modRegistry.roles[myPlayer.roleId].team === Team.GLITCH) visionSize = 550; // Traitor vision
    if (!state.systems.lights.active && state.modRegistry.roles[myPlayer.roleId].team !== Team.GLITCH) visionSize = 100; // Sabotaged Crew Vision

    const handleAction = (action: string) => {
        if (action === 'KILL') {
            const target = state.players.find(p => p.id !== myPlayer.id && !p.isDead && Math.hypot(p.position.x - myPlayer.position.x, p.position.y - myPlayer.position.y) < 60);
            if (target) dispatch({ type: 'KILL_PLAYER', payload: { killerId: myPlayer.id, targetId: target.id } });
        } else if (action === 'SABOTAGE') { setShowSabotageMap(!showSabotageMap); } 
        else if (action === 'EXIT_VENT') { dispatch({ type: 'EXIT_VENT', payload: { playerId: myPlayer.id }}); } 
        else if (action === 'REPORT') { 
            // Double check range for safety
            if (canReport) {
                dispatch({ type: 'REPORT_BODY', payload: { reporterId: myPlayer.id, bodyId: 'any' } });
            }
        }
    };

    const handleInteract = () => {
        const dist = INTERACT_RANGE;
        
        // Repair Stations & Systems
        const system = state.map.find(o => o.type === 'system' && Math.hypot((o.x + o.width/2) - myPlayer.position.x, (o.y + o.height/2) - myPlayer.position.y) < dist);
        if (system) {
            // Emergency Button Special Case
            if (system.taskType === 'emergency_button') {
                dispatch({ type: 'CALL_EMERGENCY_MEETING', payload: { playerId: myPlayer.id } });
                return;
            }

            // Check if system actually needs repair
            let needsRepair = false;
            if (system.taskType === 'fix_lights' && !state.systems.lights.active) needsRepair = true;
            if (system.taskType === 'fix_comms' && !state.systems.comms.active) needsRepair = true;
            if (system.taskType === 'fix_reactor' && state.systems.reactor.meltdownTimer) needsRepair = true;
            if (system.taskType === 'fix_oxygen' && state.systems.oxygen.depletionTimer) needsRepair = true;

            if (needsRepair) {
                setActiveRepair(system.taskType || 'generic_repair');
                setActiveStationId(system.id);
                return;
            }
        }

        // Tasks
        const task = state.map.find(o => o.type === 'task_location' && Math.hypot((o.x + o.width/2) - myPlayer.position.x, (o.y + o.height/2) - myPlayer.position.y) < dist);
        if (task) {
            const pTask = myPlayer.tasks.find(t => Math.abs(t.location.x - task.x) < 0.1 && Math.abs(t.location.y - task.y) < 0.1 && !t.completed);
            if (pTask && !pTask.completed) { dispatch({ type: 'OPEN_TASK', payload: { taskInstanceId: pTask.id } }); return; }
        }
        
        // Doors/Vents
        const obj = state.map.find(o => Math.hypot((o.x + o.width/2) - myPlayer.position.x, (o.y + o.height/2) - myPlayer.position.y) < dist);
        if (obj?.type === 'door' && !obj.isLocked) dispatch({ type: 'TOGGLE_DOOR', payload: { doorId: obj.id } });
        
        // Handle Vent Entry
        if (obj?.type === 'vent') {
            const role = state.modRegistry.roles[myPlayer.roleId];
            if (role.canVent) {
                 dispatch({ type: 'ENTER_VENT', payload: { playerId: myPlayer.id, ventId: obj.id } });
            }
        }
    };

    const handleTaskCompletion = () => {
        if (state.activeTask) {
             dispatch({ type: 'COMPLETE_TASK', payload: { playerId: myPlayer.id, taskInstanceId: state.activeTask } });
             playSuccessSound(); setSuccessFlash(true); setTimeout(() => setSuccessFlash(false), 500);
        }
        if (activeRepair) {
            if (activeRepair === 'fix_lights') dispatch({ type: 'FIX_SABOTAGE', payload: { type: 'LIGHTS', stationId: activeStationId || undefined }});
            if (activeRepair === 'fix_oxygen') dispatch({ type: 'FIX_SABOTAGE', payload: { type: 'OXYGEN', stationId: activeStationId || undefined }});
            if (activeRepair === 'fix_reactor') dispatch({ type: 'FIX_SABOTAGE', payload: { type: 'REACTOR', stationId: activeStationId || undefined }});
            if (activeRepair === 'fix_comms') dispatch({ type: 'FIX_SABOTAGE', payload: { type: 'COMMS', stationId: activeStationId || undefined }});
            setActiveRepair(null);
            setActiveStationId(null);
            playSuccessSound();
        }
    };

    const activeTaskDef = state.activeTask ? state.modRegistry.tasks[myPlayer.tasks.find(t => t.id === state.activeTask)?.taskId || ''] : null;

    return (
        <div className={`w-full h-full relative overflow-hidden bg-black ${state.activeSabotage === 'REACTOR' || state.activeSabotage === 'OXYGEN' ? 'animate-screen-shake' : ''}`}>
            <HUD state={state} player={myPlayer} onInteract={handleInteract} onAction={handleAction} onToggleSabotageMap={() => setShowSabotageMap(!showSabotageMap)} showSabotageMap={showSabotageMap} dispatch={dispatch} canReport={canReport} />
            
            {(state.activeTask && activeTaskDef) && <TaskModal taskId={state.activeTask} taskType={activeTaskDef.id} onClose={() => dispatch({ type: 'CLOSE_TASK' })} onComplete={handleTaskCompletion} />}
            {activeRepair && <TaskModal taskId="repair" taskType={activeRepair} onClose={() => { setActiveRepair(null); setActiveStationId(null); }} onComplete={handleTaskCompletion} />}

            <div className={`fixed inset-0 bg-white z-[60] pointer-events-none transition-opacity duration-500 ease-out mix-blend-overlay ${successFlash ? 'opacity-40' : 'opacity-0'}`} />

            {/* Emergency Meeting Animation Overlay */}
            {emergencyCalled && (
                <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-red-600 animate-pulse pointer-events-none">
                     <div className="bg-black/80 w-full py-12 flex items-center justify-center border-y-8 border-red-500 shadow-[0_0_50px_black]">
                         <Siren size={80} className="text-red-500 animate-spin mr-8"/>
                         <h1 className="text-8xl font-game text-white tracking-widest animate-bounce drop-shadow-[4px_4px_0_#991b1b]">EMERGENCY CALLED</h1>
                         <Siren size={80} className="text-red-500 animate-spin ml-8"/>
                     </div>
                </div>
            )}

            <div style={{ transform: `translate(${-camRef.current.x}px, ${-camRef.current.y}px)` }} className="absolute inset-0 will-change-transform">
                {/* Global Background */}
                <div className="absolute inset-0 w-[4000px] h-[4000px]" style={{ backgroundColor: theme.background }} />
                
                {/* Floors */}
                {state.map.filter(o => o.type === 'floor').map(obj => (
                    <div key={obj.id} 
                         style={{ 
                             left: obj.x, top: obj.y, width: obj.width, height: obj.height, 
                             backgroundColor: theme.floorColor, 
                             backgroundImage: theme.floorPattern,
                             boxShadow: 'inset 0 0 50px rgba(0,0,0,0.5)'
                         }} 
                         className="absolute border border-white/5" 
                    />
                ))}
                
                {/* Vents */}
                {state.map.map(obj => {
                    if (obj.type === 'vent') return (
                        <div key={obj.id} style={{ left: obj.x, top: obj.y, width: obj.width, height: obj.height }} className="absolute z-10 flex items-center justify-center">
                            <div className="w-full h-full bg-gray-800 border-4 border-gray-600 rounded-lg shadow-[0_0_10px_rgba(0,0,0,0.8)] overflow-hidden relative group">
                                {/* Grate Bars */}
                                <div className="absolute inset-0 flex flex-col justify-evenly p-1">
                                    <div className="w-full h-1.5 bg-black/60 rounded-full shadow-[0_1px_0_rgba(255,255,255,0.1)]"/>
                                    <div className="w-full h-1.5 bg-black/60 rounded-full shadow-[0_1px_0_rgba(255,255,255,0.1)]"/>
                                    <div className="w-full h-1.5 bg-black/60 rounded-full shadow-[0_1px_0_rgba(255,255,255,0.1)]"/>
                                </div>
                                {/* Inner Darkness/Depth */}
                                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/80 pointer-events-none"/>
                                
                                {/* Subtle Icon */}
                                <div className="absolute inset-0 flex items-center justify-center opacity-30 group-hover:opacity-60 transition-opacity">
                                    <Wind size={24} className="text-gray-400" />
                                </div>
                            </div>
                            
                            {/* Floor Glow */}
                            <div className="absolute inset-[-4px] rounded-lg bg-gray-500/10 blur-sm -z-10 pointer-events-none"/>
                        </div>
                    );
                    if (obj.type === 'hazard') return <div key={obj.id} style={{ left: obj.x, top: obj.y, width: obj.width, height: obj.height, backgroundColor: theme.hazardColor }} className="absolute opacity-40 animate-pulse z-0" />;
                    return null;
                })}

                {/* Props (SVG) */}
                {state.map.map(obj => {
                    if (obj.type === 'prop') {
                        return <div key={obj.id} style={{ left: obj.x, top: obj.y, width: obj.width, height: obj.height, zIndex: Math.floor(obj.y) }} className="absolute"><PropRenderer prop={obj} /></div>
                    }
                    if (obj.type === 'task_location') {
                        const hasTask = myPlayer.tasks.some(t => Math.abs(t.location.x - obj.x) < 0.1 && Math.abs(t.location.y - obj.y) < 0.1 && !t.completed);
                        if (!hasTask) return null;
                        return (
                             <TaskObject key={obj.id} obj={obj} taskType={obj.taskType || 'generic'} player={myPlayer} hasTask={hasTask} />
                        )
                    }
                    if (obj.type === 'system') {
                        // Systems are always visible (lights, reactor, etc.)
                        let show = false;
                        // Always show Emergency Button
                        if (obj.taskType === 'emergency_button') show = true;
                        
                        show = true;

                        if (!show) return null;
                        
                        let interactive = false;
                        if (obj.taskType === 'emergency_button') interactive = true;
                        if (obj.taskType === 'fix_lights' && !state.systems.lights.active) interactive = true;
                        if (obj.taskType === 'fix_comms' && !state.systems.comms.active) interactive = true;
                        if (obj.taskType === 'fix_reactor' && state.systems.reactor.meltdownTimer) interactive = true;
                        if (obj.taskType === 'fix_oxygen' && state.systems.oxygen.depletionTimer) interactive = true;

                        return <TaskObject key={obj.id} obj={obj} taskType={obj.taskType || 'repair'} player={myPlayer} hasTask={interactive} isSystem={true} />
                    }
                    return null;
                })}

                {/* Characters */}
                {state.players.map(p => !p.isInVent && (<Character key={p.id} player={p} role={state.modRegistry.roles[p.roleId]} isLocal={p.id === myPlayer.id} isCelebrating={p.id === myPlayer.id && successFlash} />))}
                
                {/* Walls */}
                {state.map.map(obj => {
                    if (obj.type === 'wall') return (
                        <div key={obj.id} 
                             style={{ 
                                 left: obj.x, top: obj.y, width: obj.width, height: obj.height, 
                                 backgroundColor: theme.wallColor, 
                                 borderColor: theme.wallBorder 
                             }} 
                             className="absolute border-2 rounded-sm shadow-[4px_8px_15px_rgba(0,0,0,0.6)] z-20" 
                        />
                    );
                    if (obj.type === 'door') return (
                        <div key={obj.id} 
                             style={{ 
                                 left: obj.isOpen ? obj.x + (obj.width > obj.height ? 0 : 20) : obj.x, 
                                 top: obj.isOpen ? obj.y + (obj.height > obj.width ? 0 : 20) : obj.y, 
                                 width: obj.width, height: obj.height, 
                                 backgroundColor: theme.doorColor 
                             }} 
                             className={`absolute border-2 border-black z-20 transition-all duration-300 rounded-sm ${obj.isOpen ? 'opacity-20' : 'opacity-100 shadow-[0_0_15px_rgba(0,0,0,0.5)]'} ${obj.isLocked ? 'bg-red-500 border-red-800 opacity-90' : ''}`} 
                        >
                            {obj.isLocked && <div className="absolute inset-0 flex items-center justify-center"><Lock className="text-red-900 animate-pulse" size={32}/></div>}
                        </div>
                    );
                    return null;
                })}
            </div>
            
            {/* Fog of War & Atmosphere */}
            <div className="absolute inset-0 pointer-events-none z-30 transition-all duration-500 ease-out" 
                 style={{ 
                     background: `radial-gradient(circle ${visionSize}px at ${viewport.w/2}px ${viewport.h/2}px, transparent 40%, rgba(0,0,0,0.95) 70%, #000 100%)` 
                 }} 
            />
            
            {/* SABOTAGE OVERLAYS */}
            {!state.systems.lights.active && <div className="absolute inset-0 pointer-events-none z-30 bg-black animate-flicker-dark mix-blend-multiply" />}
            {state.activeSabotage === 'REACTOR' && <div className="absolute inset-0 pointer-events-none z-40 animate-strobe-red mix-blend-overlay" />}
            {state.activeSabotage === 'OXYGEN' && (
                <>
                    <div className="absolute inset-0 pointer-events-none z-40 animate-strobe-blue mix-blend-multiply opacity-50" />
                    <div className="absolute inset-0 pointer-events-none z-30 bg-[url('https://www.transparenttextures.com/patterns/foggy-birds.png')] opacity-20 animate-fog-scroll mix-blend-screen" />
                </>
            )}
            {state.activeSabotage === 'COMMS' && (
                <>
                    <div className="absolute inset-0 pointer-events-none z-40 opacity-10 bg-white animate-static mix-blend-overlay" />
                    <div className="absolute inset-0 pointer-events-none z-40 flex items-center justify-center">
                        <div className="text-4xl font-game text-red-500 animate-pulse tracking-widest opacity-20">CONNECTION LOST</div>
                    </div>
                </>
            )}

            {myPlayer.isInVent && (
                <VentNavigation 
                    currentVent={state.map.find(o => o.id === myPlayer.ventId)}
                    allMapObjects={state.map}
                    onNavigate={(vid: string) => dispatch({ type: 'ENTER_VENT', payload: { playerId: myPlayer.id, ventId: vid } })}
                />
            )}
        </div>
    );
};
