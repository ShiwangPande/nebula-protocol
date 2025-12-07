
export type GamePhase = 'LOBBY' | 'PLAYING' | 'MEETING' | 'ENDED';
export type LobbyMode = 'MAIN_MENU' | 'HOST_SETUP' | 'BROWSER' | 'JOIN_CODE' | 'LOBBY' | 'CUSTOMIZE';

export enum Team {
  INITIATIVE = 'INITIATIVE', // Crew
  GLITCH = 'GLITCH',         // Impostor
  NEUTRAL = 'NEUTRAL'
}

export interface Vector2 {
  x: number;
  y: number;
}

export interface ChatMessage {
    id: string;
    senderId: string;
    senderName: string;
    text: string;
    timestamp: number;
    color: string;
}

export interface Player {
  id: string;
  name: string;
  color: string;
  position: Vector2;
  velocity: Vector2;
  roleId: string;
  isDead: boolean;
  isInVent: boolean;
  ventId?: string;
  tasks: TaskInstance[];
  hasVoted: boolean;
  isHost: boolean;
  direction: 'left' | 'right';
  isMoving: boolean;
  // GDD Specifics
  shielded?: boolean;
  isCloaked?: boolean;
  lastFootprintLocation?: Vector2; // For Detective
  // Cosmetics & Lobby
  hatId: string;
  skinId: string;
  isReady: boolean;
  killTimer?: number;
  emergencyMeetingsLeft: number;
}

export interface TaskInstance {
  id: string;
  taskId: string;
  completed: boolean;
  location: Vector2;
}

export interface RoleDefinition {
  id: string;
  name: string;
  team: Team;
  description: string;
  visionRadius: number; // Multiplier (1.0 is standard)
  canVent: boolean;
  canKill: boolean;
  killCooldown: number;
  abilityName?: string;
  abilityCooldown?: number;
}

export interface TaskDefinition {
  id: string;
  name: string;
  type: 'short' | 'long' | 'complex';
  steps: number;
  interactRange: number;
  miniGameKey: string;
}

export interface MapTheme {
  background: string;
  wallColor: string;
  wallBorder: string;
  doorColor: string;
  floorColor: string;
  floorPattern: string; // CSS url or gradient
  accentColor: string;
  hazardColor?: string;
}

export interface MapDefinition {
  id: string;
  name: string;
  description: string;
  theme: MapTheme;
  objects: MapObject[];
  spawnPoint: Vector2;
}

export interface MapObject {
  id: string;
  type: 'wall' | 'vent' | 'prop' | 'system' | 'door' | 'task_location' | 'floor' | 'hazard';
  x: number;
  y: number;
  width: number;
  height: number;
  roomId?: string;
  color?: string;
  isOpen?: boolean;
  isLocked?: boolean;
  lockedUntil?: number;
  taskType?: string; // Used for task_location AND system (repair type)
  connectedVents?: string[];
  propType?: 'desk' | 'bed' | 'engine' | 'crate' | 'monitor'; // For visuals
  rotation?: number;
}

export interface ModPackage {
  id: string;
  name: string;
  author: string;
  roles: RoleDefinition[];
  tasks: TaskDefinition[];
}

export interface RoleSetting {
    id: string;
    enabled: boolean;
    chance: number; // 0-100
    count: number;
}

export interface GameSettings {
  lobbyName: string;
  maxPlayers: number;
  impostorCount: number;
  mapId: string;
  region: string;
  isPrivate: boolean;
  // Game Rules
  playerSpeed: number;
  visionMultiplier: number;
  discussionTime: number;
  votingTime: number;
  killCooldown: number;
  confirmEjects: boolean;
  taskCounts: {
      short: number;
      long: number;
      complex: number;
  };
  // Role Probabilities
  roleSettings: Record<string, RoleSetting>;
}

export type SabotageType = 'LIGHTS' | 'REACTOR' | 'COMMS' | 'OXYGEN' | 'DOORS';

export interface SystemState {
  lights: {
    active: boolean; // false = blackout
    fixed: boolean;
  };
  reactor: {
    meltdownTimer: number | null; // null = stable
    fixedCount: number; // 0/2 needed
  };
  comms: {
    active: boolean; // false = jammed
  };
  oxygen: {
    depletionTimer: number | null;
    fixedCount: number; // 0/2 needed
  };
  globalSabotageCooldown: number;
  doors: Record<string, number>; // roomId -> active duration
}

export interface GameState {
  phase: GamePhase;
  lobbyMode: LobbyMode;
  lobbyCode: string;
  players: Player[];
  myPlayerId: string;
  meetingTimer: number;
  deadBodyReported: string | null;
  votes: Record<string, string>;
  chatMessages: ChatMessage[];
  modRegistry: {
    roles: Record<string, RoleDefinition>;
    tasks: Record<string, TaskDefinition>;
  };
  activeMapId: string;
  map: MapObject[];
  settings: GameSettings;
  logs: string[];
  systems: SystemState;
  activeTask: string | null; // The Instance ID or 'repair_X'
  activeSabotage: SabotageType | null;
  emergencyCooldown: number; // Global cooldown for button
}

export type GameAction =
  | { type: 'SET_LOBBY_MODE'; payload: LobbyMode; isRemote?: boolean }
  | { type: 'CREATE_LOBBY'; payload: { name: string; settings: Partial<GameSettings>; playerName: string; color: string; hatId: string; skinId: string }; isRemote?: boolean }
  | { type: 'JOIN_LOBBY'; payload: { code: string; playerId: string; playerName: string; color: string; hatId: string; skinId: string }; isRemote?: boolean }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<GameSettings>; isRemote?: boolean }
  | { type: 'UPDATE_COSMETICS'; payload: { playerId: string; color?: string; hatId?: string; skinId?: string }; isRemote?: boolean }
  | { type: 'SET_READY'; payload: { playerId: string; isReady: boolean }; isRemote?: boolean }
  | { type: 'KICK_PLAYER'; payload: { targetId: string }; isRemote?: boolean }
  | { type: 'START_GAME'; isRemote?: boolean }
  | { type: 'RETURN_TO_LOBBY'; isRemote?: boolean }
  | { type: 'MOVE_PLAYER'; payload: { id: string; position: Vector2; direction: 'left' | 'right'; isMoving: boolean }; isRemote?: boolean }
  | { type: 'KILL_PLAYER'; payload: { killerId: string; targetId: string }; isRemote?: boolean }
  | { type: 'REPORT_BODY'; payload: { reporterId: string; bodyId: string }; isRemote?: boolean }
  | { type: 'CALL_EMERGENCY_MEETING'; payload: { playerId: string }; isRemote?: boolean }
  | { type: 'VOTE'; payload: { voterId: string; targetId: string | 'skip' }; isRemote?: boolean }
  | { type: 'END_MEETING'; payload: { ejectedId: string | null }; isRemote?: boolean }
  | { type: 'LOAD_MOD'; payload: ModPackage; isRemote?: boolean }
  | { type: 'COMPLETE_TASK'; payload: { playerId: string; taskInstanceId: string }; isRemote?: boolean }
  | { type: 'OPEN_TASK'; payload: { taskInstanceId: string }; isRemote?: boolean }
  | { type: 'CLOSE_TASK'; isRemote?: boolean }
  | { type: 'TOGGLE_DOOR'; payload: { doorId: string }; isRemote?: boolean }
  | { type: 'SABOTAGE_DOORS'; payload: { doorIds: string[] }; isRemote?: boolean }
  | { type: 'ENTER_VENT'; payload: { playerId: string; ventId: string }; isRemote?: boolean }
  | { type: 'EXIT_VENT'; payload: { playerId: string }; isRemote?: boolean }
  | { type: 'TRIGGER_SABOTAGE'; payload: { type: SabotageType }; isRemote?: boolean }
  | { type: 'FIX_SABOTAGE'; payload: { type: SabotageType; stationId?: string }; isRemote?: boolean }
  | { type: 'USE_ABILITY'; payload: { playerId: string }; isRemote?: boolean } 
  | { type: 'SET_MAP'; payload: { mapId: string }; isRemote?: boolean }
  | { type: 'SEND_CHAT'; payload: { text: string }; isRemote?: boolean }
  | { type: 'TICK'; payload: { dt: number }; isRemote?: boolean }
  | { type: 'SYNC_STATE'; payload: GameState; isRemote?: boolean }
  | { type: 'REQUEST_STATE'; isRemote?: boolean };
