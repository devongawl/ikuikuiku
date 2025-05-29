import * as THREE from 'three';
import { SceneManager } from './systems/SceneManager';
import { DialogueSystem } from './systems/DialogueSystem';
import { InteractionSystem } from './systems/InteractionSystem';
import { TestScene } from './scenes/TestScene';

// Core game class
class RelationshipStoryGame {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private sceneManager: SceneManager;
  private dialogueSystem: DialogueSystem;
  private interactionSystem: InteractionSystem;
  private clock: THREE.Clock;
  private playerCharacter: THREE.Group | null = null;

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
    this.sceneManager = new SceneManager();
    this.dialogueSystem = new DialogueSystem();
    this.interactionSystem = new InteractionSystem(this.camera, this.dialogueSystem);
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
    
    // Set up isometric-style camera position
    camera.position.set(10, 10, 10);
    camera.lookAt(0, 0, 0);

    return camera;
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', this.onWindowResize.bind(this));

    // Listen for memory triggered events
    window.addEventListener('memoryTriggered', ((event: CustomEvent) => {
      console.log('Memory triggered:', event.detail);
      // You can add special effects or scene transitions here
    }) as EventListener);
  }

  private onWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private async init(): Promise<void> {
    // Register all scenes
    this.registerScenes();

    // Show welcome message
    this.dialogueSystem.show(
      "Welcome to our story... Click on objects to discover our memories together.",
      3000
    );

    // Load the first scene
    await this.loadScene('test-scene');

    // Start the animation loop
    this.animate();
  }

  private registerScenes(): void {
    // Register test scene
    this.sceneManager.registerScene('test-scene', new TestScene());

    // TODO: Register other scenes as we create them
    // this.sceneManager.registerScene('office', new OfficeScene());
    // this.sceneManager.registerScene('first-date', new FirstDateScene());
    // etc.
  }

  private async loadScene(sceneName: string): Promise<void> {
    const scene = await this.sceneManager.loadScene(sceneName);
    if (scene) {
      this.interactionSystem.setScene(scene);
      
      // Adjust camera for the scene if needed
      this.adjustCameraForScene(scene);
    }
  }

  private adjustCameraForScene(scene: THREE.Group): void {
    // Smooth camera transition to focus on the scene
    // For now, just ensure we're looking at the center
    const targetPosition = new THREE.Vector3(10, 10, 10);
    const targetLookAt = new THREE.Vector3(0, 0, 0);

    // You can implement smooth transitions here
    this.camera.position.copy(targetPosition);
    this.camera.lookAt(targetLookAt);
  }

  private animate(): void {
    requestAnimationFrame(this.animate.bind(this));

    const deltaTime = this.clock.getDelta();

    // Update systems
    this.sceneManager.update(deltaTime);
    this.interactionSystem.update();

    // Update player character if exists
    if (this.playerCharacter) {
      // Add any character animations or updates here
    }

    // Render the scene
    this.renderer.render(this.scene, this.camera);
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