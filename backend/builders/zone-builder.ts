// Zone Builder for TextWorld
// Provides a fluent interface for creating zones

import type { TextWorld, Zone } from "../textworld.ts";
import { BaseBuilder } from "./base-builder.ts";

/**
 * Builder for creating Zone objects with a fluent interface.
 */
export class ZoneBuilder extends BaseBuilder<Zone> {
  private _name: string;
  private _description: string = "";
  private _startingRoom: string | null = null;

  constructor(textworld: TextWorld, name: string) {
    super(textworld);
    this._name = name;
  }

  /**
   * Sets the zone description.
   */
  description(text: string): this {
    this._description = text;
    return this;
  }

  /**
   * Sets the starting room for this zone.
   */
  startingRoom(roomName: string): this {
    this._startingRoom = roomName;
    return this;
  }

  /**
   * Builds and registers the zone.
   */
  build(): Zone {
    const zone = this.textworld.create_zone(this._name, this._description);

    if (this._startingRoom) {
      // We need to defer setting the starting room until the room exists
      // Store it on the zone for later use
      zone.starting_room = this._startingRoom;
    }

    return zone;
  }
}
