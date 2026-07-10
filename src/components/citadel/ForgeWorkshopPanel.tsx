import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { AudioManager } from '../../core/AudioManager';

const FORGE_WORKSHOP_MAX_LEVEL = 5;
const FORGE_ORDER_GOLD_COST = 200;
const FORGE_ORDER_WOOD_COST = 50;
const FORGE_ORDER_FRAGMENT_YIELD = 15;

export const ForgeWorkshopPanel: React.FC = () => {
  const character = useGameStore((state) => state.character);
  const buildOrUpgradeForgeWorkshop = useGameStore((state) => state.buildOrUpgradeForgeWorkshop);

  const citadel = character.citadel;
  const materials = character.materials || { wood: 0, stone: 0, meat: 0, studyInsignias: 0 };
  const forgeWorkshop = citadel?.forgeWorkshop || { level: 0, lastTick: 0 };
  const isBuilt = forgeWorkshop.level > 0;
  const isMasterForger = forgeWorkshop.level >= 5;
  const nextLevel = forgeWorkshop.level + 1;
  const cost = {
    wood: Math.round(600 * Math.pow(1.6, nextLevel - 1)),
    stone: Math.round(800 * Math.pow(1.6, nextLevel - 1)),
    studyInsignias: Math.round(150 * Math.pow(1.6, nextLevel - 1)),
  };
  const canAffordUpgrade = materials.wood >= cost.wood && materials.stone >= cost.stone && materials.studyInsignias >= cost.studyInsignias;

  const handleUpgrade = () => {
    AudioManager.getInstance().playClick();
    buildOrUpgradeForgeWorkshop();
  };

  return (
    <div className="panel" style={{ padding: '1.25rem', color: '#fff', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-dim)', paddingBottom: '0.75rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', color: 'var(--gold-300)' }}>
            🛠️ Oficina de Automação da Forja {isBuilt ? `— Nível ${forgeWorkshop.level}` : '(Não construída)'}
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', marginTop: '0.25rem' }}>
            Converte Ouro e Madeira excedentes em Fragmentos de Forja através de ordens de serviço automáticas.
          </p>
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', display: 'flex', gap: '1rem' }}>
          <span>🪙 {character.gold}</span>
          <span>🪵 {materials.wood}</span>
          <span>🪨 {materials.stone}</span>
          <span>📜 {materials.studyInsignias}</span>
        </div>
      </div>

      {forgeWorkshop.level < FORGE_WORKSHOP_MAX_LEVEL ? (
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
