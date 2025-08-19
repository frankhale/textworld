import { Room, Item, Player, Recipe, Direction } from './types.ts';
import { Game } from './game.ts';

export class ItemBuilder {
  private item: Item;

  constructor(id: string, name: string) {
    this.item = {
      id,
      name,
      description: '',
      canPickUp: true,
      quantity: 1,
    };
  }

  withDescription(description: string): ItemBuilder {
    this.item.description = description;
    return this;
  }

  withQuantity(quantity: number): ItemBuilder {
    this.item.quantity = quantity;
    return this;
  }

  notPickable(): ItemBuilder {
    this.item.canPickUp = false;
    return this;
  }

  withUseEffect(effect: (game: Game, item: Item) => void): ItemBuilder {
    this.item.usable = effect;
    return this;
  }

  asRecipe(recipe: Recipe): ItemBuilder {
    this.item.recipe = recipe;
    return this;
  }

  build(): Item {
    return { ...this.item };
  }
}

export class RoomBuilder {
  private room: Room;

  constructor(id: string) {
    this.room = {
      id,
      description: '',
      items: [],
      exits: {},
    };
  }

  withDescription(description: string): RoomBuilder {
    this.room.description = description;
    return this;
  }

  withItem(item: Item): RoomBuilder {
    const existing = this.room.items.find(i => i.id === item.id);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      this.room.items.push({ ...item });
    }
    return this;
  }

  withExit(direction: Direction, roomId: string): RoomBuilder {
    this.room.exits[direction] = roomId;
    return this;
  }

  build(): Room {
    return { ...this.room };
  }
}

export class PlayerBuilder {
  private player: Player;

  constructor(startRoom: string) {
    this.player = {
      currentRoom: startRoom,
      inventory: [],
      health: 100,
      knownRecipes: [],
    };
  }

  withItem(item: Item, quantity?: number): PlayerBuilder {
    const existing = this.player.inventory.find(i => i.id === item.id);
    if (existing) {
      existing.quantity += item.quantity * (quantity || 1);
    } else {
      item.quantity = item.quantity * (quantity || 1);
      this.player.inventory.push({ ...item });
    }
    return this;
  }

  build(): Player {
    return { ...this.player };
  }
}