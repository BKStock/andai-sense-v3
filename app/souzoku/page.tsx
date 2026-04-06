"use client";

import { useState, useEffect, useCallback } from "react";
import { useApp } from "@/lib/theme-context";

interface SouzokuLead {
  id: number;
  deceased_id: number;
  name: string;
  age: number | null;
  prefecture: string | null;
  city: string | null;
  published_date: string | null;
  property_address: string | null;
  property_type: string | null;
  estimated_value: number;
  lead_score: number;
  dm_status: "pending" | "sent" | "responded";
  dm_text: string | null;
  notes: string | null;
  created_at: string;
}

const STATUS_LABELS: Record<string, string> = {
  pending: "未送付",
  sent: "DM送付済",
  responded: "反応あり",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "rgba(234, 179, 8, 0.15)",
  sent: "rgba(59, 130, 246, 0.15)",
  responded: "rgba(34, 197, 94, 0.15)",
};

const STATUS_TEXT_COLORS: Record<string, string> = {
  pending: "#eab308",
  sent: "#60a5fa",
  responded: "#4ade80",
};

function scoreColor(score: number): string {
  if (score >= 80) return "#4ade80";
  if (score >= 60) return "#eab308";
  return "#f87171";
}

function ScoreBar({ score }: { score: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div
        style={{
          flex: 1,
          height: 4,
          borderRadius: 2,
          background: "var(--bg-raised)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${score}%`,
            height: "100%",
            background: scoreColor(score),
            borderRadius: 2,
            transition: "width 600ms ease",
          }}
        />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color: scoreColor(score), minWidth: 28 }}>
        {Math.round(score)}
      </span>
    </div>
  );
}

export default function SouzokuPage() {
  const { lang } = useApp();
  const t = (ja: string, en: string) => (lang === "ja" ? ja : en);

  const [leads, setLeads] = useState<SouzokuLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [generatingId, setGeneratingId] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [scanResult, setScanResult] = useState<string | null>(null);

  const fetchLeads = useCallback(async () => {
    try {
      const res = await fetch("/api/souzoku/leads");
      if (!res.ok) throw new Error("fetch failed");
      const data = (await res.json()) as { leads: SouzokuLead[] };
      setLeads(data.leads);
    } catch {
      // Silent fail — empty state shown
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchLeads();
  }, [fetchLeads]);

  const handleScan = async () => {
    setScanning(true);
    setScanResult(null);
    try {
      const res = await fetch("/api/souzoku/run", { method: "POST" });
      if (!res.ok) {
        setScanResult(t("スキャン失敗", "Scan failed"));
        return;
      }
      const data = (await res.json()) as { scraped?: number; imported?: number; error?: string };
      if (data.error) {
        setScanResult(`エラー: ${data.error}`);
      } else {
        setScanResult(
          t(
            `スキャン完了: ${data.scraped ?? 0}件取得 / ${data.imported ?? 0}件登録`,
            `Scan complete: ${data.scraped ?? 0} found / ${data.imported ?? 0} imported`,
          ),
        );
        await fetchLeads();
      }
    } catch {
      setScanResult(t("スキャン失敗", "Scan failed"));
    } finally {
      setScanning(false);
    }
  };

  const handleGenerateDM = async (id: number) => {
    setGeneratingId(id);
    try {
      const res = await fetch(`/api/souzoku/generate-dm/${id}`, { method: "POST" });
      if (res.ok) {
        const data = (await res.json()) as { dm_text: string };
        setLeads(prev =>
          prev.map(l => (l.id === id ? { ...l, dm_text: data.dm_text } : l)),
        );
        setExpandedId(id);
      }
    } finally {
      setGeneratingId(null);
    }
  };

  const handleMarkStatus = async (id: number, status: string) => {
    // Optimistic update
    setLeads(prev =>
      prev.map(l =>
        l.id === id ? { ...l, dm_status: status as SouzokuLead["dm_status"] } : l,
      ),
    );
    try {
      await fetch(`/api/souzoku/mark-sent/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
    } catch {
      // Revert on error
      await fetchLeads();
    }
  };

  const kpis = [
    {
      label: t("新着リード", "New Leads"),
      value: leads.filter(l => l.dm_status === "pending").length,
      color: "#eab308",
      icon: "⚡",
    },
    {
      label: t("高スコア (80+)", "High Score (80+)"),
      value: leads.filter(l => l.lead_score >= 80).length,
      color: "#4ade80",
      icon: "🎯",
    },
    {
      label: t("DM送付済", "DMs Sent"),
      value: leads.filter(l => l.dm_status === "sent").length,
      color: "#60a5fa",
      icon: "📨",
    },
    {
      label: t("総リード数", "Total Leads"),
      value: leads.length,
      color: "var(--cyan-300)",
      icon: "🏠",
    },
  ];

  return (
    <div style={{ padding: "24px 32px", maxWidth: 1100 }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 24,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "var(--text-primary)",
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 6,
            }}
          >
            <span style={{ fontSize: 24 }}>🏠</span>
            {t("相続リード", "Inheritance Leads")}
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
            {t(
              "おくやみ情報 × 不動産登記照合 — 市場流通前の物件を早期発見",
              "Obituary × Registry Cross-reference — Early access to pre-market properties",
            )}
          </p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
          <button
            onClick={handleScan}
            disabled={scanning}
            style={{
              padding: "8px 18px",
              background: scanning ? "var(--bg-raised)" : "rgba(168, 85, 247, 0.15)",
              border: "1px solid rgba(168, 85, 247, 0.4)",
              color: scanning ? "var(--text-muted)" : "#c084fc",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: scanning ? "not-allowed" : "pointer",
              transition: "all 200ms",
            }}
          >
            {scanning ? t("スキャン中...", "Scanning...") : t("今すぐスキャン", "Run Scan")}
          </button>
          {scanResult && (
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{scanResult}</span>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 12,
          marginBottom: 24,
        }}
      >
        {kpis.map((kpi, i) => (
          <div key={i} className="card" style={{ padding: "16px 20px" }}>
            <div style={{ fontSize: 20, marginBottom: 8 }}>{kpi.icon}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: kpi.color, lineHeight: 1 }}>
              {kpi.value}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
              {kpi.label}
            </div>
          </div>
        ))}
      </div>

      {/* Lead List */}
      <div className="card" style={{ overflow: "hidden" }}>
        <div
          style={{
            padding: "14px 20px",
            borderBottom: "1px solid var(--border-default)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
            {t("相続リード一覧", "Lead List")}
          </span>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
            {t("スコア順", "By score")}
          </span>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="row-shimmer"
                style={{ height: 72, margin: "8px 20px", borderRadius: 8 }}
              />
            ))}
          </div>
        ) : leads.length === 0 ? (
          <div style={{ padding: 60, textAlign: "center", color: "var(--text-muted)" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🏠</div>
            <p style={{ fontSize: 14 }}>
              {t(
                "リードがありません。「今すぐスキャン」で収集を開始してください。",
                'No leads yet. Click "Run Scan" to start collecting.',
              )}
            </p>
          </div>
        ) : (
          <div>
            {leads.map((lead, idx) => (
              <div
                key={lead.id}
                style={{
                  borderBottom:
                    idx < leads.length - 1 ? "1px solid var(--border-default)" : "none",
                }}
              >
                <div
                  style={{
                    padding: "14px 20px",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 16,
                    cursor: "pointer",
                    transition: "background 200ms",
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLDivElement).style.background = "var(--bg-hover)";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLDivElement).style.background = "transparent";
                  }}
                  onClick={() => setExpandedId(expandedId === lead.id ? null : lead.id)}
                >
                  {/* Main info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        marginBottom: 6,
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: "var(--text-primary)",
                        }}
                      >
                        {lead.name}
                        {lead.age ? t(`様（享年${lead.age}歳）`, ` (age ${lead.age})`) : "様"}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          padding: "2px 8px",
                          borderRadius: 99,
                          background: STATUS_COLORS[lead.dm_status] ?? "var(--bg-raised)",
                          color: STATUS_TEXT_COLORS[lead.dm_status] ?? "var(--text-muted)",
                          fontWeight: 600,
                        }}
                      >
                        {STATUS_LABELS[lead.dm_status] ?? lead.dm_status}
                      </span>
                      {lead.prefecture && (
                        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                          📍 {lead.prefecture}
                          {lead.city ? ` ${lead.city}` : ""}
                        </span>
                      )}
                    </div>

                    {lead.property_address && (
                      <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 4 }}>
                        物件: {lead.property_address}
                        {lead.property_type ? ` (${lead.property_type})` : ""}
                      </div>
                    )}
                    {lead.estimated_value > 0 && (
                      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                        推定価値: ¥{Math.round(lead.estimated_value / 10000).toLocaleString()}万円
                      </div>
                    )}

                    <div style={{ marginTop: 8, maxWidth: 300 }}>
                      <ScoreBar score={lead.lead_score} />
                    </div>
                  </div>

                  {/* Actions */}
                  <div
                    style={{ display: "flex", gap: 6, flexShrink: 0 }}
                    onClick={e => e.stopPropagation()}
                  >
                    <button
                      onClick={() => handleGenerateDM(lead.id)}
                      disabled={generatingId === lead.id}
                      style={{
                        padding: "5px 12px",
                        fontSize: 12,
                        fontWeight: 600,
                        borderRadius: 6,
                        border: "1px solid rgba(168, 85, 247, 0.4)",
                        background:
                          generatingId === lead.id
                            ? "var(--bg-raised)"
                            : "rgba(168, 85, 247, 0.1)",
                        color: generatingId === lead.id ? "var(--text-muted)" : "#c084fc",
                        cursor: generatingId === lead.id ? "not-allowed" : "pointer",
                        transition: "all 200ms",
                      }}
                    >
                      {generatingId === lead.id ? "生成中..." : "DM生成"}
                    </button>
                    {lead.dm_status !== "sent" && (
                      <button
                        onClick={() => handleMarkStatus(lead.id, "sent")}
                        style={{
                          padding: "5px 12px",
                          fontSize: 12,
                          fontWeight: 600,
                          borderRadius: 6,
                          border: "1px solid rgba(59, 130, 246, 0.4)",
                          background: "rgba(59, 130, 246, 0.1)",
                          color: "#60a5fa",
                          cursor: "pointer",
                          transition: "all 200ms",
                        }}
                      >
                        送付済に
                      </button>
                    )}
                    {lead.dm_status === "sent" && (
                      <button
                        onClick={() => handleMarkStatus(lead.id, "responded")}
                        style={{
                          padding: "5px 12px",
                          fontSize: 12,
                          fontWeight: 600,
                          borderRadius: 6,
                          border: "1px solid rgba(34, 197, 94, 0.4)",
                          background: "rgba(34, 197, 94, 0.1)",
                          color: "#4ade80",
                          cursor: "pointer",
                          transition: "all 200ms",
                        }}
                      >
                        反応あり
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded DM preview */}
                {expandedId === lead.id && lead.dm_text && (
                  <div
                    style={{
                      padding: "0 20px 16px 20px",
                      marginTop: -4,
                    }}
                  >
                    <div
                      style={{
                        padding: 14,
                        background: "var(--bg-raised)",
                        borderRadius: 8,
                        border: "1px solid var(--border-default)",
                        fontSize: 13,
                        color: "var(--text-secondary)",
                        lineHeight: 1.7,
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {lead.dm_text}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Legal notice */}
      <p
        style={{
          marginTop: 16,
          fontSize: 11,
          color: "var(--text-muted)",
          lineHeight: 1.6,
        }}
      >
        ⚠️{" "}
        {t(
          "本機能の利用にあたっては個人情報保護法・特定電子メール法等の関連法規を遵守してください。",
          "Use of this feature must comply with the Personal Information Protection Act and relevant Japanese regulations.",
        )}
      </p>
    </div>
  );
}
