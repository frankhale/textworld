// Base Builder class for TextWorld
// Provides common functionality for all builders

import type { TextWorld } from "../textworld.ts";

/**
 * Abstract base class for all builders.
 * Provides common functionality and enforces the builder pattern contract.
 */
export abstract class BaseBuilder<T> {
  protected textworld: TextWorld;

  constructor(textworld: TextWorld) {
    this.textworld = textworld;
  }

  /**
   * Finalizes the builder and returns the constructed entity.
   * Must be implemented by all concrete builders.
   */
  abstract build(): T;
}
