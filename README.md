# Iku - Relationship Story Game

A narrative-driven 3D game about relationships, built with Three.js and TypeScript.

## Features

- Grid-based character movement with smooth animations
- Interactive memories and environmental storytelling
- Scene management system with smooth transitions
- Beautiful apartment environments
- **Custom Wall Art System** - Add your own PNG images as paintings!
- Camera follows character
- Touch and keyboard controls

## Custom Paintings

You can add your own PNG images as wall art in any scene. Here's how:

### Adding Custom PNG Paintings

1. **Place your PNG files** in the `public/assets/paintings/` directory
2. **Use the API** to add them to any scene:

```typescript
// Example: Add a custom painting to the apartment scene
const apartmentScene = sceneManager.getScene('apartment-scene') as ApartmentScene;

apartmentScene.addCustomPainting(
  { x: -9, y: 2.5, z: 2 },     // Wall position
  { width: 1.5, height: 1 },   // Size in world units
  'assets/paintings/my-art.png', // Path to your PNG
  'my-custom-painting'          // Optional name
);
```

### Default Paintings

The apartment scene includes several default colored paintings:
- **Bedroom**: Steel blue abstract
- **Living Room**: Warm orange landscape  
- **Kitchen**: Forest green nature scene
- **Hallway**: Purple abstract art

### Painting Specifications

- **Supported Format**: PNG files
- **Recommended Size**: 512x512px or 1024x1024px for best quality
- **Aspect Ratio**: Any (will be stretched to fit specified dimensions)
- **Frame**: Automatic brown wooden frame around all paintings

## Controls

- **WASD** or **Arrow Keys**: Move character
- **Mouse Wheel**: Zoom camera in/out
- **Click**: Interact with highlighted objects

## Development

```bash
npm install
npm run dev
```

## 🎮 Proof of Concept Features

### ✅ What's Working

1. **Kenney Asset Integration**
   - Successfully loading GLB models from Kenney City Kit
   - Character model from Kenney Blocky Characters with custom skins
   - Proper scaling and positioning of assets

2. **Character Movement**
   - WASD/Arrow key controls
   - Mobile touch joystick (responsive)
   - Smooth character rotation
   - Camera follows character

3. **Interactive Memories**
   - Click on objects to discover memories
   - Coffee machine, desk, and meeting room interactions
   - Dialogue system with typewriter effect
   - Visual feedback for interactive objects

4. **Scene Management**
   - Smooth scene transitions
   - Scene titles on entry
   - TypeScript architecture for easy extension

## 🎨 Art Style Validation

The Kenney assets work beautifully together:
- Consistent low-poly aesthetic
- Warm, nostalgic color palette
- Good performance on all devices
- Charming, approachable style perfect for a romantic story

## 🚀 Getting Started

```bash
npm install
npm run dev
```

## 🎮 Controls

- **Move**: WASD or Arrow Keys
- **Interact**: Click on glowing objects
- **Mobile**: Use on-screen joystick

## 📁 Project Structure

```
src/
├── scenes/
│   ├── Scene.ts          # Base scene class
│   ├── OfficeScene.ts    # "Where we met" scene
│   └── TestScene.ts      # Test environment
├── systems/
│   ├── AssetLoader.ts    # GLB/texture loading
│   ├── CharacterController.ts # Kenney character control
│   ├── DialogueSystem.ts # Memory dialogues
│   ├── InteractionSystem.ts # Click interactions
│   └── SceneManager.ts   # Scene transitions
└── types/
    └── index.ts          # TypeScript interfaces
```

## 🏗️ Next Steps

1. **More Scenes**
   - First date location
   - Special moments
   - Future dreams

2. **Enhanced Interactions**
   - More complex memories
   - Photo frames with real images
   - Audio integration

3. **Polish**
   - Particle effects
   - Background music
   - Save progress

## 💕 Personal Touches to Add

- Custom dialogue for each memory
- Hidden easter eggs
- Photos as textures
- Her favorite music
- Special ending scene

---

Built with love using Three.js, TypeScript, and Kenney.nl assets ❤️ 