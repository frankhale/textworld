// Quest Builder for TextWorld
// Provides a fluent interface for creating quests

import type { TextWorld, Quest, Action, ActionDecision } from "../textworld.ts";
import { BaseBuilder } from "./base-builder.ts";

interface QuestStepConfig {
  name: string;
  description: string;
  isComplete: ActionDecision | null;
}

/**
 * Builder for defining quest steps.
 * Returns to the parent QuestBuilder after configuration.
 */
export class QuestStepBuilder {
  private _parent: QuestBuilder;
  private _name: string;
  private _description: string = "";
  private _isComplete: ActionDecision | null = null;

  constructor(parent: QuestBuilder, name: string) {
    this._parent = parent;
    this._name = name;
  }

  /**
   * Sets the step description.
   */
  description(text: string): this {
    this._description = text;
    return this;
  }

  /**
   * Sets the completion check function.
   */
  isComplete(check: ActionDecision): this {
    this._isComplete = check;
    return this;
  }

  /**
   * Finalizes this step and returns to the parent QuestBuilder.
   * Implicitly called when chaining to another step or build().
   */
  done(): QuestBuilder {
    this._parent._addStep({
      name: this._name,
      description: this._description,
      isComplete: this._isComplete,
    });
    return this._parent;
  }

  /**
   * Convenience method to add another step directly.
   */
  step(name: string): QuestStepBuilder {
    return this.done().step(name);
  }

  /**
   * Convenience method to set onEnd and continue building.
   */
  onEnd(action: Action): QuestBuilder {
    return this.done().onEnd(action);
  }

  /**
   * Convenience method to build directly from step.
   */
  build(): Quest {
    return this.done().build();
  }
}

/**
 * Builder for creating Quest objects with a fluent interface.
 */
export class QuestBuilder extends BaseBuilder<Quest> {
  private _name: string;
  private _description: string = "";
  private _onStart: Action | null = null;
  private _onEnd: Action | null = null;
  private _steps: QuestStepConfig[] = [];

  constructor(textworld: TextWorld, name: string) {
    super(textworld);
    this._name = name;
  }

  /**
   * Sets the quest description.
   */
  description(text: string): this {
    this._description = text;
    return this;
  }

  /**
   * Sets the action that runs when the quest is started.
   */
  onStart(action: Action): this {
    this._onStart = action;
    return this;
  }

  /**
   * Sets the action that runs when the quest is completed.
   */
  onEnd(action: Action): this {
    this._onEnd = action;
    return this;
  }

  /**
   * Begins defining a quest step.
   */
  step(name: string): QuestStepBuilder {
    return new QuestStepBuilder(this, name);
  }

  /**
   * Internal method to add a step from QuestStepBuilder.
   * @internal
   */
  _addStep(step: QuestStepConfig): void {
    this._steps.push(step);
  }

  /**
   * Builds and registers the quest.
   */
  build(): Quest {
    // Create the quest
    this.textworld.create_quest(this._name, this._description);

    // Add start action
    if (this._onStart) {
      this.textworld.add_quest_action(this._name, "Start", this._onStart);
    }

    // Add end action
    if (this._onEnd) {
      this.textworld.add_quest_action(this._name, "End", this._onEnd);
    }

    // Add steps
    for (const step of this._steps) {
      this.textworld.add_quest_step(
        this._name,
        step.name,
        step.description,
        step.isComplete
      );
    }

    const quest = this.textworld.get_quest(this._name);
    if (!quest) {
      throw new Error(`Failed to create quest ${this._name}`);
    }

    return quest;
  }
}
