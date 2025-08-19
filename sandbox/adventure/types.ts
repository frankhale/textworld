import { Game } from './game.ts';

export interface Item {
  id: string;
  name: string;
  description: string;
  canPickUp: boolean;
  quantity: number;
  usable?: (game: Game, item: Item) => void;
  recipe?: Recipe;
}

export interface Recipe {
  id: string;
  result: string;
  ingredients: string[];
  description: string;
}

export interface Room {
  id: string;
  description: string;
  items: Item[];
  exits: Partial<Record<Direction, string>>;
}

export interface Player {
  currentRoom: string;
  inventory: Item[];
  health: number;
  knownRecipes: Recipe[];
}

export type Direction = 'north' | 'south' | 'east' | 'west';

export interface GameState {
  player: Player;
  rooms: Record<string, Room>;
  items: Record<string, Item>;
}

export interface MutableGameState {
  player: Player;
  rooms: Record<string, Room>;
}