
import { MapDefinition, MapObject } from '../../types';

const createRoom = (id: string, x: number, y: number, w: number, h: number, color: string): MapObject[] => {
  const wallThickness = 12;
  return [
    { id: `fl_${id}`, type: 'floor', x, y, width: w, height: h, color, roomId: id },
    { id: `w_${id}_t`, type: 'wall', x, y, width: w, height: wallThickness },
    { id: `w_${id}_b`, type: 'wall', x, y: y + h - wallThickness, width: w, height: wallThickness },
    { id: `w_${id}_l`, type: 'wall', x, y, width: wallThickness, height: h },
    { id: `w_${id}_r`, type: 'wall', x: x + w - wallThickness, y, width: wallThickness, height: h },
  ];
};

export const MAGMA_CORE: MapDefinition = {
    id: 'magma',
    name: 'Magma Core Outpost',
    description: 'Underground industrial facility. Unstable heat zones.',
    theme: {
        background: '#2a0a0a',
        floorColor: '#451a03',
        wallColor: '#7f1d1d',
        wallBorder: '#991b1b',
        floorPattern: 'radial-gradient(circle, #571e06 1px, transparent 1px)',
        doorColor: '#f97316',
        accentColor: '#dc2626',
        hazardColor: '#ef4444'
    },
    spawnPoint: { x: 800, y: 800 },
    objects: [
        // Upper Drill
        ...createRoom('drill', 600, 600, 400, 400, '#450a0a'),
        // Core (South)
        ...createRoom('core', 600, 1100, 400, 400, '#7f1d1d'),
        // Refining (East)
        ...createRoom('refining', 1100, 600, 300, 900, '#57534e'),
        
        // Connectors
        { id: 'h_main', type: 'floor', x: 900, y: 1000, width: 300, height: 100, color: '#292524' },
        
        // Hazards (Lava pools)
        { id: 'hz_1', type: 'hazard', x: 650, y: 1300, width: 100, height: 100 },
        
        // Vents
        { id: 'v_1', type: 'vent', x: 620, y: 620, width: 40, height: 40, connectedVents: ['v_2'] },
        { id: 'v_2', type: 'vent', x: 1300, y: 1400, width: 40, height: 40, connectedVents: ['v_1'] },
        
         // Tasks
        { id: 't_m_1', type: 'task_location', taskType: 'calibrate_distributor', x: 700, y: 700, width: 40, height: 40 },
        { id: 't_m_2', type: 'task_location', taskType: 'fuel_engines', x: 1200, y: 800, width: 40, height: 40 },
    ]
};
