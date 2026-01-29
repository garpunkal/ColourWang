import { motion } from 'framer-motion';

export const AnimatedBackground = () => {
    return (
        <div className="bg-animated">
            <div className="mesh-gradient" />

            {/* Main colored blobs */}
            <motion.div
                animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="blob blob-1"
            />
            <motion.div
                animate={{ x: [0, -40, 0], y: [0, 60, 0] }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                className="blob blob-2"
            />
            <motion.div
                animate={{ x: [0, 30, 0], y: [0, -50, 0] }}
                transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
                className="blob blob-3"
            />
            <motion.div
                animate={{ x: [0, -60, 0], y: [0, 40, 0] }}
                transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
                className="blob blob-4"
            />

            {/* Floating Particles */}
            <div className="particles">
                {[...Array(15)].map((_, i) => (
                    <div key={i} className="particle" />
                ))}
            </div>
        </div>
    );
};
