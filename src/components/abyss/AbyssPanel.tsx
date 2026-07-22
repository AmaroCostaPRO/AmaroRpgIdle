import React, { useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { useDiveStore } from '../../store/useDiveStore';
import { AudioManager } from '../../core/AudioManager';
import {
  GUARDIAN_DEPTH, isFullDepthsUnlocked, getDiveKeyCost,
  CHECKPOINT_START_DEPTHS, ZONE_INFO, getZoneForDepth,
} from '../../core/abyssFormulas';
import { DIVE_SUIT_MAX_LEVEL, getDiveSuitUpgradeCost } from '../../core/sunkenCitadelFormulas';
import { CoastalPanel } from './CoastalPanel';
import { SubmersaPanel } from './SubmersaPanel';

/**
 * v10.0.0 "A Cidadela Submersa" — aba de topo 🌊 Abismo.
 *
 * Decisão estrutural (Anexo 3, §2.1): a expansão inteira vive em UMA aba nova com sub-abas
 * internas (o carrossel mobile já carrega 13+ abas), seguindo o precedente de Opções e
 * Transcendência. Sub-abas travadas aparecem com cadeado + requisito textual (padrão do 3º
 * botão de ramificação da Torre).
 *
 *   🎣 Litoral      — visível ao completar a Fase 2 (a própria aba 🌊 só existe com ele)
 *   🤿 Mergulhos    — requer 1ª Ascensão + 1 Chave de Mergulho (conteúdo na Etapa 6)
 *   🔱 Cidadela     — chega na 10.2.0
 */
export const AbyssPanel: React.FC = () => {
  const character = useGameStore((state) => state.character);
  const diveActive = useDiveStore((state) => state.diveActive);
  const lastDiveSummary = useDiveStore((state) => state.lastDiveSummary);
  const startDive = useDiveStore((state) => state.startDive);
  const [subTab, setSubTab] = useState<'coastal' | 'depths' | 'citadel'>('coastal');
  const upgradeDivingSuit = useGameStore((state) => state.upgradeDivingSuit);

  const depthsUnlocked = (character.ascensionCount || 0) >= 1;
  const diveKeys = character.diveKeys || 0;
  const historicalMaxDepth = character.abyss?.historicalMaxDepth || 0;
  const fullDepths = isFullDepthsUnlocked(character.highestStageReached || 1);
  const guardiansDefeated = character.abyss?.guardiansDefeated || {};
  const citadelUnlocked = historicalMaxDepth >= 51;
  const divingSuitLevel = character.abyss?.divingSuitLevel || 0;
  const dockRestored = (character.sunkenCitadel?.districts.dock?.restorationLevel || 0) >= 1;

  const [suitToast, setSuitToast] = useState<string | null>(null);
  const handleUpgradeSuit = () => {
    AudioManager.getInstance().playClick();
    const res = upgradeDivingSuit();
    if (res.success) AudioManager.getInstance().playUpgrade();
    setSuitToast(res.message);
    window.setTimeout(() => setSuitToast(null), 3500);
  };

  // Checkpoints liberados (26/51/81) — sempre inclui a profundidade 1.
  const [startDepth, setStartDepth] = useState(1);
  const availableStartDepths = CHECKPOINT_START_DEPTHS.filter((d, i) => i === 0 || guardiansDefeated[i as 1 | 2 | 3]);

  // O GameUI escuta DIVE_STARTED (emitido por startDive) e troca sozinho para a aba de combate.
  const handleStartDive = () => {
    AudioManager.getInstance().playClick();
    startDive(startDepth);
  };
  const keyCost = getDiveKeyCost(startDepth);

  const subTabButton = (
    id: 'coastal' | 'depths' | 'citadel',
    icon: string,
    label: string,
    locked: boolean,
    lockedHint: string
  ) => (
    <button
      key={id}
      onClick={() => setSubTab(id)}
      className="btn"
      style={{
        flex: 1,
        padding: '0.6rem 0.5rem',
        background: subTab === id ? 'linear-gradient(135deg, rgba(14, 116, 144, 0.55), rgba(8, 51, 68, 0.75))' : 'var(--surface-2, rgba(255,255,255,0.05))',
        border: subTab === id ? '1px solid rgba(34, 211, 238, 0.5)' : '1px solid var(--border-dim, rgba(255,255,255,0.1))',
        borderRadius: 'var(--radius-md, 8px)',
        color: '#fff',
        opacity: locked ? 0.6 : 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.15rem',
      }}
      title={locked ? lockedHint : undefined}
    >
      <span style={{ fontSize: '1.1rem' }}>{locked ? '🔒' : icon}</span>
      <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{label}</span>
      {locked && <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.5)' }}>{lockedHint}</span>}
    </button>
  );

  return (
    <div className="panel" style={{ padding: '1rem', color: '#fff', pointerEvents: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        {subTabButton('coastal', '🎣', 'Litoral', false, '')}
        {subTabButton('depths', '🤿', fullDepths ? 'Profundezas' : 'Mergulhos Rasos', !depthsUnlocked, 'Requer 1 Ascensão')}
        {subTabButton('citadel', '🔱', 'Cidadela', !citadelUnlocked, 'Requer Zona 3 (prof. 51+)')}
      </div>

      {subTab === 'coastal' && <CoastalPanel />}

      {subTab === 'citadel' && (
        citadelUnlocked ? <SubmersaPanel /> : (
          <div style={{ padding: '1.25rem', border: '1px dashed rgba(255,255,255,0.2)', borderRadius: 'var(--radius-md, 8px)', textAlign: 'center' }}>
            <p style={{ fontSize: '1.5rem' }}>🔒</p>
            <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
              A Cidadela Submersa só emerge após alcançar a <strong>Zona 3</strong> das Profundezas (prof. 51+).
            </p>
          </div>
        )
      )}

      {subTab === 'depths' && (
        depthsUnlocked ? (
          <div style={{ padding: '1.25rem', border: '1px solid rgba(34, 211, 238, 0.35)', borderRadius: 'var(--radius-md, 8px)', display: 'flex', flexDirection: 'column', gap: '0.7rem', background: 'rgba(2, 20, 34, 0.5)' }}>
            <p style={{ fontSize: '0.95rem', fontWeight: 700 }}>
              {fullDepths ? '🤿 As Profundezas — 4 Zonas' : '🤿 Mergulhos Rasos — Recife Partido (Zona 1)'}
            </p>
            <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.65)' }}>
              Descida vertical push-your-luck com o <strong>Fôlego</strong> como relógio da sessão. Vença cada profundidade
              para acumular 🦪 Pérolas, 🪸 Coral e 📜 Runas — e decida nos Bolsões de Ar (a cada 5 profundidades) entre
              respirar, saquear ou <strong>subir e bancar tudo</strong>.
              {fullDepths
                ? ' Você alcançou a Fase 50: a Pressão das profundezas está ativa e as Zonas 2–4 (Bosque de Algas Negras, Ruínas da Cidadela, Fossa do Caco) se abrem além do Recife.'
                : ` Na prof. ${GUARDIAN_DEPTH}, o 👑 Guardião do Recife espera (1ª morte: Runa Primordial 🜲 Thal). Alcance a Fase 50 para destravar As Profundezas completas.`}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem 1.2rem', fontSize: '0.8rem' }}>
              <span>🤿 Chaves de Mergulho: <strong>{diveKeys}</strong></span>
              <span>📊 Recorde: <strong>Prof. {historicalMaxDepth}</strong></span>
            </div>

            {fullDepths && (
              <div style={{ border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', padding: '0.6rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <p style={{ fontSize: '0.8rem', fontWeight: 700 }}>🤿 Traje de Mergulho — Nível {divingSuitLevel}/{DIVE_SUIT_MAX_LEVEL}</p>
                {dockRestored ? (
                  divingSuitLevel < DIVE_SUIT_MAX_LEVEL ? (
                    <button onClick={handleUpgradeSuit} className="btn" style={{ fontSize: '0.72rem', alignSelf: 'flex-start' }}>
                      Melhorar — 🦪 {getDiveSuitUpgradeCost(divingSuitLevel + 1).pearls} + 🪸 {getDiveSuitUpgradeCost(divingSuitLevel + 1).coral}
                    </button>
                  ) : (
                    <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.45)' }}>Traje no nível máximo.</span>
                  )
                ) : (
                  <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.45)' }}>
                    Requer ⚓ Doca Batial drenada e restaurada — veja a sub-aba 🔱 Cidadela.
                  </span>
                )}
                {suitToast && <span style={{ fontSize: '0.7rem', color: '#a5f3fc' }}>{suitToast}</span>}
              </div>
            )}
            {lastDiveSummary && (
              <p style={{ fontSize: '0.72rem', color: '#a5f3fc' }}>Última descida: {lastDiveSummary}</p>
            )}
            {availableStartDepths.length > 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)' }}>Ponto de partida (checkpoints liberados pelos Guardiões vencidos):</p>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {availableStartDepths.map((d) => (
                    <button
                      key={d}
                      onClick={() => setStartDepth(d)}
                      className="btn"
                      style={{
                        fontSize: '0.7rem', padding: '0.35rem 0.6rem',
                        border: startDepth === d ? `1px solid ${ZONE_INFO[getZoneForDepth(d)].color}` : '1px solid rgba(255,255,255,0.15)',
                        background: startDepth === d ? 'rgba(14, 116, 144, 0.35)' : 'transparent',
                      }}
                    >
                      {ZONE_INFO[getZoneForDepth(d)].name} (Prof. {d}) — {getDiveKeyCost(d)} 🤿
                    </button>
                  ))}
                </div>
              </div>
            )}
            <button
              onClick={handleStartDive}
              disabled={diveActive || diveKeys < keyCost}
              className="btn btn-gold"
              style={{ alignSelf: 'flex-start', opacity: diveActive || diveKeys < keyCost ? 0.5 : 1 }}
            >
              {diveActive ? '🤿 Mergulho em andamento...' : `🤿 INICIAR MERGULHO (${keyCost} Chave${keyCost > 1 ? 's' : ''})`}
            </button>
            {diveKeys < keyCost && !diveActive && (
              <p style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.45)' }}>
                Sem chaves suficientes: junte 5 🗝️ Fragmentos de Batisfera na pesca do Litoral para montar uma Chave de Mergulho.
              </p>
            )}
            <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)' }}>
              Morte "limpa": mantém 75% do acumulado · Morte afogada (Fôlego 0): mantém 50% · Subir num Bolsão: 100%.
            </p>
          </div>
        ) : (
          <div style={{ padding: '1.25rem', border: '1px dashed rgba(255,255,255,0.2)', borderRadius: 'var(--radius-md, 8px)', textAlign: 'center' }}>
            <p style={{ fontSize: '1.5rem' }}>🔒</p>
            <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
              O mar fundo exige experiência: complete sua <strong>1ª Ascensão</strong> para destravar os Mergulhos Rasos.
            </p>
          </div>
        )
      )}
    </div>
  );
};
