import { GameState, Room, Item, Direction, Recipe, MutableGameState } from './types.ts';

export class Game {
  private state: GameState;

  constructor(state: GameState) {
    this.state = { ...state };
  }

  look(): string {
    const room = this.state.rooms[this.state.player.currentRoom];
    let output = `${room.description}\nExits: ${Object.keys(room.exits).join(', ')}\nItems: `;
    output += room.items.length > 0
      ? room.items.map((i: Item) => `${i.name} (${i.quantity})`).join(', ')
      : 'none';
    return output;
  }

  move(direction: Direction): string {
    const currentRoom = this.state.rooms[this.state.player.currentRoom];
    const nextRoomId = currentRoom.exits[direction];
    if (!nextRoomId) return "Can't go that way!";
    this.state.player.currentRoom = nextRoomId;
    return this.look();
  }

  take(itemId: string): string {
    const room = this.state.rooms[this.state.player.currentRoom];
    const itemIndex = room.items.findIndex((i: Item) => i.id === itemId);
    if (itemIndex === -1) return "Item not found!";
    const item = room.items[itemIndex];
    if (!item.canPickUp) return "Can't pick that up!";

    const existing = this.state.player.inventory.find((i: Item) => i.id === itemId);
    if (existing) {
      existing.quantity += 1;
    } else {
      this.state.player.inventory.push({ ...item, quantity: 1 });
    }

    if (item.quantity > 1) {
      item.quantity -= 1;
    } else {
      room.items.splice(itemIndex, 1);
    }
    return `Picked up ${item.name}`;
  }

  drop(itemId: string): string {
    const itemIndex = this.state.player.inventory.findIndex(i => i.id === itemId);
    if (itemIndex === -1) return "Item not in inventory!";
    const item = this.state.player.inventory[itemIndex];

    const room = this.state.rooms[this.state.player.currentRoom];
    const existing = room.items.find(i => i.id === itemId);
    if (existing) {
      existing.quantity += 1;
    } else {
      room.items.push({ ...item, quantity: 1 });
    }

    if (item.quantity > 1) {
      item.quantity -= 1;
    } else {
      this.state.player.inventory.splice(itemIndex, 1);
    }
    return `Dropped ${item.name}`;
  }

  inventory(): string {
    return this.state.player.inventory.length > 0
      ? this.state.player.inventory.map(i => `${i.name} (${i.quantity})`).join(', ')
      : 'Inventory empty';
  }

  use(itemId: string): string {
    const item = this.state.player.inventory.find(i => i.id === itemId);
    if (!item) return "Item not in inventory!";
    if (!item.usable) return "Can't use that!";
    item.usable(this, item);
    return `Used ${item.name}`;
  }

  learn(itemId: string): string {
    const itemIndex = this.state.player.inventory.findIndex(i => i.id === itemId);
    if (itemIndex === -1) return "Item not in inventory!";
    const item = this.state.player.inventory[itemIndex];
    if (!item.recipe) return "That's not a recipe!";

    this.state.player.knownRecipes.push(item.recipe);
    if (item.quantity > 1) {
      item.quantity -= 1;
    } else {
      this.state.player.inventory.splice(itemIndex, 1);
    }
    return `Learned recipe: ${item.recipe.description}`;
  }

  craft(recipeId: string): string {
    const recipe = this.state.player.knownRecipes.find(r => r.id === recipeId);
    if (!recipe) return "Recipe not known!";

    const hasAllItems = recipe.ingredients.every(ing => {
      const item = this.state.player.inventory.find(i => i.id === ing);
      return item && item.quantity > 0;
    });

    if (!hasAllItems) return "Missing ingredients!";

    recipe.ingredients.forEach(ing => {
      const item = this.state.player.inventory.find(i => i.id === ing)!;
      item.quantity -= 1;
      if (item.quantity === 0) {
        const index = this.state.player.inventory.indexOf(item);
        this.state.player.inventory.splice(index, 1);
      }
    });

    const resultItem = this.state.items[recipe.result];
    const existing = this.state.player.inventory.find(i => i.id === resultItem.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      this.state.player.inventory.push({ ...resultItem, quantity: 1 });
    }
    return `Crafted ${resultItem.name}`;
  }

  getRooms(): Record<string, Room> {
    return { ...this.state.rooms };
  }

  getPlayersCurrentRoomId(): string {
    return this.state.player.currentRoom;
  }

  getPlayerHealth(): number {
    return this.state.player.health;
  }

  setPlayerHealth(health: number): void {
    this.state.player.health = Math.max(0, Math.min(100, health));
  }

  modifyPlayerHealth(modifier: (current: number) => number): void {
    const current = this.state.player.health;
    const newHealth = modifier(current);
    this.setPlayerHealth(Math.max(0, Math.min(100, newHealth)));
  }

  removeItemFromInventory(item: Item): void {
    const index = this.state.player.inventory.indexOf(item);
    if (index !== -1) {
      const invItem = this.state.player.inventory[index];
      if (invItem.quantity > 1) {
        invItem.quantity -= 1;
      } else {
        this.state.player.inventory.splice(index, 1);
      }
    }
  }

  addItemToInventory(item: Item): void {
    const existing = this.state.player.inventory.find(i => i.id === item.id);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      this.state.player.inventory.push({ ...item });
    }
  }

  getCurrentRoom(): Room {
    return { ...this.state.rooms[this.state.player.currentRoom] };
  }

  getPlayersInventory(): Item[] {
    return [...this.state.player.inventory];
  }

  getPlayerRecipes(): Recipe[] {
    return [...this.state.player.knownRecipes];
  }

  exportState(): string {
    const mutableState: MutableGameState = {
      player: { ...this.state.player },
      rooms: Object.fromEntries(
        Object.entries(this.state.rooms).map(([id, room]) => [id, { ...room as Room }])
      ),
    };
    return JSON.stringify(mutableState, null, 2);
  }

  static importState(json: string, initialItems: Record<string, Item>): Game {
    const mutableState: MutableGameState = JSON.parse(json);
    const fullState: GameState = {
      player: mutableState.player,
      rooms: mutableState.rooms,
      items: initialItems
    };
    return new Game(fullState);
  }
}