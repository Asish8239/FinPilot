"use client";
import { useEffect, useRef, memo } from "react";

/**
 * Live Reactive Background
 * 
 * A subtle, GPU-accelerated ambient background with:
 * - Moving data particles
 * - Dynamic mesh connections
 * - Reduced motion support via prefers-reduced-motion
 * 
 * Design principles:
 * - Never distract from content
 * - Never consume excessive CPU/GPU
 * - Always remain behind content
 * - Respect user's motion preferences
 */
function LiveBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Check for reduced motion preference
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Set canvas size
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Particles configuration
    const particleCount = reducedMotion ? 0 : 60;
    const particles: { x: number; y: number; vx: number; vy: number; size: number }[] = [];

    // Initialize particles
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * (reducedMotion ? 0 : 0.5),
        vy: (Math.random() - 0.5) * (reducedMotion ? 0 : 0.5),
        size: Math.random() * 2 + 1,
      });
    }

    // Animation loop
    let animationId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (!reducedMotion) {
        // Draw particles
        particles.forEach((p) => {
          p.x += p.vx;
          p.y += p.vy;

          // Bounce off edges
          if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
          if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

          // Draw particle
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(251, 191, 36, 0.6)"; // amber-400 with opacity
          ctx.fill();
        });

        // Draw connecting lines (data mesh effect)
        ctx.strokeStyle = "rgba(251, 191, 36, 0.15)";
        ctx.lineWidth = 1;
        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 150) {
              ctx.beginPath();
              ctx.moveTo(particles[i].x, particles[i].y);
              ctx.lineTo(particles[j].x, particles[j].y);
              ctx.stroke();
            }
          }
        }
      }

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
      aria-hidden="true"
    />
  );
}

export default memo(LiveBackground);
