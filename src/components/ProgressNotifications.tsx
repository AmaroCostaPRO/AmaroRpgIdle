import React, { useState, useEffect } from 'react';
import { bridge } from '../bridge/GameBridge';
import { GameEvent } from '../core/types';
import { ENEMY_TYPES } from '../core/CombatFSM';
import { AudioManager } from '../core/AudioManager';

interface ProgressNotificationItem {
  id: string;
  type: 'class' | 'bestiary' | 'ascension' | 'citadel';
  title: string;
  description: string;
  icon: string;
  borderColor: string;
  titleColor: string;
  glowColor: string;
}

const CLASS_NAMES: Record<string, { name: string; icon: string }> = {
  paladin: { name: 'Paladino', icon: '🛡️' },
  cleric: { name: 'Clérigo', icon: '✝️' },
  rogue: { name: 'Ladrão', icon: '🗡️' },
  necromancer: { name: 'Necromante', icon: '💀' },
};

export const ProgressNotifications: React.FC = () => {
  const [notifications, setNotifications] = useState<ProgressNotificationItem[]>([]);

  useEffect(() => {
    const unsubClass = bridge.subscribe(GameEvent.CLASS_UNLOCKED, (payload) => {
      const classId = payload.classId as string;
      const classInfo = CLASS_NAMES[classId] || { name: classId, icon: '🌟' };
      
      const newNotif: ProgressNotificationItem = {
        id: `class-${classId}-${Date.now()}`,
        type: 'class',
        title: '🛡️ Nova Classe Desbloqueada!',
        description: `O herói atingiu o nível necessário! A classe ${classInfo.name} agora está disponível para seleção global.`,
        icon: classInfo.icon,
        borderColor: 'rgba(168, 85, 247, 0.4)', // Purple
        titleColor: '#c084fc',
        glowColor: 'rgba(168, 85, 247, 0.25)'
      };
      
      setNotifications((prev) => [...prev, newNotif]);
      AudioManager.getInstance().playUpgrade(); // Se houver som de upgrade, tocar
    });

    const unsubBestiary = bridge.subscribe(GameEvent.BESTIARY_COMPLETED, (payload) => {
      const enemyId = payload.enemyId as string;
      const enemy = ENEMY_TYPES.find((e) => e.id === enemyId);
      const enemyName = enemy ? enemy.name : enemyId;
      const isBoss = enemyId.startsWith('boss_');
      
      const newNotif: ProgressNotificationItem = {
        id: `bestiary-${enemyId}-${Date.now()}`,
        type: 'bestiary',
        title: '📖 Bestiário Atualizado!',
        description: `Você concluiu o registro de ${enemyName}! Bônus de +1% de Dano Geral ativado.`,
        icon: isBoss ? '💀' : '📖',
        borderColor: isBoss ? 'rgba(239, 68, 68, 0.4)' : 'rgba(251, 191, 36, 0.4)', // Red for bosses, Gold for normal
        titleColor: isBoss ? '#f87171' : '#fbbf24',
        glowColor: isBoss ? 'rgba(239, 68, 68, 0.25)' : 'rgba(251, 191, 36, 0.25)'
      };
      
      setNotifications((prev) => [...prev, newNotif]);
      AudioManager.getInstance().playCoin(); // Se houver som de item, tocar

      // Notificações de bestiário desaparecem sozinhas após 5s (diferente das demais, que exigem dispensa manual)
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== newNotif.id));
      }, 5000);
    });

    const unsubCitadel = bridge.subscribe(GameEvent.CITADEL_BUILDING_UPGRADED, (payload) => {
      const buildingName = payload.buildingName as string;
      const newLevel = payload.newLevel as number;

      const newNotif: ProgressNotificationItem = {
        id: `citadel-${payload.buildingKey}-${newLevel}-${Date.now()}`,
        type: 'citadel',
        title: '🏗️ Construção Concluída!',
        description: `${buildingName} alcançou o Nível ${newLevel}!`,
        icon: '🏛️',
        borderColor: 'rgba(16, 185, 129, 0.4)', // Esmeralda
        titleColor: '#34d399',
        glowColor: 'rgba(16, 185, 129, 0.25)'
      };

      setNotifications((prev) => [...prev, newNotif]);
      AudioManager.getInstance().playUpgrade();

      // Notificações de construção desaparecem sozinhas após 5s, igual bestiário
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== newNotif.id));
      }, 5000);
    });

    const unsubAscension = bridge.subscribe(GameEvent.ASCENSION_AVAILABLE, () => {
      const newNotif: ProgressNotificationItem = {
        id: `ascension-${Date.now()}`,
        type: 'ascension',
        title: '🌌 Ascensão Disponível!',
        description: 'Seu poder acumulado permite ascender sua alma. Vá à aba de Ascensão para reiniciar e obter Pontos de Prestígio.',
        icon: '🌌',
        borderColor: 'rgba(217, 70, 239, 0.4)', // Magenta/Pink
        titleColor: '#f472b6',
        glowColor: 'rgba(217, 70, 239, 0.25)'
      };
      
      setNotifications((prev) => [...prev, newNotif]);
      AudioManager.getInstance().playUpgrade(); // Se houver som de prestígio, tocar
    });

    return () => {
      unsubClass();
      unsubBestiary();
      unsubCitadel();
      unsubAscension();
    };
  }, []);

  const handleDismiss = (id: string) => {
    AudioManager.getInstance().playClick();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  if (notifications.length === 0) return null;

  return (
    <div 
      style={{
        position: 'absolute',
        bottom: '0.75rem',
        left: '0.75rem',
        right: '0.75rem',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.6rem',
        pointerEvents: 'none'
      }}
    >
      {notifications.map((notif) => (
        <div
          key={notif.id}
          className="panel"
          style={{
            width: '100%',
            background: 'linear-gradient(135deg, rgba(20, 18, 25, 0.95) 0%, rgba(30, 27, 38, 0.95) 100%)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            border: `1px solid ${notif.borderColor}`,
            padding: '1rem',
            boxShadow: `0 8px 32px rgba(0, 0, 0, 0.5), 0 0 16px ${notif.glowColor}`,
            position: 'relative',
            overflow: 'hidden',
            borderRadius: 'var(--radius-xl)',
            pointerEvents: 'auto',
            animation: 'slideUp 0.3s ease-out'
          }}
        >
          {/* Luz de Fundo sutil */}
          <div 
            style={{ 
              position: 'absolute', 
              top: 0, 
              right: 0, 
              width: '80px', 
              height: '80px', 
              background: notif.glowColor, 
              borderRadius: '50%', 
              filter: 'blur(30px)', 
              pointerEvents: 'none' 
            }} 
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.6rem', fontWeight: 800, uppercase: 'true', tracking: '0.1em', color: notif.titleColor } as React.CSSProperties}>
              {notif.title}
            </span>
            <button
              onClick={() => handleDismiss(notif.id)}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '4px',
                color: '#94a3b8',
                fontSize: '0.55rem',
                fontWeight: 'bold',
                padding: '0.15rem 0.4rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#fff';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#94a3b8';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              }}
            >
              Dispensar
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div 
              style={{
                width: '2.5rem',
                height: '2.5rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255, 255, 255, 0.03)',
                border: `1px solid ${notif.borderColor}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.4rem',
                boxShadow: `0 0 10px ${notif.glowColor}`,
                flexShrink: 0
              }}
            >
              {notif.icon}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
              <p style={{ fontSize: '0.68rem', color: '#cbd5e1', margin: 0, lineHeight: 1.4, fontWeight: 500 }}>
                {notif.description}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
