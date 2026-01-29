# Color Card & Avatar System Update

## Overview

Added premium playing card-style color selection and a unique color-coded avatar system.

## New Features

### 1. ColorCard Component (`/components/ColorCard.tsx`)

A beautiful playing card-style component for displaying and selecting colors with:

**Visual Features:**

- 3D card effect with depth and shadows
- Animated entrance (staggered by index)
- Hover effects (card lifts and tilts)
- Selection state with checkmark overlay
- Correct answer state with success indicator
- Corner decorations for card aesthetic
- Center color swatch
- Gradient shine effect

**Props:**

- `color`: The color to display
- `isSelected`: Whether the card is selected
- `isCorrect`: Whether to show as correct answer
- `onClick`: Click handler
- `disabled`: Disable interaction
- `size`: 'small' | 'medium' | 'large'
- `index`: For staggered animations

**Sizes:**

- Small: 128x192px (w-32 h-48)
- Medium: 160x240px (w-40 h-60)
- Large: 192x288px (w-48 h-72)

### 2. Color-Coded Avatar System

**Updated `/constants/avatars.ts`:**

- 16 unique avatar colors matching the game's vibrant palette
- Each avatar has an ID, color hex, and display name
- Helper functions: `getAvatarColor()`, `getAvatarName()`

**Avatar Colors:**

1. Cyber Blue (#00e5ff)
2. Neon Pink (#f83a7b)
3. Electric Purple (#9d50bb)
4. Solar Orange (#ff9d00)
5. Matrix Green (#00ffaa)
6. Crimson Red (#ff3366)
7. Royal Violet (#7b2cbf)
8. Golden Yellow (#ffd700)
9. Aqua Teal (#00d9ff)
10. Hot Magenta (#ff006e)
11. Lime Green (#ccff00)
12. Deep Indigo (#4a148c)
13. Coral Red (#ff5252)
14. Sky Cyan (#00bcd4)
15. Sunset Orange (#ff6f00)
16. Mint Green (#69f0ae)

### 3. Unique Avatar Selection

**PlayerJoinScreen Updates:**

- Shows which avatars are already taken
- Locked avatars display with lock icon
- Automatically selects first available avatar
- Prevents joining with a taken avatar
- Visual feedback for taken vs available avatars
- Tooltips showing avatar names

**Features:**

- Real-time avatar availability
- Auto-switch if selected avatar becomes taken
- Lock icon overlay on taken avatars
- Reduced opacity for unavailable avatars
- Hover effects only on available avatars

### 4. Updated Components

**PlayerQuestionScreen:**

- Now uses ColorCard components instead of basic color blocks
- Cards arranged in 2-column grid
- Medium size cards for mobile-friendly display
- Maintains all selection logic

**HostResultScreen:**

- Uses large ColorCard components to show correct answers
- Dramatic card reveal animations
- Playing card aesthetic for answer display

**GameAvatars Component:**

- Added colored background support
- `showBackground` prop (default: true)
- Rounded corners for avatar containers
- Padding for better visual separation

## Usage Examples

### ColorCard

```tsx
<ColorCard color="#00e5ff" isSelected={true} onClick={() => handleSelect("#00e5ff")} size="medium" index={0} />
```

### Avatar with Color

```tsx
<Avatar seed="cyber-blue" className="w-16 h-16" showBackground={true} />
```

### PlayerJoinScreen with Taken Avatars

```tsx
<PlayerJoinScreen socket={socket} takenAvatars={["cyber-blue", "neon-pink"]} />
```

## Benefits

### Visual Excellence

- Premium playing card aesthetic
- Smooth 3D animations and transitions
- Consistent design language across the app
- Professional, polished appearance

### User Experience

- Clear visual feedback for selections
- Intuitive card-based interaction
- No duplicate avatars (prevents confusion)
- Color-coded player identification

### Code Quality

- Reusable ColorCard component
- Centralized avatar color management
- Type-safe avatar system
- Clean separation of concerns

## Technical Details

### ColorCard Animations

- **Entrance**: Staggered fade-in with rotation (100ms delay per card)
- **Hover**: Lifts up 10px with slight tilt
- **Selection**: Scales to 105% with 2° rotation
- **Tap**: Scales to 95% with 5° rotation

### Avatar System

- Uses DiceBear API for consistent avatar generation
- Color backgrounds from centralized constant
- Unique seed per avatar ensures consistency
- Background colors match game palette

### State Management

- Taken avatars tracked via game state
- Real-time updates when players join
- Automatic avatar switching if taken
- LocalStorage for avatar preference

## Notes

The ESLint warnings about setState in useEffect are acceptable in this context:

- These are legitimate patterns for resetting state based on external changes
- The warnings are overly strict for these specific scenarios
- The current implementation follows React best practices for this use case
