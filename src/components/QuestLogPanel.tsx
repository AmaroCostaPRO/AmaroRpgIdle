import React, { useState } from 'react';
import { useQuestStore } from '../store/useQuestStore';
import { STORY_ITEMS_CATALOG } from '../core/quests/storyItemsData';
import { AudioManager } from '../core/AudioManager';

export const QuestLogPanel: React.FC = () => {
  const [subTab, setSubTab] = useState<'main' | 'contracts' | 'storyItems'>('main');

  const mainQuests = useQuestStore((s) => s.mainQuests);
  const proceduralQuests = useQuestStore((s) => s.proceduralQuests);
  const storyInventory = useQuestStore((s) => s.storyInventory);
  const claimReward = useQuestStore((s) => s.claimReward);
  const generateRunQuests = useQuestStore((s) => s.generateRunQuests);

  const mainQuestsList = Object.values(mainQuests);
  const huntCraftQuests = proceduralQuests.filter((q) => q.category === 'hunt' || q.category === 'craft');
  const npcQuests = proceduralQuests.filter((q) => q.category === 'npc');

  return (
    <div className="panel animate-tabFade" style={{ padding: '1.25rem', color: '#fff', pointerEvents: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Cabeçalho */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-dim)' }}>
        <h2 className="section-title" style={{ border: 'none', paddingBottom: 0, margin: 0 }}>📜 Diário de Jornada</h2>
        <button
          onClick={() => {
            AudioManager.getInstance().playClick();
            generateRunQuests();
          }}
          className="btn btn-xs btn-secondary"
          style={{ fontSize: '0.62rem' }}
        >
          🔄 Renovar Contratos
        </button>
      </div>

      {/* Navegação de Sub-Abas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.35rem', background: 'rgba(0,0,0,0.4)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-dim)' }}>
        <button
          onClick={() => { AudioManager.getInstance().playClick(); setSubTab('main'); }}
          className={`tab-btn ${subTab === 'main' ? 'active' : ''}`}
          style={{ padding: '0.45rem', fontSize: '0.65rem' }}
        >
          🌟 Jornada Principal
        </button>
        <button
          onClick={() => { AudioManager.getInstance().playClick(); setSubTab('contracts'); }}
          className={`tab-btn ${subTab === 'contracts' ? 'active' : ''}`}
          style={{ padding: '0.45rem', fontSize: '0.65rem' }}
        >
          ⚔️ Contratos & Caçadas
        </button>
        <button
          onClick={() => { AudioManager.getInstance().playClick(); setSubTab('storyItems'); }}
          className={`tab-btn ${subTab === 'storyItems' ? 'active' : ''}`}
          style={{ padding: '0.45rem', fontSize: '0.65rem' }}
        >
          🏺 Artefatos de História
        </button>
      </div>

      {/* Conteúdo da Sub-Aba: Jornada Principal */}
      {subTab === 'main' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '520px', overflowY: 'auto', paddingRight: '0.25rem' }}>
          {mainQuestsList.map((quest) => (
            <div
              key={quest.id}
              style={{
                background: quest.isCompleted ? 'rgba(16, 185, 129, 0.08)' : 'rgba(0, 0, 0, 0.35)',
                border: `1px solid ${quest.isCompleted ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-dim)'}`,
                borderLeft: `4px solid ${quest.isCompleted ? '#10b981' : '#a855f7'}`,
                borderRadius: 'var(--radius-md)',
                padding: '0.75rem 0.85rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.58rem', color: '#a855f7', fontWeight: 700, textTransform: 'uppercase' }}>
                    Ato {quest.act} — Capítulo {quest.chapterNumber}
                  </span>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff' }}>{quest.title}</span>
                </div>
                {quest.isClaimed ? (
                  <span style={{ fontSize: '0.55rem', background: 'rgba(16,185,129,0.2)', color: '#10b981', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(16,185,129,0.4)' }}>
                    ✓ CONCLUÍDO
                  </span>
                ) : quest.isCompleted ? (
                  <button
                    onClick={() => {
                      AudioManager.getInstance().playClick();
                      claimReward(quest.id);
                    }}
                    className="btn btn-xs"
                    style={{ background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', color: '#fff', fontWeight: 700 }}
                  >
                    🎁 RECLAMAR
                  </button>
                ) : (
                  <span style={{ fontSize: '0.55rem', background: 'rgba(255,255,255,0.06)', color: '#94a3b8', padding: '2px 6px', borderRadius: '4px' }}>
                    EM PROGRESSO
                  </span>
                )}
              </div>

              <p style={{ fontSize: '0.64rem', color: '#94a3b8', margin: 0, lineHeight: 1.45 }}>{quest.description}</p>

              {/* Lista de Objetivos */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', background: 'rgba(0,0,0,0.25)', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
                {quest.objectives.map((obj) => {
                  const pct = Math.min(100, (obj.currentAmount / obj.requiredAmount) * 100);
                  const isDone = obj.currentAmount >= obj.requiredAmount;
                  return (
                    <div key={obj.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.62rem' }}>
                        <span style={{ color: isDone ? '#10b981' : '#cbd5e1' }}>
                          {isDone ? '✓ ' : '• '}{obj.description}
                        </span>
                        <span style={{ fontWeight: 700, color: isDone ? '#10b981' : '#a855f7' }}>
                          {obj.currentAmount} / {obj.requiredAmount}
                        </span>
                      </div>
                      <div style={{ height: '3px', background: 'rgba(255,255,255,0.08)', borderRadius: '999px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: isDone ? '#10b981' : '#a855f7', transition: 'width 0.4s' }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Recompensas */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.6rem', color: '#e2e8f0', marginTop: '0.2rem' }}>
                <span style={{ color: '#94a3b8', fontWeight: 600 }}>Recompensas:</span>
                {quest.rewards.gold && <span style={{ color: '#fbbf24' }}>🪙 {quest.rewards.gold} Ouro</span>}
                {quest.rewards.forgeFragments && <span style={{ color: '#a855f7' }}>💎 {quest.rewards.forgeFragments} Frag. Forja</span>}
                {quest.rewards.storyItemId && (
                  <span style={{ color: '#38bdf8' }}>🏺 {STORY_ITEMS_CATALOG[quest.rewards.storyItemId]?.name}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Conteúdo da Sub-Aba: Contratos & Caçadas */}
      {subTab === 'contracts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '520px', overflowY: 'auto', paddingRight: '0.25rem' }}>
          {[...huntCraftQuests, ...npcQuests].length === 0 && (
            <p style={{ fontSize: '0.65rem', color: '#64748b', textAlign: 'center', padding: '1.5rem 0' }}>
              Nenhum contrato ativo no momento. Clique em "Renovar Contratos" acima para solicitar novas tarefas!
            </p>
          )}

          {[...huntCraftQuests, ...npcQuests].map((quest) => (
            <div
              key={quest.id}
              style={{
                background: quest.isCompleted ? 'rgba(16, 185, 129, 0.08)' : 'rgba(0, 0, 0, 0.35)',
                border: `1px solid ${quest.isCompleted ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-dim)'}`,
                borderLeft: `4px solid ${quest.category === 'hunt' ? '#ef4444' : quest.category === 'craft' ? '#f59e0b' : '#3b82f6'}`,
                borderRadius: 'var(--radius-md)',
                padding: '0.75rem 0.85rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.4rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fff' }}>{quest.title}</span>
                {quest.isClaimed ? (
                  <span style={{ fontSize: '0.55rem', color: '#10b981', fontWeight: 700 }}>✓ CONCLUÍDO</span>
                ) : quest.isCompleted ? (
                  <button
                    onClick={() => {
                      AudioManager.getInstance().playClick();
                      claimReward(quest.id);
                    }}
                    className="btn btn-xs"
                    style={{ background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', color: '#fff' }}
                  >
                    🎁 RECLAMAR
                  </button>
                ) : (
                  <span style={{ fontSize: '0.55rem', color: '#94a3b8' }}>ROTAÇÃO ATIVA</span>
                )}
              </div>
              <p style={{ fontSize: '0.62rem', color: '#94a3b8', margin: 0 }}>{quest.description}</p>
              {quest.objectives.map((obj) => (
                <div key={obj.id} style={{ fontSize: '0.6rem', color: '#cbd5e1' }}>
                  • {obj.description}: <strong>{obj.currentAmount} / {obj.requiredAmount}</strong>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Conteúdo da Sub-Aba: Artefatos de História */}
      {subTab === 'storyItems' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '520px', overflowY: 'auto' }}>
          <div style={{ background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: 'var(--radius-md)', padding: '0.75rem' }}>
            <p style={{ fontSize: '0.64rem', color: '#38bdf8', margin: 0, fontStyle: 'italic' }}>
              "Os Artefatos Narrativos são fragmentos eternos da Alma-Mundo. Diferente dos equipamentos comuns, eles permanecem intactos entre Ascensões e Transcendências, concedendo bônus permanentes."
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.6rem' }}>
            {Object.values(STORY_ITEMS_CATALOG).map((item) => {
              const count = storyInventory[item.id] || 0;
              const unlocked = count > 0;

              return (
                <div
                  key={item.id}
                  style={{
                    background: unlocked ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.2)',
                    border: `1px solid ${unlocked ? 'rgba(56, 189, 248, 0.3)' : 'rgba(255,255,255,0.06)'}`,
                    borderRadius: 'var(--radius-md)',
                    padding: '0.65rem',
                    opacity: unlocked ? 1 : 0.45,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.35rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '4px', overflow: 'hidden', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative' }}>
                      <span style={{ fontSize: '1.2rem', position: 'absolute' }}>{unlocked ? item.icon : '🔒'}</span>
                      {unlocked && (
                        <img
                          src={`/assets/${item.id}.png`}
                          alt={item.name}
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = 'none';
                          }}
                          style={{ width: '100%', height: '100%', objectFit: 'contain', position: 'relative', zIndex: 1 }}
                        />
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, color: unlocked ? '#38bdf8' : '#64748b' }}>
                        {item.name}
                      </span>
                      <span style={{ fontSize: '0.55rem', color: '#94a3b8' }}>
                        {unlocked ? `Adquirido (${count}x)` : 'Bloqueado'}
                      </span>
                    </div>
                  </div>
                  {unlocked ? (
                    <>
                      <p style={{ fontSize: '0.58rem', color: '#cbd5e1', margin: 0, fontStyle: 'italic' }}>"{item.lore}"</p>
                      <span style={{ fontSize: '0.58rem', fontWeight: 700, color: '#10b981', marginTop: '0.1rem' }}>
                        ✨ {item.passiveDescription}
                      </span>
                    </>
                  ) : (
                    <span style={{ fontSize: '0.58rem', color: '#64748b' }}>Conclua missões da Jornada para desbloquear.</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
