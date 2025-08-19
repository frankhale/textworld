import { assertEquals } from "jsr:@std/assert";
import { Game } from "../game.ts";
import { ItemBuilder, RoomBuilder, PlayerBuilder } from "../builders.ts";
import { GameState } from "../types.ts";

Deno.test("Game initialization", () => {
  const room1 = new RoomBuilder("room1")
    .withDescription("A small room")
    .build();

  const player = new PlayerBuilder("room1").build();

  const initialState: GameState = {
    player,
    rooms: { room1 },
    items: {},
  };

  const game = new Game(initialState);
  assertEquals(game.getPlayersCurrentRoomId(), "room1");
  assertEquals(game.getPlayerHealth(), 100);
});

Deno.test("Player movement", () => {
  const room1 = new RoomBuilder("room1")
    .withDescription("A small room")
    .withExit("north", "room2")
    .build();

  const room2 = new RoomBuilder("room2")
    .withDescription("A larger room")
    .withExit("south", "room1")
    .build();

  const player = new PlayerBuilder("room1").build();

  const initialState: GameState = {
    player,
    rooms: { room1, room2 },
    items: {},
  };

  const game = new Game(initialState);
  assertEquals(game.move("north"), "A larger room\nExits: south\nItems: none");
  assertEquals(game.getPlayersCurrentRoomId(), "room2");
});

Deno.test("Item pickup and drop", () => {
  const item = new ItemBuilder("item1", "A shiny item")
    .withDescription("It's very shiny")
    .build();

  const room1 = new RoomBuilder("room1")
    .withDescription("A small room")
    .withItem(item)
    .build();

  const player = new PlayerBuilder("room1").build();

  const initialState: GameState = {
    player,
    rooms: { room1 },
    items: { item1: item },
  };

  const game = new Game(initialState);
  assertEquals(game.take("item1"), "Picked up A shiny item");
  assertEquals(game.inventory(), "A shiny item (1)");
  assertEquals(game.drop("item1"), "Dropped A shiny item");
  assertEquals(game.inventory(), "Inventory empty");
});

Deno.test("Player health modification", () => {
  const room1 = new RoomBuilder("room1")
    .withDescription("A small room")
    .build();

  const player = new PlayerBuilder("room1")
    .build();

  player.health = 50;

  const initialState: GameState = {
    player,
    rooms: { room1 },
    items: {},
  };

  const game = new Game(initialState);
  game.modifyPlayerHealth(h => h + 30);
  assertEquals(game.getPlayerHealth(), 80);
  game.modifyPlayerHealth(h => h - 100);
  assertEquals(game.getPlayerHealth(), 0);
});

Deno.test("Crafting items", () => {
  const herb = new ItemBuilder("herb", "Herb")
    .withDescription("A healing herb")
    .build();

  const potionRecipe = new ItemBuilder("potionRecipe", "Potion Recipe")
    .withDescription("A recipe for crafting health potions")
    .asRecipe({
      id: "potionRecipe",
      result: "potion",
      ingredients: ["herb"],
      description: "Creates a health potion from a herb",
    })
    .build();

  const potion = new ItemBuilder("potion", "Health Potion")
    .withDescription("Restores health")
    .build();

  const room1 = new RoomBuilder("room1")
    .withDescription("A small room")
    .build();

  const player = new PlayerBuilder("room1")
    .withItem(herb)
    .withItem(potionRecipe)
    .build();

  const initialState: GameState = {
    player,
    rooms: { room1 },
    items: { herb, potionRecipe, potion },
  };

  const game = new Game(initialState);
  assertEquals(game.learn("potionRecipe"), "Learned recipe: Creates a health potion from a herb");
  assertEquals(game.craft("potionRecipe"), "Crafted Health Potion");
  assertEquals(game.inventory(), "Health Potion (1)");
});
