// Recipe Builder for TextWorld
// Provides a fluent interface for creating crafting recipes

import type { TextWorld, Recipe, Drop } from "../textworld.ts";
import { BaseBuilder } from "./base-builder.ts";

/**
 * Builder for creating Recipe objects with a fluent interface.
 */
export class RecipeBuilder extends BaseBuilder<Recipe> {
  private _name: string;
  private _description: string = "";
  private _ingredients: Drop[] = [];
  private _produces: Drop = { name: "", quantity: 1 };

  constructor(textworld: TextWorld, name: string) {
    super(textworld);
    this._name = name;
    // Default: produces an item with the same name as the recipe
    this._produces.name = name;
  }

  /**
   * Sets the recipe description.
   */
  description(text: string): this {
    this._description = text;
    return this;
  }

  /**
   * Adds a required ingredient.
   */
  requires(itemName: string, quantity: number): this {
    this._ingredients.push({ name: itemName, quantity });
    return this;
  }

  /**
   * Sets all ingredients at once.
   */
  ingredients(items: Drop[]): this {
    this._ingredients = items;
    return this;
  }

  /**
   * Sets what item is produced by this recipe.
   */
  produces(itemName: string, quantity: number = 1): this {
    this._produces = { name: itemName, quantity };
    return this;
  }

  /**
   * Builds and registers the recipe.
   */
  build(): Recipe {
    this.textworld.create_recipe(
      this._name,
      this._description,
      this._ingredients,
      this._produces
    );

    const recipe = this.textworld.get_recipe(this._name);
    if (!recipe) {
      throw new Error(`Failed to create recipe ${this._name}`);
    }

    return recipe;
  }
}
