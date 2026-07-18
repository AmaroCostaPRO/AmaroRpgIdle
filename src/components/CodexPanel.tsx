import React, { useMemo, useState } from 'react';
import { useGameStore, getGlobalClassLevels, isClassUnlocked } from '../store/useGameStore';
import { AudioManager } from '../core/AudioManager';
import { CODEX_CATEGORIES, CODEX_ENTRIES, CodexCategory, CodexUnlockContext } from '../core/codexData';

export const CodexPanel: React.FC = () => {
  const character = useGameStore((s) => s.character);
  const [activeCategory, setActiveCategory] = useState<CodexCategory>('cosmology');
  const [search, setSearch] = useState('');

  const ctx: CodexUnlockContext = useMemo(() => {
    const classLevels = character.classLevels || {};
    const globalClassLevels = getGlobalClassLevels();
    const getClassLevel = (id: string) => Math.max(classLevels[id] || 0, globalClassLevels[id] || 0);
    return {
      character,
      getClassLevel,
      isClassUnlockedFn: (id: string) => isClassUnlocked(id, classLevels),
      totalKills: Object.values(character.killCount || {}).reduce((a, b) => a + b, 0),
    };
  }, [character]);

  const resolvedEntries = useMemo(
    () => CODEX_ENTRIES.map((entry) => ({ entry, unlocked: entry.alwaysVisible || entry.isUnlocked(ctx) })),
    [ctx]
  );

  const totalUnlocked = resolvedEntries.filter((e) => e.unlocked).length;

  const categoryEntries = useMemo(() => {
    const query = search.trim().toLowerCase();
    return resolvedEntries.filter(({ entry }) => {
      if (entry.category !== activeCategory) return false;
      if (!query) return true;
      const haystack = `${entry.title} ${entry.subtitle || ''} ${(entry.tags || []).join(' ')}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [resolvedEntries, activeCategory, search]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, { unlocked: number; total: number }> = {};
    for (const cat of CODEX_CATEGORIES) counts[cat.id] = { unlocked: 0, total: 0 };
    for (const { entry, unlocked } of resolvedEntries) {
      counts[entry.category].total += 1;
      if (unlocked) counts[entry.category].unlocked += 1;
    }
    return counts;
  }, [resolvedEntries]);

  return (
    <div className="panel animate-tabFade" style={{ padding: '1.25rem', color: '#fff', pointerEvents: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-dim)' }}>
        <h2 className="section-title" style={{ border: 'none', paddingBottom: 0 }}>Codex — Ciclo da Alma Partida</h2>
      </div>

      <div style={{ background: 'rgba(168,85,247,0.07)', border: '1px solid rgba(168,85,247,0.2)', borderRadius: 'var(--radius-md)', padding: '0.75rem' }}>
        <p style={{ fontSize: '0.65rem', color: '#a855f7', fontStyle: 'italic', margin: 0, lineHeight: 1.5 }}>
          "A Alma-Mundo não esquece. Cada marco que você atravessa fica gravado aqui — fragmentos de uma história que só pode ser contada por quem a viveu."
        </p>
        <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.6rem', color: '#64748b' }}>Entradas reveladas</span>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#a855f7' }}>{totalUnlocked} / {resolvedEntries.length}</span>
        </div>
        <div style={{ marginTop: '0.35rem', height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '999px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${(totalUnlocked / resolvedEntries.length) * 100}%`, background: 'linear-gradient(90deg, #7c3aed, #a855f7)', borderRadius: '999px', transition: 'width 0.5s ease' }} />
        </div>
      </div>

      {/* Sub-navegação por categoria */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.35rem', background: 'rgba(0,0,0,0.4)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-dim)' }}>
        {CODEX_CATEGORIES.map((cat) => {
          const counts = categoryCounts[cat.id];
          return (
            <button
              key={cat.id}
              onClick={() => { AudioManager.getInstance().playClick(); setActiveCategory(cat.id); }}
              className={`tab-btn ${activeCategory === cat.id ? 'active' : ''}`}
              style={{ padding: '0.4rem', fontSize: '0.62rem', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.1rem' }}
            >
              <span>{cat.icon} {cat.label}</span>
              <span style={{ fontSize: '0.5rem', color: '#94a3b8' }}>{counts.unlocked}/{counts.total}</span>
            </button>
          );
        })}
      </div>

      {/* Busca */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar por título ou palavra-chave..."
        style={{
          width: '100%',
          background: 'rgba(0,0,0,0.35)',
          border: '1px solid var(--border-dim)',
          borderRadius: 'var(--radius-md)',
          padding: '0.5rem 0.7rem',
          color: '#fff',
          fontSize: '0.68rem',
          outline: 'none',
        }}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '520px', overflowY: 'auto', paddingRight: '0.25rem' }}>
        {categoryEntries.length === 0 && (
          <p style={{ fontSize: '0.65rem', color: '#64748b', textAlign: 'center', padding: '1rem 0' }}>
            Nenhuma entrada encontrada nesta categoria.
          </p>
        )}
        {categoryEntries.map(({ entry, unlocked }) => (
          <div
            key={entry.id}
            style={{
              background: unlocked ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.2)',
              border: `1px solid ${unlocked ? entry.color + '40' : 'rgba(255,255,255,0.06)'}`,
              borderLeft: `3px solid ${unlocked ? entry.color : '#374151'}`,
              borderRadius: 'var(--radius-md)',
              padding: '0.65rem 0.75rem',
              opacity: unlocked ? 1 : 0.5,
              transition: 'all 0.2s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.9rem' }}>{unlocked ? entry.icon : '🔒'}</span>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: unlocked ? entry.color : '#4b5563' }}>
                  {entry.title}
                </span>
                {entry.subtitle && unlocked && (
                  <span style={{ fontSize: '0.55rem', color: '#64748b' }}>{entry.subtitle}</span>
                )}
              </div>
              {unlocked && (
                <span style={{ marginLeft: 'auto', fontSize: '0.5rem', background: entry.color + '20', color: entry.color, border: `1px solid ${entry.color}40`, borderRadius: '4px', padding: '1px 5px', fontWeight: 700 }}>
                  REVELADO
                </span>
              )}
            </div>
            {unlocked ? (
              <p style={{ fontSize: '0.63rem', color: '#94a3b8', margin: 0, lineHeight: 1.55, fontStyle: 'italic' }}>
                {entry.lore}
              </p>
            ) : (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.3rem' }}>
                <span style={{ fontSize: '0.65rem', flexShrink: 0 }}>🔑</span>
                <p style={{ fontSize: '0.61rem', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                  {entry.unlockHint}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
