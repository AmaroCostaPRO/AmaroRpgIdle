import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { AudioManager } from '../../core/AudioManager';
import { ACADEMY_MAX_LEVEL, ACADEMY_UPGRADE_COST, ACADEMY_MAX_RESEARCH_LEVEL, RESEARCH_COST } from '../../core/citadelFormulas';

const RESEARCH_TYPES: { key: 'dmg' | 'hp' | 'speed'; levelField: 'researchDmgLevel' | 'researchHpLevel' | 'researchSpeedLevel'; label: string; description: string }[] = [
  { key: 'dmg', levelField: 'researchDmgLevel', label: 'Táticas de Combate Avançadas', description: '+1.5% Dano Geral por nível' },
  { key: 'hp', levelField: 'researchHpLevel', label: 'Condicionamento Físico Extremo', description: '+2% Vida Máxima por nível' },
  { key: 'speed', levelField: 'researchSpeedLevel', label: 'Exercícios de Agilidade', description: '+1% Velocidade de Ataque por nível' },
];

export const AcademyPanel: React.FC = () => {
  const character = useGameStore((state) => state.character);
  const buildOrUpgradeAcademy = useGameStore((state) => state.buildOrUpgradeAcademy);
  const upgradeAcademyResearch = useGameStore((state) => state.upgradeAcademyResearch);

  const citadel = character.citadel;
  const materials = character.materials || { wood: 0, stone: 0, meat: 0, studyInsignias: 0 };
  const academy = citadel?.academy || { level: 0, lastTick: 0, researchDmgLevel: 0, researchHpLevel: 0, researchSpeedLevel: 0 };
  const isBuilt = academy.level > 0;
  const nextLevel = academy.level + 1;
  const researchCap = ACADEMY_MAX_RESEARCH_LEVEL(academy.level);
  const cost = ACADEMY_UPGRADE_COST(nextLevel);
  const canAffordUpgrade = materials.wood >= cost.wood && materials.stone >= cost.stone && materials.studyInsignias >= cost.studyInsignias;

  const handleUpgrade = () => {
    AudioManager.getInstance().playClick();
    buildOrUpgradeAcademy();
  };

  return (
    <div className="panel" style={{ padding: '1.25rem', color: '#fff', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-dim)', paddingBottom: '0.75rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 className="section-title" style={{ border: 'none', paddingBottom: 0, margin: 0 }}>
            🎓 Academia Militar {isBuilt ? `— Nível ${academy.level}` : '(Não construída)'}
          </h2>
          <p style={{ fontSize: '0.68rem', color: '#94a3b8', margin: '0.2rem 0 0 0' }}>
            Consome Insígnias de Estudo em pesquisas permanentes, universais para todas as classes do save.
          </p>
        </div>
      </div>

      {academy.level < ACADEMY_MAX_LEVEL ? (
        <button
          onClick={handleUpgrade}
          disabled={!canAffordUpgrade}
          className="btn btn-gold"
          style={{ alignSelf: 'flex-start' }}
        >
          {isBuilt ? `Melhorar para Nível ${nextLevel}` : 'Construir Academia'} — 🪵 {cost.wood} / 🪨 {cost.stone} / 📜 {cost.studyInsignias}
        </button>
      ) : (
        <p style={{ color: 'var(--gold-300)', fontSize: '0.85rem' }}>Academia no nível máximo.</p>
      )}

      {isBuilt && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <h3 className="font-heading" style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gold-400)', borderBottom: '1px solid var(--border-dim)', paddingBottom: '0.25rem', margin: 0 }}>
            Pesquisas (limite atual: Nível {researchCap})
          </h3>
          {RESEARCH_TYPES.map(({ key, levelField, label, description }) => {
            const level = academy[levelField];
            const nextResearchLevel = level + 1;
            const researchCost = RESEARCH_COST(nextResearchLevel);
            const atCap = nextResearchLevel > researchCap;
            const canAfford = materials.studyInsignias >= researchCost;
            return (
              <div
                key={key}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--surface-2)',
                  gap: '0.75rem',
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.9rem', color: '#fff' }}>{label} — Nível {level}</div>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>{description}</div>
                </div>
                <button
                  onClick={() => { AudioManager.getInstance().playClick(); upgradeAcademyResearch(key); }}
                  disabled={atCap || !canAfford}
                  className="btn btn-sm btn-gold"
                  style={{ whiteSpace: 'nowrap' }}
                >
                  {atCap ? 'Limite da Academia' : `Pesquisar — 📜 ${researchCost}`}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
