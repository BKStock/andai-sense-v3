'use client';

interface ScoreBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
}

export function ScoreBadge({ score, size = 'md' }: ScoreBadgeProps) {
  const color = score >= 90
    ? { bg: 'rgba(255, 59, 59, 0.15)', text: '#FF3B3B', border: 'rgba(255, 59, 59, 0.3)' }
    : score >= 80
    ? { bg: 'rgba(255, 184, 0, 0.15)', text: 'var(--amber)', border: 'rgba(255, 184, 0, 0.3)' }
    : score >= 70
    ? { bg: 'rgba(0, 229, 255, 0.15)', text: 'var(--cyan-300)', border: 'rgba(0, 229, 255, 0.3)' }
    : { bg: 'rgba(136, 150, 179, 0.15)', text: 'var(--text-muted)', border: 'rgba(136, 150, 179, 0.2)' };

  const dim = size === 'sm' ? 32 : size === 'lg' ? 48 : 40;
  const fontSize = size === 'sm' ? 11 : size === 'lg' ? 15 : 13;

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: dim,
      height: dim,
      borderRadius: 8,
      border: `1px solid ${color.border}`,
      background: color.bg,
      color: color.text,
      fontSize,
      fontWeight: 700,
      fontFamily: 'var(--font-mono)',
      flexShrink: 0,
    }}>
      {score}
    </span>
  );
}
