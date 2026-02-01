// Mob Builder for TextWorld
// Provides a fluent interface for creating mobs (enemies)

import type { TextWorld, Actor, Stats, Drop, ResourceAmount, Level } from "../textworld.ts";
import { BaseBuilder } from "./base-builder.ts";

/**
 * Builder for creating Mob (Actor) objects with a fluent interface.
 */
export class MobBuilder extends BaseBuilder<Actor> {
  private _name: string;
  private _description: string = "";
  private _health: ResourceAmount = { current: 10, max: 10 };
  private _stamina: ResourceAmount = { current: 10, max: 10 };
  private _magicka: ResourceAmount = { current: 10, max: 10 };
  private _physical_damage: number = 10;
  private _physical_defense: number = 10;
  private _spell_damage: number = 10;
  private _spell_defense: number = 10;
  private _critical_chance: number = 0.05;
  private _progress: Level = { level: 1, xp: 0 };
  private _drops: Drop[] = [];
  private _statsObject: Stats | null = null;

  constructor(textworld: TextWorld, name: string) {
    super(textworld);
    this._name = name;
  }

  /**
   * Sets the mob description.
   */
  description(text: string): this {
    this._description = text;
    return this;
  }

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
   * Sets all stats at once using a Stats object.
   */
  stats(statsObj: Stats): this {
    this._statsObject = statsObj;
    return this;
  }

  /**
   * Adds a single drop item.
   */
  drop(name: string, quantity: number): this {
    this._drops.push({ name, quantity });
    return this;
  }

  /**
   * Sets all drops at once.
   */
  drops(items: Drop[]): this {
    this._drops = items;
    return this;
  }

  /**
   * Builds and registers the mob.
   */
  build(): Actor {
    // Use provided stats object or build from individual values
    const finalStats: Stats = this._statsObject ?? {
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

    const mob = this.textworld.create_mob(
      this._name,
      this._description,
      finalStats,
      this._drops
    );

    return mob;
  }
}
