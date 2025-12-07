
import React, { useReducer, useEffect, useState } from 'react';
import { GameState, GameAction, LobbyMode } from './types';
import { INITIAL_SETTINGS, BASE_ROLES, BASE_TASKS } from './data/constants';
import { MAP_REGISTRY, DEFAULT_MAP_ID } from './data/mapRegistry';
import { gameReducer } from './engine/gameReducer';
import { LobbyScreen } from './components/screens/LobbyScreen';
import { GameScreen } from './components/screens/GameScreen';
import { MeetingScreen } from './components/screens/MeetingScreen';
import { ModPanel } from './components/screens/ModPanel';
import { Zap } from 'lucide-react';

const initialState: GameState = {
    phase: 'LOBBY',
    lobbyMode: 'MAIN_MENU',
    lobbyCode: '',
    players: [],
    myPlayerId: '',
    meetingTimer: 0,
    deadBodyReported: null,
    votes: {},
    chatMessages: [],
    modRegistry: { roles: BASE_ROLES, tasks: BASE_TASKS },
    map: [],
    activeMapId: DEFAULT_MAP_ID,
    settings: INITIAL_SETTINGS,
    logs: [],
    systems: { 
        lights: { active: true, fixed: true }, 
        reactor: { meltdownTimer: null, fixedCount: 0 }, 
        comms: { active: true },
        oxygen: { depletionTimer: null, fixedCount: 0 },
        globalSabotageCooldown: 0,
        doors: {}
    },
    activeTask: null,
    activeSabotage: null,
    emergencyCooldown: 0
};

export default function App() {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const [showMods, setShowMods] = useState(false);

  useEffect(() => {
    if (state.phase !== 'PLAYING') return;
    const interval = setInterval(() => dispatch({ type: 'TICK', payload: { dt: 50 } }), 50);
    return () => clearInterval(interval);
  }, [state.phase]);

  return (
    <div className="w-full h-screen bg-space-900 text-slate-100 font-ui relative overflow-hidden select-none">
      <style>{`
        @keyframes shake {
          0% { transform: translate(1px, 1px) rotate(0deg); }
          10% { transform: translate(-1px, -2px) rotate(-1deg); }
          20% { transform: translate(-3px, 0px) rotate(1deg); }
          30% { transform: translate(3px, 2px) rotate(0deg); }
          40% { transform: translate(1px, -1px) rotate(1deg); }
          50% { transform: translate(-1px, 2px) rotate(-1deg); }
          60% { transform: translate(-3px, 1px) rotate(0deg); }
          70% { transform: translate(3px, 1px) rotate(-1deg); }
          80% { transform: translate(-1px, -1px) rotate(1deg); }
          90% { transform: translate(1px, 2px) rotate(0deg); }
          100% { transform: translate(1px, -2px) rotate(-1deg); }
        }
        .animate-screen-shake {
           animation: shake 0.5s;
           animation-iteration-count: infinite; 
        }
        .animate-strobe-red {
            animation: strobeRed 1s infinite;
        }
        .animate-strobe-blue {
            animation: strobeBlue 2s infinite;
        }
        @keyframes strobeRed {
            0%, 100% { opacity: 0.1; background-color: #ef4444; }
            50% { opacity: 0.4; background-color: #7f1d1d; }
        }
        @keyframes strobeBlue {
            0%, 100% { opacity: 0.2; background-color: #3b82f6; }
            50% { opacity: 0.5; background-color: #1e3a8a; }
        }
        @keyframes flickerDark {
            0%, 100% { opacity: 0.7; }
            5%, 95% { opacity: 0.8; }
            50% { opacity: 0.9; }
            20%, 80% { opacity: 0.6; }
        }
        .animate-flicker-dark {
            animation: flickerDark 0.2s infinite alternate;
        }
        @keyframes fogScroll {
            0% { background-position: 0 0; }
            100% { background-position: 100% 50%; }
        }
        .animate-fog-scroll {
            animation: fogScroll 20s linear infinite;
        }
        @keyframes staticNoise {
            0% { transform: translate(0,0); }
            10% { transform: translate(-5%,-5%); }
            20% { transform: translate(-10%,5%); }
            30% { transform: translate(5%,-10%); }
            40% { transform: translate(-5%,15%); }
            50% { transform: translate(-10%,5%); }
            60% { transform: translate(15%,0); }
            70% { transform: translate(0,10%); }
            80% { transform: translate(-15%,0); }
            90% { transform: translate(10%,5%); }
            100% { transform: translate(5%,0); }
        }
        .animate-static {
            animation: staticNoise 0.5s steps(10) infinite;
        }
      `}</style>
      {state.phase === 'LOBBY' && <LobbyScreen state={state} dispatch={dispatch} />}
      {state.phase === 'PLAYING' && <GameScreen state={state} dispatch={dispatch} />}
      {state.phase === 'MEETING' && <MeetingScreen state={state} dispatch={dispatch} />}
      {state.phase === 'ENDED' && (
          <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-50 animate-in fade-in duration-1000">
              <h1 className="text-6xl font-game text-white mb-8 tracking-widest drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">MISSION TERMINATED</h1>
              <div className="flex gap-4">
                  <button onClick={() => dispatch({ type: 'RETURN_TO_LOBBY' })} className="bg-neon-cyan text-black px-8 py-4 font-game rounded text-2xl hover:scale-105 transition-transform border-b-4 border-cyan-700">RETURN TO LOBBY</button>
                  <button onClick={() => window.location.reload()} className="bg-gray-700 text-white px-8 py-4 font-game rounded text-2xl hover:scale-105 transition-transform border-b-4 border-gray-900">QUIT</button>
              </div>
          </div>
      )}

      {state.phase === 'LOBBY' && state.lobbyMode === 'LOBBY' && (
        <button onClick={() => setShowMods(true)} className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1 bg-game-panel rounded border-2 border-black font-bold hover:bg-gray-700">
            <Zap size={16} className="text-neon-yellow" /> MODS
        </button>
      )}

      {showMods && <ModPanel registry={state.modRegistry} onClose={() => setShowMods(false)} onLoadMod={(m) => { dispatch({ type: 'LOAD_MOD', payload: m }); setShowMods(false); }} />}
    </div>
  );
}
