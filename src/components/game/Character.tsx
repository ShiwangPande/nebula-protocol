
import React, { useEffect, useRef } from 'react';
import { Player, RoleDefinition } from '../../types';

interface CharacterProps {
    player: Player;
    role: RoleDefinition;
    isLocal: boolean;
    isCelebrating?: boolean;
}

let audioCtx: AudioContext | null = null;
const playFootstep = () => {
    try {
        if (!audioCtx) audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const t = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine'; osc.frequency.setValueAtTime(80, t); osc.frequency.exponentialRampToValueAtTime(0.01, t + 0.1);
        gain.gain.setValueAtTime(0.15, t); gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
        osc.connect(gain); gain.connect(audioCtx.destination); osc.start(t); osc.stop(t + 0.1);
    } catch (e) {}
};

// Hat Renderers
const Hat = ({ type }: { type: string }) => {
    if (type === 'none') return null;
    return (
        <g transform="translate(50, 15)">
            {type === 'cap' && <path d="M-20 10 Q0 0 20 10 L20 15 Q0 5 -20 15 Z M20 15 L35 15 L30 10 L20 10" fill="#3b82f6" stroke="black" strokeWidth="2" />}
            {type === 'helmet' && <path d="M-25 25 Q-25 -10 0 -10 Q25 -10 25 25" fill="#94a3b8" stroke="black" strokeWidth="2" opacity="0.8" />}
            {type === 'crown' && <path d="M-20 15 L-20 -5 L-10 5 L0 -10 L10 5 L20 -5 L20 15 Z" fill="#facc15" stroke="black" strokeWidth="2" />}
            {type === 'ushanka' && <path d="M-22 5 L-22 20 M22 5 L22 20 M-20 5 H20 V-10 H-20 Z" fill="#78350f" stroke="black" strokeWidth="3" />}
            {type === 'goggles' && <g><circle cx="-10" cy="10" r="8" fill="#22d3ee" stroke="black" strokeWidth="2"/><circle cx="10" cy="10" r="8" fill="#22d3ee" stroke="black" strokeWidth="2"/><line x1="-2" y1="10" x2="2" y2="10" stroke="black" strokeWidth="2"/></g>}
            {type === 'horns' && <path d="M-15 15 Q-25 0 -10 -5 M15 15 Q25 0 10 -5" fill="#ef4444" stroke="black" strokeWidth="2" />}
            {type === 'halo' && <ellipse cx="0" cy="-15" rx="20" ry="5" fill="none" stroke="#facc15" strokeWidth="3" />}
            {type === 'cowboy' && <g transform="translate(0, -5)"><ellipse cx="0" cy="0" rx="30" ry="10" fill="#5D4037" stroke="black" strokeWidth="2"/><path d="M-15 0 Q-15 -20 0 -20 Q15 -20 15 0" fill="#5D4037" stroke="black" strokeWidth="2"/></g>}
            {type === 'chef' && <g transform="translate(0, -5)"><path d="M-15 10 L-15 -15 Q-15 -35 0 -35 Q15 -35 15 -15 L15 10 Z" fill="white" stroke="black" strokeWidth="2"/></g>}
            {type === 'party' && <g transform="translate(0, -5)"><path d="M-12 15 L0 -20 L12 15 Z" fill="#EC4899" stroke="black" strokeWidth="2"/><circle cx="0" cy="-20" r="2" fill="#FACC15"/></g>}
            {type === 'ninja' && <g transform="translate(0, 5)"><rect x="-22" y="0" width="44" height="10" fill="#1F2937" stroke="black" strokeWidth="2"/><circle cx="0" cy="5" r="3" fill="#EF4444"/><path d="M18 5 L35 0 L35 10 Z" fill="#1F2937"/></g>}
            {type === 'pirate' && <g transform="translate(0, -5)"><path d="M-25 10 Q0 -15 25 10 L20 15 Q0 0 -20 15 Z" fill="#1F2937" stroke="black" strokeWidth="2"/><path d="M-15 10 Q0 -15 15 10" fill="#1F2937" stroke="black" strokeWidth="2"/><circle cx="0" cy="0" r="3" fill="white" opacity="0.8"/></g>}
            {type === 'flower' && <g transform="translate(15, -10)"><circle cx="0" cy="0" r="4" fill="#FACC15"/><circle cx="0" cy="-6" r="4" fill="#F472B6"/><circle cx="5" cy="-3" r="4" fill="#F472B6"/><circle cx="5" cy="3" r="4" fill="#F472B6"/><circle cx="0" cy="6" r="4" fill="#F472B6"/><circle cx="-5" cy="3" r="4" fill="#F472B6"/><circle cx="-5" cy="-3" r="4" fill="#F472B6"/></g>}
        </g>
    );
};

// Skin Overlay Renderer
const SkinOverlay = ({ type }: { type: string }) => {
    switch(type) {
        case 'tux':
            return (
                <g>
                    {/* Suit sides */}
                    <path d="M30 25 Q30 75 40 75 V25 Z" fill="#111" opacity="0.9" />
                    <path d="M70 25 Q70 75 60 75 V25 Z" fill="#111" opacity="0.9" />
                    <rect x="30" y="70" width="40" height="10" fill="#111" opacity="0.9"/>
                    {/* Shirt V */}
                    <path d="M40 25 L50 50 L60 25" fill="white" opacity="0.9"/>
                    {/* Bowtie */}
                    <path d="M42 35 L58 35 L50 42 Z" fill="#ef4444" />
                    <circle cx="50" cy="38" r="2" fill="#ef4444" />
                </g>
            );
        case 'doctor':
            return (
                <g>
                    {/* Lab Coat */}
                    <rect x="30" y="25" width="40" height="55" rx="18" fill="white" opacity="0.7" />
                    <line x1="50" y1="25" x2="50" y2="80" stroke="#e5e7eb" strokeWidth="2" />
                    {/* Stethoscope */}
                    <path d="M38 35 Q38 60 50 60 Q62 60 62 35" fill="none" stroke="#4b5563" strokeWidth="2" />
                    <circle cx="50" cy="60" r="3" fill="#9ca3af" />
                </g>
            );
        case 'mechanic':
            return (
                <g>
                    {/* Overalls */}
                    <rect x="30" y="55" width="40" height="25" rx="10" fill="#374151" opacity="0.8" />
                    <rect x="38" y="35" width="24" height="25" rx="2" fill="#374151" opacity="0.8" />
                    <line x1="38" y1="35" x2="35" y2="25" stroke="#374151" strokeWidth="3" />
                    <line x1="62" y1="35" x2="65" y2="25" stroke="#374151" strokeWidth="3" />
                    {/* Pocket */}
                    <rect x="42" y="45" width="16" height="12" fill="#1f2937" />
                </g>
            );
        default: return null;
    }
}

export const Character: React.FC<CharacterProps> = ({ player, role, isLocal, isCelebrating }) => {
    const isDead = player.isDead;
    const isMoving = player.isMoving;
    const stepInterval = useRef<any>(null);

    useEffect(() => {
        if (isLocal && isMoving && !isDead && !player.isInVent) {
            if (!stepInterval.current) {
                playFootstep(); stepInterval.current = setInterval(playFootstep, 350); 
            }
        } else {
            if (stepInterval.current) { clearInterval(stepInterval.current); stepInterval.current = null; }
        }
        return () => { if (stepInterval.current) clearInterval(stepInterval.current); };
    }, [isLocal, isMoving, isDead, player.isInVent]);

    const skinPattern = player.skinId === 'camo' ? 'url(#camo)' : player.skinId === 'hazard' ? 'url(#hazard)' : null;

    return (
        <div style={{ left: player.position.x, top: player.position.y, opacity: player.isCloaked ? 0.2 : isDead ? 0.6 : 1, zIndex: Math.floor(player.position.y) }} className="absolute transform -translate-x-1/2 -translate-y-[85%] flex flex-col items-center pointer-events-none">
            {!isDead && (
                <span className="mb-1 text-white text-[10px] font-bold font-ui drop-shadow-[0_1px_2px_rgba(0,0,0,1)] bg-black/50 px-2 py-0.5 rounded-full whitespace-nowrap border border-white/10">
                    {player.name}
                </span>
            )}

            <div className={`relative w-24 h-24 transition-transform duration-200 ${player.direction === 'left' ? 'scale-x-[-1]' : 'scale-x-100'}`}>
                <svg viewBox="0 0 100 100" className={`w-full h-full overflow-visible ${isMoving ? 'animate-walk' : 'animate-bounce-slight'} ${isCelebrating ? 'animate-celebrate' : ''}`}>
                    <defs>
                        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="0" dy="4" stdDeviation="3" floodOpacity="0.3"/></filter>
                        <linearGradient id={`grad_${player.id}`} x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor={player.color} stopOpacity="1" /><stop offset="100%" stopColor="black" stopOpacity="0.4" /></linearGradient>
                        <linearGradient id="visorGrad" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#a5f3fc" /><stop offset="50%" stopColor="#22d3ee" /><stop offset="100%" stopColor="#0891b2" /></linearGradient>
                        <pattern id="camo" width="10" height="10" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="2" fill="#3f6212"/><circle cx="7" cy="7" r="1" fill="#14532d"/></pattern>
                        <pattern id="hazard" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="5" height="10" fill="#facc15"/><rect x="5" width="5" height="10" fill="#000"/></pattern>
                    </defs>

                    <ellipse cx="50" cy="90" rx="20" ry="6" fill="black" opacity="0.3" className="transition-all duration-200" />
                    
                    {/* Backpack */}
                    <path d="M20 35 L20 65 Q20 70 25 70 L35 70 L35 30 L25 30 Q20 30 20 35" fill={player.color} stroke="black" strokeWidth="2.5" filter="url(#shadow)"/>
                    {skinPattern && <path d="M20 35 L20 65 Q20 70 25 70 L35 70 L35 30 L25 30 Q20 30 20 35" fill={skinPattern} opacity="0.5" />}

                    {/* Legs */}
                    <g className={isMoving ? "animate-walk-legs" : ""}>
                        <rect x="35" y="75" width="12" height="18" rx="6" fill="#1f2937" stroke="black" strokeWidth="2.5" />
                        <rect x="53" y="75" width="12" height="18" rx="6" fill="#1f2937" stroke="black" strokeWidth="2.5" />
                    </g>

                    {/* Body */}
                    <rect x="30" y="25" width="40" height="55" rx="18" fill={player.color} stroke="black" strokeWidth="2.5" />
                    {skinPattern && <rect x="30" y="25" width="40" height="55" rx="18" fill={skinPattern} opacity="0.5" />}
                    <rect x="30" y="25" width="40" height="55" rx="18" fill={`url(#grad_${player.id})`} opacity="0.2" className="pointer-events-none"/>

                    {/* Skin Overlay */}
                    <SkinOverlay type={player.skinId} />

                    {/* Visor */}
                    <path d="M45 32 H65 Q75 32 75 42 V48 Q75 58 65 58 H45 Q35 58 35 48 V42 Q35 32 45 32" fill="url(#visorGrad)" stroke="black" strokeWidth="2.5" />
                    <path d="M48 36 H60 Q65 36 65 40 V42 Q65 44 60 44 H48 Q42 44 42 40 V40 Q42 36 48 36" fill="white" opacity="0.6" />

                    {/* Hat */}
                    <Hat type={player.hatId} />

                    {isDead && (
                        <g transform="translate(55, 45)" fill="black">
                            <path d="M-5 -5 L5 5 M-5 5 L5 -5" stroke="black" strokeWidth="3" />
                        </g>
                    )}
                </svg>
            </div>

            {isLocal && (
                <div className="mt-[-10px] text-[9px] font-black tracking-wider text-white bg-black/70 px-2 py-0.5 rounded-full border border-white/20 shadow-lg backdrop-blur-sm">
                    {role.name.toUpperCase()}
                </div>
            )}
        </div>
    );
};
