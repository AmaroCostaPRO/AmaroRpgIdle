import type { DistrictId } from '../../core/types';

// Paralelo a `citadelBuildingSprites.ts` — as artes ainda não existem (ficam para depois, por
// conta do usuário), mas `EvolutionSprite` já cai no ícone de fallback automaticamente enquanto
// isso, então declarar os caminhos aqui já deixa tudo pronto para quando os arquivos chegarem.
export const SUNKEN_BUILDING_SPRITE_SRC: Record<DistrictId, string> = {
  dock: '/assets/submersa_doca_batial.png',
  echoHall: '/assets/submersa_salao_ecos.png',
  forge: '/assets/submersa_forja_encharcada.png',
  archive: '/assets/submersa_arquivo.png',
  temple: '/assets/submersa_templo_mare.png',
  throne: '/assets/submersa_trono.png',
};
