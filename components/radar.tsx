'use client';

import { useEffect, useRef, useState } from 'react';

interface Blip {
  id: number;
  x: number;
  y: number;
  opacity: number;
  born: number;
}

export function Radar() {
  const [blips, setBlips] = useState<Blip[]>([]);
  const nextId = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const angle = Math.random() * Math.PI * 2;
      const radius = 20 + Math.random() * 75;
      const x = 50 + Math.cos(angle) * radius;
      const y = 50 + Math.sin(angle) * radius;
      const id = nextId.current++;
      setBlips(prev => [...prev.slice(-12), { id, x, y, opacity: 1, born: Date.now() }]);
    }, 600);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fade = setInterval(() => {
      const now = Date.now();
      setBlips(prev => prev
        .map(b => ({ ...b, opacity: Math.max(0, 1 - (now - b.born) / 3000) }))
        .filter(b => b.opacity > 0)
      );
    }, 100);
    return () => clearInterval(fade);
  }, []);

  return (
    <div style={{
      width: '100%',
      height: '100%',
      position: 'relative',
      borderRadius: '50%',
      overflow: 'hidden',
    }}>
      <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
        {/* Background */}
        <circle cx="50" cy="50" r="50" fill="var(--bg-void)" />

        {/* Concentric rings */}
        {[20, 35, 50, 65, 80].map(r => (
          <circle
            key={r}
            cx="50" cy="50" r={r * 0.5}
            fill="none"
            stroke="rgba(0,229,255,0.12)"
            strokeWidth="0.5"
          />
        ))}

        {/* Cross lines */}
        <line x1="50" y1="0" x2="50" y2="100" stroke="rgba(0,229,255,0.08)" strokeWidth="0.5" />
        <line x1="0" y1="50" x2="100" y2="50" stroke="rgba(0,229,255,0.08)" strokeWidth="0.5" />
        <line x1="15" y1="15" x2="85" y2="85" stroke="rgba(0,229,255,0.05)" strokeWidth="0.5" />
        <line x1="85" y1="15" x2="15" y2="85" stroke="rgba(0,229,255,0.05)" strokeWidth="0.5" />

        {/* Sweep conic gradient - simulated via animating group */}
        <g style={{ transformOrigin: '50px 50px', animation: 'radarSweep 3s linear infinite' }}>
          <path
            d="M50,50 L50,1 A49,49 0 0,1 98,50 Z"
            fill="url(#sweepGrad)"
            opacity="0.7"
          />
          <line x1="50" y1="50" x2="50" y2="1" stroke="var(--cyan)" strokeWidth="1" opacity="0.9" />
        </g>

        {/* Blip dots */}
        {blips.map(b => (
          <g key={b.id}>
            <circle
              cx={b.x} cy={b.y} r="1.5"
              fill="var(--cyan)"
              opacity={b.opacity}
              style={{ filter: 'drop-shadow(0 0 3px #00E5FF)' }}
            />
            <circle
              cx={b.x} cy={b.y} r="3"
              fill="none"
              stroke="var(--cyan)"
              strokeWidth="0.5"
              opacity={b.opacity * 0.4}
            />
          </g>
        ))}

        {/* Center dot */}
        <circle cx="50" cy="50" r="2" fill="var(--cyan)" style={{ filter: 'drop-shadow(0 0 4px #00E5FF)' }} />

        <defs>
          <radialGradient id="sweepGrad" cx="0%" cy="0%">
            <stop offset="0%" stopColor="#00E5FF" stopOpacity="0" />
            <stop offset="100%" stopColor="#00E5FF" stopOpacity="0.35" />
          </radialGradient>
        </defs>
      </svg>

      {/* Outer glow ring */}
      <div style={{
        position: 'absolute',
        inset: 0,
        borderRadius: '50%',
        boxShadow: '0 0 40px rgba(0,229,255,0.15) inset',
        pointerEvents: 'none',
      }} />
    </div>
  );
}
