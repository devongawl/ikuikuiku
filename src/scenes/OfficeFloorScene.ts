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
      
      // Create the square office layout
      this.createSquareOfficeLayout();
      
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
    // Natural window lighting from the windowed side
    const windowLight = new THREE.DirectionalLight(0xFFFAF0, 1.2);
    windowLight.position.set(0, 10, 12);
    windowLight.castShadow = true;
    windowLight.shadow.mapSize.width = 2048;
    windowLight.shadow.mapSize.height = 2048;
    windowLight.shadow.camera.near = 0.5;
    windowLight.shadow.camera.far = 50;
    windowLight.shadow.camera.left = -15;
    windowLight.shadow.camera.right = 15;
    windowLight.shadow.camera.top = 15;
    windowLight.shadow.camera.bottom = -15;
    this.add(windowLight);

    // Soft office fluorescent lighting
    const officeLight = new THREE.DirectionalLight(0xF5F5DC, 0.6);
    officeLight.position.set(-8, 10, -8);
    officeLight.castShadow = true;
    this.add(officeLight);

    // Warm ambient light
    const ambientLight = new THREE.AmbientLight(0xFFFAF0, 0.4);
    this.add(ambientLight);
  }

  private createSquareOfficeLayout(): void {
    // Square office floor (20x20 units)
    const floor = new THREE.Mesh(
      new THREE.BoxGeometry(20, 0.1, 20),
      new THREE.MeshLambertMaterial({ color: 0xF5F5F5 })
    );
    floor.position.set(0, 0, 0);
    floor.receiveShadow = true;
    this.add(floor);

    // Create office walls and windows
    this.createWallsAndWindows();
    
    // Create desk arrangements along the windowed wall
    this.createDeskArea();
    
    // Add elevator area at the back
    this.createElevatorEntrance();
  }

  private createWallsAndWindows(): void {
    const wallMaterial = new THREE.MeshLambertMaterial({ color: 0xFAFAFA });
    const windowMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x87CEEB, 
      transparent: true, 
      opacity: 0.3 
    });
    const windowFrameMaterial = new THREE.MeshLambertMaterial({ color: 0xC0C0C0 });
    const wallHeight = 4;
    const wallThickness = 0.3;

    // Back wall with elevator cutout - create two sections instead of one solid wall
    const elevatorWidth = 2.5; // Slightly wider than elevator doors for proper clearance
    const wallSectionWidth = (20 - elevatorWidth) / 2;
    
    // Left section of back wall
    const backWallLeft = new THREE.Mesh(
      new THREE.BoxGeometry(wallSectionWidth, wallHeight, wallThickness),
      wallMaterial
    );
    backWallLeft.position.set(-wallSectionWidth/2 - elevatorWidth/2, wallHeight / 2, -10);
    backWallLeft.castShadow = true;
    backWallLeft.receiveShadow = true;
    this.add(backWallLeft);

    // Right section of back wall
    const backWallRight = new THREE.Mesh(
      new THREE.BoxGeometry(wallSectionWidth, wallHeight, wallThickness),
      wallMaterial
    );
    backWallRight.position.set(wallSectionWidth/2 + elevatorWidth/2, wallHeight / 2, -10);
    backWallRight.castShadow = true;
    backWallRight.receiveShadow = true;
    this.add(backWallRight);

    // Left wall (solid)
    const leftWall = new THREE.Mesh(
      new THREE.BoxGeometry(wallThickness, wallHeight, 20),
      wallMaterial
    );
    leftWall.position.set(-10, wallHeight / 2, 0);
    leftWall.castShadow = true;
    leftWall.receiveShadow = true;
    this.add(leftWall);

    // Right wall (solid)  
    const rightWall = new THREE.Mesh(
      new THREE.BoxGeometry(wallThickness, wallHeight, 20),
      wallMaterial
    );
    rightWall.position.set(10, wallHeight / 2, 0);
    rightWall.castShadow = true;
    rightWall.receiveShadow = true;
    this.add(rightWall);

    // Front wall with windows (the windowed side)
    this.createWindowedWall();
  }

  private createWindowedWall(): void {
    const wallMaterial = new THREE.MeshLambertMaterial({ color: 0xFAFAFA });
    const windowMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x87CEEB, 
      transparent: true, 
      opacity: 0.3 
    });
    const windowFrameMaterial = new THREE.MeshLambertMaterial({ color: 0xC0C0C0 });
    const wallHeight = 4;
    const wallThickness = 0.3;

    // Create wall sections between windows
    const wallSections = [
      { x: -8, width: 4 }, // Left end
      { x: -2, width: 4 }, // Between first and second window
      { x: 2, width: 4 },  // Between second and third window  
      { x: 8, width: 4 }   // Right end
    ];

    wallSections.forEach(section => {
      const wallPart = new THREE.Mesh(
        new THREE.BoxGeometry(section.width, wallHeight, wallThickness),
        wallMaterial
      );
      wallPart.position.set(section.x, wallHeight / 2, 10);
      wallPart.castShadow = true;
      wallPart.receiveShadow = true;
      this.add(wallPart);
    });

    // Create windows
    const windowPositions = [-6, 0, 6];
    windowPositions.forEach(x => {
      this.createWindow(x, 10);
    });
  }

  private createWindow(x: number, z: number): void {
    const windowWidth = 3;
    const windowHeight = 2.5;
    const frameThickness = 0.1;
    const windowMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x87CEEB, 
      transparent: true, 
      opacity: 0.3 
    });
    const frameMaterial = new THREE.MeshLambertMaterial({ color: 0xC0C0C0 });

    // Window glass
    const windowGlass = new THREE.Mesh(
      new THREE.BoxGeometry(windowWidth, windowHeight, 0.05),
      windowMaterial
    );
    windowGlass.position.set(x, 1.5, z - 0.1);
    this.add(windowGlass);

    // Window frame
    const frameTop = new THREE.Mesh(
      new THREE.BoxGeometry(windowWidth + 0.2, frameThickness, frameThickness),
      frameMaterial
    );
    frameTop.position.set(x, 2.75, z);
    this.add(frameTop);

    const frameBottom = new THREE.Mesh(
      new THREE.BoxGeometry(windowWidth + 0.2, frameThickness, frameThickness),
      frameMaterial
    );
    frameBottom.position.set(x, 0.25, z);
    this.add(frameBottom);

    const frameLeft = new THREE.Mesh(
      new THREE.BoxGeometry(frameThickness, windowHeight, frameThickness),
      frameMaterial
    );
    frameLeft.position.set(x - windowWidth/2 - 0.1, 1.5, z);
    this.add(frameLeft);

    const frameRight = new THREE.Mesh(
      new THREE.BoxGeometry(frameThickness, windowHeight, frameThickness),
      frameMaterial
    );
    frameRight.position.set(x + windowWidth/2 + 0.1, 1.5, z);
    this.add(frameRight);

    // Window divider (cross pattern)
    const dividerV = new THREE.Mesh(
      new THREE.BoxGeometry(frameThickness, windowHeight, frameThickness),
      frameMaterial
    );
    dividerV.position.set(x, 1.5, z);
    this.add(dividerV);

    const dividerH = new THREE.Mesh(
      new THREE.BoxGeometry(windowWidth, frameThickness, frameThickness),
      frameMaterial
    );
    dividerH.position.set(x, 1.5, z);
    this.add(dividerH);
  }

  private createElevatorEntrance(): void {
    // Create elevator recess/alcove for depth
    const elevatorRecess = new THREE.Mesh(
      new THREE.BoxGeometry(2.5, 4, 0.5),
      new THREE.MeshLambertMaterial({ color: 0xE0E0E0 })
    );
    elevatorRecess.position.set(0, 2, -10.25);
    elevatorRecess.receiveShadow = true;
    this.add(elevatorRecess);

    // Elevator doors positioned within the recess
    const elevatorDoors = new THREE.Mesh(
      new THREE.BoxGeometry(2, 3.5, 0.1),
      new THREE.MeshLambertMaterial({ color: 0xC0C0C0 })
    );
    elevatorDoors.position.set(0, 1.75, -10.05); // Positioned just in front of the recess
    elevatorDoors.castShadow = true;
    this.add(elevatorDoors);

    // Add elevator door frame
    const doorFrame = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 3.7, 0.05),
      new THREE.MeshLambertMaterial({ color: 0x808080 })
    );
    doorFrame.position.set(0, 1.85, -10.02);
    this.add(doorFrame);

    // Add elevator call button
    const callButton = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.1, 0.05),
      new THREE.MeshLambertMaterial({ color: 0x4169E1 })
    );
    callButton.position.set(1.5, 1.5, -10.0);
    this.add(callButton);
  }

  private createDeskArea(): void {
    // Position desks along the back wall (facing toward the windows)
    // Her desk (left side of back wall)
    this.herDesk = this.createDesk(true); // personalized
    this.herDesk.position.set(-6, 0, -7);
    this.herDesk.rotation.y = 0; // Facing toward windows
    this.herDesk.name = 'her-desk';
    this.add(this.herDesk);

    // The target desk (right side of back wall)
    this.targetDesk = this.createDesk(false); // empty/new
    this.targetDesk.position.set(6, 0, -7);
    this.targetDesk.rotation.y = 0; // Facing toward windows
    this.targetDesk.name = 'target-desk';
    this.add(this.targetDesk);

    // Additional desks along the back wall
    const additionalDeskPositions = [
      { x: -2, z: -7 }, // Center-left
      { x: 2, z: -7 }   // Center-right
    ];

    additionalDeskPositions.forEach(pos => {
      const desk = this.createDesk(false);
      desk.position.set(pos.x, 0, pos.z);
      desk.rotation.y = 0; // Facing toward windows
      this.add(desk);
    });
  }

  private createMeetingArea(): void {
    // Removed conference table - keeping this method empty in case we want to add other furniture later
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

  private addOfficeDetails(): void {
    // Add office memories
    this.addOfficeMemories();
    
    // Add some office plants in corners
    this.addOfficeDecor();
  }

  private addOfficeDecor(): void {
    // Office plants in corners (away from windows)
    const plantPositions = [
      { x: -8, z: -8 }, { x: 8, z: -8 }  // Back corners only
    ];

    plantPositions.forEach(pos => {
      const plant = this.createOfficePlant();
      plant.position.set(pos.x, 0, pos.z);
      this.add(plant);
    });

    // Add some filing cabinets along the side walls
    this.addFilingCabinets();
  }

  private addFilingCabinets(): void {
    const cabinetPositions = [
      { x: -8, z: -4 }, { x: -8, z: 4 },  // Left wall
      { x: 8, z: -4 }, { x: 8, z: 4 }     // Right wall
    ];

    cabinetPositions.forEach(pos => {
      const cabinet = this.createFilingCabinet();
      cabinet.position.set(pos.x, 0, pos.z);
      this.add(cabinet);
    });
  }

  private createFilingCabinet(): THREE.Group {
    const cabinet = new THREE.Group();
    
    // Cabinet body
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1.2, 0.6),
      new THREE.MeshLambertMaterial({ color: 0xD3D3D3 })
    );
    body.position.y = 0.6;
    body.castShadow = true;
    cabinet.add(body);

    // Cabinet drawers (visual lines)
    for (let i = 0; i < 3; i++) {
      const drawerHandle = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.05, 0.05),
        new THREE.MeshLambertMaterial({ color: 0x696969 })
      );
      drawerHandle.position.set(0.4, 0.3 + i * 0.3, 0);
      cabinet.add(drawerHandle);
    }

    return cabinet;
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
        "My desk facing the windows. I loved watching the world outside while working.",
        { highlight: true }
      );
    }

    // Target desk memory
    if (this.targetDesk) {
      this.addMemory(
        this.targetDesk,
        "That desk with the perfect view of the windows. A great spot for a new developer.",
        { highlight: true }
      );
    }
  }

  private startStorySequence(): void {
    // Initial narrative
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('storyNarration', {
        detail: { message: "Just another Tuesday at the office. I loved my desk facing the windows..." }
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
        detail: { message: "A new developer was being shown around. They were looking for a desk with a good view..." }
      }));
    }, 3000);

    // The moment he chooses the desk across from hers
    setTimeout(() => {
      this.storyPhase = 'meeting';
      window.dispatchEvent(new CustomEvent('storyNarration', {
        detail: { message: "Of all the window desks, he chose the one right next to mine." }
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
      
      // Check if character reached her desk area
      this.checkDeskReached(position.x, position.z);
    };
    
    window.addEventListener('gridMoveComplete', handleGridMovement as EventListener);
    (this as any).gridMovementListener = handleGridMovement;
  }

  private checkDeskReached(gridX: number, gridZ: number): void {
    // Her desk is now at world position (-6, -7), grid position (-3, -3.5)
    if (gridX === -3 && gridZ === -3) {
      window.dispatchEvent(new CustomEvent('storyNarration', {
        detail: { message: "Settling in at my desk with the beautiful window view..." }
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

    // Register walls - updated for elevator cutout
    const elevatorWidth = 2.5;
    const wallSectionWidth = (20 - elevatorWidth) / 2;
    const leftWallCenterX = -wallSectionWidth/2 - elevatorWidth/2;
    const rightWallCenterX = wallSectionWidth/2 + elevatorWidth/2;
    
    registerCollision('back-wall-left', leftWallCenterX, -10, wallSectionWidth, 0.3);
    registerCollision('back-wall-right', rightWallCenterX, -10, wallSectionWidth, 0.3);
    registerCollision('front-wall-sections', 0, 10, 20, 0.3); // Window wall structure
    registerCollision('left-wall', -10, 0, 0.3, 20);
    registerCollision('right-wall', 10, 0, 0.3, 20);

    // Register elevator area as walkable but with some collision for the recess
    registerCollision('elevator-recess', 0, -10.25, 2.5, 0.5);

    // Register key desks along back wall
    registerCollision('her-desk', -6, -7, 1.5, 1);
    registerCollision('target-desk', 6, -7, 1.5, 1);

    // Register filing cabinets
    registerCollision('filing-cabinets-left', -8, -4, 1, 0.6);
    registerCollision('filing-cabinets-left2', -8, 4, 1, 0.6);
    registerCollision('filing-cabinets-right', 8, -4, 1, 0.6);
    registerCollision('filing-cabinets-right2', 8, 4, 1, 0.6);

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