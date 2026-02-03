// Object Builder for TextWorld
// Provides a fluent interface for creating room objects

import type { TextWorld, Actor, Dialog, CommandParserAction } from "../textworld.ts";
import { BaseBuilder } from "./base-builder.ts";

interface InteractionEntry {
  triggers: string[];
  response: string;
}

interface InteractionActionEntry {
  triggers: string[];
  action: CommandParserAction;
}

/**
 * Builder for creating room Object (Actor) entities with a fluent interface.
 */
export class ObjectBuilder extends BaseBuilder<Actor> {
  private _name: string;
  private _description: string = "";
  private _interactions: InteractionEntry[] = [];
  private _interactionActions: InteractionActionEntry[] = [];

  constructor(textworld: TextWorld, name: string) {
    super(textworld);
    this._name = name;
  }

  /**
   * Sets the object description.
   */
  description(text: string): this {
    this._description = text;
    return this;
  }

  /**
   * Adds a static interaction response for the given triggers.
   */
  interaction(triggers: string[], response: string): this {
    this._interactions.push({ triggers, response });
    return this;
  }

  /**
   * Adds a dynamic interaction action for the given triggers.
   */
  interactionAction(triggers: string[], action: CommandParserAction): this {
    this._interactionActions.push({ triggers, action });
    return this;
  }

  /**
   * Builds and registers the object.
   */
  build(): Actor {
    // Build dialog array from interactions
    const dialogs: Dialog[] = this._interactions.map((entry) => ({
      name: this._name,
      trigger: entry.triggers,
      response: entry.response,
    }));

    // Add dialog entries for actions (without response - they use action instead)
    for (const actionEntry of this._interactionActions) {
      dialogs.push({
        name: this._name,
        trigger: actionEntry.triggers,
      });
    }

    const obj = this.textworld.create_object(
      this._name,
      this._description,
      dialogs.length > 0 ? dialogs : undefined
    );

    // Register interaction actions
    for (const actionEntry of this._interactionActions) {
      this.textworld.create_dialog_action(
        this._name,
        actionEntry.triggers,
        actionEntry.action
      );
    }

    return obj;
  }
}
