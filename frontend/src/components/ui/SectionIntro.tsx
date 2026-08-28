"use client";
import { useEffect, useRef } from "react";

/**
 * Section Tech Intro Animation
 * 
 * A premium entrance sequence for major sections:
 * - Ambient background activates
 * - Section identifier appears
 * - Heading resolves
 * - Content reveals
 * - Interactive elements become active
 * 
 * Animation duration: 300-900ms
 * Non-blocking: user can interact immediately
 * 
 * Usage:
 * ```tsx
 * <SectionIntro delay={500}>
 *   <div>Your content here</div>
 * </SectionIntro>
 * ```
 */
export function SectionIntro({
  children,
  delay = 500,
  duration = 800,
}: {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || hasAnimated.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated.current) {
            hasAnimated.current = true;
            animateEntry();
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  const animateEntry = () => {
    const container = containerRef.current;
    if (!container) return;

    const identifier = container.querySelector(".tech-intro-identifier");
    const heading = container.querySelector(".tech-intro-heading");
    const content = container.querySelectorAll(".tech-intro-content");

    // Set initial styles
    if (identifier && identifier instanceof HTMLElement) {
      identifier.style.opacity = "0";
      identifier.style.transform = "translateY(20px)";
      identifier.style.transition = `opacity ${duration}ms ease-out, transform ${duration}ms ease-out`;
    }

    if (heading && heading instanceof HTMLElement) {
      heading.style.opacity = "0";
      heading.style.transform = "translateY(20px)";
      heading.style.transition = `opacity ${duration}ms ease-out, transform ${duration}ms ease-out ${delay}ms`;
    }

    // Convert NodeList to Array for proper indexing
    const contentArray = Array.from(content);
    contentArray.forEach((el, i) => {
      if (el instanceof HTMLElement) {
        el.style.opacity = "0";
        el.style.transform = "translateY(20px)";
        el.style.transition = `opacity ${duration}ms ease-out, transform ${duration}ms ease-out ${delay + 200 + i * 100}ms`;
      }
    });

    // Trigger animations
    requestAnimationFrame(() => {
      if (identifier && identifier instanceof HTMLElement) {
        identifier.style.opacity = "1";
        identifier.style.transform = "translateY(0)";
      }

      if (heading && heading instanceof HTMLElement) {
        heading.style.opacity = "1";
        heading.style.transform = "translateY(0)";
      }

      contentArray.forEach((el) => {
        if (el instanceof HTMLElement) {
          el.style.opacity = "1";
          el.style.transform = "translateY(0)";
        }
      });
    });
  };

  return (
    <div ref={containerRef} className="relative">
      {children}
    </div>
  );
}

export default SectionIntro;
