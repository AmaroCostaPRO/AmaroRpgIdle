import React, { useEffect, useRef, useState } from 'react';
import * as Phaser from 'phaser';
import { CombatScene } from './phaser/scenes/CombatScene';
import GameUI from './components/GameUI';
import { MainMenu } from './components/MainMenu';
import { CharacterSelect } from './components/CharacterSelect';
import { useGameStore } from './store/useGameStore';
import { AudioManager } from './core/AudioManager';

const App: React.FC = () => {
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const phaserGameRef = useRef<Phaser.Game | null>(null);
  const screen = useGameStore((state) => state.screen);
  const zoomLevel = useGameStore((state) => state.zoomLevel);

  // Inicializa o gerenciador de áudio na montagem do App
  useEffect(() => {
    AudioManager.getInstance();
  }, []);

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
        try {
          phaserGameRef.current.destroy(true);
        } catch (e) {
          console.error("Error during Phaser game destruction:", e);
        }
        phaserGameRef.current = null;
      }
    };
  }, [screen]);

  return (
    <div className={`game-root ${screen === 'playing' ? 'is-playing' : ''}`}>


      {/* Conteúdo escalado dinamicamente com base no zoom */}
      <div
        className={`game-wrapper ${screen === 'playing' ? 'is-playing' : ''}`}
        style={{
          '--zoom-level': zoomLevel,
        } as React.CSSProperties}
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
