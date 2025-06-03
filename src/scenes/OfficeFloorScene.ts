import * as THREE from 'three';
import { Scene } from './Scene';
import type { Memory } from '../types';

export class OfficeFloorScene extends Scene {
  private herDesk: THREE.Group | null = null;
  private targetDesk: THREE.Group | null = null; // The desk across from hers
  private newDeveloper: THREE.Group | null = null;
  private manager: THREE.Group | null = null;
  private storyPhase: 'arrival' | 'working' | 'developer-arrives' | 'desk-selection' | 'meeting' = 'arrival';

  constructor() {
    super('office-floor', 'The Office - September 15th');
    this.setupGridMovementListener();
  }

  protected async loadAssets(): Promise<void> {
    try {
      // Set up office lighting
      this.setupLighting();
      
      // Create the open office layout
      this.createOfficeLayout();
      
      // Add office details and furniture
      this.addOfficeDetails();
      
      // Start the story sequence
      this.startStorySequence();
      
      console.log('OfficeFloorScene assets loaded successfully');
    } catch (error) {
      console.error('Failed to load OfficeFloorScene assets:', error);
    }
  }

  protected setupLighting(): void {
    // Office fluorescent lighting
    const officeLight1 = new THREE.DirectionalLight(0xF5F5DC, 0.9);
    officeLight1.position.set(8, 10, 8);
    officeLight1.castShadow = true;
    this.add(officeLight1);

    const officeLight2 = new THREE.DirectionalLight(0xF5F5DC, 0.9);
    officeLight2.position.set(-8, 10, -8);
    officeLight2.castShadow = true;
    this.add(officeLight2);

    // Warm ambient office light
    const ambientLight = new THREE.AmbientLight(0xFFFAF0, 0.7);
    this.add(ambientLight);
  }

  private createOfficeLayout(): void {
    // Office floor
    const floor = new THREE.Mesh(
      new THREE.BoxGeometry(24, 0.1, 20),
      new THREE.MeshLambertMaterial({ color: 0xF0F0F0 })
    );
    floor.position.set(0, 0, 0);
    floor.receiveShadow = true;
    this.add(floor);

    // Office walls
    this.createOfficeWalls();
    
    // Create desk arrangements
    this.createDeskArea();
    
    // Add elevator area
    this.createElevatorEntrance();
  }

  private createOfficeWalls(): void {
    const wallMaterial = new THREE.MeshLambertMaterial({ color: 0xFAFAFA });
    const wallHeight = 4;
    const wallThickness = 0.3;

    const walls = [
      // Back wall
      { x: 0, z: -10, width: 24, depth: wallThickness },
      // Front wall (with elevator opening)
      { x: -8, z: 10, width: 8, depth: wallThickness },
      { x: 8, z: 10, width: 8, depth: wallThickness },
      // Side walls
      { x: -12, z: 0, width: wallThickness, depth: 20 },
      { x: 12, z: 0, width: wallThickness, depth: 20 }
    ];

    walls.forEach(wall => {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(wall.width, wallHeight, wall.depth),
        wallMaterial
      );
      mesh.position.set(wall.x, wallHeight / 2, wall.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.add(mesh);
    });
  }

  private createElevatorEntrance(): void {
    // Simple elevator doors at the entrance
    const elevatorDoors = new THREE.Mesh(
      new THREE.BoxGeometry(2, 3.5, 0.1),
      new THREE.MeshLambertMaterial({ color: 0xC0C0C0 })
    );
    elevatorDoors.position.set(0, 1.75, 9.9);
    this.add(elevatorDoors);
  }

  private createDeskArea(): void {
    // Her desk (left side, facing center)
    this.herDesk = this.createDesk(true); // personalized
    this.herDesk.position.set(-4, 0, -2);
    this.herDesk.rotation.y = Math.PI / 2; // Facing right
    this.herDesk.name = 'her-desk';
    this.add(this.herDesk);

    // The target desk (right side, facing her desk)
    this.targetDesk = this.createDesk(false); // empty/new
    this.targetDesk.position.set(4, 0, -2);
    this.targetDesk.rotation.y = -Math.PI / 2; // Facing left
    this.targetDesk.name = 'target-desk';
    this.add(this.targetDesk);

    // Other office desks (background)
    this.createBackgroundDesks();
  }

  private createDesk(isPersonalized: boolean): THREE.Group {
    const deskGroup = new THREE.Group();
    
    // Desk base
    const desk = new THREE.Mesh(
      new THREE.BoxGeometry(2, 0.8, 1.2),
      new THREE.MeshLambertMaterial({ color: 0x8B4513 })
    );
    desk.position.y = 0.4;
    desk.castShadow = true;
    deskGroup.add(desk);

    // Desk top
    const deskTop = new THREE.Mesh(
      new THREE.BoxGeometry(2.1, 0.05, 1.3),
      new THREE.MeshLambertMaterial({ color: 0xA0522D })
    );
    deskTop.position.y = 0.825;
    deskGroup.add(deskTop);

    // Monitor
    const monitor = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.6, 0.1),
      new THREE.MeshLambertMaterial({ color: 0x2F2F2F })
    );
    monitor.position.set(0, 1.3, -0.3);
    deskGroup.add(monitor);

    // Office chair
    const chair = this.createOfficeChair();
    chair.position.set(0, 0, 0.8);
    deskGroup.add(chair);

    if (isPersonalized) {
      // Add personal items to her desk
      this.addPersonalItems(deskGroup);
    }

    return deskGroup;
  }

  private addPersonalItems(deskGroup: THREE.Group): void {
    // Coffee mug
    const mug = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.12, 0.25, 8),
      new THREE.MeshLambertMaterial({ color: 0xFFB6C1 })
    );
    mug.position.set(-0.6, 1.0, 0.3);
    deskGroup.add(mug);

    // Design portfolio/folder
    const portfolio = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.02, 0.4),
      new THREE.MeshLambertMaterial({ color: 0x4169E1 })
    );
    portfolio.position.set(0.5, 0.85, 0.2);
    deskGroup.add(portfolio);

    // Small plant
    const plantPot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.08, 0.15, 8),
      new THREE.MeshLambertMaterial({ color: 0x8B4513 })
    );
    plantPot.position.set(-0.7, 0.9, -0.2);
    deskGroup.add(plantPot);

    const plant = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 8, 6),
      new THREE.MeshLambertMaterial({ color: 0x228B22 })
    );
    plant.position.set(-0.7, 1.1, -0.2);
    plant.scale.y = 1.3;
    deskGroup.add(plant);
  }

  private createOfficeChair(): THREE.Group {
    const chair = new THREE.Group();
    
    // Seat
    const seat = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.08, 0.8),
      new THREE.MeshLambertMaterial({ color: 0x2F2F2F })
    );
    seat.position.y = 0.7;
    chair.add(seat);

    // Backrest - changed to dark gray instead of black to distinguish from monitor
    const backrest = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.8, 0.08),
      new THREE.MeshLambertMaterial({ color: 0x4A4A4A })
    );
    backrest.position.set(0, 1.1, -0.36);
    chair.add(backrest);

    // Chair base
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.3, 0.1, 8),
      new THREE.MeshLambertMaterial({ color: 0x696969 })
    );
    base.position.y = 0.35;
    chair.add(base);

    return chair;
  }

  private createBackgroundDesks(): void {
    const deskPositions = [
      { x: -8, z: -6 }, { x: -4, z: -6 }, { x: 0, z: -6 }, { x: 4, z: -6 }, { x: 8, z: -6 },
      { x: -8, z: 2 }, { x: -4, z: 2 }, { x: 0, z: 2 }, { x: 4, z: 2 }, { x: 8, z: 2 }
    ];

    deskPositions.forEach(pos => {
      const desk = this.createDesk(false);
      desk.position.set(pos.x, 0, pos.z);
      // Random rotation for variety
      desk.rotation.y = Math.random() * Math.PI * 2;
      this.add(desk);
    });
  }

  private addOfficeDetails(): void {
    // Add office memories
    this.addOfficeMemories();
    
    // Add some office plants in corners
    this.addOfficeDecor();
  }

  private addOfficeDecor(): void {
    // Office plants in corners
    const plantPositions = [
      { x: -10, z: -8 }, { x: 10, z: -8 },
      { x: -10, z: 8 }, { x: 10, z: 8 }
    ];

    plantPositions.forEach(pos => {
      const plant = this.createOfficePlant();
      plant.position.set(pos.x, 0, pos.z);
      this.add(plant);
    });
  }

  private createOfficePlant(): THREE.Group {
    const plant = new THREE.Group();
    
    const planter = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.3, 0.6, 8),
      new THREE.MeshLambertMaterial({ color: 0x696969 })
    );
    planter.position.y = 0.3;
    plant.add(planter);
    
    const leaves = new THREE.Mesh(
      new THREE.SphereGeometry(0.6, 8, 6),
      new THREE.MeshLambertMaterial({ color: 0x228B22 })
    );
    leaves.position.y = 1.2;
    leaves.scale.y = 1.4;
    plant.add(leaves);
    
    return plant;
  }

  private addOfficeMemories(): void {
    // Her desk memory
    if (this.herDesk) {
      this.addMemory(
        this.herDesk,
        "My desk. I'd set it up just how I liked it. Everything in its place.",
        { highlight: true }
      );
    }

    // Target desk memory
    if (this.targetDesk) {
      this.addMemory(
        this.targetDesk,
        "That empty desk across from mine. I had no idea it would change my life.",
        { highlight: true }
      );
    }
  }

  private startStorySequence(): void {
    // Initial narrative
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('storyNarration', {
        detail: { message: "Just another Tuesday at the office. I settled in at my usual desk..." }
      }));
    }, 1000);

    // Start the main story sequence after player has a moment to look around
    setTimeout(() => {
      this.storyPhase = 'working';
      this.triggerDeveloperArrival();
    }, 5000);
  }

  private triggerDeveloperArrival(): void {
    this.storyPhase = 'developer-arrives';
    
    window.dispatchEvent(new CustomEvent('storyNarration', {
      detail: { message: "That's when I heard voices coming from the elevator..." }
    }));

    // Simulate the new developer and manager arriving
    setTimeout(() => {
      this.storyPhase = 'desk-selection';
      window.dispatchEvent(new CustomEvent('storyNarration', {
        detail: { message: "A new developer was being shown around. He was looking for a desk..." }
      }));
    }, 3000);

    // The moment he chooses the desk across from hers
    setTimeout(() => {
      this.storyPhase = 'meeting';
      window.dispatchEvent(new CustomEvent('storyNarration', {
        detail: { message: "Of all the empty desks, he chose the one right across from mine." }
      }));
      
      // Final revelation
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('storyNarration', {
          detail: { message: "I didn't know it then, but this ordinary Tuesday would change everything..." }
        }));
      }, 4000);
      
    }, 6000);
  }

  private setupGridMovementListener(): void {
    const handleGridMovement = (event: CustomEvent) => {
      const { position } = event.detail;
      
      // Check if character reached her desk
      this.checkDeskReached(position.x, position.z);
    };
    
    window.addEventListener('gridMoveComplete', handleGridMovement as EventListener);
    (this as any).gridMovementListener = handleGridMovement;
  }

  private checkDeskReached(gridX: number, gridZ: number): void {
    // Her desk is at world position (-4, -2), grid position (-2, -1)
    if (gridX === -2 && gridZ === -1) {
      window.dispatchEvent(new CustomEvent('storyNarration', {
        detail: { message: "Settling in for another day of work..." }
      }));
    }
  }

  protected registerColliders(): void {
    if (!this.collisionManager) {
      console.warn('No collision manager set for OfficeFloorScene');
      return;
    }

    console.log('🏢 Registering office floor collisions');

    const registerCollision = (name: string, centerX: number, centerZ: number, width: number, depth: number) => {
      const gridSize = 2;
      const positions: {x: number, z: number}[] = [];
      
      const minX = Math.floor((centerX - width/2) / gridSize);
      const maxX = Math.floor((centerX + width/2) / gridSize);
      const minZ = Math.floor((centerZ - depth/2) / gridSize);
      const maxZ = Math.floor((centerZ + depth/2) / gridSize);
      
      for (let x = minX; x <= maxX; x++) {
        for (let z = minZ; z <= maxZ; z++) {
          positions.push({x, z});
        }
      }
      
      if (positions.length > 0) {
        this.collisionManager!.addStaticCollider({
          type: 'static',
          gridPositions: positions,
          name
        });
      }
    };

    // Register walls
    registerCollision('back-wall', 0, -10, 24, 0.3);
    registerCollision('front-wall-left', -8, 10, 8, 0.3);
    registerCollision('front-wall-right', 8, 10, 8, 0.3);
    registerCollision('left-wall', -12, 0, 0.3, 20);
    registerCollision('right-wall', 12, 0, 0.3, 20);

    // Register key desks (but leave space for walking around them)
    registerCollision('her-desk', -4, -2, 1.5, 1);
    registerCollision('target-desk', 4, -2, 1.5, 1);

    console.log('✅ Office floor collisions registered');
  }

  unload(): void {
    super.unload();
    
    if ((this as any).gridMovementListener) {
      window.removeEventListener('gridMoveComplete', (this as any).gridMovementListener);
      (this as any).gridMovementListener = null;
    }
  }

  update(deltaTime: number): void {
    super.update(deltaTime);
    
    // Update story elements based on current phase
    // Could add NPC animations here in the future
  }
} 