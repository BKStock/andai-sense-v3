'use client';
import { useState, useMemo } from 'react';
import { companies, urgencyColors } from '@/lib/mock-data';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import { motion } from 'framer-motion';
import { Filter, ChevronLeft, ChevronRight } from 'lucide-react';

// Prefecture approximate coordinates for markers
const prefectureCoords: Record<string, [number, number]> = {
  '北海道': [143.2, 43.1],
  '青森': [140.7, 40.8],
  '東京': [139.7, 35.7],
  '神奈川': [139.6, 35.4],
  '埼玉': [139.6, 35.9],
  '千葉': [140.1, 35.6],
  '静岡': [138.4, 34.9],
  '愛知': [137.0, 35.2],
  '大阪': [135.5, 34.7],
  '京都': [135.8, 35.0],
  '福岡': [130.4, 33.6],
  '沖縄': [127.7, 26.3],
};

const japanUrl = "https://raw.githubusercontent.com/dataofjapan/land/master/japan.topojson";

const urgencyLevels = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const;

export default function MapView() {
  const [filterPanel, setFilterPanel] = useState(true);
  const [activeUrgencies, setActiveUrgencies] = useState<Set<string>>(new Set(urgencyLevels));
  const [scoreThreshold, setScoreThreshold] = useState(0);
  const [hoveredCompany, setHoveredCompany] = useState<typeof companies[0] | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const filtered = useMemo(() =>
    companies.filter(c => activeUrgencies.has(c.urgency) && c.score >= scoreThreshold),
    [activeUrgencies, scoreThreshold]
  );

  const toggleUrgency = (u: string) => {
    setActiveUrgencies(prev => {
      const next = new Set(prev);
      if (next.has(u)) next.delete(u); else next.add(u);
      return next;
    });
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 96px)', margin: -24, marginTop: -24 }}>
      {/* Filter Panel */}
      <motion.div
        animate={{ width: filterPanel ? 260 : 0 }}
        transition={{ duration: 0.3 }}
        style={{
          overflow: 'hidden', flexShrink: 0,
          background: 'var(--bg-surface)', borderRight: '1px solid var(--border-default)',
        }}
      >
        <div style={{ width: 260, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Filter size={14} style={{ color: 'var(--cyan-300)' }} />
              <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>FILTERS</span>
            </div>
          </div>

          {/* Urgency toggles */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12, fontFamily: 'var(--font-mono)' }}>URGENCY</div>
            {urgencyLevels.map(u => (
              <label key={u} style={{
                display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, cursor: 'pointer',
                fontSize: 13, color: activeUrgencies.has(u) ? urgencyColors[u] : 'var(--text-muted)',
              }}>
                <input
                  type="checkbox"
                  checked={activeUrgencies.has(u)}
                  onChange={() => toggleUrgency(u)}
                  style={{ accentColor: urgencyColors[u] }}
                />
                <span style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: urgencyColors[u],
                  opacity: activeUrgencies.has(u) ? 1 : 0.3,
                }} />
                {u}
              </label>
            ))}
          </div>

          {/* Score threshold */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12, fontFamily: 'var(--font-mono)' }}>
              SCORE THRESHOLD: <span style={{ color: 'var(--cyan-300)' }}>{scoreThreshold}</span>
            </div>
            <input
              type="range" min="0" max="100" value={scoreThreshold}
              onChange={e => setScoreThreshold(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--cyan-300)' }}
            />
          </div>

          {/* Company count */}
          <div style={{
            padding: '12px 16px', borderRadius: 8, background: 'var(--bg-raised)',
            border: '1px solid var(--border-default)',
          }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 24, fontWeight: 700, color: 'var(--cyan-300)' }}>
              {filtered.length}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>COMPANIES SHOWN</div>
          </div>
        </div>
      </motion.div>

      {/* Toggle button */}
      <button
        onClick={() => setFilterPanel(p => !p)}
        style={{
          position: 'absolute', left: filterPanel ? 260 : 0, top: '50%',
          transform: 'translateY(-50%)', zIndex: 10,
          width: 24, height: 48, background: 'var(--bg-overlay)',
          border: '1px solid var(--border-default)', borderLeft: 'none',
          borderRadius: '0 8px 8px 0', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--text-muted)',
          transition: 'left 300ms',
        }}
      >
        {filterPanel ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
      </button>

      {/* Map */}
      <div style={{ flex: 1, position: 'relative', background: 'var(--bg-base)' }}>
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{ center: [137, 38], scale: 1800 }}
          style={{ width: '100%', height: '100%' }}
        >
          <Geographies geography={japanUrl}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="var(--bg-raised)"
                  stroke="var(--border-default)"
                  strokeWidth={0.5}
                  style={{
                    default: { outline: 'none' },
                    hover: { fill: 'var(--bg-hover)', outline: 'none' },
                    pressed: { outline: 'none' },
                  }}
                />
              ))
            }
          </Geographies>
          {filtered.map(c => {
            const coords = prefectureCoords[c.prefecture];
            if (!coords) return null;
            return (
              <Marker key={c.id} coordinates={coords}>
                <circle
                  r={4 + (c.score / 20)}
                  fill={urgencyColors[c.urgency]}
                  fillOpacity={0.6}
                  stroke={urgencyColors[c.urgency]}
                  strokeWidth={1}
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={(e) => {
                    setHoveredCompany(c);
                    const rect = (e.target as Element).closest('svg')?.getBoundingClientRect();
                    if (rect) {
                      setTooltipPos({ x: e.clientX - rect.left + 10, y: e.clientY - rect.top - 10 });
                    }
                  }}
                  onMouseLeave={() => setHoveredCompany(null)}
                />
                <circle r={4 + (c.score / 20) + 4} fill={urgencyColors[c.urgency]} fillOpacity={0.15} />
              </Marker>
            );
          })}
        </ComposableMap>

        {/* Tooltip */}
        {hoveredCompany && (
          <div style={{
            position: 'absolute', left: tooltipPos.x, top: tooltipPos.y,
            background: 'var(--bg-overlay)', border: '1px solid var(--border-default)',
            borderRadius: 8, padding: '10px 14px', zIndex: 20,
            boxShadow: '0 8px 24px rgba(0,0,0,0.6)', pointerEvents: 'none',
            minWidth: 180,
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{hoveredCompany.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{hoveredCompany.prefecture} · {hoveredCompany.sector}</div>
            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <div>
                <div style={{ fontSize: 18, fontFamily: 'var(--font-mono)', fontWeight: 700, color: urgencyColors[hoveredCompany.urgency] }}>{hoveredCompany.score}</div>
                <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>SCORE</div>
              </div>
              <div>
                <div style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: `${urgencyColors[hoveredCompany.urgency]}20`, color: urgencyColors[hoveredCompany.urgency], fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{hoveredCompany.urgency}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
