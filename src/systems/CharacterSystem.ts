import * as THREE from 'three';
import type { CharacterOptions } from '../types';

export class CharacterSystem {
  private character: THREE.Group;
  private options: CharacterOptions;
  private mixer: THREE.AnimationMixer | null = null;
  private animations: Map<string, THREE.AnimationClip> = new Map();
  private currentAnimation: THREE.AnimationAction | null = null;

  constructor(options: CharacterOptions = {}) {
    this.character = new THREE.Group();
    this.options = {
      hairColor: 0x8B4513, // Brown
      outfitColor: 0xFFB6C1, // Light pink
      skinTone: 0xFFDBD7, // Light skin
      accessories: [],
      ...options
    };

    this.createCharacter();
  }

  private createCharacter(): void {
    // Create a simple low-poly character
    const scale = 0.5;

    // Body
    const bodyGeometry = new THREE.CylinderGeometry(
      0.3 * scale, // top radius
      0.4 * scale, // bottom radius
      1 * scale,   // height
      8            // segments
    );
    const bodyMaterial = new THREE.MeshLambertMaterial({ 
      color: this.options.outfitColor 
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.5 * scale;
    body.castShadow = true;
    body.receiveShadow = true;
    this.character.add(body);

    // Head
    const headGeometry = new THREE.SphereGeometry(0.25 * scale, 8, 6);
    const headMaterial = new THREE.MeshLambertMaterial({ 
      color: this.options.skinTone 
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.25 * scale;
    head.castShadow = true;
    head.receiveShadow = true;
    this.character.add(head);

    // Hair
    const hairGeometry = new THREE.SphereGeometry(0.28 * scale, 8, 6);
    const hairMaterial = new THREE.MeshLambertMaterial({ 
      color: this.options.hairColor 
    });
    const hair = new THREE.Mesh(hairGeometry, hairMaterial);
    hair.position.y = 1.35 * scale;
    hair.scale.y = 0.8;
    hair.castShadow = true;
    this.character.add(hair);

    // Eyes
    const eyeGeometry = new THREE.SphereGeometry(0.03 * scale, 4, 4);
    const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.08 * scale, 1.25 * scale, 0.2 * scale);
    this.character.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.08 * scale, 1.25 * scale, 0.2 * scale);
    this.character.add(rightEye);

    // Arms
    const armGeometry = new THREE.CylinderGeometry(
      0.05 * scale,
      0.05 * scale,
      0.4 * scale,
      6
    );
    const armMaterial = new THREE.MeshLambertMaterial({ 
      color: this.options.skinTone 
    });

    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(-0.35 * scale, 0.7 * scale, 0);
    leftArm.rotation.z = Math.PI / 6;
    leftArm.castShadow = true;
    this.character.add(leftArm);

    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(0.35 * scale, 0.7 * scale, 0);
    rightArm.rotation.z = -Math.PI / 6;
    rightArm.castShadow = true;
    this.character.add(rightArm);

    // Legs
    const legGeometry = new THREE.CylinderGeometry(
      0.08 * scale,
      0.06 * scale,
      0.5 * scale,
      6
    );
    const legMaterial = new THREE.MeshLambertMaterial({ 
      color: this.options.skinTone 
    });

    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(-0.15 * scale, 0, 0);
    leftLeg.castShadow = true;
    this.character.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(0.15 * scale, 0, 0);
    rightLeg.castShadow = true;
    this.character.add(rightLeg);

    // Add accessories if any
    this.addAccessories();
  }

  private addAccessories(): void {
    // Add accessories based on options
    if (this.options.accessories?.includes('bow')) {
      const bowGeometry = new THREE.ConeGeometry(0.1, 0.15, 4);
      const bowMaterial = new THREE.MeshLambertMaterial({ color: 0xFF69B4 });
      const bow = new THREE.Mesh(bowGeometry, bowMaterial);
      bow.position.y = 1.5;
      bow.rotation.z = Math.PI / 4;
      this.character.add(bow);
    }

    // Add more accessories as needed
  }

  getCharacter(): THREE.Group {
    return this.character;
  }

  setPosition(x: number, y: number, z: number): void {
    this.character.position.set(x, y, z);
  }

  lookAt(target: THREE.Vector3): void {
    this.character.lookAt(target);
  }

  // Simple idle animation
  playIdleAnimation(): void {
    const time = Date.now() * 0.001;
    
    // Gentle floating motion
    this.character.position.y = Math.sin(time * 2) * 0.05;
    
    // Slight rotation
    this.character.rotation.y = Math.sin(time) * 0.1;
  }

  // Walking animation
  playWalkAnimation(direction: THREE.Vector3): void {
    const time = Date.now() * 0.01;
    
    // Bob up and down
    this.character.position.y = Math.abs(Math.sin(time * 10)) * 0.1;
    
    // Face direction of movement
    if (direction.length() > 0) {
      const angle = Math.atan2(direction.x, direction.z);
      this.character.rotation.y = angle;
    }
  }

  update(deltaTime: number): void {
    // Update animations
    if (this.mixer) {
      this.mixer.update(deltaTime);
    }
  }

  // Change character appearance
  updateAppearance(options: Partial<CharacterOptions>): void {
    this.options = { ...this.options, ...options };
    
    // Remove old character
    while (this.character.children.length > 0) {
      this.character.remove(this.character.children[0]);
    }
    
    // Recreate with new options
    this.createCharacter();
  }
} 