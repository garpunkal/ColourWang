import avatarsData from '../../../config/avatars.json';

// Avatar colours matching our game's colour palette (PALETTE from gameConfig)
export const AVATAR_COLORS = avatarsData.colors;

// Get avatar color by ID
export function getAvatarColor(avatarId: string): string {
    const avatar = AVATAR_COLORS.find(a => a.id === avatarId);
    return avatar?.color || '#00e5ff';
}

// Get avatar name by ID
export function getAvatarName(avatarId: string): string {
    const avatar = AVATAR_COLORS.find(a => a.id === avatarId);
    return avatar?.name || 'Unknown';
}

// Get avatar text color by ID
export function getAvatarTextColor(avatarId: string): string {
    const avatar = AVATAR_COLORS.find(a => a.id === avatarId);
    return avatar?.textColor || 'white';
}

// Get all avatar IDs
export const AVATAR_IDS = AVATAR_COLORS.map(a => a.id);
