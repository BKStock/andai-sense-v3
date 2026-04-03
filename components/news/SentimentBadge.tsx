'use client';

interface SentimentBadgeProps {
  sentiment: string;
  showLabel?: boolean;
}

const SENTIMENT_CONFIG = {
  positive: { bg: 'rgba(0, 255, 136, 0.1)', text: 'var(--green)', label: 'Positive', icon: '↑' },
  negative: { bg: 'rgba(255, 59, 59, 0.1)', text: 'var(--red)', label: 'Negative', icon: '↓' },
  neutral: { bg: 'rgba(136, 150, 179, 0.1)', text: 'var(--text-secondary)', label: 'Neutral', icon: '—' },
};

export function SentimentBadge({ sentiment, showLabel = true }: SentimentBadgeProps) {
  const cfg = SENTIMENT_CONFIG[sentiment as keyof typeof SENTIMENT_CONFIG] || SENTIMENT_CONFIG.neutral;

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      padding: '2px 8px',
      borderRadius: 6,
      background: cfg.bg,
      color: cfg.text,
      fontSize: 11,
      fontWeight: 600,
      whiteSpace: 'nowrap',
    }}>
      <span style={{ fontSize: 12 }}>{cfg.icon}</span>
      {showLabel && cfg.label}
    </span>
  );
}
