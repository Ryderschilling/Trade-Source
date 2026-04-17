'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';

const SESSION_KEY = 'ts-intro-v1';
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
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '84px',
                fontWeight: 900,
                letterSpacing: '-0.05em',
                color: '#fff',
                lineHeight: 1,
                animation: 'tsLogoIn 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both',
              }}
            >
              TS
            </div>
            <div
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '11px',
                fontWeight: 300,
                letterSpacing: '0.48em',
                color: 'rgba(255,255,255,0.8)',
                textTransform: 'uppercase',
                marginTop: '10px',
                animation: 'tsLogoIn 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.3s both',
              }}
            >
              Trade Source
            </div>
          </div>

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
