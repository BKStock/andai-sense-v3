'use client';
import { useState, useEffect, useRef } from 'react';
import { getRandomSignal } from '@/lib/mock-data';

export function useCountUp(target: number, duration: number = 1500, start: boolean = true) {
  const [value, setValue] = useState(0);
  const startTime = useRef<number | null>(null);
  const rafId = useRef<number>(0);

  useEffect(() => {
    if (!start) return;
    startTime.current = null;
    const animate = (timestamp: number) => {
      if (!startTime.current) startTime.current = timestamp;
      const progress = Math.min((timestamp - startTime.current) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(eased * target));
      if (progress < 1) {
        rafId.current = requestAnimationFrame(animate);
      }
    };
    rafId.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId.current);
  }, [target, duration, start]);

  return value;
}

export function useLiveFeed() {
  // Lazy init: compute initial signals once, no setState in effect
  const [signals, setSignals] = useState<Array<{
    id: number;
    timestamp: string;
    company: string;
    signal: string;
    severity: number;
  }>>(() => Array.from({ length: 8 }, () => getRandomSignal()));
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const addSignal = () => {
      if (!isPaused) {
        setSignals(prev => {
          const newSignal = getRandomSignal();
          return [newSignal, ...prev].slice(0, 50);
        });
      }
    };

    const interval = setInterval(addSignal, 3000 + Math.random() * 2000);
    return () => clearInterval(interval);
  }, [isPaused]);

  return { signals, isPaused, setIsPaused };
}
