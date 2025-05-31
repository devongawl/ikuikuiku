import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { AssetLoader } from './AssetLoader';
import { GridMovementController } from './GridMovementController';
import { CollisionManager } from './CollisionManager';

export class KenneyCharacterController {
  private character: THREE.Group | null = null;
  private mixer: THREE.AnimationMixer | null = null;
  private assetLoader: AssetLoader;
  private gridMovement: GridMovementController;

  constructor(assetLoader: AssetLoader) {
    this.assetLoader = assetLoader;
    this.gridMovement = new GridMovementController();
  }

  setCollisionManager(collisionManager: CollisionManager): void {
    this.gridMovement.setCollisionManager(collisionManager);
  }

  async loadCharacter(skinTexturePath?: string): Promise<THREE.Group> {
    try {
      // Load the basic character model
      const characterPath = 'kenney_blocky-characters/Models/Non-rigged/glTF/basicCharacter.gltf';
      this.character = await this.assetLoader.loadGLTF(characterPath, 'player-character');
      
      // Scale the character to be more visible
      this.character.scale.setScalar(0.05); // Increased from 0.01
      
      // Apply custom skin if provided
      if (skinTexturePath) {
        const texture = await this.assetLoader.loadTexture(skinTexturePath);
        texture.flipY = false; // GLTF textures don't need flipping
        
        this.character.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.material = new THREE.MeshLambertMaterial({
              map: texture,
              color: 0xffffff
            });
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
      }

      // Position character above ground
      this.character.position.y = 0;
      
      // Set character in grid movement controller
      this.gridMovement.setCharacter(this.character);
      
      return this.character;
    } catch (error) {
      console.error('Failed to load character:', error);
      // Fallback to a simple cube character
      return this.createFallbackCharacter();
    }
  }

  private createFallbackCharacter(): THREE.Group {
    const group = new THREE.Group();
    
    console.warn('Using fallback character - Kenney model failed to load');
    
    // Simple cube character as fallback - made larger
    const geometry = new THREE.BoxGeometry(1, 2, 1);
    const material = new THREE.MeshLambertMaterial({ color: 0xFFB6C1 });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = 1; // Half the height to sit on ground
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    // Add a simple face
    const eyeGeometry = new THREE.SphereGeometry(0.1, 8, 8);
    const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.2, 0.3, 0.5);
    mesh.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.2, 0.3, 0.5);
    mesh.add(rightEye);
    
    group.add(mesh);
    this.character = group;
    
    // Set character in grid movement controller
    this.gridMovement.setCharacter(group);
    
    return group;
  }

  update(deltaTime: number, camera: THREE.Camera): void {
    if (!this.character) return;

    // Update grid movement
    this.gridMovement.update(deltaTime);

    // Update animations if mixer exists
    if (this.mixer) {
      this.mixer.update(deltaTime);
    }
  }

  getCharacter(): THREE.Group | null {
    return this.character;
  }

  getPosition(): THREE.Vector3 {
    return this.gridMovement.getWorldPosition();
  }

  // Get smooth position for camera (without hop animation)
  getSmoothPosition(): THREE.Vector3 {
    return this.gridMovement.getSmoothWorldPosition();
  }

  setPosition(x: number, y: number, z: number): void {
    // Convert world position to grid position
    // Assuming grid size of 2 units
    const gridX = Math.round(x / 2);
    const gridZ = Math.round(z / 2);
    console.log(`Setting position: World (${x}, ${y}, ${z}) -> Grid (${gridX}, ${gridZ})`);
    this.gridMovement.setGridPosition(gridX, gridZ);
  }

  // New methods for grid-based movement
  getGridPosition() {
    return this.gridMovement.getGridPosition();
  }

  isMoving(): boolean {
    return this.gridMovement.isMoving();
  }

  getQueueLength(): number {
    return this.gridMovement.getQueueLength();
  }

  // Bed interaction methods
  setBedPosition(x: number, z: number): void {
    this.gridMovement.setBedPosition(x, z);
  }

  setInBed(inBed: boolean): void {
    this.gridMovement.setInBed(inBed);
  }

  async loadFBXCharacter(modelPath: string, texturePath?: string): Promise<THREE.Group> {
    try {
      console.log('Loading FBX character from:', modelPath);
      
      const fbxLoader = new FBXLoader();
      
      // Load the FBX model
      const fbxModel = await new Promise<THREE.Group>((resolve, reject) => {
        fbxLoader.load(
          modelPath,
          (object) => {
            console.log('FBX model loaded successfully');
            resolve(object);
          },
          (progress) => {
            console.log('FBX loading progress:', (progress.loaded / progress.total * 100) + '%');
          },
          (error) => {
            console.error('FBX loading error:', error);
            reject(error);
          }
        );
      });

      // Scale the character appropriately
      fbxModel.scale.setScalar(0.002); // Reduced from 0.01 - much smaller for scene proportion
      
      // Apply custom texture if provided
      if (texturePath) {
        const textureLoader = new THREE.TextureLoader();
        const texture = await new Promise<THREE.Texture>((resolve, reject) => {
          textureLoader.load(
            texturePath,
            (tex) => {
              console.log('Texture loaded successfully:', texturePath);
              resolve(tex);
            },
            undefined,
            (error) => {
              console.error('Texture loading error:', error);
              reject(error);
            }
          );
        });

        // Apply texture to all meshes
        fbxModel.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.material = new THREE.MeshLambertMaterial({
              map: texture,
              color: 0xffffff
            });
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
      }

      // Handle animations if present
      if (fbxModel.animations && fbxModel.animations.length > 0) {
        console.log('Found animations:', fbxModel.animations.length);
        this.mixer = new THREE.AnimationMixer(fbxModel);
        
        // You can add specific animation handling here
        // For example, idle animation:
        // const idleAction = this.mixer.clipAction(fbxModel.animations[0]);
        // idleAction.play();
      }

      // Position character above ground
      fbxModel.position.y = 0;
      
      this.character = fbxModel;
      
      // Set character in grid movement controller
      this.gridMovement.setCharacter(this.character);
      
      return this.character;
    } catch (error) {
      console.error('Failed to load FBX character:', error);
      // Fallback to regular character loading
      return this.loadCharacter();
    }
  }
} 