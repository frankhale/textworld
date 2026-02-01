// NPC Builder for TextWorld
// Provides a fluent interface for creating NPCs

import type { TextWorld, Actor, CommandParserAction } from "../textworld.ts";
import { BaseBuilder } from "./base-builder.ts";

interface DialogEntry {
  triggers: string[];
  response: string;
}

interface DialogActionEntry {
  triggers: string[];
  action: CommandParserAction;
}

/**
 * Builder for creating NPC (Actor) objects with a fluent interface.
 */
export class NPCBuilder extends BaseBuilder<Actor> {
  protected _name: string;
  protected _description: string = "";
  protected _dialogs: DialogEntry[] = [];
  protected _dialogActions: DialogActionEntry[] = [];
  protected _killable: boolean = false;

  constructor(textworld: TextWorld, name: string) {
    super(textworld);
    this._name = name;
  }

  /**
   * Sets the NPC description.
   */
  description(text: string): this {
    this._description = text;
    return this;
  }

  /**
   * Adds a dialog response for the given triggers.
   */
  dialog(triggers: string[], response: string): this {
    this._dialogs.push({ triggers, response });
    return this;
  }

  /**
   * Adds a dialog action for the given triggers.
   */
  dialogAction(triggers: string[], action: CommandParserAction): this {
    this._dialogActions.push({ triggers, action });
    return this;
  }

  /**
   * Marks the NPC as killable.
   */
  killable(value: boolean = true): this {
    this._killable = value;
    return this;
  }

  /**
   * Builds and registers the NPC.
   */
  build(): Actor {
    const npc = this.textworld.create_npc(this._name, this._description);

    // Set killable property
    npc.killable = this._killable;

    // Add dialogs
    for (const dialogEntry of this._dialogs) {
      this.textworld.create_dialog(this._name, dialogEntry.triggers, dialogEntry.response);
    }

    // Add dialog actions
    for (const actionEntry of this._dialogActions) {
      this.textworld.create_dialog_action(this._name, actionEntry.triggers, actionEntry.action);
    }

    return npc;
  }
}
