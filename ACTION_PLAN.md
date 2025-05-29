# Interactive Relationship Story - Action Plan

## Project Overview
Transform the current Crossy Road-style game into an interactive 3D narrative experience that retells relationship milestones through explorable scenes and meaningful interactions.

## Core Concept
- **Navigation**: Instead of endless forward movement, create interconnected scenes representing different moments/locations
- **Protagonist**: Replace the generic player with a customizable character model representing your girlfriend
- **Storytelling**: Each area tells a part of your story through environment, text, and interactions

## Technical Architecture

### 1. Scene Management System
- [ ] Create a `SceneManager` class to handle transitions between different milestone scenes
- [ ] Implement scene loading/unloading for performance
- [ ] Add smooth camera transitions between scenes

### 2. Asset Pipeline
- [ ] Set up a folder structure for custom 3D models and textures
- [ ] Create a simple asset loader system
- [ ] Implement a material system for consistent low-poly aesthetic

### 3. Narrative Framework
- [ ] Create a dialogue/text system for displaying memories and messages
- [ ] Implement interaction points (clickable objects that trigger memories)
- [ ] Add a progress/milestone tracker

## Proof of Concept Milestones

### Phase 1: Foundation (Week 1)
1. **Restructure Current Game**
   - Remove endless generation logic
   - Convert to fixed scene navigation
   - Keep movement controls but adapt for exploration

2. **Create Asset Structure**
   ```
   src/
   ├── assets/
   │   ├── models/
   │   │   ├── characters/
   │   │   ├── environments/
   │   │   └── props/
   │   ├── textures/
   │   └── audio/
   ├── scenes/
   │   ├── Scene.js (base class)
   │   ├── OfficeScene.js
   │   ├── FirstDateScene.js
   │   └── ...
   └── systems/
       ├── SceneManager.js
       ├── DialogueSystem.js
       └── InteractionSystem.js
   ```

3. **Basic Character Model**
   - Create or source a simple low-poly female character
   - Implement basic animations (walk, idle, interact)
   - Add customization options (hair color, outfit)

### Phase 2: First Scene - "Where We Met" (Week 2)
1. **Office Environment**
   - Low-poly office space with desks, computers, coffee machine
   - Ambient office sounds
   - Interactive elements (her desk, your desk, first conversation spot)

2. **Interactions**
   - Click on her desk: "This is where you sat when we first met"
   - Coffee machine: "Our first coffee together"
   - Meeting room: "Where we worked on that first project"

3. **Visual Style Guide**
   - Color palette: Soft pastels with accent colors for important objects
   - Lighting: Warm, nostalgic tone
   - Post-processing: Subtle bloom for dreamy effect

### Phase 3: Additional Scenes (Week 3)
1. **First Date Location**
   - Restaurant/café/park scene
   - Interactive menu, table, or memorable spots
   - Floating text memories when approaching key areas

2. **Milestone Moments**
   - First trip together
   - Moving in together
   - Special celebrations

3. **Transitions**
   - Portal/doorway system between scenes
   - Or timeline path connecting different moments

### Phase 4: Polish & Personalization (Week 4)
1. **Custom Messages**
   - Hidden love notes throughout scenes
   - Photo frames showing your actual photos (as textures)
   - Personalized dialogue for each interaction

2. **Special Effects**
   - Particle hearts when discovering special memories
   - Glowing outlines for interactive objects
   - Footprint trail showing your journey together

3. **Audio**
   - Background music (her favorite songs?)
   - Sound effects for interactions
   - Optional narration

## Technical Implementation Steps

### 1. Model Creation Workflow
- **Option A**: Use Blender for custom models
  - Learn basic low-poly modeling
  - Export as .glb files
  - Use Three.js GLTFLoader

- **Option B**: Use existing assets
  - [Kenney.nl](https://kenney.nl) - Free low-poly assets
  - [Quaternius](https://quaternius.com) - Character models
  - Modify textures for personalization

### 2. Scene Building Tools
```javascript
// Example Scene Structure
class RelationshipScene extends THREE.Group {
  constructor(name, description) {
    super();
    this.name = name;
    this.interactables = [];
    this.memories = [];
  }
  
  addMemory(object, text, trigger) {
    // Add interactive memory points
  }
  
  load() {
    // Load scene-specific assets
  }
}
```

### 3. Interaction System
```javascript
// Simple interaction example
class InteractionSystem {
  constructor(camera, scene) {
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    
    window.addEventListener('click', this.onMouseClick.bind(this));
  }
  
  checkInteraction() {
    // Raycast to find clickable objects
    // Trigger associated memories/dialogue
  }
}
```

## Asset Creation Guidelines

### Character Design
- Height: ~1.5 units
- Polygon count: < 1000 tris
- Texture: Single 256x256 atlas
- Rig: Simple bone structure for animations

### Environment Assets
- Modular pieces for easy scene building
- Consistent scale (1 unit = 1 meter)
- Shared texture atlases for performance
- Props should tell a story

### Color Palette
```
Primary: #FFB6C1 (Light Pink - Love)
Secondary: #87CEEB (Sky Blue - Dreams)
Accent: #FFD700 (Gold - Special Moments)
Base: #F5F5DC (Beige - Warmth)
```

## Quick Start Checklist

1. [ ] Set up Blender (or chosen 3D tool)
2. [ ] Create folder structure
3. [ ] Build scene management system
4. [ ] Create/source character model
5. [ ] Design first scene layout
6. [ ] Implement interaction system
7. [ ] Add first set of memories/dialogue
8. [ ] Test with placeholder content
9. [ ] Iterate and add personal touches

## Resources

### 3D Modeling
- [Blender Guru's Donut Tutorial](https://www.youtube.com/user/AndrewPPrice) - Learn basics
- [Low Poly Modeling Techniques](https://www.youtube.com/results?search_query=low+poly+blender)
- [Three.js Journey](https://threejs-journey.com/) - Advanced Three.js

### Assets
- [Mixamo](https://www.mixamo.com/) - Free character animations
- [Poly Haven](https://polyhaven.com/) - Textures and HDRIs
- [Freesound](https://freesound.org/) - Audio effects

### Inspiration
- "A Short Hike" - Low poly exploration
- "Journey" - Emotional storytelling through environment
- "Florence" - Interactive relationship story

## Next Steps

1. **Today**: Set up asset folders and scene management structure
2. **Tomorrow**: Create or find base character model
3. **This Week**: Build first scene (where you met)
4. **Next Week**: Add interactions and memories
5. **Final Week**: Polish, add music, test thoroughly

## Personal Touch Ideas

- Hide proposal location as secret final scene?
- Include inside jokes as easter eggs
- Use actual photos as textures in picture frames
- Record voice messages for special interactions
- Create a "future together" scene at the end

Remember: The imperfection of handmade assets adds charm and shows effort. Focus on the emotional impact rather than technical perfection. ❤️
