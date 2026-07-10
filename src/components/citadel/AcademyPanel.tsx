import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { AudioManager } from '../../core/AudioManager';

const ACADEMY_MAX_LEVEL = 5;

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
  const researchCap = academy.level * 5;
  const cost = {
    wood: Math.round(200 * Math.pow(1.6, nextLevel - 1)),
    stone: Math.round(300 * Math.pow(1.6, nextLevel - 1)),
    studyInsignias: Math.round(50 * Math.pow(1.6, nextLevel - 1)),
  };
  const canAffordUpgrade = materials.wood >= cost.wood && materials.stone >= cost.stone && materials.studyInsignias >= cost.studyInsignias;

  const handleUpgrade = () => {
    AudioManager.getInstance().playClick();
    buildOrUpgradeAcademy();
  };

  return (
    <div className="panel" style={{ padding: '1.25rem', color: '#fff', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-dim)', paddingBottom: '0.75rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', color: 'var(--gold-300)' }}>
            🎓 Academia Militar {isBuilt ? `— Nível ${academy.level}` : '(Não construída)'}
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', marginTop: '0.25rem' }}>
            Consome Insígnias de Estudo em pesquisas permanentes, universais para todas as classes do save.
          </p>
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', display: 'flex', gap: '1rem' }}>
          <span>🪵 {materials.wood}</span>
          <span>🪨 {materials.stone}</span>
          <span>📜 {materials.studyInsignias}</span>
        </div>
      </div>

      {academy.level < ACADEMY_MAX_LEVEL ? (
        <button
          onClick={handleUpgrade}
          disabled={!canAffordUpgrade}
          style={{
            alignSelf: 'flex-start',
            padding: '0.6rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-accent)',
            background: 'var(--surface-3)',
            color: 'var(--gold-300)',
            cursor: canAffordUpgrade ? 'pointer' : 'not-allowed',
            opacity: canAffordUpgrade ? 1 : 0.5,
          }}
        >
          {isBuilt ? `Melhorar para Nível ${nextLevel}` : 'Construir Academia'} — 🪵 {cost.wood} / 🪨 {cost.stone} / 📜 {cost.studyInsignias}
        </button>
      ) : (
        <p style={{ color: 'var(--gold-300)', fontSize: '0.85rem' }}>Academia no nível máximo.</p>
      )}

      {isBuilt && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <h3 style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.8)' }}>
            Pesquisas (limite atual: Nível {researchCap})
          </h3>
          {RESEARCH_TYPES.map(({ key, levelField, label, description }) => {
            const level = academy[levelField];
            const nextResearchLevel = level + 1;
            const researchCost = 20 * nextResearchLevel;
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
                  style={{
                    padding: '0.4rem 0.9rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-accent)',
                    background: 'var(--surface-3)',
                    color: 'var(--gold-300)',
                    cursor: atCap || !canAfford ? 'not-allowed' : 'pointer',
                    opacity: atCap || !canAfford ? 0.5 : 1,
                    fontSize: '0.8rem',
                  }}
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
