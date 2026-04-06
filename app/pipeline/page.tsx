'use client';
import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { companies, urgencyColors, signalColors } from '@/lib/mock-data';
import { Plus, GripVertical, Building2 } from 'lucide-react';
import Link from 'next/link';

// --- Types ---
type Stage = 'discovered' | 'researching' | 'contacted' | 'nda' | 'dd' | 'closed';

interface PipelineCard {
  id: string;
  companyId: number;
  stage: Stage;
  addedAt: string;
}

const STAGES: { id: Stage; label: string; color: string; emoji: string }[] = [
  { id: 'discovered', label: 'Discovered', color: '#8896B3', emoji: '🔍' },
  { id: 'researching', label: 'Researching', color: '#00E5FF', emoji: '📊' },
  { id: 'contacted', label: 'Contacted', color: '#FFB800', emoji: '📨' },
  { id: 'nda', label: 'NDA', color: '#FF6B35', emoji: '📝' },
  { id: 'dd', label: 'Due Diligence', color: '#8B5CF6', emoji: '🔬' },
  { id: 'closed', label: 'Closed', color: '#00FF88', emoji: '✅' },
];

// Seed initial pipeline with some companies
const initialCards: PipelineCard[] = [
  { id: 'c1', companyId: 1, stage: 'discovered', addedAt: '2024-03-28' },
  { id: 'c2', companyId: 7, stage: 'discovered', addedAt: '2024-03-27' },
  { id: 'c3', companyId: 14, stage: 'researching', addedAt: '2024-03-25' },
  { id: 'c4', companyId: 5, stage: 'researching', addedAt: '2024-03-24' },
  { id: 'c5', companyId: 2, stage: 'contacted', addedAt: '2024-03-20' },
  { id: 'c6', companyId: 10, stage: 'nda', addedAt: '2024-03-15' },
  { id: 'c7', companyId: 3, stage: 'dd', addedAt: '2024-03-10' },
  { id: 'c8', companyId: 15, stage: 'closed', addedAt: '2024-03-01' },
];

// --- Sortable Card Component ---
function KanbanCard({
  card,
  isDragging = false,
}: {
  card: PipelineCard;
  isDragging?: boolean;
}) {
  const company = companies.find(c => c.id === card.companyId);
  const {
    attributes, listeners, setNodeRef, transform, transition,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
  };

  if (!company) return null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
    >
      <div
        style={{
          background: 'var(--bg-raised)',
          border: `1px solid ${urgencyColors[company.urgency]}30`,
          borderLeft: `3px solid ${urgencyColors[company.urgency]}`,
          borderRadius: 10,
          padding: '12px 14px',
          marginBottom: 8,
          cursor: 'grab',
          userSelect: 'none',
        }}
        {...listeners}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <GripVertical size={14} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: 2 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <Link
              href={`/companies/${company.id}`}
              onClick={(e) => e.stopPropagation()}
              style={{
                fontSize: 13, fontWeight: 600, color: 'var(--text-primary)',
                textDecoration: 'none', display: 'block',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}
            >
              {company.name}
            </Link>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, fontFamily: 'var(--font-noto)' }}>
              {company.sector} · {company.prefecture}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
              <span style={{
                fontSize: 10, padding: '2px 7px', borderRadius: 6,
                background: `${urgencyColors[company.urgency]}15`,
                color: urgencyColors[company.urgency],
                fontFamily: 'var(--font-mono)', fontWeight: 600,
              }}>{company.urgency}</span>
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700,
                color: company.score >= 85 ? 'var(--red)' : company.score >= 70 ? 'var(--amber)' : 'var(--cyan-300)',
              }}>{company.score}</span>
            </div>
            {/* Signals */}
            <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
              {company.signals.slice(0, 2).map(s => (
                <span key={s} style={{
                  fontSize: 9, padding: '1px 5px', borderRadius: 4,
                  background: `${signalColors[s] || '#8896B3'}15`,
                  color: signalColors[s] || '#8896B3',
                  fontFamily: 'var(--font-mono)',
                }}>{s}</span>
              ))}
            </div>
            {/* Company value */}
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, fontFamily: 'var(--font-mono)' }}>
              推定: {company.value}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Drag Overlay Card ---
function DragOverlayCard({ card }: { card: PipelineCard }) {
  const company = companies.find(c => c.id === card.companyId);
  if (!company) return null;

  return (
    <div style={{
      background: 'var(--bg-raised)',
      border: `1px solid ${urgencyColors[company.urgency]}60`,
      borderLeft: `3px solid ${urgencyColors[company.urgency]}`,
      borderRadius: 10,
      padding: '12px 14px',
      width: 220,
      boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
      cursor: 'grabbing',
    }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{company.name}</div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{company.sector} · {company.prefecture}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
        <span style={{
          fontSize: 10, padding: '2px 7px', borderRadius: 6,
          background: `${urgencyColors[company.urgency]}15`,
          color: urgencyColors[company.urgency],
          fontFamily: 'var(--font-mono)', fontWeight: 600,
        }}>{company.urgency}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: 'var(--cyan-300)' }}>{company.score}</span>
      </div>
    </div>
  );
}

// --- Add Company Modal ---
function AddCardModal({
  stage,
  existingIds,
  onAdd,
  onClose,
}: {
  stage: Stage;
  existingIds: number[];
  onAdd: (companyId: number) => void;
  onClose: () => void;
}) {
  const available = companies.filter(c => !existingIds.includes(c.id));

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.8)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: 16,
          width: 400,
          maxHeight: 520,
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-default)' }}>
          <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: 4 }}>
            ADD TO PIPELINE
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
            {STAGES.find(s => s.id === stage)?.label} ステージに追加
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
          {available.length === 0 && (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              追加可能な企業がありません
            </div>
          )}
          {available.map(c => (
            <button
              key={c.id}
              onClick={() => { onAdd(c.id); onClose(); }}
              style={{
                width: '100%', padding: '12px 24px',
                background: 'transparent', border: 'none',
                borderBottom: '1px solid var(--border-default)',
                cursor: 'pointer', textAlign: 'left',
                transition: 'background 150ms',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.sector} · {c.prefecture}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    fontSize: 10, padding: '2px 7px', borderRadius: 6,
                    background: `${urgencyColors[c.urgency]}15`,
                    color: urgencyColors[c.urgency],
                    fontFamily: 'var(--font-mono)',
                  }}>{c.urgency}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: 'var(--cyan-300)' }}>{c.score}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

// --- Column ---
function KanbanColumn({
  stage,
  cards,
  allExistingIds,
  onAddCard,
}: {
  stage: typeof STAGES[0];
  cards: PipelineCard[];
  allExistingIds: number[];
  onAddCard: (stage: Stage, companyId: number) => void;
}) {
  const [addOpen, setAddOpen] = useState(false);
  const cardIds = cards.map(c => c.id);

  return (
    <>
      <div style={{
        width: 240, flexShrink: 0,
        display: 'flex', flexDirection: 'column',
        height: 'calc(100vh - 120px)',
      }}>
        {/* Column Header */}
        <div style={{
          padding: '12px 16px',
          background: 'var(--bg-surface)',
          border: `1px solid ${stage.color}30`,
          borderTop: `3px solid ${stage.color}`,
          borderRadius: '10px 10px 0 0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16 }}>{stage.emoji}</span>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                {stage.label}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {cards.length} 社
              </div>
            </div>
          </div>
          <button
            onClick={() => setAddOpen(true)}
            style={{
              width: 24, height: 24, borderRadius: 6,
              background: `${stage.color}15`,
              border: `1px solid ${stage.color}30`,
              color: stage.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <Plus size={14} />
          </button>
        </div>

        {/* Cards area */}
        <div style={{
          flex: 1, overflowY: 'auto',
          background: 'var(--bg-surface)',
          border: `1px solid ${stage.color}15`,
          borderTop: 'none', borderRadius: '0 0 10px 10px',
          padding: '10px 10px 80px',
        }}>
          <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
            {cards.map(card => (
              <KanbanCard key={card.id} card={card} />
            ))}
          </SortableContext>
          {cards.length === 0 && (
            <div style={{
              padding: 20, textAlign: 'center',
              color: 'var(--text-muted)', fontSize: 12,
              border: `1px dashed ${stage.color}20`,
              borderRadius: 8, fontFamily: 'var(--font-mono)',
            }}>
              DROP HERE
            </div>
          )}
        </div>
      </div>

      {addOpen && (
        <AddCardModal
          stage={stage.id}
          existingIds={allExistingIds}
          onAdd={(companyId) => onAddCard(stage.id, companyId)}
          onClose={() => setAddOpen(false)}
        />
      )}
    </>
  );
}

// --- Stats Bar ---
function PipelineStats({ cards }: { cards: PipelineCard[] }) {
  const totalValue = cards.reduce((sum, card) => {
    const company = companies.find(c => c.id === card.companyId);
    if (!company) return sum;
    const raw = company.value ? parseFloat(company.value.replace(/[¥億]/g, '')) : 0;
    const val = isFinite(raw) ? raw : 0;
    return sum + val;
  }, 0);

  return (
    <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
      {[
        { label: 'パイプライン総数', value: cards.length, unit: '社', color: 'var(--cyan-300)' },
        { label: '推定総価値', value: totalValue.toFixed(1), unit: '億円', color: 'var(--green)' },
        {
          label: 'DD段階',
          value: cards.filter(c => c.stage === 'dd' || c.stage === 'nda').length,
          unit: '社',
          color: 'var(--amber)',
        },
        {
          label: 'Closed',
          value: cards.filter(c => c.stage === 'closed').length,
          unit: '社',
          color: '#00FF88',
        },
      ].map(stat => (
        <div key={stat.label} className="card" style={{ padding: '14px 20px', flex: 1 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 24, fontWeight: 700, color: stat.color }}>
            {stat.value}
            <span style={{ fontSize: 13, marginLeft: 4 }}>{stat.unit}</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  );
}

// --- Main Pipeline Page ---
export default function PipelinePage() {
  const [cards, setCards] = useState<PipelineCard[]>(initialCards);
  const [activeCard, setActiveCard] = useState<PipelineCard | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const getCardsForStage = useCallback((stage: Stage) =>
    cards.filter(c => c.stage === stage),
    [cards]
  );

  const allExistingIds = cards.map(c => c.companyId);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const id = String(event.active.id);
    setActiveCard(cards.find(c => c.id === id) ?? null);
  }, [cards]);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeCardId = String(active.id);
    const overId = String(over.id);

    // Check if over a stage container
    const overStage = STAGES.find(s => s.id === overId);
    if (overStage) {
      setCards(prev => prev.map(c =>
        c.id === activeCardId ? { ...c, stage: overStage.id } : c
      ));
      return;
    }

    // Check if over another card — move to that card's stage
    const overCard = cards.find(c => c.id === overId);
    if (overCard && overCard.stage !== cards.find(c => c.id === activeCardId)?.stage) {
      setCards(prev => prev.map(c =>
        c.id === activeCardId ? { ...c, stage: overCard.stage } : c
      ));
    }
  }, [cards]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveCard(null);

    const { active, over } = event;
    if (!over) return;

    const activeCardId = String(active.id);
    const overId = String(over.id);

    const overStage = STAGES.find(s => s.id === overId);
    if (overStage) {
      setCards(prev => prev.map(c =>
        c.id === activeCardId ? { ...c, stage: overStage.id } : c
      ));
    }
  }, []);

  const handleAddCard = useCallback((stage: Stage, companyId: number) => {
    const newCard: PipelineCard = {
      id: `c${Date.now()}`,
      companyId,
      stage,
      addedAt: new Date().toISOString().split('T')[0],
    };
    setCards(prev => [...prev, newCard]);
  }, []);

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Building2 size={24} style={{ color: 'var(--cyan-300)' }} />
          Deal Pipeline
        </h1>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          M&A案件のステージ管理 — ドラッグ&ドロップで進捗を更新
        </div>
      </div>

      {/* Stats */}
      <PipelineStats cards={cards} />

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div style={{
          display: 'flex', gap: 16,
          overflowX: 'auto',
          paddingBottom: 24,
        }}>
          {STAGES.map(stage => (
            <KanbanColumn
              key={stage.id}
              stage={stage}
              cards={getCardsForStage(stage.id)}
              allExistingIds={allExistingIds}
              onAddCard={handleAddCard}
            />
          ))}
        </div>

        <DragOverlay>
          <AnimatePresence>
            {activeCard && <DragOverlayCard card={activeCard} />}
          </AnimatePresence>
        </DragOverlay>
      </DndContext>
    </div>
  );
}
