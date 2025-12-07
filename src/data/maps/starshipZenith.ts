import { MapDefinition, MapObject } from '../../types';

// Creates walls with gaps for doors to prevent physics collision issues
const createRoomWithGaps = (id: string, x: number, y: number, w: number, h: number, doors: {side: 'top'|'bottom'|'left'|'right', pos: number, size: number}[]): MapObject[] => {
    const t = 20; // Wall Thickness
    const walls: MapObject[] = [];
    
    // Top Wall
    const topDoor = doors.find(d => d.side === 'top');
    if (topDoor) {
        walls.push({ id: `w_${id}_t1`, type: 'wall', x: x - t, y: y - t, width: (topDoor.pos - x) + t, height: t });
        walls.push({ id: `w_${id}_t2`, type: 'wall', x: topDoor.pos + topDoor.size, y: y - t, width: (x + w) - (topDoor.pos + topDoor.size) + t, height: t });
    } else {
        walls.push({ id: `w_${id}_t`, type: 'wall', x: x - t, y: y - t, width: w + t*2, height: t });
    }

    // Bottom Wall
    const bottomDoor = doors.find(d => d.side === 'bottom');
    if (bottomDoor) {
        walls.push({ id: `w_${id}_b1`, type: 'wall', x: x - t, y: y + h, width: (bottomDoor.pos - x) + t, height: t });
        walls.push({ id: `w_${id}_b2`, type: 'wall', x: bottomDoor.pos + bottomDoor.size, y: y + h, width: (x + w) - (bottomDoor.pos + bottomDoor.size) + t, height: t });
    } else {
        walls.push({ id: `w_${id}_b`, type: 'wall', x: x - t, y: y + h, width: w + t*2, height: t });
    }

    // Left Wall
    const leftDoor = doors.find(d => d.side === 'left');
    if (leftDoor) {
        walls.push({ id: `w_${id}_l1`, type: 'wall', x: x - t, y: y, width: t, height: (leftDoor.pos - y) });
        walls.push({ id: `w_${id}_l2`, type: 'wall', x: x - t, y: leftDoor.pos + leftDoor.size, width: t, height: (y + h) - (leftDoor.pos + leftDoor.size) });
    } else {
        walls.push({ id: `w_${id}_l`, type: 'wall', x: x - t, y: y, width: t, height: h });
    }

    // Right Wall
    const rightDoor = doors.find(d => d.side === 'right');
    if (rightDoor) {
        walls.push({ id: `w_${id}_r1`, type: 'wall', x: x + w, y: y, width: t, height: (rightDoor.pos - y) });
        walls.push({ id: `w_${id}_r2`, type: 'wall', x: x + w, y: rightDoor.pos + rightDoor.size, width: t, height: (y + h) - (rightDoor.pos + rightDoor.size) });
    } else {
        walls.push({ id: `w_${id}_r`, type: 'wall', x: x + w, y: y, width: t, height: h });
    }

    // Floor
    walls.push({ id: `fl_${id}`, type: 'floor', x, y, width: w, height: h, roomId: id });

    return walls;
};

const createProp = (type: 'desk' | 'bed' | 'engine' | 'crate' | 'monitor', x: number, y: number, w: number, h: number, rotation: number = 0): MapObject => ({
    id: `p_${Math.random()}`, type: 'prop', propType: type, x, y, width: w, height: h, rotation
});

export const STARSHIP_ZENITH: MapDefinition = {
    id: 'zenith',
    name: 'Orbital Station Zenith',
    description: 'High-tech hub with glass floors and gravity lifts.',
    theme: {
        background: '#02040a',
        floorColor: '#1e293b',
        floorPattern: 'radial-gradient(circle, #334155 1px, transparent 1px)',
        wallColor: '#475569',
        wallBorder: '#64748b',
        doorColor: '#0ea5e9',
        accentColor: '#0ea5e9'
    },
    spawnPoint: { x: 1200, y: 1300 }, // Safe open area in Command Hub
    objects: [
        // --- COMMAND HUB (Center) ---
        // Doors: Top, Right, Bottom, Left
        ...createRoomWithGaps('command', 1000, 1000, 400, 400, [
            { side: 'top', pos: 1150, size: 100 },
            { side: 'bottom', pos: 1150, size: 100 },
            { side: 'left', pos: 1150, size: 100 },
            { side: 'right', pos: 1150, size: 100 }
        ]),
        createProp('desk', 1150, 1100, 100, 80), // North of center
        createProp('monitor', 1020, 1020, 60, 20),
        createProp('monitor', 1320, 1020, 60, 20),
        createProp('monitor', 1020, 1360, 60, 20),

        // --- MEDBAY (North) ---
        // Door at Bottom
        ...createRoomWithGaps('medbay', 1000, 600, 400, 300, [
             { side: 'bottom', pos: 1150, size: 100 }
        ]),
        createProp('bed', 1050, 620, 50, 80),
        createProp('bed', 1150, 620, 50, 80),
        createProp('bed', 1250, 620, 50, 80),
        createProp('desk', 1320, 800, 60, 60),

        // --- ENGINEERING (East) ---
        // Door at Left
        ...createRoomWithGaps('engineering', 1500, 1000, 300, 400, [
            { side: 'left', pos: 1150, size: 100 }
        ]),
        // MOVED ENGINE UP TO CLEAR DOORWAY
        createProp('engine', 1600, 1020, 100, 100),
        createProp('crate', 1700, 1050, 40, 40),
        createProp('crate', 1700, 1300, 40, 40),

        // --- CARGO (South) ---
        // Door at Top
        ...createRoomWithGaps('cargo', 1000, 1500, 400, 300, [
             { side: 'top', pos: 1150, size: 100 }
        ]),
        createProp('crate', 1050, 1550, 60, 60),
        createProp('crate', 1150, 1600, 60, 60),
        createProp('crate', 1250, 1550, 60, 60),

        // --- QUARTERS (West) ---
        // Door at Right
        ...createRoomWithGaps('quarters', 600, 1000, 300, 400, [
            { side: 'right', pos: 1150, size: 100 }
        ]),
        createProp('bed', 620, 1050, 50, 80),
        createProp('bed', 620, 1250, 50, 80),
        createProp('desk', 800, 1050, 40, 80),

        // --- HALLWAYS ---
        // North Hallway
        { id: 'f_h_n', type: 'floor', x: 1150, y: 900, width: 100, height: 100 },
        { id: 'w_h_n_l', type: 'wall', x: 1130, y: 900, width: 20, height: 100 },
        { id: 'w_h_n_r', type: 'wall', x: 1250, y: 900, width: 20, height: 100 },
        
        // East Hallway
        { id: 'f_h_e', type: 'floor', x: 1400, y: 1150, width: 100, height: 100 },
        { id: 'w_h_e_t', type: 'wall', x: 1400, y: 1130, width: 100, height: 20 },
        { id: 'w_h_e_b', type: 'wall', x: 1400, y: 1250, width: 100, height: 20 },
        
        // South Hallway
        { id: 'f_h_s', type: 'floor', x: 1150, y: 1400, width: 100, height: 100 },
        { id: 'w_h_s_l', type: 'wall', x: 1130, y: 1400, width: 20, height: 100 },
        { id: 'w_h_s_r', type: 'wall', x: 1250, y: 1400, width: 20, height: 100 },
        
        // West Hallway
        { id: 'f_h_w', type: 'floor', x: 900, y: 1150, width: 100, height: 100 },
        { id: 'w_h_w_t', type: 'wall', x: 900, y: 1130, width: 100, height: 20 },
        { id: 'w_h_w_b', type: 'wall', x: 900, y: 1250, width: 100, height: 20 },

        // --- DOORS ---
        { id: 'd_n', type: 'door', x: 1150, y: 980, width: 100, height: 20, isOpen: true },
        { id: 'd_e', type: 'door', x: 1400, y: 1150, width: 20, height: 100, isOpen: true },
        { id: 'd_s', type: 'door', x: 1150, y: 1400, width: 100, height: 20, isOpen: true },
        { id: 'd_w', type: 'door', x: 980, y: 1150, width: 20, height: 100, isOpen: true },

        // --- VENTS ---
        { id: 'v_med', type: 'vent', x: 1350, y: 650, width: 40, height: 40, connectedVents: ['v_eng', 'v_quart'] },
        { id: 'v_eng', type: 'vent', x: 1750, y: 1350, width: 40, height: 40, connectedVents: ['v_med', 'v_cargo'] },
        { id: 'v_cargo', type: 'vent', x: 1350, y: 1750, width: 40, height: 40, connectedVents: ['v_eng', 'v_quart'] },
        { id: 'v_quart', type: 'vent', x: 650, y: 1350, width: 40, height: 40, connectedVents: ['v_med', 'v_cargo'] },

        // --- TASKS ---
        { id: 't_upload', type: 'task_location', taskType: 'upload_data', x: 1180, y: 1200, width: 40, height: 40 },
        { id: 't_wires', type: 'task_location', taskType: 'fix_wiring', x: 1750, y: 1200, width: 40, height: 40 },
        { id: 't_scan', type: 'task_location', taskType: 'scan_sample', x: 1100, y: 650, width: 40, height: 40 },
        { id: 't_fuel', type: 'task_location', taskType: 'fuel_engines', x: 1200, y: 1700, width: 40, height: 40 },
        { id: 't_fuse', type: 'task_location', taskType: 'align_fuse', x: 1650, y: 1150, width: 40, height: 40 },
        { id: 't_mix', type: 'task_location', taskType: 'mix_chemical', x: 1330, y: 850, width: 40, height: 40 },
        { id: 't_grav', type: 'task_location', taskType: 'stabilize_gravity', x: 1030, y: 1370, width: 40, height: 40 },
        { id: 't_lock', type: 'task_location', taskType: 'unlock_manifold', x: 910, y: 1180, width: 40, height: 40 },

        // --- SABOTAGE REPAIR STATIONS ---
        // Lights (Quarters - Electrical Panel)
        { id: 'sys_lights', type: 'system', taskType: 'fix_lights', x: 650, y: 1020, width: 40, height: 40 },
        // Reactor (Engineering - Top and Bot)
        { id: 'sys_reac_1', type: 'system', taskType: 'fix_reactor', x: 1520, y: 1020, width: 40, height: 40 },
        { id: 'sys_reac_2', type: 'system', taskType: 'fix_reactor', x: 1520, y: 1350, width: 40, height: 40 },
        // Oxygen (Medbay and Cargo)
        { id: 'sys_oxy_1', type: 'system', taskType: 'fix_oxygen', x: 1200, y: 600, width: 40, height: 40 },
        { id: 'sys_oxy_2', type: 'system', taskType: 'fix_oxygen', x: 1350, y: 1550, width: 40, height: 40 },
        // Comms (Command)
        { id: 'sys_comms', type: 'system', taskType: 'fix_comms', x: 1100, y: 1100, width: 40, height: 40 },

        // --- EMERGENCY MEETING BUTTON ---
        { id: 'emergency_btn', type: 'system', taskType: 'emergency_button', x: 1180, y: 1020, width: 40, height: 40 }
    ]
};