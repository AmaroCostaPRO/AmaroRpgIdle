import React from 'react';
import type { DistrictId } from '../../core/types';
import { DISTRICT_NAMES, DISTRICT_ICONS, getSunkenBuildingAffordability } from '../../core/sunkenCitadelFormulas';
import { useGameStore } from '../../store/useGameStore';
import { SubTabBar } from '../nav/SubTabBar';

export type SunkenSubTab = DistrictId | 'echoes' | 'overview';

export const SUNKEN_SUB_TABS: { id: SunkenSubTab; label: string; icon: string }[] = [
  { id: 'overview', label: 'Visão Geral', icon: '🌊' },
  { id: 'dock', label: DISTRICT_NAMES.dock, icon: DISTRICT_ICONS.dock },
  { id: 'echoHall', label: DISTRICT_NAMES.echoHall, icon: DISTRICT_ICONS.echoHall },
  { id: 'forge', label: DISTRICT_NAMES.forge, icon: DISTRICT_ICONS.forge },
  { id: 'temple', label: DISTRICT_NAMES.temple, icon: DISTRICT_ICONS.temple },
  { id: 'archive', label: DISTRICT_NAMES.archive, icon: DISTRICT_ICONS.archive },
  { id: 'throne', label: DISTRICT_NAMES.throne, icon: DISTRICT_ICONS.throne },
  { id: 'echoes', label: 'Ecos', icon: '🎭' },
];

interface Props {
  subTab: SunkenSubTab;
  setSubTab: (t: SunkenSubTab) => void;
}

/**
 * Substitui inteiramente a barra de abas principal enquanto o jogador está na Cidadela Submersa —
 * mesma estrutura/classes visuais de `CitadelTabsBar.tsx` (setas no desktop, carrossel giratório no
 * mobile), navegando pelos distritos + aba de Ecos.
 */
export const SunkenCitadelTabsBar: React.FC<Props> = ({ subTab, setSubTab }) => {
  const character = useGameStore((state) => state.character);
  const districtAffordability = getSunkenBuildingAffordability(character);
  const hasDistrictNotification = (id: SunkenSubTab): boolean =>
    id !== 'overview' && id !== 'echoes' && !!districtAffordability[id as DistrictId];

  return (
    <SubTabBar
      tabs={SUNKEN_SUB_TABS}
      activeTab={subTab}
      setActiveTab={setSubTab}
      getNotification={hasDistrictNotification}
      desktopWindowSize={3}
      ellipsisLabels
    />
  );
};
