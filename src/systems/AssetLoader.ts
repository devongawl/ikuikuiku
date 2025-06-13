import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class AssetLoader {
  private gltfLoader: GLTFLoader;
  private textureLoader: THREE.TextureLoader;
  private loadedAssets: Map<string, any>;
  private loadingPromises: Map<string, Promise<any>>;

  constructor() {
    this.gltfLoader = new GLTFLoader();
    this.textureLoader = new THREE.TextureLoader();
    this.loadedAssets = new Map();
    this.loadingPromises = new Map();
  }

  async loadGLTF(path: string, name?: string): Promise<THREE.Group> {
    const assetName = name || path;
    
    // Check if already loaded
    if (this.loadedAssets.has(assetName)) {
      return this.loadedAssets.get(assetName).clone();
    }

    // Check if currently loading
    if (this.loadingPromises.has(assetName)) {
      const gltf = await this.loadingPromises.get(assetName);
      return gltf.scene.clone();
    }

    // Try multiple possible paths for better production compatibility
    const possiblePaths = [
      path,                           // Original path
      `./${path}`,                   // Explicit relative path
      `/ikuikuiku/${path}`,          // GitHub Pages base path
      `assets/${path.split('/').pop()}` // Try in assets folder
    ];

    // Start loading with fallback paths
    const loadPromise = new Promise<any>((resolve, reject) => {
      let currentAttempt = 0;
      
      const tryLoad = (currentPath: string) => {
        console.log(`Attempting to load GLTF from: ${currentPath}`);
        
        this.gltfLoader.load(
          currentPath,
          (gltf) => {
            // Store the original
            this.loadedAssets.set(assetName, gltf.scene);
            this.loadingPromises.delete(assetName);
            console.log(`✅ Successfully loaded: ${assetName} from ${currentPath}`);
            resolve(gltf);
          },
          (progress) => {
            // Progress logging commented out to reduce console noise
            // console.log(`Loading ${assetName}: ${(progress.loaded / progress.total * 100).toFixed(0)}%`);
          },
                     (error) => {
             const errorMessage = error instanceof Error ? error.message : String(error);
             console.warn(`❌ Failed to load ${assetName} from ${currentPath}:`, errorMessage);
             currentAttempt++;
            
            if (currentAttempt < possiblePaths.length) {
              // Try next path
              tryLoad(possiblePaths[currentAttempt]);
            } else {
              // All paths failed
              this.loadingPromises.delete(assetName);
              console.error(`❌ All attempts failed to load ${assetName}`);
              reject(new Error(`Failed to load ${assetName} from all attempted paths`));
            }
          }
        );
      };
      
      // Start with first path
      tryLoad(possiblePaths[currentAttempt]);
    });

    this.loadingPromises.set(assetName, loadPromise);
    const gltf = await loadPromise;
    
    // Return a clone so the original can be reused
    return gltf.scene.clone();
  }

  async loadTexture(path: string, name?: string): Promise<THREE.Texture> {
    const assetName = name || path;
    
    if (this.loadedAssets.has(assetName)) {
      return this.loadedAssets.get(assetName);
    }

    if (this.loadingPromises.has(assetName)) {
      return await this.loadingPromises.get(assetName);
    }

    // Try multiple possible paths for better production compatibility
    const possiblePaths = [
      path,                           // Original path
      `./${path}`,                   // Explicit relative path
      `/ikuikuiku/${path}`,          // GitHub Pages base path
      `assets/${path.split('/').pop()}` // Try in assets folder
    ];

    const loadPromise = new Promise<THREE.Texture>((resolve, reject) => {
      let currentAttempt = 0;
      
      const tryLoad = (currentPath: string) => {
        console.log(`Attempting to load texture from: ${currentPath}`);
        
        this.textureLoader.load(
          currentPath,
          (texture) => {
            texture.colorSpace = THREE.SRGBColorSpace;
            this.loadedAssets.set(assetName, texture);
            this.loadingPromises.delete(assetName);
            console.log(`✅ Successfully loaded texture: ${assetName} from ${currentPath}`);
            resolve(texture);
          },
          undefined,
          (error) => {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.warn(`❌ Failed to load texture ${assetName} from ${currentPath}:`, errorMessage);
            currentAttempt++;
            
            if (currentAttempt < possiblePaths.length) {
              // Try next path
              tryLoad(possiblePaths[currentAttempt]);
            } else {
              // All paths failed
              this.loadingPromises.delete(assetName);
              console.error(`❌ All attempts failed to load texture ${assetName}`);
              reject(new Error(`Failed to load texture ${assetName} from all attempted paths`));
            }
          }
        );
      };
      
      // Start with first path
      tryLoad(possiblePaths[currentAttempt]);
    });

    this.loadingPromises.set(assetName, loadPromise);
    return await loadPromise;
  }

  // Utility to scale and position loaded models
  static prepareModel(model: THREE.Group, scale: number = 1, position?: THREE.Vector3): THREE.Group {
    model.scale.setScalar(scale);
    
    if (position) {
      model.position.copy(position);
    }

    // Enable shadows for all meshes
    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    return model;
  }

  // Clear cached assets to free memory
  clearCache(): void {
    this.loadedAssets.forEach((asset, key) => {
      if (asset instanceof THREE.Texture) {
        asset.dispose();
      } else if (asset instanceof THREE.Group) {
        asset.traverse((child) => {
          if ('geometry' in child) (child as any).geometry?.dispose();
          if ('material' in child) {
            const materials = Array.isArray((child as any).material) 
              ? (child as any).material 
              : [(child as any).material];
            materials.forEach((mat: any) => mat?.dispose());
          }
        });
      }
    });
    
    this.loadedAssets.clear();
    this.loadingPromises.clear();
  }
} 