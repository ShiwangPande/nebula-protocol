
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

export const GLACIAL_DOME: MapDefinition = {
    id: 'glacial',
    name: 'Glacial Dome Zero',
    description: 'Frozen research station. Stay warm.',
    theme: {
        background: '#f0f9ff',
        floorColor: '#bae6fd',
        wallColor: '#0ea5e9',
        wallBorder: '#0284c7',
        floorPattern: 'radial-gradient(circle, #7dd3fc 1px, transparent 1px)',
        doorColor: '#7dd3fc',
        accentColor: '#38bdf8'
    },
    spawnPoint: { x: 1000, y: 1000 },
    objects: [
        // Dome A
        ...createRoom('dome_a', 800, 800, 400, 400, '#e0f2fe'),
        // Dome B
        ...createRoom('dome_b', 1300, 800, 400, 400, '#e0f2fe'),
        
        // Tunnel
        { id: 'tun_1', type: 'floor', x: 1200, y: 950, width: 100, height: 100, color: '#f0f9ff' },
        
        // Vents
        { id: 'v_g1', type: 'vent', x: 850, y: 850, width: 40, height: 40, connectedVents: ['v_g2'] },
        { id: 'v_g2', type: 'vent', x: 1600, y: 1100, width: 40, height: 40, connectedVents: ['v_g1'] },

        // Tasks
        { id: 't_g_1', type: 'task_location', taskType: 'scan_sample', x: 900, y: 1000, width: 40, height: 40 },
        { id: 't_g_2', type: 'task_location', taskType: 'upload_data', x: 1500, y: 1000, width: 40, height: 40 },
    ]
};
