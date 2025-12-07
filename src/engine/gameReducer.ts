
import { GameState, GameAction, Player, GamePhase, Team, GameSettings } from '../types';
import { BASE_ROLES, BASE_TASKS, INITIAL_SETTINGS, COLORS } from '../data/constants';
import { MAP_REGISTRY, DEFAULT_MAP_ID } from '../data/mapRegistry';

const createPlayer = (id: string, name: string, color: string, isHost: boolean, hatId: string = 'none', skinId: string = 'standard'): Player => ({
    id, name, color, isHost,
    position: { x: 0, y: 0 }, 
    velocity: { x: 0, y: 0 },
    roleId: 'technician',
    isDead: false,
    isInVent: false,
    direction: 'right',
    tasks: [],
    hasVoted: false,
    isMoving: false,
    hatId,
    skinId,
    isReady: false,
    killTimer: 0,
    emergencyMeetingsLeft: 1
});

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_LOBBY_MODE':
        return { ...state, lobbyMode: action.payload };

    case 'CREATE_LOBBY':
        const host = createPlayer('p_host', action.payload.playerName, action.payload.color, true, action.payload.hatId, action.payload.skinId);
        const mapId = action.payload.settings.mapId || DEFAULT_MAP_ID;
        const map = MAP_REGISTRY[mapId] || MAP_REGISTRY[DEFAULT_MAP_ID];
        host.position = { ...map.spawnPoint };
        
        return {
            ...state,
            phase: 'LOBBY',
            lobbyMode: 'LOBBY',
            lobbyCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
            settings: { ...INITIAL_SETTINGS, ...action.payload.settings },
            players: [host],
            myPlayerId: 'p_host',
            map: map.objects,
            activeMapId: mapId,
            logs: ["Lobby created."],
            emergencyCooldown: 0
        };
    
    case 'JOIN_LOBBY':
         const newId = `p_${state.players.length + 1}`;
         const joiner = createPlayer(newId, action.payload.playerName, action.payload.color, false, action.payload.hatId, action.payload.skinId);
         const jMap = MAP_REGISTRY[state.activeMapId];
         joiner.position = { ...jMap.spawnPoint };
         return {
             ...state,
             phase: 'LOBBY',
             lobbyMode: 'LOBBY',
             players: [...state.players, joiner],
             myPlayerId: newId,
             logs: [...state.logs, `${action.payload.playerName} joined.`]
         };

    case 'UPDATE_SETTINGS':
        return { ...state, settings: { ...state.settings, ...action.payload } };

    case 'UPDATE_COSMETICS':
        const cosmeticPayload = 'payload' in action.payload ? action.payload.payload : action.payload;
        return {
            ...state,
            players: state.players.map(p => 
                p.id === cosmeticPayload.playerId 
                ? { ...p, 
                    color: cosmeticPayload.color ?? p.color,
                    hatId: cosmeticPayload.hatId ?? p.hatId,
                    skinId: cosmeticPayload.skinId ?? p.skinId 
                  } 
                : p
            )
        };

    case 'SET_READY':
        return {
            ...state,
            players: state.players.map(p => p.id === action.payload.playerId ? { ...p, isReady: action.payload.isReady } : p)
        };

    case 'KICK_PLAYER':
        return {
            ...state,
            players: state.players.filter(p => p.id !== action.payload.targetId)
        };

    case 'SET_MAP':
        const newMap = MAP_REGISTRY[action.payload.mapId];
        return {
            ...state,
            activeMapId: action.payload.mapId,
            map: newMap.objects,
            settings: { ...state.settings, mapId: action.payload.mapId },
            players: state.players.map(p => ({ ...p, position: { ...newMap.spawnPoint } }))
        };

    case 'START_GAME':
      const impostorCount = Math.min(state.settings.impostorCount, Math.floor(state.players.length / 2));
      const currentMap = MAP_REGISTRY[state.activeMapId];
      const availableTaskLocations = currentMap.objects.filter(obj => obj.type === 'task_location');

      let shuffled = [...state.players].sort(() => 0.5 - Math.random());
      
      const assignedPlayers = shuffled.map((p, index) => {
          let roleId = 'technician';
          const isImpostor = index < impostorCount;

          if (isImpostor) {
              const phantomSetting = state.settings.roleSettings['phantom'];
              if (phantomSetting?.enabled && Math.random() * 100 < phantomSetting.chance) {
                  roleId = 'phantom';
              } else {
                  roleId = 'saboteur'; 
              }
          } else {
              const specialRoles = ['medic', 'engineer', 'detective'].filter(r => state.settings.roleSettings[r]?.enabled);
              for (const rId of specialRoles) {
                  const setting = state.settings.roleSettings[rId];
                  if (Math.random() * 100 < setting.chance) {
                      roleId = rId;
                      break; 
                  }
              }
          }
          
          return { ...p, roleId };
      });

      const playersWithTasks = assignedPlayers.map(p => {
        let tasks = [];
        const role = BASE_ROLES[p.roleId];
        const isImpostor = role.team === Team.GLITCH;
        
        if (role.team === Team.INITIATIVE) {
             const totalTasks = state.settings.taskCounts.short + state.settings.taskCounts.long + state.settings.taskCounts.complex;
             const selectedTasks = [...availableTaskLocations]
                .sort(() => 0.5 - Math.random())
                .slice(0, Math.min(totalTasks, availableTaskLocations.length));

             tasks = selectedTasks.map((loc, i) => ({
                 id: `t_${p.id}_${i}`,
                 taskId: loc.taskType || 'fix_wiring',
                 completed: false,
                 location: { x: loc.x, y: loc.y }
             }));
        }
        return { 
            ...p, 
            tasks, 
            position: { ...currentMap.spawnPoint, x: currentMap.spawnPoint.x + (Math.random() * 100 - 50) },
            isDead: false,
            isInVent: false,
            hasVoted: false,
            killTimer: isImpostor ? 10 : 0,
            emergencyMeetingsLeft: 1
        };
      });

      return {
        ...state,
        phase: 'PLAYING',
        players: playersWithTasks.sort((a, b) => a.id.localeCompare(b.id)),
        logs: [...state.logs, "MISSION START."],
        systems: {
             lights: { active: true, fixed: true },
             reactor: { meltdownTimer: null, fixedCount: 0 },
             comms: { active: true },
             oxygen: { depletionTimer: null, fixedCount: 0 },
             globalSabotageCooldown: 20,
             doors: {}
        },
        emergencyCooldown: 15
      };
    
    case 'RETURN_TO_LOBBY':
        const rMap = MAP_REGISTRY[state.activeMapId];
        return {
            ...state,
            phase: 'LOBBY',
            lobbyMode: 'LOBBY',
            activeSabotage: null,
            activeTask: null,
            deadBodyReported: null,
            chatMessages: [],
            players: state.players.map(p => ({
                ...p,
                isDead: false,
                isInVent: false,
                tasks: [],
                hasVoted: false,
                isReady: false,
                position: { ...rMap.spawnPoint },
                killTimer: 0
            }))
        };

    case 'MOVE_PLAYER':
      return {
        ...state,
        players: state.players.map(p => 
          p.id === action.payload.id ? { 
              ...p, 
              position: action.payload.position, 
              direction: action.payload.direction,
              isMoving: action.payload.isMoving 
          } : p
        )
      };

    case 'ENTER_VENT':
      const vent = state.map.find(m => m.id === action.payload.ventId);
      if (!vent) return state;
      return {
        ...state,
        players: state.players.map(p => 
            p.id === action.payload.playerId 
            ? { ...p, isInVent: true, ventId: action.payload.ventId, position: { x: vent.x + vent.width/2, y: vent.y + vent.height/2 } } 
            : p
        )
      };

    case 'EXIT_VENT':
      return {
        ...state,
        players: state.players.map(p => 
            p.id === action.payload.playerId 
            ? { ...p, isInVent: false, ventId: undefined } 
            : p
        )
      };

    case 'KILL_PLAYER':
      const killer = state.players.find(p => p.id === action.payload.killerId);
      if (!killer || (killer.killTimer && killer.killTimer > 0)) return state;

      return {
        ...state,
        players: state.players.map(p => {
          if (p.id === action.payload.targetId) return { ...p, isDead: true };
          if (p.id === action.payload.killerId) return { ...p, killTimer: state.settings.killCooldown };
          return p;
        }),
        logs: [...state.logs, `OPERATIVE DOWN.`]
      };
    
    case 'SABOTAGE_DOORS':
        const doorIds = action.payload.doorIds || [];
        return {
            ...state,
            map: state.map.map(obj => {
                if (obj.type === 'door' && doorIds.includes(obj.id)) {
                    return { ...obj, isOpen: false, isLocked: true, lockedUntil: 10 };
                }
                return obj;
            })
        };

    case 'TRIGGER_SABOTAGE':
        if (state.systems.globalSabotageCooldown > 0) return state;
        const sys = { ...state.systems };
        sys.globalSabotageCooldown = 30; // Cooldown after triggering
        
        let newActiveSabotage = action.payload.type;
        
        if (action.payload.type === 'LIGHTS') {
             sys.lights.active = false;
        }
        else if (action.payload.type === 'REACTOR') { 
            sys.reactor.meltdownTimer = 60; 
            sys.reactor.fixedCount = 0; 
        }
        else if (action.payload.type === 'OXYGEN') { 
            sys.oxygen.depletionTimer = 60; 
            sys.oxygen.fixedCount = 0; 
        }
        else if (action.payload.type === 'COMMS') {
            sys.comms.active = false;
        }

        return { 
            ...state, 
            systems: sys, 
            activeSabotage: newActiveSabotage, 
            logs: [...state.logs, `SABOTAGE DETECTED: ${action.payload.type}`] 
        };

    case 'FIX_SABOTAGE':
        const fixedSys = { ...state.systems };
        const type = action.payload.type;
        
        let cleared = false;

        if (type === 'LIGHTS') {
            fixedSys.lights.active = true;
            cleared = true;
        }
        else if (type === 'COMMS') {
             fixedSys.comms.active = true;
             cleared = true;
        }
        else if (type === 'REACTOR') {
            fixedSys.reactor.fixedCount += 1;
            if (fixedSys.reactor.fixedCount >= 2) {
                fixedSys.reactor.meltdownTimer = null;
                cleared = true;
            }
        }
        else if (type === 'OXYGEN') {
            fixedSys.oxygen.fixedCount += 1;
            if (fixedSys.oxygen.fixedCount >= 2) {
                fixedSys.oxygen.depletionTimer = null;
                cleared = true;
            }
        }

        return { 
            ...state, 
            systems: fixedSys, 
            activeSabotage: cleared ? null : state.activeSabotage, 
            logs: cleared ? [...state.logs, `SYSTEM RESTORED.`] : state.logs
        };

    case 'CALL_EMERGENCY_MEETING':
        if (state.activeSabotage && (state.activeSabotage === 'REACTOR' || state.activeSabotage === 'OXYGEN')) return state;
        if (state.emergencyCooldown > 0) return state;

        const caller = state.players.find(p => p.id === action.payload.playerId);
        if (!caller || caller.isDead || caller.emergencyMeetingsLeft <= 0) return state;

        return {
            ...state,
            phase: 'MEETING',
            meetingTimer: state.settings.discussionTime + state.settings.votingTime,
            deadBodyReported: 'emergency_button',
            votes: {},
            chatMessages: [],
            players: state.players.map(p => 
                p.id === action.payload.playerId 
                ? { ...p, emergencyMeetingsLeft: p.emergencyMeetingsLeft - 1, isInVent: false, hasVoted: false } 
                : { ...p, isInVent: false, hasVoted: false }
            ),
            logs: [...state.logs, `EMERGENCY MEETING CALLED BY ${caller.name}.`],
            activeSabotage: null, // Clear non-critical sabotage? Standard is yes, or pause. We'll clear for now.
            systems: {
                ...state.systems,
                lights: { active: true, fixed: true },
                comms: { active: true },
                // Reactor/Oxygen are blocked so assume they are fine if we got here
                globalSabotageCooldown: 20
            },
            map: state.map.map(o => o.type === 'door' ? { ...o, isOpen: true, isLocked: false, lockedUntil: 0 } : o)
        };

    case 'REPORT_BODY':
      return {
        ...state,
        phase: 'MEETING',
        deadBodyReported: action.payload.bodyId,
        meetingTimer: state.settings.discussionTime + state.settings.votingTime,
        votes: {},
        chatMessages: [],
        activeSabotage: null,
        players: state.players.map(p => ({...p, hasVoted: false, isInVent: false})),
        logs: [...state.logs, `EMERGENCY MEETING CALLED.`],
        systems: {
            ...state.systems,
            lights: { active: true, fixed: true },
            reactor: { meltdownTimer: null, fixedCount: 0 },
            oxygen: { depletionTimer: null, fixedCount: 0 },
            comms: { active: true },
            globalSabotageCooldown: 10 // Short cooldown after meeting
        },
        map: state.map.map(o => o.type === 'door' ? { ...o, isOpen: true, isLocked: false, lockedUntil: 0 } : o)
      };
    
    case 'SEND_CHAT':
        const sender = state.players.find(p => p.id === state.myPlayerId);
        if (!sender) return state;
        return {
            ...state,
            chatMessages: [
                ...state.chatMessages, 
                { 
                    id: Math.random().toString(), 
                    senderId: sender.id, 
                    senderName: sender.name, 
                    text: action.payload.text, 
                    timestamp: Date.now(),
                    color: sender.color
                }
            ]
        };

    case 'VOTE':
      return {
        ...state,
        votes: { ...state.votes, [action.payload.voterId]: action.payload.targetId },
        players: state.players.map(p => p.id === action.payload.voterId ? { ...p, hasVoted: true } : p),
      };

    case 'END_MEETING':
      const ejectedId = action.payload.ejectedId;
      let newPlayers = [...state.players];
      if (ejectedId) newPlayers = newPlayers.map(p => p.id === ejectedId ? { ...p, isDead: true } : p);

      const mapStart = MAP_REGISTRY[state.activeMapId];
      newPlayers = newPlayers.map(p => ({
        ...p, position: { ...mapStart.spawnPoint }, hasVoted: false, isInVent: false,
        killTimer: state.settings.killCooldown 
      }));

      const aliveCrew = newPlayers.filter(p => !p.isDead && BASE_ROLES[p.roleId].team !== Team.GLITCH).length;
      const aliveImps = newPlayers.filter(p => !p.isDead && BASE_ROLES[p.roleId].team === Team.GLITCH).length;
      let nextPhase: GamePhase = 'PLAYING';

      if (aliveImps >= aliveCrew) nextPhase = 'ENDED';
      else if (aliveImps === 0) nextPhase = 'ENDED';

      return {
        ...state,
        phase: nextPhase,
        players: newPlayers,
        votes: {},
        deadBodyReported: null,
        systems: { ...state.systems, globalSabotageCooldown: 20 },
        emergencyCooldown: 15 // Global cooldown after meeting
      };

    case 'TOGGLE_DOOR':
      return {
        ...state,
        map: state.map.map(obj => obj.id === action.payload.doorId && obj.type === 'door' && !obj.isLocked ? { ...obj, isOpen: !obj.isOpen } : obj)
      };

    case 'OPEN_TASK': return { ...state, activeTask: action.payload.taskInstanceId };
    case 'CLOSE_TASK': return { ...state, activeTask: null };
    case 'COMPLETE_TASK':
        const updatedPlayerList = state.players.map(p => p.id === action.payload.playerId ? { ...p, tasks: p.tasks.map(t => t.id === action.payload.taskInstanceId ? { ...t, completed: true } : t) } : p);
        return { ...state, players: updatedPlayerList, activeTask: null };

    case 'TICK':
      const dtSeconds = action.payload.dt / 1000;
      let updatedMap = state.map.map(obj => {
          if (obj.type === 'door' && obj.isLocked && obj.lockedUntil && obj.lockedUntil > 0) {
              const newVal = obj.lockedUntil - dtSeconds;
              if (newVal <= 0) return { ...obj, lockedUntil: 0, isLocked: false, isOpen: true };
              return { ...obj, lockedUntil: newVal };
          }
          return obj;
      });

      const updatedPlayersTicked = state.players.map(p => ({
          ...p,
          killTimer: p.killTimer && p.killTimer > 0 ? Math.max(0, p.killTimer - dtSeconds) : 0
      }));

      const sysState = { ...state.systems };
      
      if (sysState.globalSabotageCooldown > 0) {
          sysState.globalSabotageCooldown = Math.max(0, sysState.globalSabotageCooldown - dtSeconds);
      }

      let newEmergencyCooldown = state.emergencyCooldown;
      if (newEmergencyCooldown > 0) {
          newEmergencyCooldown = Math.max(0, newEmergencyCooldown - dtSeconds);
      }

      if (sysState.reactor.meltdownTimer !== null && sysState.reactor.meltdownTimer > 0) {
          sysState.reactor.meltdownTimer -= dtSeconds;
          if (sysState.reactor.meltdownTimer <= 0) return { ...state, phase: 'ENDED' };
      }
      
      if (sysState.oxygen.depletionTimer !== null && sysState.oxygen.depletionTimer > 0) {
          sysState.oxygen.depletionTimer -= dtSeconds;
           if (sysState.oxygen.depletionTimer <= 0) return { ...state, phase: 'ENDED' };
      }

      return { ...state, systems: sysState, map: updatedMap, players: updatedPlayersTicked, emergencyCooldown: newEmergencyCooldown };

    case 'LOAD_MOD':
      return {
        ...state,
        modRegistry: {
          roles: { ...state.modRegistry.roles, ...Object.fromEntries(action.payload.roles.map(r => [r.id, r])) },
          tasks: { ...state.modRegistry.tasks, ...Object.fromEntries(action.payload.tasks.map(t => [t.id, t])) }
        },
        logs: [...state.logs, `MOD INSTALLED: ${action.payload.name}`]
      };

    default: return state;
  }
}
