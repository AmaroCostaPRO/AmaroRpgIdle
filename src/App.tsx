import React, { useEffect, useRef, useState } from 'react';
import * as Phaser from 'phaser';
import { CombatScene } from './phaser/scenes/CombatScene';
import GameUI from './components/GameUI';
import { MainMenu } from './components/MainMenu';
import { CharacterSelect } from './components/CharacterSelect';
import { useGameStore } from './store/useGameStore';

const App: React.FC = () => {
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const phaserGameRef = useRef<Phaser.Game | null>(null);
  const screen = useGameStore((state) => state.screen);

  // Estado para armazenar o nível de zoom, persistido no localStorage (padrão 130%/1.3 para telas de alta resolução)
  const [zoomLevel, setZoomLevel] = useState<number>(() => {
    const saved = localStorage.getItem('rpg_game_zoom');
    return saved ? parseFloat(saved) : 1.3;
  });

  useEffect(() => {
    if (screen === 'playing' && gameContainerRef.current && !phaserGameRef.current) {
      console.log("Initializing Phaser Game...");

      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.CANVAS,
        parent: 'game-container',
        width: 800,
        height: 600,
        physics: {
          default: 'arcade',
          arcade: { debug: false },
        },
        scene: [CombatScene],
        backgroundColor: '#2c3e50',
      };

      try {
        phaserGameRef.current = new Phaser.Game(config);
        console.log("Phaser Game Instance successfully attached");
      } catch (error) {
        console.error("CRITICAL ERROR: Failed to initialize Phaser:", error);
      }
    }

    return () => {
      if (phaserGameRef.current) {
        console.log("Destroying Phaser Game...");
        phaserGameRef.current.destroy(true);
        phaserGameRef.current = null;
      }
    };
  }, [screen]);

  return (
    <div className="game-root">
      {/* Seletor de Zoom Persistente */}
      <div className="zoom-selector panel">
        <span style={{ fontFamily: 'var(--font-heading)', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#64748b' }}>
          Zoom:
        </span>
        {[1.0, 1.15, 1.3, 1.5].map((level) => (
          <button
            key={level}
            onClick={() => {
              setZoomLevel(level);
              localStorage.setItem('rpg_game_zoom', String(level));
            }}
            className={`zoom-btn ${zoomLevel === level ? 'active' : ''}`}
          >
            {Math.round(level * 100)}%
          </button>
        ))}
      </div>

      {/* Conteúdo escalado dinamicamente com base no zoom */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          transition: 'all 0.2s',
          zoom: zoomLevel,
          position: 'relative',
          zIndex: 1,
        }}
      >
        {screen === 'menu' && (
          <div style={{ width: '100%', maxWidth: '28rem' }} className="animate-fadeIn">
            <MainMenu />
          </div>
        )}

        {screen === 'character_select' && (
          <div style={{ width: '100%', maxWidth: '42rem' }} className="animate-fadeIn">
            <CharacterSelect />
          </div>
        )}

        {screen === 'playing' && (
          <div className="game-layout-container animate-fadeIn">
            {/* Phaser Game Container */}
            <div
              id="game-container"
              ref={gameContainerRef}
              className="phaser-container"
            />

            {/* UI Component Container */}
            <div className="ui-container">
              <GameUI />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
