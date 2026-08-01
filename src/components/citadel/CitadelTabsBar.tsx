import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { useRelicStore } from '../../store/useRelicStore';
import { getCitadelBuildingAffordability } from '../../core/citadelFormulas';
import { SubTabBar } from '../nav/SubTabBar';

export type CitadelSubTab = 'overview' | 'vault' | 'expeditions' | 'academy' | 'watchTower' | 'forgeWorkshop' | 'cosmicSiphon' | 'synchronyAltar' | 'relicLab' | 'alchemyLab' | 'huntSanctuary' | 'engravingChamber';

export const CITADEL_SUB_TABS: { id: CitadelSubTab; label: string; icon: string }[] = [
  { id: 'overview', label: 'Visão Geral', icon: '🌌' },
  { id: 'vault', label: 'Depósito', icon: '📦' },
  { id: 'expeditions', label: 'Expedições', icon: '🎖️' },
  { id: 'academy', label: 'Academia', icon: '🎓' },
  { id: 'watchTower', label: 'Torre de Vigia', icon: '🗼' },
  { id: 'forgeWorkshop', label: 'Oficina', icon: '🛠️' },
  { id: 'cosmicSiphon', label: 'Sifão Cósmico', icon: '🌫️' },
  { id: 'synchronyAltar', label: 'Altar', icon: '🔯' },
  { id: 'relicLab', label: 'Laboratório', icon: '🧪' },
  { id: 'alchemyLab', label: 'Alquimia', icon: '⚗️' },
  { id: 'huntSanctuary', label: 'Santuário', icon: '📜' },
  { id: 'engravingChamber', label: 'Gravação', icon: '🪬' },
];

interface Props {
  subTab: CitadelSubTab;
  setSubTab: (t: CitadelSubTab) => void;
}

/**
 * Substitui inteiramente a barra de abas principal enquanto o jogador está na
 * Cidadela — mesma estrutura/classes visuais (setas no desktop, carrossel
 * giratório no mobile) só que navegando pelas sub-áreas da Cidadela.
 */
export const CitadelTabsBar: React.FC<Props> = ({ subTab, setSubTab }) => {
  const character = useGameStore((state) => state.character);
  const unstableSoulFragments = useRelicStore((state) => state.unstableSoulFragments);
  const buildingAffordability = getCitadelBuildingAffordability(character, unstableSoulFragments);
  const hasBuildingNotification = (id: CitadelSubTab): boolean =>
    id !== 'overview' && !!buildingAffordability[id as keyof typeof buildingAffordability];

  return (
    <SubTabBar
      tabs={CITADEL_SUB_TABS}
      activeTab={subTab}
      setActiveTab={setSubTab}
      getNotification={hasBuildingNotification}
      desktopWindowSize={4}
    />
  );
};
