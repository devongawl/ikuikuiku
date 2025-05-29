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
    
    // Set up isometric-style camera position
    camera.position.set(15, 15, 15);
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
  }

  private onWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private async init(): Promise<void> {
    // Register all scenes
    this.registerScenes();

    // Load character with woman skin
    const character = await this.characterController.loadCharacter(
      'kenney_blocky-characters/Skins/Basic/skin_woman.png'
    );
    this.scene.add(character);

    // Show welcome message
    this.dialogueSystem.show(
      "Welcome to our story... Use WASD or arrow keys to move. Click on objects to discover our memories.",
      5000
    );

    // Load the first scene
    await this.loadScene('office-scene');

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
    const characterPos = this.characterController.getPosition();
    const targetPosition = new THREE.Vector3(
      characterPos.x + 15, 
      15, 
      characterPos.z + 15
    );
    const targetLookAt = characterPos.clone();

    // Simple camera positioning for now
    this.camera.position.copy(targetPosition);
    this.camera.lookAt(targetLookAt);
  }

  private smoothCameraFollow(): void {
    const characterPos = this.characterController.getPosition();
    const idealOffset = new THREE.Vector3(15, 15, 15);
    const idealLookAt = characterPos.clone();

    const targetPosition = idealLookAt.clone().add(idealOffset);
    
    // Smooth lerp to target
    this.camera.position.lerp(targetPosition, 0.1);
    this.camera.lookAt(idealLookAt);
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

  private animate(): void {
    requestAnimationFrame(this.animate.bind(this));

    const deltaTime = this.clock.getDelta();

    // Update systems
    this.sceneManager.update(deltaTime);
    this.interactionSystem.update();
    this.characterController.update(deltaTime, this.camera);

    // Camera follows character smoothly
    this.smoothCameraFollow();

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