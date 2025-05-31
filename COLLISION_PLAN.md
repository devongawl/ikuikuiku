# Collision System Implementation Plan

## Overview
Implement a robust collision detection system that prevents walking through walls/objects while allowing special interactions with interactive elements.

## Architecture

### 1. Collision System Components

#### A. CollisionManager
```typescript
class CollisionManager {
  private colliders: Map<string, Collider>;
  private interactables: Map<string, InteractableCollider>;
  
  // Check if movement is valid
  canMoveTo(from: GridPosition, to: GridPosition): boolean;
  
  // Check for interactive object at position
  getInteractableAt(position: GridPosition): InteractableCollider | null;
  
  // Register colliders from scene
  registerSceneColliders(scene: Scene): void;
}
```

#### B. Collider Types
```typescript
interface Collider {
  bounds: BoundingBox;
  type: 'static' | 'interactable';
  gridPositions: GridPosition[]; // Grid cells occupied
}

interface InteractableCollider extends Collider {
  interactionType: 'bed' | 'door' | 'elevator' | 'memory';
  onInteract: (controller: GridMovementController) => void;
  interactionDistance?: number;
}

interface BoundingBox {
  min: THREE.Vector3;
  max: THREE.Vector3;
}
```

### 2. Grid-Based Collision Map

Since movement is grid-based, we'll use a 2D collision map:

```typescript
class CollisionGrid {
  private grid: Map<string, CollisionCell>;
  
  // Mark grid cells as occupied
  addCollider(gridX: number, gridZ: number, collider: Collider): void;
  
  // Check if grid cell is walkable
  isWalkable(gridX: number, gridZ: number): boolean;
  
  // Get collider at grid position
  getColliderAt(gridX: number, gridZ: number): Collider | null;
}
```

## Implementation Steps

### Phase 1: Basic Collision Detection

1. **Create CollisionManager Class**
   - File: `src/systems/CollisionManager.ts`
   - Manages all collision checks
   - Integrates with GridMovementController

2. **Update GridMovementController**
   - Add collision checking before movement
   - Prevent queuing moves to blocked positions
   - Handle special interactions

3. **Define Scene Colliders**
   - Add collision data to walls in `createWalls()`
   - Add collision data to furniture (bed, tables, etc.)
   - Mark door positions as special interactables

### Phase 2: Collision Data Structure

```typescript
// In ApartmentScene.ts
private defineCollisions(): void {
  const collisionManager = this.getCollisionManager();
  
  // Walls
  this.walls.forEach(wall => {
    collisionManager.addStaticCollider({
      object: wall,
      gridCells: this.calculateGridCells(wall)
    });
  });
  
  // Bed - Special interactable
  collisionManager.addInteractableCollider({
    object: this.bed,
    gridCells: [{x: -3, z: 0}],
    interactionType: 'bed',
    onInteract: (controller) => {
      controller.setInBed(true);
    }
  });
  
  // Exit door - Special interactable
  collisionManager.addInteractableCollider({
    object: this.exitDoor,
    gridCells: [{x: 3, z: 4}],
    interactionType: 'door',
    onInteract: (controller) => {
      // Trigger scene transition
      window.dispatchEvent(new CustomEvent('sceneTransition', {
        detail: { nextScene: 'office-building' }
      }));
    }
  });
}
```

### Phase 3: Movement Integration

Update `GridMovementController.startMove()`:

```typescript
private startMove(direction: Direction): void {
  // Calculate target position
  const targetPos = this.calculateTargetPosition(direction);
  
  // Check collision
  if (!this.collisionManager.canMoveTo(this.gridPosition, targetPos)) {
    // Check if it's an interactable
    const interactable = this.collisionManager.getInteractableAt(targetPos);
    if (interactable) {
      interactable.onInteract(this);
    }
    return; // Block movement
  }
  
  // Continue with normal movement...
}
```

### Phase 4: Visual Feedback

1. **Debug Visualization** (optional)
   - Show collision grid overlay
   - Highlight blocked cells in red
   - Highlight interactables in blue

2. **Player Feedback**
   - Play bump sound when hitting wall
   - Show interaction prompt for interactables
   - Visual indicator when near interactable

## Special Interaction Cases

### 1. Bed Interaction
- **Trigger**: Moving onto bed grid position
- **Action**: Start bed animation, prevent further movement
- **Exit**: Any movement input triggers get-up animation

### 2. Door Interaction  
- **Trigger**: Moving into door position
- **Action**: Show interaction prompt, trigger on confirmation
- **Result**: Scene transition with fade effect

### 3. Memory Objects
- **Trigger**: Adjacent to object (not on it)
- **Action**: Highlight object, show memory on click
- **Range**: 1 grid cell distance

### 4. Elevator (Future)
- **Trigger**: Enter elevator grid cell
- **Action**: Show floor selection UI
- **Result**: Transition to selected floor

## Technical Considerations

1. **Performance**
   - Pre-calculate grid occupancy on scene load
   - Use spatial hashing for quick lookups
   - Cache collision results per frame

2. **Edge Cases**
   - Diagonal movement blocked by corners
   - Multi-cell objects (large furniture)
   - Dynamic objects (NPCs in future)

3. **Debugging**
   - Collision grid visualizer
   - Console commands to toggle collisions
   - Performance metrics

## File Structure
```
src/systems/
├── CollisionManager.ts      # Main collision system
├── CollisionGrid.ts         # Grid-based collision map
├── Collider.ts             # Collider interfaces/types
└── InteractionSystem.ts    # Update for new interactions

src/scenes/
└── Scene.ts                # Add collision registration method
```

## Testing Plan

1. **Unit Tests**
   - Grid cell calculations
   - Collision detection logic
   - Interaction triggers

2. **Integration Tests**
   - Movement + collision
   - Scene transitions
   - Special interactions

3. **Manual Testing**
   - Try to walk through all walls
   - Test all interactables
   - Check performance with many colliders 