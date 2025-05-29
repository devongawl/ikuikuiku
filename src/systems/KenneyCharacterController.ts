import * as THREE from 'three';
import { AssetLoader } from './AssetLoader';

export class KenneyCharacterController {
  private character: THREE.Group | null = null;
  private mixer: THREE.AnimationMixer | null = null;
  private assetLoader: AssetLoader;
  private moveSpeed: number = 5;
  private rotationSpeed: number = 3;
  
  // Movement state
  private velocity: THREE.Vector3;
  private inputVector: THREE.Vector2;
  private keys: Set<string>;

  constructor(assetLoader: AssetLoader) {
    this.assetLoader = assetLoader;
    this.velocity = new THREE.Vector3();
    this.inputVector = new THREE.Vector2();
    this.keys = new Set();
    
    this.setupControls();
  }

  async loadCharacter(skinTexturePath?: string): Promise<THREE.Group> {
    try {
      // Load the basic character model
      const characterPath = 'kenney_blocky-characters/Models/Non-rigged/glTF/basicCharacter.gltf';
      this.character = await this.assetLoader.loadGLTF(characterPath, 'player-character');
      
      // Scale the character appropriately
      this.character.scale.setScalar(0.01); // Kenney models are often large
      
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
    
    return group;
  }

  private setupControls(): void {
    // Keyboard controls
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.key.toLowerCase());
    });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.key.toLowerCase());
    });

    // Touch controls for mobile
    const touchArea = document.createElement('div');
    touchArea.className = 'touch-controls';
    touchArea.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 20px;
      width: 150px;
      height: 150px;
      border: 2px solid rgba(255,255,255,0.3);
      border-radius: 50%;
      touch-action: none;
      z-index: 1000;
    `;

    const touchStick = document.createElement('div');
    touchStick.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      width: 50px;
      height: 50px;
      background: rgba(255,255,255,0.5);
      border-radius: 50%;
      transform: translate(-50%, -50%);
      transition: none;
    `;
    
    touchArea.appendChild(touchStick);
    document.body.appendChild(touchArea);

    let touching = false;
    touchArea.addEventListener('touchstart', (e) => {
      touching = true;
      this.handleTouch(e, touchArea, touchStick);
    });

    touchArea.addEventListener('touchmove', (e) => {
      if (touching) this.handleTouch(e, touchArea, touchStick);
    });

    touchArea.addEventListener('touchend', () => {
      touching = false;
      this.inputVector.set(0, 0);
      touchStick.style.transform = 'translate(-50%, -50%)';
    });
  }

  private handleTouch(e: TouchEvent, area: HTMLElement, stick: HTMLElement): void {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = area.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const deltaX = touch.clientX - centerX;
    const deltaY = touch.clientY - centerY;
    
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const maxDistance = rect.width / 2;
    
    if (distance > maxDistance) {
      const angle = Math.atan2(deltaY, deltaX);
      this.inputVector.x = Math.cos(angle);
      this.inputVector.y = Math.sin(angle);
      stick.style.transform = `translate(${Math.cos(angle) * 50 - 25}px, ${Math.sin(angle) * 50 - 25}px)`;
    } else {
      this.inputVector.x = deltaX / maxDistance;
      this.inputVector.y = deltaY / maxDistance;
      stick.style.transform = `translate(${deltaX - 25}px, ${deltaY - 25}px)`;
    }
  }

  update(deltaTime: number, camera: THREE.Camera): void {
    if (!this.character) return;

    // Update input vector from keyboard
    if (this.keys.size > 0) {
      this.inputVector.set(0, 0);
      if (this.keys.has('w') || this.keys.has('arrowup')) this.inputVector.y -= 1;
      if (this.keys.has('s') || this.keys.has('arrowdown')) this.inputVector.y += 1;
      if (this.keys.has('a') || this.keys.has('arrowleft')) this.inputVector.x -= 1;
      if (this.keys.has('d') || this.keys.has('arrowright')) this.inputVector.x += 1;
      this.inputVector.normalize();
    }

    // Calculate movement direction relative to camera
    const forward = new THREE.Vector3();
    const right = new THREE.Vector3();
    
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();
    
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0));

    // Apply movement
    if (this.inputVector.length() > 0.1) {
      this.velocity.x = (right.x * this.inputVector.x + forward.x * -this.inputVector.y) * this.moveSpeed;
      this.velocity.z = (right.z * this.inputVector.x + forward.z * -this.inputVector.y) * this.moveSpeed;
      
      // Update position
      this.character.position.x += this.velocity.x * deltaTime;
      this.character.position.z += this.velocity.z * deltaTime;
      
      // Rotate character to face movement direction
      const angle = Math.atan2(this.velocity.x, this.velocity.z);
      this.character.rotation.y = THREE.MathUtils.lerp(
        this.character.rotation.y,
        angle,
        this.rotationSpeed * deltaTime
      );

      // Simple walk animation (bob up and down)
      const time = Date.now() * 0.01;
      this.character.position.y = Math.abs(Math.sin(time * 10)) * 0.1;
    } else {
      // Idle animation
      const time = Date.now() * 0.001;
      this.character.position.y = Math.sin(time * 2) * 0.02;
    }

    // Update animations if mixer exists
    if (this.mixer) {
      this.mixer.update(deltaTime);
    }
  }

  getCharacter(): THREE.Group | null {
    return this.character;
  }

  getPosition(): THREE.Vector3 {
    return this.character ? this.character.position.clone() : new THREE.Vector3();
  }

  setPosition(x: number, y: number, z: number): void {
    if (this.character) {
      this.character.position.set(x, y, z);
    }
  }
} 