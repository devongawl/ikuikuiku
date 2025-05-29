# Day We Met - Narrative Scene Action Plan

## Story Overview
The first narrative scene recreates the day you met at the startup office. The player controls your girlfriend on what is, for her, a normal workday. But it's YOUR first day as a Software Engineer, and you'll choose the desk across from hers, changing both your lives forever.

## Narrative Structure

### Act 1: Morning Routine
- Player starts in girlfriend's apartment bedroom
- Normal morning routine for her
- Environmental storytelling: design work, sketches, her established life
- Memory triggers:
  - Coffee mug: "Just another Tuesday morning..."
  - Design sketches: "The new app redesign was coming along"
  - Calendar: "September 15th. Nothing special planned."

### Act 2: Arrival at the Office
- Player enters the office building
- Takes the elevator to the office floor
- Walks to her usual desk
- Memory trigger:
  - Elevator: "Same elevator, same floor, same routine..."

### Act 3: The Meeting
- Player arrives at her desk in the open office
- Starts working as usual
- You (the new developer) arrive with HR/manager
- You're shown available desks
- The moment: you choose the desk opposite hers
- First eye contact and introduction

## Gameplay Flow

### 1. Apartment Scene (ApartmentScene.ts)
```
Simple apartment layout
├── Bedroom (start)
├── Bathroom 
├── Kitchen (coffee memory)
└── Living room → Exit door
```

### 2. Office Building Scene (OfficeBuildingScene.ts)
```
Combined lobby/elevator sequence
├── Building entrance
├── Elevator (quick transition)
└── Office floor entrance
```

### 3. Office Floor Scene (OfficeFloorScene.ts)
```
Open office layout
├── Her established desk (player destination)
├── Other occupied desks
├── Empty desks (including the one across from hers)
├── You arrive with manager (NPC event)
└── Desk selection moment
```

## Technical Implementation

### Scene Management
1. Create three main scenes:
   - `ApartmentScene.ts` - Morning routine
   - `OfficeBuildingScene.ts` - Quick transition
   - `OfficeFloorScene.ts` - Main story moment
2. Linear progression through scenes
3. Trigger-based scene transitions

### Character System
1. NPCs needed:
   - You (the new developer)
   - Manager/HR person showing you around
   - Background office workers (optional)
2. Scripted NPC movement for your arrival
3. Idle animations for office workers

### Key Mechanics
1. **Morning Routine**: Simple exploration of apartment
2. **Office Navigation**: Getting to her desk
3. **The Moment**: Triggered cutscene when she reaches her desk
4. **Desk Selection**: Watching you choose the desk

### Visual Storytelling
1. **Her Apartment**: Lived-in, designer aesthetic, routine comfort
2. **Office**: Established startup environment, her personalized desk area
3. **Your Arrival**: Nervous new employee energy, looking around at options
4. **The Choice**: The significance of choosing that particular desk

### Dialogue/Narration
1. Her inner monologue: routine thoughts becoming special
2. Brief introduction dialogue when you meet
3. Narrative text: "I didn't know it then, but this ordinary Tuesday..."

## Emotional Arc
1. **Routine**: Just another day
2. **Normalcy**: Arriving at work as usual
3. **Disruption**: New person in the office
4. **Curiosity**: Who's the new developer?
5. **Connection**: The moment you choose the desk and meet

## Implementation Order
1. Create `ApartmentScene.ts` with simple morning routine
2. Create `OfficeBuildingScene.ts` for transition
3. Create `OfficeFloorScene.ts` with her desk
4. Implement NPC system for your arrival
5. Create the desk selection cutscene
6. Add introduction dialogue
7. Polish with lighting and music

## Success Criteria
- The ordinary day feeling transforms into something special
- The desk choice feels significant in hindsight
- Simple but effective environmental storytelling
- Smooth progression and pacing
- Emotional impact of the "ordinary moment that changed everything"

## Simplified Scope
- No complex dialogue trees
- Linear progression (no branching)
- Focus on the one key moment
- Minimal NPC interactions
- Environmental storytelling over exposition 