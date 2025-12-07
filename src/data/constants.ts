
import { RoleDefinition, TaskDefinition, Team, GameSettings } from '../types';
import { STARSHIP_ZENITH } from './maps/starshipZenith';

export const COLORS = [
  '#C51111', '#132ED1', '#117F2D', '#ED54BA', '#EF7D0D', '#F5F557', 
  '#3F474E', '#D6E0F0', '#6B2FBB', '#71491E', '#38FEDC', '#50EF39'
];

export const HATS = [
    { id: 'none', name: 'No Hat' },
    { id: 'cap', name: 'Captain Cap' },
    { id: 'helmet', name: 'Space Helmet' },
    { id: 'crown', name: 'Crown' },
    { id: 'ushanka', name: 'Ushanka' },
    { id: 'goggles', name: 'Goggles' },
    { id: 'horns', name: 'Devil Horns' },
    { id: 'halo', name: 'Halo' },
    { id: 'cowboy', name: 'Cowboy Hat' },
    { id: 'chef', name: 'Chef Hat' },
    { id: 'party', name: 'Party Hat' },
    { id: 'ninja', name: 'Ninja Band' },
    { id: 'pirate', name: 'Pirate Hat' },
    { id: 'flower', name: 'Flower' },
];

export const SKINS = [
    { id: 'standard', name: 'Standard Suit' },
    { id: 'camo', name: 'Military Camo' },
    { id: 'hazard', name: 'Hazard Stripe' },
    { id: 'tux', name: 'Tuxedo' },
    { id: 'doctor', name: 'Lab Coat' },
    { id: 'mechanic', name: 'Overalls' },
];

export const BASE_ROLES: Record<string, RoleDefinition> = {
  // INITIATIVE (Crew)
  technician: { 
      id: 'technician', name: 'Technician', team: Team.INITIATIVE, 
      description: 'Standard operative. Complete tasks efficiently.', 
      visionRadius: 1.0, canVent: false, canKill: false, killCooldown: 0 
  },
  medic: { 
      id: 'medic', name: 'Field Medic', team: Team.INITIATIVE, 
      description: 'Can check vitals and revive one player.', 
      visionRadius: 1.0, canVent: false, canKill: false, killCooldown: 0,
      abilityName: 'REVIVE', abilityCooldown: 60
  },
  engineer: { 
      id: 'engineer', name: 'Engineer', team: Team.INITIATIVE, 
      description: 'Can use vents to move quickly.', 
      visionRadius: 1.0, canVent: true, canKill: false, killCooldown: 0 
  },
  detective: {
      id: 'detective', name: 'Detective', team: Team.INITIATIVE, 
      description: 'Sees footprints of recent killers.', 
      visionRadius: 1.2, canVent: false, canKill: false, killCooldown: 0 
  },
  
  // GLITCH (Impostor)
  saboteur: { 
      id: 'saboteur', name: 'Saboteur', team: Team.GLITCH, 
      description: 'Eliminate the Initiative.', 
      visionRadius: 1.5, canVent: true, canKill: true, killCooldown: 25, 
      abilityName: 'SABOTAGE' 
  },
  phantom: {
      id: 'phantom', name: 'Phantom', team: Team.GLITCH, 
      description: 'Can cloak temporarily.', 
      visionRadius: 1.5, canVent: true, canKill: true, killCooldown: 30, 
      abilityName: 'CLOAK', abilityCooldown: 20
  }
};

export const BASE_TASKS: Record<string, TaskDefinition> = {
  'fix_wiring': { id: 'fix_wiring', name: 'Fix Wiring', type: 'short', steps: 1, interactRange: 50, miniGameKey: 'fix_wiring' },
  'upload_data': { id: 'upload_data', name: 'Download Data', type: 'long', steps: 1, interactRange: 50, miniGameKey: 'upload_data' },
  'fuel_engines': { id: 'fuel_engines', name: 'Fuel Engines', type: 'complex', steps: 2, interactRange: 50, miniGameKey: 'fuel_engines' },
  'scan_sample': { id: 'scan_sample', name: 'Inspect Sample', type: 'short', steps: 1, interactRange: 40, miniGameKey: 'scan_sample' },
  'calibrate_distributor': { id: 'calibrate_distributor', name: 'Calibrate Distributor', type: 'short', steps: 1, interactRange: 40, miniGameKey: 'calibrate_distributor' },
  'align_fuse': { id: 'align_fuse', name: 'Quantum Fuse Alignment', type: 'complex', steps: 1, interactRange: 50, miniGameKey: 'align_fuse' },
  'mix_chemical': { id: 'mix_chemical', name: 'BioGel Calibration', type: 'long', steps: 1, interactRange: 40, miniGameKey: 'mix_chemical' },
  'stabilize_gravity': { id: 'stabilize_gravity', name: 'Gravity Stabilization', type: 'complex', steps: 1, interactRange: 40, miniGameKey: 'stabilize_gravity' },
  'unlock_manifold': { id: 'unlock_manifold', name: 'Mag-Lock Override', type: 'short', steps: 1, interactRange: 40, miniGameKey: 'unlock_manifold' },
};

export const INITIAL_SETTINGS: GameSettings = {
  lobbyName: "Command Center",
  maxPlayers: 10,
  impostorCount: 2,
  mapId: STARSHIP_ZENITH.id,
  region: 'Automatic',
  isPrivate: false,
  
  // Game Rules
  playerSpeed: 7,
  visionMultiplier: 1.0,
  discussionTime: 15,
  votingTime: 30,
  killCooldown: 25,
  confirmEjects: true,
  taskCounts: {
      short: 2,
      long: 1,
      complex: 1
  },

  // Role Probabilities (Default: 100% chance if 1 max allowed)
  roleSettings: {
      'engineer': { id: 'engineer', enabled: true, chance: 100, count: 1 },
      'medic': { id: 'medic', enabled: true, chance: 50, count: 1 },
      'detective': { id: 'detective', enabled: true, chance: 50, count: 1 },
      'phantom': { id: 'phantom', enabled: true, chance: 50, count: 1 }, // Chance for impostor to be Phantom
  }
};
