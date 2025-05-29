import * as THREE from 'three';

// Memory/interaction types
export interface Memory {
  object: THREE.Object3D;
  text: string;
  triggered: boolean;
  audio?: string;
  animation?: () => void;
  highlight?: boolean;
}

// Scene metadata
export interface SceneMetadata {
  name: string;
  description: string;
  nextScene?: string;
  previousScene?: string;
}

// Character customization
export interface CharacterOptions {
  hairColor?: number;
  outfitColor?: number;
  skinTone?: number;
  accessories?: string[];
}

// Dialogue options
export interface DialogueOptions {
  duration?: number;
  emotion?: 'happy' | 'sad' | 'nostalgic' | 'excited';
  position?: 'bottom' | 'top' | 'center';
}

// Interaction event
export interface InteractionEvent {
  object: THREE.Object3D;
  point: THREE.Vector3;
  memory?: Memory;
} 