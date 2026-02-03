// Vendor Builder for TextWorld
// Provides a fluent interface for creating vendors (special NPCs)

import type { TextWorld, Actor, VendorItem } from "../textworld.ts";
import { BaseBuilder } from "./base-builder.ts";

/**
 * Builder for creating Vendor (Actor) objects with a fluent interface.
 * Vendors are special NPCs that can sell items.
 */
export class VendorBuilder extends BaseBuilder<Actor> {
  private _name: string;
  private _description: string = "";
  private _vendorItems: VendorItem[] = [];

  constructor(textworld: TextWorld, name: string) {
    super(textworld);
    this._name = name;
  }

  /**
   * Sets the vendor description.
   */
  description(text: string): this {
    this._description = text;
    return this;
  }

  /**
   * Adds an item for sale.
   */
  sells(itemName: string, price: number): this {
    this._vendorItems.push({ name: itemName, price });
    return this;
  }

  /**
   * Sets the full inventory at once.
   */
  inventory(items: VendorItem[]): this {
    this._vendorItems = items;
    return this;
  }

  /**
   * Builds and registers the vendor.
   */
  build(): Actor {
    this.textworld.create_vendor(this._name, this._description, this._vendorItems);
    const vendor = this.textworld.get_npc(this._name);

    if (!vendor) {
      throw new Error(`Failed to create vendor ${this._name}`);
    }

    return vendor;
  }
}
