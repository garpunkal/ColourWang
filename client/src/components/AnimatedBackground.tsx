import { useIsMobile } from '../hooks/useIsMobile';
import { useReducedMotion } from '../hooks/useReducedMotion';

export const AnimatedBackground = () => {
    const isMobile = useIsMobile();
    const prefersReducedMotion = useReducedMotion();

    // Reduce blob count on mobile for better performance
    const blobCount = isMobile ? 2 : 4;
    const particleCount = isMobile ? 6 : 15;

    // If user prefers reduced motion, don't render animated elements
    if (prefersReducedMotion) {
        return (
            <div className="bg-animated">
                <div className="mesh-gradient" />
            </div>
        );
    }

    return (
        <div className="bg-animated">
            <div className="mesh-gradient" />

            {/* Main colored blobs - using CSS animations for better performance */}
            {blobCount >= 1 && <div className="blob blob-1" />}
            {blobCount >= 2 && <div className="blob blob-2" />}
            {blobCount >= 3 && <div className="blob blob-3" />}
            {blobCount >= 4 && <div className="blob blob-4" />}

            {/* Floating Particles - reduced count on mobile */}
            <div className="particles">
                {[...Array(particleCount)].map((_, i) => (
                    <div key={i} className="particle" />
                ))}
            </div>
        </div>
    );
};
