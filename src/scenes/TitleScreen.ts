import * as THREE from 'three';
import { Scene } from './Scene';

export class TitleScreen extends Scene {
  private titleTexture: THREE.Texture | null = null;
  private beginButton: HTMLDivElement | null = null;
  private onBeginCallback: (() => void) | null = null;

  constructor() {
    super('title-screen', 'Our Story - The Beginning');
  }

  // Set the callback for when "Begin your day" is clicked
  setOnBeginCallback(callback: () => void): void {
    this.onBeginCallback = callback;
  }

  protected async loadAssets(): Promise<void> {
    try {
      // Hide the ground for the title screen
      const ground = this.getObjectByName('ground');
      if (ground) {
        ground.visible = false;
      }

      // Create the title screen background
      await this.createTitleBackground();
      
      // Create the "Begin your day" button
      this.createBeginButton();
      
    } catch (error) {
      console.error('Failed to load title screen assets:', error);
    }
  }

  private async createTitleBackground(): Promise<void> {
    return new Promise((resolve, reject) => {
      const textureLoader = new THREE.TextureLoader();
      
      // Try paths that work with Vite build and GitHub Pages
      const possiblePaths = [
        'assets/titleScreen.png',           // Public directory path (preferred)
        './assets/titleScreen.png',         // Explicit relative path
        '../public/assets/titleScreen.png', // Development fallback
        '/ikuikuiku/assets/titleScreen.png' // GitHub Pages base path
      ];
      
      let loadAttempt = 0;
      
      const tryLoadTexture = (path: string) => {
        console.log(`Attempting to load title screen from: ${path}`);
        
        textureLoader.load(
          path,
          // onLoad - success
          (texture) => {
            console.log('✅ Title screen texture loaded successfully');
            this.titleTexture = texture;
            
            // Configure texture
            texture.colorSpace = THREE.SRGBColorSpace;
            texture.minFilter = THREE.LinearFilter;
            texture.magFilter = THREE.LinearFilter;
            texture.wrapS = THREE.ClampToEdgeWrapping;
            texture.wrapT = THREE.ClampToEdgeWrapping;
            
            // Create appropriately sized plane to display the full title screen
            const aspectRatio = texture.image.width / texture.image.height;
            
            // Calculate plane size based on camera's field of view (50 degrees)
            // Camera is at z=0, plane at z=-5, so distance = 5
            const distance = 5;
            const fov = 50 * Math.PI / 180; // Convert to radians
            const visibleHeight = 2 * distance * Math.tan(fov / 2);
            const visibleWidth = visibleHeight * (window.innerWidth / window.innerHeight);
            
            // Make image cover the entire viewport (like CSS background-size: cover)
            // Always scale to the larger dimension needed to fill the screen
            const scaleToFitWidth = visibleWidth / (visibleHeight * aspectRatio);
            const scaleToFitHeight = 1;
            
            // Use the larger scale to ensure full coverage
            const scale = Math.max(scaleToFitWidth, scaleToFitHeight);
            
            const planeHeight = visibleHeight * scale;
            const planeWidth = planeHeight * aspectRatio;
            
            const geometry = new THREE.PlaneGeometry(planeWidth, planeHeight);
            const material = new THREE.MeshBasicMaterial({
              map: texture,
              transparent: true,
              side: THREE.DoubleSide
            });
            
            const titlePlane = new THREE.Mesh(geometry, material);
            titlePlane.position.set(0, 0, -5); // Center the plane
            titlePlane.name = 'title-background';
            
            this.add(titlePlane);
            resolve();
          },
          // onProgress
          (xhr) => {
            console.log(`Loading title screen: ${(xhr.loaded / xhr.total * 100)}% loaded`);
          },
          // onError
          (error) => {
            console.error(`Failed to load texture from ${path}:`, error);
            loadAttempt++;
            
            if (loadAttempt < possiblePaths.length) {
              // Try next path
              tryLoadTexture(possiblePaths[loadAttempt]);
            } else {
              // All paths failed, create a fallback
              console.log('Creating fallback title screen');
              this.createFallbackTitle();
              resolve();
            }
          }
        );
      };
      
      // Start with the first path
      tryLoadTexture(possiblePaths[loadAttempt]);
    });
  }

  private createFallbackTitle(): void {
    // Calculate appropriate size for fallback background
    const distance = 5;
    const fov = 50 * Math.PI / 180; // Convert to radians
    const visibleHeight = 2 * distance * Math.tan(fov / 2);
    const visibleWidth = visibleHeight * (window.innerWidth / window.innerHeight);
    
    // Fill the entire viewport with cover behavior
    // Assume a reasonable aspect ratio for fallback (16:9)
    const fallbackAspectRatio = 16/9;
    const scaleToFitWidth = visibleWidth / (visibleHeight * fallbackAspectRatio);
    const scaleToFitHeight = 1;
    const scale = Math.max(scaleToFitWidth, scaleToFitHeight);
    
    const planeHeight = visibleHeight * scale;
    const planeWidth = planeHeight * fallbackAspectRatio;
    
    // Create a simple colored background as fallback
    const geometry = new THREE.PlaneGeometry(planeWidth, planeHeight);
    const material = new THREE.MeshBasicMaterial({
      color: 0x87CEEB, // Sky blue
      transparent: true,
      opacity: 0.9
    });
    
    const titlePlane = new THREE.Mesh(geometry, material);
    titlePlane.position.set(0, 0, -5);
    titlePlane.name = 'title-background-fallback';
    
    this.add(titlePlane);
    
    // Add text geometry for "Our Story" title
    // This is a simple implementation - you could use a text loader for better fonts
    const titleGeometry = new THREE.PlaneGeometry(planeWidth * 0.6, planeHeight * 0.2);
    const titleMaterial = new THREE.MeshBasicMaterial({
      color: 0xFFFFFF,
      transparent: true,
      opacity: 0.9
    });
    
    const titleText = new THREE.Mesh(titleGeometry, titleMaterial);
    titleText.position.set(0, planeHeight * 0.1, -4.9);
    titleText.name = 'title-text';
    
    this.add(titleText);
  }

  private createBeginButton(): void {
    // Create HTML button overlay
    this.beginButton = document.createElement('div');
    this.beginButton.innerHTML = 'Begin your day';
    this.beginButton.style.cssText = `
      position: fixed;
      bottom: 20%;
      left: 50%;
      transform: translateX(-50%);
      padding: 12px 24px;
      background: #FFE4B5;
      border: 4px solid #8B4513;
      border-radius: 0;
      font-family: 'Press Start 2P', cursive;
      font-size: 16px;
      color: #8B4513;
      cursor: pointer;
      text-align: center;
      transition: none;
      z-index: 1000;
      box-shadow: 4px 4px 0px #5D2F0A, 8px 8px 0px rgba(0, 0, 0, 0.3);
      image-rendering: pixelated;
      image-rendering: -moz-crisp-edges;
      image-rendering: crisp-edges;
      text-shadow: 2px 2px 0px rgba(139, 69, 19, 0.3);
    `;
    
    // Add pixel art hover effects
    this.beginButton.addEventListener('mouseenter', () => {
      if (this.beginButton) {
        this.beginButton.style.background = '#8B4513';
        this.beginButton.style.color = '#FFE4B5';
        this.beginButton.style.boxShadow = '2px 2px 0px #5D2F0A, 4px 4px 0px rgba(0, 0, 0, 0.3)';
        this.beginButton.style.transform = 'translateX(-50%) translateY(2px)';
      }
    });
    
    this.beginButton.addEventListener('mouseleave', () => {
      if (this.beginButton) {
        this.beginButton.style.background = '#FFE4B5';
        this.beginButton.style.color = '#8B4513';
        this.beginButton.style.boxShadow = '4px 4px 0px #5D2F0A, 8px 8px 0px rgba(0, 0, 0, 0.3)';
        this.beginButton.style.transform = 'translateX(-50%) translateY(0px)';
      }
    });
    
    // Add click handler
    this.beginButton.addEventListener('click', () => {
      console.log('Begin your day clicked!');
      if (this.onBeginCallback) {
        this.onBeginCallback();
      }
    });
    
    // Add to DOM
    document.body.appendChild(this.beginButton);
  }

  // Override setupLighting to create a more dramatic title screen atmosphere
  protected setupLighting(): void {
    // Warm ambient light
    const ambientLight = new THREE.AmbientLight(0xFFE4B5, 0.6); // Warm moccasin color
    ambientLight.name = 'ambientLight';
    this.add(ambientLight);

    // Dramatic directional light
    const dirLight = new THREE.DirectionalLight(0xFFD700, 1.2); // Golden light
    dirLight.position.set(10, 15, 5);
    dirLight.castShadow = false; // No shadows needed for title screen
    this.add(dirLight);
    
    // Additional warm fill light
    const fillLight = new THREE.DirectionalLight(0xFFA500, 0.8); // Orange fill
    fillLight.position.set(-10, 10, 5);
    this.add(fillLight);
  }

  // Override createGround to hide it or make it transparent
  protected createGround(): void {
    // Don't create ground for title screen, or make it invisible
    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const groundMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x000000,
      transparent: true,
      opacity: 0
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.name = 'ground';
    ground.visible = false;
    this.add(ground);
  }

  // Clean up when unloading the title screen
  unload(): void {
    super.unload();
    
    // Remove the HTML button
    if (this.beginButton && this.beginButton.parentNode) {
      this.beginButton.parentNode.removeChild(this.beginButton);
      this.beginButton = null;
    }
    
    // Clean up texture
    if (this.titleTexture) {
      this.titleTexture.dispose();
      this.titleTexture = null;
    }
  }

  // Title screen doesn't need collision detection
  protected registerColliders(): void {
    // No colliders needed for title screen
  }
} 