import { GridPosition } from './GridMovementController';

export interface Collider {
  type: 'static' | 'interactable';
  gridPositions: GridPosition[];
  name?: string;
}

export interface InteractableCollider extends Collider {
  type: 'interactable';
  interactionType: 'bed' | 'door' | 'elevator' | 'memory';
  onInteract?: (position: GridPosition) => void;
}

export class CollisionManager {
  private staticColliders: Map<string, Collider> = new Map();
  private interactableColliders: Map<string, InteractableCollider> = new Map();
  private gridMap: Map<string, Collider> = new Map();

  constructor() {
    console.log('CollisionManager initialized');
  }

  // Convert grid position to map key
  private getGridKey(x: number, z: number): string {
    return `${Math.round(x)},${Math.round(z)}`;
  }

  // Add a static collider (walls, furniture)
  addStaticCollider(collider: Collider): void {
    const id = `static_${this.staticColliders.size}`;
    this.staticColliders.set(id, collider);
    
    // Add to grid map for fast lookup
    collider.gridPositions.forEach(pos => {
      const key = this.getGridKey(pos.x, pos.z);
      this.gridMap.set(key, collider);
    });
    
    console.log(`Added static collider: ${collider.name || id} at positions:`, collider.gridPositions);
  }

  // Add an interactable collider (bed, door, etc)
  addInteractableCollider(collider: InteractableCollider): void {
    const id = `interactable_${this.interactableColliders.size}`;
    this.interactableColliders.set(id, collider);
    
    // Add to grid map
    collider.gridPositions.forEach(pos => {
      const key = this.getGridKey(pos.x, pos.z);
      this.gridMap.set(key, collider);
    });
    
    console.log(`Added interactable collider: ${collider.name || id} at positions:`, collider.gridPositions);
  }

  // Check if a position is walkable
  isWalkable(gridX: number, gridZ: number): boolean {
    const key = this.getGridKey(gridX, gridZ);
    const collider = this.gridMap.get(key);
    
    console.log(`Checking walkable for (${gridX}, ${gridZ}) -> key: ${key}, has collider: ${!!collider}`);
    
    // If no collider, it's walkable
    if (!collider) return true;
    
    console.log(`Blocked by: ${collider.name || 'unknown'} (type: ${collider.type})`);
    
    // Static colliders block movement
    if (collider.type === 'static') return false;
    
    // Interactable colliders may or may not block (for now, all block)
    return false;
  }

  // Check if movement from one position to another is valid
  canMoveTo(from: GridPosition, to: GridPosition): boolean {
    const canMove = this.isWalkable(to.x, to.z);
    console.log(`canMoveTo from (${from.x}, ${from.z}) to (${to.x}, ${to.z}): ${canMove}`);
    return canMove;
  }

  // Get collider at a specific position
  getColliderAt(gridX: number, gridZ: number): Collider | null {
    const key = this.getGridKey(gridX, gridZ);
    return this.gridMap.get(key) || null;
  }

  // Get interactable at a specific position
  getInteractableAt(gridX: number, gridZ: number): InteractableCollider | null {
    const collider = this.getColliderAt(gridX, gridZ);
    if (collider && collider.type === 'interactable') {
      return collider as InteractableCollider;
    }
    return null;
  }

  // Clear all colliders (useful when changing scenes)
  clear(): void {
    this.staticColliders.clear();
    this.interactableColliders.clear();
    this.gridMap.clear();
    console.log('CollisionManager cleared');
  }

  // Debug: Get all occupied positions
  getOccupiedPositions(): GridPosition[] {
    const positions: GridPosition[] = [];
    this.gridMap.forEach((collider, key) => {
      const [x, z] = key.split(',').map(Number);
      positions.push({ x, z });
    });
    return positions;
  }
} 