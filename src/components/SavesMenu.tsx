import React, { useState, useEffect, useRef } from 'react';
import { useGameStore, CLASS_CONFIGS } from '../store/useGameStore';
import { Character } from '../core/types';
import { AudioManager } from '../core/AudioManager';

interface SavesMenuProps {
  isInGame?: boolean;
  onBackToCombat?: () => void;
}

interface SlotData {
  slotIndex: number;
  character: Character | null;
}

export const SavesMenu: React.FC<SavesMenuProps> = ({ isInGame = false, onBackToCombat }) => {
  const setScreen = useGameStore((state) => state.setScreen);
  const currentSlot = useGameStore((state) => state.currentSlot);
  const setCurrentSlot = useGameStore((state) => state.setCurrentSlot);
  const loadGameFromSlot = useGameStore((state) => state.loadGameFromSlot);
  const saveGameToSlot = useGameStore((state) => state.saveGameToSlot);
  const deleteSlot = useGameStore((state) => state.deleteSlot);
  const importSave = useGameStore((state) => state.importSave);
  const exportSave = useGameStore((state) => state.exportSave);

  const [slots, setSlots] = useState<SlotData[]>([]);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | '' }>({ text: '', type: '' });
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const importTargetSlot = useRef<number | null>(null);

  // Carrega as informações dos slots ao montar o componente
  const loadSlotsInfo = () => {
    const slotsInfo: SlotData[] = [];
    for (let i = 1; i <= 12; i++) {
      try {
        const saved = localStorage.getItem(`medieval_idle_save_slot_${i}`);
        if (saved) {
          slotsInfo.push({
            slotIndex: i,
            character: JSON.parse(saved) as Character,
          });
        } else {
          slotsInfo.push({
            slotIndex: i,
            character: null,
          });
        }
      } catch (e) {
        slotsInfo.push({
          slotIndex: i,
          character: null,
        });
      }
    }
    setSlots(slotsInfo);
  };

  useEffect(() => {
    loadSlotsInfo();
  }, []);

  const playClick = () => {
    AudioManager.getInstance().playClick();
  };

  const handleLoad = (slotIndex: number) => {
    playClick();
    if (isInGame) {
      if (confirm(`Tem certeza que deseja carregar o Save do Slot ${slotIndex}? Seu progresso atual não salvo neste slot será perdido.`)) {
        // Mapeamos para a tela de menu para desmontar o Phaser de forma segura
        setScreen('menu');
        setTimeout(() => {
          const success = loadGameFromSlot(slotIndex);
          if (success) {
            setScreen('playing');
            if (onBackToCombat) onBackToCombat();
          } else {
            showFeedback('Erro ao carregar o save do slot.', 'error');
            setScreen('playing');
          }
        }, 100);
      }
    } else {
      const success = loadGameFromSlot(slotIndex);
      if (success) {
        setScreen('playing');
      } else {
        showFeedback('Erro ao carregar o save do slot.', 'error');
      }
    }
  };

  const handleNewGame = (slotIndex: number) => {
    playClick();
    setCurrentSlot(slotIndex);
    setScreen('character_select');
  };

  const handleDelete = (slotIndex: number) => {
    playClick();
    if (confirm(`Tem certeza que deseja deletar o Save do Slot ${slotIndex}? Seu progresso será apagado permanentemente.`)) {
      deleteSlot(slotIndex);
      loadSlotsInfo();
      showFeedback(`Save do Slot ${slotIndex} deletado com sucesso.`, 'success');
    }
  };

  const handleExport = (slotIndex: number) => {
    playClick();
    const encoded = exportSave(slotIndex);
    if (!encoded) {
      showFeedback('Erro ao exportar o save.', 'error');
      return;
    }
    const char = slots.find((s) => s.slotIndex === slotIndex)?.character;
    const classPart = char ? (CLASS_CONFIGS[char.classId]?.name || char.classId).toLowerCase().replace(/\s+/g, '-') : 'save';
    const datePart = new Date().toISOString().slice(0, 10);
    const filename = `amaro-rpg-idle_slot${slotIndex}_${classPart}_${datePart}.sav`;

    const blob = new Blob([encoded], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showFeedback(`Save do Slot ${slotIndex} baixado como "${filename}"!`, 'success');
  };

  const handleImportClick = (slotIndex: number) => {
    playClick();
    importTargetSlot.current = slotIndex;
    fileInputRef.current?.click();
  };

  const handleImportFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const slotIndex = importTargetSlot.current;
    e.target.value = ''; // permite selecionar o mesmo arquivo de novo em uma próxima tentativa
    if (!file || slotIndex === null) return;

    const reader = new FileReader();
    reader.onload = () => {
      const content = typeof reader.result === 'string' ? reader.result.trim() : '';
      if (!content) {
        showFeedback('Arquivo de save vazio ou ilegível.', 'error');
        return;
      }
      const success = importSave(slotIndex, content);
      if (success) {
        loadSlotsInfo();
        showFeedback(`Save importado com sucesso no Slot ${slotIndex}!`, 'success');
      } else {
        showFeedback('Arquivo de save inválido ou corrompido.', 'error');
      }
    };
    reader.onerror = () => {
      showFeedback('Erro ao ler o arquivo de save.', 'error');
    };
    reader.readAsText(file);
  };

  const showFeedback = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => {
      setMessage({ text: '', type: '' });
    }, 4000);
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return 'Sem data';
    try {
      const date = new Date(isoString);
      return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Data inválida';
    }
  };

  const classIcons: Record<string, string> = {
    warrior: '⚔',
    mage: '🔮',
    ranger: '🏹',
    paladin: '🛡',
    cleric: '✝',
    rogue: '🗡',
  };

  return (
    <div className={`panel ${isInGame ? '' : 'animate-slideUp'}`} style={{ padding: isInGame ? '1.5rem 1rem' : '2.5rem 1.5rem', minHeight: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', overflow: 'hidden', position: 'relative', width: '100%', boxSizing: 'border-box' }}>
      {/* Input de arquivo oculto e compartilhado — acionado via handleImportClick para cada slot */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".sav,.txt,text/plain,application/octet-stream"
        onChange={handleImportFileSelected}
        style={{ display: 'none' }}
      />

      {/* Glow de fundo */}
      {!isInGame && (
        <>
          <div style={{ position: 'absolute', top: '-10rem', left: '-10rem', width: '24rem', height: '24rem', background: 'rgba(139, 92, 246, 0.05)', borderRadius: '50%', filter: 'blur(100px)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '-10rem', right: '-10rem', width: '24rem', height: '24rem', background: 'rgba(245, 158, 11, 0.04)', borderRadius: '50%', filter: 'blur(100px)', pointerEvents: 'none' }} />
        </>
      )}

      <h2 className="font-display" style={{ fontSize: isInGame ? '1.1rem' : '1.3rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold-400)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
        💾 Slots de Salvamento
      </h2>
      <div className="ornament" style={{ marginBottom: '1.5rem', flexShrink: 0 }} />

      {/* Painel informativo de salvamento em tempo de jogo */}
      {isInGame && (
        <div 
          className="panel"
          style={{
            width: '100%',
            maxWidth: '42rem',
            background: 'rgba(245, 158, 11, 0.03)',
            border: '1px solid rgba(245, 158, 11, 0.15)',
            borderRadius: 'var(--radius-lg)',
            padding: '1rem 1.25rem',
            marginBottom: '1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            zIndex: 10,
            flexShrink: 0
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', textAlign: 'left' }}>
            <span className="font-heading" style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gold-400)' }}>
              Slot Atual: {currentSlot ? `Slot ${currentSlot}` : 'Temporário/Sem Slot'}
            </span>
            <span style={{ fontSize: '0.6rem', color: '#94a3b8' }}>
              O jogo salva automaticamente, mas você pode forçar um salvamento manual aqui.
            </span>
          </div>
          <button 
            disabled={!currentSlot}
            onClick={() => {
              playClick();
              if (currentSlot) {
                saveGameToSlot(currentSlot);
                loadSlotsInfo();
                showFeedback('Jogo salvo com sucesso no slot atual!', 'success');
              } else {
                showFeedback('Você precisa selecionar um slot para salvar manualmente.', 'error');
              }
            }}
            className="btn btn-gold"
            style={{ padding: '0.5rem 1rem', fontSize: '0.65rem', opacity: currentSlot ? 1 : 0.5, cursor: currentSlot ? 'pointer' : 'not-allowed' }}
          >
            💾 Salvar Agora
          </button>
        </div>
      )}

      {/* Mensagem de Feedback */}
      {message.text && (
        <div 
          className="animate-tabFade"
          style={{ 
            width: '100%', 
            maxWidth: '32rem', 
            padding: '0.75rem 1rem', 
            borderRadius: 'var(--radius-md)', 
            marginBottom: '1rem',
            textAlign: 'center',
            fontSize: '0.7rem',
            fontWeight: 600,
            background: message.type === 'success' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
            color: message.type === 'success' ? '#34d399' : '#f87171',
            border: message.type === 'success' ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(239, 68, 68, 0.25)',
            zIndex: 10
          }}
        >
          {message.text}
        </div>
      )}

      {/* Grid de Slots */}
      <div className={isInGame ? "saves-grid-ingame" : "saves-grid"}>
        {slots.map((slot) => {
          const char = slot.character;
          const isActive = currentSlot === slot.slotIndex;

          return (
            <div 
              key={slot.slotIndex} 
              className={`panel ${isActive ? 'selected' : ''}`}
              style={{ 
                padding: '1.25rem', 
                background: isActive ? 'rgba(245, 158, 11, 0.05)' : 'rgba(29, 31, 31, 0.85)',
                border: isActive ? '1px solid var(--gold-400)' : '1px solid var(--border-dim)',
                borderRadius: 'var(--radius-lg)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                boxShadow: isActive ? '0 0 15px rgba(245, 158, 11, 0.1)' : 'var(--shadow-md)',
                position: 'relative'
              }}
            >
              {/* Cabeçalho do Slot */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="font-heading" style={{ fontSize: '0.72rem', fontWeight: 700, color: isActive ? 'var(--gold-400)' : '#94a3b8' }}>
                  SLOT {slot.slotIndex} {isActive && '• ATIVO'}
                </span>
                {char && (
                  <span style={{ fontSize: '0.6rem', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
                    {formatDate(char.lastSaved)}
                  </span>
                )}
              </div>

              {/* Informações do Personagem */}
              {char ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.3rem' }}>
                      {classIcons[char.classId] || '⚔'}
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                      <span className="font-heading" style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>
                        {CLASS_CONFIGS[char.classId]?.name || char.classId}
                      </span>
                      <span className="font-mono" style={{ fontSize: '0.62rem', color: '#94a3b8' }}>
                        Nível {char.level} • Fase {char.currentStage}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '3rem', border: '1px dashed rgba(255,255,255,0.06)', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ fontSize: '0.65rem', color: '#64748b', fontStyle: 'italic' }}>
                    Sem Progresso Salvo
                  </span>
                </div>
              )}

              {/* Botões do Slot */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: 'auto' }}>
                {char ? (
                  <>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        onClick={() => handleLoad(slot.slotIndex)} 
                        className={`btn ${isActive ? 'btn-gold' : 'btn-emerald'}`}
                        style={{ flex: 2, padding: '0.45rem', fontSize: '0.62rem' }}
                      >
                        ⚔ Carregar
                      </button>
                      <button 
                        onClick={() => handleDelete(slot.slotIndex)} 
                        className="btn btn-danger"
                        style={{ flex: 1, padding: '0.45rem', fontSize: '0.62rem' }}
                        title="Deletar Save"
                      >
                        🗑
                      </button>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        onClick={() => handleExport(slot.slotIndex)} 
                        className="btn btn-ghost" 
                        style={{ flex: 1, padding: '0.4rem', fontSize: '0.6rem' }}
                      >
                        📤 Exportar
                      </button>
                      <button
                        onClick={() => handleImportClick(slot.slotIndex)}
                        className="btn btn-ghost"
                        style={{ flex: 1, padding: '0.4rem', fontSize: '0.6rem' }}
                      >
                        📥 Importar
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleNewGame(slot.slotIndex)}
                      className="btn btn-gold"
                      style={{ width: '100%', padding: '0.5rem', fontSize: '0.62rem' }}
                    >
                      ✦ Criar Novo Jogo
                    </button>
                    <button
                      onClick={() => handleImportClick(slot.slotIndex)}
                      className="btn btn-ghost"
                      style={{ width: '100%', padding: '0.4rem', fontSize: '0.6rem' }}
                    >
                      📥 Importar Arquivo de Save
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {!isInGame ? (
        <button 
          onClick={() => { playClick(); setScreen('menu'); }} 
          className="btn btn-ghost" 
          style={{ marginTop: '1.5rem', width: '100%', maxWidth: '14rem', padding: '0.75rem', fontSize: '0.68rem', flexShrink: 0 }}
        >
          Voltar ao Menu Principal
        </button>
      ) : (
        onBackToCombat && (
          <button 
            onClick={() => { playClick(); onBackToCombat(); }} 
            className="btn btn-ghost" 
            style={{ marginTop: 'auto', width: '100%', maxWidth: '14rem', padding: '0.75rem', fontSize: '0.68rem', flexShrink: 0 }}
          >
            Voltar para o Combate
          </button>
        )
      )}
    </div>
  );
};
