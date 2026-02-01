// Room Builder for TextWorld
// Provides a fluent interface for creating rooms with all their contents

import type {
  TextWorld,
  Room,
  ExitName,
  Action,
  CommandParserAction,
  Drop,
} from "../textworld.ts";
import { BaseBuilder } from "./base-builder.ts";

interface ExitConfig {
  direction: ExitName;
  toRoom: string;
  hidden?: boolean;
}

interface AlternateDescription {
  flag: string;
  text: string;
}

interface RoomCommand {
  name: string;
  synonyms: string[];
  description: string;
  action: CommandParserAction;
}

/**
 * Builder for creating Room objects with a fluent interface.
 */
export class RoomBuilder extends BaseBuilder<Room> {
  private _zoneName: string;
  private _name: string;
  private _description: string = "";
  private _alternateDescriptions: AlternateDescription[] = [];
  private _exits: ExitConfig[] = [];
  private _items: Drop[] = [];
  private _npcs: string[] = [];
  private _mobs: string[] = [];
  private _objects: string[] = [];
  private _onEnterActions: Action[] = [];
  private _commands: RoomCommand[] = [];
  private _isZoneStarter: boolean = false;

  constructor(textworld: TextWorld, zoneName: string, name: string) {
    super(textworld);
    this._zoneName = zoneName;
    this._name = name;
  }

  /**
   * Sets the room description.
   */
  description(text: string): this {
    this._description = text;
    return this;
  }

  /**
   * Adds an alternate description that shows when the player has a specific flag.
   */
  alternateDescription(flag: string, text: string): this {
    this._alternateDescriptions.push({ flag, text });
    return this;
  }

  /**
   * Adds an exit to another room.
   */
  exit(direction: ExitName, toRoom: string, options?: { hidden?: boolean }): this {
    this._exits.push({
      direction,
      toRoom,
      hidden: options?.hidden ?? false,
    });
    return this;
  }

  /**
   * Adds multiple exits at once.
   */
  exits(configs: ExitConfig[]): this {
    this._exits.push(...configs);
    return this;
  }

  /**
   * Places an item in the room.
   */
  item(name: string, quantity: number = 1): this {
    this._items.push({ name, quantity });
    return this;
  }

  /**
   * Places multiple items in the room.
   */
  items(drops: Drop[]): this {
    this._items.push(...drops);
    return this;
  }

  /**
   * Places an NPC in the room.
   */
  npc(name: string): this {
    this._npcs.push(name);
    return this;
  }

  /**
   * Places a mob in the room.
   */
  mob(name: string): this {
    this._mobs.push(name);
    return this;
  }

  /**
   * Places an object in the room.
   */
  object(name: string): this {
    this._objects.push(name);
    return this;
  }

  /**
   * Adds an action that runs when the player enters the room.
   */
  onEnter(action: Action): this {
    this._onEnterActions.push(action);
    return this;
  }

  /**
   * Adds a room-specific command.
   */
  command(
    name: string,
    synonyms: string[],
    description: string,
    action: CommandParserAction
  ): this {
    this._commands.push({ name, synonyms, description, action });
    return this;
  }

  /**
   * Marks this room as the starting room for its zone.
   */
  asZoneStarter(): this {
    this._isZoneStarter = true;
    return this;
  }

  /**
   * Builds and registers the room with all its contents.
   */
  build(): Room {
    // Create the room with the first onEnter action (if any)
    const firstAction = this._onEnterActions.length > 0 ? this._onEnterActions[0] : null;
    const room = this.textworld.create_room(
      this._zoneName,
      this._name,
      this._description,
      firstAction
    );

    // Add additional onEnter actions
    for (let i = 1; i < this._onEnterActions.length; i++) {
      this.textworld.add_room_action(this._zoneName, this._name, this._onEnterActions[i]!);
    }

    // Add alternate descriptions
    for (const altDesc of this._alternateDescriptions) {
      this.textworld.add_room_description(
        this._zoneName,
        this._name,
        altDesc.flag,
        altDesc.text
      );
    }

    // Add exits
    for (const exit of this._exits) {
      // Check if the destination room exists, if not we'll create the exit anyway
      // and let the normal error handling deal with it
      try {
        this.textworld.create_exit(
          this._zoneName,
          this._name,
          exit.direction,
          exit.toRoom,
          exit.hidden
        );
      } catch {
        // If the destination room doesn't exist yet, just add the exit directly
        room.exits.push({
          name: exit.direction,
          location: exit.toRoom,
          hidden: exit.hidden ?? false,
        });
      }
    }

    // Place items
    for (const item of this._items) {
      try {
        this.textworld.place_item(this._zoneName, this._name, item.name, item.quantity);
      } catch {
        // Item might not exist yet, add it directly
        room.items.push(item);
      }
    }

    // Place NPCs
    for (const npcName of this._npcs) {
      try {
        this.textworld.place_npc(this._zoneName, this._name, npcName);
      } catch {
        // NPC might not exist, skip silently
      }
    }

    // Place mobs
    for (const mobName of this._mobs) {
      try {
        this.textworld.place_mob(this._zoneName, this._name, mobName);
      } catch {
        // Mob might not exist, skip silently
      }
    }

    // Place objects
    for (const objectName of this._objects) {
      try {
        this.textworld.place_object(this._zoneName, this._name, objectName);
      } catch {
        // Object might not exist, skip silently
      }
    }

    // Add room commands
    for (const cmd of this._commands) {
      this.textworld.add_room_command_action(
        this._zoneName,
        this._name,
        cmd.name,
        cmd.description,
        cmd.synonyms,
        cmd.action
      );
    }

    // Set as zone starter if requested
    if (this._isZoneStarter) {
      this.textworld.set_room_as_zone_starter(this._zoneName, this._name);
    }

    return room;
  }
}
