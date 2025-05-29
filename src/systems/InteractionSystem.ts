import * as THREE from 'three';
import type { Scene } from '../scenes/Scene';
import type { DialogueSystem } from './DialogueSystem';
import type { InteractionEvent } from '../types';

export class InteractionSystem {
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private camera: THREE.Camera;
  private scene: Scene | null;
  private dialogueSystem: DialogueSystem;
  private isEnabled: boolean;

  constructor(camera: THREE.Camera, dialogueSystem: DialogueSystem) {
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.camera = camera;
    this.scene = null;
    this.dialogueSystem = dialogueSystem;
    this.isEnabled = true;

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    window.addEventListener('click', this.onMouseClick.bind(this));
    window.addEventListener('mousemove', this.onMouseMove.bind(this));
    window.addEventListener('touchstart', this.onTouchStart.bind(this));
  }

  setScene(scene: Scene | null): void {
    this.scene = scene;
  }

  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  private onMouseMove(event: MouseEvent): void {
    // Normalize mouse coordinates
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Optional: Add hover effects for interactive objects
    if (this.isEnabled && this.scene) {
      this.checkHover();
    }
  }

  private onMouseClick(event: MouseEvent): void {
    if (!this.isEnabled || !this.scene) return;

    // Update mouse position
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    this.checkInteraction();
  }

  private onTouchStart(event: TouchEvent): void {
    if (!this.isEnabled || !this.scene || event.touches.length === 0) return;

    const touch = event.touches[0];
    this.mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;

    this.checkInteraction();
  }

  private checkInteraction(): void {
    if (!this.scene) return;

    // Update raycaster
    this.raycaster.setFromCamera(this.mouse, this.camera);

    // Check for intersections
    const memory = this.scene.checkInteraction(this.raycaster);

    if (memory) {
      // Show the memory dialogue
      this.dialogueSystem.show(memory.text);

      // Trigger any associated animation
      if (memory.animation) {
        memory.animation();
      }

      // Play any associated audio
      if (memory.audio) {
        this.playAudio(memory.audio);
      }

      // Emit custom event
      const event: InteractionEvent = {
        object: memory.object,
        point: this.raycaster.ray.origin.clone(),
        memory
      };
      window.dispatchEvent(new CustomEvent('memoryTriggered', { detail: event }));
    }
  }

  private checkHover(): void {
    if (!this.scene) return;

    // Update raycaster
    this.raycaster.setFromCamera(this.mouse, this.camera);

    // Get all interactables from the scene
    const interactables = (this.scene as any).interactables || [];
    const intersects = this.raycaster.intersectObjects(interactables, true);

    // Update cursor style
    if (intersects.length > 0) {
      document.body.style.cursor = 'pointer';
    } else {
      document.body.style.cursor = 'default';
    }
  }

  private playAudio(audioPath: string): void {
    const audio = new Audio(audioPath);
    audio.play().catch(error => {
      console.warn('Failed to play audio:', error);
    });
  }

  update(): void {
    // Can be used for continuous interaction checks if needed
  }

  dispose(): void {
    window.removeEventListener('click', this.onMouseClick.bind(this));
    window.removeEventListener('mousemove', this.onMouseMove.bind(this));
    window.removeEventListener('touchstart', this.onTouchStart.bind(this));
  }
} 