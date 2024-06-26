// A Text Adventure Library & Game for Deno
// Frank Hale &lt;frankhaledevelops AT gmail.com&gt;
// 8 December 2023

import { assertEquals } from "https://deno.land/std@0.217.0/assert/assert_equals.ts";
import { assertNotEquals } from "https://deno.land/std@0.217.0/assert/assert_not_equals.ts";
import { assertStringIncludes } from "https://deno.land/std@0.217.0/assert/assert_string_includes.ts";

import * as tw from "./textworld.ts";

// REF: https://stackoverflow.com/questions/14226803/wait-5-seconds-before-executing-next-line
const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

const textworld = new tw.TextWorld();
const player = textworld.create_player(
  "Player",
  "You are a strong adventurer",
  "Zone1",
  "Room1"
);

Deno.test("can_get_player", () => {
  const p1 = textworld.get_player(player.id!);
  assertEquals(p1?.name, "Player");
  textworld.reset_world();
});

Deno.test("can_create_quest", () => {
  textworld.create_quest("Quest1", "A quest");
  const quest = textworld.get_quest("Quest1");
  assertEquals(quest?.name, "Quest1");
  player.quests.length = 0;
  textworld.reset_world();
});

Deno.test("can_add_quest_step_to_quest", () => {
  textworld.create_quest("Quest1", "A quest");
  textworld.add_quest_step("Quest1", "Step1", "A step");
  const quest = textworld.get_quest("Quest1");
  assertEquals(quest?.steps?.length, 1);
  player.quests.length = 0;
  textworld.reset_world();
});

Deno.test("can_add_quest_step_to_quest_with_action", () => {
  textworld.create_quest("Quest1", "A quest");
  textworld.add_quest_step("Quest1", "Step1", "A step", (_player) => {
    return true;
  });
  const quest = textworld.get_quest("Quest1");
  assertEquals(quest?.steps?.length, 1);
  const quest_step_action = textworld.get_quest_step_action("Quest1", "Step1");
  assertNotEquals(quest_step_action, null);
  player.quests.length = 0;
  textworld.reset_world();
});

Deno.test("can_create_room", () => {
  textworld.create_zone("Zone1");
  const zone = textworld.get_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  assertEquals(zone.rooms.length, 1);
  textworld.reset_world();
});

Deno.test("can_create_alternate_room_description", () => {
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.add_room_description(
    "Zone1",
    "Room1",
    "room1-alt",
    "This is room 1, again!"
  );
  const room = textworld.get_room("Zone1", "Room1");
  assertEquals(room?.descriptions.length, 2);
  textworld.reset_world();
});

Deno.test("can_show_alternate_room_description", () => {
  player.zone = "Zone1";
  player.room = "Room1";
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.add_room_description(
    "Zone1",
    "Room1",
    "room1-alt",
    "This is an alternate room1 description!"
  );
  let result = textworld.get_room_description(player);
  assertEquals(result, "Location: Room1\n\nThis is room 1");
  textworld.set_flag(player, "room1-alt");
  result = textworld.get_room_description(player);
  assertEquals(
    result,
    "Location: Room1\n\nThis is an alternate room1 description!"
  );
  player.flags.length = 0;
  textworld.reset_world();
});

Deno.test("can_show_alternate_room_description_and_switch_to_default", () => {
  player.zone = "Zone1";
  player.room = "Room1";
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.add_room_description(
    "Zone1",
    "Room1",
    "room1-alt",
    "This is an alternate room1 description!"
  );
  let result = textworld.get_room_description(player);
  assertEquals(result, "Location: Room1\n\nThis is room 1");
  textworld.set_flag(player, "room1-alt");
  result = textworld.get_room_description(player);
  assertEquals(
    result,
    "Location: Room1\n\nThis is an alternate room1 description!"
  );
  player.flags.length = 0;
  result = textworld.get_room_description(player);
  assertEquals(result, "Location: Room1\n\nThis is room 1");
  textworld.reset_world();
});

Deno.test("can_remove_room", () => {
  textworld.create_zone("Zone1");
  const zone = textworld.get_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.remove_room("Zone1", "Room1");
  assertEquals(zone.rooms.length, 0);
  textworld.reset_world();
});

Deno.test("can_create_exit", () => {
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_room("Zone1", "Room2", "This is room 2");
  textworld.create_exit("Zone1", "Room1", "north", "Room2");
  const exit = textworld.get_exit("Zone1", "Room1", "north");
  assertEquals(exit?.name, "north");
  assertEquals(exit?.location, "Room2");
  textworld.reset_world();
});

Deno.test("can_remove_exit", () => {
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_room("Zone1", "Room2", "This is room 2");
  textworld.create_exit("Zone1", "Room1", "north", "Room2");
  textworld.remove_exit("Zone1", "Room1", "north");
  const room = textworld.get_room("Zone1", "Room1");
  assertEquals(room?.exits.length, 0);
  textworld.reset_world();
});

Deno.test("can_create_room_with_action", () => {
  player.zone = "Zone1";
  player.room = "Room1";
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_room("Zone1", "Room2", "This is room 2", (_player) => {
    return `The healing waters have no effect on you.`;
  });
  textworld.create_exit("Zone1", "Room1", "north", "Room2");
  const result = textworld.switch_room(player, "north");
  assertEquals(
    result,
    `Location: Room2\n\nThis is room 2\n\nExits: south\n\nThe healing waters have no effect on you.`
  );
  textworld.reset_world();
});

Deno.test("can_create_recipe", () => {
  textworld.create_recipe(
    "Iron Sword",
    "A quality sword for the everyday fighter",
    [
      { name: "Iron", quantity: 2 },
      { name: "Wood", quantity: 1 },
    ],
    { name: "Iron Sword", quantity: 1 }
  );
  const recipe = textworld.get_recipe("Iron Sword");
  assertEquals(recipe?.name, "Iron Sword");
  textworld.reset_world();
});

Deno.test("can_create_item", () => {
  textworld.create_item("Sword", "A sharp sword", false);
  const item = textworld.get_item("Sword");
  assertEquals(item?.name, "Sword");
  textworld.reset_world();
});

Deno.test("can_create_item_with_action", () => {
  textworld.create_item("Potion", "A potion", true, (_player) => {
    return "You drank the potion but nothing happened.";
  });
  const item = textworld.get_item("Potion");
  assertEquals(item?.name, "Potion");
  const item_action = textworld.get_item_action("Potion");
  assertEquals(
    item_action?.action(player),
    "You drank the potion but nothing happened."
  );
  textworld.reset_world();
});

Deno.test("can_place_item_in_room", () => {
  player.zone = "Zone1";
  player.room = "Room1";
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_item("Sword", "A sharp sword", false);
  textworld.place_item("Zone1", "Room1", "Sword");
  const item = textworld.get_room_item("Zone1", "Room1", "Sword");
  assertEquals(item?.name, "Sword");
  textworld.reset_world();
});

Deno.test("can_create_mob", () => {
  textworld.create_mob(
    "Goblin",
    "A small goblin",
    textworld.create_resources(10, 10, 10, 10, 10, 10),
    textworld.create_damage_and_defense(15, 8, 5, 2, 0.05),
    []
  );
  const mob = textworld.get_mob("Goblin");
  assertEquals(mob?.name, "Goblin");
  textworld.reset_world();
});

Deno.test("can_place_mob_in_room", () => {
  player.zone = "Zone1";
  player.room = "Room1";
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_mob(
    "Goblin",
    "A small goblin",
    textworld.create_resources(10, 10, 10, 10, 10, 10),
    textworld.create_damage_and_defense(15, 8, 5, 2, 0.05),
    []
  );
  textworld.place_mob("Zone1", "Room1", "Goblin");
  const room = textworld.get_room("Zone1", "Room1");
  assertEquals(room?.mobs.length, 1);
  assertEquals(room?.mobs[0].name, "Goblin");
  textworld.reset_world();
});

Deno.test("can_create_npc", () => {
  textworld.create_npc("Guard", "A strong guard");
  const npc = textworld.get_npc("Guard");
  assertEquals(npc?.name, "Guard");
  textworld.reset_world();
});

Deno.test("can_create_npc_with_dialog", () => {
  textworld.create_npc("Guard", "A strong guard");
  textworld.create_dialog(
    "Guard",
    ["Hello"],
    "Hello citizen, make sure you mind the law!",
    null
  );
  const npc = textworld.get_npc("Guard");
  assertEquals(npc?.name, "Guard");
  assertEquals(npc?.dialog?.length, 1);
  textworld.reset_world();
});

Deno.test("can_create_vendor", () => {
  textworld.create_vendor("Vendor1", "A friendly food vendor", [
    { name: "Fried Chicken & Roasted Vegetables", price: 2 },
    { name: "Steak & Potatoes with Gravy", price: 3 },
  ]);
  const vendor = textworld.get_npc("Vendor1");
  assertEquals(vendor?.name, "Vendor1");
  assertEquals(vendor?.vendor_items?.length, 2);
  textworld.reset_world();
});

Deno.test("can_remove_npc", () => {
  textworld.create_npc("Guard", "A strong guard");
  textworld.remove_npc("Guard");
  const npc = textworld.get_npc("Guard");
  assertEquals(npc, null);
  textworld.reset_world();
});

Deno.test("can_add_room_command_action", () => {
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.add_room_command_action(
    "Zone1",
    "Room1",
    "xyzzy action",
    "You recited the magical word XYZZY!!!",
    ["xyzzy"],
    (_player: tw.Player, _input: string, _command: string, _args: string[]) =>
      "How dare you utter the magical word XYZZY!"
  );
  const has_room_action = textworld.has_room_command_action(
    "Zone1",
    "Room1",
    "xyzzy action"
  );
  assertEquals(has_room_action, true);
  textworld.reset_world();
});

Deno.test("can_add_flag_on_player", () => {
  textworld.set_flag(player, "flag1");
  const has_flag = textworld.has_flag(player, "flag1");
  assertEquals(has_flag, true);
  player.flags.length = 0;
  textworld.reset_world();
});

Deno.test("can_remove_flag_on_player", () => {
  textworld.set_flag(player, "flag1");
  textworld.remove_flag(player, "flag1");
  const has_flag = textworld.has_flag(player, "flag1");
  assertEquals(has_flag, false);
  textworld.reset_world();
});

Deno.test("can_remove_room_command_action", () => {
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.add_room_command_action(
    "Zone1",
    "Room1",
    "xyzzy action",
    "You recited the magical word XYZZY!!!",
    ["xyzzy"],
    (_player: tw.Player, _input: string, _command: string, _args: string[]) =>
      "How dare you utter the magical word XYZZY!"
  );
  textworld.remove_room_command_action("Zone1", "Room1", "xyzzy action");
  const has_room_action = textworld.has_room_command_action(
    "Zone1",
    "Room1",
    "xyzzy action"
  );
  assertEquals(has_room_action, false);
  textworld.reset_world();
});

Deno.test("can_generate_command_combinations", () => {
  const result = textworld.generate_combinations(["take", "sword"]);
  assertEquals(result, ["take", "take sword", "sword"]);
  assertEquals(result.length, 3);
  textworld.reset_world();
});

Deno.test("can_place_npc_in_room", () => {
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_npc("Guard", "A strong guard");
  textworld.place_npc("Zone1", "Room1", "Guard");
  const npc = textworld.get_room_npc("Zone1", "Room1", "Guard");
  assertEquals(npc?.name, "Guard");
  textworld.reset_world();
});

Deno.test("can_set_and_remove_godmode_on_player", () => {
  textworld.set_godmode(player);
  let result = textworld.has_flag(player, "godmode");
  assertEquals(result, true);
  textworld.remove_godmode(player);
  result = textworld.has_flag(player, "godmode");
  assertEquals(result, false);
});

Deno.test("can_create_room_object", () => {
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_and_place_room_object(
    "Zone1",
    "Room1",
    "Fireplace",
    "A warm fire burns in the fireplace and you can feel the heat radiating from it."
  );
  const object = textworld.get_room_object("Zone1", "Room1", "Fireplace");
  assertEquals(object?.name, "Fireplace");
  assertEquals(
    object?.descriptions[0].description,
    "A warm fire burns in the fireplace and you can feel the heat radiating from it."
  );
  textworld.reset_world();
});

Deno.test("can_process_look_at_room_object", () => {
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_and_place_room_object(
    "Zone1",
    "Room1",
    "Fireplace",
    "A warm fire burns in the fireplace and you can feel the heat radiating from it."
  );
  const result = textworld.look_at_or_examine_object(
    player,
    "look at fireplace",
    "look at",
    ["look", "at", "fireplace"]
  );
  assertEquals(
    result,
    "A warm fire burns in the fireplace and you can feel the heat radiating from it."
  );
  textworld.reset_world();
});

Deno.test("can_process_examine_room_object", () => {
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_and_place_room_object(
    "Zone1",
    "Room1",
    "Fireplace",
    "A warm fire burns in the fireplace and you can feel the heat radiating from it.",
    [
      {
        group: "Fireplace",
        trigger: ["fan flame"],
        response: "The flames become stronger as you fan them.",
      },
    ]
  );
  const result = textworld.look_at_or_examine_object(
    player,
    "examine fireplace fan flame",
    "examine",
    ["examine", "fireplace", "fan", "flame"]
  );
  assertEquals(result, "The flames become stronger as you fan them.");
  textworld.reset_world();
});

Deno.test("can_process_get_room_description_with_no_rooms", () => {
  const result = textworld.get_room_description(player);
  assertEquals(result, "You can't see anything.");
});

Deno.test("can_process_get_exit_with_no_rooms", () => {
  try {
    textworld.get_exit("Zone1", "Room1", "north");
  } catch (e) {
    assertEquals(e.message, "The room or zone does not exist.");
  }
});

Deno.test("can_parse_command_examine_room_object", async () => {
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_and_place_room_object(
    "Zone1",
    "Room1",
    "Fireplace",
    "A warm fire burns in the fireplace and you can feel the heat radiating from it.",
    [
      {
        group: "Fireplace",
        trigger: ["fan flame"],
        response: "The flames become stronger as you fan them.",
      },
    ]
  );
  const result = await textworld.parse_command(
    player,
    "examine fireplace fan flame"
  );
  assertEquals(result, "The flames become stronger as you fan them.");
  textworld.reset_world();
});

Deno.test("can_parse_command_attack_mob", async () => {
  player.zone = "Zone1";
  player.room = "Room1";
  player.stats.health.current = 100;
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_mob(
    "Goblin",
    "A small goblin",
    textworld.create_resources(10, 10, 10, 10, 10, 10),
    textworld.create_damage_and_defense(15, 8, 5, 2, 0.05),
    []
  );
  textworld.place_mob("Zone1", "Room1", "Goblin");
  const result = await textworld.parse_command(player, "attack goblin");
  assertStringIncludes(result, "Player attacks Goblin");
  player.stats.health.current = 100;
  textworld.reset_world();
});

Deno.test("can_parse_command_direction", async () => {
  player.zone = "Zone1";
  player.room = "Room1";
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_room("Zone1", "Room2", "This is room 2");
  textworld.create_exit("Zone1", "Room1", "north", "Room2");
  const result = await textworld.parse_command(player, "north");
  assertEquals(result, "Location: Room2\n\nThis is room 2\n\nExits: south");
  textworld.reset_world();
});

Deno.test("can_parse_command_goto_room", async () => {
  player.zone = "Zone1";
  player.room = "Room1";
  textworld.set_godmode(player);
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "The Room1", "This is room 1");
  textworld.create_room("Zone1", "The Room2", "This is room 2");
  const result = await textworld.parse_command(player, "goto room The Room2");
  assertEquals(result, "Location: The Room2\n\nThis is room 2");
  textworld.remove_godmode(player);
  textworld.reset_world();
});

Deno.test("can_parse_command_goto_zone", async () => {
  player.zone = "Zone1";
  player.room = "Room1";
  textworld.set_godmode(player);
  textworld.create_zone("Zone1");
  textworld.create_zone("Zone2");
  textworld.create_room("Zone1", "The Room1", "This is room 1");
  textworld.create_room("Zone2", "The Forest", "This is the forest");
  textworld.set_room_as_zone_starter("Zone2", "The Forest");
  const result = await textworld.parse_command(player, "goto zone Zone2");
  assertEquals(result, "Location: The Forest\n\nThis is the forest");
  textworld.remove_godmode(player);
  textworld.reset_world();
});

Deno.test("can_parse_command_take", async () => {
  player.zone = "Zone1";
  player.room = "Room1";
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_item("Sword", "A sharp sword", false);
  textworld.place_item("Zone1", "Room1", "Sword");
  const result = await textworld.parse_command(player, "take sword");
  assertEquals(result, "You took the Sword.");
  assertEquals(player.items.length, 1);
  player.items.length = 0;
  textworld.reset_world();
});

Deno.test("can_parse_command_take_all", async () => {
  player.zone = "Zone1";
  player.room = "Room1";
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_item("Sword", "A sharp sword", false);
  textworld.create_item("Potion", "An ordinary potion", true);
  textworld.place_item("Zone1", "Room1", "Sword");
  textworld.place_item("Zone1", "Room1", "Potion", 2);
  const result = await textworld.parse_command(player, "take all");
  assertEquals(result, "You took all items.");
  assertEquals(player.items.length, 2);
  player.items.length = 0;
  textworld.reset_world();
});

Deno.test("can_parse_command_use", async () => {
  player.zone = "Zone1";
  player.room = "Room1";
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_item("Potion", "An ordinary potion", true, (_player) => {
    return "You drank the potion but nothing happened.";
  });
  textworld.place_item("Zone1", "Room1", "Potion");
  textworld.take_item(player, ["Potion"]);
  const result = await textworld.parse_command(player, "use potion");
  assertEquals(result, "You drank the potion but nothing happened.");
  assertEquals(player.items.length, 0);
  player.items.length = 0;
  textworld.reset_world();
});

Deno.test("can_parse_command_drop", async () => {
  player.zone = "Zone1";
  player.room = "Room1";
  textworld.create_zone("Zone1");
  textworld.create_item("Potion", "An ordinary potion", true);
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.place_item("Zone1", "Room1", "Potion");
  textworld.take_item(player, ["Potion"]);
  const result = await textworld.parse_command(player, "drop potion");
  assertEquals(result, "You dropped the Potion.");
  assertEquals(player.items.length, 0);
  player.items.length = 0;
  textworld.reset_world();
});

Deno.test("can_parse_command_drop_all", async () => {
  player.zone = "Zone1";
  player.room = "Room1";
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_item("Sword", "A sharp sword", false);
  textworld.create_item("Potion", "An ordinary potion", true);
  textworld.place_item("Zone1", "Room1", "Sword");
  textworld.place_item("Zone1", "Room1", "Potion", 2);
  textworld.take_all_items(player);
  const result = await textworld.parse_command(player, "drop all");
  assertEquals(result, "You dropped all your items.");
  assertEquals(player.items.length, 0);
  player.items.length = 0;
  textworld.reset_world();
});

Deno.test("can_parse_command_look", async () => {
  player.zone = "Zone1";
  player.room = "Room1";
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  const result = await textworld.parse_command(player, "look");
  assertEquals(result, "This is room 1");
  textworld.reset_world();
});

Deno.test("can_parse_command_look_at_self", async () => {
  const result = await textworld.parse_command(player, "look self");
  assertEquals(result, "You are a strong adventurer");
});

Deno.test("can_parse_command_look_at_object", async () => {
  player.zone = "Zone1";
  player.room = "Room1";
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_and_place_room_object(
    "Zone1",
    "Room1",
    "Sword",
    "A sharp sword"
  );
  const result = await textworld.parse_command(player, "look at sword");
  assertEquals(result, "A sharp sword");
  textworld.reset_world();
});

Deno.test("can_parse_command_examine_object", async () => {
  player.zone = "Zone1";
  player.room = "Room1";
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_and_place_room_object(
    "Zone1",
    "Room1",
    "Fireplace",
    "A warm fire burns in the fireplace and you can feel the heat radiating from it.",
    [
      {
        group: "Fireplace",
        trigger: ["fan flames"],
        response: "The flames become stronger as you fan them.",
      },
    ]
  );
  const result = await textworld.parse_command(
    player,
    "examine fireplace fan flames"
  );
  assertEquals(result, "The flames become stronger as you fan them.");
  textworld.reset_world();
});

Deno.test("can_parse_command_inspect_room_with_no_items", async () => {
  player.zone = "Zone1";
  player.room = "Room1";
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  const result = await textworld.parse_command(player, "inspect");
  assertEquals(
    result,
    "You inspect the room and found:\n\nThere is nothing else of interest here."
  );
  textworld.reset_world();
});

Deno.test("can_parse_command_inspect_room_with_items", async () => {
  player.zone = "Zone1";
  player.room = "Room1";
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_item("Sword", "A sharp sword", false);
  textworld.create_item("Potion", "An ordinary potion", true);
  textworld.place_item("Zone1", "Room1", "Sword");
  textworld.place_item("Zone1", "Room1", "Potion", 2);
  const result = await textworld.parse_command(player, "inspect");
  assertEquals(
    result,
    "You inspect the room and found:\n\nItems: Sword (1), Potion (2)"
  );
  textworld.reset_world();
});

Deno.test("can_parse_command_show_item", async () => {
  player.zone = "Zone1";
  player.room = "Room1";
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_item("Potion", "An ordinary potion", true);
  textworld.place_item("Zone1", "Room1", "Potion", 2);
  textworld.take_item(player, ["Potion"]);
  const result = await textworld.parse_command(player, "show potion");
  assertEquals(result, "An ordinary potion");
  player.items.length = 0;
  textworld.reset_world();
});

Deno.test("can_parse_command_show_all_items", async () => {
  player.zone = "Zone1";
  player.room = "Room1";
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_item("Sword", "A sharp sword", false);
  textworld.create_item("Potion", "An ordinary potion", true);
  textworld.place_item("Zone1", "Room1", "Sword");
  textworld.place_item("Zone1", "Room1", "Potion", 2);
  textworld.take_all_items(player);
  const result = await textworld.parse_command(player, "show all");
  assertEquals(result, "Sword - A sharp sword\n\nPotion - An ordinary potion");
  player.items.length = 0;
  textworld.reset_world();
});

Deno.test("can_parse_command_show_quests", async () => {
  textworld.create_quest("Kill the dragon", "Kill the dragon");
  textworld.pickup_quest(player, "Kill the dragon");
  const result = await textworld.parse_command(player, "show quests");
  assertEquals(result, "Kill the dragon - Kill the dragon");
  player.quests.length = 0;
  textworld.reset_world();
});

Deno.test(
  "can_parse_command_show_quests_with_empty_quest_journal",
  async () => {
    const result = await textworld.parse_command(player, "show quests");
    assertEquals(result, "You have no quests.");
    textworld.reset_world();
  }
);

Deno.test("can_parse_command_talk_to_npc", async () => {
  player.zone = "Zone1";
  player.room = "Room1";
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_npc("Guard", "A strong guard");
  textworld.create_dialog(
    "Guard",
    ["hello"],
    "Hello citizen, make sure you mind the law!",
    null
  );
  textworld.place_npc("Zone1", "Room1", "Guard");
  const result = await textworld.parse_command(
    player,
    "talk to Guard say hello"
  );
  assertEquals(result, "Hello citizen, make sure you mind the law!");
  textworld.reset_world();
});

Deno.test("can_parse_command_talk_to_npc_and_get_item", async () => {
  player.zone = "Zone1";
  player.room = "Room1";
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_npc("Old_woman", "An ordinary old woman");
  textworld.create_dialog(
    "Old_woman",
    ["hello", "hi"],
    null,
    (player, _input, _command, _args) => {
      if (textworld.has_flag(player, "took_gem")) {
        return "Hi, how are you?";
      } else {
        return "Hi, I have a gem you may want!";
      }
    }
  );
  textworld.create_dialog(
    "Old_woman",
    ["take"],
    null,
    (player, _input, _command, args) => {
      if (args.length !== 0) {
        if (!textworld.has_flag(player, "took_gem")) {
          const possible_items = textworld.generate_combinations(args);
          const item = possible_items.find((item) => {
            return item === "gem";
          });

          if (item) {
            textworld.set_flag(player, "took_gem");
            textworld.create_item("Gem", "A shiny gem", false);
            player.items.push({
              name: "Gem",
              quantity: 1,
            });

            return "You took the Gem.";
          } else {
            return "I don't have that item.";
          }
        } else {
          return "I don't have that item.";
        }
      } else {
        return "Take what?";
      }
    }
  );
  textworld.place_npc("Zone1", "Room1", "Old_woman");
  let result = await textworld.parse_command(
    player,
    "talk to Old_woman say hello"
  );
  assertEquals(result, "Hi, I have a gem you may want!");
  result = await textworld.parse_command(
    player,
    "talk to Old_woman say take gem"
  );
  assertEquals(result, "You took the Gem.");
  assertEquals(player.items.length, 1);
  result = await textworld.parse_command(
    player,
    "talk to Old_woman say take gem"
  );
  assertEquals(result, "I don't have that item.");
  textworld.remove_flag(player, "took_gem");
  player.items.length = 0;
  textworld.reset_world();
});

Deno.test("can_parse_command_talk_to_vendor_and_list_items", async () => {
  player.zone = "Zone1";
  player.room = "Room1";
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_vendor("Vendor1", "A friendly food vendor", [
    { name: "Fried Chicken & Roasted Vegetables", price: 2 },
  ]);
  textworld.place_npc("Zone1", "Room1", "Vendor1");
  const result = await textworld.parse_command(
    player,
    "talk to Vendor1 say items"
  );
  assertEquals(
    result,
    "Items for sale: Fried Chicken & Roasted Vegetables (2 gold)"
  );
  player.items.length = 0;
  textworld.reset_world();
});

Deno.test("can_parse_command_talk_to_vendor_and_purchase_item", async () => {
  player.zone = "Zone1";
  player.room = "Room1";
  player.gold = 10;
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_item(
    "Fried Chicken & Roasted Vegetables",
    "A delicious dinner of fried chicken and roasted vegetables.",
    false
  );
  textworld.create_vendor("Vendor1", "A friendly food vendor", [
    { name: "Fried Chicken & Roasted Vegetables", price: 2 },
  ]);
  textworld.place_npc("Zone1", "Room1", "Vendor1");
  const result = await textworld.parse_command(
    player,
    "talk to Vendor1 say buy Fried Chicken & Roasted Vegetables"
  );
  assertEquals(
    result,
    "You purchased Fried Chicken & Roasted Vegetables for 2 gold."
  );
  player.items.length = 0;
  textworld.reset_world();
});

Deno.test("can_parse_command_quit", async () => {
  const result = await textworld.parse_command(player, "quit");
  assertEquals(result, "You quit the game.");
});

Deno.test("can_parse_command_map", async () => {
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_room("Zone1", "Room2", "This is room 2");
  textworld.create_room("Zone1", "Room3", "This is room 3");
  textworld.create_exit("Zone1", "Room1", "north", "Room2");
  textworld.create_exit("Zone1", "Room2", "east", "Room3");
  const result = await textworld.parse_command(player, "map");
  assertEquals(result, `Map:\n\n#-#\n|  \n@  \n`);
  textworld.reset_world();
});

Deno.test("can_parse_room_command_action", async () => {
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.add_room_command_action(
    "Zone1",
    "Room1",
    "xyzzy action",
    "You recited the magical word XYZZY!!!",
    ["xyzzy"],
    (_player: tw.Player, _input: string, _command: string, _args: string[]) =>
      "How dare you utter the magical word XYZZY!"
  );
  const result = await textworld.parse_command(player, "xyzzy");
  assertEquals(
    result,
    "You recited the magical word XYZZY!!!\n\nHow dare you utter the magical word XYZZY!"
  );
  textworld.reset_world();
});

Deno.test("can_parse_malformed_command", async () => {
  let result = await textworld.parse_command(player, "talk to");
  assertEquals(result, "That NPC does not exist.");
  result = await textworld.parse_command(player, "show");
  assertEquals(result, "That item does not exist.");
  result = await textworld.parse_command(player, "take");
  assertEquals(result, "That item does not exist.");
  result = await textworld.parse_command(player, "use");
  assertEquals(result, "That item does not exist.");
  result = await textworld.parse_command(player, "drop");
  assertEquals(result, "That item does not exist.");
  textworld.set_godmode(player);
  result = await textworld.parse_command(player, "goto");
  assertEquals(result, "That room or zone does not exist.");
  textworld.remove_godmode(player);
  result = await textworld.parse_command(player, "look");
  assertEquals(result, "You can't see anything.");
  result = await textworld.parse_command(player, "inspect");
  assertEquals(result, "There is nothing else of interest here.");
  result = await textworld.parse_command(player, "north");
  assertEquals(result, "You can't go that way.");
});

Deno.test("can_parse_command_craft", async () => {
  player.zone = "Zone1";
  player.room = "Room1";
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_item("Iron", "A piece of iron", false);
  textworld.create_item("Wood", "A piece of wood", false);
  textworld.place_item("Zone1", "Room1", "Iron", 4);
  textworld.place_item("Zone1", "Room1", "Wood", 4);
  textworld.take_all_items(player);
  textworld.create_recipe(
    "Iron Sword",
    "A quality sword for the everyday fighter",
    [
      { name: "Iron", quantity: 2 },
      { name: "Wood", quantity: 1 },
    ],
    { name: "Iron Sword", quantity: 1 }
  );
  textworld.learn_recipe(player, "Iron Sword");
  assertEquals(player.known_recipes.length, 1);
  const result = await textworld.parse_command(player, "craft iron sword");
  assertEquals(result, "Iron Sword has been crafted.");
  assertEquals(player.items.length, 3);
  player.items.length = 0;
  player.known_recipes.length = 0;
  textworld.reset_world();
});

Deno.test("can_parse_command_load", async () => {
  player.gold = 1234;
  await textworld.save_player_progress(
    player,
    tw.player_progress_db_name,
    "test-slot"
  );
  const result = await textworld.parse_command(player, "load test-slot");
  assertEquals(result, `Progress has been loaded from slot: test-slot`);
  assertEquals(player.gold, 1234);
  await Deno.remove(tw.player_progress_db_name);
  textworld.reset_world();
  player.gold = 0;
});

Deno.test("can_parse_command_save", async () => {
  player.gold = 1234;
  const result = await textworld.parse_command(player, "save test-slot");
  assertEquals(result, `Progress has been saved to slot: test-slot`);
  const playerResult = await textworld.load_player_progress(
    tw.player_progress_db_name,
    "test-slot"
  );
  assertNotEquals(playerResult, null);
  assertEquals(playerResult?.player.gold, 1234);
  await Deno.remove(tw.player_progress_db_name);
  textworld.reset_world();
  player.gold = 0;
});

Deno.test("can_spawn_item_in_room_using_spawn_location", async () => {
  player.zone = "Zone1";
  player.room = "Room1";
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_item("Iron", "A piece of iron", false);
  textworld.create_spawn_location(
    "Test Spawner",
    "Zone1",
    "Room1",
    500,
    true,
    (spawn_location: tw.SpawnLocation) => {
      const item = textworld.get_room_item(
        spawn_location.zone,
        spawn_location.room,
        "Iron"
      );
      if (!item) {
        textworld.place_item(
          spawn_location.zone,
          spawn_location.room,
          "Iron",
          1
        );
      }
    }
  );
  textworld.spawn_location_start("Test Spawner");
  await delay(500);
  textworld.remove_spawn_location("Test Spawner");
  const room = textworld.get_room("Zone1", "Room1");
  assertEquals(room?.items.length, 1);
  textworld.reset_world();
});

Deno.test("mob_can_attack_player", () => {
  player.zone = "Zone1";
  player.room = "Room1";
  player.stats.health.current = 100;
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  const mob = textworld.create_mob(
    "Goblin",
    "A small goblin",
    textworld.create_resources(10, 10, 10, 10, 10, 10),
    textworld.create_damage_and_defense(15, 8, 5, 2, 0.05),
    []
  );
  textworld.place_mob("Zone1", "Room1", "Goblin");
  const result = textworld.perform_attack(mob, player);
  assertStringIncludes(result, "Goblin attacks Player");
  player.stats.health.current = 100;
  textworld.reset_world();
});

Deno.test("mob_can_kill_player", () => {
  player.zone = "Zone1";
  player.room = "Room1";
  player.stats.health.current = 1;
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  const mob = textworld.create_mob(
    "Goblin",
    "A small goblin",
    textworld.create_resources(1, 1, 10, 10, 10, 10),
    textworld.create_damage_and_defense(15, 8, 5, 2, 0.05),
    []
  );
  textworld.place_mob("Zone1", "Room1", "Goblin");
  const result = textworld.perform_attack(mob, player);
  assertStringIncludes(result, "Goblin attacks Player");
  assertStringIncludes(result, "Player has been defeated!");
  player.stats.health.current = 100;
  textworld.reset_world();
});

Deno.test("player_can_attack_mob", () => {
  player.zone = "Zone1";
  player.room = "Room1";
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  const mob = textworld.create_mob(
    "Goblin",
    "A small goblin",
    textworld.create_resources(10, 10, 10, 10, 10, 10),
    textworld.create_damage_and_defense(15, 8, 5, 2, 0.05),
    []
  );
  textworld.place_mob("Zone1", "Room1", "Goblin");
  const result = textworld.perform_attack(player, mob);
  assertStringIncludes(result, "Player attacks Goblin");
  textworld.reset_world();
});

Deno.test("player_can_kill_mob", () => {
  player.zone = "Zone1";
  player.room = "Room1";
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  const mob = textworld.create_mob(
    "Goblin",
    "A small goblin",
    textworld.create_resources(1, 1, 10, 10, 10, 10),
    textworld.create_damage_and_defense(15, 8, 5, 2, 0.05),
    []
  );
  textworld.place_mob("Zone1", "Room1", "Goblin");
  const result = textworld.perform_attack(player, mob);
  assertStringIncludes(result, "Player attacks Goblin");
  assertStringIncludes(result, "Goblin has been defeated!");
  textworld.reset_world();
});

Deno.test("player_can_kill_mob_and_drop_loot", () => {
  player.zone = "Zone1";
  player.room = "Room1";
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_item("Sword", "A sharp sword", false);
  textworld.create_item("Shield", "A strong shield", false);
  textworld.create_mob(
    "Goblin",
    "A small goblin",
    textworld.create_resources(1, 1, 10, 10, 10, 10),
    textworld.create_damage_and_defense(15, 8, 5, 2, 0.05),
    [
      { name: "Sword", quantity: 1 },
      { name: "Shield", quantity: 1 },
    ]
  );
  textworld.place_mob("Zone1", "Room1", "Goblin");
  const result = textworld.initiate_attack_on_mob(player, ["goblin"]);
  assertStringIncludes(result, "Player attacks Goblin");
  assertStringIncludes(result, "Goblin has been defeated!");
  const room = textworld.get_room("Zone1", "Room1");
  assertEquals(room?.items.length, 2);
  assertEquals(room?.items[0].name, "Sword");
  assertEquals(room?.items[1].name, "Shield");
  textworld.reset_world();
});

Deno.test("player_can_kill_mob_and_pickup_look", () => {
  player.zone = "Zone1";
  player.room = "Room1";
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_item("Sword", "A sharp sword", false);
  textworld.create_item("Shield", "A strong shield", false);
  textworld.create_mob(
    "Goblin",
    "A small goblin",
    textworld.create_resources(1, 1, 10, 10, 10, 10),
    textworld.create_damage_and_defense(15, 8, 5, 2, 0.05),
    [
      { name: "Sword", quantity: 1 },
      { name: "Shield", quantity: 1 },
    ]
  );
  textworld.place_mob("Zone1", "Room1", "Goblin");
  const result = textworld.initiate_attack_on_mob(player, ["goblin"], true);
  assertStringIncludes(result, "Player attacks Goblin");
  assertStringIncludes(result, "Goblin has been defeated!");
  textworld.take_all_items(player);
  const room = textworld.get_room("Zone1", "Room1");
  assertEquals(room?.items.length, 0);
  assertEquals(player.items.length, 2);
  assertEquals(player.items[0].name, "Sword");
  assertEquals(player.items[1].name, "Shield");
  player.items.length = 0;
  textworld.reset_world();
});

Deno.test("player_attack_mob_and_mob_attack_player", () => {
  player.zone = "Zone1";
  player.room = "Room1";
  player.stats.health.current = 100;
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_mob(
    "Goblin",
    "A small goblin",
    textworld.create_resources(100, 10, 10, 10, 10, 10),
    textworld.create_damage_and_defense(15, 8, 5, 2, 0.05),
    []
  );
  textworld.place_mob("Zone1", "Room1", "Goblin");
  const result = textworld.initiate_attack_on_mob(player, ["goblin"], true);
  assertStringIncludes(result, "Player attacks Goblin");
  assertStringIncludes(result, "Goblin attacks Player");
  player.stats.health.current = 100;
  textworld.reset_world();
});

Deno.test("player_can_die_from_mob_attack", () => {
  player.zone = "Zone1";
  player.room = "Room1";
  player.stats.health.current = 1;
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_mob(
    "Goblin",
    "A small goblin",
    textworld.create_resources(100, 10, 10, 10, 10, 10),
    textworld.create_damage_and_defense(55, 55, 55, 55, 5),
    []
  );
  textworld.place_mob("Zone1", "Room1", "Goblin");
  const result = textworld.initiate_attack_on_mob(player, ["goblin"], true);
  assertStringIncludes(result, "Player attacks Goblin");
  assertStringIncludes(result, "Goblin attacks Player");
  assertStringIncludes(result, "Player has been defeated!");
  player.stats.health.current = 100;
  textworld.reset_world();
});

Deno.test("player_can_die_from_mob_attack_and_ressurect", async () => {
  player.zone = "Zone1";
  player.room = "Room1";
  player.stats.health.current = 1;
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.set_room_as_zone_starter("Zone1", "Room1");
  textworld.create_mob(
    "Goblin",
    "A small goblin",
    textworld.create_resources(100, 10, 10, 10, 10, 10),
    textworld.create_damage_and_defense(55, 55, 55, 55, 5),
    []
  );
  textworld.place_mob("Zone1", "Room1", "Goblin");
  let result = textworld.initiate_attack_on_mob(player, ["goblin"], true);
  assertStringIncludes(result, "Player attacks Goblin");
  assertStringIncludes(result, "Goblin attacks Player");
  assertStringIncludes(result, "Player has been defeated!");
  result = await textworld.parse_command(player, "resurrect");
  assertEquals(result, "You have been resurrected.");
  player.stats.health.current = 100;
  textworld.reset_world();
});

Deno.test("player_can_take_item", () => {
  player.zone = "Zone1";
  player.room = "Room1";
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_item("Sword", "A sharp sword", false);
  textworld.place_item("Zone1", "Room1", "Sword");
  textworld.take_item(player, ["Sword"]);
  assertEquals(player.items.length, 1);
  player.items.length = 0;
  textworld.reset_world();
});

Deno.test("player_can_take_all_items", () => {
  player.zone = "Zone1";
  player.room = "Room1";
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_item("Sword", "A sharp sword", false);
  textworld.create_item("Potion", "A potion", true);
  textworld.place_item("Zone1", "Room1", "Sword");
  textworld.place_item("Zone1", "Room1", "Potion");
  textworld.take_all_items(player);
  assertEquals(player.items.length, 2);
  player.items.length = 0;
  textworld.reset_world();
});

Deno.test("player_can_take_item_and_it_stacks_in_inventory", () => {
  player.zone = "Zone1";
  player.room = "Room1";
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_item("Potion", "An ordinary potion", false);
  textworld.place_item("Zone1", "Room1", "Potion");
  textworld.take_item(player, ["Potion"]);
  textworld.place_item("Zone1", "Room1", "Potion");
  textworld.take_item(player, ["Potion"]);
  const result = textworld.has_item_in_quantity(player, "Potion", 2);
  assertEquals(result, true);
  player.items.length = 0;
  textworld.reset_world();
});

Deno.test("player_can_drop_item", () => {
  player.zone = "Zone1";
  player.room = "Room1";
  textworld.create_zone("Zone1");
  textworld.create_item("Potion", "A potion", true);
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.place_item("Zone1", "Room1", "Potion");
  textworld.take_item(player, ["Potion"]);
  textworld.drop_item(player, ["Potion"]);
  assertEquals(player.items.length, 0);
  player.items.length = 0;
  textworld.reset_world();
});

Deno.test("player_can_drop_all_items", () => {
  player.zone = "Zone1";
  player.room = "Room1";
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_item("Sword", "A sharp sword", false);
  textworld.create_item("Potion", "A potion", true);
  textworld.place_item("Zone1", "Room1", "Sword");
  textworld.place_item("Zone1", "Room1", "Potion");
  textworld.take_all_items(player);
  textworld.drop_all_items(player);
  assertEquals(player.items.length, 0);
  player.items.length = 0;
  textworld.reset_world();
});

Deno.test("player_can_use_item", () => {
  player.zone = "Zone1";
  player.room = "Room1";
  textworld.create_zone("Zone1");
  textworld.create_item("Potion", "A potion", true, (_player) => {
    return "You drank the potion but nothing happened.";
  });
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.place_item("Zone1", "Room1", "Potion");
  textworld.take_item(player, ["Potion"]);
  const result = textworld.use_item(player, ["Potion"]);
  assertEquals(result, "You drank the potion but nothing happened.");
  assertEquals(player.items.length, 0);
  textworld.reset_world();
});

Deno.test("player_cant_use_item_thats_not_usable", () => {
  player.zone = "Zone1";
  player.room = "Room1";
  textworld.create_zone("Zone1");
  textworld.create_item("Sword", "A sharp sword", false);
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.place_item("Zone1", "Room1", "Sword");
  textworld.take_item(player, ["Sword"]);
  const result = textworld.use_item(player, ["Sword"]);
  assertEquals(result, "You can't use that item.");
  assertEquals(player.items.length, 1);
  player.items.length = 0;
  textworld.reset_world();
});

Deno.test("player_can_look", () => {
  player.zone = "Zone1";
  player.room = "Room1";
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  const result = textworld.look(player, "look", "look", ["look"]);
  assertEquals(result, "This is room 1");
  textworld.reset_world();
});

Deno.test("player_can_look_at_self_without_inventory", () => {
  const result = textworld.look(player, "look", "look", ["look", "self"]);
  assertEquals(result, "You are a strong adventurer");
});

Deno.test("player_can_look_at_self_with_inventory", () => {
  player.zone = "Zone1";
  player.room = "Room1";
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_item("Sword", "A sharp sword", false);
  textworld.place_item("Zone1", "Room1", "Sword");
  textworld.take_item(player, ["Sword"]);
  const result = textworld.look_self(player);
  assertEquals(result, `You are a strong adventurer\n\nInventory: Sword (1)`);
  player.items.length = 0;
  textworld.reset_world();
});

Deno.test("player_can_inspect_room_with_no_items", () => {
  player.zone = "Zone1";
  player.room = "Room1";
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  const result = textworld.inspect_room(player);
  assertEquals(
    result,
    "You inspect the room and found:\n\nThere is nothing else of interest here."
  );
  textworld.reset_world();
});

Deno.test("player_can_inspect_room_with_items", () => {
  player.zone = "Zone1";
  player.room = "Room1";
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_item("Sword", "A sharp sword", false);
  textworld.create_item("Potion", "An ordinary potion", true);
  textworld.place_item("Zone1", "Room1", "Sword");
  textworld.place_item("Zone1", "Room1", "Potion", 2);
  const result = textworld.inspect_room(player);
  assertEquals(
    result,
    "You inspect the room and found:\n\nItems: Sword (1), Potion (2)"
  );
  textworld.reset_world();
});

Deno.test("player_can_show_item", () => {
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_item("Potion", "An ordinary potion", true);
  textworld.place_item("Zone1", "Room1", "Potion", 2);
  textworld.take_item(player, ["Potion"]);
  const result = textworld.show_item(player, ["Potion"]);
  assertEquals(result, "An ordinary potion");
  player.items.length = 0;
  textworld.reset_world();
});

Deno.test("player_can_show_all_items", () => {
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_item("Sword", "A sharp sword", false);
  textworld.create_item("Potion", "An ordinary potion", true);
  textworld.place_item("Zone1", "Room1", "Sword");
  textworld.place_item("Zone1", "Room1", "Potion", 2);
  textworld.take_all_items(player);
  const result = textworld.show_all_items(player);
  assertEquals(result, "Sword - A sharp sword\n\nPotion - An ordinary potion");
  player.items.length = 0;
  textworld.reset_world();
});

Deno.test("player_can_purchase_from_vendor", () => {
  player.zone = "Zone1";
  player.room = "Room1";
  player.gold = 10;
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_item("Fried Chicken & Roasted Vegetables", "", false);
  textworld.create_vendor("Vendor1", "A friendly food vendor", [
    { name: "Fried Chicken & Roasted Vegetables", price: 2 },
  ]);
  textworld.place_npc("Zone1", "Room1", "Vendor1");
  const result = textworld.purchase_from_vendor(
    player,
    "Vendor1",
    "Fried Chicken & Roasted Vegetables"
  );
  assertEquals(
    result,
    "You purchased Fried Chicken & Roasted Vegetables for 2 gold."
  );
  assertEquals(player.gold, 8);
  assertEquals(player.items.length, 1);
  player.items.length = 0;
  player.gold = 0;
  textworld.reset_world();
});

Deno.test("player_cant_purchase_nonexistant_item_from_vendor", () => {
  player.zone = "Zone1";
  player.room = "Room1";
  player.gold = 10;
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_vendor("Vendor1", "A friendly food vendor", [
    { name: "Fried Chicken in Thick Gravy", price: 2 },
  ]);
  textworld.place_npc("Zone1", "Room1", "Vendor1");
  const result = textworld.purchase_from_vendor(
    player,
    "Vendor1",
    "Fried Chicken & Roasted Vegetables"
  );
  assertEquals(result, "That item does not exist.");
  player.items.length = 0;
  player.gold = 0;
  textworld.reset_world();
});

Deno.test("player_can_pickup_quest", () => {
  textworld.create_quest("Quest1", "A quest");
  textworld.pickup_quest(player, "Quest1");
  assertEquals(player.quests.length, 1);
  player.quests.length = 0;
  textworld.reset_world();
});

Deno.test("player_cant_pickup_nonexistant_quest", () => {
  const result = textworld.pickup_quest(player, "Quest1");
  assertEquals(result, "The quest does not exist.");
  textworld.reset_world();
});

Deno.test("player_cant_pickup_quest_they_already_have", () => {
  textworld.create_quest("Quest1", "A quest");
  textworld.pickup_quest(player, "Quest1");
  const result = textworld.pickup_quest(player, "Quest1");
  assertEquals(result, "You already have the quest Quest1.");
  player.quests.length = 0;
  textworld.reset_world();
});

Deno.test("player_cant_pickup_more_quests_than_allowed", () => {
  textworld.create_quest("Quest1", "A quest");
  textworld.create_quest("Quest2", "A quest");
  textworld.create_quest("Quest3", "A quest");
  textworld.create_quest("Quest4", "A quest");
  textworld.create_quest("Quest5", "A quest");
  textworld.create_quest("Quest6", "A quest");
  textworld.pickup_quest(player, "Quest1");
  textworld.pickup_quest(player, "Quest2");
  textworld.pickup_quest(player, "Quest3");
  textworld.pickup_quest(player, "Quest4");
  textworld.pickup_quest(player, "Quest5");
  const result = textworld.pickup_quest(player, "Quest6");
  assertEquals(
    result,
    `You can't have more than ${tw.active_quest_limit} active quests at a time.`
  );
  player.quests.length = 0;
  textworld.reset_world();
});

Deno.test("player_can_complete_quest", () => {
  player.zone = "Zone1";
  player.room = "Room1";
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_item("Magic Ring", "A magic ring", false);
  textworld.place_item("Zone1", "Room1", "Magic Ring");
  textworld.create_quest("Quest1", "A quest");
  textworld.add_quest_step(
    "Quest1",
    "Step1",
    "Collect the magic ring",
    (player) => {
      if (player.items.some((item) => item.name === "Magic Ring")) {
        const quest_step = textworld.get_quest_step("Quest1", "Step1");
        if (quest_step) {
          return true;
        }
      }
      return false;
    }
  );
  textworld.pickup_quest(player, "Quest1");
  textworld.take_item(player, ["Magic Ring"]);
  const result = textworld.is_quest_complete(player, "Quest1");
  assertEquals(result, true);
  assertEquals(player.quests.length, 0);
  player.quests_completed.length = 0;
  player.items.length = 0;
  textworld.reset_world();
});

Deno.test("player_can_get_quest_progress", () => {
  textworld.create_quest("Quest1", "A quest");
  textworld.add_quest_step("Quest1", "Step1", "Step 1", () => {
    return true;
  });
  textworld.add_quest_step("Quest1", "Step2", "Step 2", () => {
    return false;
  });
  textworld.pickup_quest(player, "Quest1");
  const result = textworld.get_quest_progress(player, "Quest1");
  assertEquals(result, "Quest: Quest1\n\nA quest\n\n[x] Step1\n[ ] Step2\n");
  player.quests.length = 0;
  textworld.reset_world();
});

Deno.test("player_can_complete_quest_with_multiple_steps", () => {
  player.zone = "Zone1";
  player.room = "Room1";
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_room("Zone1", "Room2", "This is room 2", (player) => {
    textworld.set_flag(player, "visited_room2");
    return null;
  });
  textworld.create_exit("Zone1", "Room1", "north", "Room2");

  textworld.create_npc("Old Woman", "An ordinary old woman");

  textworld.create_dialog("Old Woman", ["hello", "hi"], null, (player) => {
    if (textworld.has_flag(player, "took_gem")) {
      return "Hi, how are you?";
    } else {
      return "Hi, I have a gem you may want!";
    }
  });

  textworld.create_dialog(
    "Old Woman",
    ["take"],
    null,
    (player, _input, _command, args) => {
      if (args.length !== 0) {
        if (!textworld.has_flag(player, "took_gem")) {
          const possible_items = textworld.generate_combinations(args);
          const item = possible_items.find((item) => {
            return item === "gem";
          });
          if (item) {
            textworld.set_flag(player, "took_gem");
            textworld.create_item("Gem", "A shiny gem", false);
            player.items.push({
              name: "Gem",
              quantity: 1,
            });
            return "You took the Gem.";
          } else {
            return "I don't have that item.";
          }
        } else {
          return "I don't have that item.";
        }
      }
      return "Take what?";
    }
  );

  textworld.place_npc("Zone1", "Room1", "Old Woman");
  textworld.create_quest("Quest1", "A quest");
  textworld.add_quest_action("Quest1", "End", (player) => {
    if (textworld.has_flag(player, "took_gem")) {
      textworld.remove_flag(player, "took_gem");
      textworld.remove_flag(player, "visited_room2");
    }
    return null;
  });
  textworld.add_quest_step("Quest1", "Step1", "Visit room 2", () => {
    if (player.flags.includes("visited_room2")) {
      return true;
    }
    return false;
  });
  textworld.add_quest_step("Quest1", "Step2", "Get gem from old woman", () => {
    if (textworld.has_flag(player, "took_gem")) {
      return true;
    }
    return false;
  });
  textworld.pickup_quest(player, "Quest1");
  const gem_result = textworld.talk_to_npc(
    player,
    "talk to Old Woman take gem",
    "talk to",
    ["talk", "to", "Old", "Woman", "take", "gem"]
  );
  textworld.switch_room(player, "north");
  assertEquals(gem_result, "You took the Gem.");
  const quest_result = textworld.is_quest_complete(player, "Quest1");
  assertEquals(quest_result, true);
  assertEquals(player.quests.length, 0);
  assertEquals(player.flags.length, 0);
  player.quests_completed.length = 0;
  player.items.length = 0;
  textworld.reset_world();
});

Deno.test("player_can_drop_quest", () => {
  textworld.create_quest("Quest1", "A quest");
  textworld.pickup_quest(player, "Quest1");
  textworld.drop_quest(player, "Quest1");
  assertEquals(player.quests.length, 0);
  player.quests.length = 0;
  textworld.reset_world();
});

Deno.test("player_cant_drop_quest_they_dont_have", () => {
  textworld.create_quest("Quest1", "A quest");
  const result = textworld.drop_quest(player, "Quest1");
  assertEquals(result, "You don't have the quest Quest1.");
  player.quests.length = 0;
  textworld.reset_world();
});

Deno.test("player_starts_in_valid_room", () => {
  player.zone = "Zone1";
  player.room = "Room1";
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  const room = textworld.get_players_room(player);
  assertEquals(room!.name, "Room1");
  textworld.reset_world();
});

Deno.test("player_can_navigate_between_rooms", () => {
  player.zone = "Zone1";
  player.room = "Room1";
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_room("Zone1", "Room2", "This is room 2");
  textworld.create_exit("Zone1", "Room1", "north", "Room2");
  textworld.switch_room(player, "north");
  const room = textworld.get_players_room(player);
  assertEquals(room!.name, "Room2");
  textworld.reset_world();
});

Deno.test("player_cant_navigate_to_nonexistent_room", () => {
  player.zone = "Zone1";
  player.room = "Room1";
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  const result = textworld.switch_room(player, "north");
  assertEquals(result, "You can't go that way.");
  textworld.reset_world();
});

Deno.test("player_can_goto_new_zone", () => {
  player.zone = "Zone1";
  player.room = "Room1";
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1 in zone 1");
  textworld.create_zone("Zone2");
  textworld.create_room("Zone2", "Room1", "This is room 1 in zone 2");
  textworld.set_room_as_zone_starter("Zone2", "Room1");
  const result = textworld.goto(player, ["zone", "Zone2"]);
  assertEquals(result, "Location: Room1\n\nThis is room 1 in zone 2");
  textworld.reset_world();
});

Deno.test("player_cant_goto_room_that_doesnt_exist_in_zone", () => {
  player.zone = "Zone1";
  player.room = "Room1";
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  const result = textworld.goto(player, ["room Room2"]);
  assertEquals(result, "That room or zone does not exist.");
  textworld.reset_world();
});

Deno.test("player_can_learn_recipe", () => {
  player.zone = "Zone1";
  player.room = "Room1";
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_recipe(
    "Iron Sword",
    "A quality sword for the everyday fighter",
    [
      { name: "Iron", quantity: 2 },
      { name: "Wood", quantity: 1 },
    ],
    { name: "Iron Sword", quantity: 1 }
  );
  textworld.create_item(
    "Iron Sword recipe",
    "A recipe for an iron sword",
    true,
    (player) => {
      return textworld.learn_recipe(player, "Iron Sword");
    }
  );
  textworld.place_item("Zone1", "Room1", "Iron Sword recipe");
  textworld.take_item(player, ["Iron Sword recipe"]);
  const result = textworld.use_item(player, ["Iron Sword recipe"]);
  assertEquals(result, "You learned the recipe for Iron Sword.");
  assertEquals(player.known_recipes.length, 1);
  player.known_recipes.length = 0;
  textworld.reset_world();
});

Deno.test("player_cant_learn_recipe_player_already_knows", () => {
  player.zone = "Zone1";
  player.room = "Room1";
  player.known_recipes.push("Iron Sword");
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_recipe(
    "Iron Sword",
    "A quality sword for the everyday fighter",
    [
      { name: "Iron", quantity: 2 },
      { name: "Wood", quantity: 1 },
    ],
    { name: "Iron Sword", quantity: 1 }
  );
  textworld.create_item(
    "Iron Sword recipe",
    "A recipe for an iron sword",
    true,
    (player) => {
      return textworld.learn_recipe(player, "Iron Sword");
    }
  );
  textworld.place_item("Zone1", "Room1", "Iron Sword recipe");
  textworld.take_item(player, ["Iron Sword recipe"]);
  const result = textworld.use_item(player, ["Iron Sword recipe"]);
  assertEquals(result, "You already know that recipe.");
  assertEquals(player.known_recipes.length, 1);
  // recipe should still be in players inventory since it could not be consumed.
  assertEquals(player.items.length, 1);
  player.items.length = 0;
  player.known_recipes.length = 0;
  textworld.reset_world();
});

Deno.test("player_can_craft_recipe", () => {
  player.zone = "Zone1";
  player.room = "Room1";
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_item("Iron", "A piece of iron", false);
  textworld.create_item("Wood", "A piece of wood", false);
  textworld.place_item("Zone1", "Room1", "Iron", 4);
  textworld.place_item("Zone1", "Room1", "Wood", 4);
  textworld.take_all_items(player);
  textworld.create_recipe(
    "Iron Sword",
    "A quality sword for the everyday fighter",
    [
      { name: "Iron", quantity: 2 },
      { name: "Wood", quantity: 1 },
    ],
    { name: "Iron Sword", quantity: 1 }
  );
  textworld.learn_recipe(player, "Iron Sword");
  const result = textworld.craft_recipe(player, ["Iron Sword"]);
  assertEquals(result, "Iron Sword has been crafted.");
  assertEquals(player.items.length, 3);
  player.items.length = 0;
  player.known_recipes.length = 0;
  textworld.reset_world();
});

Deno.test("player_cant_craft_unknown_recipe", () => {
  const result = textworld.craft_recipe(player, ["Iron Sword"]);
  assertEquals(result, "You don't know how to craft that.");
  textworld.reset_world();
});

Deno.test("player_can_talk_to_npc", () => {
  player.zone = "Zone1";
  player.room = "Room1";
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_npc("Big Guard", "A strong guard");
  textworld.create_dialog(
    "Big Guard",
    ["Hello"],
    "Hello citizen, make sure you mind the law!",
    null
  );
  textworld.place_npc("Zone1", "Room1", "Big Guard");
  let result = textworld.talk_to_npc(
    player,
    "talk to Big Guard say Hello",
    "talk to",
    ["talk", "to", "Big", "Guard", "say", "Hello"]
  );
  assertEquals(result, "Hello citizen, make sure you mind the law!");
  result = textworld.talk_to_npc(
    player,
    "talk to Big Guard say Goodbye",
    "talk to",
    ["talk", "to", "Big", "Guard", "say", "Goodbye"]
  );
  assertEquals(result, "hmm...");
  textworld.reset_world();
});

Deno.test("player_cant_talk_to_npc_that_doesnt_exist", () => {
  const result = textworld.talk_to_npc(
    player,
    "talk to Big Guard say Hello",
    "talk to",
    ["talk", "to", "Big", "Guard", "say", "Hello"]
  );
  assertEquals(result, "That NPC does not exist.");
  textworld.reset_world();
});

Deno.test("player_can_talk_to_vendor_and_list_items", () => {
  player.zone = "Zone1";
  player.room = "Room1";
  player.gold = 10;
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_item(
    "Fried Chicken & Roasted Vegetables",
    "A delicious dinner of fried chicken and roasted vegetables.",
    false
  );
  textworld.create_vendor("Vendor1", "A friendly food vendor", [
    { name: "Fried Chicken & Roasted Vegetables", price: 2 },
  ]);
  textworld.place_npc("Zone1", "Room1", "Vendor1");
  const result = textworld.talk_to_npc(
    player,
    "talk to Vendor1 say items",
    "talk to",
    ["talk", "to", "Vendor1", "say", "items"]
  );
  assertEquals(
    result,
    "Items for sale: Fried Chicken & Roasted Vegetables (2 gold)"
  );
  player.items.length = 0;
  textworld.reset_world();
});

Deno.test("player_can_talk_to_vendor_and_purchase_item", () => {
  player.zone = "Zone1";
  player.room = "Room1";
  player.gold = 10;
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_item(
    "Fried Chicken & Roasted Vegetables",
    "A delicious dinner of fried chicken and roasted vegetables.",
    false
  );
  textworld.create_vendor("Vendor1", "A friendly food vendor", [
    { name: "Fried Chicken & Roasted Vegetables", price: 2 },
  ]);
  textworld.place_npc("Zone1", "Room1", "Vendor1");
  const result = textworld.talk_to_npc(
    player,
    "talk to Vendor1 buy Fried Chicken & Roasted Vegetables",
    "talk to",
    ["talk", "to", "Vendor1", "buy", "Fried Chicken & Roasted Vegetables"]
  );
  assertEquals(
    result,
    "You purchased Fried Chicken & Roasted Vegetables for 2 gold."
  );
  player.items.length = 0;
  textworld.reset_world();
});

Deno.test("player_can_talk_to_npc_without_dialog", () => {
  player.zone = "Zone1";
  player.room = "Room1";
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_npc("Big Guard", "A strong guard");
  textworld.place_npc("Zone1", "Room1", "Big Guard");
  const result = textworld.talk_to_npc(
    player,
    "talk to Big Guard say Hello",
    "talk to",
    ["talk", "to", "Big", "Guard", "say", "Hello"]
  );
  assertEquals(result, "Big Guard does not want to talk to you.");
  textworld.reset_world();
});

Deno.test("player_can_goto_any_room_in_zone", () => {
  player.zone = "Zone1";
  player.room = "Room1";
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "The Room1", "This is room 1");
  textworld.create_room("Zone1", "The Room2", "This is room 2");
  const result = textworld.goto(player, ["room", "The", "Room2"]);
  assertEquals(result, "Location: The Room2\n\nThis is room 2");
  textworld.reset_world();
});

Deno.test(
  "player_can_navigate_to_new_zone_using_custom_room_action",
  async () => {
    player.zone = "Zone1";
    player.room = "Room1";
    textworld.create_zone("Zone1");
    textworld.create_room("Zone1", "Room1", "This is room 1 in zone 1");
    textworld.create_zone("Zone2");
    textworld.create_room("Zone2", "Room1", "This is room 1 in zone 2");
    textworld.set_room_as_zone_starter("Zone1", "Room1");
    textworld.set_room_as_zone_starter("Zone2", "Room1");
    textworld.add_room_command_action(
      "Zone1",
      "Room1",
      "warp action",
      "Blue waves of light start spinning all around you. They get faster and faster until you can't see anything. When the light fades, you find yourself in a new place.",
      ["warp"],
      (player, _input, _command, _args) => {
        return textworld.goto(player, ["zone", "Zone2"]);
      }
    );
    const result = await textworld.parse_command(player, "warp");
    assertEquals(
      result,
      "Blue waves of light start spinning all around you. They get faster and faster until you can't see anything. When the light fades, you find yourself in a new place.\n\nLocation: Room1\n\nThis is room 1 in zone 2"
    );
    assertEquals(player.zone, "Zone2");
    assertEquals(player.room, "Room1");
    textworld.reset_world();
  }
);

Deno.test("player_can_save_progress", async () => {
  const result = await textworld.save_player_progress(
    player,
    "test_game_saves.db",
    "test_slot"
  );
  assertEquals(result, "Progress has been saved to slot: test_slot");
  await Deno.remove("test_game_saves.db");
  textworld.reset_world();
});

Deno.test("player_can_load_progress", async () => {
  player.gold = 1000;
  await textworld.save_player_progress(
    player,
    "test_game_saves.db",
    "test_slot"
  );
  const result = await textworld.load_player_progress(
    "test_game_saves.db",
    "test_slot"
  );
  assertNotEquals(result, null);
  assertNotEquals(result!.player, null);
  assertNotEquals(result!.world, null);
  assertEquals(result!.player.gold, 1000);
  await Deno.remove("test_game_saves.db");
  player.gold = 0;
  textworld.reset_world();
});

Deno.test("room_actions_work_after_loading_player_progress", async () => {
  player.zone = "Zone1";
  player.room = "Room1";
  textworld.create_zone("Zone1");
  textworld.create_room(
    "Zone1",
    "Room1",
    "This is room 1 in zone 1",
    (_player) => {
      return "This message is from a room action";
    }
  );
  await textworld.save_player_progress(
    player,
    "test_game_saves.db",
    "test_slot"
  );
  await textworld.load_player_progress("test_game_saves.db", "test_slot");
  const result = textworld.switch_room(player);
  assertEquals(
    result,
    "Location: Room1\n\nThis is room 1 in zone 1\n\nThis message is from a room action"
  );
  await Deno.remove("test_game_saves.db");
  textworld.reset_world();
});

Deno.test("item_actions_work_after_loading_player_progress", async () => {
  textworld.create_item("Potion", "A potion", true, (_player) => {
    return "You drank the potion but nothing happened.";
  });
  const item = textworld.get_item("Potion");
  assertEquals(item?.name, "Potion");
  await textworld.save_player_progress(
    player,
    "test_game_saves.db",
    "test_slot"
  );
  await textworld.load_player_progress("test_game_saves.db", "test_slot");
  const item_action = textworld.get_item_action("Potion");
  assertEquals(
    item_action?.action(player),
    "You drank the potion but nothing happened."
  );
  await Deno.remove("test_game_saves.db");
  textworld.reset_world();
  player.items.length = 0;
});

Deno.test(
  "room_command_actions_work_after_loading_player_progress",
  async () => {
    player.zone = "Zone1";
    player.room = "Room1";
    textworld.create_zone("Zone1");
    textworld.create_room("Zone1", "Room1", "This is room 1 in zone 1");
    textworld.set_room_as_zone_starter("Zone1", "Room1");
    textworld.add_room_command_action(
      "Zone1",
      "Room1",
      "warp action",
      "Blue waves of light start spinning all around you. They get faster and faster until you can't see anything. When the light fades, you find yourself in a new place.",
      ["warp"],
      (_player, _input, _command, _args) => {
        return "warping...";
      }
    );
    await textworld.save_player_progress(
      player,
      "test_game_saves.db",
      "test_slot"
    );
    await textworld.load_player_progress("test_game_saves.db", "test_slot");
    const result = await textworld.parse_command(player, "warp");
    assertEquals(
      result,
      "Blue waves of light start spinning all around you. They get faster and faster until you can't see anything. When the light fades, you find yourself in a new place.\n\nwarping..."
    );
    await Deno.remove("test_game_saves.db");
    textworld.reset_world();
  }
);

Deno.test("room_actions_work_after_loading_player_progress", async () => {
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.add_room_command_action(
    "Zone1",
    "Room1",
    "xyzzy action",
    "You recited the magical word XYZZY!!!",
    ["xyzzy"],
    (_player: tw.Player, _input: string, _command: string, _args: string[]) =>
      "How dare you utter the magical word XYZZY!"
  );
  await textworld.save_player_progress(
    player,
    "test_game_saves.db",
    "test_slot"
  );
  await textworld.load_player_progress("test_game_saves.db", "test_slot");
  const result = await textworld.parse_command(player, "xyzzy");
  await Deno.remove("test_game_saves.db");
  assertEquals(
    result,
    "You recited the magical word XYZZY!!!\n\nHow dare you utter the magical word XYZZY!"
  );
  textworld.reset_world();
});

Deno.test("quest_actions_work_after_loading_player_progress", async () => {
  player.zone = "Zone1";
  player.room = "Room1";
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_item("Magic Ring", "A magic ring", false);
  textworld.place_item("Zone1", "Room1", "Magic Ring");
  textworld.create_quest("Quest1", "A quest");
  textworld.add_quest_step(
    "Quest1",
    "Step1",
    "Collect the magic ring",
    (player) => {
      if (player.items.some((item) => item.name === "Magic Ring")) {
        const quest_step = textworld.get_quest_step("Quest1", "Step1");
        if (quest_step) {
          return true;
        }
      }
      return false;
    }
  );
  textworld.pickup_quest(player, "Quest1");
  await textworld.save_player_progress(
    player,
    "test_game_saves.db",
    "test_slot"
  );
  await textworld.load_player_progress("test_game_saves.db", "test_slot");
  textworld.take_item(player, ["Magic Ring"]);
  const result = textworld.is_quest_complete(player, "Quest1");
  assertEquals(result, true);
  assertEquals(player.quests.length, 0);
  player.quests_completed.length = 0;
  player.items.length = 0;
  await Deno.remove("test_game_saves.db");
  textworld.reset_world();
});

Deno.test("dialog_actions_work_after_loading_player_progress", async () => {
  player.zone = "Zone1";
  player.room = "Room1";
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_npc("Guard", "A strong guard");
  textworld.create_dialog(
    "Guard",
    ["hello"],
    null,
    (_player, _input, _command, _args) => {
      return "this is a dialog action";
    }
  );
  textworld.place_npc("Zone1", "Room1", "Guard");
  await textworld.save_player_progress(
    player,
    "test_game_saves.db",
    "test_slot"
  );
  await textworld.load_player_progress("test_game_saves.db", "test_slot");
  const result = await textworld.parse_command(
    player,
    "talk to Guard say hello"
  );
  assertEquals(result, "this is a dialog action");
  await Deno.remove("test_game_saves.db");
  textworld.reset_world();
});

Deno.test("can_set_players_room_to_zone_start", () => {
  player.zone = "Zone1";
  player.room = "Room1";
  textworld.create_zone("Zone1");
  textworld.create_zone("Zone2");
  textworld.create_room("Zone1", "Room1", "This is room 1 in zone 1");
  textworld.create_room("Zone2", "Room1", "This is room 1 in zone 2");
  textworld.set_room_as_zone_starter("Zone1", "Room1");
  textworld.set_room_as_zone_starter("Zone2", "Room1");
  textworld.set_players_room_to_zone_start(player, "Zone2");
  assertEquals(player.zone, "Zone2");
  assertEquals(player.room, "Room1");
  textworld.reset_world();
});

Deno.test("can_set_players_room_to_another_room", () => {
  player.zone = "Zone1";
  player.room = "Room1";
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_room("Zone1", "Room2", "This is room 2");
  textworld.set_room_as_zone_starter("Zone1", "Room1");
  textworld.set_players_room(player, "Zone1", "Room2");
  assertEquals(player.zone, "Zone1");
  assertEquals(player.room, "Room2");
  textworld.reset_world();
});
