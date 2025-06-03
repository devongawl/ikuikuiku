import * as THREE from 'three';
import { Scene } from './Scene';
import type { Memory } from '../types';

export class OfficeBuildingScene extends Scene {
  private elevatorDoor: THREE.Mesh | null = null;
  private receptionDesk: THREE.Mesh | null = null;
  private elevatorLight: THREE.PointLight | null = null;

  constructor() {
    super('office-building', 'Office Building Lobby');
    this.setupGridMovementListener();
  }

  protected async loadAssets(): Promise<void> {
    try {
      // Set up indoor office lighting
      this.setupLighting();
      
      // Create the lobby layout
      this.createLobby();
      
      // Add office building details
      this.addLobbyDetails();
      
      console.log('OfficeBuildingScene assets loaded successfully');
    } catch (error) {
      console.error('Failed to load OfficeBuildingScene assets:', error);
    }
  }

  protected setupLighting(): void {
    // Modern office building lighting
    const ceilingLight1 = new THREE.DirectionalLight(0xFFFFFF, 0.8);
    ceilingLight1.position.set(5, 8, 5);
    ceilingLight1.castShadow = true;
    ceilingLight1.shadow.mapSize.width = 1024;
    ceilingLight1.shadow.mapSize.height = 1024;
    this.add(ceilingLight1);

    const ceilingLight2 = new THREE.DirectionalLight(0xFFFFFF, 0.8);
    ceilingLight2.position.set(-5, 8, -5);
    ceilingLight2.castShadow = true;
    this.add(ceilingLight2);

    // Warm ambient light for indoor setting
    const ambientLight = new THREE.AmbientLight(0xF5F5F5, 0.6);
    this.add(ambientLight);
  }

  private createLobby(): void {
    // Lobby floor - modern tiles
    const lobbyFloor = new THREE.Mesh(
      new THREE.BoxGeometry(20, 0.1, 16),
      new THREE.MeshLambertMaterial({ color: 0xE0E0E0 }) // Light gray tiles
    );
    lobbyFloor.position.set(0, 0, 0);
    lobbyFloor.receiveShadow = true;
    this.add(lobbyFloor);

    // Lobby walls
    this.createLobbyWalls();
    
    // Reception desk
    this.createReceptionDesk();
    
    // Elevator area
    this.createElevator();
    
    // Seating area
    this.createSeatingArea();
  }

  private createLobbyWalls(): void {
    const wallMaterial = new THREE.MeshLambertMaterial({ color: 0xF8F8F8 });
    const wallHeight = 5;
    const wallThickness = 0.3;

    const walls = [
      // Back wall
      { x: 0, z: -8, width: 20, depth: wallThickness },
      // Front wall (with gap for entrance)
      { x: -6, z: 8, width: 8, depth: wallThickness },
      { x: 6, z: 8, width: 8, depth: wallThickness },
      // Side walls  
      { x: -10, z: 0, width: wallThickness, depth: 16 },
      { x: 10, z: 0, width: wallThickness, depth: 16 }
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

  private createReceptionDesk(): void {
    const deskGroup = new THREE.Group();
    
    // Main desk
    const desk = new THREE.Mesh(
      new THREE.BoxGeometry(4, 1.2, 1.5),
      new THREE.MeshLambertMaterial({ color: 0x8B4513 })
    );
    desk.position.y = 0.6;
    desk.castShadow = true;
    deskGroup.add(desk);

    // Desk top
    const deskTop = new THREE.Mesh(
      new THREE.BoxGeometry(4.2, 0.1, 1.7),
      new THREE.MeshLambertMaterial({ color: 0xA0522D })
    );
    deskTop.position.y = 1.25;
    deskGroup.add(deskTop);

    // Computer monitor
    const monitor = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.6, 0.1),
      new THREE.MeshLambertMaterial({ color: 0x2F2F2F })
    );
    monitor.position.set(0, 1.6, -0.3);
    deskGroup.add(monitor);

    // Company logo sign
    const logo = new THREE.Mesh(
      new THREE.BoxGeometry(3, 0.8, 0.1),
      new THREE.MeshLambertMaterial({ color: 0x4169E1 })
    );
    logo.position.set(0, 2.5, -0.6);
    deskGroup.add(logo);

    deskGroup.position.set(0, 0, -5);
    deskGroup.name = 'reception-desk';
    this.receptionDesk = desk;
    this.add(deskGroup);
  }

  private createElevator(): void {
    const elevatorGroup = new THREE.Group();
    
    // Elevator frame - moved back to prevent z-fighting
    const elevatorFrame = new THREE.Mesh(
      new THREE.BoxGeometry(2.5, 4, 0.3),
      new THREE.MeshLambertMaterial({ color: 0xC0C0C0 })
    );
    elevatorFrame.position.set(0, 2, -0.1); // Moved back slightly
    elevatorGroup.add(elevatorFrame);

    // Elevator doors (closed) - positioned clearly in front of frame
    const leftDoor = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 3.5, 0.1),
      new THREE.MeshLambertMaterial({ color: 0xA9A9A9 })
    );
    leftDoor.position.set(-0.6, 1.75, 0.2); // Moved further forward
    elevatorGroup.add(leftDoor);

    const rightDoor = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 3.5, 0.1),
      new THREE.MeshLambertMaterial({ color: 0xA9A9A9 })
    );
    rightDoor.position.set(0.6, 1.75, 0.2); // Moved further forward
    elevatorGroup.add(rightDoor);

    // Elevator call button - positioned clearly in front
    const callButton = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.2, 0.1),
      new THREE.MeshLambertMaterial({ color: 0xFF4444 })
    );
    callButton.position.set(1.5, 1.5, 0.3); // Moved further forward
    callButton.name = 'elevator-button';
    elevatorGroup.add(callButton);

    // Elevator light
    this.elevatorLight = new THREE.PointLight(0xFFFFAA, 1, 4);
    this.elevatorLight.position.set(0, 3.5, 1);
    elevatorGroup.add(this.elevatorLight);

    // Floor indicator - positioned clearly in front
    const indicator = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.4, 0.1),
      new THREE.MeshLambertMaterial({ color: 0x000000 })
    );
    indicator.position.set(0, 3.5, 0.25); // Moved further forward
    elevatorGroup.add(indicator);

    elevatorGroup.position.set(6, 0, -7);
    elevatorGroup.name = 'elevator';
    this.elevatorDoor = leftDoor; // Reference for triggering
    this.add(elevatorGroup);
  }

  private createSeatingArea(): void {
    // Modern lobby chairs
    const chairPositions = [
      { x: -6, z: 2 },
      { x: -4, z: 2 },
      { x: -2, z: 2 }
    ];

    chairPositions.forEach(pos => {
      const chair = this.createModernChair();
      chair.position.set(pos.x, 0, pos.z);
      this.add(chair);
    });

    // Coffee table
    const coffeeTable = new THREE.Mesh(
      new THREE.BoxGeometry(2, 0.5, 1),
      new THREE.MeshLambertMaterial({ color: 0x8B4513 })
    );
    coffeeTable.position.set(-4, 0.25, 4);
    coffeeTable.castShadow = true;
    this.add(coffeeTable);

    // Magazines on table
    const magazines = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.02, 0.4),
      new THREE.MeshLambertMaterial({ color: 0xFF6347 })
    );
    magazines.position.set(-4, 0.51, 4);
    this.add(magazines);
  }

  private createModernChair(): THREE.Group {
    const chair = new THREE.Group();
    
    // Seat
    const seat = new THREE.Mesh(
      new THREE.BoxGeometry(1, 0.1, 1),
      new THREE.MeshLambertMaterial({ color: 0x2F4F4F })
    );
    seat.position.y = 0.8;
    seat.castShadow = true;
    chair.add(seat);

    // Backrest
    const backrest = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1.2, 0.1),
      new THREE.MeshLambertMaterial({ color: 0x2F4F4F })
    );
    backrest.position.set(0, 1.4, -0.45);
    backrest.castShadow = true;
    chair.add(backrest);

    // Legs
    const legPositions = [
      { x: -0.4, z: -0.4 },
      { x: 0.4, z: -0.4 },
      { x: -0.4, z: 0.4 },
      { x: 0.4, z: 0.4 }
    ];

    legPositions.forEach(pos => {
      const leg = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.8, 0.1),
        new THREE.MeshLambertMaterial({ color: 0x2F2F2F })
      );
      leg.position.set(pos.x, 0.4, pos.z);
      leg.castShadow = true;
      chair.add(leg);
    });

    return chair;
  }

  private addLobbyDetails(): void {
    // Add some potted plants
    const plantPositions = [
      { x: -8, z: 6 },
      { x: 8, z: 6 },
      { x: -8, z: -6 },
      { x: 8, z: -2 }
    ];

    plantPositions.forEach(pos => {
      const plant = this.createOfficePlant();
      plant.position.set(pos.x, 0, pos.z);
      this.add(plant);
    });

    // Add building address sign
    this.createAddressSign();

    // Add lobby memories
    this.addLobbyMemories();
  }

  private createAddressSign(): void {
    // Background sign plate
    const signPlate = new THREE.Mesh(
      new THREE.BoxGeometry(3, 1, 0.1),
      new THREE.MeshLambertMaterial({ color: 0x2F2F2F }) // Dark gray background
    );
    signPlate.position.set(-2, 3, -7.95); // On the back wall, left side
    this.add(signPlate);

    // Address text "LAEVA 1" - create each letter as a simple white rectangle
    const letterMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
    
    // Letter spacing and positioning
    const letterWidth = 0.2;
    const letterHeight = 0.4;
    const letterDepth = 0.05;
    const spacing = 0.3;
    const startX = -3.2; // Starting position for the text
    
    // "L"
    const L = new THREE.Mesh(
      new THREE.BoxGeometry(letterWidth, letterHeight, letterDepth),
      letterMaterial
    );
    L.position.set(startX, 3, -8);
    this.add(L);
    
    // "A"
    const A = new THREE.Mesh(
      new THREE.BoxGeometry(letterWidth, letterHeight, letterDepth),
      letterMaterial
    );
    A.position.set(startX + spacing, 3, -8);
    this.add(A);
    
    // "E"
    const E = new THREE.Mesh(
      new THREE.BoxGeometry(letterWidth, letterHeight, letterDepth),
      letterMaterial
    );
    E.position.set(startX + spacing * 2, 3, -8);
    this.add(E);
    
    // "V"
    const V = new THREE.Mesh(
      new THREE.BoxGeometry(letterWidth, letterHeight, letterDepth),
      letterMaterial
    );
    V.position.set(startX + spacing * 3, 3, -8);
    this.add(V);
    
    // "A"
    const A2 = new THREE.Mesh(
      new THREE.BoxGeometry(letterWidth, letterHeight, letterDepth),
      letterMaterial
    );
    A2.position.set(startX + spacing * 4, 3, -8);
    this.add(A2);
    
    // Space
    
    // "1"
    const One = new THREE.Mesh(
      new THREE.BoxGeometry(letterWidth, letterHeight, letterDepth),
      letterMaterial
    );
    One.position.set(startX + spacing * 5.5, 3, -8);
    this.add(One);

    // Add a subtle border around the sign
    const signBorder = new THREE.Mesh(
      new THREE.BoxGeometry(3.2, 1.2, 0.05),
      new THREE.MeshLambertMaterial({ color: 0xC0C0C0 }) // Light gray border
    );
    signBorder.position.set(-2, 3, -7.9);
    this.add(signBorder);
  }

  private createOfficePlant(): THREE.Group {
    const plant = new THREE.Group();
    
    // Large modern planter
    const planter = new THREE.Mesh(
      new THREE.CylinderGeometry(0.6, 0.4, 0.8, 8),
      new THREE.MeshLambertMaterial({ color: 0x696969 })
    );
    planter.position.y = 0.4;
    planter.castShadow = true;
    plant.add(planter);
    
    // Large office plant
    const leaves = new THREE.Mesh(
      new THREE.SphereGeometry(0.8, 8, 6),
      new THREE.MeshLambertMaterial({ color: 0x228B22 })
    );
    leaves.position.y = 1.5;
    leaves.scale.set(1, 1.5, 1);
    leaves.castShadow = true;
    plant.add(leaves);
    
    return plant;
  }

  private addLobbyMemories(): void {
    // Reception desk memory
    if (this.receptionDesk) {
      this.addMemory(
        this.receptionDesk,
        "A typical corporate lobby. I always felt a bit nervous in these formal spaces.",
        { highlight: true }
      );
    }

    // Elevator memory and trigger
    if (this.elevatorDoor) {
      this.elevatorDoor.userData.isExitDoor = true;
      this.elevatorDoor.userData.nextScene = 'office-floor';
      
      this.addMemory(
        this.elevatorDoor,
        "The elevator to the office floors. Time to head up and start another day.",
        { highlight: true }
      );
    }
  }

  private setupGridMovementListener(): void {
    const handleGridMovement = (event: CustomEvent) => {
      const { position } = event.detail;
      console.log(`🚶‍♀️ Character moved to grid position: (${position.x}, ${position.z})`);
      
      // Check if character reached the elevator
      this.checkElevatorTrigger(position.x, position.z);
    };
    
    window.addEventListener('gridMoveComplete', handleGridMovement as EventListener);
    
    // Store reference to remove listener later
    (this as any).gridMovementListener = handleGridMovement;
  }

  // Check if character reached the elevator area
  private checkElevatorTrigger(gridX: number, gridZ: number): void {
    // Elevator is at world position (6, -7), which is grid position (3, -3.5)
    // Trigger when character is near the elevator
    if (gridX === 3 && (gridZ === -3 || gridZ === -4)) {
      console.log('🛗 Player reached elevator - triggering office floor transition');
      
      // Add elevator message
      window.dispatchEvent(new CustomEvent('elevatorReached', { 
        detail: { message: 'Taking the elevator up to the office...' }
      }));
      
      // Trigger the memory event that will cause scene transition after delay
      setTimeout(() => {
        if (this.elevatorDoor) {
          const event = {
            object: this.elevatorDoor,
            point: new THREE.Vector3(6, 0, -7),
            memory: {
              object: this.elevatorDoor,
              text: "The elevator to the office floors. Time to head up and start another day.",
              triggered: true
            }
          };
          
          // Dispatch the memory triggered event
          window.dispatchEvent(new CustomEvent('memoryTriggered', { detail: event }));
        }
      }, 2000); // 2 second delay for elevator effect
    }
  }

  protected registerColliders(): void {
    if (!this.collisionManager) {
      console.warn('No collision manager set for OfficeBuildingScene');
      return;
    }

    console.log('🏢 Registering office building lobby collisions');

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
    registerCollision('back-wall', 0, -8, 20, 0.3);
    registerCollision('front-wall-left', -6, 8, 8, 0.3);
    registerCollision('front-wall-right', 6, 8, 8, 0.3);
    registerCollision('left-wall', -10, 0, 0.3, 16);
    registerCollision('right-wall', 10, 0, 0.3, 16);

    // Register furniture
    registerCollision('reception-desk', 0, -5, 4, 1.5);
    registerCollision('seating-area', -4, 3, 6, 2);

    console.log('✅ Office building lobby collisions registered');
  }

  // Override unload to clean up event listener
  unload(): void {
    super.unload();
    
    // Remove the grid movement listener
    if ((this as any).gridMovementListener) {
      window.removeEventListener('gridMoveComplete', (this as any).gridMovementListener);
      (this as any).gridMovementListener = null;
    }
  }

  update(deltaTime: number): void {
    super.update(deltaTime);
    
    // Animate elevator light
    if (this.elevatorLight) {
      const time = Date.now() * 0.002;
      this.elevatorLight.intensity = 0.8 + Math.sin(time) * 0.2;
    }
  }
} 