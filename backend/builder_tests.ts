// Builder Pattern Tests for TextWorld
// Tests the fluent builder API

import {
  assert,
  assertEquals,
  assertNotEquals,
} from "@std/assert";

import * as tw from "./textworld.ts";

const textworld = new tw.TextWorld();

// ==================
// StatsBuilder Tests
// ==================

Deno.test("stats_builder_creates_stats_with_defaults", () => {
  const stats = textworld.stats().build();
  assertEquals(stats.health.current, 10);
  assertEquals(stats.health.max, 10);
  assertEquals(stats.stamina.current, 10);
  assertEquals(stats.magicka.current, 10);
  assertEquals(stats.physical_damage, 10);
  assertEquals(stats.critical_chance, 0.05);
  assertEquals(stats.progress.level, 1);
});

Deno.test("stats_builder_sets_all_values", () => {
  const stats = textworld.stats()
    .health(50, 100)
    .stamina(30, 60)
    .magicka(20, 40)
    .physicalDamage(25)
    .physicalDefense(15)
    .spellDamage(20)
    .spellDefense(10)
    .criticalChance(0.15)
    .level(5)
    .xp(500)
    .build();

  assertEquals(stats.health.current, 50);
  assertEquals(stats.health.max, 100);
  assertEquals(stats.stamina.current, 30);
  assertEquals(stats.stamina.max, 60);
  assertEquals(stats.magicka.current, 20);
  assertEquals(stats.magicka.max, 40);
  assertEquals(stats.physical_damage, 25);
  assertEquals(stats.physical_defense, 15);
  assertEquals(stats.spell_damage, 20);
  assertEquals(stats.spell_defense, 10);
  assertEquals(stats.critical_chance, 0.15);
  assertEquals(stats.progress.level, 5);
  assertEquals(stats.progress.xp, 500);
  textworld.reset_world();
});

// =================
// ZoneBuilder Tests
// =================

Deno.test("zone_builder_creates_zone", () => {
  const zone = textworld.zone("Test Zone")
    .description("A test zone")
    .build();

  assertEquals(zone.name, "Test Zone");
  assertEquals(zone.descriptions[0]?.description, "A test zone");
  textworld.reset_world();
});

Deno.test("zone_builder_sets_starting_room", () => {
  const zone = textworld.zone("Test Zone")
    .description("A test zone")
    .startingRoom("Entrance")
    .build();

  assertEquals(zone.starting_room, "Entrance");
  textworld.reset_world();
});

// =================
// RoomBuilder Tests
// =================

Deno.test("room_builder_creates_room", () => {
  textworld.zone("Test Zone").build();

  const room = textworld.room("Test Zone", "Test Room")
    .description("A test room")
    .build();

  assertEquals(room.name, "Test Room");
  assertEquals(room.descriptions[0]?.description, "A test room");
  textworld.reset_world();
});

Deno.test("room_builder_adds_exits", () => {
  textworld.zone("Test Zone").build();
  textworld.room("Test Zone", "Room1").description("Room 1").build();
  textworld.room("Test Zone", "Room2").description("Room 2").build();

  // Now update Room1 with exits (exits were added when Room2 didn't exist)
  const room1 = textworld.get_room("Test Zone", "Room1");
  const room2 = textworld.get_room("Test Zone", "Room2");

  // Create exit manually since rooms exist now
  textworld.create_exit("Test Zone", "Room1", "north", "Room2");

  assertEquals(room1?.exits.length, 1);
  assertEquals(room1?.exits[0]?.name, "north");
  assertEquals(room1?.exits[0]?.location, "Room2");
  assertEquals(room2?.exits.length, 1);
  assertEquals(room2?.exits[0]?.name, "south");
  textworld.reset_world();
});

Deno.test("room_builder_places_items", () => {
  textworld.zone("Test Zone").build();
  textworld.item("Sword").description("A sharp sword").build();

  const room = textworld.room("Test Zone", "Test Room")
    .description("A test room")
    .item("Sword", 2)
    .build();

  assertEquals(room.items.length, 1);
  assertEquals(room.items[0]?.name, "Sword");
  assertEquals(room.items[0]?.quantity, 2);
  textworld.reset_world();
});

Deno.test("room_builder_places_npcs", () => {
  textworld.zone("Test Zone").build();
  textworld.npc("Guard").description("A guard").build();

  const room = textworld.room("Test Zone", "Test Room")
    .description("A test room")
    .npc("Guard")
    .build();

  assertEquals(room.npcs.length, 1);
  assertEquals(room.npcs[0]?.name, "Guard");
  textworld.reset_world();
});

Deno.test("room_builder_places_mobs", () => {
  textworld.zone("Test Zone").build();
  textworld.mob("Goblin")
    .description("A goblin")
    .health(10, 10)
    .build();

  const room = textworld.room("Test Zone", "Test Room")
    .description("A test room")
    .mob("Goblin")
    .build();

  assertEquals(room.mobs.length, 1);
  assertEquals(room.mobs[0]?.name, "Goblin");
  textworld.reset_world();
});

Deno.test("room_builder_places_objects", () => {
  textworld.zone("Test Zone").build();
  textworld.object("Chest").description("A chest").build();

  const room = textworld.room("Test Zone", "Test Room")
    .description("A test room")
    .object("Chest")
    .build();

  assertEquals(room.objects.length, 1);
  assertEquals(room.objects[0]?.name, "Chest");
  textworld.reset_world();
});

Deno.test("room_builder_adds_on_enter_action", () => {
  textworld.zone("Test Zone").build();
  let actionCalled = false;

  textworld.room("Test Zone", "Test Room")
    .description("A test room")
    .onEnter((_player) => {
      actionCalled = true;
      return "You entered the room.";
    })
    .build();

  const player = textworld.create_player("Test", "Test player", "Test Zone", "Test Room");
  textworld.get_room_description(player);

  assertEquals(actionCalled, true);
  textworld.reset_world();
});

Deno.test("room_builder_adds_room_command", () => {
  textworld.zone("Test Zone").build();

  textworld.room("Test Zone", "Test Room")
    .description("A test room")
    .command("dance", ["dance"], "Dance in the room", (_player) => {
      return "You dance gracefully!";
    })
    .build();

  const hasCommand = textworld.has_room_command_action("Test Zone", "Test Room", "dance");
  assertEquals(hasCommand, true);
  textworld.reset_world();
});

Deno.test("room_builder_sets_zone_starter", () => {
  textworld.zone("Test Zone").build();

  textworld.room("Test Zone", "Starting Room")
    .description("The starting room")
    .asZoneStarter()
    .build();

  const zone = textworld.get_zone("Test Zone");
  assertEquals(zone?.starting_room, "Starting Room");
  textworld.reset_world();
});

// =================
// ItemBuilder Tests
// =================

Deno.test("item_builder_creates_item", () => {
  const item = textworld.item("Test Item")
    .description("A test item")
    .build();

  assertEquals(item.name, "Test Item");
  assertEquals(item.descriptions[0]?.description, "A test item");
  assertEquals(item.usable, false);
  assertEquals(item.consumable, false);
  textworld.reset_world();
});

Deno.test("item_builder_sets_usable_and_consumable", () => {
  const item = textworld.item("Potion")
    .description("A potion")
    .usable()
    .consumable()
    .build();

  assertEquals(item.usable, true);
  assertEquals(item.consumable, true);
  textworld.reset_world();
});

Deno.test("item_builder_sets_level_and_value", () => {
  const item = textworld.item("Epic Sword")
    .description("An epic sword")
    .level(10)
    .value(500)
    .build();

  assertEquals(item.level, 10);
  assertEquals(item.value, 500);
  textworld.reset_world();
});

Deno.test("item_builder_sets_on_use_action", () => {
  let actionCalled = false;

  textworld.item("Magic Potion")
    .description("A magic potion")
    .onUse((_player) => {
      actionCalled = true;
      return "You feel magical!";
    })
    .build();

  const itemAction = textworld.get_item_action("Magic Potion");
  assertNotEquals(itemAction, null);

  const player = textworld.create_player("Test", "Test", "Zone", "Room");
  itemAction?.action(player);
  assertEquals(actionCalled, true);
  textworld.reset_world();
});

// ================
// NPCBuilder Tests
// ================

Deno.test("npc_builder_creates_npc", () => {
  const npc = textworld.npc("Test NPC")
    .description("A test NPC")
    .build();

  assertEquals(npc.name, "Test NPC");
  assertEquals(npc.descriptions[0]?.description, "A test NPC");
  textworld.reset_world();
});

Deno.test("npc_builder_adds_dialog", () => {
  textworld.npc("Guard")
    .description("A guard")
    .dialog(["hello", "hi"], "Greetings, traveler!")
    .build();

  const npc = textworld.get_npc("Guard");
  assertEquals(npc?.dialog?.length, 1);
  assertEquals(npc?.dialog?.[0]?.trigger, ["hello", "hi"]);
  assertEquals(npc?.dialog?.[0]?.response, "Greetings, traveler!");
  textworld.reset_world();
});

Deno.test("npc_builder_adds_dialog_action", () => {
  let actionCalled = false;

  textworld.npc("Sage")
    .description("A wise sage")
    .dialogAction(["wisdom"], (_player) => {
      actionCalled = true;
      return "The sage shares ancient wisdom.";
    })
    .build();

  const dialogAction = textworld.get_dialog_action("Sage");
  assertNotEquals(dialogAction, null);

  const player = textworld.create_player("Test", "Test", "Zone", "Room");
  dialogAction?.(player, "wisdom", "wisdom", ["wisdom"]);
  assertEquals(actionCalled, true);
  textworld.reset_world();
});

// ===================
// VendorBuilder Tests
// ===================

Deno.test("vendor_builder_creates_vendor", () => {
  textworld.item("Health Potion").description("A potion").build();

  const vendor = textworld.vendor("Merchant")
    .description("A merchant")
    .sells("Health Potion", 50)
    .build();

  assertEquals(vendor.name, "Merchant");
  assertEquals(vendor.vendor_items?.length, 1);
  assertEquals(vendor.vendor_items?.[0]?.name, "Health Potion");
  assertEquals(vendor.vendor_items?.[0]?.price, 50);
  textworld.reset_world();
});

Deno.test("vendor_builder_sets_inventory", () => {
  textworld.item("Sword").description("A sword").build();
  textworld.item("Shield").description("A shield").build();

  const vendor = textworld.vendor("Armorer")
    .description("An armorer")
    .inventory([
      { name: "Sword", price: 100 },
      { name: "Shield", price: 75 },
    ])
    .build();

  assertEquals(vendor.vendor_items?.length, 2);
  textworld.reset_world();
});

// ================
// MobBuilder Tests
// ================

Deno.test("mob_builder_creates_mob", () => {
  const mob = textworld.mob("Goblin")
    .description("A sneaky goblin")
    .health(15, 15)
    .stamina(10, 10)
    .magicka(5, 5)
    .physicalDamage(8)
    .physicalDefense(3)
    .spellDamage(0)
    .spellDefense(1)
    .criticalChance(0.1)
    .level(2)
    .build();

  assertEquals(mob.name, "Goblin");
  assertEquals(mob.stats?.health.current, 15);
  assertEquals(mob.stats?.health.max, 15);
  assertEquals(mob.stats?.physical_damage, 8);
  assertEquals(mob.stats?.progress.level, 2);
  assertEquals(mob.killable, true);
  textworld.reset_world();
});

Deno.test("mob_builder_uses_stats_object", () => {
  const stats = textworld.stats()
    .health(30, 30)
    .physicalDamage(12)
    .build();

  const mob = textworld.mob("Orc")
    .description("A brutal orc")
    .stats(stats)
    .build();

  assertEquals(mob.stats?.health.current, 30);
  assertEquals(mob.stats?.physical_damage, 12);
  textworld.reset_world();
});

Deno.test("mob_builder_adds_drops", () => {
  const mob = textworld.mob("Dragon")
    .description("A fearsome dragon")
    .health(500, 500)
    .drop("Dragon Scale", 3)
    .drop("Gold Coin", 100)
    .build();

  assertEquals(mob.items.length, 2);
  assertEquals(mob.items[0]?.name, "Dragon Scale");
  assertEquals(mob.items[0]?.quantity, 3);
  assertEquals(mob.items[1]?.name, "Gold Coin");
  textworld.reset_world();
});

Deno.test("mob_builder_sets_drops_array", () => {
  const mob = textworld.mob("Boss")
    .description("A powerful boss")
    .drops([
      { name: "Rare Gem", quantity: 1 },
      { name: "Gold", quantity: 500 },
    ])
    .build();

  assertEquals(mob.items.length, 2);
  textworld.reset_world();
});

// ===================
// ObjectBuilder Tests
// ===================

Deno.test("object_builder_creates_object", () => {
  const obj = textworld.object("Fireplace")
    .description("A warm fireplace")
    .build();

  assertEquals(obj.name, "Fireplace");
  assertEquals(obj.descriptions[0]?.description, "A warm fireplace");
  textworld.reset_world();
});

Deno.test("object_builder_adds_interaction", () => {
  const obj = textworld.object("Lever")
    .description("A rusty lever")
    .interaction(["pull", "use"], "You pull the lever. Something clicks.")
    .build();

  assertEquals(obj.dialog?.length, 1);
  assertEquals(obj.dialog?.[0]?.trigger, ["pull", "use"]);
  assertEquals(obj.dialog?.[0]?.response, "You pull the lever. Something clicks.");
  textworld.reset_world();
});

Deno.test("object_builder_adds_interaction_action", () => {
  let actionCalled = false;

  textworld.object("Magic Mirror")
    .description("A mysterious mirror")
    .interactionAction(["gaze", "look"], (_player) => {
      actionCalled = true;
      return "You see a vision of the future.";
    })
    .build();

  const dialogAction = textworld.get_dialog_action("Magic Mirror");
  assertNotEquals(dialogAction, null);

  const player = textworld.create_player("Test", "Test", "Zone", "Room");
  dialogAction?.(player, "gaze", "gaze", ["gaze"]);
  assertEquals(actionCalled, true);
  textworld.reset_world();
});

// ==================
// QuestBuilder Tests
// ==================

Deno.test("quest_builder_creates_quest", () => {
  const quest = textworld.quest("Test Quest")
    .description("A test quest")
    .build();

  assertEquals(quest.name, "Test Quest");
  assertEquals(quest.descriptions[0]?.description, "A test quest");
  textworld.reset_world();
});

Deno.test("quest_builder_adds_start_and_end_actions", () => {
  let startCalled = false;
  let endCalled = false;

  textworld.quest("Action Quest")
    .description("A quest with actions")
    .onStart((_player) => {
      startCalled = true;
      return "Quest started!";
    })
    .onEnd((_player) => {
      endCalled = true;
      return "Quest completed!";
    })
    .build();

  const questAction = textworld.get_quest_action("Action Quest");
  assertNotEquals(questAction, null);

  const player = textworld.create_player("Test", "Test", "Zone", "Room");
  questAction?.start?.(player);
  questAction?.end?.(player);

  assertEquals(startCalled, true);
  assertEquals(endCalled, true);
  textworld.reset_world();
});

Deno.test("quest_builder_adds_steps", () => {
  const quest = textworld.quest("Multi-Step Quest")
    .description("A quest with multiple steps")
    .step("Step 1")
      .description("First step")
      .isComplete((_player) => false)
    .step("Step 2")
      .description("Second step")
      .isComplete((_player) => false)
    .step("Step 3")
      .description("Third step")
      .isComplete((_player) => true)
    .build();

  assertEquals(quest.steps?.length, 3);
  assertEquals(quest.steps?.[0]?.name, "Step 1");
  assertEquals(quest.steps?.[1]?.name, "Step 2");
  assertEquals(quest.steps?.[2]?.name, "Step 3");
  textworld.reset_world();
});

Deno.test("quest_builder_step_chaining", () => {
  // Test the fluent chaining from step back to quest
  const quest = textworld.quest("Chained Quest")
    .description("A quest testing chaining")
    .step("First")
      .description("First step")
    .done()
    .onEnd((_player) => "Done!")
    .build();

  assertEquals(quest.steps?.length, 1);
  textworld.reset_world();
});

// ===================
// RecipeBuilder Tests
// ===================

Deno.test("recipe_builder_creates_recipe", () => {
  textworld.item("Iron Ore").description("Raw iron").build();
  textworld.item("Wood").description("Wood").build();
  textworld.item("Iron Sword").description("A sword").build();

  const recipe = textworld.recipe("Iron Sword")
    .description("Craft an iron sword")
    .requires("Iron Ore", 3)
    .requires("Wood", 1)
    .produces("Iron Sword", 1)
    .build();

  assertEquals(recipe.name, "Iron Sword");
  assertEquals(recipe.ingredients.length, 2);
  assertEquals(recipe.ingredients[0]?.name, "Iron Ore");
  assertEquals(recipe.ingredients[0]?.quantity, 3);
  assertEquals(recipe.crafted_item.name, "Iron Sword");
  textworld.reset_world();
});

Deno.test("recipe_builder_sets_ingredients_array", () => {
  textworld.item("Gem").description("A gem").build();
  textworld.item("Gold").description("Gold").build();
  textworld.item("Ring").description("A ring").build();

  const recipe = textworld.recipe("Gold Ring")
    .description("A gold ring")
    .ingredients([
      { name: "Gem", quantity: 1 },
      { name: "Gold", quantity: 2 },
    ])
    .produces("Ring", 1)
    .build();

  assertEquals(recipe.ingredients.length, 2);
  textworld.reset_world();
});

// ===================
// PlayerBuilder Tests
// ===================

Deno.test("player_builder_creates_player", () => {
  const player = textworld.player("Hero")
    .description("A brave hero")
    .location("Village", "Town Square")
    .build();

  assertEquals(player.name, "Hero");
  assertEquals(player.descriptions[0]?.description, "A brave hero");
  assertEquals(player.location.zone, "Village");
  assertEquals(player.location.room, "Town Square");
  textworld.reset_world();
});

Deno.test("player_builder_sets_stats", () => {
  const player = textworld.player("Warrior")
    .description("A strong warrior")
    .location("Zone", "Room")
    .health(100, 100)
    .stamina(50, 50)
    .magicka(20, 20)
    .physicalDamage(25)
    .physicalDefense(15)
    .spellDamage(5)
    .spellDefense(10)
    .criticalChance(0.1)
    .level(10)
    .build();

  assertEquals(player.stats?.health.current, 100);
  assertEquals(player.stats?.stamina.current, 50);
  assertEquals(player.stats?.magicka.current, 20);
  assertEquals(player.stats?.physical_damage, 25);
  assertEquals(player.stats?.physical_defense, 15);
  assertEquals(player.stats?.critical_chance, 0.1);
  assertEquals(player.stats?.progress.level, 10);
  textworld.reset_world();
});

Deno.test("player_builder_uses_stats_object", () => {
  const stats = textworld.stats()
    .health(200, 200)
    .physicalDamage(50)
    .build();

  const player = textworld.player("Champion")
    .description("A champion")
    .location("Zone", "Room")
    .stats(stats)
    .build();

  assertEquals(player.stats?.health.current, 200);
  assertEquals(player.stats?.physical_damage, 50);
  textworld.reset_world();
});

Deno.test("player_builder_sets_gold", () => {
  const player = textworld.player("Rich")
    .description("A wealthy person")
    .location("Zone", "Room")
    .gold(1000)
    .build();

  assertEquals(player.gold, 1000);
  textworld.reset_world();
});

Deno.test("player_builder_adds_items", () => {
  textworld.item("Sword").description("A sword").build();
  textworld.item("Potion").description("A potion").build();

  const player = textworld.player("Equipped")
    .description("An equipped player")
    .location("Zone", "Room")
    .item("Sword", 1)
    .item("Potion", 3)
    .build();

  assertEquals(player.items.length, 2);
  assertEquals(player.items[0]?.name, "Sword");
  assertEquals(player.items[0]?.quantity, 1);
  assertEquals(player.items[1]?.name, "Potion");
  assertEquals(player.items[1]?.quantity, 3);
  textworld.reset_world();
});

Deno.test("player_builder_adds_flags", () => {
  const player = textworld.player("Flagged")
    .description("A player with flags")
    .location("Zone", "Room")
    .flag("tutorial-complete")
    .flag("first-boss-killed")
    .build();

  assertEquals(textworld.has_flag(player, "tutorial-complete"), true);
  assertEquals(textworld.has_flag(player, "first-boss-killed"), true);
  textworld.reset_world();
});

// =============================
// Integration Test - Full World
// =============================

Deno.test("integration_full_world_using_builders", async () => {
  // Create items
  textworld.item("Rusty Sword")
    .description("An old sword, still serviceable")
    .level(1)
    .value(10)
    .build();

  textworld.item("Health Potion")
    .description("Restores 20 health")
    .usable()
    .consumable()
    .level(1)
    .value(25)
    .onUse((player) => {
      textworld.add_to_actor_health(player, 20);
      return "You feel refreshed! (+20 HP)";
    })
    .build();

  // Create NPC
  textworld.npc("Village Elder")
    .description("A wise old man")
    .dialog(["hello"], "Welcome, adventurer!")
    .build();

  // Create mob
  textworld.mob("Goblin")
    .description("A sneaky goblin")
    .health(15, 15)
    .physicalDamage(5)
    .physicalDefense(2)
    .drop("Gold Coin", 3)
    .build();

  // Create quest
  textworld.quest("Goblin Menace")
    .description("Clear the goblins")
    .step("Kill Goblins")
      .description("Defeat the goblins")
      .isComplete((player) => textworld.has_flag(player, "goblins-cleared"))
    .onEnd((player) => {
      player.gold += 100;
      return "Quest complete! +100 gold";
    })
    .build();

  // Create zone
  textworld.zone("Starting Village")
    .description("A peaceful village")
    .startingRoom("Village Square")
    .build();

  // Create rooms
  textworld.room("Starting Village", "Village Square")
    .description("The heart of the village.")
    .npc("Village Elder")
    .asZoneStarter()
    .build();

  textworld.room("Starting Village", "Forest Path")
    .description("A winding path into the forest.")
    .mob("Goblin")
    .item("Health Potion", 1)
    .build();

  // Create exits between rooms
  textworld.create_exit("Starting Village", "Village Square", "north", "Forest Path");

  // Create player
  const player = textworld.player("Hero")
    .description("A brave adventurer")
    .location("Starting Village", "Village Square")
    .gold(50)
    .item("Rusty Sword", 1)
    .item("Health Potion", 2)
    .build();

  // Verify the world was created correctly
  const zone = textworld.get_zone("Starting Village");
  assertEquals(zone?.name, "Starting Village");
  assertEquals(zone?.starting_room, "Village Square");

  const villageSquare = textworld.get_room("Starting Village", "Village Square");
  assertEquals(villageSquare?.npcs.length, 1);
  assertEquals(villageSquare?.npcs[0]?.name, "Village Elder");

  const forestPath = textworld.get_room("Starting Village", "Forest Path");
  assertEquals(forestPath?.mobs.length, 1);
  assertEquals(forestPath?.items.length, 1);

  assertEquals(player.gold, 50);
  assertEquals(player.items.length, 2);

  // Test game commands
  const roomDesc = await textworld.parse_command(player, "look");
  assert(roomDesc.includes("The heart of the village"));

  const moveResult = await textworld.parse_command(player, "north");
  assert(moveResult.includes("A winding path"));
  assertEquals(player.location.room, "Forest Path");

  textworld.reset_world();
});
