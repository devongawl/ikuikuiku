# Our Story - Interactive Relationship Journey

A romantic, interactive 3D experience built with Three.js and TypeScript, using Kenney's low-poly assets.

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