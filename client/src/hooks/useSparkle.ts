import { useRef, useEffect } from 'react';

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    color: string;
    life: number;
    size: number;
}

export function useSparkle(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
    const particles = useRef<Particle[]>([]);
    const animationFrameId = useRef<number>(0);

    const spawnSparkles = (x: number, y: number, colour: string = '#ffd700', count: number = 20) => {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 4 + 2;
            particles.current.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                colour,
                life: 1.0,
                size: Math.random() * 3 + 1
            });
        }
    };

    const spawnConfetti = (x: number, y: number) => {
        const colours = ['#FFD700', '#FF3366', '#00E5FF', '#FFFFFF'];
        spawnSparkles(x, y, colours[Math.floor(Math.random() * colours.length)], 30);
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const render = () => {
            if (!canvas) return; // double check
            ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear only, don't resize every frame

            // Update and draw particles
            for (let i = particles.current.length - 1; i >= 0; i--) {
                const p = particles.current[i];
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.1; // gravity
                p.life -= 0.02;

                if (p.life <= 0) {
                    particles.current.splice(i, 1);
                    continue;
                }

                ctx.globalAlpha = p.life;
                ctx.fillStyle = p.colour;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            }

            animationFrameId.current = requestAnimationFrame(render);
        };

        // Handle resize
        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', handleResize);
        handleResize(); // Initial size

        render();

        return () => {
            cancelAnimationFrame(animationFrameId.current);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return { spawnSparkles, spawnConfetti };
}
