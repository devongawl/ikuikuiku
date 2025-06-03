import * as THREE from 'three';
import { CollisionManager } from './CollisionManager';

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
  private _isMoving: boolean = false;
  
  // Animation settings
  private moveDuration: number = 0.25; // seconds
  private moveTimer: number = 0;
  private startPosition: THREE.Vector3 = new THREE.Vector3();
  private targetPosition: THREE.Vector3 = new THREE.Vector3();
  private hopHeight: number = 0.3;
  
  // Bump animation for blocked movement
  private _isBumping: boolean = false;
  private bumpDuration: number = 0.2; // shorter than normal movement
  private bumpTimer: number = 0;
  private bumpDirection: THREE.Vector3 = new THREE.Vector3();
  private bumpStartPosition: THREE.Vector3 = new THREE.Vector3();
  private bumpDistance: number = 0.3; // how far to lunge before bouncing back
  
  // Character reference
  private character: THREE.Group | null = null;
  private targetRotation: number = 0;
  private currentDirection: Direction | null = null;
  
  // Input handling
  private keys: Set<string> = new Set();
  private keyPressed: Map<string, boolean> = new Map();

  // Bed state
  private isInBed: boolean = false;
  private bedPosition: GridPosition | null = null;
  private normalYPosition: number = 0;
  private bedYPosition: number = 1.6; // Height when laying on bed (higher above mattress)
  private bedTransition: number = 0; // 0 = standing, 1 = laying
  private bedTransitionSpeed: number = 2; // transitions per second (slower for smoother look)

  // Collision manager
  private collisionManager: CollisionManager | null = null;

  constructor() {
    this.setupControls();
  }

  setCharacter(character: THREE.Group): void {
    this.character = character;
    this.normalYPosition = character.position.y;
    this.updateCharacterPosition();
  }

  setBedPosition(x: number, z: number): void {
    this.bedPosition = { x, z };
  }

  clearBedPosition(): void {
    this.bedPosition = null;
    // Also ensure we're not in bed when clearing the position
    this.setInBed(false);
  }

  setInBed(inBed: boolean): void {
    this.isInBed = inBed;
    // Transition will be handled in update
  }

  setCollisionManager(collisionManager: CollisionManager): void {
    this.collisionManager = collisionManager;
    console.log('CollisionManager set in GridMovementController');
    console.log('Current grid position:', this.gridPosition);
  }

  private setupControls(): void {
    window.addEventListener('keydown', (e) => {
      const key = e.key.toLowerCase();
      
      // Prevent key repeat
      if (this.keyPressed.get(key)) return;
      this.keyPressed.set(key, true);
      
      // Debug: check if collision manager is set
      if (!this.collisionManager) {
        console.warn('CollisionManager not set! Movement will not be blocked.');
      }
      
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
    
    // Don't queue moves while bumping
    if (this._isBumping) return;
    
    // If we're in bed and this is the first move, add a small delay
    if (this.isInBed && this.movementQueue.length === 0) {
      // Queue the move but it will wait for the get-up animation
      this.movementQueue.push(direction);
      this.setInBed(false); // Start getting up immediately
    } else {
      // Normal move queueing
      this.movementQueue.push(direction);
    }
  }

  update(deltaTime: number): void {
    if (!this.character) return;

    // Handle bed transition animation
    const targetBedTransition = this.isInBed ? 1 : 0;
    if (this.bedTransition !== targetBedTransition) {
      const transitionDelta = this.bedTransitionSpeed * deltaTime;
      if (this.bedTransition < targetBedTransition) {
        this.bedTransition = Math.min(1, this.bedTransition + transitionDelta);
      } else {
        this.bedTransition = Math.max(0, this.bedTransition - transitionDelta);
      }
      
      // Create smooth arc transition to avoid clipping
      const smoothTransition = this.smoothStep(this.bedTransition);
      
      // Apply X rotation (laying flat) - positive X rotation tips the character backward
      this.character.rotation.x = (-Math.PI / 2) * smoothTransition;
      
      // Reset Z rotation to prevent upside-down issues
      this.character.rotation.z = 0;
      
      // Create arc motion for Y position to prevent clipping
      let yOffset = 0;
      
      if (this.isInBed) {
        // Getting into bed: simple arc motion
        const arcProgress = Math.sin(this.bedTransition * Math.PI);
        const arcHeight = 0.4; // Height of the arc
        const finalHeight = this.bedYPosition - this.normalYPosition;
        yOffset = arcProgress * arcHeight + this.bedTransition * finalHeight;
      } else {
        // Getting out of bed: reverse arc motion
        const reverseTransition = 1 - this.bedTransition;
        const arcProgress = Math.sin(reverseTransition * Math.PI);
        const arcHeight = 0.4; // Height of the arc
        const startHeight = this.bedYPosition - this.normalYPosition;
        yOffset = arcProgress * arcHeight + this.bedTransition * startHeight;
      }
      
      // Ensure Y position never goes below normal position
      yOffset = Math.max(0, yOffset);
      this.character.position.y = this.normalYPosition + yOffset;
    }

    // Add Z offset when in bed to position character away from pillow (outside transition block)
    if ((this.isInBed || this.bedTransition > 0) && this.bedPosition) {
      const bedZOffset = 0.4; // Move toward front of bed (positive Z)
      const currentZOffset = bedZOffset * this.bedTransition;
      const bedWorldZ = this.bedPosition.z * this.gridSize;
      this.character.position.z = bedWorldZ + currentZOffset;
    }

    // Handle bump animation
    if (this._isBumping) {
      this.animateBump(deltaTime);
    }

    // Process movement queue (only if not moving and not bumping and not in bed transition)
    if (!this._isMoving && !this._isBumping && this.movementQueue.length > 0 && this.bedTransition === 0) {
      this.startMove(this.movementQueue.shift()!);
    }

    // Animate current move
    if (this._isMoving) {
      this.animateMove(deltaTime);
    }

    // Smooth rotation
    if (this.character.rotation.y !== this.targetRotation && this.bedTransition === 0) {
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
    
    // Check collision before moving
    if (this.collisionManager && !this.collisionManager.canMoveTo(this.gridPosition, newGridPos)) {
      console.log(`Movement blocked from (${this.gridPosition.x}, ${this.gridPosition.z}) to (${newGridPos.x}, ${newGridPos.z})`);
      
      // Check if it's an interactable
      const interactable = this.collisionManager.getInteractableAt(newGridPos.x, newGridPos.z);
      if (interactable) {
        console.log('Found interactable:', interactable.interactionType);
        // Handle interaction (will implement later)
      }
      
      // Start bump animation toward blocked direction
      this.startBumpAnimation(direction);
      
      return; // Block the movement
    }
    
    // Log successful movement
    console.log(`Moving from (${this.gridPosition.x}, ${this.gridPosition.z}) to (${newGridPos.x}, ${newGridPos.z})`);
    
    // Movement is allowed, proceed as normal
    this._isMoving = true;
    this.moveTimer = 0;
    
    // Update grid position immediately (for game logic)
    this.gridPosition = newGridPos;
    
    // Set target visual position
    this.targetPosition.set(
      this.gridPosition.x * this.gridSize,
      0,
      this.gridPosition.z * this.gridSize
    );
  }

  private startBumpAnimation(direction: Direction): void {
    if (this._isBumping) return; // Don't interrupt existing bump
    
    this._isBumping = true;
    this.bumpTimer = 0;
    this.currentDirection = direction;
    
    // Store current position as bump start
    this.bumpStartPosition.copy(this.visualPosition);
    
    // Calculate bump direction vector
    this.bumpDirection.set(0, 0, 0);
    switch (direction) {
      case 'forward':
        this.bumpDirection.z = -this.bumpDistance;
        this.targetRotation = Math.PI;
        break;
      case 'backward':
        this.bumpDirection.z = this.bumpDistance;
        this.targetRotation = 0;
        break;
      case 'left':
        this.bumpDirection.x = -this.bumpDistance;
        this.targetRotation = -Math.PI / 2;
        break;
      case 'right':
        this.bumpDirection.x = this.bumpDistance;
        this.targetRotation = Math.PI / 2;
        break;
    }
    
    console.log(`Starting bump animation toward ${direction}`);
  }

  private animateBump(deltaTime: number): void {
    if (!this.character) return;
    
    this.bumpTimer += deltaTime;
    const progress = Math.min(1, this.bumpTimer / this.bumpDuration);
    
    // Two-phase animation: lunge forward (0-0.5), bounce back (0.5-1.0)
    let bumpOffset: THREE.Vector3;
    
    if (progress <= 0.5) {
      // First half: lunge toward blocked direction
      const lungeProgress = progress * 2; // 0 to 1
      const easedProgress = this.smoothStep(lungeProgress);
      bumpOffset = this.bumpDirection.clone().multiplyScalar(easedProgress);
    } else {
      // Second half: bounce back to original position
      const bounceProgress = (progress - 0.5) * 2; // 0 to 1
      const easedProgress = this.smoothStep(bounceProgress);
      bumpOffset = this.bumpDirection.clone().multiplyScalar(1 - easedProgress);
    }
    
    // Apply bump offset to character position
    const bumpPosition = this.bumpStartPosition.clone().add(bumpOffset);
    
    // Don't override Y position if we're in bed transition
    if (this.bedTransition === 0) {
      this.character.position.x = bumpPosition.x;
      this.character.position.z = bumpPosition.z;
      this.character.position.y = this.normalYPosition;
    } else {
      this.character.position.x = bumpPosition.x;
      this.character.position.z = bumpPosition.z;
      // Y position handled by bed transition
    }
    
    // Update visual position to match (so camera follows)
    this.visualPosition.copy(bumpPosition);
    
    // Check if bump is complete
    if (progress >= 1) {
      this._isBumping = false;
      this.bumpTimer = 0;
      
      // Ensure character is back at original position
      this.character.position.x = this.bumpStartPosition.x;
      this.character.position.z = this.bumpStartPosition.z;
      this.visualPosition.copy(this.bumpStartPosition);
      
      console.log('Bump animation complete');
    }
  }

  private animateMove(deltaTime: number): void {
    if (!this.character) return;
    
    this.moveTimer += deltaTime;
    const progress = Math.min(1, this.moveTimer / this.moveDuration);
    
    // Smooth step function for more natural movement
    const smoothProgress = this.smoothStep(progress);
    
    // Interpolate position
    this.visualPosition.lerpVectors(this.startPosition, this.targetPosition, smoothProgress);
    
    // Add hop animation (only if not transitioning from bed)
    const hopProgress = Math.sin(progress * Math.PI);
    const hopOffset = this.bedTransition === 0 ? hopProgress * this.hopHeight : 0;
    
    // Update character position
    this.character.position.x = this.visualPosition.x;
    this.character.position.z = this.visualPosition.z;
    
    // Don't override Y position if we're in bed transition
    if (this.bedTransition === 0) {
      this.character.position.y = this.normalYPosition + hopOffset;
    }
    
    // Check if move is complete
    if (progress >= 1) {
      this._isMoving = false;
      
      // Only reset Y position if not in bed transition
      if (this.bedTransition === 0) {
        this.character.position.y = this.normalYPosition;
      }
      
      // Check if we moved onto the bed
      if (this.bedPosition && 
          this.gridPosition.x === this.bedPosition.x && 
          this.gridPosition.z === this.bedPosition.z) {
        this.setInBed(true);
      }
      
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

  getQueueLength(): number {
    return this.movementQueue.length;
  }

  isMoving(): boolean {
    return this._isMoving;
  }

  isBumping(): boolean {
    return this._isBumping;
  }

  setGridPosition(x: number, z: number): void {
    console.log(`Setting grid position to (${x}, ${z})`);
    this.gridPosition = { x, z };
    this.updateCharacterPosition();
  }
}