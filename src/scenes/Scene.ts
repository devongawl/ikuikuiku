import * as THREE from 'three';
import type { Memory } from '../types';

export class Scene extends THREE.Group {
  public name: string;
  public description: string;
  protected interactables: THREE.Object3D[];
  protected memories: Memory[];
  protected loaded: boolean;

  constructor(name: string, description: string) {
    super();
    this.name = name;
    this.description = description;
    this.interactables = [];
    this.memories = [];
    this.loaded = false;
  }

  // Called when scene is about to be shown
  async load(): Promise<void> {
    if (this.loaded) return;
    
    // Add ground plane
    this.createGround();
    
    // Add basic lighting
    this.setupLighting();
    
    // Override in child classes to load specific assets
    await this.loadAssets();
    
    this.loaded = true;
  }

  // Called when scene is being removed
  unload(): void {
    // Clean up resources
    this.traverse(child => {
      if ('geometry' in child && child.geometry) {
        (child.geometry as THREE.BufferGeometry).dispose();
      }
      if ('material' in child && child.material) {
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach((material: THREE.Material) => material.dispose());
      }
    });
    
    this.interactables = [];
    this.memories = [];
    this.loaded = false;
  }

  protected createGround(): void {
    const groundSize = 100;
    const groundGeometry = new THREE.PlaneGeometry(groundSize, groundSize);
    const groundMaterial = new THREE.MeshLambertMaterial({ 
      color: 0xF5F5DC // Beige base color from our palette
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.receiveShadow = true;
    ground.name = 'ground';
    ground.rotation.x = -Math.PI / 2; // Rotate to be horizontal
    this.add(ground);
  }

  protected setupLighting(): void {
    // Ambient light for base illumination
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.add(ambientLight);

    // Directional light for shadows
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 10, 5);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.1;
    dirLight.shadow.camera.far = 50;
    dirLight.shadow.camera.left = -20;
    dirLight.shadow.camera.right = 20;
    dirLight.shadow.camera.top = 20;
    dirLight.shadow.camera.bottom = -20;
    this.add(dirLight);
  }

  // Override this in child classes
  protected async loadAssets(): Promise<void> {
    // Load scene-specific models, textures, etc.
  }

  // Add an interactive memory point
  protected addMemory(object: THREE.Object3D, text: string, options: Partial<Memory> = {}): Memory {
    const memory: Memory = {
      object,
      text,
      triggered: false,
      ...options
    };
    
    this.memories.push(memory);
    this.interactables.push(object);
    
    // Add glow or highlight to indicate it's interactive
    if (options.highlight !== false) {
      this.addInteractiveGlow(object);
    }
    
    return memory;
  }

  private addInteractiveGlow(object: THREE.Object3D): void {
    // Add a subtle pulsing glow effect
    object.userData.glowIntensity = 0;
    object.userData.isInteractive = true;
  }

  // Called every frame
  update(deltaTime: number): void {
    // Update any animated elements
    this.updateInteractiveGlows(deltaTime);
  }

  private updateInteractiveGlows(deltaTime: number): void {
    const time = Date.now() * 0.001;
    
    this.interactables.forEach(object => {
      if (object.userData.isInteractive) {
        // Pulsing glow effect
        const intensity = (Math.sin(time * 2) + 1) * 0.5;
        object.userData.glowIntensity = intensity;
        
        // You can add actual glow rendering here
        // For now, we'll just scale slightly
        const scale = 1 + intensity * 0.05;
        object.scale.setScalar(scale);
      }
    });
  }

  // Check if a point intersects with any interactable
  checkInteraction(raycaster: THREE.Raycaster): Memory | null {
    const intersects = raycaster.intersectObjects(this.interactables, true);
    
    if (intersects.length > 0) {
      const intersectedObject = intersects[0].object;
      const memory = this.memories.find(m => 
        m.object === intersectedObject || 
        (m.object instanceof THREE.Group && m.object.children.includes(intersectedObject))
      );
      
      if (memory && !memory.triggered) {
        memory.triggered = true;
        return memory;
      }
    }
    
    return null;
  }
} 