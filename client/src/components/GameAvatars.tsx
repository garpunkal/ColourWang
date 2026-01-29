

interface AvatarProps {
    seed: string;
    className?: string;
}

export const Avatar = ({ seed, className = "w-12 h-12" }: AvatarProps) => {
    // Using the 'toon-head' collection as requested
    const url = `https://api.dicebear.com/9.x/toon-head/svg?seed=${seed}&backgroundColor=transparent`;

    return (
        <img
            src={url}
            alt={`Avatar ${seed}`}
            className={`object-contain ${className}`}
            width={56}
            height={56}
        />
    );
};

export default Avatar;
