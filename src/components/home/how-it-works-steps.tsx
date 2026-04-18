'use client';

import { useRef, useState, useEffect } from 'react';

interface Step {
  step: string;
  title: string;
  description: string;
}

interface Props {
  steps: Step[];
}

export function HowItWorksSteps({ steps }: Props) {
  const [hasAnimated, setHasAnimated] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasAnimated(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="grid gap-8 md:grid-cols-3">
      {steps.map((item, i) => {
        const bubbleStyle: React.CSSProperties = hasAnimated
          ? {
              animation: `howBubblePop 0.65s cubic-bezier(0.34, 1.56, 0.64, 1) both`,
              animationDelay: `${i * 300}ms`,
            }
          : { opacity: 0 };

        const titleStyle: React.CSSProperties = hasAnimated
          ? {
              animation: `howFadeDown 0.6s cubic-bezier(0.16, 1, 0.3, 1) both`,
              animationDelay: `${i * 300 + 160}ms`,
            }
          : { opacity: 0 };

        const descStyle: React.CSSProperties = hasAnimated
          ? {
              animation: `howFadeDown 0.6s cubic-bezier(0.16, 1, 0.3, 1) both`,
              animationDelay: `${i * 300 + 280}ms`,
            }
          : { opacity: 0 };

        return (
          <div key={item.step} className="relative flex flex-col items-center text-center">
            <div
              className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold"
              style={bubbleStyle}
            >
              {item.step}
            </div>
            <h3 className="text-xl font-semibold mb-3" style={titleStyle}>
              {item.title}
            </h3>
            <p className="text-muted-foreground leading-relaxed" style={descStyle}>
              {item.description}
            </p>
          </div>
        );
      })}
    </div>
  );
}
