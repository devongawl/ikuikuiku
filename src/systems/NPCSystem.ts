import * as THREE from 'three';
import { AssetLoader } from './AssetLoader';

export interface NPCConfig {
  name: string;
  position: THREE.Vector3;
  modelType?: 'basic' | 'advanced';
  hairColor?: number;
  outfitColor?: number;
  idleAnimation?: boolean;
}

export class NPC {
  public group: THREE.Group;
  public name: string;
  public nameLabel: THREE.Sprite;
  private model: THREE.Group | null = null;
  private idleAnimation: boolean;
  private idleTime: number = 0;

  constructor(config: NPCConfig) {
    this.group = new THREE.Group();
    this.name = config.name;
    this.idleAnimation = config.idleAnimation ?? true;
    
    // Create name label
    this.nameLabel = this.createNameLabel(config.name);
    this.group.add(this.nameLabel);
    console.log(`Created name label for ${config.name}:`, this.nameLabel);
    
    // Set position
    this.group.position.copy(config.position);
  }

  private createNameLabel(name: string): THREE.Sprite {
    // Create canvas for text
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    canvas.width = 512;
    canvas.height = 128;

    // Clear the canvas
    context.clearRect(0, 0, canvas.width, canvas.height);
    
    // Create background with transparency
    context.fillStyle = 'rgba(0, 0, 0, 0.7)';
    context.fillRect(10, 10, canvas.width - 20, canvas.height - 20);
    
    // Add white border
    context.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    context.lineWidth = 2;
    context.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

    // Style the text
    context.fillStyle = '#ffffff';
    context.font = 'bold 32px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(name, canvas.width / 2, canvas.height / 2);

    // Create texture and sprite
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    const material = new THREE.SpriteMaterial({ 
      map: texture,
      transparent: true,
      alphaTest: 0.1
    });
    const sprite = new THREE.Sprite(material);
    
    // Position closer above character head and make it smaller
    sprite.position.set(0, 1.8, 0);
    sprite.scale.set(1.5, 0.375, 1);
    
    return sprite;
  }

  async loadModel(assetLoader: AssetLoader, modelType: 'basic' | 'advanced' = 'basic'): Promise<void> {
    try {
      const modelPath = `kenney_blocky-characters/Models/Non-rigged/glTF/${modelType}Character.gltf`;
      this.model = await assetLoader.loadGLTF(modelPath, `npc-${this.name}`);
      
      if (this.model) {
        // Use the same scaling approach as OfficeFloorScene (0.075 instead of 0.8)
        this.model.scale.setScalar(0.075);
        
        // Load and apply skin texture like the original implementation
        await this.applySkinTexture(assetLoader, modelType);
        
        this.model.position.set(0, 0, 0);
        this.group.add(this.model);
        
        console.log(`Successfully loaded model for ${this.name}`);
      }
    } catch (error) {
      console.warn(`Failed to load model for NPC ${this.name}:`, error);
      // Create fallback simple character
      this.createFallbackCharacter();
    }
  }

  private async applySkinTexture(assetLoader: AssetLoader, modelType: 'basic' | 'advanced'): Promise<void> {
    if (!this.model) return;

    try {
      // Choose skin texture based on NPC name and model type
      const skinTextures = {
        'Devon': 'kenney_blocky-characters/Skins/Basic/skin_man.png',
        'Lotte': 'kenney_blocky-characters/Skins/Basic/skin_woman.png', 
        'Joonatan': 'kenney_blocky-characters/Skins/Basic/skin_manAlternative.png',
        'Mark': 'kenney_blocky-characters/Skins/Basic/skin_womanAlternative.png'
      };

      const skinPath = skinTextures[this.name as keyof typeof skinTextures] || 'kenney_blocky-characters/Skins/Basic/skin_man.png';
      const skinTexture = await assetLoader.loadTexture(skinPath);
      skinTexture.flipY = false; // GLTF textures don't need flipping
      
      // Apply the skin to all meshes
      this.model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.material = new THREE.MeshLambertMaterial({
            map: skinTexture,
            color: 0xffffff
          });
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      
      console.log(`Applied skin texture for ${this.name}: ${skinPath}`);
    } catch (error) {
      console.warn(`Failed to apply skin texture for ${this.name}:`, error);
      // Apply default material if texture loading fails
      this.model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.material = new THREE.MeshLambertMaterial({
            color: 0xFFDBD7 // Default skin color
          });
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
    }
  }

  private createFallbackCharacter(): void {
    // Create a simple colored cube as fallback - much smaller to match character scale
    const geometry = new THREE.BoxGeometry(0.1, 0.2, 0.1);
    const material = new THREE.MeshLambertMaterial({ 
      color: Math.random() * 0xffffff 
    });
    const fallback = new THREE.Mesh(geometry, material);
    fallback.position.y = 0.1;
    fallback.castShadow = true;
    fallback.receiveShadow = true;
    this.group.add(fallback);
    console.log(`Created small fallback character for ${this.name}`);
  }

  update(deltaTime: number): void {
    if (this.idleAnimation) {
      this.idleTime += deltaTime;
      
      // Gentle floating animation
      const baseY = 0;
      this.group.position.y = baseY + Math.sin(this.idleTime * 2) * 0.02;
      
      // Subtle rotation
      if (this.model) {
        this.model.rotation.y = Math.sin(this.idleTime * 0.5) * 0.1;
      }
    }

    // Name labels automatically face the camera by default with THREE.Sprite
    // No additional lookAt needed
  }

  setPosition(position: THREE.Vector3): void {
    this.group.position.copy(position);
  }

  lookAt(target: THREE.Vector3): void {
    if (this.model) {
      this.model.lookAt(target);
    }
  }

  setNameLabelVisibility(visible: boolean): void {
    this.nameLabel.visible = visible;
  }
}

export class NPCSystem {
  private npcs: Map<string, NPC> = new Map();
  private assetLoader: AssetLoader;
  private scene: THREE.Group;

  constructor(scene: THREE.Group, assetLoader: AssetLoader) {
    this.scene = scene;
    this.assetLoader = assetLoader;
  }

  async createNPC(config: NPCConfig): Promise<NPC> {
    const npc = new NPC(config);
    await npc.loadModel(this.assetLoader, config.modelType);
    
    this.npcs.set(config.name, npc);
    this.scene.add(npc.group);
    
    console.log(`Created NPC: ${config.name} at position`, config.position);
    console.log(`NPC group children:`, npc.group.children);
    console.log(`Name label visible:`, npc.nameLabel.visible);
    console.log(`Name label position:`, npc.nameLabel.position);
    console.log(`Name label scale:`, npc.nameLabel.scale);
    
    return npc;
  }

  getNPC(name: string): NPC | undefined {
    return this.npcs.get(name);
  }

  getAllNPCs(): NPC[] {
    return Array.from(this.npcs.values());
  }

  removeNPC(name: string): boolean {
    const npc = this.npcs.get(name);
    if (npc) {
      this.scene.remove(npc.group);
      this.npcs.delete(name);
      return true;
    }
    return false;
  }

  update(deltaTime: number): void {
    for (const npc of this.npcs.values()) {
      npc.update(deltaTime);
    }
  }

  // Helper method to create all office NPCs at once
  async createOfficeNPCs(): Promise<void> {
    const npcConfigs: NPCConfig[] = [
      {
        name: 'Devon',
        position: new THREE.Vector3(-2, 0, 2),
        modelType: 'basic',
        hairColor: 0x8B4513
      },
      {
        name: 'Lotte',
        position: new THREE.Vector3(4, 0, -3),
        modelType: 'advanced',
        hairColor: 0xFFD700
      },
      {
        name: 'Joonatan',
        position: new THREE.Vector3(-4, 0, -2),
        modelType: 'basic',
        hairColor: 0x654321
      },
      {
        name: 'Mark',
        position: new THREE.Vector3(2, 0, 4),
        modelType: 'advanced',
        hairColor: 0x000000
      }
    ];

    for (const config of npcConfigs) {
      await this.createNPC(config);
    }
  }

  // Method to animate an NPC moving to a target position
  moveNPCTo(npcName: string, targetPosition: THREE.Vector3, duration: number = 2): Promise<void> {
    return new Promise((resolve) => {
      const npc = this.getNPC(npcName);
      if (!npc) {
        console.warn(`NPC ${npcName} not found`);
        resolve();
        return;
      }

      const startPosition = npc.group.position.clone();
      const startTime = Date.now();

      const animateMovement = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / (duration * 1000), 1);
        
        // Ease-in-out animation
        const easeProgress = 0.5 * (1 - Math.cos(progress * Math.PI));
        
        npc.group.position.lerpVectors(startPosition, targetPosition, easeProgress);
        
        // Make NPC look towards target while moving
        if (progress < 1) {
          const direction = targetPosition.clone().sub(npc.group.position).normalize();
          if (direction.length() > 0) {
            npc.lookAt(npc.group.position.clone().add(direction));
          }
          requestAnimationFrame(animateMovement);
        } else {
          resolve();
        }
      };

      animateMovement();
    });
  }
} 