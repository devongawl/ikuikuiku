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
    
    // Bed frame - brown wood
    const bedFrame = new THREE.Mesh(
      new THREE.BoxGeometry(3, 0.8, 2.5),
      new THREE.MeshBasicMaterial({ color: 0x8B4513 })
    );
    bedFrame.position.y = 0.4;
    bedGroup.add(bedFrame);
    
    // Mattress - off-white
    const mattress = new THREE.Mesh(
      new THREE.BoxGeometry(2.8, 0.4, 2.3),
      new THREE.MeshBasicMaterial({ color: 0xFFFAFA })
    );
    mattress.position.y = 1;
    bedGroup.add(mattress);
    
    // Pillow - light pink
    const pillow = new THREE.Mesh(
      new THREE.BoxGeometry(1, 0.3, 0.6),
      new THREE.MeshBasicMaterial({ color: 0xFFE4E1 })
    );
    pillow.position.set(0, 1.3, -0.8);
    bedGroup.add(pillow);
    
    // Blanket - light lavender
    const blanket = new THREE.Mesh(
      new THREE.BoxGeometry(2.6, 0.1, 2),
      new THREE.MeshBasicMaterial({ color: 0xE6E6FA })
    );
    blanket.position.set(0, 1.15, 0.15);
    bedGroup.add(blanket);
    
    bedGroup.position.set(x, 0, z);
    bedGroup.name = 'bed';
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
    // Bed memory
    const bed = this.getObjectByName('bed');
    if (bed) {
      this.addMemory(
        bed,
        "My warm bed... Maybe just five more minutes? No, I need to get to work.",
        { highlight: false }
      );
    }

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

    // Add paintings to walls
    this.addPaintings();
  }

  private addPaintings(): void {
    // Custom user artwork - kilk.jpeg in bedroom
    const kilkTexturePath = 'assets/paintings/kilk.jpeg'; // Try without leading slash
    console.log('Attempting to load painting from:', kilkTexturePath);
    console.log('Full URL would be:', window.location.origin + '/' + kilkTexturePath);
    
    // Test if image is accessible
    const testImg = new Image();
    testImg.onload = () => console.log('✅ Image loaded successfully via HTML Image element');
    testImg.onerror = (e) => console.error('❌ Image failed to load via HTML Image element:', e);
    testImg.src = kilkTexturePath;
    
    this.createPainting({
      position: { x: -6, y: 2.5, z: -3.5 }, // Moved further away from wall to prevent z-fighting
      size: { width: 1.5, height: 1 },
      texture: kilkTexturePath,
      name: 'kilk-artwork'
    });

    // Living room painting - warm orange
    this.createPainting({
      position: { x: 9, y: 2.5, z: 2 },
      size: { width: 2, height: 1.2 },
      color: 0xFF8C00, // Dark orange
      name: 'living-room-painting'
    });

    // Test painting next to bedroom - solid red color
    this.createPainting({
      position: { x: -3, y: 2.5, z: -3.5 }, // Also moved away from wall
      size: { width: 1, height: 1 },
      color: 0xFF0000, // Bright red for visibility
      name: 'test-painting'
    });

    // Kitchen painting - green nature
    this.createPainting({
      position: { x: -3, y: 2.2, z: -12 },
      size: { width: 1.2, height: 0.8 },
      color: 0x228B22, // Forest green
      name: 'kitchen-painting'
    });

    // Hallway painting - purple abstract
    this.createPainting({
      position: { x: 12, y: 2.8, z: -6 },
      size: { width: 1, height: 1.5 },
      color: 0x9932CC, // Dark orchid
      name: 'hallway-painting'
    });
  }

  private createPainting(config: {
    position: { x: number, y: number, z: number },
    size: { width: number, height: number },
    color?: number,
    texture?: string,
    name?: string
  }): void {
    const paintingGroup = new THREE.Group();

    // Frame
    const frameThickness = 0.05;
    const frameDepth = 0.1;
    
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(
        config.size.width + frameThickness * 2, 
        config.size.height + frameThickness * 2, 
        frameDepth
      ),
      new THREE.MeshBasicMaterial({ color: 0x8B4513 }) // Brown frame
    );
    paintingGroup.add(frame);

    // Canvas/artwork
    let canvasMaterial: THREE.Material;
    let canvas: THREE.Mesh;
    
    if (config.texture) {
      // Create initial material without texture - bright color for debugging
      canvasMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xFF00FF, // Bright magenta - very visible for debugging
        side: THREE.FrontSide,
        depthWrite: true,
        depthTest: true
      });
      
      // Create canvas mesh with plane geometry for better performance
      canvas = new THREE.Mesh(
        new THREE.PlaneGeometry(config.size.width, config.size.height),
        canvasMaterial
      );
      canvas.position.z = frameDepth / 2 + 0.02; // Position clearly in front of frame with more offset
      
      // Store reference to canvas for texture update
      const canvasMesh = canvas;
      const materialToUpdate = canvasMaterial as THREE.MeshBasicMaterial;
      
      // Load texture asynchronously
      const textureLoader = new THREE.TextureLoader();
      textureLoader.load(
        config.texture,
        // onLoad callback - texture loaded successfully
        (texture) => {
          console.log(`Successfully loaded texture: ${config.texture}`);
          console.log('Texture dimensions:', texture.image.width, 'x', texture.image.height);
          
          // Configure texture
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.generateMipmaps = true;
          texture.minFilter = THREE.LinearMipmapLinearFilter;
          texture.magFilter = THREE.LinearFilter;
          texture.wrapS = THREE.ClampToEdgeWrapping;
          texture.wrapT = THREE.ClampToEdgeWrapping;
          texture.anisotropy = 16; // Max anisotropy for better quality at angles
          texture.needsUpdate = true;
          
          // Update the existing material with the texture
          materialToUpdate.map = texture;
          materialToUpdate.color.setHex(0xFFFFFF); // Reset to white to show texture colors properly
          materialToUpdate.needsUpdate = true;
          materialToUpdate.transparent = false; // Ensure no transparency issues
          materialToUpdate.alphaTest = 0; // Disable alpha testing
          
          console.log('Material updated with texture');
        },
        // onProgress callback
        (xhr) => {
          console.log(`Loading ${config.texture}: ${(xhr.loaded / xhr.total * 100)}% loaded`);
        },
        // onError callback
        (error) => {
          console.error(`Failed to load texture: ${config.texture}`, error);
          // Keep gray color on error
        }
      );
    } else {
      // Use default color with MeshBasicMaterial for consistency
      canvasMaterial = new THREE.MeshBasicMaterial({ 
        color: config.color || 0xFFFFFF,
        side: THREE.FrontSide
      });
      
      canvas = new THREE.Mesh(
        new THREE.PlaneGeometry(config.size.width, config.size.height),
        canvasMaterial
      );
      canvas.position.z = frameDepth / 2 + 0.02; // Position clearly in front of frame with more offset
    }
    
    paintingGroup.add(canvas);

    // Position and rotate the painting based on wall orientation
    paintingGroup.position.set(config.position.x, config.position.y, config.position.z);
    
    // Determine wall orientation based on position
    // If z is close to -3.7 or -3.9, it's on the bedroom wall facing positive Z
    if (Math.abs(config.position.z + 3.7) < 0.5 || Math.abs(config.position.z + 3.9) < 0.5) {
      // No rotation needed - default orientation faces positive Z
    }
    // If z is close to -12, it's on the back wall
    else if (Math.abs(config.position.z + 12) < 0.5) {
      paintingGroup.rotation.y = Math.PI; // Face opposite direction
    }
    // If x is close to 12, it's on the right wall
    else if (Math.abs(config.position.x - 12) < 0.5) {
      paintingGroup.rotation.y = -Math.PI / 2; // Face left
    }
    // If x is close to -12, it's on the left wall
    else if (Math.abs(config.position.x + 12) < 0.5) {
      paintingGroup.rotation.y = Math.PI / 2; // Face right
    }

    if (config.name) {
      paintingGroup.name = config.name;
    }

    this.add(paintingGroup);
  }

  // Method to add custom PNG painting
  public addCustomPainting(
    position: { x: number, y: number, z: number },
    size: { width: number, height: number },
    texturePath: string,
    name?: string
  ): void {
    this.createPainting({
      position,
      size,
      texture: texturePath,
      name
    });
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