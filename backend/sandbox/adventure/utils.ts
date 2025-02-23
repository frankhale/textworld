import { Game } from './game.ts';
import { Item } from './types.ts';

export function findItemByName(items: Item[], name: string): Item | undefined {
  return items.find(i => i.name.toLowerCase() === name.toLowerCase());
}

export function getItemFromRoom(game: Game, itemName: string): Item | undefined {
  const room = game.getCurrentRoom();
  return findItemByName(room.items, itemName);
}

export function getItemFromInventory(game: Game, itemName: string): Item | undefined {
  const inventory = game.getPlayersInventory();
  return findItemByName(inventory, itemName);
}

export function getRecipeByName(game: Game, recipeName: string): string | undefined {
  const recipes = game.getPlayerRecipes();
  const recipe = recipes.find(r => r.result.toLowerCase() === recipeName.toLowerCase());
  return recipe?.id;
}