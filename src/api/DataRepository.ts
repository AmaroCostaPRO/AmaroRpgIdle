import { Character } from '../core/types';

/**
 * Abstract Repository for character data persistence.
 */
export interface IDataRepository {
  saveCharacter(character: Character): Promise<boolean>;
  loadCharacter(id: string): Promise<Character | null>;
}

/**
 * LocalStorage implementation of the DataRepository.
 */
export class LocalStorageRepository implements IDataRepository {
  private readonly STORAGE_KEY = 'rpg_character_data';

  async saveCharacter(character: Character): Promise<boolean> {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      let characters: Record<string, Character> = {};

      if (data) {
        characters = JSON.parse(data);
      }

      characters[character.id] = character;
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(characters));
      return true;
    } catch (error) {
      console.error('Error saving to LocalStorage:', error);
      return false;
    }
  }

  async loadCharacter(id: string): Promise<Character | null> {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (!data) return null;

      const characters: Record<string, Character> = JSON.parse(data);
      return characters[id] || null;
    } catch (error) {
      console.error('Error loading from LocalStorage:', error);
      return null;
    }
  }
}
