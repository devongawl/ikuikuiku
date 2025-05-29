import * as THREE from 'three';
import { Scene } from './Scene';
import { AssetLoader } from '../systems/AssetLoader';
import type { Memory } from '../types';

export class OfficeScene extends Scene {
  private assetLoader: AssetLoader;
  private buildings: THREE.Group[] = [];

  constructor() {
    super('office-scene', 'Where We Met - The Office');
    this.assetLoader = new AssetLoader();
  }

  protected async loadAssets(): Promise<void> {
    try {
      // Create a more appropriate ground color for an office area
      const ground = this.getObjectByName('ground') as THREE.Mesh;
      if (ground) {
        (ground.material as THREE.MeshLambertMaterial).color.setHex(0x808080); // Gray pavement
      }

      // Add a test cube to verify scene is working
      const testGeometry = new THREE.BoxGeometry(2, 2, 2);
      const testMaterial = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
      const testCube = new THREE.Mesh(testGeometry, testMaterial);
      testCube.position.set(0, 1, -10);
      testCube.castShadow = true;
      testCube.receiveShadow = true;
      this.add(testCube);
      console.log('Test cube added to scene');

      // Create the office building layout
      await this.createOfficeEnvironment();
      
      // Add interactive memories
      this.addOfficeMemories();
      
      // Add some ambient details
      this.addDetails();
      
    } catch (error) {
      console.error('Failed to load office scene:', error);
    }
  }

  private async createOfficeEnvironment(): Promise<void> {
    // Load main office building - use building-g as it looks office-like
    const mainBuilding = await this.assetLoader.loadGLTF(
      'kenney_city-kit-commercial_20/Models/GLB%20format/building-g.glb',
      'office-main'
    );
    AssetLoader.prepareModel(mainBuilding, 0.5);
    mainBuilding.position.set(0, 0, -5);
    this.add(mainBuilding);
    this.buildings.push(mainBuilding);

    // Add surrounding buildings for context
    const buildingPositions = [
      { file: 'building-a.glb', pos: [-15, 0, -5], scale: 0.5 },
      { file: 'building-b.glb', pos: [15, 0, -5], scale: 0.5 },
      { file: 'building-c.glb', pos: [-10, 0, 10], scale: 0.4 },
      { file: 'building-d.glb', pos: [10, 0, 10], scale: 0.4 }
    ];

    for (const config of buildingPositions) {
      try {
        const building = await this.assetLoader.loadGLTF(
          `kenney_city-kit-commercial_20/Models/GLB%20format/${config.file}`,
          config.file
        );
        AssetLoader.prepareModel(building, config.scale);
        building.position.set(config.pos[0], config.pos[1], config.pos[2]);
        this.add(building);
        this.buildings.push(building);
      } catch (error) {
        console.warn(`Failed to load ${config.file}:`, error);
      }
    }

    // Add some detail elements like awnings
    try {
      const awning = await this.assetLoader.loadGLTF(
        'kenney_city-kit-commercial_20/Models/GLB%20format/detail-awning-wide.glb',
        'awning'
      );
      AssetLoader.prepareModel(awning, 0.5);
      awning.position.set(0, 1.5, -2);
      this.add(awning);
    } catch (error) {
      console.warn('Failed to load awning:', error);
    }
  }

  private addOfficeMemories(): void {
    // Create interactive objects with memories
    
    // Coffee machine memory
    const coffeeGeometry = new THREE.CylinderGeometry(0.3, 0.4, 0.8, 8);
    const coffeeMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x2F1B14,
      emissive: 0x2F1B14,
      emissiveIntensity: 0.1
    });
    const coffeeMachine = new THREE.Mesh(coffeeGeometry, coffeeMaterial);
    coffeeMachine.position.set(-3, 0.4, 0);
    coffeeMachine.castShadow = true;
    this.add(coffeeMachine);
    
    this.addMemory(
      coffeeMachine,
      "The coffee machine where we first talked... You asked if I knew how to make it work.",
      {
        highlight: true,
        animation: () => {
          coffeeMachine.rotation.y += 0.02;
        }
      }
    );

    // Desk memory
    const deskGeometry = new THREE.BoxGeometry(2, 0.1, 1);
    const deskMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const desk = new THREE.Mesh(deskGeometry, deskMaterial);
    desk.position.set(3, 0.75, 0);
    desk.castShadow = true;
    this.add(desk);

    // Computer on desk
    const screenGeometry = new THREE.BoxGeometry(0.8, 0.6, 0.05);
    const screenMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x000000,
      emissive: 0x0088FF,
      emissiveIntensity: 0.2
    });
    const screen = new THREE.Mesh(screenGeometry, screenMaterial);
    screen.position.set(3, 1.4, 0);
    screen.castShadow = true;
    this.add(screen);

    const deskGroup = new THREE.Group();
    deskGroup.add(desk);
    deskGroup.add(screen);
    
    this.addMemory(
      deskGroup,
      "Your desk... where you sat every day. I would find excuses to walk by.",
      { highlight: true }
    );

    // Meeting room door
    const doorGeometry = new THREE.BoxGeometry(1.5, 2.5, 0.1);
    const doorMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
    const door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(0, 1.25, -4.5);
    door.castShadow = true;
    this.add(door);
    
    this.addMemory(
      door,
      "The meeting room where we worked on our first project together. Those late nights...",
      { highlight: true }
    );
  }

  private addDetails(): void {
    // Add some plants
    const plantPositions = [
      [-5, 0, -3],
      [5, 0, -3],
      [-2, 0, 3],
      [2, 0, 3]
    ];

    plantPositions.forEach(pos => {
      const plant = this.createPlant();
      plant.position.set(pos[0], pos[1], pos[2]);
      this.add(plant);
    });

    // Add some ambient lighting spheres
    const lightGeometry = new THREE.SphereGeometry(0.2, 8, 6);
    const lightMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xFFFFAA
    });
    
    const ceilingLights = [
      [0, 4, 0],
      [-5, 4, 0],
      [5, 4, 0]
    ];

    ceilingLights.forEach(pos => {
      const light = new THREE.Mesh(lightGeometry, lightMaterial);
      light.position.set(pos[0], pos[1], pos[2]);
      this.add(light);

      // Add actual point light
      const pointLight = new THREE.PointLight(0xFFFFAA, 0.5, 10);
      pointLight.position.copy(light.position);
      this.add(pointLight);
    });
  }

  private createPlant(): THREE.Group {
    const plant = new THREE.Group();
    
    // Pot
    const potGeometry = new THREE.CylinderGeometry(0.3, 0.2, 0.4, 8);
    const potMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const pot = new THREE.Mesh(potGeometry, potMaterial);
    pot.position.y = 0.2;
    pot.castShadow = true;
    plant.add(pot);
    
    // Plant
    const plantGeometry = new THREE.SphereGeometry(0.4, 8, 6);
    const plantMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
    const leaves = new THREE.Mesh(plantGeometry, plantMaterial);
    leaves.position.y = 0.7;
    leaves.scale.y = 1.2;
    leaves.castShadow = true;
    plant.add(leaves);
    
    return plant;
  }

  update(deltaTime: number): void {
    super.update(deltaTime);
    
    // Gentle rotation for buildings (like they're breathing)
    this.buildings.forEach((building, index) => {
      const time = Date.now() * 0.0001;
      building.position.y = Math.sin(time + index) * 0.02;
    });
  }
} 