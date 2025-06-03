import * as THREE from 'three';
import { SceneManager } from './systems/SceneManager';
import { DialogueSystem } from './systems/DialogueSystem';
import { InteractionSystem } from './systems/InteractionSystem';
import { AssetLoader } from './systems/AssetLoader';
import { KenneyCharacterController } from './systems/KenneyCharacterController';
import { CollisionManager } from './systems/CollisionManager';
import { TestScene } from './scenes/TestScene';
import { OfficeScene } from './scenes/OfficeScene';
import { ApartmentScene } from './scenes/ApartmentScene';
import { CrossyRoadScene } from './scenes/CrossyRoadScene';
import { OfficeBuildingScene } from './scenes/OfficeBuildingScene';
import { OfficeFloorScene } from './scenes/OfficeFloorScene';
import type { Memory } from './types';

// Core game class
class RelationshipStoryGame {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private sceneManager: SceneManager;
  private dialogueSystem: DialogueSystem;
  private interactionSystem: InteractionSystem;
  private assetLoader: AssetLoader;
  private characterController: KenneyCharacterController;
  private collisionManager: CollisionManager;
  private clock: THREE.Clock;
  private cameraDistance: number = 5;
  private cameraHeight: number = 8;
  private cameraLerpFactor: number = 0.05; // Reduced from 0.1 for smoother movement
  private cameraLookAtLerpFactor: number = 0.08; // Separate factor for look-at smoothing
  private currentLookAtTarget: THREE.Vector3 = new THREE.Vector3();
  private debugPanel: HTMLDivElement | null = null;

  constructor() {
    // Initialize Three.js core
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87CEEB); // Sky blue from our palette
    this.scene.fog = new THREE.Fog(0x87CEEB, 30, 100);

    // Initialize renderer
    this.renderer = this.createRenderer();

    // Initialize camera
    this.camera = this.createCamera();

    // Initialize systems
    this.assetLoader = new AssetLoader();
    this.sceneManager = new SceneManager();
    this.dialogueSystem = new DialogueSystem();
    this.interactionSystem = new InteractionSystem(this.camera, this.dialogueSystem);
    this.characterController = new KenneyCharacterController(this.assetLoader);
    this.collisionManager = new CollisionManager();
    this.clock = new THREE.Clock();

    // Connect collision manager to character controller
    this.characterController.setCollisionManager(this.collisionManager);

    // Add scene manager container to main scene
    this.scene.add(this.sceneManager.sceneContainer);

    // Set up event listeners
    this.setupEventListeners();

    // Initialize the game
    this.init();
  }

  private createRenderer(): THREE.WebGLRenderer {
    const canvas = document.querySelector('canvas.game');
    if (!canvas) throw new Error('Canvas not found');

    const renderer = new THREE.WebGLRenderer({
      canvas: canvas as HTMLCanvasElement,
      antialias: true,
      alpha: true
    });
    
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    return renderer;
  }

  private createCamera(): THREE.PerspectiveCamera {
    const camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    
    // Set up closer isometric-style camera position
    camera.position.set(5, 8, 5);
    camera.lookAt(0, 0, 0);

    return camera;
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', this.onWindowResize.bind(this));

    // Keyboard controls
    window.addEventListener('keydown', (e) => {
      // Toggle debug panel with 'D' key
      if (e.key === 'd' || e.key === 'D') {
        this.toggleDebugPanel();
      }
    });

    // Listen for memory triggered events
    window.addEventListener('memoryTriggered', ((event: CustomEvent) => {
      console.log('Memory triggered:', event.detail);
      this.dialogueSystem.notify('Memory discovered!', 2000);
      
      // Follow character with camera when moving
      if (event.detail.memory) {
        this.smoothCameraFollow();
        
        // Check if this is an exit door
        const memory = event.detail.memory as Memory;
        if (memory.object.userData.isExitDoor) {
          const nextScene = memory.object.userData.nextScene;
          if (nextScene) {
            // Add a delay before transitioning
            setTimeout(() => {
              this.loadScene(nextScene);
            }, 2000);
          }
        }
      }
    }) as EventListener);

    // Listen for vehicle collision events
    window.addEventListener('vehicleCollision', ((event: CustomEvent) => {
      console.log('Vehicle collision:', event.detail);
      this.dialogueSystem.show(event.detail.message, 3000);
    }) as EventListener);

    // Listen for door reached events
    window.addEventListener('doorReached', ((event: CustomEvent) => {
      console.log('Door reached:', event.detail);
      this.dialogueSystem.show(event.detail.message, 2000);
    }) as EventListener);

    // Listen for goal reached events
    window.addEventListener('goalReached', ((event: CustomEvent) => {
      console.log('Goal reached:', event.detail);
      this.dialogueSystem.show(event.detail.message, 2000);
    }) as EventListener);

    // Listen for elevator reached events
    window.addEventListener('elevatorReached', ((event: CustomEvent) => {
      console.log('Elevator reached:', event.detail);
      this.dialogueSystem.show(event.detail.message, 2000);
    }) as EventListener);

    // Listen for story narration events
    window.addEventListener('storyNarration', ((event: CustomEvent) => {
      console.log('Story narration:', event.detail);
      this.dialogueSystem.show(event.detail.message, 4000);
    }) as EventListener);

    // Mouse wheel zoom
    window.addEventListener('wheel', (e) => this.handleWheel(e));
  }

  private onWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private init(): void {
    // Register all scenes
    this.registerScenes();

    // Load character with FBX Animated Woman model (blonde/light skin)
    this.characterController.loadFBXCharacter(
      'models/Animated Woman/Animated Woman.fbx',
      'models/Animated Woman/LightSkin.png'
    ).then((character) => {
      this.scene.add(character);
    });

    // Show welcome message
    this.dialogueSystem.show(
      "Tuesday Morning - September 15th...",
      3000
    );

    // Load the apartment scene for Day We Met story
    this.loadScene('apartment-scene');

    // Create debug panel
    this.createDebugPanel();

    // Start the animation loop
    this.animate();
  }

  private registerScenes(): void {
    // Register test scene
    this.sceneManager.registerScene('test-scene', new TestScene());
    
    // Register office scene
    this.sceneManager.registerScene('office-scene', new OfficeScene());
    
    // Register apartment scene (Day We Met - Act 1)
    this.sceneManager.registerScene('apartment-scene', new ApartmentScene());
    
    // Register crossy road scene (Day We Met - Act 2)
    this.sceneManager.registerScene('crossy-road', new CrossyRoadScene());

    // Register office building scene (Day We Met - Act 2.5)
    this.sceneManager.registerScene('office-building', new OfficeBuildingScene());

    // Register office floor scene (Day We Met - Act 3: The Meeting)
    this.sceneManager.registerScene('office-floor', new OfficeFloorScene());
  }

  private async loadScene(sceneName: string): Promise<void> {
    const scene = await this.sceneManager.loadScene(sceneName);
    if (scene) {
      // Set collision manager for the scene BEFORE doing anything else
      scene.setCollisionManager(this.collisionManager);
      
      // Set the current scene on the character controller for vehicle collision detection
      this.characterController.setCurrentScene(scene);
      
      this.interactionSystem.setScene(scene);
      
      // Adjust camera for the scene if needed
      this.adjustCameraForScene(scene);
      
      // Show scene title
      this.showSceneTitle(scene.name, scene.description);
      
      // Special handling for apartment scene
      if (sceneName === 'apartment-scene') {
        // Set bed position (bedroom is at -6, 0)
        this.characterController.setBedPosition(-3, 0); // Grid position for bed
        
        // Start character in bed
        this.characterController.setPosition(-6, 0, 0); // World position
        this.characterController.setInBed(true);
        
        // Show morning narration
        setTimeout(() => {
          this.dialogueSystem.show(
            "Another morning... Time to start the day.",
            3000
          );
        }, 1000);
      }
      
      // Special handling for crossy road scene
      if (sceneName === 'crossy-road') {
        // Start character at the beginning of the crossy road in the safe area
        this.characterController.setPosition(0, 0, -4); // World position (starting safe grass area)
        this.characterController.setInBed(false);
        
        // Show crossy road instructions
        setTimeout(() => {
          this.dialogueSystem.show(
            "I need to cross the street to get to the office. Watch out for traffic!",
            4000
          );
        }, 1000);
      }
      
      // Special handling for office building scene
      if (sceneName === 'office-building') {
        // Start character at the lobby entrance
        this.characterController.setPosition(0, 0, 6); // World position (lobby entrance)
        this.characterController.setInBed(false);
        
        // Show office building narrative
        setTimeout(() => {
          this.dialogueSystem.show(
            "The office building lobby. Another typical workday... or so I thought.",
            4000
          );
        }, 1000);
      }
      
      // Special handling for office floor scene
      if (sceneName === 'office-floor') {
        // Start character at the elevator entrance
        this.characterController.setPosition(0, 0, 8); // World position (elevator entrance)
        this.characterController.setInBed(false);
        
        // Show office floor arrival
        setTimeout(() => {
          this.dialogueSystem.show(
            "The office floor. Time to start another day...",
            3000
          );
        }, 1000);
      }
    }
  }

  private adjustCameraForScene(scene: THREE.Group): void {
    // Smooth camera transition to focus on the scene
    const characterPos = this.characterController.getSmoothPosition();
    const targetPosition = new THREE.Vector3(
      characterPos.x + this.cameraDistance, 
      this.cameraHeight, 
      characterPos.z + this.cameraDistance
    );

    // Simple camera positioning for now
    this.camera.position.copy(targetPosition);
    this.camera.lookAt(characterPos);
    
    // Initialize smooth look-at target
    this.currentLookAtTarget.copy(characterPos);
  }

  private smoothCameraFollow(): void {
    // Use smooth grid position for camera movement (ignores hop animation)
    const characterPos = this.characterController.getSmoothPosition();
    
    // Smoother camera positioning for grid movement
    const targetCameraPos = new THREE.Vector3(
      characterPos.x + this.cameraDistance, 
      this.cameraHeight, 
      characterPos.z + this.cameraDistance
    );
    
    // Smooth lerp for camera position
    this.camera.position.lerp(targetCameraPos, this.cameraLerpFactor);
    
    // Smooth look-at interpolation
    this.currentLookAtTarget.lerp(characterPos, this.cameraLookAtLerpFactor);
    this.camera.lookAt(this.currentLookAtTarget);
  }

  private showSceneTitle(name: string, description: string): void {
    const titleDiv = document.createElement('div');
    titleDiv.className = 'scene-title';
    titleDiv.innerHTML = `<h2>${name}</h2><p>${description}</p>`;
    document.body.appendChild(titleDiv);
    
    setTimeout(() => {
      titleDiv.classList.add('visible');
    }, 100);
    
    setTimeout(() => {
      titleDiv.classList.remove('visible');
      setTimeout(() => {
        document.body.removeChild(titleDiv);
      }, 500);
    }, 3000);
  }

  private createDebugPanel(): void {
    this.debugPanel = document.createElement('div');
    this.debugPanel.className = 'debug-panel';
    
    // Get all registered scenes
    const registeredScenes = this.sceneManager.getRegisteredScenes();
    
    // Create scene navigation section
    const sceneNavigation = registeredScenes.map(sceneName => 
      `<button class="scene-nav-btn" data-scene="${sceneName}">${this.getSceneDisplayName(sceneName)}</button>`
    ).join('');
    
    this.debugPanel.innerHTML = `
      <div class="debug-section">
        <div class="debug-section-title">Character Debug</div>
        <div class="debug-line"><span class="label">Grid Pos:</span> <span id="grid-pos">0, 0</span></div>
        <div class="debug-line"><span class="label">Queue:</span> <span id="queue-length">0</span></div>
        <div class="debug-line"><span class="label">Moving:</span> <span id="is-moving">false</span></div>
      </div>
      <div class="debug-section">
        <div class="debug-section-title">Scene Navigation</div>
        <div class="scene-nav-container">
          ${sceneNavigation}
        </div>
      </div>
    `;
    
    // Add click listeners to scene navigation buttons
    this.debugPanel.querySelectorAll('.scene-nav-btn').forEach(button => {
      button.addEventListener('click', (e) => {
        const sceneName = (e.target as HTMLElement).getAttribute('data-scene');
        if (sceneName) {
          this.loadScene(sceneName);
        }
      });
    });
    
    document.body.appendChild(this.debugPanel);
  }

  private getSceneDisplayName(sceneName: string): string {
    // Convert scene names to readable display names
    const displayNames: Record<string, string> = {
      'test-scene': 'Test Scene',
      'office-scene': 'Office Scene', 
      'apartment-scene': 'Apartment',
      'crossy-road': 'Crossy Road',
      'office-building': 'Office Building',
      'office-floor': 'Office Floor'
    };
    
    return displayNames[sceneName] || sceneName;
  }

  private updateDebugPanel(): void {
    if (!this.debugPanel) return;

    const gridPos = this.characterController.getGridPosition();
    const queueLength = this.characterController.getQueueLength();
    const isMoving = this.characterController.isMoving();

    const gridPosElement = this.debugPanel.querySelector('#grid-pos');
    const queueElement = this.debugPanel.querySelector('#queue-length');
    const movingElement = this.debugPanel.querySelector('#is-moving');

    if (gridPosElement) gridPosElement.textContent = `${gridPos.x}, ${gridPos.z}`;
    if (queueElement) queueElement.textContent = queueLength.toString();
    if (movingElement) movingElement.textContent = isMoving ? 'true' : 'false';
  }

  private animate(): void {
    requestAnimationFrame(this.animate.bind(this));

    const deltaTime = this.clock.getDelta();

    // Update systems
    this.sceneManager.update(deltaTime);
    this.interactionSystem.update();
    this.characterController.update(deltaTime, this.camera);

    // Camera follows character smoothly
    this.smoothCameraFollow();

    // Update debug panel
    this.updateDebugPanel();

    // Render the scene
    this.renderer.render(this.scene, this.camera);
  }

  private handleWheel(event: WheelEvent): void {
    event.preventDefault();
    
    // Adjust camera distance based on wheel delta
    const zoomSpeed = 0.001;
    this.cameraDistance += event.deltaY * zoomSpeed;
    this.cameraHeight += event.deltaY * zoomSpeed * 0.8;
    
    // Clamp values
    this.cameraDistance = Math.max(2, Math.min(20, this.cameraDistance));
    this.cameraHeight = Math.max(3, Math.min(20, this.cameraHeight));
  }

  // Public methods for scene navigation
  public async goToScene(sceneName: string): Promise<void> {
    await this.loadScene(sceneName);
  }

  public showDialogue(text: string, duration?: number): void {
    this.dialogueSystem.show(text, duration || null);
  }

  public notify(text: string, duration?: number): void {
    this.dialogueSystem.notify(text, duration);
  }

  private toggleDebugPanel(): void {
    if (this.debugPanel) {
      this.debugPanel.style.display = this.debugPanel.style.display === 'none' ? 'block' : 'none';
    }
  }
}

// Initialize the game when the DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new RelationshipStoryGame();
  });
} else {
  new RelationshipStoryGame();
}

// Export for potential use in other modules
export { RelationshipStoryGame }; 