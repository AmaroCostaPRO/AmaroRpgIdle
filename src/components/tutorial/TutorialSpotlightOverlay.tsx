import React, { useEffect, useState, useRef } from 'react';
import { useTutorialStore, TUTORIAL_STEPS } from '../../store/useTutorialStore';
import { AlmaMundoFlame } from '../shared/SpecialNpcPortraits';

interface RectBounds {
  top: number;
  left: number;
  width: number;
  height: number;
}

export const TutorialSpotlightOverlay: React.FC<{ activeTab?: string; onSwitchTab?: (tab: string) => void }> = ({
  activeTab,
  onSwitchTab,
}) => {
  const isTutorialActive = useTutorialStore((s) => s.isTutorialActive);
  const currentStepIndex = useTutorialStore((s) => s.currentStepIndex);
  const advanceStep = useTutorialStore((s) => s.advanceStep);
  const skipTutorial = useTutorialStore((s) => s.skipTutorial);

  const [targetRect, setTargetRect] = useState<RectBounds | null>(null);
  const [tabNeedNotice, setTabNeedNotice] = useState<string | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const currentStep = TUTORIAL_STEPS[currentStepIndex];

  // Atualiza as coordenadas do elemento alvo na tela (suporta mudança dinâmica de posição)
  useEffect(() => {
    if (!isTutorialActive || !currentStep) return;

    const updateRect = () => {
      // Se o passo exige uma aba específica e ela não está ativa, direciona o destaque para o botão da aba
      if (currentStep.requiredTab && activeTab !== currentStep.requiredTab) {
        setTabNeedNotice(currentStep.requiredTab);
        const tabEl = document.querySelector(`[data-tutorial-target="btn-tab-${currentStep.requiredTab}"]`);
        if (tabEl) {
          const b = tabEl.getBoundingClientRect();
          setTargetRect({ top: b.top, left: b.left, width: b.width, height: b.height });
          return;
        }
      } else {
        setTabNeedNotice(null);
      }

      // Procura pelo elemento alvo exato do passo
      const el = document.querySelector(`[data-tutorial-target="${currentStep.targetId}"]`);
      if (el) {
        const b = el.getBoundingClientRect();
        setTargetRect({ top: b.top, left: b.left, width: b.width, height: b.height });
      } else {
        // Fallback caso o sub-elemento ainda não tenha sido renderizado (ex: abrindo sub-aba)
        const tabEl = currentStep.requiredTab
          ? document.querySelector(`[data-tutorial-target="btn-tab-${currentStep.requiredTab}"]`)
          : null;
        if (tabEl) {
          const b = tabEl.getBoundingClientRect();
          setTargetRect({ top: b.top, left: b.left, width: b.width, height: b.height });
        } else {
          setTargetRect(null);
        }
      }
    };

    const loop = () => {
      updateRect();
      animationFrameRef.current = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isTutorialActive, currentStepIndex, currentStep, activeTab]);

  if (!isTutorialActive || !currentStep) return null;

  // Passo 0: Boas-Vindas Inicial (Modal sem spotlight de botão)
  if (currentStep.stepNumber === 0) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9900,
          background: 'rgba(4, 6, 14, 0.88)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '1.5rem',
        }}
      >
        <div
          style={{
            maxWidth: '540px',
            width: '100%',
            background: 'linear-gradient(180deg, #0f172a 0%, #090d16 100%)',
            border: '2px solid #a855f7',
            borderRadius: '16px',
            padding: '2rem 1.8rem',
            boxShadow: '0 0 35px rgba(168, 85, 247, 0.4), 0 20px 40px rgba(0,0,0,0.8)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
          }}
        >
          <div style={{ width: '80px', height: '80px', marginBottom: '1rem' }}>
            <AlmaMundoFlame />
          </div>
          <div style={{ color: '#a855f7', fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '2px' }}>
            Guia Espiritual
          </div>
          <h2 style={{ color: '#f8fafc', fontSize: '1.6rem', fontWeight: 900, fontFamily: 'Cinzel, serif', margin: '0.4rem 0 1rem 0' }}>
            {currentStep.title}
          </h2>
          <p style={{ color: '#cbd5e1', fontSize: '1.05rem', lineHeight: '1.6', fontStyle: 'italic', marginBottom: '1.8rem' }}>
            "{currentStep.instruction}"
          </p>

          <div style={{ display: 'flex', gap: '1rem', width: '100%', justifyContent: 'center' }}>
            <button
              onClick={skipTutorial}
              style={{
                background: 'transparent',
                color: '#94a3b8',
                border: '1px solid #475569',
                borderRadius: '8px',
                padding: '0.7rem 1.4rem',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Pular Tutorial
            </button>
            <button
              data-tutorial-target="tutorial-welcome-start-btn"
              onClick={advanceStep}
              style={{
                background: 'linear-gradient(135deg, #a855f7, #6b21a8)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '0.75rem 2rem',
                fontSize: '1rem',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 0 15px rgba(168, 85, 247, 0.5)',
              }}
            >
              Iniciar Tutorial ➔
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Passos Interativos (Com Spotlight Cutout Mask)
  const padding = 6;
  const targetX = targetRect ? targetRect.left - padding : 0;
  const targetY = targetRect ? targetRect.top - padding : 0;
  const targetW = targetRect ? targetRect.width + padding * 2 : 0;
  const targetH = targetRect ? targetRect.height + padding * 2 : 0;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9900,
        pointerEvents: 'auto',
      }}
    >
      {/* SVG Mask cutout ao redor do elemento alvo */}
      <svg
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'auto',
        }}
      >
        <defs>
          <mask id="tutorial-spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {targetRect && (
              <rect
                x={targetX}
                y={targetY}
                width={targetW}
                height={targetH}
                rx="8"
                ry="8"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(4, 6, 14, 0.82)"
          mask="url(#tutorial-spotlight-mask)"
        />
        {/* Borda pulsante de destaque em volta do elemento alvo */}
        {targetRect && (
          <rect
            x={targetX}
            y={targetY}
            width={targetW}
            height={targetH}
            rx="8"
            ry="8"
            fill="none"
            stroke="#a855f7"
            strokeWidth="3"
            style={{
              animation: 'pulseGlow 1.5s infinite ease-in-out',
            }}
          />
        )}
      </svg>

      {/* Caixa de Diálogo Guiada da Alma do Mundo */}
      <div
        style={{
          position: 'fixed',
          bottom: '2rem',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'calc(100% - 2rem)',
          maxWidth: '620px',
          zIndex: 9950,
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(9, 13, 22, 0.98))',
          border: '2px solid #a855f7',
          borderRadius: '16px',
          padding: '1.2rem 1.4rem',
          boxShadow: '0 0 30px rgba(168, 85, 247, 0.5), 0 15px 35px rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          gap: '1.2rem',
          backdropFilter: 'blur(8px)',
        }}
      >
        <div style={{ width: '60px', height: '60px', flexShrink: 0 }}>
          <AlmaMundoFlame />
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
            <span style={{ color: '#a855f7', fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Passo {currentStep.stepNumber} de {currentStep.totalSteps}
            </span>
            <button
              onClick={skipTutorial}
              style={{
                background: 'transparent',
                color: '#64748b',
                border: 'none',
                fontSize: '0.8rem',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Pular
            </button>
          </div>

          <div style={{ color: '#f8fafc', fontWeight: 800, fontSize: '1.05rem', fontFamily: 'Cinzel, serif', marginBottom: '0.3rem' }}>
            {currentStep.title}
          </div>

          <div style={{ color: '#cbd5e1', fontSize: '0.92rem', lineHeight: '1.4' }}>
            {tabNeedNotice
              ? `Toque na aba "${tabNeedNotice.toUpperCase()}" abaixo para acessar a opção!`
              : currentStep.instruction}
          </div>
        </div>
      </div>
    </div>
  );
};
