
import React, { useState, useEffect } from "react";
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
    imageUrl?: string;
}

export const Avatar = ({
    seed,
    className = "w-32 h-32",
    style = avatarConfig.defaultStyle,
    onStyleChange,
    showStyleSelector = false,
    imageUrl,
}: AvatarProps) => {
    const [selectedStyle, setSelectedStyle] = useState(style);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSelectedStyle(style);
    }, [style]);

    const hasCustomImage = Boolean(imageUrl);
    const backgroundColor = hasCustomImage ? '000000' : getAvatarColor(seed).replace('#', '');
    const url = hasCustomImage
        ? imageUrl
        : `https://api.dicebear.com/9.x/${selectedStyle}/svg?seed=${seed}&backgroundColor=${backgroundColor}`;

    const handleStyleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedStyle(e.target.value);
        if (onStyleChange) onStyleChange(e.target.value);
    };

    return (
        <div className="flex flex-col items-center">
            <div className={`${className} rounded-2xl overflow-hidden flex items-center justify-center shadow-lg `}>
                <img
                    src={url}
                    alt={`Avatar ${seed}`}
                    className={hasCustomImage ? "object-cover w-full h-full" : "object-contain w-full h-full"}
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
