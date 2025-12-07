
import React, { useState } from 'react';
import { GameState, GameAction, GameSettings, RoleSetting } from '../../types';
import { COLORS, INITIAL_SETTINGS, HATS, SKINS, BASE_ROLES } from '../../data/constants';
import { MAP_REGISTRY } from '../../data/mapRegistry';
import { Character } from '../game/Character';
import { Settings, ArrowLeft, ArrowRight, Map as MapIcon, Globe, Users, LogOut, XCircle, Palette, Shield, Info } from 'lucide-react';

interface LobbyProps { state: GameState; dispatch: React.Dispatch<GameAction>; }

const Modal = ({ title, onClose, children }: { title: string, onClose: () => void, children?: React.ReactNode }) => (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-in fade-in zoom-in-95">
        <div className="bg-game-panel border-4 border-black p-6 rounded-xl w-full max-w-lg relative shadow-2xl">
             <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white"><XCircle/></button>
             <h2 className="text-2xl font-game text-white mb-6 border-b-2 border-gray-600 pb-2">{title}</h2>
             {children}
        </div>
    </div>
);

const SettingsControl = ({ label, value, onChange, min, max, step, disabled, tooltip }: any) => (
    <div className="group relative mb-4 last:mb-0">
        <div className="flex justify-between text-xs font-bold text-gray-400 mb-1">
            <span className="flex items-center gap-1 cursor-help border-b border-dotted border-gray-600 hover:text-white transition-colors">{label} <Info size={10}/></span> 
            <span className="text-white font-mono">{value}</span>
        </div>
        {disabled ? (
             <div className="h-1 bg-gray-600 rounded mt-1 relative overflow-hidden">
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
                className="w-full accent-neon-cyan cursor-pointer h-1 bg-gray-600 rounded-lg appearance-none" 
            />
        )}
        
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-black/95 text-gray-300 text-[10px] p-2 rounded border border-gray-600 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 text-center shadow-xl">
            {tooltip}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-black/95"></div>
        </div>
    </div>
);

const CustomizePanel = ({ player, dispatch, onClose }: { player: any, dispatch: any, onClose: () => void }) => {
    const [tab, setTab] = useState<'color'|'hat'|'skin'>('color');
    
    return (
        <Modal title="DRESSING ROOM" onClose={onClose}>
            <div className="flex gap-4 mb-4">
                 <button onClick={() => setTab('color')} className={`flex-1 py-2 font-bold rounded ${tab === 'color' ? 'bg-neon-cyan text-black' : 'bg-gray-700 text-gray-400'}`}>COLOR</button>
                 <button onClick={() => setTab('hat')} className={`flex-1 py-2 font-bold rounded ${tab === 'hat' ? 'bg-neon-cyan text-black' : 'bg-gray-700 text-gray-400'}`}>HAT</button>
                 <button onClick={() => setTab('skin')} className={`flex-1 py-2 font-bold rounded ${tab === 'skin' ? 'bg-neon-cyan text-black' : 'bg-gray-700 text-gray-400'}`}>SKIN</button>
            </div>
            <div className="bg-black/40 p-4 rounded h-64 overflow-y-auto grid grid-cols-4 gap-2 content-start">
                 {tab === 'color' && COLORS.map(c => (
                     <button key={c} onClick={() => dispatch({ type: 'UPDATE_COSMETICS', payload: { playerId: player.id, color: c } })} className={`w-12 h-12 rounded-full border-2 ${player.color === c ? 'border-white scale-110' : 'border-transparent'}`} style={{backgroundColor: c}} />
                 ))}
                 {tab === 'hat' && HATS.map(h => (
                     <button key={h.id} onClick={() => dispatch({ type: 'UPDATE_COSMETICS', payload: { playerId: player.id, hatId: h.id } })} className={`p-2 rounded border-2 text-xs font-bold ${player.hatId === h.id ? 'border-neon-cyan bg-cyan-900/50' : 'border-gray-600 bg-gray-800'}`}>{h.name}</button>
                 ))}
                 {tab === 'skin' && SKINS.map(s => (
                     <button key={s.id} onClick={() => dispatch({ type: 'UPDATE_COSMETICS', payload: { playerId: player.id, skinId: s.id } })} className={`p-2 rounded border-2 text-xs font-bold ${player.skinId === s.id ? 'border-neon-cyan bg-cyan-900/50' : 'border-gray-600 bg-gray-800'}`}>{s.name}</button>
                 ))}
            </div>
            <div className="mt-4 flex justify-center">
                 {/* Preview */}
                 <div className="w-32 h-32 bg-black/50 rounded-full border-4 border-white/20 relative overflow-hidden shadow-inner">
                      <div className="absolute inset-0 top-6">
                           <Character 
                                player={{
                                    ...player, 
                                    position: {x: 64, y: 110}, 
                                    direction: 'right', 
                                    isMoving: false, 
                                    isDead: false
                                }} 
                                role={BASE_ROLES['technician']} 
                                isLocal={true} 
                           />
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-xs pointer-events-none mt-20 font-bold tracking-widest opacity-50">PREVIEW</div>
                 </div>
            </div>
        </Modal>
    )
}

export const LobbyScreen: React.FC<LobbyProps> = ({ state, dispatch }) => {
  const [playerName, setPlayerName] = useState('Naut_1');
  const [hostSettings, setHostSettings] = useState<GameSettings>(INITIAL_SETTINGS);
  const [joinCode, setJoinCode] = useState('');
  const [showCustomize, setShowCustomize] = useState(false);
  const [activeTab, setActiveTab] = useState<'rules' | 'roles'>('rules');

  // Local state for main menu cosmetics
  const [localCosmetics, setLocalCosmetics] = useState({ color: COLORS[0], hatId: 'none', skinId: 'standard' });

  const availableMaps = Object.values(MAP_REGISTRY);
  const currentMap = MAP_REGISTRY[hostSettings.mapId] || availableMaps[0];
  const myPlayer = state.players.find(p => p.id === state.myPlayerId);

  // 1. MAIN MENU
  if (state.lobbyMode === 'MAIN_MENU') {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-space-900 relative p-8">
        <div className="scan-line" />
        <h1 className="text-8xl font-game text-transparent bg-clip-text bg-gradient-to-b from-cyan-300 to-blue-600 tracking-widest drop-shadow-[4px_4px_0px_#000] mb-8">NEBULA<br/>PROTOCOL</h1>
        
        <div className="bg-game-panel p-8 rounded-xl border-4 border-black shadow-2xl w-full max-w-sm flex flex-col gap-4 relative z-10">
          <input 
             type="text" value={playerName} onChange={e => setPlayerName(e.target.value)}
             className="w-full bg-black/40 border-2 border-gray-500 rounded p-3 text-white text-center font-bold mb-4 focus:border-neon-cyan outline-none text-xl"
             placeholder="ENTER ID" maxLength={12}
          />
          
          <button onClick={() => dispatch({ type: 'SET_LOBBY_MODE', payload: 'HOST_SETUP' })} className="game-btn bg-blue-600 text-white font-game py-4 rounded text-xl border-b-4 border-blue-800 hover:bg-blue-500 shadow-lg">HOST MISSION</button>
          <button onClick={() => dispatch({ type: 'SET_LOBBY_MODE', payload: 'JOIN_CODE' })} className="game-btn bg-green-600 text-white font-game py-4 rounded text-xl border-b-4 border-green-800 hover:bg-green-500 shadow-lg">JOIN VIA CODE</button>
          
          <div className="flex gap-2 mt-2">
               <button onClick={() => dispatch({ type: 'SET_LOBBY_MODE', payload: 'CUSTOMIZE' })} className="flex-1 bg-gray-700 py-3 rounded font-bold border-b-4 border-gray-900 hover:bg-gray-600 flex items-center justify-center gap-2"><Palette size={18}/> DRESSING</button>
               <button onClick={() => window.close()} className="flex-1 bg-red-800 py-3 rounded font-bold border-b-4 border-red-950 hover:bg-red-700 flex items-center justify-center gap-2"><LogOut size={18}/> QUIT</button>
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
          ...localCosmetics 
      };
      
      const localDispatch = (action: GameAction) => {
        if (action.type === 'UPDATE_COSMETICS') {
             const payload = action.payload as any; 
             // Unpack payload if it matches the nested structure, or use directly
             const data = payload.payload || payload;
             
             setLocalCosmetics(prev => ({
                 ...prev,
                 color: data.color ?? prev.color,
                 hatId: data.hatId ?? prev.hatId,
                 skinId: data.skinId ?? prev.skinId
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
          <div className="flex items-center justify-center h-full bg-space-900">
              <div className="bg-game-panel p-8 rounded-xl border-4 border-black w-full max-w-md text-center">
                  <h2 className="text-3xl font-game text-white mb-6">ENTER ACCESS CODE</h2>
                  <input 
                    value={joinCode} 
                    onChange={e => setJoinCode(e.target.value.toUpperCase())} 
                    maxLength={6}
                    className="w-full text-center text-4xl font-mono tracking-widest bg-black border-2 border-neon-cyan text-neon-cyan p-4 rounded mb-6 uppercase" 
                    placeholder="______"
                  />
                  <div className="flex gap-4">
                      <button onClick={() => dispatch({ type: 'SET_LOBBY_MODE', payload: 'MAIN_MENU' })} className="flex-1 py-3 bg-gray-600 text-white rounded font-bold hover:bg-gray-500">BACK</button>
                      <button onClick={() => dispatch({ type: 'JOIN_LOBBY', payload: { code: joinCode, playerName, color: localCosmetics.color, hatId: localCosmetics.hatId, skinId: localCosmetics.skinId } })} className="flex-1 py-3 bg-neon-green text-black rounded font-bold hover:bg-green-400">CONNECT</button>
                  </div>
              </div>
          </div>
      )
  }

  // 4. HOST SETUP
  if (state.lobbyMode === 'HOST_SETUP') {
      return (
          <div className="flex items-center justify-center h-full bg-space-900 p-8">
               <div className="bg-game-panel p-8 rounded-xl border-4 border-black w-full max-w-5xl flex gap-8 h-[80vh]">
                   {/* Left: Form */}
                   <div className="flex-1 overflow-y-auto pr-4 space-y-6">
                       <h2 className="text-3xl font-game text-neon-cyan border-b border-gray-600 pb-2">MISSION CONFIGURATION</h2>
                       
                       <div className="space-y-4">
                           <div>
                               <label className="block text-xs font-bold text-gray-400 mb-1">MISSION NAME</label>
                               <input value={hostSettings.lobbyName} onChange={e => setHostSettings({...hostSettings, lobbyName: e.target.value})} className="w-full bg-black/30 border border-gray-600 p-2 rounded text-white"/>
                           </div>
                           <div className="grid grid-cols-2 gap-4">
                               <div>
                                   <label className="block text-xs font-bold text-gray-400 mb-1">MAX CREW ({hostSettings.maxPlayers})</label>
                                   <input type="range" min="4" max="15" value={hostSettings.maxPlayers} onChange={e => setHostSettings({...hostSettings, maxPlayers: parseInt(e.target.value)})} className="w-full accent-neon-cyan"/>
                               </div>
                               <div>
                                   <label className="block text-xs font-bold text-gray-400 mb-1">IMPOSTORS ({hostSettings.impostorCount})</label>
                                   <div className="flex gap-1">
                                       {[1,2,3].map(n => <button key={n} onClick={()=>setHostSettings({...hostSettings, impostorCount: n})} className={`flex-1 py-1 rounded border ${hostSettings.impostorCount === n ? 'bg-red-600 border-white' : 'bg-black/20 border-gray-600'}`}>{n}</button>)}
                                   </div>
                               </div>
                           </div>
                           <div>
                               <label className="block text-xs font-bold text-gray-400 mb-1">REGION</label>
                               <select value={hostSettings.region} onChange={e => setHostSettings({...hostSettings, region: e.target.value})} className="w-full bg-black/30 border border-gray-600 p-2 rounded text-white">
                                   {['Automatic', 'North America', 'Europe', 'Asia'].map(r => <option key={r} value={r}>{r}</option>)}
                               </select>
                           </div>
                           {/* Quick Rules */}
                           <div className="bg-black/20 p-4 rounded border border-gray-700">
                               <h3 className="font-bold text-gray-300 mb-2">GAMEPLAY PRESETS</h3>
                               <div className="grid grid-cols-2 gap-4 text-sm">
                                   <label className="flex items-center justify-between"><span>Speed</span> <span className="text-neon-cyan">{hostSettings.playerSpeed}x</span></label>
                                   <label className="flex items-center justify-between"><span>Kill CD</span> <span className="text-red-400">{hostSettings.killCooldown}s</span></label>
                                   <label className="flex items-center justify-between"><span>Vision</span> <span className="text-blue-400">{hostSettings.visionMultiplier}x</span></label>
                                   <label className="flex items-center justify-between"><span>Confirm Ejects</span> <input type="checkbox" checked={hostSettings.confirmEjects} onChange={e=>setHostSettings({...hostSettings, confirmEjects: e.target.checked})} /></label>
                               </div>
                           </div>
                       </div>
                   </div>

                   {/* Right: Map & Confirm */}
                   <div className="w-1/3 flex flex-col gap-4">
                       <div className="bg-black p-1 rounded border-2 border-gray-600 relative group overflow-hidden aspect-video">
                            <div className="absolute inset-0 bg-cover bg-center opacity-60 transition-opacity group-hover:opacity-80" style={{backgroundColor: currentMap.theme.background, backgroundImage: 'url(https://www.transparenttextures.com/patterns/stardust.png)'}} />
                            <div className="absolute bottom-0 inset-x-0 bg-black/80 p-3">
                                <div className="font-game text-xl text-white">{currentMap.name}</div>
                                <div className="text-xs text-gray-400">{currentMap.description}</div>
                            </div>
                       </div>
                       <div className="flex items-center gap-2 justify-center">
                            <button onClick={() => { const idx = availableMaps.findIndex(m=>m.id===hostSettings.mapId); const next = idx - 1 < 0 ? availableMaps.length - 1 : idx - 1; setHostSettings({...hostSettings, mapId: availableMaps[next].id}) }} className="p-2 bg-gray-700 rounded"><ArrowLeft/></button>
                            <span className="font-mono text-sm">MAP SELECT</span>
                            <button onClick={() => { const idx = availableMaps.findIndex(m=>m.id===hostSettings.mapId); const next = (idx + 1) % availableMaps.length; setHostSettings({...hostSettings, mapId: availableMaps[next].id}) }} className="p-2 bg-gray-700 rounded"><ArrowRight/></button>
                       </div>

                       <div className="mt-auto flex flex-col gap-2">
                           <button onClick={() => dispatch({ type: 'CREATE_LOBBY', payload: { name: hostSettings.lobbyName, settings: hostSettings, playerName, color: localCosmetics.color, hatId: localCosmetics.hatId, skinId: localCosmetics.skinId } })} className="w-full py-4 bg-neon-cyan text-black font-game text-xl rounded border-b-4 border-cyan-700 hover:brightness-110">INITIALIZE LOBBY</button>
                           <button onClick={() => dispatch({ type: 'SET_LOBBY_MODE', payload: 'MAIN_MENU' })} className="w-full py-3 bg-gray-700 text-gray-300 font-bold rounded border-b-4 border-gray-900 hover:bg-gray-600">CANCEL</button>
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
          <div className="h-full bg-space-900 p-6 flex flex-col relative">
              {/* Header */}
              <div className="flex justify-between items-center bg-game-panel p-4 rounded-xl border-b-4 border-black mb-6">
                  <div>
                      <h2 className="text-3xl font-game text-white">{state.settings.lobbyName}</h2>
                      <div className="flex items-center gap-4 text-gray-400 text-sm">
                          <span className="flex items-center gap-1"><Globe size={14}/> {state.settings.region}</span>
                          <span className="flex items-center gap-1"><MapIcon size={14}/> {currentMap.name}</span>
                          <span className="flex items-center gap-1 text-red-400"><Users size={14}/> {state.settings.impostorCount} IMPOSTORS</span>
                      </div>
                  </div>
                  <div className="text-right">
                      <div className="text-xs text-gray-400 font-bold mb-1">JOIN CODE</div>
                      <div className="text-4xl font-mono text-neon-cyan tracking-widest bg-black px-4 py-2 rounded border border-cyan-900">{state.lobbyCode}</div>
                  </div>
              </div>

              <div className="flex-1 flex gap-6 overflow-hidden">
                  {/* Left: Player List */}
                  <div className="flex-1 bg-black/30 rounded-xl border-2 border-gray-700 p-4 overflow-y-auto">
                      <div className="flex justify-between items-center mb-4">
                          <h3 className="font-bold text-gray-300">OPERATIVES ({state.players.length}/{state.settings.maxPlayers})</h3>
                          <button onClick={() => setShowCustomize(true)} className="text-xs bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded flex items-center gap-1"><Palette size={12}/> CUSTOMIZE</button>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          {state.players.map(p => (
                              <div key={p.id} className={`p-3 rounded-lg border-2 flex items-center gap-3 relative ${p.isReady ? 'bg-green-900/20 border-green-600' : 'bg-gray-800 border-gray-600'}`}>
                                  {/* Minimal Avatar Preview */}
                                  <div className="w-12 h-12 rounded-full border-2 border-white/20 bg-black/50 relative overflow-hidden">
                                      <div className="absolute inset-0 top-1">
                                           <Character 
                                                player={{...p, position: {x: 24, y: 35}, direction: 'right', isMoving: false, isDead: false}} 
                                                role={BASE_ROLES['technician']} 
                                                isLocal={false} 
                                            />
                                      </div>
                                  </div>
                                  
                                  <div className="flex-1">
                                      <div className="font-bold text-white flex items-center gap-2">
                                          {p.name} 
                                          {p.isHost && <Shield size={12} className="text-yellow-500"/>}
                                      </div>
                                      <div className="text-xs text-gray-400 uppercase">{p.isReady ? 'READY' : 'PREPARING...'}</div>
                                  </div>
                                  
                                  {isHost && !p.isHost && (
                                      <button onClick={() => dispatch({ type: 'KICK_PLAYER', payload: { targetId: p.id } })} className="text-red-500 hover:text-red-400 p-1"><XCircle size={16}/></button>
                                  )}
                              </div>
                          ))}
                      </div>
                  </div>

                  {/* Right: Settings Panel */}
                  <div className="w-96 bg-game-panel rounded-xl border-4 border-black flex flex-col">
                       <div className="flex border-b-4 border-black">
                           <button onClick={() => setActiveTab('rules')} className={`flex-1 py-3 font-bold ${activeTab === 'rules' ? 'bg-gray-700 text-white' : 'bg-gray-800 text-gray-500 hover:bg-gray-700'}`}>RULES</button>
                           <button onClick={() => setActiveTab('roles')} className={`flex-1 py-3 font-bold ${activeTab === 'roles' ? 'bg-gray-700 text-white' : 'bg-gray-800 text-gray-500 hover:bg-gray-700'}`}>ROLES</button>
                       </div>
                       
                       <div className="flex-1 overflow-y-auto p-4 space-y-4">
                           {activeTab === 'rules' ? (
                               <div className="space-y-6">
                                   {/* Map */}
                                   <div className="space-y-2">
                                       <label className="text-xs font-bold text-gray-400">MAP</label>
                                       {isHost ? (
                                           <select value={state.settings.mapId} onChange={e => dispatch({ type: 'UPDATE_SETTINGS', payload: { mapId: e.target.value } })} className="w-full bg-black border border-gray-600 p-2 rounded text-sm text-white">
                                               {availableMaps.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                           </select>
                                       ) : <div className="text-white font-mono bg-black/30 p-2 rounded">{currentMap.name}</div>}
                                   </div>

                                   {/* Core Settings */}
                                   <div className="space-y-1">
                                        <h3 className="text-xs font-black text-neon-cyan uppercase tracking-wider mb-2 border-b border-gray-700 pb-1">Core Rules</h3>
                                        <SettingsControl 
                                            label="Player Speed" 
                                            value={state.settings.playerSpeed} 
                                            min={1} max={15} step={0.5} 
                                            disabled={!isHost} 
                                            onChange={(v: number) => dispatch({ type: 'UPDATE_SETTINGS', payload: { playerSpeed: v } })}
                                            tooltip="Movement speed of all players. Higher speeds make the map feel smaller."
                                        />
                                        <SettingsControl 
                                            label="Kill Cooldown" 
                                            value={state.settings.killCooldown} 
                                            min={10} max={60} step={2.5} 
                                            disabled={!isHost} 
                                            onChange={(v: number) => dispatch({ type: 'UPDATE_SETTINGS', payload: { killCooldown: v } })}
                                            tooltip="Time impostors must wait between kills. Longer cooldowns favor the crew."
                                        />
                                        <SettingsControl 
                                            label="Vision Multiplier" 
                                            value={state.settings.visionMultiplier} 
                                            min={0.5} max={3} step={0.25} 
                                            disabled={!isHost} 
                                            onChange={(v: number) => dispatch({ type: 'UPDATE_SETTINGS', payload: { visionMultiplier: v } })}
                                            tooltip="Base vision range for all players. Lower values increase tension."
                                        />
                                   </div>

                                   {/* Task Settings */}
                                   <div className="space-y-1">
                                        <h3 className="text-xs font-black text-neon-cyan uppercase tracking-wider mb-2 border-b border-gray-700 pb-1">Task Difficulty</h3>
                                        <SettingsControl 
                                            label="Short Tasks" 
                                            value={state.settings.taskCounts.short} 
                                            min={0} max={5} step={1} 
                                            disabled={!isHost} 
                                            onChange={(v: number) => dispatch({ type: 'UPDATE_SETTINGS', payload: { taskCounts: { ...state.settings.taskCounts, short: v } } })}
                                            tooltip="Quick, single-step tasks. Keeps crew moving frequently between locations."
                                        />
                                        <SettingsControl 
                                            label="Long Tasks" 
                                            value={state.settings.taskCounts.long} 
                                            min={0} max={3} step={1} 
                                            disabled={!isHost} 
                                            onChange={(v: number) => dispatch({ type: 'UPDATE_SETTINGS', payload: { taskCounts: { ...state.settings.taskCounts, long: v } } })}
                                            tooltip="Multi-step or time-consuming tasks. Forces crew to stay exposed in one area longer."
                                        />
                                        <SettingsControl 
                                            label="Complex Tasks" 
                                            value={state.settings.taskCounts.complex} 
                                            min={0} max={3} step={1} 
                                            disabled={!isHost} 
                                            onChange={(v: number) => dispatch({ type: 'UPDATE_SETTINGS', payload: { taskCounts: { ...state.settings.taskCounts, complex: v } } })}
                                            tooltip="Difficult logic puzzles or mini-games. Distracted crew are easy targets for impostors."
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
                                                {isHost && <input type="checkbox" checked={setting.enabled} onChange={e => {
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
                                                    }} className="flex-1 accent-yellow-500" /> : <div className="flex-1 h-1 bg-gray-600"><div className="h-full bg-yellow-500" style={{width: `${setting.chance}%`}}/></div>}
                                                </div>
                                            )}
                                       </div>
                                   ))}
                               </div>
                           )}
                       </div>
                  </div>
              </div>

              {/* Bottom Actions */}
              <div className="mt-6 flex justify-between items-center">
                   <button onClick={() => dispatch({ type: 'SET_LOBBY_MODE', payload: 'MAIN_MENU' })} className="px-6 py-3 bg-red-900/50 hover:bg-red-900 border-2 border-red-700 rounded font-bold text-red-200">LEAVE LOBBY</button>
                   
                   <div className="flex gap-4">
                       {!isHost && (
                           <button onClick={() => dispatch({ type: 'SET_READY', payload: { playerId: myPlayer!.id, isReady: !myPlayer!.isReady } })} className={`px-8 py-3 rounded font-bold text-xl border-b-4 shadow-lg transition-transform active:translate-y-1 ${myPlayer?.isReady ? 'bg-green-600 border-green-800 text-white' : 'bg-gray-600 border-gray-800 text-gray-300'}`}>
                               {myPlayer?.isReady ? 'READY!' : 'MARK READY'}
                           </button>
                       )}
                       
                       {isHost && (
                           <button 
                                onClick={() => dispatch({ type: 'START_GAME' })} 
                                disabled={state.players.length < 1} // Should be 4, but 1 for dev
                                className="px-12 py-3 bg-neon-green text-black font-game text-2xl rounded border-b-4 border-green-800 hover:brightness-110 shadow-[0_0_20px_#4ade80] disabled:opacity-50 disabled:cursor-not-allowed"
                           >
                               START MISSION
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
