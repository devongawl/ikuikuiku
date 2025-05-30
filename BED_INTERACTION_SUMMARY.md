# Bed Interaction Implementation

## Feature Overview
Added a realistic bed interaction system where the character starts the apartment scene laying in bed and can return to bed at any time.

## Key Features

### 1. Starting in Bed
- Character begins the scene laying horizontally on the bed
- Character is rotated 90 degrees (lying flat)
- Positioned at the correct height on the mattress

### 2. Getting Out of Bed
- First movement input triggers a smooth "getting up" animation
- Character rotates from horizontal to vertical position
- Height transitions from bed level to floor level
- Movement is queued and executes after standing animation completes

### 3. Returning to Bed
- Moving back to the bed grid position triggers laying down
- Smooth transition animation back to horizontal position
- Character remembers the bed location

### 4. Visual Enhancements
- Bed height increased to match character laying position
- Added blanket visual element
- Bed is now an interactive memory object
- "My warm bed... Maybe just five more minutes? No, I need to get to work."

## Technical Implementation

### Grid Movement Controller
- Added bed state tracking (`isInBed`, `bedPosition`)
- Smooth transition system with `bedTransition` (0-1 value)
- Animation speed: 3 transitions/second
- Prevents movement during bed transition

### Character Controller
- Exposed `setBedPosition()` and `setInBed()` methods
- Bed position set to grid coordinates (-3, 0)

### Scene Integration
- Apartment scene sets character in bed on load
- Shows morning narration: "Another morning... Time to start the day."
- Bed is a named object for memory interaction

## User Experience
1. Game starts with character laying in bed
2. Press any movement key to get up (smooth animation)
3. Character stands and can then move normally
4. Return to bed position to lay down again
5. Natural morning routine narrative flow 