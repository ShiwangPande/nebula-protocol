
import React, { useState, useEffect, useRef } from 'react';
import { X, Wifi, Database, Zap, Droplet, Lock, Check, Anchor, FlaskConical, Activity, Radio, Cpu, Wind } from 'lucide-react';

interface TaskModalProps {
    taskId: string;
    taskType: string;
    onClose: () => void;
    onComplete: () => void;
}

// --- UTILS ---
const shuffle = (array: any[]) => [...array].sort(() => Math.random() - 0.5);
const COLORS = ['#ef4444', '#3b82f6', '#eab308', '#ec4899']; 

// --- SABOTAGE MINIGAMES ---

// 1. LIGHTS (Switches)
const LightsMinigame = ({ onComplete }: { onComplete: () => void }) => {
    // 5 switches, random initial state, ensuring at least one is off
    const [switches, setSwitches] = useState(() => {
        const s = Array(5).fill(false).map(() => Math.random() > 0.5);
        if (s.every(v => v)) s[Math.floor(Math.random() * 5)] = false;
        return s;
    });

    const toggle = (i: number) => {
        const newS = [...switches];
        newS[i] = !newS[i];
        setSwitches(newS);
        if (newS.every(v => v)) {
            setTimeout(onComplete, 300);
        }
    };

    return (
        <div className="bg-gray-800 w-[500px] p-8 rounded-xl border-4 border-yellow-600 shadow-2xl flex flex-col items-center select-none">
            <h2 className="text-2xl font-game text-yellow-400 mb-8 flex items-center gap-2">
                <Zap fill="currentColor"/> POWER REDIRECTION
            </h2>
            <div className="flex gap-4 bg-black/40 p-6 rounded-lg border border-gray-600">
                {switches.map((isOn, i) => (
                    <div key={i} className="flex flex-col items-center gap-2">
                        <div className={`w-3 h-3 rounded-full shadow-[0_0_10px_currentColor] ${isOn ? 'bg-green-500 text-green-500' : 'bg-red-500 text-red-500'}`} />
                        <button 
                            onClick={() => toggle(i)}
                            className={`w-16 h-24 rounded border-b-4 transition-all active:scale-95 active:border-b-0 ${isOn ? 'bg-gray-600 border-gray-800 translate-y-1' : 'bg-gray-200 border-gray-400 -translate-y-1'}`}
                        >
                            <div className={`w-8 h-1 mx-auto my-2 rounded ${isOn ? 'bg-green-500 shadow-[0_0_5px_#22c55e]' : 'bg-red-500 shadow-[0_0_5px_#ef4444]'}`}/>
                        </button>
                    </div>
                ))}
            </div>
            <div className="mt-6 text-gray-400 font-mono text-sm">TOGGLE ALL BREAKERS TO ACTIVE</div>
        </div>
    );
};

// 2. REACTOR (Simon Says Pattern)
const ReactorMinigame = ({ onComplete }: { onComplete: () => void }) => {
    const [sequence, setSequence] = useState<number[]>([]);
    const [playerSeq, setPlayerSeq] = useState<number[]>([]);
    const [playing, setPlaying] = useState(false);
    const [flash, setFlash] = useState<number | null>(null);
    const [round, setRound] = useState(0); // 0 to 2 (3 rounds)
    const [status, setStatus] = useState<'WAIT' | 'WATCH' | 'REPEAT'>('WAIT');

    const startRound = (r: number) => {
        setStatus('WATCH');
        const newSeq = Array(r + 3).fill(0).map(() => Math.floor(Math.random() * 9)); // 3, 4, 5 length
        setSequence(newSeq);
        setPlayerSeq([]);
        playSequence(newSeq);
    };

    const playSequence = async (seq: number[]) => {
        setPlaying(true);
        for (let i = 0; i < seq.length; i++) {
            await new Promise(r => setTimeout(r, 400));
            setFlash(seq[i]);
            await new Promise(r => setTimeout(r, 400));
            setFlash(null);
        }
        setPlaying(false);
        setStatus('REPEAT');
    };

    useEffect(() => {
        if (round === 0 && status === 'WAIT') startRound(0);
    }, []);

    const handlePress = (i: number) => {
        if (playing || status !== 'REPEAT') return;
        setFlash(i);
        setTimeout(() => setFlash(null), 200);
        
        const nextIdx = playerSeq.length;
        if (i !== sequence[nextIdx]) {
            // Fail
            setStatus('WAIT');
            setSequence([]);
            setTimeout(() => startRound(round), 500); // Retry same round
            return;
        }

        const newP = [...playerSeq, i];
        setPlayerSeq(newP);

        if (newP.length === sequence.length) {
            if (round >= 2) {
                setTimeout(onComplete, 500);
            } else {
                setRound(r => r + 1);
                setStatus('WAIT');
                setTimeout(() => startRound(round + 1), 1000);
            }
        }
    };

    return (
        <div className="bg-slate-800 w-[400px] p-6 rounded-xl border-4 border-red-600 shadow-2xl flex flex-col items-center select-none">
            <h2 className="text-2xl font-game text-red-500 mb-4 flex items-center gap-2"><Cpu/> REACTOR SYNC</h2>
            <div className="flex gap-1 mb-4">
                {[0,1,2].map(i => <div key={i} className={`w-3 h-3 rounded-full ${i < round ? 'bg-green-500' : i === round ? 'bg-yellow-500 animate-pulse' : 'bg-gray-600'}`}/>)}
            </div>
            <div className="grid grid-cols-3 gap-3 p-4 bg-black/50 rounded-lg">
                {[0,1,2,3,4,5,6,7,8].map(i => (
                    <button 
                        key={i} 
                        onClick={() => handlePress(i)}
                        className={`w-20 h-20 rounded border-2 transition-all duration-100 ${flash === i ? 'bg-blue-400 border-white shadow-[0_0_20px_#60a5fa] scale-95' : 'bg-slate-700 border-slate-500 hover:bg-slate-600'}`}
                    />
                ))}
            </div>
            <div className="mt-4 font-mono font-bold text-white">{status === 'WATCH' ? 'MEMORIZE PATTERN' : status === 'REPEAT' ? 'REPEAT PATTERN' : 'PREPARING...'}</div>
        </div>
    );
};

// 3. COMMS (Waveform)
const CommsMinigame = ({ onComplete }: { onComplete: () => void }) => {
    const [freq, setFreq] = useState(50);
    const [amp, setAmp] = useState(50);
    const targetFreq = 70;
    const targetAmp = 30;
    
    // Canvas ref would be better but CSS approximation is easier for this context
    const isAligned = Math.abs(freq - targetFreq) < 10 && Math.abs(amp - targetAmp) < 10;

    useEffect(() => {
        if (isAligned) {
            const t = setTimeout(onComplete, 800);
            return () => clearTimeout(t);
        }
    }, [isAligned, onComplete]);

    return (
        <div className="bg-gray-900 w-[450px] p-6 rounded-xl border-4 border-gray-500 shadow-2xl text-white select-none">
            <h2 className="text-xl font-game text-gray-300 mb-4 flex items-center gap-2"><Radio/> SIGNAL TUNER</h2>
            
            <div className="h-40 bg-black border border-green-900 mb-6 relative overflow-hidden rounded">
                <div className="absolute inset-0 opacity-30 flex items-center">
                    {/* Target Wave (Static representation) */}
                    <svg viewBox="0 0 100 20" className="w-full h-full stroke-red-500 fill-none stroke-2" preserveAspectRatio="none">
                        <path d={`M0 10 Q 25 ${10-targetAmp/5} 50 10 T 100 10`} />
                    </svg>
                </div>
                <div className="absolute inset-0 flex items-center">
                     {/* User Wave */}
                     <svg viewBox="0 0 100 20" className={`w-full h-full fill-none stroke-2 transition-colors duration-300 ${isAligned ? 'stroke-green-400 drop-shadow-[0_0_5px_#4ade80]' : 'stroke-green-700'}`} preserveAspectRatio="none">
                        <path d={`M0 10 Q ${25 * (100/freq)} ${10-(amp/5)} ${50 * (100/freq)} 10 T ${100 * (100/freq)} 10`} />
                    </svg>
                </div>
                {isAligned && <div className="absolute inset-0 flex items-center justify-center bg-green-500/20 text-green-400 font-bold tracking-widest animate-pulse">SIGNAL LOCKED</div>}
            </div>

            <div className="space-y-6 px-4">
                <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1"><span>FREQUENCY</span></div>
                    <input type="range" min="10" max="100" value={freq} onChange={e => setFreq(parseInt(e.target.value))} className="w-full accent-green-500"/>
                </div>
                <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1"><span>AMPLITUDE</span></div>
                    <input type="range" min="10" max="100" value={amp} onChange={e => setAmp(parseInt(e.target.value))} className="w-full accent-green-500"/>
                </div>
            </div>
        </div>
    );
};


// --- STANDARD TASKS ---

// --- 1. QUANTUM FUSE ALIGNMENT (Timing/Rotation) ---
const FuseMinigame = ({ onComplete }: { onComplete: () => void }) => {
    const [rings, setRings] = useState([
        { id: 0, angle: Math.random() * 360, speed: 3, stopped: false },
        { id: 1, angle: Math.random() * 360, speed: -4, stopped: false },
        { id: 2, angle: Math.random() * 360, speed: 5, stopped: false },
    ]);
    const rRef = useRef<number>(0);

    useEffect(() => {
        const loop = () => {
            setRings(prev => prev.map(r => {
                if (r.stopped) return r;
                return { ...r, angle: (r.angle + r.speed) % 360 };
            }));
            rRef.current = requestAnimationFrame(loop);
        };
        rRef.current = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(rRef.current);
    }, []);

    const stopRing = (id: number) => {
        setRings(prev => {
            const newRings = prev.map(r => {
                if (r.id !== id) return r;
                let norm = r.angle % 360;
                if (norm < 0) norm += 360;
                // Target is 0 (Top)
                const isAligned = norm < 30 || norm > 330;
                
                if (isAligned) return { ...r, stopped: true, angle: 0, speed: 0 }; 
                return { ...r, speed: r.speed * 1.5 }; // Penalty
            });
            if (newRings.every(r => r.stopped)) setTimeout(onComplete, 500);
            return newRings;
        });
    };

    return (
        <div className="bg-slate-900 w-[500px] h-[500px] p-6 rounded-full border-8 border-slate-700 shadow-2xl flex items-center justify-center relative overflow-hidden select-none">
             <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_20%,#000_100%)] pointer-events-none z-10"/>
             <div className={`w-16 h-16 rounded-full bg-cyan-500 shadow-[0_0_50px_#06b6d4] z-20 flex items-center justify-center ${rings.every(r=>r.stopped) ? 'animate-pulse' : ''}`}>
                 <Zap className="text-white" fill="white"/>
             </div>
             {rings.map((r, i) => {
                 const size = 150 + (i * 100);
                 return (
                     <div key={r.id} 
                        onClick={(e) => {
                            e.stopPropagation();
                            !r.stopped && stopRing(r.id);
                        }}
                        className={`absolute rounded-full border-[12px] cursor-pointer transition-colors hover:border-white ${r.stopped ? 'border-green-500 shadow-[0_0_20px_#22c55e]' : 'border-slate-600'}`}
                        style={{ 
                            width: size, 
                            height: size, 
                            transform: `rotate(${r.angle}deg)`, 
                            borderTopColor: r.stopped ? '#22c55e' : '#f59e0b',
                            zIndex: 50 - i
                        }}
                     >
                         <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-black border-2 border-white rounded-full"/>
                     </div>
                 )
             })}
        </div>
    )
};

// --- 2. BIOGEL MIXER (Color Matching) ---
const MixerMinigame = ({ onComplete }: { onComplete: () => void }) => {
    const target = useRef({ r: Math.floor(Math.random()*200)+55, g: Math.floor(Math.random()*200)+55, b: Math.floor(Math.random()*200)+55 });
    const [current, setCurrent] = useState({ r: 0, g: 0, b: 0 });
    const completedRef = useRef(false);
    
    useEffect(() => {
        const tol = 20;
        if (!completedRef.current && Math.abs(current.r - target.current.r) < tol && Math.abs(current.g - target.current.g) < tol && Math.abs(current.b - target.current.b) < tol) {
                completedRef.current = true;
                setTimeout(onComplete, 500);
        }
    }, [current, onComplete]);

    return (
        <div className="bg-gray-800 w-[500px] p-8 rounded-xl border-4 border-gray-600 shadow-2xl flex flex-col gap-6 select-none">
            <h2 className="text-2xl font-game text-white flex items-center gap-2"><FlaskConical className="text-pink-500"/> BIOGEL MIXER</h2>
            <div className="flex justify-between h-32 gap-4">
                <div className="flex-1 bg-black rounded border-2 border-gray-500 flex flex-col items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0" style={{backgroundColor: `rgb(${target.current.r},${target.current.g},${target.current.b})`}}/>
                    <span className="z-10 font-bold text-white bg-black/50 px-2 rounded">TARGET</span>
                </div>
                <div className="flex-1 bg-black rounded border-2 border-white flex flex-col items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 transition-colors duration-100" style={{backgroundColor: `rgb(${current.r},${current.g},${current.b})`}}/>
                    <span className="z-10 font-bold text-white bg-black/50 px-2 rounded">MIX</span>
                </div>
            </div>
            <div className="space-y-6 bg-black/30 p-4 rounded-lg">
                <div className="flex items-center gap-4"><span className="font-bold text-red-500 w-8">R</span><input type="range" min="0" max="255" value={current.r} onChange={e=>setCurrent({...current, r: parseInt(e.target.value)})} className="flex-1 accent-red-500 h-4 rounded-lg bg-gray-700 cursor-pointer"/></div>
                <div className="flex items-center gap-4"><span className="font-bold text-green-500 w-8">G</span><input type="range" min="0" max="255" value={current.g} onChange={e=>setCurrent({...current, g: parseInt(e.target.value)})} className="flex-1 accent-green-500 h-4 rounded-lg bg-gray-700 cursor-pointer"/></div>
                <div className="flex items-center gap-4"><span className="font-bold text-blue-500 w-8">B</span><input type="range" min="0" max="255" value={current.b} onChange={e=>setCurrent({...current, b: parseInt(e.target.value)})} className="flex-1 accent-blue-500 h-4 rounded-lg bg-gray-700 cursor-pointer"/></div>
            </div>
        </div>
    )
}

// --- 3. GRAVITY STABILIZER (Physics Balancing) ---
const GravityMinigame = ({ onComplete }: { onComplete: () => void }) => {
    const [pos, setPos] = useState(50); 
    const [velocity, setVelocity] = useState(0);
    const [stability, setStability] = useState(0); 

    useEffect(() => {
        const interval = setInterval(() => {
            const drift = (Math.random() - 0.5) * 1.5;
            let newPos = pos + velocity + drift;
            if (newPos < 0) { newPos = 0; setVelocity(v => -v * 0.5); }
            if (newPos > 100) { newPos = 100; setVelocity(v => -v * 0.5); }
            setPos(newPos);
            if (newPos > 40 && newPos < 60) {
                setStability(s => {
                    if (s >= 100) { clearInterval(interval); setTimeout(onComplete, 200); return 100; }
                    return s + 1;
                });
            } else {
                setStability(s => Math.max(0, s - 2)); 
            }
        }, 30);
        return () => clearInterval(interval);
    }, [pos, velocity]);

    const push = (dir: number) => setVelocity(v => v + dir);

    return (
        <div className="bg-space-900 w-[400px] p-6 rounded-2xl border-4 border-neon-cyan shadow-[0_0_30px_#06b6d4] select-none">
             <h2 className="text-xl font-game text-neon-cyan mb-4 flex items-center gap-2"><Anchor/> GRAVITY STABILIZER</h2>
             <div className="h-64 bg-black border-2 border-gray-700 rounded relative mb-4 overflow-hidden">
                 <div className="absolute top-0 bottom-0 left-[40%] right-[40%] bg-green-500/20 border-l border-r border-green-500/50 flex items-center justify-center"><div className="w-0.5 h-full bg-green-500/30 dashed"/></div>
                 <div className="absolute top-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-[0_0_15px_white] transition-all duration-75" style={{ left: `calc(${pos}% - 16px)` }}>
                     <div className="absolute inset-0 bg-neon-cyan opacity-50 rounded-full animate-ping"/>
                 </div>
             </div>
             <div className="flex gap-4 mb-4">
                 <button onMouseDown={()=>push(-2)} className="flex-1 bg-gray-700 hover:bg-gray-600 p-4 rounded font-bold text-white shadow-lg active:translate-y-1">PUSH LEFT</button>
                 <button onMouseDown={()=>push(2)} className="flex-1 bg-gray-700 hover:bg-gray-600 p-4 rounded font-bold text-white shadow-lg active:translate-y-1">PUSH RIGHT</button>
             </div>
             <div className="w-full bg-gray-800 h-4 rounded-full overflow-hidden border border-gray-600"><div className="h-full bg-green-500 transition-all duration-100" style={{width: `${stability}%`}}/></div>
        </div>
    )
}

// --- 4. MAG-LOCK OVERRIDE (Rhythm/Switching) ---
const MagLockMinigame = ({ onComplete }: { onComplete: () => void }) => {
    const [switches, setSwitches] = useState([false, false, false, false]);
    const [target, setTarget] = useState(0); 
    const [stage, setStage] = useState(0); 

    const handleToggle = (idx: number) => {
        if (idx !== target) {
            setStage(0); setSwitches([false, false, false, false]); setTarget(Math.floor(Math.random() * 4)); return;
        }
        const newSwitches = [...switches]; newSwitches[idx] = !newSwitches[idx]; setSwitches(newSwitches);
        if (stage >= 4) { setTimeout(onComplete, 300); } 
        else { setStage(s => s + 1); let next; do { next = Math.floor(Math.random() * 4); } while (next === idx); setTarget(next); }
    };

    return (
        <div className="bg-slate-800 w-[500px] p-8 rounded-lg border-b-8 border-r-8 border-black shadow-xl select-none">
             <div className="flex justify-between items-center mb-8">
                 <h2 className="text-2xl font-game text-yellow-500 flex items-center gap-2"><Lock/> MANUAL OVERRIDE</h2>
                 <div className="font-mono text-xl text-yellow-500">SEQ: {stage}/5</div>
             </div>
             <div className="flex justify-center gap-6">
                 {switches.map((isOn, i) => (
                     <div key={i} className="flex flex-col items-center gap-4">
                         <div className={`w-4 h-4 rounded-full ${i === target ? 'bg-red-500 animate-ping' : 'bg-gray-900'}`}/>
                         <div onClick={() => handleToggle(i)} className={`w-16 h-32 rounded-lg cursor-pointer transition-all shadow-lg relative ${isOn ? 'bg-green-600 top-4 shadow-none' : 'bg-gray-300 top-0 shadow-[0_10px_0_#4b5563]'}`}>
                             <div className="absolute inset-x-2 top-2 h-1 bg-white/20 rounded"/>
                         </div>
                     </div>
                 ))}
             </div>
        </div>
    )
}

// --- STANDARD WIRES ---
const WiringMinigame = ({ onComplete }: { onComplete: () => void }) => {
    const [leftColors] = useState(() => shuffle([...COLORS]));
    const [rightColors] = useState(() => shuffle([...COLORS]));
    const [connections, setConnections] = useState<{ leftIdx: number; rightIdx: number; color: string }[]>([]);
    const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
    const [status, setStatus] = useState<'active' | 'success'>('active');

    const handleLeftClick = (index: number) => { if (connections.some(c => c.leftIdx === index)) return; setSelectedLeft(index); };
    const handleRightClick = (index: number) => {
        if (selectedLeft === null || connections.some(c => c.rightIdx === index)) return; 
        const color = leftColors[selectedLeft];
        if (rightColors[index] === color) {
            const newConns = [...connections, { leftIdx: selectedLeft, rightIdx: index, color }];
            setConnections(newConns); setSelectedLeft(null);
            if (newConns.length === 4) { setStatus('success'); setTimeout(onComplete, 500); }
        } else { setSelectedLeft(null); }
    };

    return (
        <div className="bg-gray-900 w-[500px] h-[400px] p-8 rounded-xl border-4 border-gray-700 shadow-2xl relative flex justify-between items-center select-none">
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                {connections.map((c, i) => {
                    const y1 = 48 + (c.leftIdx * 80) + 20; const y2 = 48 + (c.rightIdx * 80) + 20;
                    return <line key={i} x1="60" y1={y1} x2="440" y2={y2} stroke={c.color} strokeWidth="12" strokeLinecap="round" className="drop-shadow-lg" />;
                })}
                {selectedLeft !== null && (<line x1="60" y1={48 + (selectedLeft * 80) + 20} x2="440" y2={200} stroke={leftColors[selectedLeft]} strokeWidth="12" strokeLinecap="round" strokeDasharray="20,10" className="opacity-50 animate-pulse" />)}
            </svg>
            <div className="flex flex-col gap-12 z-20">
                {leftColors.map((c, i) => (<button key={i} onClick={() => handleLeftClick(i)} className={`w-12 h-10 rounded-r-lg border-2 border-l-0 border-white shadow-md transition-transform active:scale-95 ${selectedLeft === i ? 'ring-4 ring-white' : ''}`} style={{ backgroundColor: c, opacity: connections.some(x => x.leftIdx === i) ? 0.5 : 1 }} />))}
            </div>
            <div className="flex flex-col gap-12 z-20">
                {rightColors.map((c, i) => (<button key={i} onClick={() => handleRightClick(i)} className="w-12 h-10 rounded-l-lg border-2 border-r-0 border-white shadow-md transition-transform active:scale-95 hover:brightness-110" style={{ backgroundColor: c, opacity: connections.some(x => x.rightIdx === i) ? 0.5 : 1 }} />))}
            </div>
            {status === 'success' && (<div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-30 animate-in fade-in"><div className="text-green-500 font-game text-5xl flex items-center gap-4 drop-shadow-[0_0_10px_rgba(0,255,0,0.8)]"><Check size={48} strokeWidth={4} /> FIXED</div></div>)}
        </div>
    );
};

// --- FUEL ENGINE ---
const FuelMinigame = ({ onComplete }: { onComplete: () => void }) => {
    const [fill, setFill] = useState(0);
    const [isFilling, setIsFilling] = useState(false);
    const completedRef = useRef(false);

    useEffect(() => {
        let interval: any;
        if (isFilling && !completedRef.current) {
            interval = setInterval(() => {
                setFill(prev => {
                    const next = prev + 1;
                    if (next >= 100) return 100;
                    return next; 
                });
            }, 30);
        }
        return () => clearInterval(interval);
    }, [isFilling]);

    useEffect(() => {
        if (fill >= 100 && !completedRef.current) {
            completedRef.current = true;
            setIsFilling(false);
            setTimeout(() => {
                onComplete();
            }, 500);
        }
    }, [fill, onComplete]);

    return (
        <div className="bg-slate-800 w-[400px] h-[500px] p-6 rounded-2xl border-4 border-slate-600 shadow-2xl flex flex-col items-center select-none">
            <h2 className="text-orange-400 font-game text-2xl mb-4 flex items-center gap-2"><Droplet className="fill-current"/> REFUELING ENGINE</h2>
            <div className={`w-32 h-64 border-4 border-gray-400 bg-gray-900 rounded-lg relative overflow-hidden mb-6 ${isFilling ? 'animate-bounce-slight' : ''}`}>
                <div className="absolute bottom-0 left-0 right-0 bg-orange-500 transition-all duration-100 ease-linear" style={{ height: `${fill}%` }}>
                    <div className="w-full h-2 bg-orange-300 opacity-50 absolute top-0 animate-pulse" />
                </div>
                <div className="absolute top-1/4 w-full h-0.5 bg-gray-700 dashed" />
                <div className="absolute top-2/4 w-full h-0.5 bg-gray-700 dashed" />
                <div className="absolute top-3/4 w-full h-0.5 bg-gray-700 dashed" />
            </div>
            <button 
                onMouseDown={() => { if (fill < 100) setIsFilling(true); }} 
                onMouseUp={() => setIsFilling(false)} 
                onMouseLeave={() => setIsFilling(false)} 
                onTouchStart={() => { if (fill < 100) setIsFilling(true); }} 
                onTouchEnd={() => setIsFilling(false)} 
                disabled={fill >= 100} 
                className={`w-24 h-24 rounded-full border-4 shadow-[0_4px_0_rgba(0,0,0,0.5)] flex items-center justify-center transition-transform active:scale-95 active:shadow-none active:translate-y-1 ${fill >= 100 ? 'bg-green-500 border-green-700 cursor-default' : 'bg-gray-300 border-gray-400 hover:bg-white cursor-pointer'}`}
            >
                <div className="w-16 h-16 rounded-full border-2 border-black/10 bg-black/5" />
            </button>
        </div>
    );
};

// --- KEYPAD ---
const KeypadMinigame = ({ onComplete }: { onComplete: () => void }) => {
    const [code, setCode] = useState(''); const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle'); const target = '5821'; 
    const handlePress = (key: string) => {
        if (status === 'success') return;
        if (key === 'C') { setCode(''); setStatus('idle'); return; }
        if (key === 'OK') { if (code === target) { setStatus('success'); setTimeout(onComplete, 600); } else { setStatus('error'); setTimeout(() => { setCode(''); setStatus('idle'); }, 500); } return; }
        if (code.length < 4) setCode(code + key);
    };
    return (
        <div className="bg-gray-800 w-[300px] p-6 rounded-lg border-t-4 border-b-8 border-gray-900 shadow-2xl select-none">
            <h2 className="text-xl font-game text-white mb-4 text-center">SYSTEM OVERRIDE</h2>
            <div className="bg-[#1a2e22] h-16 mb-4 rounded border-2 border-[#4ade80]/20 flex items-center justify-end px-4 font-mono text-3xl tracking-[0.5em] text-[#4ade80] shadow-inner relative overflow-hidden">
                <span className="z-10">{status === 'success' ? 'OPEN' : status === 'error' ? 'ERR' : code.padEnd(4, '_')}</span>
                <div className="absolute inset-0 bg-scan-line opacity-10 pointer-events-none" />
            </div>
            <div className="grid grid-cols-3 gap-3">
                {[1,2,3,4,5,6,7,8,9].map(n => (<button key={n} onClick={() => handlePress(n.toString())} className="h-14 bg-gray-600 rounded shadow-[0_3px_0_#374151] active:translate-y-1 active:shadow-none text-white font-bold text-xl hover:bg-gray-500 transition-colors">{n}</button>))}
                <button onClick={() => handlePress('C')} className="h-14 bg-red-800 rounded shadow-[0_3px_0_#7f1d1d] active:translate-y-1 active:shadow-none text-white font-bold hover:bg-red-700">C</button>
                <button onClick={() => handlePress('0')} className="h-14 bg-gray-600 rounded shadow-[0_3px_0_#374151] active:translate-y-1 active:shadow-none text-white font-bold text-xl hover:bg-gray-500">0</button>
                <button onClick={() => handlePress('OK')} className="h-14 bg-green-700 rounded shadow-[0_3px_0_#14532d] active:translate-y-1 active:shadow-none text-white font-bold hover:bg-green-600">OK</button>
            </div>
            <div className="mt-2 text-center text-xs text-gray-500 font-mono">CODE: 5821</div>
        </div>
    );
};

// --- UPLOAD ---
const UploadMinigame = ({ taskType, onComplete }: { taskType: string, onComplete: () => void }) => {
    const [progress, setProgress] = useState(0); const [status, setStatus] = useState<'idle' | 'uploading' | 'done'>('idle');
    useEffect(() => {
        if (status === 'uploading') {
            const int = setInterval(() => { setProgress(p => { if (p >= 100) { setStatus('done'); setTimeout(onComplete, 800); return 100; } return p + (Math.random() * 3); }); }, 50);
            return () => clearInterval(int);
        }
    }, [status]);
    return (
        <div className="bg-black/90 w-[500px] p-8 rounded-xl border border-neon-cyan shadow-[0_0_50px_rgba(0,242,255,0.15)] text-neon-cyan font-mono relative overflow-hidden select-none">
            <div className="absolute inset-0 bg-grid-pattern opacity-10 animate-pulse pointer-events-none" />
            <div className="flex justify-between items-center mb-8 relative z-10">
                <div className="flex items-center gap-4">
                    <div className={`p-4 rounded-full border-2 border-neon-cyan ${status === 'uploading' ? 'animate-pulse bg-neon-cyan/20' : ''}`}><Database size={32} /></div>
                    <div className="flex gap-1">{[1,2,3,4,5].map(i => <div key={i} className={`w-2 h-2 rounded-full ${progress > i*20 ? 'bg-neon-cyan' : 'bg-gray-800'}`} />)}</div>
                    <div className={`p-4 rounded-full border-2 border-neon-cyan ${status === 'done' ? 'bg-neon-cyan text-black' : ''}`}><Wifi size={32} /></div>
                </div>
                <div className="text-4xl font-bold">{Math.floor(progress)}%</div>
            </div>
            <div className="w-full h-8 bg-gray-900 border border-gray-700 rounded-sm overflow-hidden mb-4 relative z-10">
                <div className="h-full bg-neon-cyan shadow-[0_0_20px_rgba(0,242,255,0.8)] transition-all duration-100 ease-out" style={{ width: `${progress}%` }} />
            </div>
            <div className="flex justify-between items-center relative z-10 h-8">
                <div className="text-xs text-gray-400">{status === 'idle' ? 'WAITING FOR CONNECTION...' : status === 'uploading' ? 'TRANSFERRING PACKETS...' : 'UPLOAD COMPLETE'}</div>
                {status === 'idle' && <button onClick={() => setStatus('uploading')} className="bg-neon-cyan text-black px-6 py-1 rounded font-bold hover:bg-white hover:shadow-[0_0_15px_white] transition-all">INITIATE</button>}
            </div>
        </div>
    );
};

// --- MAIN WRAPPER ---
export const TaskModal: React.FC<TaskModalProps> = ({ taskId, taskType, onClose, onComplete }) => {
    let content;

    switch (taskType) {
        case 'fix_wiring': content = <WiringMinigame onComplete={onComplete} />; break;
        case 'fuel_engines': content = <FuelMinigame onComplete={onComplete} />; break;
        case 'upload_data':
        case 'scan_sample': content = <UploadMinigame taskType={taskType} onComplete={onComplete} />; break;
        case 'align_fuse': content = <FuseMinigame onComplete={onComplete} />; break;
        case 'mix_chemical': content = <MixerMinigame onComplete={onComplete} />; break;
        case 'stabilize_gravity': content = <GravityMinigame onComplete={onComplete} />; break;
        case 'unlock_manifold': content = <MagLockMinigame onComplete={onComplete} />; break;
        // SABOTAGE FIXES
        case 'fix_lights': content = <LightsMinigame onComplete={onComplete} />; break;
        case 'fix_oxygen': content = <KeypadMinigame onComplete={onComplete} />; break;
        case 'fix_reactor': content = <ReactorMinigame onComplete={onComplete} />; break;
        case 'fix_comms': content = <CommsMinigame onComplete={onComplete} />; break;
        default: content = <KeypadMinigame onComplete={onComplete} />; break;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative">
                <button onClick={onClose} className="absolute -top-12 right-0 text-white hover:text-red-500 transition-colors bg-black/50 p-2 rounded-full border border-white/20">
                    <X size={24} />
                </button>
                {content}
            </div>
        </div>
    );
};
