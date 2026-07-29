import React, { useEffect, useState } from 'react';
import { useQuestStore } from '../store/useQuestStore';
import { AudioManager } from '../core/AudioManager';
import { ModalCloseButton } from './shared/ModalCloseButton';

export const NpcDialogOverlay: React.FC = () => {
  const activeDialog = useQuestStore((s) => s.activeDialog);
  const closeDialog = useQuestStore((s) => s.closeDialog);
  const claimReward = useQuestStore((s) => s.claimReward);

  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (!activeDialog) {
      setDisplayedText('');
      setIsTyping(false);
      return;
    }

    const fullText = activeDialog.text || '';
    setDisplayedText('');
    setIsTyping(true);

    let idx = 0;
    const timer = setInterval(() => {
      idx++;
      setDisplayedText(fullText.slice(0, idx));
      if (idx >= fullText.length) {
        setIsTyping(false);
        clearInterval(timer);
      }
    }, 20);

    return () => clearInterval(timer);
  }, [activeDialog]);

  if (!activeDialog) return null;

  const handleOptionClick = (opt: { label: string; action: string; questId?: string }) => {
    if (opt.action === 'claim_reward' && opt.questId) {
      AudioManager.getInstance().playQuestComplete();
      claimReward(opt.questId);
    } else {
      AudioManager.getInstance().playDialogAdvance();
    }
    closeDialog();
  };

  const handleSkipTyping = () => {
    setDisplayedText(activeDialog.text);
    setIsTyping(false);
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'calc(100% - 2rem)',
        maxWidth: '720px',
        zIndex: 9000,
        background: 'var(--surface-glass)',
        backdropFilter: 'blur(20px) saturate(1.2)',
        border: `1px solid ${activeDialog.factionColor || '#a855f7'}`,
        boxShadow: `0 8px 32px rgba(0,0,0,0.6), 0 0 12px ${activeDialog.factionColor || '#a855f7'}40`,
        borderRadius: 'var(--radius-lg)',
        padding: '1rem',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        pointerEvents: 'auto',
      }}
      onClick={isTyping ? handleSkipTyping : undefined}
    >
      {/* Cabeçalho do NPC */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.5rem' }}>
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            overflow: 'hidden',
            border: `2px solid ${activeDialog.factionColor || '#a855f7'}`,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: `0 0 10px ${activeDialog.factionColor || '#a855f7'}60`,
            position: 'relative',
          }}
        >
          <span style={{ fontSize: '1.2rem', position: 'absolute' }}>👤</span>
          <img
            src={`/assets/npc_${activeDialog.npcId}.png`}
            alt={activeDialog.npcName}
            onError={(e) => {
              (e.currentTarget as HTMLElement).style.display = 'none';
            }}
            style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'relative', zIndex: 1 }}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: activeDialog.factionColor || '#a855f7' }}>
            {activeDialog.npcName}
          </span>
          <span style={{ fontSize: '0.6rem', color: '#94a3b8' }}>Mensagem de Lore & Missão</span>
        </div>
        <ModalCloseButton
          onClick={closeDialog}
          size={24}
          style={{ marginLeft: 'auto' }}
        />
      </div>

      {/* Corpo do Diálogo com Efeito Máquina de Escrever */}
      <p style={{ fontSize: '0.78rem', lineHeight: 1.6, color: '#e2e8f0', margin: 0, fontStyle: 'italic', minHeight: '2.4em' }}>
        "{displayedText}"{isTyping && <span style={{ opacity: 0.7, animation: 'blink 1s infinite' }}>|</span>}
      </p>

      {/* Opções de Resposta */}
      {!isTyping && activeDialog.options && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
          {activeDialog.options.map((opt, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                handleOptionClick(opt);
              }}
              className="btn btn-sm"
              style={{
                fontSize: '0.7rem',
                background: opt.action === 'claim_reward' ? 'linear-gradient(135deg, #10b981, #059669)' : 'var(--surface-3)',
                borderColor: opt.action === 'claim_reward' ? '#10b981' : 'var(--border-subtle)',
                color: '#fff',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
