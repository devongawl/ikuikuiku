import * as THREE from 'three';
import { SceneManager } from './systems/SceneManager';
import { DialogueSystem } from './systems/DialogueSystem';
import { InteractionSystem } from './systems/InteractionSystem';
import { AssetLoader } from './systems/AssetLoader';
import { KenneyCharacterController } from './systems/KenneyCharacterController';
import { TestScene } from './scenes/TestScene';
import { OfficeScene } from './scenes/OfficeScene';

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
  private clock: THREE.Clock;
  private cameraDistance: number = 5;
  private cameraHeight: number = 8;
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
    this.clock = new THREE.Clock();

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

    // Listen for memory triggered events
    window.addEventListener('memoryTriggered', ((event: CustomEvent) => {
      console.log('Memory triggered:', event.detail);
      this.dialogueSystem.notify('Memory discovered!', 2000);
      
      // Follow character with camera when moving
      if (event.detail.memory) {
        this.smoothCameraFollow();
      }
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

    // Load character with woman skin
    this.characterController.loadCharacter(
      'kenney_blocky-characters/Skins/Basic/skin_woman.png'
    ).then((character) => {
      this.scene.add(character);
    });

    // Show welcome message
    this.dialogueSystem.show(
      "Welcome to our story... Use WASD or arrow keys to move one step at a time. Click on objects to discover our memories.",
      5000
    );

    // Load the first scene
    this.loadScene('office-scene');

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

    // TODO: Register other scenes as we create them
    // this.sceneManager.registerScene('first-date', new FirstDateScene());
    // etc.
  }

  private async loadScene(sceneName: string): Promise<void> {
    const scene = await this.sceneManager.loadScene(sceneName);
    if (scene) {
      this.interactionSystem.setScene(scene);
      
      // Adjust camera for the scene if needed
      this.adjustCameraForScene(scene);
      
      // Show scene title
      this.showSceneTitle(scene.name, scene.description);
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
    this.camera.position.lerp(targetCameraPos, 0.1);
    
    // Look at the character's smooth position
    this.camera.lookAt(characterPos);
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
    this.debugPanel.innerHTML = `
      <div class="debug-line"><span class="label">Grid Pos:</span> <span id="grid-pos">0, 0</span></div>
      <div class="debug-line"><span class="label">Queue:</span> <span id="queue-length">0</span></div>
      <div class="debug-line"><span class="label">Moving:</span> <span id="is-moving">false</span></div>
    `;
    document.body.appendChild(this.debugPanel);
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