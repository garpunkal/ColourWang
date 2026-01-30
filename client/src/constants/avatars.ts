// Avatar colors matching our game's color palette (PALETTE from gameConfig)
export const AVATAR_COLORS = [
    { id: 'midnight-black', color: '#000000', name: 'MIDNIGHT BLACK' },
    { id: 'iron-gray', color: '#808080', name: 'IRON GRAY' },
    { id: 'cloud-white', color: '#ffffff', name: 'CLOUD WHITE' },
    { id: 'crimson-red', color: '#ff0000', name: 'CRIMSON RED' },
    { id: 'solar-orange', color: '#ff9d00', name: 'SOLAR ORANGE' },
    { id: 'golden-yellow', color: '#ffff00', name: 'GOLDEN YELLOW' },
    { id: 'matrix-green', color: '#00ff00', name: 'MATRIX GREEN' },
    { id: 'cyber-blue', color: '#00e5ff', name: 'CYBER BLUE' },
    { id: 'electric-purple', color: '#9d50bb', name: 'ELECTRIC PURPLE' },
    { id: 'neon-pink', color: '#f83a7b', name: 'NEON PINK' },
    { id: 'muddy-brown', color: '#8B4513', name: 'MUDDY BROWN' },
    { id: 'aqua-teal', color: '#00ffcc', name: 'AQUA TEAL' },
    { id: 'royal-violet', color: '#7b2cbf', name: 'ROYAL VIOLET' },
    { id: 'hot-magenta', color: '#ff00ff', name: 'HOT MAGENTA' },
    { id: 'lime-punch', color: '#ccff00', name: 'LIME PUNCH' },
    { id: 'deep-indigo', color: '#3f51b5', name: 'DEEP INDIGO' },
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
