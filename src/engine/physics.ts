
import { MapObject, Vector2 } from '../types';

export const checkAABB = (
  x: number, y: number, w: number, h: number, 
  objX: number, objY: number, objW: number, objH: number
): boolean => {
  return (
    x < objX + objW &&
    x + w > objX &&
    y < objY + objH &&
    y + h > objY
  );
};

// Returns a new position that is valid (slides along walls)
export const resolveMovement = (
  currentPos: Vector2, 
  delta: Vector2, 
  mapObjects: MapObject[]
): Vector2 => {
  // Use a hitbox slightly smaller than visual size to prevent getting stuck on corners
  const hitboxSize = 24; 
  const offset = hitboxSize / 2;
  
  let nextX = currentPos.x + delta.x;
  let nextY = currentPos.y + delta.y;

  // Check X axis first
  let hitX = false;
  for (const obj of mapObjects) {
    if ((obj.type === 'wall' || (obj.type === 'door' && !obj.isOpen)) || obj.type === 'prop') {
      if (checkAABB(nextX - offset, currentPos.y - offset, hitboxSize, hitboxSize, obj.x, obj.y, obj.width, obj.height)) {
        hitX = true;
        break;
      }
    }
  }

  // Check Y axis independently
  let hitY = false;
  for (const obj of mapObjects) {
    if ((obj.type === 'wall' || (obj.type === 'door' && !obj.isOpen)) || obj.type === 'prop') {
      if (checkAABB(currentPos.x - offset, nextY - offset, hitboxSize, hitboxSize, obj.x, obj.y, obj.width, obj.height)) {
        hitY = true;
        break;
      }
    }
  }

  return {
    x: hitX ? currentPos.x : nextX,
    y: hitY ? currentPos.y : nextY
  };
};
