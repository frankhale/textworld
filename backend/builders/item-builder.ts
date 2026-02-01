// Item Builder for TextWorld
// Provides a fluent interface for creating items

import type { TextWorld, Item, Action } from "../textworld.ts";
import { BaseBuilder } from "./base-builder.ts";

/**
 * Builder for creating Item objects with a fluent interface.
 */
export class ItemBuilder extends BaseBuilder<Item> {
  private _name: string;
  private _description: string = "";
  private _usable: boolean = false;
  private _consumable: boolean = false;
  private _level: number = 1;
  private _value: number = 1;
  private _onUseAction: Action | null = null;

  constructor(textworld: TextWorld, name: string) {
    super(textworld);
    this._name = name;
  }

  /**
   * Sets the item description.
   */
  description(text: string): this {
    this._description = text;
    return this;
  }

  /**
   * Marks the item as usable.
   */
  usable(value: boolean = true): this {
    this._usable = value;
    return this;
  }

  /**
   * Marks the item as consumable (removed after use).
   */
  consumable(value: boolean = true): this {
    this._consumable = value;
    return this;
  }

  /**
   * Sets the item level.
   */
  level(value: number): this {
    this._level = value;
    return this;
  }

  /**
   * Sets the item's gold value.
   */
  value(amount: number): this {
    this._value = amount;
    return this;
  }

  /**
   * Sets the action that runs when the item is used.
   */
  onUse(action: Action): this {
    this._onUseAction = action;
    this._usable = true; // Automatically mark as usable if onUse is set
    return this;
  }

  /**
   * Builds and registers the item.
   */
  build(): Item {
    const item = this.textworld.create_item(
      this._name,
      this._description,
      this._usable,
      this._consumable,
      this._onUseAction
    );

    // Set level and value
    this.textworld.set_item_level_and_value(this._name, this._level, this._value);

    return item;
  }
}
