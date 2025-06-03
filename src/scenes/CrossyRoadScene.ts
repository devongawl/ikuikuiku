import * as THREE from 'three';
import { Scene } from './Scene';
import type { Memory } from '../types';

interface Vehicle {
  mesh: THREE.Group;
  speed: number;
  direction: number; // 1 for right, -1 for left
  initialX: number;
}

interface Row {
  type: 'grass' | 'road';
  y: number;
  vehicles?: Vehicle[];
  direction?: number;
}

export class CrossyRoadScene extends Scene {
  private rows: Row[] = [];
  private vehicles: Vehicle[] = [];
  private tileSize: number = 2; // Grid size matching GridMovementController
  private mapWidth: number = 32; // 16 tiles on each side
  private minVisibleRow: number = -5;
  private maxVisibleRow: number = 20;
  private officeBuildingRow: number = 18; // Goal row
  private officeDoor: THREE.Mesh | null = null;
  private rowUpdateThreshold: number = 10; // Add more rows when player is this close to the end

  constructor() {
    super('crossy-road', 'Outside - Getting to Work');
    this.generateInitialRows();
    
    // Listen for character movement to check for goal area
    this.setupGridMovementListener();
  }

  protected async loadAssets(): Promise<void> {
    try {
      // Set up lighting for outdoor scene
      this.setupLighting();
      
      // Generate the world
      this.generateWorld();
      
      // Add the office building at the goal
      this.createOfficeBuilding();
      
      console.log('CrossyRoadScene assets loaded successfully');
    } catch (error) {
      console.error('Failed to load CrossyRoadScene assets:', error);
    }
  }

  protected setupLighting(): void {
    // Bright daylight
    const sunLight = new THREE.DirectionalLight(0xFFFFB0, 1.5);
    sunLight.position.set(10, 20, 10);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 50;
    sunLight.shadow.camera.left = -25;
    sunLight.shadow.camera.right = 25;
    sunLight.shadow.camera.top = 25;
    sunLight.shadow.camera.bottom = -25;
    this.add(sunLight);

    // Ambient light for outdoor scene
    const ambientLight = new THREE.AmbientLight(0x87CEEB, 0.4);
    this.add(ambientLight);
  }

  private generateInitialRows(): void {
    // Generate starting area (safe grass)
    for (let i = -2; i <= 0; i++) {
      this.rows.push({
        type: 'grass',
        y: i
      });
    }

    // Generate road and grass rows
    for (let i = 1; i <= this.maxVisibleRow; i++) {
      this.rows.push(this.generateRow(i));
    }
  }

  private generateRow(rowIndex: number): Row {
    // More grass near the office
    if (rowIndex >= this.officeBuildingRow - 2) {
      return {
        type: 'grass',
        y: rowIndex
      };
    }

    // Random pattern of roads and grass
    const isRoad = Math.random() < 0.6; // 60% chance of road
    
    if (isRoad) {
      const direction = Math.random() < 0.5 ? 1 : -1;
      return {
        type: 'road',
        y: rowIndex,
        direction,
        vehicles: []
      };
    } else {
      return {
        type: 'grass',
        y: rowIndex
      };
    }
  }

  private generateWorld(): void {
    this.rows.forEach(row => {
      this.createRowVisuals(row);
      
      if (row.type === 'road') {
        this.spawnVehiclesForRow(row);
      }
    });
  }

  private createRowVisuals(row: Row): void {
    const geometry = new THREE.BoxGeometry(this.mapWidth, 0.1, this.tileSize);
    let material: THREE.Material;
    
    if (row.type === 'grass') {
      material = new THREE.MeshLambertMaterial({ color: 0x7FC241 });
    } else {
      material = new THREE.MeshLambertMaterial({ color: 0x444444 });
    }
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0, 0, row.y * this.tileSize);
    mesh.receiveShadow = true;
    this.add(mesh);

    // Add road markings for roads
    if (row.type === 'road') {
      this.addRoadMarkings(row);
    }
  }

  private addRoadMarkings(row: Row): void {
    // Center line - horizontal across the road
    const lineGeometry = new THREE.BoxGeometry(this.mapWidth, 0.11, 0.1);
    const lineMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
    const centerLine = new THREE.Mesh(lineGeometry, lineMaterial);
    centerLine.position.set(0, 0.01, row.y * this.tileSize);
    this.add(centerLine);

    // Dashed lines on sides of the road
    for (let x = -this.mapWidth/2; x < this.mapWidth/2; x += 4) {
      const dash = new THREE.Mesh(
        new THREE.BoxGeometry(2, 0.11, 0.05),
        lineMaterial.clone()
      );
      dash.position.set(x, 0.01, row.y * this.tileSize + this.tileSize/2 - 0.2);
      this.add(dash);
      
      const dash2 = new THREE.Mesh(
        new THREE.BoxGeometry(2, 0.11, 0.05),
        lineMaterial.clone()
      );
      dash2.position.set(x, 0.01, row.y * this.tileSize - this.tileSize/2 + 0.2);
      this.add(dash2);
    }
  }

  private spawnVehiclesForRow(row: Row): void {
    if (row.type !== 'road' || !row.direction) return;

    const numVehicles = Math.floor(Math.random() * 3) + 1; // 1-3 vehicles
    const minSpacing = 8;

    for (let i = 0; i < numVehicles; i++) {
      const vehicle = this.createVehicle(row.direction);
      
      // Position vehicles with spacing along the road (X axis)
      const startX = row.direction === 1 ? -this.mapWidth/2 - 10 : this.mapWidth/2 + 10;
      vehicle.mesh.position.set(
        startX - (i * minSpacing * row.direction),
        0.5, // Y height above ground
        row.y * this.tileSize // Z position on the road
      );
      
      vehicle.initialX = vehicle.mesh.position.x;
      
      this.add(vehicle.mesh);
      this.vehicles.push(vehicle);
      
      if (!row.vehicles) row.vehicles = [];
      row.vehicles.push(vehicle);
    }
  }

  private createVehicle(direction: number): Vehicle {
    const vehicle = new THREE.Group();
    
    // Random vehicle type
    const vehicleType = Math.random() < 0.7 ? 'car' : 'truck';
    const colors = [0xFF4444, 0x4444FF, 0x44FF44, 0xFFFF44, 0xFF44FF, 0x44FFFF];
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    if (vehicleType === 'car') {
      // Car body - oriented for X-axis movement
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(3, 0.75, 1.5), // Length along X, width along Z
        new THREE.MeshLambertMaterial({ color })
      );
      body.position.y = 0.375;
      body.castShadow = true;
      vehicle.add(body);
      
      // Car roof
      const roof = new THREE.Mesh(
        new THREE.BoxGeometry(1.6, 0.6, 1.2), // Smaller roof, oriented correctly
        new THREE.MeshLambertMaterial({ color: 0xCCCCCC })
      );
      roof.position.set(-0.3, 0.75, 0); // Positioned toward back of car
      roof.castShadow = true;
      vehicle.add(roof);
      
      // Wheels - positioned at car corners
      const wheelPositions = [
        { x: -1.2, z: -0.6 }, // Back left
        { x: -1.2, z: 0.6 },  // Back right
        { x: 1.2, z: -0.6 },  // Front left
        { x: 1.2, z: 0.6 }    // Front right
      ];
      
      wheelPositions.forEach(pos => {
        const wheel = new THREE.Mesh(
          new THREE.CylinderGeometry(0.25, 0.25, 0.2, 8),
          new THREE.MeshLambertMaterial({ color: 0x333333 })
        );
        wheel.position.set(pos.x, 0.25, pos.z);
        wheel.rotation.z = Math.PI / 2; // Rotate to be vertical
        wheel.castShadow = true;
        vehicle.add(wheel);
      });
    } else {
      // Truck body - oriented for X-axis movement
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(4.5, 1, 1.8), // Length along X, width along Z
        new THREE.MeshLambertMaterial({ color })
      );
      body.position.y = 0.5;
      body.castShadow = true;
      vehicle.add(body);
      
      // Truck cabin
      const cabin = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 1, 1.5),
        new THREE.MeshLambertMaterial({ color: 0x666666 })
      );
      cabin.position.set(1.8, 0.8, 0); // Front of truck
      cabin.castShadow = true;
      vehicle.add(cabin);
      
      // Truck wheels
      const wheelPositions = [
        { x: -1.8, z: -0.7 }, // Back left
        { x: -1.8, z: 0.7 },  // Back right
        { x: 0.3, z: -0.7 },  // Middle left
        { x: 0.3, z: 0.7 },   // Middle right
        { x: 1.8, z: -0.7 },  // Front left
        { x: 1.8, z: 0.7 }    // Front right
      ];
      
      wheelPositions.forEach(pos => {
        const wheel = new THREE.Mesh(
          new THREE.CylinderGeometry(0.3, 0.3, 0.2, 8),
          new THREE.MeshLambertMaterial({ color: 0x333333 })
        );
        wheel.position.set(pos.x, 0.3, pos.z);
        wheel.rotation.z = Math.PI / 2; // Rotate to be vertical
        wheel.castShadow = true;
        vehicle.add(wheel);
      });
    }
    
    // Set rotation based on direction - rotate around Y axis for X-axis movement
    if (direction === -1) {
      vehicle.rotation.y = Math.PI; // 180 degrees - facing left
    }
    // If direction === 1, no rotation needed (facing right by default)
    
    const speed = (Math.random() * 2 + 1) * direction; // Speed between 1-3 units/second
    
    return {
      mesh: vehicle,
      speed,
      direction,
      initialX: 0
    };
  }

  private createOfficeBuilding(): void {
    // Create a simple golden goal area instead of a building
    const goalArea = new THREE.Mesh(
      new THREE.BoxGeometry(4, 0.1, 4), // 4x4 area, thin height
      new THREE.MeshLambertMaterial({ 
        color: 0xFFD700, // Gold color
        transparent: true,
        opacity: 0.8
      })
    );
    goalArea.position.set(0, 0.05, this.officeBuildingRow * this.tileSize);
    goalArea.receiveShadow = true;
    goalArea.name = 'goal-area';
    this.add(goalArea);

    // Add a glowing border effect
    const goalBorder = new THREE.Mesh(
      new THREE.BoxGeometry(4.2, 0.12, 4.2), // Slightly larger
      new THREE.MeshLambertMaterial({ 
        color: 0xFFFF00, // Bright yellow border
        transparent: true,
        opacity: 0.6
      })
    );
    goalBorder.position.set(0, 0.04, this.officeBuildingRow * this.tileSize);
    this.add(goalBorder);

    // Add a pulsing light above the goal area
    const goalLight = new THREE.PointLight(0xFFD700, 1.5, 8);
    goalLight.position.set(0, 3, this.officeBuildingRow * this.tileSize);
    this.add(goalLight);

    // Add some visual indicators - small pillars at corners
    const pillarPositions = [
      { x: -1.8, z: -1.8 },
      { x: 1.8, z: -1.8 },
      { x: -1.8, z: 1.8 },
      { x: 1.8, z: 1.8 }
    ];

    pillarPositions.forEach(pos => {
      const pillar = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 2, 0.3),
        new THREE.MeshLambertMaterial({ color: 0xFFD700 })
      );
      pillar.position.set(pos.x, 1, this.officeBuildingRow * this.tileSize + pos.z);
      pillar.castShadow = true;
      this.add(pillar);
    });

    // Create the office door reference for the memory system
    this.officeDoor = goalArea; // Use the goal area as the door trigger
    this.officeDoor.userData.isExitDoor = true;
    this.officeDoor.userData.nextScene = 'office-building';
    
    // Add memory to the goal area
    this.addMemory(
      this.officeDoor,
      "Made it to the office building! Time to head inside.",
      { highlight: true }
    );
  }

  private checkPlayerVehicleCollision(): boolean {
    // Get player position from character controller (if available)
    // For now, we'll need to get this from the game's character controller
    // This is a placeholder - the actual collision detection will be handled
    // by the character controller checking against vehicle positions
    return false;
  }

  public getVehiclePositions(): { x: number, y: number, width: number, height: number }[] {
    return this.vehicles.map(vehicle => ({
      x: vehicle.mesh.position.x,
      y: vehicle.mesh.position.z, // Use Z position for collision detection
      width: 3, // Approximate vehicle width
      height: 1.5 // Approximate vehicle height
    }));
  }

  protected registerColliders(): void {
    if (!this.collisionManager) {
      console.warn('No collision manager set for CrossyRoadScene');
      return;
    }

    console.log('🚧 Registering CrossyRoadScene collision system');
    
    // Note: Vehicle collisions are handled dynamically in the update loop
    // We don't register static colliders for vehicles since they move
    
    // No static colliders needed for the goal area - it should be accessible
    // The goal area detection is handled by grid position checking
    
    console.log('✅ CrossyRoadScene collision system ready (no static colliders needed)');
  }

  update(deltaTime: number): void {
    super.update(deltaTime);
    
    // Update vehicle positions
    this.vehicles.forEach(vehicle => {
      vehicle.mesh.position.x += vehicle.speed * deltaTime;
      
      // Reset vehicles that have gone off screen
      const maxDistance = this.mapWidth / 2 + 15;
      if (Math.abs(vehicle.mesh.position.x) > maxDistance) {
        vehicle.mesh.position.x = vehicle.direction === 1 ? 
          -maxDistance : maxDistance;
      }
    });
    
    // Animate the goal area with pulsing effect
    const goalArea = this.getObjectByName('goal-area');
    if (goalArea) {
      const time = Date.now() * 0.003;
      const pulse = 1 + Math.sin(time) * 0.15; // Gentle pulsing between 0.85 and 1.15
      goalArea.scale.setScalar(pulse);
      
      // Also pulse the opacity
      const material = (goalArea as THREE.Mesh).material as THREE.MeshLambertMaterial;
      material.opacity = 0.6 + Math.sin(time * 1.5) * 0.2; // Opacity between 0.4 and 0.8
    }
    
    // Check for collisions with vehicles
    // This would need to be integrated with the character controller
    // The character controller should call getVehiclePositions() and check for overlaps
  }

  private setupGridMovementListener(): void {
    const handleGridMovement = (event: CustomEvent) => {
      const { position } = event.detail;
      console.log(`🚶‍♀️ Character moved to grid position: (${position.x}, ${position.z})`);
      
      // Check if character reached the goal area
      this.checkGoalAreaTrigger(position.x, position.z);
    };
    
    window.addEventListener('gridMoveComplete', handleGridMovement as EventListener);
    
    // Store reference to remove listener later
    (this as any).gridMovementListener = handleGridMovement;
  }

  // Check if character reached the goal area
  private checkGoalAreaTrigger(gridX: number, gridZ: number): void {
    // Goal area is at world position (0, officeBuildingRow * tileSize)
    // Which translates to grid position (0, officeBuildingRow)
    const goalGridZ = this.officeBuildingRow;
    
    // Trigger if character is on or near the goal area (2x2 grid squares)
    if (Math.abs(gridX) <= 1 && Math.abs(gridZ - goalGridZ) <= 1) {
      console.log('🎯 Player reached goal area - triggering office scene transition');
      
      // Add a brief celebration message
      window.dispatchEvent(new CustomEvent('goalReached', { 
        detail: { message: 'Safely crossed the street!' }
      }));
      
      // Trigger the memory event that will cause scene transition after delay
      setTimeout(() => {
        if (this.officeDoor) {
          const event = {
            object: this.officeDoor,
            point: new THREE.Vector3(0, 0, this.officeBuildingRow * this.tileSize),
            memory: {
              object: this.officeDoor,
              text: "Made it to the office building! Time to head inside.",
              triggered: true
            }
          };
          
          // Dispatch the memory triggered event
          window.dispatchEvent(new CustomEvent('memoryTriggered', { detail: event }));
        }
      }, 1500); // 1.5 second delay for celebration
    }
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
} 