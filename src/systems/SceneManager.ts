import * as THREE from 'three';
import type { Scene } from '../scenes/Scene';

export class SceneManager {
  private scenes: Map<string, Scene>;
  private currentScene: Scene | null;
  private transitioning: boolean;
  public sceneContainer: THREE.Group;

  constructor() {
    this.scenes = new Map();
    this.currentScene = null;
    this.transitioning = false;
    this.sceneContainer = new THREE.Group();
  }

  registerScene(name: string, scene: Scene): void {
    this.scenes.set(name, scene);
  }

  async loadScene(name: string, transitionDuration: number = 1000): Promise<Scene | undefined> {
    if (this.transitioning || !this.scenes.has(name)) return;
    
    this.transitioning = true;
    const newScene = this.scenes.get(name)!;

    // Fade out current scene
    if (this.currentScene) {
      await this.fadeOut(this.currentScene, transitionDuration / 2);
      this.sceneContainer.remove(this.currentScene);
      if (this.currentScene.unload) {
        this.currentScene.unload();
      }
    }

    // Load and fade in new scene
    if (newScene.load) {
      await newScene.load();
    }
    
    this.sceneContainer.add(newScene);
    this.currentScene = newScene;
    
    await this.fadeIn(newScene, transitionDuration / 2);
    this.transitioning = false;

    return newScene;
  }

  private fadeOut(scene: THREE.Object3D, duration: number): Promise<void> {
    return new Promise(resolve => {
      const startOpacity = 1;
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        scene.traverse(child => {
          if ('material' in child && child.material instanceof THREE.Material) {
            child.material.opacity = startOpacity * (1 - progress);
            child.material.transparent = true;
          }
        });

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };

      animate();
    });
  }

  private fadeIn(scene: THREE.Object3D, duration: number): Promise<void> {
    return new Promise(resolve => {
      const targetOpacity = 1;
      const startTime = Date.now();

      // Set initial opacity
      scene.traverse(child => {
        if ('material' in child && child.material instanceof THREE.Material) {
          child.material.opacity = 0;
          child.material.transparent = true;
        }
      });

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        scene.traverse(child => {
          if ('material' in child && child.material instanceof THREE.Material) {
            child.material.opacity = targetOpacity * progress;
          }
        });

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          // Reset transparency for non-transparent materials
          scene.traverse(child => {
            if ('material' in child && child.material instanceof THREE.Material) {
              if ((child.material.userData as any).originallyTransparent !== true) {
                child.material.transparent = false;
              }
            }
          });
          resolve();
        }
      };

      animate();
    });
  }

  update(deltaTime: number): void {
    if (this.currentScene && this.currentScene.update) {
      this.currentScene.update(deltaTime);
    }
  }

  getCurrentScene(): Scene | null {
    return this.currentScene;
  }
} 