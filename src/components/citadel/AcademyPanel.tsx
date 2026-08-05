import React, { useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { AudioManager } from '../../core/AudioManager';
import { ACADEMY_MAX_LEVEL, ACADEMY_UPGRADE_COST, ACADEMY_MAX_RESEARCH_LEVEL, RESEARCH_COST, ResearchKey, getResearchTotalBonusLabel } from '../../core/citadelFormulas';
import { useCountdown } from '../../hooks/useCountdown';
import { CitadelBuildingPanel } from './shared/CitadelBuildingPanel';
import { CitadelProgressCard, CitadelListCard } from './shared/CitadelUI';

type ResearchLevelField =
  | 'researchDmgLevel' | 'researchHpLevel' | 'researchSpeedLevel'
  | 'researchTouchDmgLevel' | 'researchCritDmgLevel'
  | 'researchTowerKeyLevel' | 'researchSoulFragmentLevel';

const RESEARCH_TYPES: { key: ResearchKey; levelField: ResearchLevelField; label: string; description: string }[] = [
  { key: 'dmg', levelField: 'researchDmgLevel', label: 'Táticas de Combate Avançadas', description: '+1.5% Dano Geral por nível' },
  { key: 'hp', levelField: 'researchHpLevel', label: 'Condicionamento Físico Extremo', description: '+2% Vida Máxima por nível' },
  { key: 'speed', levelField: 'researchSpeedLevel', label: 'Exercícios de Agilidade', description: '+1% Velocidade de Ataque por nível' },
  { key: 'touchDmg', levelField: 'researchTouchDmgLevel', label: 'Precisão de Toque', description: '+2% Dano de Toque (clique/tap e Robô Assistente) por nível' },
  { key: 'critDmg', levelField: 'researchCritDmgLevel', label: 'Fúria Crítica', description: '+2 pontos de Dano Crítico Geral por nível — vale para Toque, ataque básico e habilidades' },
  { key: 'towerKey', levelField: 'researchTowerKeyLevel', label: 'Cartografia da Torre', description: '+2% na chance de drop de Chave da Torre por nível' },
  { key: 'soulFragment', levelField: 'researchSoulFragmentLevel', label: 'Ressonância de Almas', description: '+2% na chance de drop de Fragmento de Alma Instável por nível' },
];

export const AcademyPanel: React.FC = () => {
  const character = useGameStore((state) => state.character);
  const buildOrUpgradeAcademy = useGameStore((state) => state.buildOrUpgradeAcademy);
  const upgradeAcademyResearch = useGameStore((state) => state.upgradeAcademyResearch);

  const citadel = character.citadel;
  const materials = character.materials || { wood: 0, stone: 0, meat: 0, studyInsignias: 0 };
  const academy = citadel?.academy || {
    level: 0, lastTick: 0,
    researchDmgLevel: 0, researchHpLevel: 0, researchSpeedLevel: 0,
    researchTouchDmgLevel: 0, researchCritDmgLevel: 0,
    researchTowerKeyLevel: 0, researchSoulFragmentLevel: 0,
  };
  const isBuilt = academy.level > 0;
  const nextLevel = academy.level + 1;
  const researchCap = ACADEMY_MAX_RESEARCH_LEVEL(academy.level);
  const cost = ACADEMY_UPGRADE_COST(nextLevel);
  const canAffordUpgrade = materials.wood >= cost.wood && materials.stone >= cost.stone && materials.studyInsignias >= cost.studyInsignias;
  const commandCenterLevel = citadel?.commandCenter.level || 1;
  const lockedByCommandCenter = nextLevel > commandCenterLevel;
  const upgrading = academy.upgradeInProgress;
  const countdown = useCountdown(upgrading?.completesAt);

  const activeResearch = academy.researchInProgress;
  const researchCountdown = useCountdown(activeResearch?.completesAt);
  const activeResearchType = activeResearch
    ? RESEARCH_TYPES.find((r) => r.key === activeResearch.key)
    : null;

  const handleUpgrade = () => {
    AudioManager.getInstance().playClick();
    buildOrUpgradeAcademy();
  };

  const [confirmResearchKey, setConfirmResearchKey] = useState<ResearchKey | null>(null);
  const handleResearch = (key: ResearchKey) => {
    if (confirmResearchKey !== key) {
      setConfirmResearchKey(key);
      setTimeout(() => setConfirmResearchKey(current => current === key ? null : current), 3000);
      return;
    }
    setConfirmResearchKey(null);
    AudioManager.getInstance().playClick();
    upgradeAcademyResearch(key);
  };

  return (
    <CitadelBuildingPanel
      icon="🎓"
      title="Academia Militar"
      subtitle="Consome Insígnias de Estudo em pesquisas permanentes, universais para todas as classes do save."
      isBuilt={isBuilt}
      level={academy.level}
      maxLevel={ACADEMY_MAX_LEVEL}
      nextLevel={nextLevel}
      notBuiltLabel="(Não construída)"
      buildLabel="Construir Academia"
      costDisplay={<>🪵 {cost.wood} / 🪨 {cost.stone} / 📜 {cost.studyInsignias}</>}
      maxLevelLabel="Academia no nível máximo."
      upgrading={upgrading}
      countdown={countdown}
      canAffordUpgrade={canAffordUpgrade}
      lockedByCommandCenter={lockedByCommandCenter}
      onUpgrade={handleUpgrade}
    >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {activeResearch && activeResearchType && (
            <CitadelProgressCard
              icon="🔬"
              title={<>Pesquisa em Andamento: <span style={{ color: '#fff' }}>{activeResearchType.label} (Nível {activeResearch.targetLevel})</span></>}
              countdown={researchCountdown || 'Concluindo...'}
              progressPct={Math.min(100, Math.max(0, ((Date.now() - activeResearch.startedAt) / (activeResearch.completesAt - activeResearch.startedAt)) * 100))}
            />
          )}

          <h3 className="font-heading" style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gold-400)', borderBottom: '1px solid var(--border-dim)', paddingBottom: '0.25rem', margin: 0 }}>
            Pesquisas (limite atual: Nível {researchCap})
          </h3>
          {RESEARCH_TYPES.map(({ key, levelField, label, description }) => {
            const level = academy[levelField] || 0;
            const nextResearchLevel = level + 1;
            const researchCost = RESEARCH_COST(nextResearchLevel);
            const atCap = nextResearchLevel > researchCap;
            const canAfford = materials.studyInsignias >= researchCost;
            const isThisResearching = activeResearch?.key === key;
            const isAnyResearching = !!activeResearch;

            let buttonText = `Pesquisar — 📜 ${researchCost}`;
            if (atCap) {
              buttonText = 'Limite da Academia';
            } else if (isThisResearching) {
              buttonText = `Em Pesquisa (${researchCountdown || 'Concluindo...'})`;
            } else if (isAnyResearching) {
              buttonText = 'Pesquisa em Andamento';
            } else if (confirmResearchKey === key) {
              buttonText = 'Confirmar?';
            }

            return (
              <CitadelListCard
                key={key}
                icon="🔬"
                title={`${label} — Nível ${level}`}
                description={description}
                highlighted={isThisResearching}
                badge={level > 0 && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--gold-300)', whiteSpace: 'nowrap' }}>
                    {getResearchTotalBonusLabel(key, level)}
                  </span>
                )}
                action={
                  <button
                    onClick={() => handleResearch(key)}
                    disabled={atCap || !canAfford || isAnyResearching}
                    className="btn btn-sm btn-gold"
                    style={{
                      whiteSpace: 'nowrap',
                      background: confirmResearchKey === key ? 'linear-gradient(to right, #10b981, #059669)' : undefined,
                      borderColor: confirmResearchKey === key ? '#10b981' : undefined,
                      color: confirmResearchKey === key ? '#fff' : undefined,
                    }}
                  >
                    {buttonText}
                  </button>
                }
              />
            );
          })}
        </div>
    </CitadelBuildingPanel>
  );
};
