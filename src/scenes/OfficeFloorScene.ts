import * as THREE from 'three';
import { Scene } from './Scene';
import { AssetLoader } from '../systems/AssetLoader';
import type { Memory } from '../types';

export class OfficeFloorScene extends Scene {
  private herDesk: THREE.Group | null = null;
  private targetDesk: THREE.Group | null = null; // The desk across from hers
  private newDeveloper: THREE.Group | null = null;
  private manager: THREE.Group | null = null;
  private storyPhase: 'arrival' | 'working' | 'developer-arrives' | 'desk-selection' | 'meeting' = 'arrival';
  private assetLoader: AssetLoader;
  private npcs: THREE.Group[] = []; // Array to hold all NPCs
  private npcMovementData: NPCMovementData[] = []; // Track movement state for each NPC

  constructor() {
    super('office-floor', 'The Office - September 15th');
    this.assetLoader = new AssetLoader();
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
      
      // Load and position NPCs
      await this.loadOfficeNPCs();
      
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

    // Add memories for NPCs
    this.npcs.forEach((npc, index) => {
      const npcMemories = [
        "Dave from Development. Always buried in his code, but he gave me great technical advice.",
        "Sarah, our Project Manager. She had a way of keeping everyone organized and motivated.", 
        "Mike from HR. A friendly guy who always made sure everyone felt welcome.",
        "Emma, the UI Designer. We often discussed design principles during coffee breaks."
      ];

      if (npc && index < npcMemories.length) {
        this.addMemory(
          npc,
          npcMemories[index],
          { highlight: true }
        );
      }
    });
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
    
    // Clean up NPCs
    this.npcs.forEach(npc => {
      // Dispose of textures and materials
      npc.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if (child.material instanceof THREE.Material) {
            // Check if material has a map property (like MeshLambertMaterial)
            if ('map' in child.material && child.material.map) {
              (child.material.map as THREE.Texture).dispose();
            }
            child.material.dispose();
          }
          if (child.geometry) {
            child.geometry.dispose();
          }
        }
      });
      
      // Remove from scene
      this.remove(npc);
    });
    
    // Clear NPCs array and movement data
    this.npcs = [];
    this.npcMovementData = [];
    
    if ((this as any).gridMovementListener) {
      window.removeEventListener('gridMoveComplete', (this as any).gridMovementListener);
      (this as any).gridMovementListener = null;
    }
  }

  update(deltaTime: number): void {
    super.update(deltaTime);
    
    // Update NPC movements
    this.updateNPCMovements(deltaTime);
    
    // Update story elements based on current phase
    // Could add NPC animations here in the future
  }

  private updateNPCMovements(deltaTime: number): void {
    this.npcMovementData.forEach(data => {
      if (data.waypoints.length === 0) return;
      
      const currentWaypoint = data.waypoints[data.currentWaypointIndex];
      const npcPosition = data.npc.position;
      
      if (!data.isMoving) {
        // NPC is waiting at a waypoint
        data.currentWaitTime += deltaTime;
        
        if (data.currentWaitTime >= data.waitTime) {
          // Start moving to next waypoint
          data.isMoving = true;
          data.currentWaitTime = 0;
          
          // Calculate rotation to face the target waypoint
          const direction = new THREE.Vector3()
            .subVectors(currentWaypoint, npcPosition)
            .normalize();
          
          if (direction.length() > 0.1) {
            const targetRotation = Math.atan2(direction.x, direction.z);
            data.npc.rotation.y = targetRotation;
          }
        }
      } else {
        // NPC is moving toward waypoint
        const direction = new THREE.Vector3().subVectors(currentWaypoint, npcPosition);
        const distance = direction.length();
        
        if (distance < 0.1) {
          // Reached waypoint
          data.isMoving = false;
          data.npc.position.copy(currentWaypoint);
          
          // Move to next waypoint (loop back to start if at end)
          data.currentWaypointIndex = (data.currentWaypointIndex + 1) % data.waypoints.length;
          
          // Reset wait time with some randomness
          data.waitTime = 2 + Math.random() * 3;
        } else {
          // Move toward waypoint
          const moveVector = direction.normalize().multiplyScalar(data.moveSpeed * deltaTime);
          data.npc.position.add(moveVector);
        }
      }
    });
  }

  private async loadOfficeNPCs(): Promise<void> {
    console.log('Loading office NPCs...');
    
    // NPC configurations with different skins and positions
    const npcConfigs = [
      {
        name: 'office-worker-1',
        model: 'kenney_blocky-characters/Models/Non-rigged/glTF/basicCharacter.gltf',
        skin: 'kenney_blocky-characters/Skins/Basic/skin_man.png',
        position: { x: -2, y: 0, z: -6.2 }, // Behind center-left desk
        rotation: 0,
        description: 'Senior Developer - focused on his code'
      },
      {
        name: 'office-worker-2', 
        model: 'kenney_blocky-characters/Models/Non-rigged/glTF/advancedCharacter.gltf',
        skin: 'kenney_blocky-characters/Skins/Basic/skin_woman.png',
        position: { x: 2, y: 0, z: -6.2 }, // Behind center-right desk
        rotation: 0,
        description: 'Project Manager - reviewing reports'
      },
      {
        name: 'office-worker-3',
        model: 'kenney_blocky-characters/Models/Non-rigged/glTF/basicCharacter.gltf', 
        skin: 'kenney_blocky-characters/Skins/Basic/skin_manAlternative.png',
        position: { x: -7, y: 0, z: 2 }, // Near filing cabinets on left side
        rotation: Math.PI / 2, // Facing right (toward filing cabinet)
        description: 'HR Representative - organizing files'
      },
      {
        name: 'office-worker-4',
        model: 'kenney_blocky-characters/Models/Non-rigged/glTF/advancedCharacter.gltf',
        skin: 'kenney_blocky-characters/Skins/Basic/skin_womanAlternative.png',
        position: { x: 4, y: 0, z: 8 }, // Near windows, looking outside
        rotation: Math.PI, // Facing toward windows
        description: 'Designer - taking a break by the window'
      }
    ];

    // Load each NPC
    for (let i = 0; i < npcConfigs.length; i++) {
      const config = npcConfigs[i];
      try {
        const npc = await this.createNPC(config);
        this.npcs.push(npc);
        this.add(npc);
        
        // Initialize movement data for this NPC
        const movementData = this.createMovementDataForNPC(npc, i);
        this.npcMovementData.push(movementData);
        
        console.log(`✅ Loaded NPC: ${config.name}`);
      } catch (error) {
        console.error(`❌ Failed to load NPC ${config.name}:`, error);
      }
    }
    
    console.log(`Loaded ${this.npcs.length} NPCs successfully`);
  }

  private createMovementDataForNPC(npc: THREE.Group, index: number): NPCMovementData {
    const waypoints: THREE.Vector3[] = [];
    
    // Define different movement patterns for each NPC based on their role
    switch (index) {
      case 0: // Dave (Developer) - moves between his desk and coffee area
        waypoints.push(
          new THREE.Vector3(-2, 0, -6.2), // His desk
          new THREE.Vector3(-2, 0, -4),    // Step away from desk
          new THREE.Vector3(-4, 0, -2),    // Move toward center
          new THREE.Vector3(-6, 0, 0),     // Coffee/break area
          new THREE.Vector3(-4, 0, -2),    // Return path
          new THREE.Vector3(-2, 0, -4)     // Back to desk area
        );
        break;
        
      case 1: // Sarah (Project Manager) - moves around checking on people
        waypoints.push(
          new THREE.Vector3(2, 0, -6.2),   // Her desk
          new THREE.Vector3(0, 0, -4),     // Center of office
          new THREE.Vector3(-2, 0, -4),    // Check on Dave
          new THREE.Vector3(0, 0, -2),     // Center again
          new THREE.Vector3(4, 0, 0),      // Check right side
          new THREE.Vector3(2, 0, -2),     // Return path
          new THREE.Vector3(2, 0, -4)      // Back toward desk
        );
        break;
        
      case 2: // Mike (HR) - moves between filing cabinets and around office
        waypoints.push(
          new THREE.Vector3(-7, 0, 2),     // Starting position
          new THREE.Vector3(-7, 0, -2),    // Other filing cabinet
          new THREE.Vector3(-4, 0, -2),    // Move into office
          new THREE.Vector3(-2, 0, 0),     // Center-left area
          new THREE.Vector3(-4, 0, 2),     // Back toward filing area
          new THREE.Vector3(-7, 0, 0)      // Return to filing area
        );
        break;
        
      case 3: // Emma (Designer) - moves around looking at different areas
        waypoints.push(
          new THREE.Vector3(4, 0, 8),      // By windows
          new THREE.Vector3(2, 0, 6),      // Step back from windows
          new THREE.Vector3(0, 0, 4),      // Center office
          new THREE.Vector3(-2, 0, 2),     // Left side
          new THREE.Vector3(0, 0, 0),      // Center
          new THREE.Vector3(2, 0, 2),      // Right side
          new THREE.Vector3(4, 0, 4)       // Back toward windows
        );
        break;
    }
    
    return {
      npc: npc,
      waypoints: waypoints,
      currentWaypointIndex: 0,
      moveSpeed: 0.5 + Math.random() * 0.5, // Random speed between 0.5 and 1.0
      waitTime: 2 + Math.random() * 3, // Random wait time between 2-5 seconds
      currentWaitTime: 0,
      isMoving: false,
      name: npc.name
    };
  }

  private async createNPC(config: {
    name: string;
    model: string;
    skin: string;
    position: { x: number; y: number; z: number };
    rotation: number;
    description: string;
  }): Promise<THREE.Group> {
    // Load the character model
    const character = await this.assetLoader.loadGLTF(config.model, config.name);
    
    // Scale the character appropriately (1.5x bigger than before: 0.05 * 1.5 = 0.075)
    character.scale.setScalar(0.075);
    
    // Load and apply the skin texture
    const skinTexture = await this.assetLoader.loadTexture(config.skin);
    skinTexture.flipY = false; // GLTF textures don't need flipping
    
    // Apply the skin to all meshes
    character.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material = new THREE.MeshLambertMaterial({
          map: skinTexture,
          color: 0xffffff
        });
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    
    // Position the character
    character.position.set(config.position.x, config.position.y, config.position.z);
    character.rotation.y = config.rotation;
    
    // Add name and description for potential interactions
    character.name = config.name;
    character.userData.description = config.description;
    
    return character;
  }
}

interface NPCMovementData {
  npc: THREE.Group;
  waypoints: THREE.Vector3[];
  currentWaypointIndex: number;
  moveSpeed: number;
  waitTime: number;
  currentWaitTime: number;
  isMoving: boolean;
  name: string;
} 