import * as THREE from 'three';
import { Scene } from './Scene';
import { AssetLoader } from '../systems/AssetLoader';
import type { Memory } from '../types';

export class ApartmentScene extends Scene {
  private assetLoader: AssetLoader;
  private exitDoor: THREE.Mesh | null = null;

  constructor() {
    super('apartment-scene', 'Tuesday Morning - Her Apartment');
    this.assetLoader = new AssetLoader();
  }

  protected async loadAssets(): Promise<void> {
    try {
      // Set a warm morning atmosphere
      const ground = this.getObjectByName('ground') as THREE.Mesh;
      if (ground) {
        (ground.material as THREE.MeshLambertMaterial).color.setHex(0xF5DEB3); // Warm beige floor
      }

      // Add warm morning light
      this.adjustLighting();

      // Create the apartment layout
      await this.createApartmentLayout();
      
      // Add interactive memories
      this.addApartmentMemories();
      
      // Add decorative details
      this.addDetails();
      
    } catch (error) {
      console.error('Failed to load apartment scene:', error);
    }
  }

  private adjustLighting(): void {
    // Add warm morning sunlight
    const morningLight = new THREE.DirectionalLight(0xFFE4B5, 1.2);
    morningLight.position.set(5, 10, 5);
    morningLight.castShadow = true;
    morningLight.shadow.camera.left = -20;
    morningLight.shadow.camera.right = 20;
    morningLight.shadow.camera.top = 20;
    morningLight.shadow.camera.bottom = -20;
    this.add(morningLight);

    // Warm ambient light
    const ambient = this.getObjectByName('ambientLight') as THREE.AmbientLight;
    if (ambient) {
      ambient.intensity = 0.6;
      ambient.color.setHex(0xFFF8DC); // Cornsilk color for warm morning
    }
  }

  private async createApartmentLayout(): Promise<void> {
    // Create walls to define rooms
    this.createWalls();
    
    // Bedroom area (starting position)
    this.createBedroom(-6, 0);
    
    // Bathroom
    this.createBathroom(-6, -8);
    
    // Kitchen
    this.createKitchen(0, -8);
    
    // Living room with exit
    this.createLivingRoom(6, 0);
  }

  private createWalls(): void {
    const wallMaterial = new THREE.MeshLambertMaterial({ color: 0xFFF8DC });
    const wallHeight = 4;
    const wallThickness = 0.3;

    // Apartment boundary walls
    const walls = [
      // Back wall
      { x: 0, z: -12, width: 24, depth: wallThickness },
      // Front wall (with gap for exit)
      { x: -6, z: 8, width: 12, depth: wallThickness },
      { x: 9, z: 8, width: 6, depth: wallThickness },
      // Side walls
      { x: -12, z: -2, width: wallThickness, depth: 20 },
      { x: 12, z: -2, width: wallThickness, depth: 20 },
      
      // Interior walls
      // Bedroom-bathroom wall
      { x: -6, z: -4, width: 8, depth: wallThickness },
      // Kitchen-living room separator
      { x: 3, z: -4, width: wallThickness, depth: 8 },
    ];

    walls.forEach(wall => {
      const geometry = new THREE.BoxGeometry(wall.width, wallHeight, wall.depth);
      const mesh = new THREE.Mesh(geometry, wallMaterial);
      mesh.position.set(wall.x, wallHeight / 2, wall.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.add(mesh);
    });
  }

  private createBedroom(x: number, z: number): void {
    // Bed
    const bedGroup = new THREE.Group();
    
    // Bed frame
    const bedFrame = new THREE.Mesh(
      new THREE.BoxGeometry(4, 0.5, 3),
      new THREE.MeshLambertMaterial({ color: 0x8B4513 })
    );
    bedFrame.position.y = 0.25;
    bedFrame.castShadow = true;
    bedGroup.add(bedFrame);
    
    // Mattress
    const mattress = new THREE.Mesh(
      new THREE.BoxGeometry(3.8, 0.3, 2.8),
      new THREE.MeshLambertMaterial({ color: 0xFFFAFA })
    );
    mattress.position.y = 0.65;
    bedGroup.add(mattress);
    
    // Pillow
    const pillow = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 0.2, 0.8),
      new THREE.MeshLambertMaterial({ color: 0xFFE4E1 })
    );
    pillow.position.set(0, 0.9, -1);
    bedGroup.add(pillow);
    
    bedGroup.position.set(x, 0, z);
    this.add(bedGroup);

    // Nightstand with design sketches
    const nightstand = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshLambertMaterial({ color: 0x8B4513 })
    );
    nightstand.position.set(x + 3, 0.5, z);
    nightstand.castShadow = true;
    this.add(nightstand);

    // Design sketches on nightstand
    const sketches = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.02, 0.6),
      new THREE.MeshLambertMaterial({ color: 0xFFFFFF })
    );
    sketches.position.set(x + 3, 1.01, z);
    sketches.name = 'design-sketches';
    this.add(sketches);

    // Calendar on wall
    const calendar = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1.5, 0.1),
      new THREE.MeshLambertMaterial({ color: 0xFFFFFF })
    );
    calendar.position.set(x, 2.5, z - 3.9);
    calendar.name = 'calendar';
    this.add(calendar);
  }

  private createBathroom(x: number, z: number): void {
    // Simple bathroom representation
    const door = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 3, 0.1),
      new THREE.MeshLambertMaterial({ color: 0x654321 })
    );
    door.position.set(x, 1.5, z + 4);
    this.add(door);
  }

  private createKitchen(x: number, z: number): void {
    // Kitchen counter
    const counter = new THREE.Mesh(
      new THREE.BoxGeometry(6, 1, 2),
      new THREE.MeshLambertMaterial({ color: 0xD3D3D3 })
    );
    counter.position.set(x, 0.5, z);
    counter.castShadow = true;
    this.add(counter);

    // Coffee maker
    const coffeeMaker = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.7, 0.5),
      new THREE.MeshLambertMaterial({ color: 0x2F4F4F })
    );
    coffeeMaker.position.set(x - 2, 1.35, z);
    coffeeMaker.castShadow = true;
    this.add(coffeeMaker);

    // Coffee mug
    const mug = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.15, 0.3, 8),
      new THREE.MeshLambertMaterial({ color: 0xFFB6C1 }) // Pink mug
    );
    mug.position.set(x - 1.5, 1.15, z);
    mug.name = 'coffee-mug';
    mug.castShadow = true;
    this.add(mug);

    // Kitchen table
    const table = new THREE.Mesh(
      new THREE.BoxGeometry(3, 0.1, 2),
      new THREE.MeshLambertMaterial({ color: 0x8B4513 })
    );
    table.position.set(x, 1, z + 4);
    table.castShadow = true;
    this.add(table);

    // Table legs
    const legPositions = [
      { x: -1.3, z: -0.8 },
      { x: 1.3, z: -0.8 },
      { x: -1.3, z: 0.8 },
      { x: 1.3, z: 0.8 }
    ];
    
    legPositions.forEach(pos => {
      const leg = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 1, 0.1),
        new THREE.MeshLambertMaterial({ color: 0x8B4513 })
      );
      leg.position.set(x + pos.x, 0.5, z + 4 + pos.z);
      leg.castShadow = true;
      this.add(leg);
    });
  }

  private createLivingRoom(x: number, z: number): void {
    // Couch
    const couchGroup = new THREE.Group();
    
    // Couch base
    const couchBase = new THREE.Mesh(
      new THREE.BoxGeometry(4, 0.8, 2),
      new THREE.MeshLambertMaterial({ color: 0x4682B4 })
    );
    couchBase.position.y = 0.4;
    couchBase.castShadow = true;
    couchGroup.add(couchBase);
    
    // Couch back
    const couchBack = new THREE.Mesh(
      new THREE.BoxGeometry(4, 1.2, 0.5),
      new THREE.MeshLambertMaterial({ color: 0x4682B4 })
    );
    couchBack.position.set(0, 1, -0.75);
    couchBack.castShadow = true;
    couchGroup.add(couchBack);
    
    couchGroup.position.set(x, 0, z);
    this.add(couchGroup);

    // Coffee table
    const coffeeTable = new THREE.Mesh(
      new THREE.BoxGeometry(2, 0.5, 1),
      new THREE.MeshLambertMaterial({ color: 0x8B4513 })
    );
    coffeeTable.position.set(x, 0.25, z + 2);
    coffeeTable.castShadow = true;
    this.add(coffeeTable);

    // Exit door
    this.exitDoor = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 3.5, 0.2),
      new THREE.MeshLambertMaterial({ color: 0x8B4513 })
    );
    this.exitDoor.position.set(x, 1.75, z + 7.9);
    this.exitDoor.name = 'exit-door';
    this.add(this.exitDoor);

    // Door handle
    const handle = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.3, 0.1),
      new THREE.MeshLambertMaterial({ color: 0xFFD700 })
    );
    handle.position.set(x + 0.7, 1.5, z + 8.05);
    this.add(handle);
  }

  private addApartmentMemories(): void {
    // Coffee mug memory
    const mug = this.getObjectByName('coffee-mug');
    if (mug) {
      this.addMemory(
        mug,
        "Just another Tuesday morning... I needed my usual coffee to start the day.",
        {
          highlight: true,
          animation: () => {
            mug.rotation.y += 0.02;
          }
        }
      );
    }

    // Design sketches memory
    const sketches = this.getObjectByName('design-sketches');
    if (sketches) {
      this.addMemory(
        sketches,
        "The new app redesign was coming along. I was excited to show the team my latest ideas.",
        { highlight: true }
      );
    }

    // Calendar memory
    const calendar = this.getObjectByName('calendar');
    if (calendar) {
      this.addMemory(
        calendar,
        "September 15th. Nothing special planned. Just another day at the office... or so I thought.",
        { highlight: true }
      );
    }

    // Exit door trigger
    if (this.exitDoor) {
      this.exitDoor.userData.isExitDoor = true;
      this.exitDoor.userData.nextScene = 'office-building';
      
      this.addMemory(
        this.exitDoor,
        "Time to head to work. The commute was always a good time to think about the day ahead.",
        { highlight: true }
      );
    }
  }

  private addDetails(): void {
    // Add some plants for life
    const plantPositions = [
      { x: -9, z: 3 },
      { x: 3, z: -10 },
      { x: 9, z: -5 }
    ];

    plantPositions.forEach(pos => {
      const plant = this.createPlant();
      plant.position.set(pos.x, 0, pos.z);
      this.add(plant);
    });

    // Add a rug in living room
    const rug = new THREE.Mesh(
      new THREE.BoxGeometry(5, 0.02, 3),
      new THREE.MeshLambertMaterial({ color: 0xDC143C })
    );
    rug.position.set(6, 0.01, 0);
    this.add(rug);
  }

  private createPlant(): THREE.Group {
    const plant = new THREE.Group();
    
    // Pot
    const pot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.2, 0.4, 8),
      new THREE.MeshLambertMaterial({ color: 0x8B4513 })
    );
    pot.position.y = 0.2;
    pot.castShadow = true;
    plant.add(pot);
    
    // Plant
    const leaves = new THREE.Mesh(
      new THREE.SphereGeometry(0.4, 8, 6),
      new THREE.MeshLambertMaterial({ color: 0x228B22 })
    );
    leaves.position.y = 0.7;
    leaves.scale.y = 1.2;
    leaves.castShadow = true;
    plant.add(leaves);
    
    return plant;
  }

  update(deltaTime: number): void {
    super.update(deltaTime);
  }
} 