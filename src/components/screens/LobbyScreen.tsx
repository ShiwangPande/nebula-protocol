
import React, { useState } from 'react';
import { GameState, GameAction, GameSettings, RoleSetting } from '../../types';
import { COLORS, INITIAL_SETTINGS, HATS, SKINS, BASE_ROLES } from '../../data/constants';
import { MAP_REGISTRY } from '../../data/mapRegistry';
import { Character } from '../game/Character';
import { Settings, ArrowLeft, ArrowRight, Map as MapIcon, Globe, Users, LogOut, XCircle, Palette, Shield, Info, ClipboardList, Sliders, Play, Check } from 'lucide-react';

interface LobbyProps { state: GameState; dispatch: React.Dispatch<GameAction>; }

const Modal = ({ title, onClose, children }: { title: string, onClose: () => void, children?: React.ReactNode }) => (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-in fade-in zoom-in-95 p-2 md:p-4">
        <div className="bg-game-panel border-4 border-black p-4 rounded-xl w-full max-w-lg relative shadow-2xl flex flex-col max-h-full">
             <button onClick={onClose} className="absolute top-2 right-2 text-gray-400 hover:text-white z-50 p-2"><XCircle size={28}/></button>
             <h2 className="text-xl md:text-2xl font-game text-white mb-4 border-b-2 border-gray-600 pb-2 shrink-0">{title}</h2>
             <div className="overflow-y-auto flex-1 min-h-0 custom-scrollbar">
                 {children}
             </div>
        </div>
    </div>
);

const SettingsControl = ({ label, value, onChange, min, max, step, disabled, tooltip }: any) => (
    <div className="group relative mb-6 last:mb-0">
        <div className="flex justify-between text-sm font-bold text-gray-400 mb-2">
            <span className="flex items-center gap-1 cursor-help border-b border-dotted border-gray-600 hover:text-white transition-colors">{label} <Info size={12}/></span> 
            <span className="text-white font-mono">{value}</span>
        </div>
        {disabled ? (
             <div className="h-2 bg-gray-600 rounded mt-1 relative overflow-hidden">
                <div className="h-full bg-neon-cyan absolute top-0 left-0" style={{width: `${((value - min) / (max - min)) * 100}%`}}/>
             </div>
        ) : (
            <input 
                type="range" 
                min={min} 
                max={max} 
                step={step} 
                value={value} 
                onChange={e => onChange(parseFloat(e.target.value))} 
                className="w-full accent-neon-cyan cursor-pointer h-6 bg-gray-600 rounded-lg appearance-none" 
            />
        )}
        
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-black/95 text-gray-300 text-[10px] p-2 rounded border border-gray-600 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 text-center shadow-xl">
            {tooltip}
        </div>
    </div>
);

const CustomizePanel = ({ player, dispatch, onClose }: { player: any, dispatch: any, onClose: () => void }) => {
    const [tab, setTab] = useState<'color'|'hat'|'skin'>('color');
    
    return (
        <Modal title="DRESSING ROOM" onClose={onClose}>
            <div className="flex flex-col md:flex-row gap-4 h-[70vh] md:h-80">
                {/* Controls Area */}
                <div className="flex-1 flex flex-col min-h-0 order-2 md:order-1">
                    <div className="flex gap-2 mb-4 shrink-0">
                         <button onClick={() => setTab('color')} className={`flex-1 py-3 font-bold rounded text-sm ${tab === 'color' ? 'bg-neon-cyan text-black' : 'bg-gray-700 text-gray-400'}`}>COLOR</button>
                         <button onClick={() => setTab('hat')} className={`flex-1 py-3 font-bold rounded text-sm ${tab === 'hat' ? 'bg-neon-cyan text-black' : 'bg-gray-700 text-gray-400'}`}>HAT</button>
                         <button onClick={() => setTab('skin')} className={`flex-1 py-3 font-bold rounded text-sm ${tab === 'skin' ? 'bg-neon-cyan text-black' : 'bg-gray-700 text-gray-400'}`}>SKIN</button>
                    </div>
                    <div className="bg-black/40 p-2 rounded overflow-y-auto grid grid-cols-4 gap-3 content-start flex-1 min-h-0">
                         {tab === 'color' && COLORS.map(c => (
                             <button key={c} onClick={() => dispatch({ type: 'UPDATE_COSMETICS', payload: { playerId: player.id, color: c } })} className={`aspect-square rounded-full border-4 cursor-pointer shadow-lg active:scale-90 transition-transform ${player.color === c ? 'border-white scale-110' : 'border-transparent'}`} style={{backgroundColor: c}} />
                         ))}
                         {tab === 'hat' && HATS.map(h => (
                             <button key={h.id} onClick={() => dispatch({ type: 'UPDATE_COSMETICS', payload: { playerId: player.id, hatId: h.id } })} className={`p-1 aspect-square flex items-center justify-center rounded border-2 text-[10px] font-bold leading-tight cursor-pointer active:scale-95 transition-transform ${player.hatId === h.id ? 'border-neon-cyan bg-cyan-900/50 text-white' : 'border-gray-600 bg-gray-800 text-gray-400'}`}>{h.name}</button>
                         ))}
                         {tab === 'skin' && SKINS.map(s => (
                             <button key={s.id} onClick={() => dispatch({ type: 'UPDATE_COSMETICS', payload: { playerId: player.id, skinId: s.id } })} className={`p-1 aspect-square flex items-center justify-center rounded border-2 text-[10px] font-bold leading-tight cursor-pointer active:scale-95 transition-transform ${player.skinId === s.id ? 'border-neon-cyan bg-cyan-900/50 text-white' : 'border-gray-600 bg-gray-800 text-gray-400'}`}>{s.name}</button>
                         ))}
                    </div>
                </div>

                {/* Preview Area */}
                <div className="w-full md:w-48 shrink-0 flex flex-col items-center justify-center bg-black/20 rounded-xl p-4 border border-white/10 min-h-[150px] order-1 md:order-2">
                     <div className="w-40 h-40 relative">
                         <div className="absolute inset-0 scale-125 origin-center">
                           <Character 
                                player={{
                                    ...player, 
                                    position: {x: 80, y: 130}, 
                                    direction: 'right', 
                                    isMoving: false, 
                                    isDead: false
                                }} 
                                role={BASE_ROLES['technician']} 
                                isLocal={true} 
                           />
                         </div>
                     </div>
                     <div className="mt-6 text-sm font-bold text-gray-400 tracking-widest text-center">{player.name}</div>
                </div>
            </div>
            <button onClick={onClose} className="w-full mt-4 py-3 bg-green-600 text-white font-bold rounded hover:bg-green-500 active:scale-95 transition-transform">CONFIRM LOOK</button>
        </Modal>
    )
}

export const LobbyScreen: React.FC<LobbyProps> = ({ state, dispatch }) => {
  const [playerName, setPlayerName] = useState('Naut_1');
  const [hostSettings, setHostSettings] = useState<GameSettings>(INITIAL_SETTINGS);
  const [joinCode, setJoinCode] = useState('');
  const [showCustomize, setShowCustomize] = useState(false);
  const [activeTab, setActiveTab] = useState<'rules' | 'roles'>('rules');
  const [mobileTab, setMobileTab] = useState<'players' | 'settings'>('players');
  const [hostTab, setHostTab] = useState<'config' | 'mission'>('config');

  // Initialize with safe defaults
  const [localCosmetics, setLocalCosmetics] = useState({ color: COLORS[0], hatId: 'none', skinId: 'standard' });

  const availableMaps = Object.values(MAP_REGISTRY);
  const currentMap = MAP_REGISTRY[hostSettings.mapId] || availableMaps[0];
  const myPlayer = state.players.find(p => p.id === state.myPlayerId);

  const handleJoinLobby = () => {
    if (joinCode.length < 6) return;
    const pid = `p_${Math.random().toString(36).substr(2, 9)}`;
    dispatch({ type: 'JOIN_LOBBY', payload: { code: joinCode, playerId: pid, playerName, ...localCosmetics } });
  };

  // 1. MAIN MENU
  if (state.lobbyMode === 'MAIN_MENU') {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-space-900 relative p-4 md:p-8">
        <div className="scan-line" />
        <h1 className="text-5xl md:text-8xl font-game text-transparent bg-clip-text bg-gradient-to-b from-cyan-300 to-blue-600 tracking-widest drop-shadow-[4px_4px_0px_#000] mb-4 md:mb-8 text-center leading-none">NEBULA<br/>PROTOCOL</h1>
        
        <div className="bg-game-panel p-6 rounded-xl border-4 border-black shadow-2xl w-full max-w-lg flex flex-col gap-4 relative z-10">
          <input 
             type="text" value={playerName} onChange={e => setPlayerName(e.target.value)}
             className="w-full bg-black/40 border-2 border-gray-500 rounded p-4 text-white text-center font-bold mb-2 focus:border-neon-cyan outline-none text-2xl"
             placeholder="ENTER ID" maxLength={12}
          />
          
          <div className="grid grid-cols-2 gap-3">
               <button onClick={() => dispatch({ type: 'SET_LOBBY_MODE', payload: 'HOST_SETUP' })} className="game-btn bg-blue-600 text-white font-game py-4 rounded text-xl border-b-4 border-blue-800 hover:bg-blue-500 shadow-lg active:border-b-0 active:translate-y-1">HOST</button>
               <button onClick={() => dispatch({ type: 'SET_LOBBY_MODE', payload: 'JOIN_CODE' })} className="game-btn bg-green-600 text-white font-game py-4 rounded text-xl border-b-4 border-green-800 hover:bg-green-500 shadow-lg active:border-b-0 active:translate-y-1">JOIN</button>
               <button onClick={() => dispatch({ type: 'SET_LOBBY_MODE', payload: 'CUSTOMIZE' })} className="game-btn bg-gray-700 text-white font-bold py-4 rounded border-b-4 border-gray-900 hover:bg-gray-600 flex items-center justify-center gap-2 active:border-b-0 active:translate-y-1"><Palette/> SUIT</button>
               <button onClick={() => window.close()} className="game-btn bg-red-800 text-white font-bold py-4 rounded border-b-4 border-red-950 hover:bg-red-700 flex items-center justify-center gap-2 active:border-b-0 active:translate-y-1"><LogOut/> QUIT</button>
          </div>
        </div>
      </div>
    );
  }

  // 2. DRESSING ROOM (Standalone)
  if (state.lobbyMode === 'CUSTOMIZE') {
      const previewPlayer = { 
          id: 'temp_preview', 
          name: playerName || 'Player', 
          ...localCosmetics,
          position: {x:0,y:0},
          velocity:{x:0,y:0},
          roleId: 'technician',
          isDead: false,
          isInVent: false,
          direction: 'right',
          tasks: [],
          hasVoted: false,
          isHost: false,
          isMoving: false,
          isReady: false,
          killTimer: 0,
          emergencyMeetingsLeft: 0
      };
      
      const localDispatch = (action: GameAction) => {
        if (action.type === 'UPDATE_COSMETICS') {
             // Explicitly destruct payload to ensure robust property access
             const { color, hatId, skinId } = action.payload;
             setLocalCosmetics(prev => ({
                 color: color ?? prev.color,
                 hatId: hatId ?? prev.hatId,
                 skinId: skinId ?? prev.skinId
             }));
        }
      };

      return (
          <div className="flex flex-col items-center justify-center h-full bg-space-900 relative z-[60]">
              <CustomizePanel player={previewPlayer} dispatch={localDispatch} onClose={() => dispatch({ type: 'SET_LOBBY_MODE', payload: 'MAIN_MENU' })} />
          </div>
      )
  }

  // 3. JOIN CODE
  if (state.lobbyMode === 'JOIN_CODE') {
      return (
          <div className="flex items-center justify-center h-full bg-space-900 p-4">
              <div className="bg-game-panel p-8 rounded-xl border-4 border-black w-full max-w-md text-center shadow-2xl">
                  <h2 className="text-3xl font-game text-white mb-6">ACCESS CODE</h2>
                  <input 
                    value={joinCode} 
                    onChange={e => setJoinCode(e.target.value.toUpperCase())} 
                    maxLength={6}
                    className="w-full text-center text-5xl font-mono tracking-widest bg-black border-2 border-neon-cyan text-neon-cyan p-4 rounded mb-8 uppercase focus:outline-none focus:shadow-[0_0_20px_#00f2ff]" 
                    placeholder="______"
                  />
                  <div className="flex gap-4">
                      <button onClick={() => dispatch({ type: 'SET_LOBBY_MODE', payload: 'MAIN_MENU' })} className="flex-1 py-4 bg-gray-600 text-white rounded font-bold hover:bg-gray-500 border-b-4 border-gray-800 active:border-b-0 active:translate-y-1">BACK</button>
                      <button onClick={handleJoinLobby} className="flex-1 py-4 bg-neon-green text-black rounded font-bold hover:bg-green-400 border-b-4 border-green-800 active:border-b-0 active:translate-y-1">CONNECT</button>
                  </div>
              </div>
          </div>
      )
  }

  // 4. HOST SETUP
  if (state.lobbyMode === 'HOST_SETUP') {
      return (
          <div className="flex items-center justify-center h-full bg-space-900 p-2 md:p-8">
               <div className="bg-game-panel p-4 rounded-xl border-4 border-black w-full max-w-5xl flex flex-col h-full md:h-[85vh] shadow-2xl overflow-hidden">
                   
                   {/* Header / Tabs */}
                   <div className="flex justify-between items-center mb-4 shrink-0 gap-4">
                        <h2 className="text-xl md:text-3xl font-game text-neon-cyan hidden md:block border-b border-gray-600 pb-2 w-full">MISSION CONFIGURATION</h2>
                        
                        {/* Mobile Tabs */}
                        <div className="flex md:hidden w-full bg-black/50 p-1 rounded-lg shrink-0">
                            <button onClick={() => setHostTab('config')} className={`flex-1 py-3 rounded text-sm font-bold flex items-center justify-center gap-2 transition-colors ${hostTab === 'config' ? 'bg-gray-700 text-white shadow-md' : 'text-gray-400'}`}><Sliders size={16}/> CONFIG</button>
                            <button onClick={() => setHostTab('mission')} className={`flex-1 py-3 rounded text-sm font-bold flex items-center justify-center gap-2 transition-colors ${hostTab === 'mission' ? 'bg-gray-700 text-white shadow-md' : 'text-gray-400'}`}><MapIcon size={16}/> LAUNCH</button>
                        </div>
                   </div>

                   <div className="flex-1 flex flex-col md:flex-row gap-4 md:gap-8 min-h-0 overflow-hidden relative">
                       {/* Left: Form */}
                       <div className={`flex-1 overflow-y-auto pr-2 custom-scrollbar ${hostTab === 'config' ? 'block' : 'hidden'} md:block pb-20 md:pb-0`}>
                           
                           <div className="space-y-6">
                               <div>
                                   <label className="block text-sm font-bold text-gray-400 mb-2">MISSION NAME</label>
                                   <input value={hostSettings.lobbyName} onChange={e => setHostSettings({...hostSettings, lobbyName: e.target.value})} className="w-full bg-black/30 border border-gray-600 p-3 rounded text-white text-lg focus:border-neon-cyan outline-none"/>
                               </div>
                               <div className="grid grid-cols-2 gap-4">
                                   <div>
                                       <label className="block text-sm font-bold text-gray-400 mb-2">MAX CREW ({hostSettings.maxPlayers})</label>
                                       <input type="range" min="4" max="15" value={hostSettings.maxPlayers} onChange={e => setHostSettings({...hostSettings, maxPlayers: parseInt(e.target.value)})} className="w-full accent-neon-cyan h-4 rounded-lg bg-gray-600"/>
                                   </div>
                                   <div>
                                       <label className="block text-sm font-bold text-gray-400 mb-2">IMPOSTORS ({hostSettings.impostorCount})</label>
                                       <div className="flex gap-1 h-10">
                                           {[1,2,3].map(n => <button key={n} onClick={()=>setHostSettings({...hostSettings, impostorCount: n})} className={`flex-1 rounded border-2 font-bold ${hostSettings.impostorCount === n ? 'bg-red-600 border-white text-white' : 'bg-black/20 border-gray-600 text-gray-500'}`}>{n}</button>)}
                                       </div>
                                   </div>
                               </div>
                               
                               {/* Quick Rules */}
                               <div className="bg-black/20 p-4 rounded border border-gray-700">
                                   <h3 className="font-bold text-gray-300 mb-4 border-b border-gray-700 pb-2">GAMEPLAY PRESETS</h3>
                                   <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
                                       <label className="flex items-center justify-between"><span>Speed</span> <span className="text-neon-cyan font-mono bg-black/40 px-2 rounded">{hostSettings.playerSpeed}x</span></label>
                                       <label className="flex items-center justify-between"><span>Kill CD</span> <span className="text-red-400 font-mono bg-black/40 px-2 rounded">{hostSettings.killCooldown}s</span></label>
                                       <label className="flex items-center justify-between"><span>Vision</span> <span className="text-blue-400 font-mono bg-black/40 px-2 rounded">{hostSettings.visionMultiplier}x</span></label>
                                       <label className="flex items-center justify-between"><span>Confirm</span> <input type="checkbox" className="w-5 h-5 accent-green-500" checked={hostSettings.confirmEjects} onChange={e=>setHostSettings({...hostSettings, confirmEjects: e.target.checked})} /></label>
                                   </div>
                               </div>
                           </div>
                       </div>

                       {/* Right: Map & Confirm */}
                       <div className={`w-full md:w-1/3 flex-col gap-4 ${hostTab === 'mission' ? 'flex h-full overflow-y-auto' : 'hidden'} md:flex`}>
                           {/* Max Height on mobile for map to allow buttons to show */}
                           <div className="bg-black p-1 rounded border-2 border-gray-600 relative group overflow-hidden aspect-video shrink-0 max-h-48 md:max-h-none shadow-lg">
                                <div className="absolute inset-0 bg-cover bg-center opacity-60 transition-opacity group-hover:opacity-80" style={{backgroundColor: currentMap.theme.background, backgroundImage: 'url(https://www.transparenttextures.com/patterns/stardust.png)'}} />
                                <div className="absolute bottom-0 inset-x-0 bg-black/80 p-3 border-t border-white/10">
                                    <div className="font-game text-xl text-white truncate text-center text-neon-cyan tracking-wider">{currentMap.name}</div>
                                </div>
                           </div>
                           
                           <div className="flex items-center gap-2 justify-center shrink-0 bg-black/20 p-2 rounded">
                                <button onClick={() => { const idx = availableMaps.findIndex(m=>m.id===hostSettings.mapId); const next = idx - 1 < 0 ? availableMaps.length - 1 : idx - 1; setHostSettings({...hostSettings, mapId: availableMaps[next].id}) }} className="p-4 bg-gray-700 rounded active:scale-95"><ArrowLeft/></button>
                                <span className="font-mono text-sm font-bold flex-1 text-center">SELECT MAP</span>
                                <button onClick={() => { const idx = availableMaps.findIndex(m=>m.id===hostSettings.mapId); const next = (idx + 1) % availableMaps.length; setHostSettings({...hostSettings, mapId: availableMaps[next].id}) }} className="p-4 bg-gray-700 rounded active:scale-95"><ArrowRight/></button>
                           </div>

                           <div className="mt-auto flex flex-col gap-3 shrink-0 pb-1">
                               <button onClick={() => dispatch({ type: 'CREATE_LOBBY', payload: { name: hostSettings.lobbyName, settings: hostSettings, playerName, ...localCosmetics } })} className="w-full py-4 bg-neon-cyan text-black font-game text-2xl rounded border-b-4 border-cyan-700 hover:brightness-110 active:border-b-0 active:translate-y-1 shadow-lg flex items-center justify-center gap-2"><Play fill="black"/> INITIALIZE</button>
                               <button onClick={() => dispatch({ type: 'SET_LOBBY_MODE', payload: 'MAIN_MENU' })} className="w-full py-4 bg-gray-700 text-gray-300 font-bold rounded border-b-4 border-gray-900 hover:bg-gray-600 active:border-b-0 active:translate-y-1">CANCEL</button>
                           </div>
                       </div>
                   </div>
               </div>
          </div>
      )
  }

  // 5. LOBBY ROOM
  if (state.lobbyMode === 'LOBBY') {
      const isHost = myPlayer?.isHost;
      return (
          <div className="h-full bg-space-900 p-2 md:p-6 flex flex-col relative">
              {/* Header */}
              <div className="flex justify-between items-center bg-game-panel p-3 md:p-4 rounded-xl border-b-4 border-black mb-2 md:mb-6 shadow-md shrink-0">
                  <div>
                      <h2 className="text-xl md:text-3xl font-game text-white truncate max-w-[200px] md:max-w-none">{state.settings.lobbyName}</h2>
                      <div className="flex items-center gap-4 text-gray-400 text-xs md:text-sm">
                          <span className="hidden md:flex items-center gap-1"><Globe size={14}/> {state.settings.region}</span>
                          <span className="flex items-center gap-1"><MapIcon size={14}/> {currentMap.name}</span>
                          <span className="flex items-center gap-1 text-red-400"><Users size={14}/> {state.settings.impostorCount} IMPOSTORS</span>
                      </div>
                  </div>
                  <div className="text-right">
                      <div className="text-[10px] md:text-xs text-gray-400 font-bold mb-1">JOIN CODE</div>
                      <div className="text-xl md:text-4xl font-mono text-neon-cyan tracking-widest bg-black px-2 md:px-4 py-1 rounded border border-cyan-900 shadow-[0_0_10px_rgba(6,182,212,0.3)]">{state.lobbyCode}</div>
                  </div>
              </div>

              {/* Mobile Tabs */}
              <div className="flex md:hidden mb-2 bg-black/50 p-1 rounded-lg shrink-0">
                  <button onClick={() => setMobileTab('players')} className={`flex-1 py-3 rounded text-sm font-bold flex items-center justify-center gap-2 transition-colors ${mobileTab === 'players' ? 'bg-gray-700 text-white shadow' : 'text-gray-400'}`}><Users size={16}/> CREW</button>
                  <button onClick={() => setMobileTab('settings')} className={`flex-1 py-3 rounded text-sm font-bold flex items-center justify-center gap-2 transition-colors ${mobileTab === 'settings' ? 'bg-gray-700 text-white shadow' : 'text-gray-400'}`}><Sliders size={16}/> SETTINGS</button>
              </div>

              <div className="flex-1 flex gap-6 overflow-hidden min-h-0 relative">
                  {/* Left: Player List */}
                  <div className={`flex-1 bg-black/30 rounded-xl border-2 border-gray-700 p-3 md:p-4 overflow-y-auto custom-scrollbar ${mobileTab === 'players' ? 'block' : 'hidden md:block'}`}>
                      <div className="flex justify-between items-center mb-4 sticky top-0 bg-space-900/90 backdrop-blur p-2 rounded z-10 border-b border-gray-700">
                          <h3 className="font-bold text-gray-300">OPERATIVES ({state.players.length}/{state.settings.maxPlayers})</h3>
                          <button onClick={() => setShowCustomize(true)} className="text-xs bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded flex items-center gap-1 font-bold border border-gray-500 active:scale-95"><Palette size={14}/> SUIT UP</button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-20 md:pb-0">
                          {state.players.map(p => (
                              <div key={p.id} className={`p-2 rounded-lg border-2 flex items-center gap-3 relative transition-colors ${p.isReady ? 'bg-green-900/20 border-green-600' : 'bg-gray-800 border-gray-600'}`}>
                                  {/* Minimal Avatar Preview */}
                                  <div className="w-12 h-12 rounded-full border-2 border-white/20 bg-black/50 relative overflow-hidden shrink-0">
                                      <div className="absolute inset-0 top-1 scale-110">
                                           <Character 
                                                player={{...p, position: {x: 24, y: 35}, direction: 'right', isMoving: false, isDead: false}} 
                                                role={BASE_ROLES['technician']} 
                                                isLocal={false} 
                                            />
                                      </div>
                                  </div>
                                  
                                  <div className="flex-1 min-w-0">
                                      <div className="font-bold text-white flex items-center gap-2 truncate text-sm md:text-base">
                                          {p.name} 
                                          {p.isHost && <Shield size={12} className="text-yellow-500 shrink-0"/>}
                                      </div>
                                      <div className="flex items-center gap-1 mt-1 text-[10px] text-gray-500 overflow-hidden">
                                         {p.hatId !== 'none' && <span className="bg-black/30 px-1 rounded border border-white/10 whitespace-nowrap">{HATS.find(h=>h.id===p.hatId)?.name}</span>}
                                         {p.skinId !== 'standard' && <span className="bg-black/30 px-1 rounded border border-white/10 whitespace-nowrap">{SKINS.find(s=>s.id===p.skinId)?.name}</span>}
                                      </div>
                                  </div>
                                  
                                  {isHost && !p.isHost && (
                                      <button onClick={() => dispatch({ type: 'KICK_PLAYER', payload: { targetId: p.id } })} className="text-red-500 hover:text-red-400 p-2 bg-black/20 rounded-full"><XCircle size={18}/></button>
                                  )}
                                  <div className={`absolute top-2 right-2 w-3 h-3 rounded-full ${p.isReady ? 'bg-green-500 animate-pulse shadow-[0_0_5px_#22c55e]' : 'bg-gray-600'}`} />
                              </div>
                          ))}
                      </div>
                  </div>

                  {/* Right: Settings Panel */}
                  <div className={`w-full md:w-96 bg-game-panel rounded-xl border-4 border-black flex flex-col ${mobileTab === 'settings' ? 'block' : 'hidden md:flex'}`}>
                       <div className="flex border-b-4 border-black shrink-0">
                           <button onClick={() => setActiveTab('rules')} className={`flex-1 py-3 font-bold text-sm ${activeTab === 'rules' ? 'bg-gray-700 text-white' : 'bg-gray-800 text-gray-500 hover:bg-gray-700'}`}>RULES</button>
                           <button onClick={() => setActiveTab('roles')} className={`flex-1 py-3 font-bold text-sm ${activeTab === 'roles' ? 'bg-gray-700 text-white' : 'bg-gray-800 text-gray-500 hover:bg-gray-700'}`}>ROLES</button>
                       </div>
                       
                       <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar pb-24 md:pb-4">
                           {activeTab === 'rules' ? (
                               <div className="space-y-6">
                                   {/* Map */}
                                   <div className="space-y-2">
                                       <label className="text-xs font-bold text-gray-400">MAP</label>
                                       {isHost ? (
                                           <select value={state.settings.mapId} onChange={e => dispatch({ type: 'UPDATE_SETTINGS', payload: { mapId: e.target.value } })} className="w-full bg-black border border-gray-600 p-3 rounded text-sm text-white">
                                               {availableMaps.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                           </select>
                                       ) : <div className="text-white font-mono bg-black/30 p-3 rounded border border-gray-600 text-sm">{currentMap.name}</div>}
                                   </div>

                                   {/* Core Settings */}
                                   <div className="space-y-2">
                                        <h3 className="text-xs font-black text-neon-cyan uppercase tracking-wider mb-2 border-b border-gray-700 pb-1">Core Rules</h3>
                                        <SettingsControl 
                                            label="Player Speed" 
                                            value={state.settings.playerSpeed} 
                                            min={1} max={15} step={0.5} 
                                            disabled={!isHost} 
                                            onChange={(v: number) => dispatch({ type: 'UPDATE_SETTINGS', payload: { playerSpeed: v } })}
                                            tooltip="Speed"
                                        />
                                        <SettingsControl 
                                            label="Kill Cooldown" 
                                            value={state.settings.killCooldown} 
                                            min={10} max={60} step={2.5} 
                                            disabled={!isHost} 
                                            onChange={(v: number) => dispatch({ type: 'UPDATE_SETTINGS', payload: { killCooldown: v } })}
                                            tooltip="Cooldown"
                                        />
                                        <SettingsControl 
                                            label="Vision Multiplier" 
                                            value={state.settings.visionMultiplier} 
                                            min={0.5} max={3} step={0.25} 
                                            disabled={!isHost} 
                                            onChange={(v: number) => dispatch({ type: 'UPDATE_SETTINGS', payload: { visionMultiplier: v } })}
                                            tooltip="Vision"
                                        />
                                   </div>
                               </div>
                           ) : (
                               <div className="space-y-4">
                                   <div className="text-xs text-gray-400 mb-2">ROLE SPAWN CHANCE</div>
                                   {(Object.entries(state.settings.roleSettings) as [string, RoleSetting][]).map(([key, setting]) => (
                                       <div key={key} className="bg-black/20 p-2 rounded border border-gray-700">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="font-bold text-sm capitalize">{key}</span>
                                                {isHost && <input type="checkbox" className="w-5 h-5 accent-neon-cyan" checked={setting.enabled} onChange={e => {
                                                    const newRoles = { ...state.settings.roleSettings, [key]: { ...setting, enabled: e.target.checked } };
                                                    dispatch({ type: 'UPDATE_SETTINGS', payload: { roleSettings: newRoles } });
                                                }} />}
                                            </div>
                                            {setting.enabled && (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs w-8">{setting.chance}%</span>
                                                    {isHost ? <input type="range" value={setting.chance} onChange={e => {
                                                        const newRoles = { ...state.settings.roleSettings, [key]: { ...setting, chance: parseInt(e.target.value) } };
                                                        dispatch({ type: 'UPDATE_SETTINGS', payload: { roleSettings: newRoles } });
                                                    }} className="flex-1 accent-yellow-500 h-2" /> : <div className="flex-1 h-2 bg-gray-600 rounded"><div className="h-full bg-yellow-500 rounded" style={{width: `${setting.chance}%`}}/></div>}
                                                </div>
                                            )}
                                       </div>
                                   ))}
                               </div>
                           )}
                       </div>
                  </div>
              </div>

              {/* Bottom Actions Floating Bar */}
              <div className="absolute bottom-4 left-4 right-4 md:static md:mt-4 flex justify-between items-center shrink-0 z-20 pointer-events-none">
                   <button onClick={() => dispatch({ type: 'SET_LOBBY_MODE', payload: 'MAIN_MENU' })} className="pointer-events-auto w-12 h-12 md:w-auto md:h-auto md:px-6 md:py-3 bg-red-900/80 hover:bg-red-900 border-2 border-red-700 rounded-full md:rounded font-bold text-red-200 text-xs md:text-base flex items-center justify-center shadow-lg active:scale-95">
                       <LogOut size={20} className="md:hidden"/>
                       <span className="hidden md:inline">LEAVE</span>
                   </button>
                   
                   <div className="flex gap-4 pointer-events-auto">
                       {!isHost && (
                           <button onClick={() => dispatch({ type: 'SET_READY', payload: { playerId: myPlayer!.id, isReady: !myPlayer!.isReady } })} className={`px-8 py-3 md:px-12 md:py-3 rounded-full md:rounded font-bold text-lg md:text-xl border-b-4 shadow-xl transition-all active:translate-y-1 active:border-b-0 flex items-center gap-2 ${myPlayer?.isReady ? 'bg-green-600 border-green-800 text-white' : 'bg-gray-200 border-gray-400 text-gray-800'}`}>
                               {myPlayer?.isReady ? <Check size={24} strokeWidth={4}/> : ''} {myPlayer?.isReady ? 'READY!' : 'READY?'}
                           </button>
                       )}
                       
                       {isHost && (
                           <button 
                                onClick={() => dispatch({ type: 'START_GAME' })} 
                                disabled={state.players.length < 1} 
                                className="px-8 py-3 md:px-16 md:py-3 bg-neon-green text-black font-game text-xl md:text-2xl rounded-full md:rounded border-b-4 border-green-800 hover:brightness-110 shadow-[0_0_20px_#4ade80] disabled:opacity-50 disabled:cursor-not-allowed active:translate-y-1 active:border-b-0 flex items-center gap-2"
                           >
                               <Play fill="black" size={20}/> START
                           </button>
                       )}
                   </div>
              </div>

              {/* Customize Modal */}
              {showCustomize && myPlayer && (
                  <CustomizePanel player={myPlayer} dispatch={dispatch} onClose={() => setShowCustomize(false)} />
              )}
          </div>
      )
  }

  return null;
};
