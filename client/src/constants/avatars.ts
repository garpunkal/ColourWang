// Avatar colors matching our game's color palette
export const AVATAR_COLORS = [
    { id: 'cyber-blue', color: '#00e5ff', name: 'Cyber Blue' },
    { id: 'neon-pink', color: '#f83a7b', name: 'Neon Pink' },
    { id: 'electric-purple', color: '#9d50bb', name: 'Electric Purple' },
    { id: 'solar-orange', color: '#ff9d00', name: 'Solar Orange' },
    { id: 'matrix-green', color: '#00ffaa', name: 'Matrix Green' },
    { id: 'crimson-red', color: '#ff3366', name: 'Crimson Red' },
    { id: 'royal-violet', color: '#7b2cbf', name: 'Royal Violet' },
    { id: 'golden-yellow', color: '#ffd700', name: 'Golden Yellow' },
    { id: 'aqua-teal', color: '#00d9ff', name: 'Aqua Teal' },
    { id: 'hot-magenta', color: '#ff006e', name: 'Hot Magenta' },
    { id: 'lime-green', color: '#ccff00', name: 'Lime Green' },
    { id: 'deep-indigo', color: '#4a148c', name: 'Deep Indigo' },
    { id: 'coral-red', color: '#ff5252', name: 'Coral Red' },
    { id: 'sky-cyan', color: '#00bcd4', name: 'Sky Cyan' },
    { id: 'sunset-orange', color: '#ff6f00', name: 'Sunset Orange' },
    { id: 'mint-green', color: '#69f0ae', name: 'Mint Green' },
];

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

// Get all avatar IDs
export const AVATAR_IDS = AVATAR_COLORS.map(a => a.id);
