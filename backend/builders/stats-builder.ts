// Stats Builder for TextWorld
// Provides a fluent interface for creating actor stats

import type { Stats, ResourceAmount, Level } from "../textworld.ts";

/**
 * Builder for creating Stats objects with a fluent interface.
 */
export class StatsBuilder {
  private _health: ResourceAmount = { current: 10, max: 10 };
  private _stamina: ResourceAmount = { current: 10, max: 10 };
  private _magicka: ResourceAmount = { current: 10, max: 10 };
  private _physical_damage: number = 10;
  private _physical_defense: number = 10;
  private _spell_damage: number = 10;
  private _spell_defense: number = 10;
  private _critical_chance: number = 0.05;
  private _progress: Level = { level: 1, xp: 0 };

  /**
   * Sets the health values.
   */
  health(current: number, max: number): this {
    this._health = { current, max };
    return this;
  }

  /**
   * Sets the stamina values.
   */
  stamina(current: number, max: number): this {
    this._stamina = { current, max };
    return this;
  }

  /**
   * Sets the magicka values.
   */
  magicka(current: number, max: number): this {
    this._magicka = { current, max };
    return this;
  }

  /**
   * Sets the physical damage value.
   */
  physicalDamage(value: number): this {
    this._physical_damage = value;
    return this;
  }

  /**
   * Sets the physical defense value.
   */
  physicalDefense(value: number): this {
    this._physical_defense = value;
    return this;
  }

  /**
   * Sets the spell damage value.
   */
  spellDamage(value: number): this {
    this._spell_damage = value;
    return this;
  }

  /**
   * Sets the spell defense value.
   */
  spellDefense(value: number): this {
    this._spell_defense = value;
    return this;
  }

  /**
   * Sets the critical hit chance (0-1).
   */
  criticalChance(value: number): this {
    this._critical_chance = value;
    return this;
  }

  /**
   * Sets the level.
   */
  level(value: number): this {
    this._progress.level = value;
    return this;
  }

  /**
   * Sets the experience points.
   */
  xp(value: number): this {
    this._progress.xp = value;
    return this;
  }

  /**
   * Sets the progress (level and xp) at once.
   */
  progress(level: number, xp: number): this {
    this._progress = { level, xp };
    return this;
  }

  /**
   * Builds and returns the Stats object.
   */
  build(): Stats {
    return {
      health: this._health,
      stamina: this._stamina,
      magicka: this._magicka,
      physical_damage: this._physical_damage,
      physical_defense: this._physical_defense,
      spell_damage: this._spell_damage,
      spell_defense: this._spell_defense,
      critical_chance: this._critical_chance,
      progress: this._progress,
    };
  }
}
