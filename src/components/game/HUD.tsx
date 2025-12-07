
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { GameState, GameAction, Player, Team, SabotageType, MapObject } from '../../types';
import { MAP_REGISTRY } from '../../data/mapRegistry';
import { Wind, Hand, Zap, Crosshair, Siren, Flame, Map as MapIcon, Minimize2, Radio, Lock } from 'lucide-react';

// --- SUB-COMPONENTS ---

interface ActionButtonProps {
    icon: React.ElementType;
    label: string;
    onClick: () => void;
    color?: string;
    textColor?: string;
    cooldown?: number;
    maxCooldown?: number;
    className?: string;
    disabled?: boolean;
}

const ActionButton: React.FC<ActionButtonProps> = ({ icon: Icon, label, onClick, color = 'bg-white', textColor = 'text-black', cooldown = 0, maxCooldown = 1, className = '', disabled = false }) => {
    const safeMax = maxCooldown > 0 ? maxCooldown : 1;
    const percent = Math.min(100, Math.max(0, (cooldown / safeMax) * 100));

    return (
        <button 
            onClick={onClick} 
            onTouchStart={(e) => { e.stopPropagation(); if(!disabled && cooldown <= 0) onClick(); }} // Better touch response
            disabled={disabled || cooldown > 0} 
            className={`group relative w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-black ${color} flex flex-col items-center justify-center shadow-xl active:scale-95 transition-transform overflow-hidden ${disabled ? 'opacity-50 cursor-not-allowed grayscale' : ''} ${className}`}
        >
            <Icon size={24} className={`${textColor} group-hover:scale-110 transition-transform z-10 md:w-7 md:h-7 ${cooldown > 0 ? 'opacity-50' : ''}`}/>
            <span className={`text-[9px] md:text-[10px] font-bold ${textColor} z-10 mt-1 ${cooldown > 0 ? 'opacity-50' : ''}`}>{label}</span>

            {/* Cooldown Overlay */}
            {cooldown > 0 && (
                <>
                    {/* Radial Wipe Progress */}
                    <div 
                        className="absolute inset-0 z-20 pointer-events-none"
                        style={{
                            background: `conic-gradient(rgba(0,0,0,0.7) ${percent}%, transparent 0)`
                        }}
                    />
                    
                    {/* Text Countdown */}
                    <div className="absolute inset-0 z-30 flex items-center justify-center text-white font-mono font-bold text-xl drop-shadow-[0_2px_2px_rgba(0,0,0,1)]">
                        {Math.ceil(cooldown)}
                    </div>
                </>
            )}
        </button>
    );
};

// Robust Virtual Joystick Component (Fixed Center)
const Joystick = ({ onMove }: { onMove: (x: number, y: number) => void }) => {
    const [pos, setPos] = useState({ x: 0, y: 0 });
    const [active, setActive] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const idRef = useRef<number | null>(null);

    const updatePosition = (clientX: number, clientY: number) => {
        if (!containerRef.current) return;
        
        const rect = containerRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const dx = clientX - centerX;
        const dy = clientY - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = rect.width / 2; // Radius of the container

        const clampedDist = Math.min(dist, maxDist);
        const angle = Math.atan2(dy, dx);

        const x = Math.cos(angle) * clampedDist;
        const y = Math.sin(angle) * clampedDist;

        setPos({ x, y });
        // Normalize -1 to 1
        onMove(x / maxDist, y / maxDist);
    };

    useEffect(() => {
        const handleMove = (e: TouchEvent) => {
            if (!active) return;
            const touch = Array.from(e.touches).find(t => t.identifier === idRef.current);
            if (!touch) return;
            e.preventDefault(); // Prevent scrolling
            updatePosition(touch.clientX, touch.clientY);
        };

        const handleEnd = (e: TouchEvent) => {
             const touch = Array.from(e.changedTouches).find(t => t.identifier === idRef.current);
             if (touch) {
                 setActive(false);
                 setPos({ x: 0, y: 0 });
                 onMove(0, 0);
                 idRef.current = null;
             }
        };

        if (active) {
            window.addEventListener('touchmove', handleMove, { passive: false });
            window.addEventListener('touchend', handleEnd);
            window.addEventListener('touchcancel', handleEnd);
        }

        return () => {
            window.removeEventListener('touchmove', handleMove);
            window.removeEventListener('touchend', handleEnd);
            window.removeEventListener('touchcancel', handleEnd);
        };
    }, [active, onMove]);

    const onStart = (e: React.TouchEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const touch = e.changedTouches[0];
        idRef.current = touch.identifier;
        setActive(true);
        updatePosition(touch.clientX, touch.clientY);
    };

    return (
        <div 
            ref={containerRef}
            className={`absolute bottom-6 left-6 w-48 h-48 rounded-full pointer-events-auto touch-none flex items-center justify-center transition-opacity duration-200 z-50 ${active ? 'opacity-90' : 'opacity-50 hover:opacity-70'}`}
            onTouchStart={onStart}
            style={{ touchAction: 'none' }}
        >
             {/* Base */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-full border-2 border-white/20 shadow-lg" />
            
            {/* Inner Ring (Limit) */}
            <div className="absolute inset-4 rounded-full border border-white/10 opacity-50" />
            
             {/* Stick */}
            <div 
                className="absolute w-20 h-20 rounded-full shadow-[0_4px_10px_rgba(0,0,0,0.5)] transition-transform duration-75 ease-linear flex items-center justify-center pointer-events-none"
                style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}
            >
                {/* Stick Gradient */}
                <div className="w-full h-full rounded-full bg-gradient-to-t from-gray-400 to-white border border-gray-300" />
                {/* Thumb Grip */}
                <div className="absolute w-14 h-14 rounded-full bg-gradient-to-br from-gray-200 to-gray-400 border border-gray-300 opacity-80" />
            </div>
        </div>
    );
};

const MiniMap = ({ mapObjects, playerPos, theme, isExpanded, onToggle, tasks, sabotageMode, onTrigger, cooldown }: any) => {
    const WORLD_SIZE = 2400; 
    
    const mapGeometry = useMemo(() => {
        return mapObjects.filter((o: MapObject) => o.type === 'floor' || o.type === 'wall' || o.type === 'door');
    }, [mapObjects]);

    const systems = [
        { type: 'REACTOR', x: 1600, y: 1200, icon: Flame, color: 'text-red-500' },
        { type: 'OXYGEN', x: 1200, y: 600, icon: Wind, color: 'text-blue-500' },
        { type: 'LIGHTS', x: 600, y: 1100, icon: Zap, color: 'text-yellow-500' },
        { type: 'COMMS', x: 1100, y: 1100, icon: Radio, color: 'text-gray-400' },
    ];

    const isSabotageReady = cooldown <= 0;

    return (
        <div 
            onClick={!sabotageMode ? onToggle : undefined}
            className={`fixed transition-all duration-300 bg-space-900 border-4 border-gray-600 shadow-2xl overflow-hidden z-[100] group ${
                (isExpanded || sabotageMode) 
                ? 'inset-4 md:inset-12 w-auto h-auto rounded-xl bg-black/90 cursor-default' 
                : 'top-4 right-4 w-32 h-32 md:w-48 md:h-48 rounded-full hover:border-neon-cyan cursor-pointer'
            }`}
        >
            {!sabotageMode && <div className="absolute top-2 right-2 text-white/50 z-20">
                 {isExpanded ? <Minimize2 size={24}/> : <MapIcon size={20}/>}
            </div>}
            
            {sabotageMode && <div className="absolute top-4 left-4 z-50 text-white font-game text-xl md:text-2xl">SABOTAGE SYSTEMS {cooldown > 0 && <span className="text-red-500">({Math.ceil(cooldown)}s)</span>}</div>}

            <div className="relative w-full h-full">
                {mapGeometry.map((obj: MapObject) => (
                    <div 
                        key={obj.id}
                        className="absolute"
                        style={{
                            left: `${(obj.x / WORLD_SIZE) * 100}%`,
                            top: `${(obj.y / WORLD_SIZE) * 100}%`,
                            width: `${(obj.width / WORLD_SIZE) * 100}%`,
                            height: `${(obj.height / WORLD_SIZE) * 100}%`,
                            backgroundColor: obj.type === 'floor' ? theme.floorColor : obj.type === 'door' ? theme.doorColor : theme.wallColor,
                            opacity: (isExpanded || sabotageMode) ? 0.8 : 0.6
                        }}
                    >
                        {sabotageMode && obj.type === 'door' && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); onTrigger('DOOR', obj.id); }}
                                className="absolute inset-0 flex items-center justify-center hover:bg-red-500/50 transition-colors"
                            >
                                <Lock size={12} className={obj.isLocked ? "text-red-500" : "text-white opacity-50"} />
                            </button>
                        )}
                    </div>
                ))}

                {!sabotageMode && tasks.filter((t: any) => !t.completed).map((t: any) => (
                    <div 
                        key={t.id}
                        className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-pulse shadow-[0_0_5px_yellow]"
                        style={{
                            left: `${(t.location.x / WORLD_SIZE) * 100}%`,
                            top: `${(t.location.y / WORLD_SIZE) * 100}%`,
                            transform: 'translate(-50%, -50%)'
                        }}
                    />
                ))}

                {sabotageMode && systems.map(sys => (
                    <button 
                        key={sys.type}
                        disabled={!isSabotageReady}
                        onClick={(e) => { e.stopPropagation(); onTrigger('SYSTEM', sys.type); }}
                        className={`absolute w-12 h-12 rounded-full border-2 border-white flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2 transition-all hover:scale-110 ${!isSabotageReady ? 'opacity-30 grayscale cursor-not-allowed' : 'bg-black/80 hover:bg-red-900 cursor-pointer'}`}
                        style={{ left: `${(sys.x / WORLD_SIZE) * 100}%`, top: `${(sys.y / WORLD_SIZE) * 100}%` }}
                    >
                        <sys.icon className={sys.color} size={24} />
                    </button>
                ))}

                <div 
                    className="absolute w-3 h-3 bg-green-500 border border-white rounded-full shadow-[0_0_8px_#4ade80] z-10 transition-all duration-75"
                    style={{
                        left: `${(playerPos.x / WORLD_SIZE) * 100}%`,
                        top: `${(playerPos.y / WORLD_SIZE) * 100}%`,
                        transform: 'translate(-50%, -50%)'
                    }}
                />
                
                {isExpanded && !sabotageMode && <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white font-game text-xl tracking-widest bg-black/50 px-4 py-1 rounded">TACTICAL MAP</div>}
            </div>
        </div>
    );
};

// --- MAIN COMPONENT ---

interface HUDProps {
    state: GameState;
    player: Player;
    onInteract: () => void;
    onAction: (action: string) => void;
    onToggleSabotageMap?: () => void;
    showSabotageMap?: boolean;
    dispatch?: React.Dispatch<GameAction>;
    canReport?: boolean;
    onJoystickMove?: (x: number, y: number) => void;
}

export const HUD = ({ state, player, onInteract, onAction, onToggleSabotageMap, showSabotageMap, dispatch, canReport, onJoystickMove }: HUDProps) => {
    const role = state.modRegistry.roles[player.roleId];
    const isImpostor = role.team === Team.GLITCH;
    const activeMap = MAP_REGISTRY[state.activeMapId];
    
    const [mapExpanded, setMapExpanded] = useState(false);

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key.toLowerCase() === 'm' && state.phase === 'PLAYING' && !state.activeTask && !showSabotageMap) {
                setMapExpanded(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [state.phase, state.activeTask, showSabotageMap]);
    
    const triggerSabotage = (category: 'SYSTEM' | 'DOOR', target: any) => {
        if (!dispatch) return;
        if (category === 'SYSTEM') {
            dispatch({ type: 'TRIGGER_SABOTAGE', payload: { type: target } });
            if (onToggleSabotageMap) onToggleSabotageMap();
        } else {
            dispatch({ type: 'SABOTAGE_DOORS', payload: { doorIds: [target] } });
        }
    };

    return (
        <div className="absolute inset-0 pointer-events-none z-40 p-4 flex flex-col justify-between select-none">
            {/* Top Bar */}
            <div className="pointer-events-auto flex justify-between items-start">
                {/* Task Bar */}
                {(!state.systems.comms.active && !isImpostor) ? (
                    <div className="bg-red-900/80 border-2 border-red-500 p-4 rounded-xl shadow-lg w-48 md:w-64 animate-pulse">
                        <div className="text-white font-game text-md md:text-xl flex items-center gap-2"><Radio className="animate-spin"/> COMMS DOWN</div>
                    </div>
                ) : (
                    <div className="bg-black/60 backdrop-blur-md border-2 border-gray-600 p-3 rounded-xl shadow-lg w-48 md:w-64">
                        <div className="flex justify-between text-xs text-white font-bold mb-1">
                            <span>TOTAL TASKS</span>
                            <span className="text-neon-green">ACTIVE</span>
                        </div>
                        <div className="w-full h-3 bg-black rounded-full overflow-hidden border border-gray-700 mb-2">
                            <div className="h-full bg-gradient-to-r from-green-400 to-emerald-600 w-[25%] shadow-[0_0_10px_#4ade80]"></div>
                        </div>
                        <div className="text-white text-[10px] space-y-1 font-mono max-h-24 overflow-y-auto">
                            {player.tasks.map(t => (
                                <div key={t.id} className={`flex items-center gap-2 ${t.completed ? 'text-green-500 line-through opacity-50' : 'text-gray-200'}`}>
                                    <div className={`w-2 h-2 rounded-full ${t.completed ? 'bg-green-500' : 'bg-yellow-400 animate-pulse'}`}/>
                                    {state.modRegistry.tasks[t.taskId].name}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {(mapExpanded || !showSabotageMap) && (
                    <MiniMap 
                        mapObjects={state.map} 
                        playerPos={player.position} 
                        theme={activeMap.theme}
                        isExpanded={mapExpanded}
                        onToggle={() => setMapExpanded(!mapExpanded)}
                        tasks={player.tasks}
                        sabotageMode={showSabotageMap}
                        onTrigger={triggerSabotage}
                        cooldown={state.systems.globalSabotageCooldown}
                        systemState={state.systems}
                    />
                )}
            </div>

            {state.activeSabotage && (
                <div className="absolute top-24 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-auto w-full px-4 text-center">
                    <div className="bg-red-600/90 text-white px-4 md:px-8 py-3 rounded-full animate-pulse font-game text-sm md:text-xl border-4 border-red-900 flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(220,38,38,0.6)]">
                        <Siren className="animate-spin" /> 
                        {state.activeSabotage} FAILURE 
                        {state.systems.reactor.meltdownTimer && ` (${Math.ceil(state.systems.reactor.meltdownTimer)}s)`}
                        {state.systems.oxygen.depletionTimer && ` (${Math.ceil(state.systems.oxygen.depletionTimer)}s)`}
                    </div>
                    <div className="text-red-500 font-bold animate-bounce text-xl md:text-2xl drop-shadow-md">
                        ↓ REPAIR STATIONS ACTIVE
                    </div>
                </div>
            )}

            <div className="flex-1 relative">
                {onJoystickMove && <Joystick onMove={onJoystickMove} />}
                
                <div className="absolute bottom-4 right-4 pointer-events-auto flex flex-col items-end gap-2 md:flex-row md:items-end md:gap-4">
                   {role.abilityName && (
                       <ActionButton icon={Zap} label={role.abilityName} color="bg-purple-600" textColor="text-white" onClick={() => onAction('ABILITY')} />
                   )}
                   
                   {player.isInVent ? (
                       <ActionButton icon={Wind} label="EXIT" color="bg-gray-300" onClick={() => onAction('EXIT_VENT')} />
                   ) : (
                       <ActionButton icon={Hand} label="USE" color="bg-white hover:bg-yellow-50" onClick={onInteract} />
                   )}
                   
                   {isImpostor && (
                       <>
                        <ActionButton icon={Zap} label="SABOTAGE" color="bg-gray-800" textColor="text-red-500" onClick={() => onAction('SABOTAGE')} />
                        <ActionButton 
                            icon={Crosshair} 
                            label="KILL" 
                            color="bg-white" 
                            textColor="text-red-600" 
                            onClick={() => onAction('KILL')} 
                            cooldown={player.killTimer || 0} 
                            maxCooldown={state.settings.killCooldown}
                            className={(player.killTimer || 0) <= 0 ? "animate-pulse shadow-[0_0_20px_#ef4444]" : ""}
                        />
                       </>
                   )}
                   <ActionButton 
                       icon={Siren} 
                       label="REPORT" 
                       color="bg-red-600" 
                       textColor="text-white" 
                       onClick={() => onAction('REPORT')} 
                       disabled={!canReport}
                       className={canReport ? "animate-pulse shadow-[0_0_20px_#ef4444]" : ""}
                   />
                </div>
            </div>
        </div>
    );
};
