import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { AudioManager } from '../../core/AudioManager';
import { FORGE_WORKSHOP_MAX_LEVEL, FORGE_WORKSHOP_UPGRADE_COST, FORGE_ORDER_GOLD_COST, FORGE_ORDER_WOOD_COST, FORGE_ORDER_FRAGMENT_YIELD } from '../../core/citadelFormulas';

export const ForgeWorkshopPanel: React.FC = () => {
  const character = useGameStore((state) => state.character);
  const buildOrUpgradeForgeWorkshop = useGameStore((state) => state.buildOrUpgradeForgeWorkshop);

  const citadel = character.citadel;
  const materials = character.materials || { wood: 0, stone: 0, meat: 0, studyInsignias: 0 };
  const forgeWorkshop = citadel?.forgeWorkshop || { level: 0, lastTick: 0 };
  const isBuilt = forgeWorkshop.level > 0;
  const isMasterForger = forgeWorkshop.level >= 5;
  const nextLevel = forgeWorkshop.level + 1;
  const cost = FORGE_WORKSHOP_UPGRADE_COST(nextLevel);
  const canAffordUpgrade = materials.wood >= cost.wood && materials.stone >= cost.stone && materials.studyInsignias >= cost.studyInsignias;

  const handleUpgrade = () => {
    AudioManager.getInstance().playClick();
    buildOrUpgradeForgeWorkshop();
  };

  return (
    <div className="panel" style={{ padding: '1.25rem', color: '#fff', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-dim)', paddingBottom: '0.75rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 className="section-title" style={{ border: 'none', paddingBottom: 0, margin: 0 }}>
            🛠️ Oficina de Automação da Forja {isBuilt ? `— Nível ${forgeWorkshop.level}` : '(Não construída)'}
          </h2>
          <p style={{ fontSize: '0.68rem', color: '#94a3b8', margin: '0.2rem 0 0 0' }}>
            Converte Ouro e Madeira excedentes em Fragmentos de Forja através de ordens de serviço automáticas.
          </p>
        </div>
      </div>

      {forgeWorkshop.level < FORGE_WORKSHOP_MAX_LEVEL ? (
        <button
          onClick={handleUpgrade}
          disabled={!canAffordUpgrade}
          className="btn btn-gold"
          style={{ alignSelf: 'flex-start' }}
        >
          {isBuilt ? `Melhorar para Nível ${nextLevel}` : 'Construir Oficina'} — 🪵 {cost.wood} / 🪨 {cost.stone} / 📜 {cost.studyInsignias}
        </button>
      ) : (
        <p style={{ color: 'var(--gold-300)', fontSize: '0.85rem' }}>Oficina no nível máximo — Mestre Forjador.</p>
      )}

      {isBuilt && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <p style={{ fontSize: '0.85rem' }}>
            Cada ordem de serviço (1h): consome 🪙 {FORGE_ORDER_GOLD_COST} + 🪵 {FORGE_ORDER_WOOD_COST}, produz +{FORGE_ORDER_FRAGMENT_YIELD} Fragmentos de Forja.
          </p>
          <p style={{ fontSize: '0.85rem' }}>Ordens paralelas por hora no nível atual: {forgeWorkshop.level}</p>
          {isMasterForger && (
            <p style={{ fontSize: '0.85rem', color: 'var(--gold-300)' }}>
              ⚙️ Desmonte Automatizado ativo: equipamentos Comuns e Raros "puros" dropados em combate são convertidos direto em Fragmentos de Forja, sem passar pelo inventário.
            </p>
          )}
        </div>
      )}
    </div>
  );
};
