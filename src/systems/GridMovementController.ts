import * as THREE from 'three';

export type Direction = 'forward' | 'backward' | 'left' | 'right';

export interface GridPosition {
  x: number;
  z: number;
}

export class GridMovementController {
  // Grid settings
  private gridSize: number = 2; // Size of each grid square
  private gridPosition: GridPosition = { x: 0, z: 0 };
  private visualPosition: THREE.Vector3 = new THREE.Vector3();
  
  // Movement state
  private movementQueue: Direction[] = [];
  private maxQueueSize: number = 3;
  private isMoving: boolean = false;
  
  // Animation settings
  private moveDuration: number = 0.25; // seconds
  private moveTimer: number = 0;
  private startPosition: THREE.Vector3 = new THREE.Vector3();
  private targetPosition: THREE.Vector3 = new THREE.Vector3();
  private hopHeight: number = 0.3;
  
  // Character reference
  private character: THREE.Group | null = null;
  private targetRotation: number = 0;
  private currentDirection: Direction | null = null;
  
  // Input handling
  private keys: Set<string> = new Set();
  private keyPressed: Map<string, boolean> = new Map();

  constructor() {
    this.setupControls();
  }

  setCharacter(character: THREE.Group): void {
    this.character = character;
    this.updateCharacterPosition();
  }

  private setupControls(): void {
    window.addEventListener('keydown', (e) => {
      const key = e.key.toLowerCase();
      
      // Prevent key repeat
      if (this.keyPressed.get(key)) return;
      this.keyPressed.set(key, true);
      
      // Queue moves based on key press
      if ((key === 'w' || key === 'arrowup') && this.canQueueMove()) {
        this.queueMove('forward');
      } else if ((key === 's' || key === 'arrowdown') && this.canQueueMove()) {
        this.queueMove('backward');
      } else if ((key === 'a' || key === 'arrowleft') && this.canQueueMove()) {
        this.queueMove('left');
      } else if ((key === 'd' || key === 'arrowright') && this.canQueueMove()) {
        this.queueMove('right');
      }
    });

    window.addEventListener('keyup', (e) => {
      const key = e.key.toLowerCase();
      this.keyPressed.set(key, false);
    });
  }

  private canQueueMove(): boolean {
    return this.movementQueue.length < this.maxQueueSize;
  }

  queueMove(direction: Direction): void {
    if (!this.canQueueMove()) return;
    
    // For now, we'll add all moves. Later we can add validation
    this.movementQueue.push(direction);
  }

  update(deltaTime: number): void {
    if (!this.character) return;

    // Process movement queue
    if (!this.isMoving && this.movementQueue.length > 0) {
      this.startMove(this.movementQueue.shift()!);
    }

    // Animate current move
    if (this.isMoving) {
      this.animateMove(deltaTime);
    }

    // Smooth rotation
    if (this.character.rotation.y !== this.targetRotation) {
      const rotationSpeed = 10; // radians per second
      const diff = this.targetRotation - this.character.rotation.y;
      
      // Handle wrapping around PI/-PI
      let shortestDiff = diff;
      if (Math.abs(diff) > Math.PI) {
        shortestDiff = diff > 0 ? diff - 2 * Math.PI : diff + 2 * Math.PI;
      }
      
      const maxRotation = rotationSpeed * deltaTime;
      if (Math.abs(shortestDiff) < maxRotation) {
        this.character.rotation.y = this.targetRotation;
      } else {
        this.character.rotation.y += Math.sign(shortestDiff) * maxRotation;
      }
    }
  }

  private startMove(direction: Direction): void {
    this.isMoving = true;
    this.moveTimer = 0;
    this.currentDirection = direction;
    
    // Store start position
    this.startPosition.copy(this.visualPosition);
    
    // Calculate target grid position
    const newGridPos = { ...this.gridPosition };
    switch (direction) {
      case 'forward':
        newGridPos.z -= 1;
        this.targetRotation = Math.PI; // Face negative Z
        break;
      case 'backward':
        newGridPos.z += 1;
        this.targetRotation = 0; // Face positive Z
        break;
      case 'left':
        newGridPos.x -= 1;
        this.targetRotation = -Math.PI / 2; // Face left (negative X)
        break;
      case 'right':
        newGridPos.x += 1;
        this.targetRotation = Math.PI / 2; // Face right (positive X)
        break;
    }
    
    // Update grid position immediately (for game logic)
    this.gridPosition = newGridPos;
    
    // Set target visual position
    this.targetPosition.set(
      this.gridPosition.x * this.gridSize,
      0,
      this.gridPosition.z * this.gridSize
    );
  }

  private animateMove(deltaTime: number): void {
    if (!this.character) return;
    
    this.moveTimer += deltaTime;
    const progress = Math.min(1, this.moveTimer / this.moveDuration);
    
    // Smooth step function for more natural movement
    const smoothProgress = this.smoothStep(progress);
    
    // Interpolate position
    this.visualPosition.lerpVectors(this.startPosition, this.targetPosition, smoothProgress);
    
    // Add hop animation
    const hopProgress = Math.sin(progress * Math.PI);
    const hopOffset = hopProgress * this.hopHeight;
    
    // Update character position
    this.character.position.x = this.visualPosition.x;
    this.character.position.y = hopOffset;
    this.character.position.z = this.visualPosition.z;
    
    // Check if move is complete
    if (progress >= 1) {
      this.isMoving = false;
      this.character.position.y = 0; // Ensure we land exactly at y=0
      
      // Dispatch event for other systems
      window.dispatchEvent(new CustomEvent('gridMoveComplete', {
        detail: {
          position: this.gridPosition,
          direction: this.currentDirection
        }
      }));
    }
  }

  private smoothStep(t: number): number {
    // Smooth step function for more natural movement
    return t * t * (3 - 2 * t);
  }

  private updateCharacterPosition(): void {
    if (!this.character) return;
    
    this.visualPosition.set(
      this.gridPosition.x * this.gridSize,
      0,
      this.gridPosition.z * this.gridSize
    );
    
    this.character.position.copy(this.visualPosition);
  }

  // Public getters
  getGridPosition(): GridPosition {
    return { ...this.gridPosition };
  }

  getWorldPosition(): THREE.Vector3 {
    return new THREE.Vector3(
      this.gridPosition.x * this.gridSize,
      0,
      this.gridPosition.z * this.gridSize
    );
  }

  // Get the current visual position without hop animation (for camera)
  getSmoothWorldPosition(): THREE.Vector3 {
    return this.visualPosition.clone();
  }

  isCurrentlyMoving(): boolean {
    return this.isMoving;
  }

  setGridPosition(x: number, z: number): void {
    this.gridPosition = { x, z };
    this.updateCharacterPosition();
  }

  // For debugging
  getQueueLength(): number {
    return this.movementQueue.length;
  }
} 