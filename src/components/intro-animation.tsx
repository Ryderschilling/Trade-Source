'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';

const SESSION_KEY = 'ts-intro-v2';
const DURATION = 1800;
const START_DELAY = 500;
const POST_COMPLETE_DELAY = 350;
const EXIT_TRANSITION_MS = 600;
const EXIT_DONE_DELAY = 650;

// useLayoutEffect fires synchronously before paint on the client.
// Falls back to useEffect on the server (where it's a no-op anyway).
const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

type Phase = 'intro' | 'exit' | 'done';

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

interface IntroAnimationProps {
  children: React.ReactNode;
}

export function IntroAnimation({ children }: IntroAnimationProps) {
  // null  = SSR / not yet mounted — render children plainly (matches SSR output)
  // true  = already seen — render children plainly
  // false = first visit — run animation
  const [alreadySeen, setAlreadySeen] = useState<boolean | null>(null);
  const [phase, setPhase] = useState<Phase>('intro');
  const [progress, setProgress] = useState(0);

  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const delayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const postCompleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exitDoneTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useIsomorphicLayoutEffect(() => {
    const seen = sessionStorage.getItem(SESSION_KEY) !== null;
    setAlreadySeen(seen);
    if (seen) return;

    // First visit — start animation
    function tick(timestamp: number) {
      if (startTimeRef.current === null) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const raw = Math.min(elapsed / DURATION, 1);
      setProgress(easeOutCubic(raw) * 100);

      if (raw < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        postCompleteTimerRef.current = setTimeout(() => {
          sessionStorage.setItem(SESSION_KEY, '1');
          setPhase('exit');
          exitDoneTimerRef.current = setTimeout(() => {
            setPhase('done');
          }, EXIT_DONE_DELAY);
        }, POST_COMPLETE_DELAY);
      }
    }

    delayTimerRef.current = setTimeout(() => {
      rafRef.current = requestAnimationFrame(tick);
    }, START_DELAY);

    return () => {
      if (delayTimerRef.current !== null) clearTimeout(delayTimerRef.current);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      if (postCompleteTimerRef.current !== null) clearTimeout(postCompleteTimerRef.current);
      if (exitDoneTimerRef.current !== null) clearTimeout(exitDoneTimerRef.current);
    };
  }, []);

  // SSR and first client render — alreadySeen is null.
  // Render children plainly so this matches the SSR output (no hydration mismatch).
  // useLayoutEffect fires synchronously before the browser paints, so the user
  // never actually sees this null state on the client.
  if (alreadySeen === null || alreadySeen === true) {
    return <>{children}</>;
  }

  // First visit — show overlay and animate children in afterwards
  const overlayStyle: React.CSSProperties =
    phase === 'exit'
      ? {
          opacity: 0,
          transform: 'scale(1.1)',
          transition: `opacity ${EXIT_TRANSITION_MS}ms ease, transform ${EXIT_TRANSITION_MS}ms ease`,
        }
      : {
          opacity: 1,
          transform: 'scale(1)',
          transition: 'none',
        };

  return (
    <>
      {phase !== 'done' && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: '#000',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            ...overlayStyle,
          }}
        >
          {/* Logo mark */}
          <svg
            viewBox="0 0 120 120"
            width="108"
            height="108"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Ripple ring — expands outward at drop impact */}
            <circle
              cx="60"
              cy="93"
              r="5.5"
              stroke="white"
              strokeWidth="1.5"
              fill="none"
              style={{
                transformBox: 'fill-box',
                transformOrigin: 'center',
                animation: 'dotRippleOut 0.6s cubic-bezier(0.2, 0, 0.8, 1) 0.42s both',
              }}
            />
            {/* Dot — drops and splats first */}
            <g
              style={{
                transformBox: 'fill-box',
                transformOrigin: 'center',
                animation: 'dotSplat 0.78s cubic-bezier(0.16, 1, 0.3, 1) 0.05s both',
              }}
            >
              <circle cx="60" cy="93" r="5.5" fill="white" />
            </g>
            {/* Left arm — draws from peak downward after dot lands */}
            <path
              d="M 60,32 L 16,80"
              stroke="white"
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray="74"
              strokeDashoffset="74"
              style={{
                animation: 'strokeDraw 0.55s cubic-bezier(0.4, 0, 0.2, 1) 0.62s both',
              }}
            />
            {/* Right arm — draws from peak downward, tiny stagger */}
            <path
              d="M 60,32 L 104,80"
              stroke="white"
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray="74"
              strokeDashoffset="74"
              style={{
                animation: 'strokeDraw 0.55s cubic-bezier(0.4, 0, 0.2, 1) 0.7s both',
              }}
            />
          </svg>

          {/* Progress bar */}
          <div
            style={{
              position: 'absolute',
              bottom: '56px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <div
              style={{
                width: '200px',
                height: '1px',
                backgroundColor: 'rgba(255,255,255,0.12)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  height: '1px',
                  width: `${progress}%`,
                  backgroundColor: '#fff',
                  transition: 'width 16ms linear',
                }}
              />
            </div>
            <div
              style={{
                fontFamily: 'monospace',
                fontSize: '10px',
                letterSpacing: '0.3em',
                color: 'rgba(255,255,255,0.3)',
              }}
            >
              {Math.floor(progress).toString().padStart(3, '0')}
            </div>
          </div>
        </div>
      )}

      <div
        style={{
          animation: 'tsPageReveal 0.8s cubic-bezier(0.16, 1, 0.3, 1) 2.4s both',
        }}
      >
        {children}
      </div>
    </>
  );
}
