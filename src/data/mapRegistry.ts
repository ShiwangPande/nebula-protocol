
import { MapDefinition } from '../types';
import { STARSHIP_ZENITH } from './maps/starshipZenith';
import { MAGMA_CORE } from './maps/magmaCore';
import { GLACIAL_DOME } from './maps/glacialDome';

export const MAP_REGISTRY: Record<string, MapDefinition> = {
    [STARSHIP_ZENITH.id]: STARSHIP_ZENITH,
    [MAGMA_CORE.id]: MAGMA_CORE,
    [GLACIAL_DOME.id]: GLACIAL_DOME
};

export const DEFAULT_MAP_ID = STARSHIP_ZENITH.id;
