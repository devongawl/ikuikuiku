# Grid-Based Movement Action Plan

## Overview
Transform the current continuous movement system to a grid-based movement system similar to Crossy Road, where each key press moves the character one grid unit.

## Key Concepts from Crossy Road
1. **Grid System**: Fixed tile size (we'll use 1 unit for simplicity)
2. **Movement Queue**: Buffer moves to prevent spam and ensure smooth animations
3. **Animated Transitions**: Smooth interpolation between grid positions
4. **Movement Validation**: Check if moves are valid before executing

## Implementation Steps

### 1. Create Grid Movement Controller
**File**: `src/systems/GridMovementController.ts`
- Replace the current continuous movement in `KenneyCharacterController.ts`
- Key features:
  - Grid position tracking (x, z coordinates)
  - Movement queue system
  - Animation state management
  - Movement validation

### 2. Grid Movement Features
- **Position State**:
  - `gridPosition: { x: number, z: number }`
  - `targetPosition: { x: number, z: number }`
  - `isMoving: boolean`
  
- **Movement Queue**:
  - `movementQueue: Direction[]`
  - Maximum queue size (e.g., 3 moves)
  - Process one move at a time
  
- **Animation**:
  - Move duration: 0.2-0.3 seconds
  - Smooth position interpolation
  - "Hop" animation (slight Y-axis bounce)
  - Character rotation to face direction

### 3. Input Handling Changes
- Remove continuous movement logic
- Each key press adds one move to the queue
- Directions: forward (W/↑), back (S/↓), left (A/←), right (D/→)
- Ignore input if queue is full

### 4. Movement Validation
- Check scene boundaries
- Check for obstacles (buildings, objects)
- Prevent moving into invalid positions

### 5. Camera Adjustments
- Camera should smoothly follow grid position
- Maintain current zoom controls
- Update camera target to use grid position

### 6. Scene Integration
- Update scenes to work with grid-based movement
- Ensure interactive objects align with grid
- Memory triggers based on grid position

## Implementation Order
1. Create new `GridMovementController.ts`
2. Update `KenneyCharacterController.ts` to extend/use grid movement
3. Update `index.ts` to use new movement system
4. Test and adjust movement parameters
5. Update scenes for grid alignment if needed

## Benefits
- More precise control
- Better suited for puzzle/exploration gameplay
- Easier to implement collision detection
- Clear, predictable movement
- Nostalgic feel similar to classic games 