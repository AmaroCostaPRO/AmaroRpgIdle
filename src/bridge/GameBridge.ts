import { GameEvent, GameEventPayload } from '../core/types';

/**
 * The GameBridge acts as the central nervous system of the game,
 * facilitating communication between React (UI) and Phaser (Canvas).
 */
class GameBridge {
  private observers: Map<GameEvent, Set<(payload: GameEventPayload) => void>> = new Map();

  // High-frequency feedback registry (Bypasses Zustand for performance)
  private domUpdates: Map<string, (...args: any[]) => void> = new Map();

  /**
   * Subscribe to an event from the Phaser engine.
   * Primarily used by React components to listen for non-high-frequency events.
   */
  subscribe(event: GameEvent, callback: (payload: GameEventPayload) => void): () => void {
    if (!this.observers.has(event)) {
      this.observers.set(event, new Set());
    }
    const eventSet = this.observers.get(event)!;
    eventSet.add(callback);

    // Return unsubscribe function
    return () => {
      eventSet.delete(callback);
    };
  }

  /**
   * Emit an event from Phaser to the UI layer.
   */
  emit(event: GameEvent, payload: GameEventPayload): void {
    const eventSet = this.observers.get(event);
    if (eventSet) {
      eventSet.forEach(callback => callback(payload));
    }

    // Special handling for high-frequency feedback via direct DOM updates
    if (event === GameEvent.PLAYER_HP_CHANGED) {
      this.domUpdates.get('player_hp')?.(payload.pct, payload.current, payload.max);
    }
    if (event === GameEvent.PLAYER_MANA_CHANGED) {
      this.domUpdates.get('player_mana')?.(payload.pct, payload.current, payload.max);
    }
  }

  /**
   * Register a direct DOM update function for high-frequency data.
   * This allows React components to bypass the Zustand store and avoid re-renders.
   * @param id A unique identifier (e.g., 'player_hp')
   * @param updater A function that takes the new value and applies it directly to a DOM element.
   */
  registerDomUpdate(id: string, updater: (...args: any[]) => void): void {
    this.domUpdates.set(id, updater);
  }
}

export const bridge = new GameBridge();
