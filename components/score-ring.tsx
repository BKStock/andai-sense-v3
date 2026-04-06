'use client';

import { useEffect, useState } from 'react';

interface ScoreRingProps {
  score: number;
  size?: number;
}

export function ScoreRing({ score, size = 120 }: ScoreRingProps) {
  const [animated, setAnimated] = useState(false);
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const progress = animated ? (score / 100) * circumference : 0;
  const color = score >= 80 ? 'var(--cyan)' : score >= 60 ? 'var(--amber)' : 'var(--red)';

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox="0 0 100 100">
        {/* Track */}
        <circle
          cx="50" cy="50" r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="8"
        />
        {/* Progress */}
        <circle
          cx="50" cy="50" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          transform="rotate(-90 50 50)"
          style={{
            transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)',
            filter: score >= 80 ? `drop-shadow(0 0 6px ${color})` : 'none',
          }}
        />
      </svg>
      {/* Score text */}
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <span style={{
          fontSize: size * 0.22,
          fontWeight: 800,
          fontFamily: 'var(--font-jetbrains-mono)',
          color,
          lineHeight: 1,
          textShadow: score >= 80 ? `0 0 12px ${color}` : 'none',
        }}>
          {score}
        </span>
        <span style={{ fontSize: size * 0.1, color: 'var(--text-muted)', marginTop: '2px' }}>
          SCORE
        </span>
      </div>
    </div>
  );
}
