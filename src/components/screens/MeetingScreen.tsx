
import React, { useState } from 'react';
import { GameState, GameAction, Team } from '../../types';
import { XCircle, Volume2, MessageSquare, Send, Zap, Shield, Skull, Target } from 'lucide-react';

export const MeetingScreen: React.FC<{ state: GameState; dispatch: React.Dispatch<GameAction> }> = ({ state, dispatch }) => {
    const myPlayer = state.players.find(p => p.id === state.myPlayerId);
    const myRole = state.modRegistry.roles[myPlayer?.roleId || 'technician'];
    const [msgText, setMsgText] = useState('');
    
    const handleEnd = () => {
        dispatch({ type: 'END_MEETING', payload: { ejectedId: null } }); 
    };

    const sendChat = () => {
        if (!msgText.trim()) return;
        dispatch({ type: 'SEND_CHAT', payload: { text: msgText } });
        setMsgText('');
    };

    const isImpostor = myRole.team === Team.GLITCH;

    return (
        <div className="w-full h-full bg-space-800 p-8 flex items-center justify-center">
            <div className="w-full max-w-6xl bg-slate-200 rounded-3xl border-8 border-slate-400 p-4 shadow-2xl flex h-[700px] gap-4">
                
                {/* LEFT COLUMN: ROLE INFO & CHAT */}
                <div className="w-1/3 flex flex-col gap-4 h-full">
                    
                    {/* ROLE IDENTITY CARD */}
                    <div className={`rounded-xl border-4 p-4 shadow-lg text-white flex flex-col gap-2 shrink-0 ${isImpostor ? 'bg-red-950 border-red-600' : 'bg-blue-950 border-blue-500'}`}>
                        <div className="flex justify-between items-center border-b border-white/20 pb-2">
                            <div className="flex items-center gap-2">
                                {isImpostor ? <Skull className="text-red-500" size={24}/> : <Shield className="text-blue-400" size={24}/>}
                                <span className={`font-game text-2xl tracking-wide ${isImpostor ? 'text-red-500' : 'text-blue-400'}`}>{myRole.name.toUpperCase()}</span>
                            </div>
                            <span className={`text-xs font-mono font-bold px-2 py-1 rounded ${isImpostor ? 'bg-red-900 text-red-200' : 'bg-blue-900 text-blue-200'}`}>
                                {isImpostor ? 'IMPOSTOR' : 'CREW'}
                            </span>
                        </div>
                        
                        <div className="text-sm text-gray-300 italic min-h-[3em]">"{myRole.description}"</div>
                        
                        <div className="bg-black/30 p-2 rounded text-xs font-mono space-y-1 mt-auto">
                            {myRole.abilityName && (
                                <div className="flex items-center gap-2 text-yellow-400">
                                    <Zap size={14}/> 
                                    <span className="opacity-70">ABILITY:</span> 
                                    <span className="text-white font-bold">{myRole.abilityName}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-2 text-green-400">
                                <Target size={14}/> 
                                <span className="opacity-70">OBJECTIVE:</span> 
                                <span className="text-white font-bold">{isImpostor ? 'Sabotage & Eliminate.' : 'Complete Tasks & Survive.'}</span>
                            </div>
                        </div>
                    </div>

                    {/* CHAT BOX */}
                    <div className="flex-1 bg-slate-300 rounded-xl border-4 border-slate-400 flex flex-col overflow-hidden min-h-0">
                        <div className="bg-slate-700 p-3 text-white font-game flex items-center gap-2 shrink-0">
                            <MessageSquare size={18}/> MISSION COMMS
                        </div>
                        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-100/50">
                            {state.chatMessages.map(msg => (
                                <div key={msg.id} className="bg-white p-2 rounded shadow-sm border border-slate-200 text-sm">
                                    <span className="font-bold mr-2" style={{color: msg.color}}>{msg.senderName}:</span>
                                    <span className="text-gray-800">{msg.text}</span>
                                </div>
                            ))}
                            {state.chatMessages.length === 0 && <div className="text-gray-500 text-center italic mt-10">Discuss suspicious activity...</div>}
                        </div>
                        <div className="p-2 bg-slate-200 flex gap-2 shrink-0">
                            <input 
                                type="text" 
                                className="flex-1 p-2 rounded border border-gray-400 text-black text-sm" 
                                placeholder="Type message..." 
                                value={msgText}
                                onChange={e => setMsgText(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && sendChat()}
                            />
                            <button onClick={sendChat} className="bg-blue-600 text-white p-2 rounded hover:bg-blue-500"><Send size={16}/></button>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: VOTING */}
                <div className="flex-1 flex flex-col">
                    <div className="flex justify-between items-center mb-6 bg-slate-700 p-4 rounded-xl text-white font-game text-2xl shadow-md border-b-4 border-slate-900">
                        <span>WHO IS THE IMPOSTOR?</span>
                        <span className={`font-mono ${state.meetingTimer < 10 ? 'text-red-500 animate-pulse' : 'text-yellow-400'}`}>00:{state.meetingTimer.toString().padStart(2, '0')}</span>
                    </div>
                    
                    <div className="flex-1 grid grid-cols-2 gap-4 overflow-y-auto mb-4 content-start pr-2">
                        {state.players.map(p => (
                            <button key={p.id} 
                                disabled={p.isDead || myPlayer?.hasVoted}
                                onClick={() => dispatch({ type: 'VOTE', payload: { voterId: myPlayer!.id, targetId: p.id } })}
                                className={`p-3 rounded-xl border-2 flex items-center gap-4 transition-all relative overflow-hidden group ${p.isDead ? 'opacity-50 grayscale bg-red-900/20 cursor-not-allowed border-transparent' : 'bg-white hover:bg-gray-50 border-slate-300 hover:border-slate-400 hover:shadow-lg'} ${state.votes[myPlayer?.id || ''] === p.id ? 'ring-4 ring-green-500 transform scale-[1.02] border-green-500 z-10' : ''}`}
                            >
                                <div className="w-14 h-14 rounded-lg border-2 border-black/20 shadow-inner bg-space-800 relative">
                                     <div className="absolute inset-0 opacity-80" style={{backgroundColor: p.color}} />
                                     {p.isDead && <XCircle className="absolute inset-0 m-auto text-red-900 opacity-50" size={32}/>}
                                </div>
                                <div className="text-left flex-1">
                                    <div className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                        {p.name}
                                        {p.isDead && <span className="text-[10px] bg-red-600 text-white px-1.5 rounded font-black uppercase">DEAD</span>}
                                    </div>
                                    {state.votes[p.id] && <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded font-bold shadow-sm">VOTED</span>}
                                </div>
                                {state.votes[myPlayer?.id || ''] === p.id && <div className="absolute right-2 top-2 text-green-500"><CheckCircle size={20}/></div>}
                            </button>
                        ))}
                    </div>
                    
                    <div className="flex justify-between pt-4 border-t-2 border-slate-300 gap-4">
                        <button onClick={() => dispatch({ type: 'VOTE', payload: { voterId: myPlayer!.id, targetId: 'skip' } })} disabled={myPlayer?.hasVoted} className="bg-gray-500 text-white px-6 py-4 rounded-xl font-game flex items-center gap-2 border-b-4 border-gray-700 hover:brightness-110 disabled:opacity-50 transition-all active:translate-y-1 active:border-b-0 hover:-translate-y-0.5"><XCircle/> SKIP VOTE</button>
                        {myPlayer?.isHost ? (
                             <button onClick={handleEnd} className="bg-blue-600 text-white px-8 py-4 rounded-xl font-game border-b-4 border-blue-800 hover:brightness-110 transition-all active:translate-y-1 active:border-b-0 hover:-translate-y-0.5 shadow-lg flex-1 max-w-xs">PROCEED TO RESULTS</button>
                        ) : (
                             <div className="flex items-center text-gray-500 font-bold italic animate-pulse">WAITING FOR HOST...</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Simple Icon component helper if not imported
const CheckCircle = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
);
