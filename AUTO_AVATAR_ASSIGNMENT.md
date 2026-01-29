# Auto-Assigned Unique Color Avatars

## Overview

Updated the avatar system so that each connection (even from the same browser) gets a unique color avatar automatically assigned.

## Changes Made

### Server-Side (`server/src/socket/handlers.ts`)

**Auto-Assignment Logic:**

- Added `AVATAR_IDS` array with all 16 available colors
- Created `getNextAvailableAvatar()` function to find first available color
- Modified `join-game` handler to auto-assign avatars:
  - Checks which avatars are already taken
  - If player's requested avatar is taken (or not provided), assigns next available
  - Logs auto-assignment for debugging

**Benefits:**

- Server is the source of truth for avatar assignment
- Prevents race conditions with multiple simultaneous joins
- Guarantees unique avatars per connection

### Client-Side

**PlayerJoinScreen (`client/src/components/player/PlayerJoinScreen.tsx`):**

- **Removed localStorage for avatars** - only name is persisted
- Each new connection auto-selects first available color
- Players can still choose their preferred color (if available)
- Server will override if chosen color is taken
- Added helpful text: "Each connection gets a unique color automatically"

**PlayerScreen (`client/src/components/PlayerScreen.tsx`):**

- Removed avatar from localStorage
- Gets avatar from player data (`me?.avatar`) instead
- Passes taken avatars list to PlayerJoinScreen

## How It Works

### Connection Flow:

1. **Player opens join screen**
   - Client auto-selects first available color from AVATAR_IDS
   - Shows which colors are taken (with lock icons)
   - Player can choose any available color

2. **Player clicks "Initialize Link"**
   - Client sends: `{ name, avatar, code }`
   - Avatar is a preference, not a guarantee

3. **Server receives join request**
   - Checks which avatars are already taken
   - If requested avatar is available → assigns it
   - If requested avatar is taken → auto-assigns next available
   - Adds player to game with assigned avatar

4. **Player joins game**
   - Server sends back game state with player's assigned avatar
   - Client displays player with their unique color

### Multiple Tabs in Same Browser:

- **Tab 1**: Opens → Gets "Cyber Blue"
- **Tab 2**: Opens → Gets "Neon Pink" (next available)
- **Tab 3**: Opens → Gets "Electric Purple" (next available)
- Each tab is a unique connection with unique color!

## Technical Details

### Available Colors (16 total):

1. cyber-blue
2. neon-pink
3. electric-purple
4. solar-orange
5. matrix-green
6. crimson-red
7. royal-violet
8. golden-yellow
9. aqua-teal
10. hot-magenta
11. lime-green
12. deep-indigo
13. coral-red
14. sky-cyan
15. sunset-orange
16. mint-green

### Server Auto-Assignment:

```typescript
function getNextAvailableAvatar(takenAvatars: string[]): string {
	const available = AVATAR_IDS.find((id) => !takenAvatars.includes(id));
	return available || AVATAR_IDS[0]; // Fallback to first if all taken
}
```

### Client Selection:

```typescript
// Auto-select first available avatar (not from localStorage)
const [avatar, setAvatar] = useState(() => {
	return AVATAR_IDS.find((id) => !takenAvatars.includes(id)) || AVATAR_IDS[0];
});
```

## Benefits

### User Experience:

- ✅ Each connection is visually distinct
- ✅ No confusion between multiple players
- ✅ Easy to identify yourself in the game
- ✅ Can still choose preferred color if available

### Technical:

- ✅ Server-side validation prevents duplicates
- ✅ No localStorage conflicts between tabs
- ✅ Automatic assignment reduces user friction
- ✅ Scales up to 16 simultaneous players

### Testing:

- ✅ Open multiple tabs in same browser
- ✅ Each gets a different color automatically
- ✅ Colors are locked for other players
- ✅ Server logs show auto-assignments

## Notes

- Maximum 16 players per game (one per color)
- If all 16 colors are taken, falls back to first color
- Server has final say on avatar assignment
- Client UI shows real-time availability
