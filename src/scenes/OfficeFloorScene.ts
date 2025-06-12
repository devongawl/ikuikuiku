import * as THREE from 'three';
import { Scene } from './Scene';
import { AssetLoader } from '../systems/AssetLoader';
import { NPCSystem } from '../systems/NPCSystem';
import type { Memory } from '../types';

export class OfficeFloorScene extends Scene {
  private herDesk: THREE.Group | null = null;
  private targetDesk: THREE.Group | null = null; // The desk across from hers
  private newDeveloper: THREE.Group | null = null;
  private manager: THREE.Group | null = null;
  private storyPhase: 'arrival' | 'working' | 'developer-arrives' | 'desk-selection' | 'meeting' = 'arrival';
  private assetLoader: AssetLoader;
  private npcSystem: NPCSystem;
  private npcs: THREE.Group[] = []; // Array to hold all NPCs (keeping for backwards compatibility)
  private npcMovementData: NPCMovementData[] = []; // Track movement state for each NPC
  private interactiveDesks: THREE.Group[] = []; // All desks that can be interacted with
  private playerSittingAt: THREE.Group | null = null; // Track which desk player is sitting at
  private targetDeskHighlight: THREE.Mesh | null = null; // Visual highlight for target desk
  private storyCompleted: boolean = false; // Track if the main story sequence is complete

  constructor() {
    super('office-floor', 'The Office - September 15th');
    this.assetLoader = new AssetLoader();
    this.npcSystem = new NPCSystem(this, this.assetLoader);
    this.setupGridMovementListener();
  }

  protected async loadAssets(): Promise<void> {
    try {
      // Set up office lighting
      this.setupLighting();
      
      // Create the square office layout
      this.createSquareOfficeLayout();
      
      // Add office details and furniture
      this.addOfficeDetails();
      
      // Load and position NPCs
      await this.loadOfficeNPCs();
      
      // Start the story sequence
      this.startStorySequence();
      
      console.log('OfficeFloorScene assets loaded successfully');
    } catch (error) {
      console.error('Failed to load OfficeFloorScene assets:', error);
    }
  }

  protected setupLighting(): void {
    // Natural window lighting from the windowed side
    const windowLight = new THREE.DirectionalLight(0xFFFAF0, 1.2);
    windowLight.position.set(0, 10, 12);
    windowLight.castShadow = true;
    windowLight.shadow.mapSize.width = 2048;
    windowLight.shadow.mapSize.height = 2048;
    windowLight.shadow.camera.near = 0.5;
    windowLight.shadow.camera.far = 50;
    windowLight.shadow.camera.left = -15;
    windowLight.shadow.camera.right = 15;
    windowLight.shadow.camera.top = 15;
    windowLight.shadow.camera.bottom = -15;
    this.add(windowLight);

    // Soft office fluorescent lighting
    const officeLight = new THREE.DirectionalLight(0xF5F5DC, 0.6);
    officeLight.position.set(-8, 10, -8);
    officeLight.castShadow = true;
    this.add(officeLight);

    // Warm ambient light
    const ambientLight = new THREE.AmbientLight(0xFFFAF0, 0.4);
    this.add(ambientLight);
  }

  private createSquareOfficeLayout(): void {
    // Square office floor (20x20 units)
    const floor = new THREE.Mesh(
      new THREE.BoxGeometry(20, 0.1, 20),
      new THREE.MeshLambertMaterial({ color: 0xF5F5F5 })
    );
    floor.position.set(0, 0, 0);
    floor.receiveShadow = true;
    this.add(floor);

    // Create office walls and windows
    this.createWallsAndWindows();
    
    // Create desk arrangements along the windowed wall
    this.createDeskArea();
    
    // Add elevator area at the back
    this.createElevatorEntrance();
  }

  private createWallsAndWindows(): void {
    const wallMaterial = new THREE.MeshLambertMaterial({ color: 0xFAFAFA });
    const windowMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x87CEEB, 
      transparent: true, 
      opacity: 0.3 
    });
    const windowFrameMaterial = new THREE.MeshLambertMaterial({ color: 0xC0C0C0 });
    const wallHeight = 4;
    const wallThickness = 0.3;

    // Back wall with elevator cutout - create two sections instead of one solid wall
    const elevatorWidth = 2.5; // Slightly wider than elevator doors for proper clearance
    const wallSectionWidth = (20 - elevatorWidth) / 2;
    
    // Left section of back wall
    const backWallLeft = new THREE.Mesh(
      new THREE.BoxGeometry(wallSectionWidth, wallHeight, wallThickness),
      wallMaterial
    );
    backWallLeft.position.set(-wallSectionWidth/2 - elevatorWidth/2, wallHeight / 2, -10);
    backWallLeft.castShadow = true;
    backWallLeft.receiveShadow = true;
    this.add(backWallLeft);

    // Right section of back wall
    const backWallRight = new THREE.Mesh(
      new THREE.BoxGeometry(wallSectionWidth, wallHeight, wallThickness),
      wallMaterial
    );
    backWallRight.position.set(wallSectionWidth/2 + elevatorWidth/2, wallHeight / 2, -10);
    backWallRight.castShadow = true;
    backWallRight.receiveShadow = true;
    this.add(backWallRight);

    // Left wall (solid)
    const leftWall = new THREE.Mesh(
      new THREE.BoxGeometry(wallThickness, wallHeight, 20),
      wallMaterial
    );
    leftWall.position.set(-10, wallHeight / 2, 0);
    leftWall.castShadow = true;
    leftWall.receiveShadow = true;
    this.add(leftWall);

    // Right wall (solid)  
    const rightWall = new THREE.Mesh(
      new THREE.BoxGeometry(wallThickness, wallHeight, 20),
      wallMaterial
    );
    rightWall.position.set(10, wallHeight / 2, 0);
    rightWall.castShadow = true;
    rightWall.receiveShadow = true;
    this.add(rightWall);

    // Front wall with windows (the windowed side)
    this.createWindowedWall();
  }

  private createWindowedWall(): void {
    const wallMaterial = new THREE.MeshLambertMaterial({ color: 0xFAFAFA });
    const windowMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x87CEEB, 
      transparent: true, 
      opacity: 0.3 
    });
    const windowFrameMaterial = new THREE.MeshLambertMaterial({ color: 0xC0C0C0 });
    const wallHeight = 4;
    const wallThickness = 0.3;

    // Create wall sections between windows
    const wallSections = [
      { x: -8, width: 4 }, // Left end
      { x: -2, width: 4 }, // Between first and second window
      { x: 2, width: 4 },  // Between second and third window  
      { x: 8, width: 4 }   // Right end
    ];

    wallSections.forEach(section => {
      const wallPart = new THREE.Mesh(
        new THREE.BoxGeometry(section.width, wallHeight, wallThickness),
        wallMaterial
      );
      wallPart.position.set(section.x, wallHeight / 2, 10);
      wallPart.castShadow = true;
      wallPart.receiveShadow = true;
      this.add(wallPart);
    });

    // Create windows
    const windowPositions = [-6, 0, 6];
    windowPositions.forEach(x => {
      this.createWindow(x, 10);
    });
  }

  private createWindow(x: number, z: number): void {
    const windowWidth = 3;
    const windowHeight = 2.5;
    const frameThickness = 0.1;
    const windowMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x87CEEB, 
      transparent: true, 
      opacity: 0.3 
    });
    const frameMaterial = new THREE.MeshLambertMaterial({ color: 0xC0C0C0 });

    // Window glass
    const windowGlass = new THREE.Mesh(
      new THREE.BoxGeometry(windowWidth, windowHeight, 0.05),
      windowMaterial
    );
    windowGlass.position.set(x, 1.5, z - 0.1);
    this.add(windowGlass);

    // Window frame
    const frameTop = new THREE.Mesh(
      new THREE.BoxGeometry(windowWidth + 0.2, frameThickness, frameThickness),
      frameMaterial
    );
    frameTop.position.set(x, 2.75, z);
    this.add(frameTop);

    const frameBottom = new THREE.Mesh(
      new THREE.BoxGeometry(windowWidth + 0.2, frameThickness, frameThickness),
      frameMaterial
    );
    frameBottom.position.set(x, 0.25, z);
    this.add(frameBottom);

    const frameLeft = new THREE.Mesh(
      new THREE.BoxGeometry(frameThickness, windowHeight, frameThickness),
      frameMaterial
    );
    frameLeft.position.set(x - windowWidth/2 - 0.1, 1.5, z);
    this.add(frameLeft);

    const frameRight = new THREE.Mesh(
      new THREE.BoxGeometry(frameThickness, windowHeight, frameThickness),
      frameMaterial
    );
    frameRight.position.set(x + windowWidth/2 + 0.1, 1.5, z);
    this.add(frameRight);

    // Window divider (cross pattern)
    const dividerV = new THREE.Mesh(
      new THREE.BoxGeometry(frameThickness, windowHeight, frameThickness),
      frameMaterial
    );
    dividerV.position.set(x, 1.5, z);
    this.add(dividerV);

    const dividerH = new THREE.Mesh(
      new THREE.BoxGeometry(windowWidth, frameThickness, frameThickness),
      frameMaterial
    );
    dividerH.position.set(x, 1.5, z);
    this.add(dividerH);
  }

  private createElevatorEntrance(): void {
    // Create elevator recess/alcove for depth
    const elevatorRecess = new THREE.Mesh(
      new THREE.BoxGeometry(2.5, 4, 0.5),
      new THREE.MeshLambertMaterial({ color: 0xE0E0E0 })
    );
    elevatorRecess.position.set(0, 2, -10.25);
    elevatorRecess.receiveShadow = true;
    this.add(elevatorRecess);

    // Elevator doors positioned within the recess
    const elevatorDoors = new THREE.Mesh(
      new THREE.BoxGeometry(2, 3.5, 0.1),
      new THREE.MeshLambertMaterial({ color: 0xC0C0C0 })
    );
    elevatorDoors.position.set(0, 1.75, -10.05); // Positioned just in front of the recess
    elevatorDoors.castShadow = true;
    this.add(elevatorDoors);

    // Add elevator door frame
    const doorFrame = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 3.7, 0.05),
      new THREE.MeshLambertMaterial({ color: 0x808080 })
    );
    doorFrame.position.set(0, 1.85, -10.02);
    this.add(doorFrame);

    // Add elevator call button
    const callButton = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.1, 0.05),
      new THREE.MeshLambertMaterial({ color: 0x4169E1 })
    );
    callButton.position.set(1.5, 1.5, -10.0);
    this.add(callButton);
  }

  private createDeskArea(): void {
    // Position desks along the back wall (facing toward the windows)
    // Her desk (left side of back wall) - NOW THE TARGET DESK!
    this.herDesk = this.createDesk(true); // personalized
    this.herDesk.position.set(-6, 0, -7);
    this.herDesk.rotation.y = 0; // Facing toward windows
    this.herDesk.name = 'her-desk';
    this.herDesk.userData.isInteractive = true;
    this.herDesk.userData.deskType = 'target'; // This is now the target desk
    this.add(this.herDesk);
    this.interactiveDesks.push(this.herDesk);

    // Set this as the target desk (her desk is the special one)
    this.targetDesk = this.herDesk;
    
    // Add special highlighting to the target desk (her desk)
    this.addTargetDeskHighlight();

    // The desk where Devon will sit (right side of back wall) - adjacent to target
    const devonDesk = this.createDesk(false); // empty/new
    devonDesk.position.set(-2, 0, -7); // Adjacent to her desk
    devonDesk.rotation.y = 0; // Facing toward windows
    devonDesk.name = 'devon-desk';
    devonDesk.userData.isInteractive = true;
    devonDesk.userData.deskType = 'devon-target'; // Special desk for Devon
    this.add(devonDesk);
    this.interactiveDesks.push(devonDesk);

    // Additional desks along the back wall
    const additionalDeskPositions = [
      { x: 2, z: -7, name: 'center-right-desk' },   // Center-right
      { x: 6, z: -7, name: 'far-right-desk' }       // Far right
    ];

    additionalDeskPositions.forEach(pos => {
      const desk = this.createDesk(false);
      desk.position.set(pos.x, 0, pos.z);
      desk.rotation.y = 0; // Facing toward windows
      desk.name = pos.name;
      desk.userData.isInteractive = true;
      desk.userData.deskType = 'regular';
      this.add(desk);
      this.interactiveDesks.push(desk);
    });

    console.log(`Created ${this.interactiveDesks.length} interactive desks`);
  }

  private addTargetDeskHighlight(): void {
    if (!this.targetDesk) return;

    // Create a glowing ring around the target desk
    const ringGeometry = new THREE.RingGeometry(1.8, 2.2, 32);
    const ringMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x00FF88,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide
    });
    
    this.targetDeskHighlight = new THREE.Mesh(ringGeometry, ringMaterial);
    this.targetDeskHighlight.position.set(-6, 0.15, -7); // Now at her desk (leftmost), raised to avoid z-fighting
    this.targetDeskHighlight.rotation.x = -Math.PI / 2; // Lay flat on ground
    this.add(this.targetDeskHighlight);
    
    console.log('Added target desk highlight ring at her desk (leftmost)');
  }

  private checkDeskInteraction(gridX: number, gridZ: number): void {
    // Check if player is adjacent to any interactive desk
    for (const desk of this.interactiveDesks) {
      const deskGridX = Math.round(desk.position.x / 2);
      const deskGridZ = Math.round(desk.position.z / 2);
      
      // Check if player is adjacent (1 grid cell away) from desk
      const isAdjacent = (
        (Math.abs(gridX - deskGridX) === 1 && gridZ === deskGridZ) ||
        (gridX === deskGridX && Math.abs(gridZ - deskGridZ) === 1)
      );
      
      if (isAdjacent) {
        // For target desk, sit automatically without spacebar
        if (desk.userData.deskType === 'target' && !this.playerSittingAt) {
          console.log('🎯 Auto-sitting at target desk - no spacebar required');
          this.sitAtDesk(desk);
          return;
        } else {
          this.showDeskInteractionPrompt(desk);
          return;
        }
      }
    }
    
    // No desk nearby, hide interaction prompt
    this.hideDeskInteractionPrompt();
  }

  private showDeskInteractionPrompt(desk: THREE.Group): void {
    if (this.playerSittingAt) return; // Already sitting
    
    const deskType = desk.userData.deskType;
    let message = '';
    
    switch (deskType) {
      case 'target':
        message = 'Press SPACE to sit at my desk - my favorite spot with the perfect view!';
        break;
      case 'devon-target':
        message = 'This empty desk next to mine has a great view too.';
        break;
      case 'occupied':
        message = 'This is my usual desk - feels good to be back.';
        break;
      default:
        message = 'Press SPACE to sit at this desk.';
        break;
    }
    
    // Dispatch interaction prompt event
    window.dispatchEvent(new CustomEvent('showInteractionPrompt', {
      detail: { message, desk }
    }));
  }

  private hideDeskInteractionPrompt(): void {
    window.dispatchEvent(new CustomEvent('hideInteractionPrompt'));
  }

  private async sitAtDesk(desk: THREE.Group): Promise<void> {
    if (this.playerSittingAt) return; // Already sitting
    
    console.log(`Player sitting at desk: ${desk.name}`);
    
    // Calculate chair position (behind the desk)
    const chairX = desk.position.x;
    const chairZ = desk.position.z + 1; // 1 unit behind desk
    
    // Move player to chair position
    window.dispatchEvent(new CustomEvent('forceMoveToPosition', {
      detail: { 
        worldX: chairX, 
        worldZ: chairZ,
        animate: true 
      }
    }));
    
    // Set sitting state
    this.playerSittingAt = desk;
    
    // Hide interaction prompt
    this.hideDeskInteractionPrompt();
    
    // Show sitting message
    const deskType = desk.userData.deskType;
    if (deskType === 'target') {
      console.log('🎯 Player sat at TARGET DESK - triggering cinematic sequence');
      
      window.dispatchEvent(new CustomEvent('storyNarration', {
        detail: { message: "Ah, my favorite desk! I love this view of the city. Time to get some work done..." }
      }));
      
      // Lock player movement for cinematic sequence
      window.dispatchEvent(new CustomEvent('lockPlayerMovement', {
        detail: { locked: true }
      }));
      
      // Trigger Devon to move to adjacent desk immediately (no delay)
      this.triggerDevonMovement();
    } else {
      window.dispatchEvent(new CustomEvent('storyNarration', {
        detail: { message: "Taking a seat at this desk. Nice view from here too." }
      }));
    }
  }

  private triggerDevonMovement(): void {
    console.log('🎯 Target desk occupied! Triggering Devon to move to adjacent desk...');
    console.log('🎯 NPCs array length:', this.npcs.length);
    console.log('🎯 Movement data array length:', this.npcMovementData.length);
    
    // Find Devon (he's the first NPC, index 0)
    const devon = this.npcs[0];
    const devonMovementData = this.npcMovementData[0];
    
    if (!devon || !devonMovementData) {
      console.error('❌ Could not find Devon NPC for movement trigger');
      // Unlock player movement if Devon not found
      window.dispatchEvent(new CustomEvent('lockPlayerMovement', {
        detail: { locked: false }
      }));
      return;
    }
    
    // Lock camera on Devon for cinematic effect - permanent until scene change
    console.log('🎯 Dispatching lockCameraOnTarget event for Devon:', devon);
    console.log('🎯 Devon position:', devon.position);
    console.log('🎯 Devon name:', devon.name);
    
    window.dispatchEvent(new CustomEvent('lockCameraOnTarget', {
      detail: { 
        target: devon,
        zoomLevel: 1.5, // Zoom in closer
        duration: 0 // Permanent lock until manual release
      }
    }));
    
    window.dispatchEvent(new CustomEvent('storyNarration', {
      detail: { message: "I notice Devon looking around for a good spot to sit..." }
    }));
    
    // Create a special movement sequence for Devon to reach the adjacent desk
    const devonTargetDesk = new THREE.Vector3(-2, 0, -7); // Devon's target desk position
    const chairPosition = new THREE.Vector3(-2, 0, -6); // Behind the desk (chair position)
    
    // Replace Devon's current waypoints with a direct path to the desk
    devonMovementData.waypoints = [
      devon.position.clone(), // Current position
      new THREE.Vector3(-2, 0, -5), // Intermediate position (step forward)
      chairPosition // Final chair position behind desk
    ];
    devonMovementData.currentWaypointIndex = 1; // Start moving to next waypoint
    devonMovementData.isMoving = true;
    devonMovementData.currentWaitTime = 0;
    devonMovementData.moveSpeed = 1.5; // Much faster movement for cinematic effect
    
    // Add narrative progression with faster timing
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('storyNarration', {
        detail: { message: "Devon gets up and walks over to the desk next to mine..." }
      }));
    }, 800);
    
    // Final narrative when he reaches the desk
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('storyNarration', {
        detail: { message: "Perfect timing! Devon settles in at the desk right next to mine. This is how we first became desk neighbors..." }
      }));
      
      // Update story phase to reflect this key moment
      this.storyPhase = 'meeting';
      
      // Keep camera locked on Devon - don't release it
      
      // Trigger scene change after a moment to let the narrative sink in
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('storyNarration', {
          detail: { message: "Little did I know, this moment would change everything..." }
        }));
        
        // Trigger scene transition after final narration
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('storyNarration', {
            detail: { message: "And that's how our story began..." }
          }));
          
          // Mark story as completed
          this.storyCompleted = true;
          
          // Keep both characters locked at their desks - they've found their places
          console.log('🎯 Story sequence complete - both characters remain at their desks');
          
          // Stop Devon's normal movement pattern - he's now settled at his desk
          if (this.npcMovementData[0]) {
            this.npcMovementData[0].isMoving = false;
            this.npcMovementData[0].waypoints = []; // Clear waypoints so he stays put
            console.log('✅ Devon locked at his new desk position');
          }
          
          // Final ending message
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('storyNarration', {
              detail: { message: "The End. Thank you for playing! 💕" }
            }));
            
            console.log('🎯 Game complete - both characters permanently settled at their desks');
            
            // Apply dark filter and show final modal after a brief pause
            setTimeout(() => {
              // Apply dark screen filter
              window.dispatchEvent(new CustomEvent('applyScreenFilter', {
                detail: { 
                  type: 'darken',
                  intensity: 0.4, // 40% darker
                  duration: 2000 // 2 second fade in
                }
              }));
              
              // Show final chapter modal after the filter starts
              setTimeout(() => {
                window.dispatchEvent(new CustomEvent('showModal', {
                  detail: { 
                    title: "Chapter 1: The day we met",
                    message: "Love you musu",
                    type: 'ending',
                    persistent: true // Modal stays on screen
                  }
                }));
              }, 1000); // 1 second delay to let filter start
              
            }, 1500); // 1.5 second pause after "The End" message
            
          }, 2000);
          
        }, 3000);
      }, 2000);
      
    }, 5000);
    
    console.log('✅ Devon cinematic movement sequence initiated');
  }

  private standUpFromDesk(): void {
    if (!this.playerSittingAt) return;
    
    // Prevent standing up if the story sequence is complete
    if (this.storyCompleted) {
      console.log('🔒 Cannot stand up - story sequence complete, game ended');
      window.dispatchEvent(new CustomEvent('storyNarration', {
        detail: { message: "This is where our story ends... right here, next to Devon. Perfect." }
      }));
      return;
    }
    
    console.log('Player standing up from desk');
    const wasTargetDesk = this.playerSittingAt.userData.deskType === 'target';
    this.playerSittingAt = null;
    
    // Unlock player movement and camera if standing up from target desk
    if (wasTargetDesk) {
      window.dispatchEvent(new CustomEvent('lockPlayerMovement', {
        detail: { locked: false }
      }));
      window.dispatchEvent(new CustomEvent('releaseCameraLock'));
    }
    
    window.dispatchEvent(new CustomEvent('storyNarration', {
      detail: { message: "Standing up from the desk." }
    }));
  }

  private getCurrentNearbyDesk(): THREE.Group | null {
    // Get player's current grid position - we'll need to get this from the movement controller
    // For now, we'll check all desks and see if any interaction prompt is currently active
    for (const desk of this.interactiveDesks) {
      const deskGridX = Math.round(desk.position.x / 2);
      const deskGridZ = Math.round(desk.position.z / 2);
      
      // This is a simplified check - in a real implementation we'd get the actual player position
      // For now, we'll return the first interactive desk we find
      // TODO: Get actual player grid position from the movement controller
    }
    
    // Temporary: just return target desk for testing
    return this.targetDesk;
  }

  private createMeetingArea(): void {
    // Removed conference table - keeping this method empty in case we want to add other furniture later
  }

  private createDesk(isPersonalized: boolean): THREE.Group {
    const deskGroup = new THREE.Group();
    
    // Desk base
    const desk = new THREE.Mesh(
      new THREE.BoxGeometry(2, 0.8, 1.2),
      new THREE.MeshLambertMaterial({ color: 0x8B4513 })
    );
    desk.position.y = 0.4;
    desk.castShadow = true;
    deskGroup.add(desk);

    // Desk top
    const deskTop = new THREE.Mesh(
      new THREE.BoxGeometry(2.1, 0.05, 1.3),
      new THREE.MeshLambertMaterial({ color: 0xA0522D })
    );
    deskTop.position.y = 0.825;
    deskGroup.add(deskTop);

    // Monitor
    const monitor = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.6, 0.1),
      new THREE.MeshLambertMaterial({ color: 0x2F2F2F })
    );
    monitor.position.set(0, 1.3, -0.3);
    deskGroup.add(monitor);

    // Office chair
    const chair = this.createOfficeChair();
    chair.position.set(0, 0, 0.8);
    deskGroup.add(chair);

    if (isPersonalized) {
      // Add personal items to her desk
      this.addPersonalItems(deskGroup);
    }

    return deskGroup;
  }

  private addPersonalItems(deskGroup: THREE.Group): void {
    // Coffee mug
    const mug = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.12, 0.25, 8),
      new THREE.MeshLambertMaterial({ color: 0xFFB6C1 })
    );
    mug.position.set(-0.6, 1.0, 0.3);
    deskGroup.add(mug);

    // Design portfolio/folder
    const portfolio = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.02, 0.4),
      new THREE.MeshLambertMaterial({ color: 0x4169E1 })
    );
    portfolio.position.set(0.5, 0.85, 0.2);
    deskGroup.add(portfolio);

    // Small plant
    const plantPot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.08, 0.15, 8),
      new THREE.MeshLambertMaterial({ color: 0x8B4513 })
    );
    plantPot.position.set(-0.7, 0.9, -0.2);
    deskGroup.add(plantPot);

    const plant = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 8, 6),
      new THREE.MeshLambertMaterial({ color: 0x228B22 })
    );
    plant.position.set(-0.7, 1.1, -0.2);
    plant.scale.y = 1.3;
    deskGroup.add(plant);
  }

  private createOfficeChair(): THREE.Group {
    const chair = new THREE.Group();
    
    // Seat
    const seat = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.08, 0.8),
      new THREE.MeshLambertMaterial({ color: 0x2F2F2F })
    );
    seat.position.y = 0.7;
    chair.add(seat);

    // Backrest - changed to dark gray instead of black to distinguish from monitor
    const backrest = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.8, 0.08),
      new THREE.MeshLambertMaterial({ color: 0x4A4A4A })
    );
    backrest.position.set(0, 1.1, -0.36);
    chair.add(backrest);

    // Chair base
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.3, 0.1, 8),
      new THREE.MeshLambertMaterial({ color: 0x696969 })
    );
    base.position.y = 0.35;
    chair.add(base);

    return chair;
  }

  private addOfficeDetails(): void {
    // Add office memories
    this.addOfficeMemories();
    
    // Add some office plants in corners
    this.addOfficeDecor();
  }

  private addOfficeDecor(): void {
    // Office plants in corners (away from windows)
    const plantPositions = [
      { x: -8, z: -8 }, { x: 8, z: -8 }  // Back corners only
    ];

    plantPositions.forEach(pos => {
      const plant = this.createOfficePlant();
      plant.position.set(pos.x, 0, pos.z);
      this.add(plant);
    });

    // Add some filing cabinets along the side walls
    this.addFilingCabinets();
  }

  private addFilingCabinets(): void {
    const cabinetPositions = [
      { x: -8, z: -4 }, { x: -8, z: 4 },  // Left wall
      { x: 8, z: -4 }, { x: 8, z: 4 }     // Right wall
    ];

    cabinetPositions.forEach(pos => {
      const cabinet = this.createFilingCabinet();
      cabinet.position.set(pos.x, 0, pos.z);
      this.add(cabinet);
    });
  }

  private createFilingCabinet(): THREE.Group {
    const cabinet = new THREE.Group();
    
    // Cabinet body
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1.2, 0.6),
      new THREE.MeshLambertMaterial({ color: 0xD3D3D3 })
    );
    body.position.y = 0.6;
    body.castShadow = true;
    cabinet.add(body);

    // Cabinet drawers (visual lines)
    for (let i = 0; i < 3; i++) {
      const drawerHandle = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.05, 0.05),
        new THREE.MeshLambertMaterial({ color: 0x696969 })
      );
      drawerHandle.position.set(0.4, 0.3 + i * 0.3, 0);
      cabinet.add(drawerHandle);
    }

    return cabinet;
  }

  private createOfficePlant(): THREE.Group {
    const plant = new THREE.Group();
    
    const planter = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.3, 0.6, 8),
      new THREE.MeshLambertMaterial({ color: 0x696969 })
    );
    planter.position.y = 0.3;
    plant.add(planter);
    
    const leaves = new THREE.Mesh(
      new THREE.SphereGeometry(0.6, 8, 6),
      new THREE.MeshLambertMaterial({ color: 0x228B22 })
    );
    leaves.position.y = 1.2;
    leaves.scale.y = 1.4;
    plant.add(leaves);
    
    return plant;
  }

  private addOfficeMemories(): void {
    // Her desk memory
    if (this.herDesk) {
      this.addMemory(
        this.herDesk,
        "My desk facing the windows. I loved watching the world outside while working.",
        { highlight: true }
      );
    }

    // Target desk memory
    if (this.targetDesk) {
      this.addMemory(
        this.targetDesk,
        "That desk with the perfect view of the windows. A great spot for a new developer.",
        { highlight: true }
      );
    }

    // Add memories for NPCs
    this.npcs.forEach((npc, index) => {
      const npcMemories = [
        "Devon from Development. Always buried in his code, but he gave me great technical advice.",
        "Lotte, our Project Manager. She had a way of keeping everyone organized and motivated.", 
        "Joonatan from HR. A friendly guy who always made sure everyone felt welcome.",
        "Mark, the UI Designer. We often discussed design principles during coffee breaks."
      ];

      if (npc && index < npcMemories.length) {
        this.addMemory(
          npc,
          npcMemories[index],
          { highlight: true }
        );
      }
    });
  }

  private startStorySequence(): void {
    // Initial narrative
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('storyNarration', {
        detail: { message: "Just another Tuesday at the office. I loved my desk facing the windows..." }
      }));
    }, 1000);

    // Start the main story sequence after player has a moment to look around
    setTimeout(() => {
      this.storyPhase = 'working';
      this.triggerDeveloperArrival();
    }, 5000);
  }

  private triggerDeveloperArrival(): void {
    this.storyPhase = 'developer-arrives';
    
    window.dispatchEvent(new CustomEvent('storyNarration', {
      detail: { message: "That's when I heard voices coming from the elevator..." }
    }));

    // Simulate the new developer and manager arriving
    setTimeout(() => {
      this.storyPhase = 'desk-selection';
      window.dispatchEvent(new CustomEvent('storyNarration', {
        detail: { message: "A new developer was being shown around. They were looking for a desk with a good view..." }
      }));
    }, 3000);

    // The moment he chooses the desk across from hers
    setTimeout(() => {
      this.storyPhase = 'meeting';
      window.dispatchEvent(new CustomEvent('storyNarration', {
        detail: { message: "Of all the window desks, he chose the one right next to mine." }
      }));
      
      // Final revelation
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('storyNarration', {
          detail: { message: "I didn't know it then, but this ordinary Tuesday would change everything..." }
        }));
      }, 4000);
      
    }, 6000);
  }

  private setupGridMovementListener(): void {
    const handleGridMovement = (event: CustomEvent) => {
      const { position } = event.detail;
      
      // Check if character reached her desk area
      this.checkDeskReached(position.x, position.z);
      
      // Check for desk interactions
      this.checkDeskInteraction(position.x, position.z);
    };
    
    // Handle SPACE key for sitting at desks (except target desk which auto-sits)
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.code === 'Space' && !this.playerSittingAt) {
        const currentDeskNearby = this.getCurrentNearbyDesk();
        if (currentDeskNearby && currentDeskNearby.userData.deskType !== 'target') {
          event.preventDefault();
          this.sitAtDesk(currentDeskNearby);
        }
      } else if (event.code === 'Escape' && this.playerSittingAt) {
        // Allow standing up with Escape key (unless story is complete)
        event.preventDefault();
        this.standUpFromDesk();
      }
    };
    
    window.addEventListener('gridMoveComplete', handleGridMovement as EventListener);
    window.addEventListener('keydown', handleKeyPress as EventListener);
    (this as any).gridMovementListener = handleGridMovement;
    (this as any).keyPressListener = handleKeyPress;
  }

  private checkDeskReached(gridX: number, gridZ: number): void {
    // Her desk is now at world position (-6, -7), grid position (-3, -3.5)
    if (gridX === -3 && gridZ === -3) {
      window.dispatchEvent(new CustomEvent('storyNarration', {
        detail: { message: "Settling in at my desk with the beautiful window view..." }
      }));
    }
  }

  protected registerColliders(): void {
    if (!this.collisionManager) {
      console.warn('No collision manager set for OfficeFloorScene');
      return;
    }

    console.log('🏢 Registering office floor collisions');

    const registerCollision = (name: string, centerX: number, centerZ: number, width: number, depth: number) => {
      const gridSize = 2;
      const positions: {x: number, z: number}[] = [];
      
      const minX = Math.floor((centerX - width/2) / gridSize);
      const maxX = Math.floor((centerX + width/2) / gridSize);
      const minZ = Math.floor((centerZ - depth/2) / gridSize);
      const maxZ = Math.floor((centerZ + depth/2) / gridSize);
      
      for (let x = minX; x <= maxX; x++) {
        for (let z = minZ; z <= maxZ; z++) {
          positions.push({x, z});
        }
      }
      
      if (positions.length > 0) {
        this.collisionManager!.addStaticCollider({
          type: 'static',
          gridPositions: positions,
          name
        });
      }
    };

    // Register walls - updated for elevator cutout
    const elevatorWidth = 2.5;
    const wallSectionWidth = (20 - elevatorWidth) / 2;
    const leftWallCenterX = -wallSectionWidth/2 - elevatorWidth/2;
    const rightWallCenterX = wallSectionWidth/2 + elevatorWidth/2;
    
    registerCollision('back-wall-left', leftWallCenterX, -10, wallSectionWidth, 0.3);
    registerCollision('back-wall-right', rightWallCenterX, -10, wallSectionWidth, 0.3);
    registerCollision('front-wall-sections', 0, 10, 20, 0.3); // Window wall structure
    registerCollision('left-wall', -10, 0, 0.3, 20);
    registerCollision('right-wall', 10, 0, 0.3, 20);

    // Register elevator area as walkable but with some collision for the recess
    registerCollision('elevator-recess', 0, -10.25, 2.5, 0.5);

    // Register key desks along back wall
    registerCollision('her-desk', -6, -7, 1.5, 1);
    registerCollision('devon-desk', -2, -7, 1.5, 1);
    registerCollision('center-right-desk', 2, -7, 1.5, 1);
    registerCollision('far-right-desk', 6, -7, 1.5, 1);

    // Register filing cabinets
    registerCollision('filing-cabinets-left', -8, -4, 1, 0.6);
    registerCollision('filing-cabinets-left2', -8, 4, 1, 0.6);
    registerCollision('filing-cabinets-right', 8, -4, 1, 0.6);
    registerCollision('filing-cabinets-right2', 8, 4, 1, 0.6);

    console.log('✅ Office floor collisions registered');
  }

  unload(): void {
    super.unload();
    
    // Clean up NPCs
    this.npcs.forEach(npc => {
      // Dispose of textures and materials
      npc.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if (child.material instanceof THREE.Material) {
            // Check if material has a map property (like MeshLambertMaterial)
            if ('map' in child.material && child.material.map) {
              (child.material.map as THREE.Texture).dispose();
            }
            child.material.dispose();
          }
          if (child.geometry) {
            child.geometry.dispose();
          }
        }
      });
      
      // Remove from scene
      this.remove(npc);
    });
    
    // Clear NPCs array and movement data
    this.npcs = [];
    this.npcMovementData = [];
    
    if ((this as any).gridMovementListener) {
      window.removeEventListener('gridMoveComplete', (this as any).gridMovementListener);
      (this as any).gridMovementListener = null;
    }
    
    if ((this as any).keyPressListener) {
      window.removeEventListener('keydown', (this as any).keyPressListener);
      (this as any).keyPressListener = null;
    }
  }

  update(deltaTime: number): void {
    super.update(deltaTime);
    
    // Update NPCs with name labels
    this.npcSystem.update(deltaTime);
    
    // Update NPC movements
    this.updateNPCMovements(deltaTime);
    
    // Update target desk highlight animation
    this.updateTargetDeskHighlight(deltaTime);
    
    // Update story elements based on current phase
    // Could add NPC animations here in the future
  }

  private updateTargetDeskHighlight(deltaTime: number): void {
    if (!this.targetDeskHighlight) return;
    
    // Keep it simple - just a steady glow with very slow rotation
    // No pulsing to avoid flickering
    (this.targetDeskHighlight.material as THREE.MeshBasicMaterial).opacity = 0.6;
    
    // Very slow, subtle rotation
    this.targetDeskHighlight.rotation.z += deltaTime * 0.05;
  }

  private updateNPCMovements(deltaTime: number): void {
    // If story is completed, don't move any NPCs - they're all settled in their final positions
    if (this.storyCompleted) {
      return;
    }
    
    this.npcMovementData.forEach(data => {
      if (data.waypoints.length === 0) return;
      
      const currentWaypoint = data.waypoints[data.currentWaypointIndex];
      const npcPosition = data.npc.position;
      
      if (!data.isMoving) {
        // NPC is waiting at a waypoint
        data.currentWaitTime += deltaTime;
        
        if (data.currentWaitTime >= data.waitTime) {
          // Start moving to next waypoint
          data.isMoving = true;
          data.currentWaitTime = 0;
          
          // Calculate rotation to face the target waypoint
          const direction = new THREE.Vector3()
            .subVectors(currentWaypoint, npcPosition)
            .normalize();
          
          if (direction.length() > 0.1) {
            const targetRotation = Math.atan2(direction.x, direction.z);
            data.npc.rotation.y = targetRotation;
          }
        }
      } else {
        // NPC is moving toward waypoint
        const direction = new THREE.Vector3().subVectors(currentWaypoint, npcPosition);
        const distance = direction.length();
        
        if (distance < 0.1) {
          // Reached waypoint
          data.isMoving = false;
          data.npc.position.copy(currentWaypoint);
          
          // Move to next waypoint (loop back to start if at end)
          data.currentWaypointIndex = (data.currentWaypointIndex + 1) % data.waypoints.length;
          
          // Reset wait time with some randomness
          data.waitTime = 2 + Math.random() * 3;
        } else {
          // Move toward waypoint
          const moveVector = direction.normalize().multiplyScalar(data.moveSpeed * deltaTime);
          data.npc.position.add(moveVector);
        }
      }
    });
  }

  private async loadOfficeNPCs(): Promise<void> {
    console.log('Loading office NPCs with name labels...');
    
    // Create NPCs using the NPCSystem with proper names - spread around the office
    const npcConfigs = [
      {
        name: 'Devon',
        position: new THREE.Vector3(-6, 0, 0), // Coffee/break area (left side center)
        modelType: 'basic' as const,
        description: 'Senior Developer - focused on his code'
      },
      {
        name: 'Lotte', 
        position: new THREE.Vector3(0, 0, -4), // Center of office
        modelType: 'advanced' as const,
        description: 'Project Manager - reviewing reports'
      },
      {
        name: 'Joonatan',
        position: new THREE.Vector3(-7, 0, -2), // Near left filing cabinets
        modelType: 'basic' as const,
        description: 'HR Representative - organizing files'
      },
      {
        name: 'Mark',
        position: new THREE.Vector3(4, 0, 6), // Near windows, right side
        modelType: 'advanced' as const,
        description: 'Designer - taking a break by the window'
      }
    ];

    // Create NPCs using the NPC system
    for (let i = 0; i < npcConfigs.length; i++) {
      const config = npcConfigs[i];
      try {
        const npc = await this.npcSystem.createNPC(config);
        
        // Also add to the legacy npcs array for backwards compatibility
        this.npcs.push(npc.group);
        
        // Initialize movement data for this NPC
        const movementData = this.createMovementDataForNPC(npc.group, i);
        this.npcMovementData.push(movementData);
        
        console.log(`✅ Loaded NPC with name label: ${config.name}`);
      } catch (error) {
        console.error(`❌ Failed to load NPC ${config.name}:`, error);
      }
    }
    
    console.log(`Loaded ${this.npcs.length} NPCs successfully with name labels`);
  }

  // Getter to access the NPC system for other tasks
  public getNPCSystem(): NPCSystem {
    return this.npcSystem;
  }

  private createMovementDataForNPC(npc: THREE.Group, index: number): NPCMovementData {
    const waypoints: THREE.Vector3[] = [];
    
    // Define different movement patterns for each NPC based on their role and starting position
    switch (index) {
      case 0: // Devon (Developer) - starts at coffee area, moves between break area and desk area
        waypoints.push(
          new THREE.Vector3(-6, 0, 0),     // Coffee/break area (starting position)
          new THREE.Vector3(-4, 0, -2),    // Move toward center
          new THREE.Vector3(-2, 0, -4),    // Near desk area
          new THREE.Vector3(-2, 0, -6.2),  // His future desk position
          new THREE.Vector3(-4, 0, -2),    // Return path
          new THREE.Vector3(-6, 0, 2)      // Back toward break area
        );
        break;
        
      case 1: // Lotte (Project Manager) - starts center, moves around checking on people
        waypoints.push(
          new THREE.Vector3(0, 0, -4),     // Center of office (starting position)
          new THREE.Vector3(-2, 0, -4),    // Check left side
          new THREE.Vector3(-4, 0, -2),    // Visit Devon area
          new THREE.Vector3(0, 0, -2),     // Center again
          new THREE.Vector3(4, 0, -2),     // Check right side
          new THREE.Vector3(2, 0, -4),     // Near right desks
          new THREE.Vector3(2, 0, -6.2)    // Her desk area
        );
        break;
        
      case 2: // Joonatan (HR) - starts at filing cabinets, moves between files and office
        waypoints.push(
          new THREE.Vector3(-7, 0, -2),    // Left filing cabinet (starting position)
          new THREE.Vector3(-7, 0, 2),     // Other filing cabinet
          new THREE.Vector3(-4, 0, 2),     // Move into office
          new THREE.Vector3(-2, 0, 0),     // Center-left area
          new THREE.Vector3(0, 0, 2),      // Center office
          new THREE.Vector3(-4, 0, 0),     // Return path
          new THREE.Vector3(-7, 0, 0)      // Return to filing area
        );
        break;
        
      case 3: // Mark (Designer) - starts near windows, moves around for inspiration
        waypoints.push(
          new THREE.Vector3(4, 0, 6),      // Near windows (starting position)
          new THREE.Vector3(2, 0, 4),      // Step back from windows
          new THREE.Vector3(0, 0, 2),      // Center office
          new THREE.Vector3(-2, 0, 2),     // Left side
          new THREE.Vector3(0, 0, 0),      // Center again
          new THREE.Vector3(4, 0, 2),      // Right side
          new THREE.Vector3(6, 0, 4)       // Back toward windows area
        );
        break;
    }
    
    const waitTime = 0.5 + Math.random() * 1; // Shorter wait time between 0.5-1.5 seconds
    
    return {
      npc: npc,
      waypoints: waypoints,
      currentWaypointIndex: 0,
      moveSpeed: 0.5 + Math.random() * 0.5, // Random speed between 0.5 and 1.0
      waitTime: waitTime,
      currentWaitTime: waitTime, // Start ready to move immediately
      isMoving: false,
      name: npc.name
    };
  }

  private async createNPC(config: {
    name: string;
    model: string;
    skin: string;
    position: { x: number; y: number; z: number };
    rotation: number;
    description: string;
  }): Promise<THREE.Group> {
    // Load the character model
    const character = await this.assetLoader.loadGLTF(config.model, config.name);
    
    // Scale the character appropriately (1.5x bigger than before: 0.05 * 1.5 = 0.075)
    character.scale.setScalar(0.075);
    
    // Load and apply the skin texture
    const skinTexture = await this.assetLoader.loadTexture(config.skin);
    skinTexture.flipY = false; // GLTF textures don't need flipping
    
    // Apply the skin to all meshes
    character.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material = new THREE.MeshLambertMaterial({
          map: skinTexture,
          color: 0xffffff
        });
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    
    // Position the character
    character.position.set(config.position.x, config.position.y, config.position.z);
    character.rotation.y = config.rotation;
    
    // Add name and description for potential interactions
    character.name = config.name;
    character.userData.description = config.description;
    
    return character;
  }
}

interface NPCMovementData {
  npc: THREE.Group;
  waypoints: THREE.Vector3[];
  currentWaypointIndex: number;
  moveSpeed: number;
  waitTime: number;
  currentWaitTime: number;
  isMoving: boolean;
  name: string;
} 