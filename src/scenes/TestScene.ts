import * as THREE from 'three';
import { Scene } from './Scene';
import type { Memory } from '../types';

export class TestScene extends Scene {
  private cube: THREE.Mesh | null = null;

  constructor() {
    super('test-scene', 'A simple test scene to demonstrate the system');
  }

  async loadAssets(): Promise<void> {
    // Create a simple interactive cube
    const geometry = new THREE.BoxGeometry(2, 2, 2);
    const material = new THREE.MeshPhongMaterial({ 
      color: 0xFFB6C1, // Pink from our palette
      emissive: 0xFFB6C1,
      emissiveIntensity: 0.1
    });
    
    this.cube = new THREE.Mesh(geometry, material);
    this.cube.position.set(0, 0, 1);
    this.cube.castShadow = true;
    this.cube.receiveShadow = true;
    
    // Add the cube as an interactive memory
    this.addMemory(
      this.cube, 
      "This is where our story begins... Click around to explore more!",
      { 
        highlight: true,
        animation: () => {
          // Simple rotation animation
          if (this.cube) {
            this.cube.rotation.y += 0.01;
          }
        }
      }
    );
    
    this.add(this.cube);

    // Add some decorative elements
    this.addTrees();
  }

  private addTrees(): void {
    const treePositions: [number, number][] = [
      [-5, -5], [5, -5], [-5, 5], [5, 5]
    ];

    treePositions.forEach(([x, z]) => {
      const tree = this.createSimpleTree();
      tree.position.set(x, 0, z);
      this.add(tree);
    });
  }

  private createSimpleTree(): THREE.Group {
    const tree = new THREE.Group();
    
    // Trunk
    const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.3, 2);
    const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = 1;
    trunk.castShadow = true;
    tree.add(trunk);
    
    // Leaves
    const leavesGeometry = new THREE.ConeGeometry(1, 2, 8);
    const leavesMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
    const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
    leaves.position.y = 3;
    leaves.castShadow = true;
    leaves.receiveShadow = true;
    tree.add(leaves);
    
    return tree;
  }

  update(deltaTime: number): void {
    super.update(deltaTime);
    
    // Run any animations
    this.memories.forEach(memory => {
      if (memory.triggered && memory.animation) {
        memory.animation();
      }
    });
  }
} 