
import React, { useState } from "react";
import { avatarConfig } from "../config/avatarConfig";
import { getAvatarColor } from "../constants/avatars";

// Use configurable styles from avatarConfig
const DICEBEAR_STYLES = avatarConfig.availableStyles;

interface AvatarProps {
    seed: string;
    className?: string;
    style?: string; // DiceBear style/collection
    onStyleChange?: (style: string) => void;
    showStyleSelector?: boolean;
}

export const Avatar = ({
    seed,
    className = "w-32 h-32",
    style = avatarConfig.defaultStyle,
    onStyleChange,
    showStyleSelector = false,
}: AvatarProps) => {
    const [selectedStyle, setSelectedStyle] = useState(style);
    const backgroundColor = getAvatarColor(seed).replace('#', '');
    const url = `https://api.dicebear.com/9.x/${selectedStyle}/svg?seed=${seed}&backgroundColor=${backgroundColor}`;

    const handleStyleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedStyle(e.target.value);
        if (onStyleChange) onStyleChange(e.target.value);
    };

    return (
        <div className="flex flex-col items-center">
            <div className={`${className} rounded-2xl overflow-hidden flex items-center justify-center shadow-lg border-2 border-white/10`}>
                <img
                    src={url}
                    alt={`Avatar ${seed}`}
                    className="object-contain w-full h-full"
                />
            </div>
            {showStyleSelector && (
                <select
                    className="mt-2 p-1 border rounded text-xs"
                    value={selectedStyle}
                    onChange={handleStyleChange}
                >
                    {DICEBEAR_STYLES.map((style) => (
                        <option key={style} value={style}>
                            {style}
                        </option>
                    ))}
                </select>
            )}
        </div>
    );
};

export default Avatar;
