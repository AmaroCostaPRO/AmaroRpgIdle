import React, { useState, useEffect } from 'react';
import { useQuestStore, MAX_DAILY_CONTRACT_RENEWALS } from '../store/useQuestStore';
import { useGameStore } from '../store/useGameStore';
import { STORY_ITEMS_CATALOG } from '../core/quests/storyItemsData';
import { ACT_CUTSCENES_CATALOG } from '../core/quests/storyCutscenesData';
import { AudioManager } from '../core/AudioManager';
import { getTransparentImageUrl, peekTransparentImageUrl } from '../core/imageBackgroundStrip';

// Ícone de Artefato de História com remoção de fundo via chroma key (#FE0201, mesmo pipeline das
// construções da Cidadela) — extraído em componente próprio porque é montado dentro de um `.map()`.
const StoryItemIcon: React.FC<{ src: string; alt: string }> = ({ src, alt }) => {
  const [resolvedSrc, setResolvedSrc] = useState<string | null>(() => peekTransparentImageUrl(src));
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setResolvedSrc(peekTransparentImageUrl(src));
    setFailed(false);
    getTransparentImageUrl(src)
      .then((dataUrl) => { if (!cancelled) setResolvedSrc(dataUrl); })
      .catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; };
  }, [src]);

  if (failed || !resolvedSrc) return null;

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      onError={() => setFailed(true)}
      style={{ width: '100%', height: '100%', objectFit: 'contain', position: 'relative', zIndex: 1 }}
    />
  );
};

export const QuestLogPanel: React.FC = () => {
  const [subTab, setSubTab] = useState<'main' | 'contracts' | 'storyItems'>('main');
  const [collapsedActs, setCollapsedActs] = useState<Record<number, boolean>>({});

  const mainQuests = useQuestStore((s) => s.mainQuests);
  const proceduralQuests = useQuestStore((s) => s.proceduralQuests);
  const storyInventory = useQuestStore((s) => s.storyInventory);
  const claimReward = useQuestStore((s) => s.claimReward);
  const generateRunQuests = useQuestStore((s) => s.generateRunQuests);
  const contractRenewalsToday = useQuestStore((s) => s.contractRenewalsToday);
  const contractRenewalsDate = useQuestStore((s) => s.contractRenewalsDate);
  const today = useGameStore((s) => s.getTodayYYYYMMDD());
  const renewalsUsedToday = contractRenewalsDate === today ? contractRenewalsToday : 0;
  const renewalsRemaining = Math.max(0, MAX_DAILY_CONTRACT_RENEWALS - renewalsUsedToday);
  const syncQuestObjectives = useQuestStore((s) => s.syncQuestObjectives);
  const playActCutscene = useQuestStore((s) => s.playActCutscene);

  useEffect(() => {
    syncQuestObjectives();
  }, [syncQuestObjectives]);

  const mainQuestsList = Object.values(mainQuests);

  // Calcula o Ato máximo desbloqueado (Gating sequencial por Ato)
  let maxUnlockedAct = 1;
  for (let act = 1; act <= 6; act++) {
    const questsInAct = mainQuestsList.filter((q) => q.act === act);
    if (questsInAct.length === 0) continue;
    const allDone = questsInAct.every((q) => q.isCompleted || q.isClaimed);
    if (allDone && act < 6) {
      maxUnlockedAct = act + 1;
    } else if (!allDone) {
      maxUnlockedAct = act;
      break;
    }
  }

  // Apenas missões do Ato desbloqueado e Atos anteriores são exibidas
  const visibleMainQuests = mainQuestsList.filter((q) => (q.act || 1) <= maxUnlockedAct);

  const visibleActs = Array.from(new Set(visibleMainQuests.map((q) => q.act || 1))).sort((a, b) => a - b);

  const isActFullyClaimed = (act: number) =>
    mainQuestsList.filter((q) => q.act === act).every((q) => q.isClaimed);

  const isActCollapsed = (act: number) => collapsedActs[act] ?? isActFullyClaimed(act);

  const toggleAct = (act: number) => {
    AudioManager.getInstance().playClick();
    setCollapsedActs((prev) => ({ ...prev, [act]: !isActCollapsed(act) }));
  };

  const huntCraftQuests = proceduralQuests.filter((q) => q.category === 'hunt' || q.category === 'craft');
  const npcQuests = proceduralQuests.filter((q) => q.category === 'npc');

  const subTabsList: Array<{ id: 'main' | 'contracts' | 'storyItems'; label: string; icon: string }> = [
    { id: 'main', label: 'Jornada Principal', icon: '🌟' },
    { id: 'contracts', label: 'Contratos & Caçadas', icon: '⚔️' },
    { id: 'storyItems', label: 'Artefatos de História', icon: '🏺' },
  ];

  return (
    <div className="panel animate-tabFade" style={{ padding: '1.25rem', color: '#fff', pointerEvents: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Cabeçalho */}
      <div style={{ paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-dim)' }}>
        <h2 className="section-title" style={{ border: 'none', paddingBottom: 0, margin: 0 }}>📜 Diário de Jornada</h2>
      </div>

      {/* Seletor de Sub-Abas (grid estático de pills, padrão CodexPanel) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(92px, 1fr))', gap: '0.35rem', background: 'rgba(0,0,0,0.4)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-dim)' }}>
        {subTabsList.map((t) => (
          <button
            key={t.id}
            onClick={() => { AudioManager.getInstance().playClick(); setSubTab(t.id); }}
            className={`tab-btn ${subTab === t.id ? 'active' : ''}`}
            style={{ padding: '0.4rem', fontSize: '0.58rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', minWidth: 0 }}
          >
            <span style={{ minWidth: 0, whiteSpace: 'normal', wordBreak: 'break-word', textAlign: 'center', lineHeight: 1.25 }}>{t.icon} {t.label}</span>
          </button>
        ))}
      </div>

      {/* Conteúdo da Sub-Aba: Jornada Principal */}
      {subTab === 'main' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {visibleActs.map((act) => {
            const chaptersInAct = visibleMainQuests.filter((q) => (q.act || 1) === act);
            const collapsed = isActCollapsed(act);
            const actInfo = ACT_CUTSCENES_CATALOG[act];

            return (
              <div key={act} style={{ border: '1px solid var(--border-dim)', borderRadius: 'var(--radius-md)', overflow: 'hidden', background: 'rgba(0,0,0,0.2)', flexShrink: 0 }}>
                {/* Cabeçalho do Ato: título, chevron de colapso e Rever Cena (1x por Ato) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0.75rem', background: 'rgba(168, 85, 247, 0.08)' }}>
                  <button
                    onClick={() => toggleAct(act)}
                    style={{ background: 'none', border: 'none', color: '#fff', flex: 1, textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: 0, minWidth: 0 }}
                  >
                    <span className={`console-arrow ${collapsed ? 'collapsed' : 'expanded'}`} style={{ fontSize: '0.6rem', flexShrink: 0 }}>▼</span>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#a855f7', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {actInfo?.title || `Ato ${act}`}
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      AudioManager.getInstance().playClick();
                      playActCutscene(act);
                    }}
                    className="btn btn-xs btn-secondary"
                    style={{ fontSize: '0.55rem', padding: '2px 8px', color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.3)', flexShrink: 0 }}
                    title="Rever a cena narrativa deste Ato"
                  >
                    🎬 Rever Cena
                  </button>
                </div>

                {/* Corpo do Ato: capítulos (colapso via mount condicional, altura automática) */}
                {!collapsed && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', padding: '0.75rem' }}>
                    {chaptersInAct.map((quest) => (
                      <div
                        key={quest.id}
                        style={{
                          background: quest.isCompleted ? 'rgba(16, 185, 129, 0.08)' : 'rgba(0, 0, 0, 0.35)',
                          border: `1px solid ${quest.isCompleted ? 'rgba(16, 185, 129, 0.35)' : 'var(--border-dim)'}`,
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
                              Capítulo {quest.chapterNumber}
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
                                AudioManager.getInstance().playQuestComplete();
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
              </div>
            );
          })}

          {maxUnlockedAct < 6 && (
            <div style={{ padding: '0.75rem', background: 'rgba(0,0,0,0.3)', border: '1px dashed var(--border-dim)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
              <span style={{ fontSize: '0.64rem', color: '#94a3b8' }}>
                🔒 <strong>Ato {maxUnlockedAct + 1}</strong>: Conclua e reclame todas as missões do Ato {maxUnlockedAct} para prosseguir na história.
              </span>
            </div>
          )}
        </div>
      )}

      {/* Conteúdo da Sub-Aba: Contratos & Caçadas */}
      {subTab === 'contracts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
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
                border: `1px solid ${quest.isCompleted ? 'rgba(16, 185, 129, 0.35)' : 'var(--border-dim)'}`,
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
                      AudioManager.getInstance().playQuestComplete();
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

              {/* Recompensas da Missão Procedural */}
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.6rem', color: '#e2e8f0', marginTop: '0.25rem' }}>
                <span style={{ color: '#94a3b8', fontWeight: 600 }}>Recompensas:</span>
                {quest.rewards.gold && <span style={{ color: '#fbbf24' }}>🪙 {quest.rewards.gold} Ouro</span>}
                {quest.rewards.forgeFragments && <span style={{ color: '#a855f7' }}>💎 {quest.rewards.forgeFragments} Frag. Forja</span>}
                {quest.rewards.studyInsignias && <span style={{ color: '#38bdf8' }}>📜 {quest.rewards.studyInsignias} Insígnias</span>}
                {quest.rewards.abyssPearls && <span style={{ color: '#06b6d4' }}>🦪 {quest.rewards.abyssPearls} Pérolas</span>}
                {quest.rewards.transcendenceEssence && <span style={{ color: '#ec4899' }}>✨ {quest.rewards.transcendenceEssence} Essência</span>}
                {quest.rewards.storyItemId && (
                  <span style={{ color: '#38bdf8' }}>🏺 {STORY_ITEMS_CATALOG[quest.rewards.storyItemId]?.name}</span>
                )}
              </div>
            </div>
          ))}

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem', marginTop: '0.25rem' }}>
            <button
              onClick={() => {
                if (renewalsRemaining <= 0) return;
                AudioManager.getInstance().playClick();
                generateRunQuests();
              }}
              disabled={renewalsRemaining <= 0}
              className="btn btn-xs btn-secondary"
              style={{ fontSize: '0.65rem', padding: '0.45rem 0.9rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              🔄 Renovar Contratos
            </button>
            <span style={{ fontSize: '0.58rem', color: renewalsRemaining <= 0 ? '#f87171' : '#64748b' }}>
              {renewalsRemaining > 0
                ? `${renewalsRemaining}/${MAX_DAILY_CONTRACT_RENEWALS} renovações restantes hoje`
                : 'Limite diário de renovações atingido — volte amanhã'}
            </span>
          </div>
        </div>
      )}

      {/* Conteúdo da Sub-Aba: Artefatos de História */}
      {subTab === 'storyItems' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
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
                        <StoryItemIcon src={`/assets/${item.id}.png`} alt={item.name} />
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
