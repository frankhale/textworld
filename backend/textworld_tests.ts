// A Text Adventure Library & Game for Deno
// Frank Hale &lt;frankhaledevelops AT gmail.com&gt;
// 21 September 2024

import {
  assert,
  assertEquals,
  assertNotEquals,
  assertStringIncludes,
} from "@std/assert";

import * as tw from "./textworld.ts";

const textworld = new tw.TextWorld();

Deno.test("can_get_random_number", () => {
  const result = textworld.get_random_number(10);
  assert(result >= 0 && result <= 10);
  textworld.reset_world();
});

Deno.test("can_create_zone", () => {
  textworld.create_zone("Zone1");
  const zone = textworld.get_zone("Zone1");
  assertEquals(zone?.name, "Zone1");
  textworld.reset_world();
});

Deno.test("can_remove_zone", () => {
  textworld.create_zone("Zone1");
  textworld.remove_zone("Zone1");
  const zone = textworld.get_zone("Zone1");
  assertEquals(zone, null);
  textworld.reset_world();
});

Deno.test("find_command_action_returns_the_correct_actions", () => {
  const mockAction = () => "mock action";
  const commandActions: tw.CommandAction[] = [
    textworld.create_command_action(
      "look",
      "Look around",
      ["look", "see", "view"],
      mockAction,
    ),
    textworld.create_command_action(
      "move",
      "Move to a different location",
      ["move", "go", "walk"],
      mockAction,
    ),
    textworld.create_command_action(
      "talk",
      "Talk to someone",
      ["talk", "speak", "chat"],
      mockAction,
    ),
  ];

  const possibleActions1 = ["look", "examine", "inspect"];
  const possibleActions2 = ["move", "run", "walk"];
  const possibleActions3 = ["talk", "speak", "communicate"];
  const possibleActions4 = ["eat", "consume", "ingest"];

  const result1 = textworld.find_command_action(
    possibleActions1,
    commandActions,
  );
  assertEquals(result1?.name, "look");

  const result2 = textworld.find_command_action(
    possibleActions2,
    commandActions,
  );
  assertEquals(result2?.name, "move");

  const result3 = textworld.find_command_action(
    possibleActions3,
    commandActions,
  );
  assertEquals(result3?.name, "talk");

  const result4 = textworld.find_command_action(
    possibleActions4,
    commandActions,
  );
  assertEquals(result4, null);
  textworld.reset_world();
});

Deno.test("find_room_command_action_returns_the_correct_actions", () => {
  const mockAction = () => "mock action";
  const zoneName = "Zone1";
  const roomName = "Room1";
  textworld.create_zone(zoneName);
  textworld.create_room(zoneName, roomName, "A test room");
  textworld.add_room_command_action(
    zoneName,
    roomName,
    "look",
    "Look around the room",
    ["look", "see", "view"],
    mockAction,
  );
  textworld.add_room_command_action(
    zoneName,
    roomName,
    "move",
    "Move within the room",
    ["move", "go", "walk"],
    mockAction,
  );

  const filteredActions1 = ["look", "examine", "inspect"];
  const filteredActions2 = ["move", "run", "walk"];
  const filteredActions3 = ["talk", "speak", "communicate"];

  const result1 = textworld.find_room_command_action(
    filteredActions1,
    zoneName,
    roomName,
  );
  assertEquals(result1?.name, "look");

  const result2 = textworld.find_room_command_action(
    filteredActions2,
    zoneName,
    roomName,
  );
  assertEquals(result2?.name, "move");

  const result3 = textworld.find_room_command_action(
    filteredActions3,
    zoneName,
    roomName,
  );
  assertEquals(result3, null);
  textworld.reset_world();
});

Deno.test("can_create_player", () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  const result = textworld.get_player(player.id);
  assertEquals(result?.name, "Player");
  textworld.reset_world();
});

Deno.test("can_get_player", () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  const p1 = textworld.get_player(player.id!);
  assertEquals(p1?.name, "Player");
  textworld.reset_world();
});

Deno.test("can_add_item_to_player", () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  textworld.create_item("Sword", "A sharp sword", false);
  textworld.add_item_to_player(player, "Sword");
  assertEquals(player.items.length, 1);
  assertEquals(player.items[0].name, "Sword");
  textworld.add_item_to_player(player, "Sword");
  assertEquals(player.items[0].name, "Sword");
  assertEquals(player.items[0].quantity, 2);
  textworld.reset_world();
});

Deno.test("can_set_players_health_to_max", () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  textworld.set_actor_health_to_max(player);
  assertEquals(textworld.get_actor_health(player), 10);
  textworld.reset_world();
});

Deno.test("can_add_health_to_player", () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  textworld.set_actor_health(player, 2);
  textworld.add_to_actor_health(player, 3);
  assertEquals(textworld.get_actor_health(player), 5);
  textworld.reset_world();
});

Deno.test("can_increase_player_max_health", () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  textworld.increase_actor_max_heath(player, 20);
  const result = textworld.get_actor_max_health(player);
  assertEquals(result, 30);
  textworld.reset_world();
});

Deno.test("cant_increase_actor_max_health_if_actor_does_not_have_stats", () => {
  const actor: tw.Actor = {
    id: crypto.randomUUID(),
    name: "Actor",
    descriptions: [],
    flags: [],
    items: [],
  };
  textworld.increase_actor_max_heath(actor, 20);
  const result = textworld.get_actor_max_health(actor);
  assertEquals(result, 0);
  textworld.reset_world();
});

Deno.test("actor_without_stats_should_return_zero_when_get_actor_health_called", () => {
  const actor: tw.Actor = {
    id: crypto.randomUUID(),
    name: "Actor",
    descriptions: [],
    flags: [],
    items: [],
  };
  const result = textworld.get_actor_health(actor);
  assertEquals(result, 0);
  textworld.reset_world();
});

Deno.test("can_check_to_see_if_players_health_is_full", () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  const result = textworld.is_actor_health_full(player);
  assertEquals(result, true);
  textworld.reset_world();
});

Deno.test("cant_get_player_zone_if_player_zone_is_invalid", () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "",
    "Room1",
  );
  const result = textworld.get_player_zone(player);
  assertEquals(result, null);
  textworld.reset_world();
});

Deno.test("cant_ressurect_actor_that_has_no_stats", () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  player.stats = undefined;

  try {
    textworld.resurrect_actor(player);
  } catch (e) {
    assertEquals(e.message, "Actor does not have stats.");
  }

  textworld.reset_world();
});

Deno.test("can_ressurect_player", () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.set_room_as_zone_starter("Zone1", "Room1");
  textworld.set_actor_health(player, 0);
  textworld.resurrect_actor(player);
  assertEquals(textworld.get_actor_health(player), 10);
  textworld.reset_world();
});

Deno.test("can_remove_player", () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  textworld.remove_player(player);
  const p1 = textworld.get_player(player.id!);
  assertEquals(p1, null);
  textworld.reset_world();
});

Deno.test("can_create_quest", () => {
  textworld.create_quest("Quest1", "A quest");
  const quest = textworld.get_quest("Quest1");
  assertEquals(quest?.name, "Quest1");
  textworld.reset_world();
});

Deno.test("can_add_quest_step_to_quest", () => {
  textworld.create_quest("Quest1", "A quest");
  textworld.add_quest_step("Quest1", "Step1", "A step");
  const quest = textworld.get_quest("Quest1");
  assertEquals(quest?.steps?.length, 1);
  textworld.reset_world();
});

Deno.test("cant_add_quest_action_to_quest_that_doesnt_exist", () => {
  try {
    textworld.add_quest_action("Quest1", "Start", (_player) => {
      return "Hello, World!";
    });
  } catch (e) {
    assertEquals(e.message, "Quest Quest1 does not exist.");
  }

  textworld.reset_world();
});

Deno.test("can_add_quest_action_to_quest", () => {
  textworld.create_quest("Quest1", "A quest");
  textworld.add_quest_action("Quest1", "Start", (_player) => {
    return "Hello, World!";
  });
  const quest_action = textworld.get_quest_action("Quest1");
  assertNotEquals(quest_action, null);
  textworld.reset_world();
});

Deno.test("cant_add_quest_action_to_quest_that_has_quest_actions", () => {
  textworld.create_quest("Quest1", "A quest");
  textworld.add_quest_action("Quest1", "Start", (_player) => {
    return "Hello, World!";
  });
  textworld.add_quest_action("Quest1", "End", (_player) => {
    return "Hello, World!";
  });

  try {
    textworld.add_quest_action("Quest1", "Start", (_player) => {
      return "Hello, World!";
    });
  } catch (e) {
    assertEquals(e.message, "Quest Quest1 already has an action for Start.");
  }

  try {
    textworld.add_quest_action("Quest1", "End", (_player) => {
      return "Hello, World!";
    });
  } catch (e) {
    assertEquals(e.message, "Quest Quest1 already has an action for End.");
  }

  textworld.reset_world();
});

Deno.test("cant_get_quest_action_if_quest_doesnt_exist", () => {
  const quest = textworld.get_quest_action("Quest1");
  assertEquals(quest, null);
  textworld.reset_world();
});

Deno.test("cant_get_quest_step_action_if_quest_step_doesnt_exist", () => {
  const quest = textworld.get_quest_step_action("Quest1", "Step1");
  assertEquals(quest, null);
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
  textworld.reset_world();
});

Deno.test("cant_add_quest_step_to_quest_that_doesnt_exist", () => {
  try {
    textworld.add_quest_step("Quest1", "Step1", "A step", (_player) => {
      return true;
    });
  } catch (e) {
    assertEquals(e.message, "Quest Quest1 does not exist.");
  }
  textworld.reset_world();
});

Deno.test("cant_get_quest_step_action_that_doesnt_exist", () => {
  textworld.create_quest("Quest1", "A quest");
  textworld.add_quest_step("Quest1", "Step1", "A step", null);
  const quest_step_action = textworld.get_quest_step_action("Quest1", "Step1");
  assertEquals(quest_step_action, null);
  textworld.reset_world();
});

Deno.test("can_create_room", () => {
  textworld.create_zone("Zone1");
  const zone = textworld.get_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  assertEquals(zone!.rooms.length, 1);
  textworld.reset_world();
});

Deno.test("can_create_instanced_room", () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  const non_instanced_room = textworld.get_room("Zone1", "Room1");
  assertEquals(non_instanced_room?.instance, false);
  textworld.create_instanced_room(player, "Zone1", "Room1");
  const room = textworld.get_instance_room(player, "Zone1", "Room1");
  assertEquals(room?.instance, true);
  textworld.reset_world();
});

Deno.test("can_create_instanced_room_with_item", () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_instanced_room(player, "Zone1", "Room1");
  textworld.create_item("Sword", "A sharp sword", false);
  textworld.place_item("Zone1", "Room1", "Sword", 1, player);
  const instanced_room = textworld.get_instance_room(player, "Zone1", "Room1");
  assertEquals(instanced_room?.items.length, 1);
  const non_instanced_room = textworld.get_room("Zone1", "Room1");
  assertEquals(non_instanced_room?.items.length, 0);
  textworld.reset_world();
});

Deno.test("can_create_instanced_room_with_mob", () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_instanced_room(player, "Zone1", "Room1");
  textworld.create_mob(
    "Goblin",
    "A small goblin",
    textworld.create_stats(
      { current: 10, max: 10 },
      { current: 10, max: 10 },
      { current: 10, max: 10 },
      15,
      8,
      5,
      2,
      0.05,
      { level: 1, xp: 0 },
    ),
    [],
  );
  textworld.place_mob("Zone1", "Room1", "Goblin", player);
  const instanced_room = textworld.get_instance_room(player, "Zone1", "Room1");
  assertEquals(instanced_room?.mobs.length, 1);
  const non_instanced_room = textworld.get_room("Zone1", "Room1");
  assertEquals(non_instanced_room?.mobs.length, 0);
  textworld.reset_world();
});

Deno.test("create_instanced_room_with_npc", () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_instanced_room(player, "Zone1", "Room1");
  textworld.create_npc("Guard", "A strong guard");
  textworld.place_npc("Zone1", "Room1", "Guard", player);
  const instanced_room = textworld.get_instance_room(player, "Zone1", "Room1");
  assertEquals(instanced_room?.npcs.length, 1);
  const non_instanced_room = textworld.get_room("Zone1", "Room1");
  assertEquals(non_instanced_room?.npcs.length, 0);
  textworld.reset_world();
});

Deno.test("cant_create_room_without_a_zone", () => {
  try {
    textworld.create_room("Zone1", "Room1", "This is room 1");
  } catch (e) {
    assertEquals(e.message, "Zone Zone1 does not exist.");
  }
  textworld.reset_world();
});

Deno.test("can_describe_room", () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  const result = textworld.get_room_description(player);
  assertEquals(result.response, "This is room 1");
  textworld.reset_world();
});

Deno.test("can_describe_room_with_room_actions", () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1", (_player) => {
    return `The healing waters have no effect on you.`;
  });
  const result = textworld.get_room_description(player);
  assertEquals(
    result.response,
    "This is room 1\n\nThe healing waters have no effect on you.",
  );
  textworld.reset_world();
});

Deno.test("can_create_alternate_room_description", () => {
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.add_room_description(
    "Zone1",
    "Room1",
    "room1-alt",
    "This is room 1, again!",
  );
  const room = textworld.get_room("Zone1", "Room1");
  assertEquals(room?.descriptions.length, 2);
  textworld.reset_world();
});

Deno.test("can_show_alternate_room_description", () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.add_room_description(
    "Zone1",
    "Room1",
    "room1-alt",
    "This is an alternate room1 description!",
  );
  let result = textworld.get_room_description(player);
  assertEquals(result.response, "This is room 1");
  textworld.set_flag(player, "room1-alt");
  result = textworld.get_room_description(player);
  assertEquals(
    result.response,
    "This is an alternate room1 description!",
  );
  player.flags.length = 0;
  textworld.reset_world();
});

Deno.test("can_show_alternate_room_description_and_switch_to_default", () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.add_room_description(
    "Zone1",
    "Room1",
    "room1-alt",
    "This is an alternate room1 description!",
  );
  let result = textworld.get_room_description(player);
  assertEquals(result.response, "This is room 1");
  textworld.set_flag(player, "room1-alt");
  result = textworld.get_room_description(player);
  assertEquals(
    result.response,
    "This is an alternate room1 description!",
  );
  player.flags.length = 0;
  result = textworld.get_room_description(player);
  assertEquals(result.response, "This is room 1");
  textworld.reset_world();
});

Deno.test("can_remove_room", () => {
  textworld.create_zone("Zone1");
  const zone = textworld.get_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.remove_room("Zone1", "Room1");
  assertEquals(zone!.rooms.length, 0);
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
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_room("Zone1", "Room2", "This is room 2", (_player) => {
    return `The healing waters have no effect on you.`;
  });
  textworld.create_exit("Zone1", "Room1", "north", "Room2");
  const result = textworld.switch_room(player, "north");
  assertEquals(
    result.response,
    `This is room 2\n\nThe healing waters have no effect on you.`,
  );
  assertEquals(result.exits, "south");
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
    { name: "Iron Sword", quantity: 1 },
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
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  textworld.create_item("Sword", "A sharp sword", false);
  textworld.create_item("Potion", "A potion", true, (_player) => {
    return "You drank the potion but nothing happened.";
  });
  const item = textworld.get_item("Potion");
  assertEquals(item?.name, "Potion");
  const result = textworld.get_item_action("Potion");
  assertEquals(
    result?.action(player),
    "You drank the potion but nothing happened.",
  );
  try {
    textworld.get_item_action("Foobar");
  } catch (e) {
    assertEquals(e.message, "Item Foobar does not exist.");
  }
  const result2 = textworld.get_item_action("Sword");
  assertEquals(result2, null);
  textworld.reset_world();
});

Deno.test("can_get_item", () => {
  textworld.create_item("Sword", "A sharp sword", false);
  const item = textworld.get_item("Sword");
  assertEquals(item?.name, "Sword");
  textworld.reset_world();
});

Deno.test("can_get_room_item", () => {
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_item("Sword", "A sharp sword", false);
  textworld.place_item("Zone1", "Room1", "Sword");
  const item = textworld.get_room_item("Zone1", "Room1", "Sword");
  assertEquals(item?.name, "Sword");
  textworld.reset_world();
});

Deno.test("cant_get_room_item_if_zone_does_not_exist", () => {
  try {
    textworld.get_room_item("Zone1", "Room1", "Sword");
  } catch (e) {
    assertEquals(e.message, "Zone Zone1 does not exist.");
  }
  textworld.reset_world();
});

Deno.test("cant_get_room_item_if_room_does_not_exist", () => {
  textworld.create_zone("Zone1");
  try {
    textworld.get_room_item("Zone1", "Room1", "Sword");
  } catch (e) {
    assertEquals(e.message, "Room Room1 does not exist in zone Zone1.");
  }
  textworld.reset_world();
});

Deno.test("can_place_item_in_room", () => {
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_item("Sword", "A sharp sword", false);
  textworld.place_item("Zone1", "Room1", "Sword");
  const item = textworld.get_room_item("Zone1", "Room1", "Sword");
  assertEquals(item?.name, "Sword");
  textworld.reset_world();
});

Deno.test("cant_place_item_in_room_if_item_doesnt_exist", () => {
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  try {
    textworld.place_item("Zone1", "Room1", "Sword");
  } catch (e) {
    assertEquals(e.message, "Item Sword does not exist.");
  }
  textworld.reset_world();
});

Deno.test("cant_place_item_in_room_if_room_doesnt_exist", () => {
  textworld.create_zone("Zone1");
  textworld.create_item("Sword", "A sharp sword", false);
  try {
    textworld.place_item("Zone1", "Room1", "Sword");
  } catch (e) {
    assertEquals(e.message, "Room Room1 does not exist in zone Zone1.");
  }
  textworld.reset_world();
});

Deno.test("can_add_item_drops_to_room", () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_item("Sword", "A sharp sword", false);
  textworld.create_item("Potion", "An ordinary potion", true);
  textworld.create_instanced_room(player, "Zone1", "Room1");
  textworld.place_item("Zone1", "Room1", "Sword", 1, player);
  textworld.place_item("Zone1", "Room1", "Potion", 2, player);
  const room = textworld.get_player_room(player);
  assertEquals(room?.items.length, 2);
  assertEquals(room?.items[0].name, "Sword");
  assertEquals(room?.items[1].name, "Potion");
  textworld.reset_world();
});

Deno.test("can_create_mob", () => {
  textworld.create_mob(
    "Goblin",
    "A small goblin",
    textworld.create_stats(
      { current: 10, max: 10 },
      { current: 10, max: 10 },
      { current: 10, max: 10 },
      15,
      8,
      5,
      2,
      0.05,
      { level: 1, xp: 0 },
    ),
    [],
  );
  const mob = textworld.get_mob("Goblin");
  assertEquals(mob?.name, "Goblin");
  textworld.reset_world();
});

Deno.test("cant_get_mob_that_does_not_exist", () => {
  const mob = textworld.get_mob("Goblin");
  assertEquals(mob, null);
});

Deno.test("can_place_mob_in_room", () => {
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_mob(
    "Goblin",
    "A small goblin",
    textworld.create_stats(
      { current: 10, max: 10 },
      { current: 10, max: 10 },
      { current: 10, max: 10 },
      15,
      8,
      5,
      2,
      0.05,
      { level: 1, xp: 0 },
    ),
    [],
  );
  textworld.place_mob("Zone1", "Room1", "Goblin");
  const room = textworld.get_room("Zone1", "Room1");
  assertEquals(room?.mobs.length, 1);
  assertEquals(room?.mobs[0].name, "Goblin");
  textworld.reset_world();
});

Deno.test("can_get_room_mob", () => {
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_mob(
    "Goblin",
    "A small goblin",
    textworld.create_stats(
      { current: 10, max: 10 },
      { current: 10, max: 10 },
      { current: 10, max: 10 },
      15,
      8,
      5,
      2,
      0.05,
      { level: 1, xp: 0 },
    ),
    [],
  );
  textworld.place_mob("Zone1", "Room1", "Goblin");
  const mob = textworld.get_room_mob("Zone1", "Room1", "Goblin");
  assertEquals(mob?.name, "Goblin");
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
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_npc("Old Lady", "A sweet old lady");
  textworld.place_npc("Zone1", "Room1", "Old Lady");
  textworld.remove_npc("Old Lady", "Zone1", "Room1");
  const room = textworld.get_room("Zone1", "Room1");
  assertEquals(room?.npcs.length, 0);
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
      "How dare you utter the magical word XYZZY!",
  );
  const has_room_action = textworld.has_room_command_action(
    "Zone1",
    "Room1",
    "xyzzy action",
  );
  assertEquals(has_room_action, true);
  textworld.reset_world();
});

Deno.test("can_add_flag_on_player", () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  textworld.set_flag(player, "flag1");
  const has_flag = textworld.has_flag(player, "flag1");
  assertEquals(has_flag, true);
  player.flags.length = 0;
  textworld.reset_world();
});

Deno.test("can_remove_flag_on_player", () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  textworld.set_flag(player, "flag1");
  textworld.remove_flag(player, "flag1");
  const has_flag = textworld.has_flag(player, "flag1");
  assertEquals(has_flag, false);
  textworld.reset_world();
});

Deno.test("can_add_god_mode_flag_on_player", () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  textworld.set_godmode(player);
  const has_flag = textworld.has_flag(player, "godmode");
  assertEquals(has_flag, true);
  textworld.reset_world();
});

Deno.test("can_remove_god_mode_flag_on_player", () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  textworld.set_godmode(player);
  textworld.remove_godmode(player);
  const has_flag = textworld.has_flag(player, "godmode");
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
      "How dare you utter the magical word XYZZY!",
  );
  textworld.remove_room_command_action("Zone1", "Room1", "xyzzy action");
  const has_room_action = textworld.has_room_command_action(
    "Zone1",
    "Room1",
    "xyzzy action",
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

Deno.test("cant_place_npc_in_room_if_npc_doesnt_exist", () => {
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  try {
    textworld.place_npc("Zone1", "Room1", "Guard");
  } catch (e) {
    assertEquals(e.message, "NPC Guard does not exist.");
  }
  textworld.reset_world();
});

Deno.test("cant_place_npc_in_room_if_room_doesnt_exist", () => {
  textworld.create_zone("Zone1");
  textworld.create_npc("Guard", "A strong guard");
  try {
    textworld.place_npc("Zone1", "Room1", "Guard");
  } catch (e) {
    assertEquals(e.message, "Room Room1 does not exist in zone Zone1.");
  }
  textworld.reset_world();
});

Deno.test("cant_get_room_npc_if_room_doesnt_exist", () => {
  textworld.create_zone("Zone1");
  try {
    textworld.get_room_npc("Zone1", "Room1", "Guard");
  } catch (e) {
    assertEquals(e.message, "Room Room1 does not exist in zone Zone1.");
  }
  textworld.reset_world();
});

Deno.test("cant_get_room_npc_if_npc_doesnt_exist", () => {
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  try {
    textworld.get_room_npc("Zone1", "Room1", "Guard");
  } catch (e) {
    assertEquals(e.message, "NPC Guard does not exist.");
  }
  textworld.reset_world();
});

Deno.test("can_set_and_remove_godmode_on_player", () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
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
  textworld.create_object(
    "Fireplace",
    "A warm fire burns in the fireplace and you can feel the heat radiating from it.",
  );
  textworld.place_object("Zone1", "Room1", "Fireplace");
  const object = textworld.get_room_object("Zone1", "Room1", "Fireplace");
  assertEquals(object?.name, "Fireplace");
  assertEquals(
    object?.descriptions[0].description,
    "A warm fire burns in the fireplace and you can feel the heat radiating from it.",
  );
  textworld.reset_world();
});

Deno.test("can_process_look_at_room_object", () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_object(
    "Fireplace",
    "A warm fire burns in the fireplace and you can feel the heat radiating from it.",
  );
  textworld.place_object("Zone1", "Room1", "Fireplace");
  const result = textworld.look_at_or_examine_object(
    player,
    "look at fireplace",
    "look at",
    ["look", "at", "fireplace"],
  );
  assertEquals(
    result.response,
    "A warm fire burns in the fireplace and you can feel the heat radiating from it.",
  );
  textworld.reset_world();
});

Deno.test("can_process_examine_room_object", () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_object(
    "Fireplace",
    "A warm fire burns in the fireplace and you can feel the heat radiating from it.",
    [
      {
        name: "Fireplace",
        trigger: ["fan flame"],
        response: "The flames become stronger as you fan them.",
      },
    ],
  );
  textworld.place_object("Zone1", "Room1", "Fireplace");
  const result = textworld.look_at_or_examine_object(
    player,
    "examine fireplace fan flame",
    "examine",
    ["examine", "fireplace", "fan", "flame"],
  );
  assertEquals(result.response, "The flames become stronger as you fan them.");
  textworld.reset_world();
});

Deno.test("can_process_get_room_description_with_no_rooms", () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  textworld.create_zone("Zone1");
  const result = textworld.get_room_description(player);
  assertEquals(result.response, "You can't see anything.");
  textworld.reset_world();
});

Deno.test("can_process_get_exit_with_no_rooms", () => {
  try {
    textworld.get_exit("Zone1", "Room1", "north");
  } catch (e) {
    assertEquals(e.message, "Zone Zone1 does not exist.");
  }
  textworld.reset_world();
});

Deno.test("can_parse_command_get_help", async () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  const result = JSON.parse(await textworld.parse_command(player, "help"));
  assertEquals(
    result.response,
    "Commands:\n\nnorth, south, east, west - Commands for moving around the world.\ntake, get - Take an item from the room or an NPC.\nuse - Use an item in your inventory.\ndrop - Drop an item or all your items from your inventory.\nlook, l - Look around the room or at yourself.\nls - Look at yourself.\nexamine, x - Examine an object in a room.\ninspect, i, search - Inspect a room to see what items are there.\nmap - Plot a map showing nearby rooms.\nshow - Show an item in your inventory.\ntalk to, tt - Talk to an NPC or Vendor.\ngoto - Go to a room or zone.\nhelp - Show the help text.\nattack - Attack a mob.\ncraft - Craft an item.",
  );
  textworld.reset_world();
});

Deno.test("can_parse_command_get_help_when_player_is_dead", async () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  textworld.set_actor_health(player, 0);
  const result = JSON.parse(await textworld.parse_command(player, "help"));
  assertEquals(
    result.response,
    "Commands:\n\nhelp - Show the help text.\nresurrect, rez - resurrect yourself.",
  );
  textworld.reset_world();
});

Deno.test("can_parse_command_examine_room_object", async () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_object(
    "Fireplace",
    "A warm fire burns in the fireplace and you can feel the heat radiating from it.",
    [
      {
        name: "Fireplace",
        trigger: ["fan flame"],
        response: "The flames become stronger as you fan them.",
      },
    ],
  );
  textworld.place_object("Zone1", "Room1", "Fireplace");
  const result = JSON.parse(
    await textworld.parse_command(
      player,
      "examine fireplace fan flame",
    ),
  );
  assertEquals(result.response, "The flames become stronger as you fan them.");
  textworld.reset_world();
});

Deno.test("can_parse_command_attack_mob", async () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  textworld.set_actor_health(player, 100);
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_mob(
    "Goblin",
    "A small goblin",
    textworld.create_stats(
      { current: 10, max: 10 },
      { current: 10, max: 10 },
      { current: 10, max: 10 },
      15,
      8,
      5,
      2,
      0.05,
      { level: 1, xp: 0 },
    ),
    [],
  );
  textworld.place_mob("Zone1", "Room1", "Goblin");
  const result = JSON.parse(
    await textworld.parse_command(player, "attack goblin"),
  );
  assertStringIncludes(result.response, "Player attacks Goblin");
  textworld.reset_world();
});

Deno.test("can_parse_command_direction", async () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_room("Zone1", "Room2", "This is room 2");
  textworld.create_exit("Zone1", "Room1", "north", "Room2");
  const result = JSON.parse(await textworld.parse_command(player, "north"));
  assertEquals(
    result.response,
    "This is room 2",
  );
  assertEquals(result.exits, "south");
  textworld.reset_world();
});

Deno.test("can_parse_command_goto_room", async () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  textworld.set_godmode(player);
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "The Room1", "This is room 1");
  textworld.create_room("Zone1", "The Room2", "This is room 2");
  const result = JSON.parse(
    await textworld.parse_command(player, "goto room The Room2"),
  );
  assertEquals(result.response, "This is room 2");
  textworld.remove_godmode(player);
  textworld.reset_world();
});

Deno.test("can_parse_command_goto_when_requirements_arent_met", async () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  textworld.create_zone("Zone1");
  const result = JSON.parse(
    await textworld.parse_command(player, "goto room The Room2"),
  );
  assertEquals(result.response, "I don't understand that command.");
  textworld.reset_world();
});

Deno.test("can_parse_command_goto_zone", async () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  textworld.set_godmode(player);
  textworld.create_zone("Zone1");
  textworld.create_zone("Zone2");
  textworld.create_room("Zone1", "The Room1", "This is room 1");
  textworld.create_room("Zone2", "The Forest", "This is the forest");
  textworld.set_room_as_zone_starter("Zone2", "The Forest");
  const result = JSON.parse(
    await textworld.parse_command(player, "goto zone Zone2"),
  );
  assertEquals(result.response, "This is the forest");
  textworld.remove_godmode(player);
  textworld.reset_world();
});

Deno.test("can_parse_command_take", async () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_item("Sword", "A sharp sword", false);
  textworld.place_item("Zone1", "Room1", "Sword");
  const result = JSON.parse(
    await textworld.parse_command(player, "take sword"),
  );
  assertEquals(result.response, "You took the Sword.");
  assertEquals(player.items.length, 1);
  textworld.reset_world();
});

Deno.test("can_parse_command_take_all", async () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_item("Sword", "A sharp sword", false);
  textworld.create_item("Potion", "An ordinary potion", true);
  textworld.place_item("Zone1", "Room1", "Sword");
  textworld.place_item("Zone1", "Room1", "Potion", 2);
  const result = JSON.parse(await textworld.parse_command(player, "take all"));
  assertEquals(result.response, "You took all items: Sword (1), Potion (2)");
  assertEquals(player.items.length, 2);
  textworld.reset_world();
});

Deno.test("can_parse_command_use", async () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_item("Potion", "An ordinary potion", true, (_player) => {
    return "You drank the potion but nothing happened.";
  });
  textworld.place_item("Zone1", "Room1", "Potion");
  textworld.take_item(player, ["Potion"]);
  const result = JSON.parse(
    await textworld.parse_command(player, "use potion"),
  );
  assertEquals(result.response, "You drank the potion but nothing happened.");
  assertEquals(player.items.length, 0);
  textworld.reset_world();
});

Deno.test("can_parse_command_drop", async () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  textworld.create_zone("Zone1");
  textworld.create_item("Potion", "An ordinary potion", true);
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.place_item("Zone1", "Room1", "Potion");
  textworld.take_item(player, ["Potion"]);
  const result = JSON.parse(
    await textworld.parse_command(player, "drop potion"),
  );
  assertEquals(result.response, "You dropped the Potion.");
  assertEquals(player.items.length, 0);
  textworld.reset_world();
});

Deno.test("can_parse_command_drop_all", async () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_item("Sword", "A sharp sword", false);
  textworld.create_item("Potion", "An ordinary potion", true);
  textworld.place_item("Zone1", "Room1", "Sword");
  textworld.place_item("Zone1", "Room1", "Potion", 2);
  textworld.take_all_items(player);
  const result = JSON.parse(await textworld.parse_command(player, "drop all"));
  assertEquals(result.response, "You dropped all your items.");
  assertEquals(player.items.length, 0);
  textworld.reset_world();
});

Deno.test("can_parse_command_look", async () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  const result = JSON.parse(await textworld.parse_command(player, "look"));
  assertEquals(result.response, "This is room 1");
  textworld.reset_world();
});

Deno.test("can_parse_command_look_at_self", async () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  const result = JSON.parse(await textworld.parse_command(player, "look self"));
  assertEquals(result.response, "You are a strong adventurer");
});

Deno.test("can_parse_command_look_at_self_synonym_ls", async () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  const result = JSON.parse(await textworld.parse_command(player, "ls"));
  assertEquals(result.response, "You are a strong adventurer");
});

Deno.test("can_parse_command_look_at_object", async () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_object(
    "Sword",
    "A sharp sword",
  );
  textworld.place_object("Zone1", "Room1", "Sword");
  const result = JSON.parse(
    await textworld.parse_command(player, "look at sword"),
  );
  assertEquals(result.response, "A sharp sword");
  textworld.reset_world();
});

Deno.test("can_parse_command_examine_object", async () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_object(
    "Fireplace",
    "A warm fire burns in the fireplace and you can feel the heat radiating from it.",
    [
      {
        name: "Fireplace",
        trigger: ["fan flames"],
        response: "The flames become stronger as you fan them.",
      },
    ],
  );
  textworld.place_object("Zone1", "Room1", "Fireplace");
  const result = JSON.parse(
    await textworld.parse_command(
      player,
      "examine fireplace fan flames",
    ),
  );
  assertEquals(result.response, "The flames become stronger as you fan them.");
  textworld.reset_world();
});

Deno.test("can_parse_command_inspect_room_with_no_items", async () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  const result = JSON.parse(await textworld.parse_command(player, "inspect"));
  assertEquals(
    result.response,
    "You inspect the room and found:\n\nThere is nothing else of interest here.",
  );
  textworld.reset_world();
});

Deno.test("can_parse_command_inspect_room_with_items", async () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_item("Sword", "A sharp sword", false);
  textworld.create_item("Potion", "An ordinary potion", true);
  textworld.place_item("Zone1", "Room1", "Sword");
  textworld.place_item("Zone1", "Room1", "Potion", 2);
  const result = JSON.parse(await textworld.parse_command(player, "inspect"));
  assertEquals(
    result.response,
    "You inspect the room and found:\n\nItems: Sword (1), Potion (2)",
  );
  textworld.reset_world();
});

Deno.test("can_parse_command_show_item", async () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_item("Potion", "An ordinary potion", true);
  textworld.place_item("Zone1", "Room1", "Potion", 2);
  textworld.take_item(player, ["Potion"]);
  const result = JSON.parse(
    await textworld.parse_command(player, "show potion"),
  );
  assertEquals(result.response, "An ordinary potion");
  textworld.reset_world();
});

Deno.test("can_parse_command_show_all_items", async () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_item("Sword", "A sharp sword", false);
  textworld.create_item("Potion", "An ordinary potion", true);
  textworld.place_item("Zone1", "Room1", "Sword");
  textworld.place_item("Zone1", "Room1", "Potion", 2);
  textworld.take_all_items(player);
  const result = JSON.parse(await textworld.parse_command(player, "show all"));
  assertEquals(
    result.response,
    "Sword - A sharp sword\n\nPotion - An ordinary potion",
  );
  textworld.reset_world();
});

Deno.test("can_parse_command_show_quests", async () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  textworld.create_quest("Kill the dragon", "Kill the dragon");
  textworld.pickup_quest(player, "Kill the dragon");
  const result = JSON.parse(
    await textworld.parse_command(player, "show quests"),
  );
  assertEquals(result.response, "Kill the dragon - Kill the dragon");
  textworld.reset_world();
});

Deno.test(
  "can_parse_command_show_quests_with_empty_quest_journal",
  async () => {
    const player = textworld.create_player(
      "Player",
      "You are a strong adventurer",
      "Zone1",
      "Room1",
    );
    const result = JSON.parse(
      await textworld.parse_command(player, "show quests"),
    );
    assertEquals(result.response, "You have no quests.");
    textworld.reset_world();
  },
);

Deno.test("can_parse_incorrect_command_to_talk_to_npc", async () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_npc("Guard", "A strong guard");
  textworld.create_dialog(
    "Guard",
    ["hello"],
    "Hello citizen, make sure you mind the law!",
  );
  textworld.place_npc("Zone1", "Room1", "Guard");
  const result = JSON.parse(await textworld.parse_command(player, "talk to"));
  assertEquals(result.response, "hmm...");
  textworld.reset_world();
});

Deno.test("can_parse_command_talk_to_npc", async () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_npc("Guard", "A strong guard");
  textworld.create_dialog(
    "Guard",
    ["hello"],
    "Hello citizen, make sure you mind the law!",
  );
  textworld.place_npc("Zone1", "Room1", "Guard");
  const result = JSON.parse(
    await textworld.parse_command(
      player,
      "talk to Guard say hello",
    ),
  );
  assertEquals(result.response, "Hello citizen, make sure you mind the law!");
  textworld.reset_world();
});

Deno.test("can_parse_command_talk_to_npc_and_get_item", async () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_npc("Old_woman", "An ordinary old woman");
  textworld.create_dialog(
    "Old_woman",
    ["hello", "hi"],
    (player, _input, _command, _args) => {
      if (textworld.has_flag(player, "took_gem")) {
        return "Hi, how are you?";
      } else {
        return "Hi, I have a gem you may want!";
      }
    },
  );
  textworld.create_dialog(
    "Old_woman",
    ["take"],
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
    },
  );
  textworld.place_npc("Zone1", "Room1", "Old_woman");
  let result = JSON.parse(
    await textworld.parse_command(
      player,
      "talk to Old_woman say hello",
    ),
  );
  assertEquals(result.response, "Hi, I have a gem you may want!");
  result = JSON.parse(
    await textworld.parse_command(
      player,
      "talk to Old_woman say take gem",
    ),
  );
  assertEquals(result.response, "You took the Gem.");
  assertEquals(player.items.length, 1);
  result = JSON.parse(
    await textworld.parse_command(
      player,
      "talk to Old_woman say take gem",
    ),
  );
  assertEquals(result.response, "I don't have that item.");
  textworld.reset_world();
});

Deno.test("can_parse_command_talk_to_vendor_and_list_items", async () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_vendor("Vendor1", "A friendly food vendor", [
    { name: "Fried Chicken & Roasted Vegetables", price: 2 },
  ]);
  textworld.place_npc("Zone1", "Room1", "Vendor1");
  const result = JSON.parse(
    await textworld.parse_command(
      player,
      "talk to Vendor1 say items",
    ),
  );
  assertEquals(
    result.response,
    "Items for sale: Fried Chicken & Roasted Vegetables (2 gold)",
  );
  textworld.reset_world();
});

Deno.test("can_parse_command_talk_to_vendor_and_sell_item", async () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  player.gold = 10;
  textworld.create_item("Sword", "A sharp sword", false);
  textworld.set_item_level_and_value("Sword", 5, 25);
  textworld.add_item_to_player(player, "Sword", 2);
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_vendor("Vendor1", "A friendly vendor", []);
  textworld.place_npc("Zone1", "Room1", "Vendor1");
  const result = JSON.parse(
    await textworld.parse_command(
      player,
      "talk to Vendor1 say sell Sword 2",
    ),
  );
  assertEquals(
    result.response,
    "You sold '2' of 'Sword' for a value of '50'.",
  );
  assertEquals(player.gold, 60);
  assertEquals(textworld.has_item_in_quantity(player, "Sword", 2), false);
  textworld.add_item_to_player(player, "Sword", 1);
  const result2 = JSON.parse(
    await textworld.parse_command(
      player,
      "talk to Vendor1 say sell Sword",
    ),
  );
  assertEquals(
    result2.response,
    "You must specify a quantity to sell.",
  );
  const result3 = JSON.parse(
    await textworld.parse_command(
      player,
      "talk to Vendor1 say sell Sword 10",
    ),
  );
  assertEquals(
    result3.response,
    "You don't have 10 of sword to sell.",
  );
  textworld.remove_item("Sword"); // This shouldn't really happen
  const result4 = JSON.parse(
    await textworld.parse_command(
      player,
      "talk to Vendor1 say sell Sword 1",
    ),
  );
  assertEquals(result4.response, "That item does not exist.");
  textworld.reset_world();
});

Deno.test("can_parse_command_talk_to_vendor_and_purchase_item", async () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  player.gold = 10;
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_item(
    "Fried Chicken & Roasted Vegetables",
    "A delicious dinner of fried chicken and roasted vegetables.",
    false,
  );
  textworld.create_vendor("Vendor1", "A friendly food vendor", [
    { name: "Fried Chicken & Roasted Vegetables", price: 2 },
  ]);
  textworld.place_npc("Zone1", "Room1", "Vendor1");
  const result = JSON.parse(
    await textworld.parse_command(
      player,
      "talk to Vendor1 say buy Fried Chicken & Roasted Vegetables",
    ),
  );
  assertEquals(
    result.response,
    "You purchased Fried Chicken & Roasted Vegetables for 2 gold.",
  );
  textworld.reset_world();
});

Deno.test("can_parse_command_talk_to_vendor_and_purchase_item_with_synonmym", async () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  player.gold = 10;
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_item(
    "Fried Chicken & Roasted Vegetables",
    "A delicious dinner of fried chicken and roasted vegetables.",
    false,
  );
  textworld.create_vendor("Vendor1", "A friendly food vendor", [
    { name: "Fried Chicken & Roasted Vegetables", price: 2 },
  ]);
  textworld.place_npc("Zone1", "Room1", "Vendor1");
  const result = JSON.parse(
    await textworld.parse_command(
      player,
      "talk to Vendor1 say purchase Fried Chicken & Roasted Vegetables",
    ),
  );
  assertEquals(
    result.response,
    "You purchased Fried Chicken & Roasted Vegetables for 2 gold.",
  );
  textworld.reset_world();
});

Deno.test("can_parse_command_talk_to_vendor_and_handle_when_item_isnt_specified", async () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  player.gold = 10;
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_item(
    "Fried Chicken & Roasted Vegetables",
    "A delicious dinner of fried chicken and roasted vegetables.",
    false,
  );
  textworld.create_vendor("Vendor1", "A friendly food vendor", [
    { name: "Fried Chicken & Roasted Vegetables", price: 2 },
  ]);
  textworld.place_npc("Zone1", "Room1", "Vendor1");
  const result = JSON.parse(
    await textworld.parse_command(
      player,
      "talk to Vendor1 say buy",
    ),
  );
  assertEquals(
    result.response,
    "You must specify an item to purchase.",
  );
  textworld.reset_world();
});

Deno.test("can_parse_command_map", async () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_room("Zone1", "Room2", "This is room 2");
  textworld.create_room("Zone1", "Room3", "This is room 3");
  textworld.create_exit("Zone1", "Room1", "north", "Room2");
  textworld.create_exit("Zone1", "Room2", "east", "Room3");
  const result = JSON.parse(await textworld.parse_command(player, "map"));
  assertEquals(result.response, `#-#\n|  \n@  `);
  textworld.reset_world();
});

Deno.test("can_parse_room_command_action", async () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.add_room_command_action(
    "Zone1",
    "Room1",
    "xyzzy action",
    "You recited the magical word XYZZY!!!",
    ["xyzzy"],
    (_player: tw.Player, _input: string, _command: string, _args: string[]) =>
      "How dare you utter the magical word XYZZY!",
  );
  const result = JSON.parse(await textworld.parse_command(player, "xyzzy"));
  assertEquals(
    result.response,
    "You recited the magical word XYZZY!!!\n\nHow dare you utter the magical word XYZZY!",
  );
  textworld.reset_world();
});

Deno.test("can_parse_malformed_command", async () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  textworld.create_zone("Zone1");
  let result = JSON.parse(await textworld.parse_command(player, "talk to"));
  assertEquals(result.response, "hmm...");
  result = JSON.parse(await textworld.parse_command(player, "foobar"));
  assertEquals(result.response, "I don't understand that command.");
  result = JSON.parse(await textworld.parse_command(player, "show"));
  assertEquals(result.response, "That item does not exist.");
  try {
    JSON.parse(await textworld.parse_command(player, "take"));
  } catch (e) {
    assertEquals(e.message, "Player is not in a valid room.");
  }
  result = JSON.parse(await textworld.parse_command(player, "use"));
  assertEquals(result.response, "That item does not exist.");
  result = JSON.parse(await textworld.parse_command(player, "drop"));
  assertEquals(result.response, "That item does not exist.");
  textworld.set_godmode(player);
  result = JSON.parse(await textworld.parse_command(player, "goto"));
  assertEquals(result.response, "That room or zone does not exist.");
  textworld.remove_godmode(player);
  result = JSON.parse(await textworld.parse_command(player, "look"));
  assertEquals(result.response, "You can't see anything.");
  result = JSON.parse(await textworld.parse_command(player, "inspect"));
  assertEquals(result.response, "There is nothing else of interest here.");
  result = JSON.parse(await textworld.parse_command(player, "north"));
  assertEquals(result.response, "You can't go that way.");
});

Deno.test("can_parse_empty_command", async () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  const result = JSON.parse(await textworld.parse_command(player, ""));
  assertEquals(result.response, "This is room 1");
  textworld.reset_world();
});

Deno.test("can_parse_command_craft", async () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
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
    { name: "Iron Sword", quantity: 1 },
  );
  textworld.learn_recipe(player, "Iron Sword");
  assertEquals(player.known_recipes.length, 1);
  const result = JSON.parse(
    await textworld.parse_command(player, "craft iron sword"),
  );
  assertEquals(result.response, "Iron Sword has been crafted.");
  assertEquals(player.items.length, 3);
  textworld.reset_world();
});

Deno.test("can_parse_command_load", async () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  player.gold = 1234;
  await textworld.save_player_progress(
    player,
    tw.player_progress_db_name,
    "test-slot",
  );
  const result = JSON.parse(
    await textworld.parse_command(player, "load test-slot"),
  );
  assertEquals(
    result.response,
    `Progress has been loaded from slot: test-slot`,
  );
  assertEquals(player.gold, 1234);
  await Deno.remove(tw.player_progress_db_name);
  textworld.reset_world();
});

Deno.test("can_parse_command_load_and_fail_for_invalid_save_slot", async () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  const result = JSON.parse(
    await textworld.parse_command(player, "load test-slot"),
  );
  assertEquals(result.response, "Unable to load progress from slot: test-slot");
  await Deno.remove(tw.player_progress_db_name);
  textworld.reset_world();
});

Deno.test("can_parse_command_save", async () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  player.gold = 1234;
  const result = JSON.parse(
    await textworld.parse_command(player, "save test-slot"),
  );
  assertEquals(result.response, `Progress has been saved to slot: test-slot`);
  const playerResult = await textworld.load_player_progress(
    tw.player_progress_db_name,
    "test-slot",
  );
  assertNotEquals(playerResult, null);
  assertEquals(playerResult?.player.gold, 1234);
  await Deno.remove(tw.player_progress_db_name);
  textworld.reset_world();
});

Deno.test("can_spawn_item_in_room_using_spawn_location", () => {
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_item("Iron", "A piece of iron", false);
  textworld.create_spawn_location(
    "Test Spawner",
    "Zone1",
    "Room1",
    0,
    false,
    (spawn_location: tw.SpawnLocation) => {
      const item = textworld.get_room_item(
        spawn_location.zone,
        spawn_location.room,
        "Iron",
      );
      if (!item) {
        textworld.place_item(
          spawn_location.zone,
          spawn_location.room,
          "Iron",
          1,
        );
      }
    },
  );
  const null_spawn_location = textworld.get_spawn_location("");
  assertEquals(null_spawn_location, null);
  textworld.set_spawn_location_active("Test Spawner", true);
  textworld.start_spawn_location("Test Spawner");
  const room = textworld.get_room("Zone1", "Room1");
  assertEquals(room?.items.length, 1);
  assertEquals(room?.items[0].name, "Iron");
  textworld.reset_world();
});

Deno.test("can_remove_spawn_location", () => {
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_item("Iron", "A piece of iron", false);
  textworld.create_spawn_location(
    "Test Spawner",
    "Zone1",
    "Room1",
    0,
    true,
    (spawn_location: tw.SpawnLocation) => {
      const item = textworld.get_room_item(
        spawn_location.zone,
        spawn_location.room,
        "Iron",
      );
      if (!item) {
        textworld.place_item(
          spawn_location.zone,
          spawn_location.room,
          "Iron",
          1,
        );
      }
    },
  );
  textworld.remove_spawn_location("Test Spawner");
  const spawn_location = textworld.get_spawn_location("Test Spawner");
  assertEquals(spawn_location, null);
  textworld.reset_world();
});

Deno.test("mob_can_attack_player", () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  textworld.set_actor_health(player, 100);
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  const mob = textworld.create_mob(
    "Goblin",
    "A small goblin",
    textworld.create_stats(
      { current: 10, max: 10 },
      { current: 10, max: 10 },
      { current: 10, max: 10 },
      15,
      8,
      5,
      2,
      0.05,
      { level: 1, xp: 0 },
    ),
    [],
  );
  textworld.place_mob("Zone1", "Room1", "Goblin");
  const result = textworld.perform_attack(mob, player);
  assertStringIncludes(result, "Goblin attacks Player");
  textworld.reset_world();
});

Deno.test("mob_can_kill_player", () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  textworld.set_actor_health(player, 1);
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  const mob = textworld.create_mob(
    "Goblin",
    "A small goblin",
    textworld.create_stats(
      { current: 10, max: 10 },
      { current: 10, max: 10 },
      { current: 10, max: 10 },
      15,
      8,
      5,
      2,
      0.05,
      { level: 1, xp: 0 },
    ),
    [],
  );
  textworld.place_mob("Zone1", "Room1", "Goblin");
  const result = textworld.perform_attack(mob, player);
  assertStringIncludes(result, "Goblin attacks Player");
  assertStringIncludes(result, "Player has been defeated!");
  textworld.reset_world();
});

Deno.test("player_can_attack_mob", () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  const mob = textworld.create_mob(
    "Goblin",
    "A small goblin",
    textworld.create_stats(
      { current: 10, max: 10 },
      { current: 10, max: 10 },
      { current: 10, max: 10 },
      15,
      8,
      5,
      2,
      0.05,
      { level: 1, xp: 0 },
    ),
    [],
  );
  textworld.place_mob("Zone1", "Room1", "Goblin");
  const result = textworld.perform_attack(player, mob);
  assertStringIncludes(result, "Player attacks Goblin");
  textworld.reset_world();
});

Deno.test("player_can_kill_mob", () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  const mob = textworld.create_mob(
    "Goblin",
    "A small goblin",
    textworld.create_stats(
      { current: 1, max: 1 },
      { current: 1, max: 1 },
      { current: 1, max: 1 },
      1,
      1,
      1,
      1,
      0.05,
      { level: 1, xp: 0 },
    ),
    [],
  );
  textworld.place_mob("Zone1", "Room1", "Goblin");
  const result = textworld.perform_attack(player, mob);
  assertStringIncludes(result, "Player attacks Goblin");
  assertStringIncludes(result, "Goblin has been defeated!");
  textworld.reset_world();
});

Deno.test("player_can_kill_mob_and_drop_loot", () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_item("Sword", "A sharp sword", false);
  textworld.create_item("Shield", "A strong shield", false);
  textworld.create_mob(
    "Goblin",
    "A small goblin",
    textworld.create_stats(
      { current: 1, max: 1 },
      { current: 1, max: 1 },
      { current: 1, max: 1 },
      1,
      1,
      1,
      1,
      0.05,
      { level: 1, xp: 0 },
    ),
    [
      { name: "Sword", quantity: 1 },
      { name: "Shield", quantity: 1 },
    ],
  );
  textworld.place_mob("Zone1", "Room1", "Goblin");
  const result = textworld.initiate_attack(player, ["goblin"]);
  assertStringIncludes(result.response, "Player attacks Goblin");
  assertStringIncludes(result.response, "Goblin has been defeated!");
  const room = textworld.get_room("Zone1", "Room1");
  assertEquals(room?.items.length, 2);
  assertEquals(room?.items[0].name, "Sword");
  assertEquals(room?.items[1].name, "Shield");
  textworld.reset_world();
});

Deno.test("player_can_kill_mob_and_pickup_look", () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_item("Sword", "A sharp sword", false);
  textworld.create_item("Shield", "A strong shield", false);
  textworld.create_mob(
    "Goblin",
    "A small goblin",
    textworld.create_stats(
      { current: 1, max: 1 },
      { current: 1, max: 1 },
      { current: 1, max: 1 },
      1,
      1,
      1,
      1,
      0.05,
      { level: 1, xp: 0 },
    ),
    [
      { name: "Sword", quantity: 1 },
      { name: "Shield", quantity: 1 },
    ],
  );
  textworld.place_mob("Zone1", "Room1", "Goblin");
  const result = textworld.initiate_attack(player, ["goblin"], true);
  assertStringIncludes(result.response, "Player attacks Goblin");
  assertStringIncludes(result.response, "Goblin has been defeated!");
  textworld.take_all_items(player);
  const room = textworld.get_room("Zone1", "Room1");
  assertEquals(room?.items.length, 0);
  assertEquals(player.items.length, 2);
  assertEquals(player.items[0].name, "Sword");
  assertEquals(player.items[1].name, "Shield");

  textworld.reset_world();
});

Deno.test("player_attack_mob_and_mob_attack_player", () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  textworld.set_actor_health(player, 100);
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_mob(
    "Goblin",
    "A small goblin",
    textworld.create_stats(
      { current: 20, max: 20 },
      { current: 1, max: 1 },
      { current: 1, max: 1 },
      1,
      1,
      1,
      1,
      0.05,
      { level: 1, xp: 0 },
    ),
    [],
  );
  textworld.place_mob("Zone1", "Room1", "Goblin");
  const result = textworld.initiate_attack(player, ["goblin"], true);
  assertStringIncludes(result.response, "Player attacks Goblin");
  assertStringIncludes(result.response, "Goblin attacks Player");
  textworld.reset_world();
});

Deno.test("player_can_die_from_mob_attack", () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  textworld.set_actor_health(player, 1);
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_mob(
    "Goblin",
    "A small goblin",
    textworld.create_stats(
      { current: 100, max: 100 },
      { current: 10, max: 10 },
      { current: 10, max: 10 },
      55,
      55,
      55,
      55,
      0.5,
      { level: 1, xp: 0 },
    ),
    [],
  );
  textworld.place_mob("Zone1", "Room1", "Goblin");
  const result = textworld.initiate_attack(player, ["goblin"], true);
  assertStringIncludes(result.response, "Player attacks Goblin");
  assertStringIncludes(result.response, "Goblin attacks Player");
  assertStringIncludes(result.response, "Player has been defeated!");
  textworld.reset_world();
});

Deno.test("player_can_die_from_mob_attack_and_ressurect", async () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  textworld.set_actor_health(player, 1);
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.set_room_as_zone_starter("Zone1", "Room1");
  textworld.create_mob(
    "Goblin",
    "A small goblin",
    textworld.create_stats(
      { current: 100, max: 100 },
      { current: 10, max: 10 },
      { current: 10, max: 10 },
      55,
      55,
      55,
      55,
      5,
      { level: 1, xp: 0 },
    ),
    [],
  );
  textworld.place_mob("Zone1", "Room1", "Goblin");
  let result = textworld.initiate_attack(player, ["goblin"], true);
  assertStringIncludes(result.response, "Player attacks Goblin");
  assertStringIncludes(result.response, "Goblin attacks Player");
  assertStringIncludes(result.response, "Player has been defeated!");
  result = JSON.parse(await textworld.parse_command(player, "resurrect"));
  assertEquals(result.response, `${player.name} has been resurrected.`);
  textworld.reset_world();
});

Deno.test("player_can_take_item", () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_item("Cane", "A wooden cane", false);
  textworld.create_item("Sword", "A sharp sword", false);
  textworld.place_item("Zone1", "Room1", "Sword");
  textworld.take_item(player, ["Sword"]);
  assertEquals(player.items.length, 1);
  const result = textworld.take_item(player, ["Cane"]);
  assertEquals(result?.response, "That item does not exist.");
  textworld.reset_world();
});

Deno.test("player_can_take_all_items", () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_item("Sword", "A sharp sword", false);
  textworld.create_item("Potion", "A potion", true);
  textworld.place_item("Zone1", "Room1", "Sword");
  textworld.place_item("Zone1", "Room1", "Potion");
  textworld.take_all_items(player);
  assertEquals(player.items.length, 2);
  const result = textworld.take_all_items(player);
  assertEquals(result?.response, "There are no items to take.");
  textworld.reset_world();
});

Deno.test("player_takes_item_and_players_inventory_contains_item", () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_item("Sword", "A sharp sword", false);
  textworld.place_item("Zone1", "Room1", "Sword");
  textworld.take_item(player, ["Sword"]);
  const result = textworld.has_item(player, "Sword");
  assertEquals(result, true);

  textworld.reset_world();
});

Deno.test("player_can_take_item_and_it_stacks_in_inventory", () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_item("Potion", "An ordinary potion", false);
  textworld.place_item("Zone1", "Room1", "Potion");
  textworld.take_item(player, ["Potion"]);
  textworld.place_item("Zone1", "Room1", "Potion");
  textworld.take_item(player, ["Potion"]);
  const result = textworld.has_item_in_quantity(player, "Potion", 2);
  assertEquals(result, true);
  textworld.place_item("Zone1", "Room1", "Potion", 5);
  const result2 = textworld.take_all_items(player);
  assertEquals(result2.response, "You took all items: Potion (5)");
  // Exercise the else condition on has_item_in_quantity
  const result3 = textworld.has_item_in_quantity(player, "Potion", 100);
  assertEquals(result3, false);
  textworld.reset_world();
});

Deno.test("player_can_drop_item", () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  textworld.create_zone("Zone1");
  textworld.create_item("Potion", "A potion", true);
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.place_item("Zone1", "Room1", "Potion");
  textworld.take_item(player, ["Potion"]);
  textworld.drop_item(player, ["Potion"]);
  assertEquals(player.items.length, 0);

  textworld.reset_world();
});

Deno.test("player_can_drop_all_items", () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_item("Sword", "A sharp sword", false);
  textworld.create_item("Potion", "A potion", true);
  const result = textworld.drop_all_items(player);
  assertEquals(result.response, "You have no items to drop.");
  textworld.place_item("Zone1", "Room1", "Sword");
  textworld.place_item("Zone1", "Room1", "Potion");
  textworld.take_all_items(player);
  textworld.drop_all_items(player);
  assertEquals(player.items.length, 0);
  textworld.reset_world();
});

Deno.test("player_can_use_item", () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_item("Glove", "A glove", true, (_player) => {
    return "";
  });
  textworld.create_item("Cane", "A wooden cane", true, (_player) => {
    return "";
  });
  textworld.create_item("Potion", "A potion", true, (_player) => {
    return "You drank the potion but nothing happened.";
  });
  textworld.place_item("Zone1", "Room1", "Potion");
  textworld.place_item("Zone1", "Room1", "Cane");
  textworld.place_item("Zone1", "Room1", "Glove");
  textworld.take_all_items(player);
  const result = textworld.use_item(player, ["Potion"]);
  assertEquals(result.response, "You drank the potion but nothing happened.");
  const result2 = textworld.use_item(player, ["Cane"]);
  assertEquals(result2.response, "You used the item but nothing happened.");
  textworld.reset_world_actions();
  const result3 = textworld.use_item(player, ["Glove"]);
  assertEquals(result3.response, "You used the item but nothing happened.");
  textworld.reset_world();
});

Deno.test("player_cant_use_item_thats_not_usable", () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  textworld.create_zone("Zone1");
  textworld.create_item("Sword", "A sharp sword", false);
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.place_item("Zone1", "Room1", "Sword");
  textworld.take_item(player, ["Sword"]);
  const result = textworld.use_item(player, ["Sword"]);
  assertEquals(result.response, "You can't use that item.");
  assertEquals(player.items.length, 1);
  textworld.reset_world();
});

Deno.test("can_remove_item_from_player_inventory", () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_item("Potion", "A potion", true, (_player) => {
    return "You drank the potion but nothing happened.";
  });
  textworld.place_item("Zone1", "Room1", "Potion");
  textworld.take_item(player, ["Potion"]);
  textworld.remove_player_item(player, "Potion");
  assertEquals(player.items.length, 0);
  textworld.reset_world();
});

Deno.test("can_create_item_and_remove_it", () => {
  textworld.create_item("Potion", "A potion", true);
  textworld.remove_item("Potion");
  const result = textworld.get_item("Potion");
  assertEquals(result, null);
});

Deno.test("player_can_look", () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  const result = textworld.look(player, "look", "look", ["look"]);
  assertEquals(result.response, "This is room 1");
  textworld.reset_world();
});

Deno.test("player_can_look_at_self_with_description", () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  const result = textworld.look_self(player);
  assertEquals(result, "You are a strong adventurer");
});

Deno.test("player_can_look_at_self_with_no_description", () => {
  const player = textworld.create_player(
    "Player",
    "Player Description",
    "Zone1",
    "Room1",
  );
  player.descriptions = [];
  const result = textworld.look_self(player);
  assertEquals(result, "You don't really like looking at yourself.");
});

Deno.test("player_can_look_at_self_with_no_description_and_has_inventory", () => {
  const player = textworld.create_player(
    "Player",
    "Player Description",
    "Zone1",
    "Room1",
  );
  player.descriptions = [];
  const result = textworld.look_self(player);
  assertEquals(result, "You don't really like looking at yourself.");
});

Deno.test("player_can_look_at_self_without_inventory", () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_item("Sword", "A sharp sword", false);
  textworld.create_item("Diamond", "A diamond surely worth a fortune", false);
  textworld.place_item("Zone1", "Room1", "Sword");
  textworld.place_item("Zone1", "Room1", "Diamond");
  textworld.take_all_items(player);
  const result = textworld.look_self(player);
  assertEquals(
    result,
    "You are a strong adventurer\n\nInventory: Sword (1), Diamond (1)",
  );
  textworld.reset_world();
});

Deno.test("player_can_look_at_self_with_inventory", () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_item("Sword", "A sharp sword", false);
  textworld.create_item("Diamond", "A diamond surely worth a fortune", false);
  textworld.place_item("Zone1", "Room1", "Sword");
  textworld.place_item("Zone1", "Room1", "Diamond");
  textworld.take_all_items(player);
  const result = textworld.look_self(player);
  assertEquals(
    result,
    `You are a strong adventurer\n\nInventory: Sword (1), Diamond (1)`,
  );
  textworld.reset_world();
});

Deno.test("player_can_inspect_room_with_no_items", () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  const result = textworld.inspect_room(player);
  assertEquals(
    result.response,
    "You inspect the room and found:\n\nThere is nothing else of interest here.",
  );
  textworld.reset_world();
});

Deno.test("player_can_inspect_room_with_items", () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_item("Sword", "A sharp sword", false);
  textworld.create_item("Potion", "An ordinary potion", true);
  textworld.place_item("Zone1", "Room1", "Sword");
  textworld.place_item("Zone1", "Room1", "Potion", 2);
  const result = textworld.inspect_room(player);
  assertEquals(
    result.response,
    "You inspect the room and found:\n\nItems: Sword (1), Potion (2)",
  );
  textworld.reset_world();
});

Deno.test("player_can_show_item", () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_item("Potion", "An ordinary potion", true);
  textworld.place_item("Zone1", "Room1", "Potion", 2);
  textworld.take_item(player, ["Potion"]);
  const result = textworld.show(player, ["Potion"]);
  assertEquals(result.response, "An ordinary potion");
  textworld.remove_item("Potion");
  const result2 = textworld.show(player, ["Potion"]);
  assertEquals(result2.response, "That item does not exist.");
  textworld.create_item("Sword", "A sharp sword", false);
  textworld.place_item("Zone1", "Room1", "Sword");
  textworld.take_item(player, ["Sword"]);
  const item = textworld.get_item("Sword");
  if (item) {
    item.descriptions = [];
  }
  const result3 = textworld.show(player, ["Sword"]);
  assertEquals(result3.response, "No description available.");
  textworld.reset_world();
});

Deno.test("player_can_show_all_items", () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  const result = textworld.show_all_items(player);
  assertEquals(result.response, "You have no items to show.");
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_item("Sword", "A sharp sword", false);
  textworld.create_item("Potion", "An ordinary potion", true);
  textworld.place_item("Zone1", "Room1", "Sword");
  textworld.place_item("Zone1", "Room1", "Potion", 2);
  textworld.take_all_items(player);
  const result2 = textworld.show_all_items(player);
  assertEquals(
    result2.response,
    "Sword - A sharp sword\n\nPotion - An ordinary potion",
  );

  textworld.reset_world();
});

Deno.test("player_can_purchase_from_vendor", () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
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
    "Fried Chicken & Roasted Vegetables",
  );
  assertEquals(
    result,
    "You purchased Fried Chicken & Roasted Vegetables for 2 gold.",
  );
  assertEquals(player.gold, 8);
  assertEquals(player.items.length, 1);

  textworld.reset_world();
});

Deno.test("player_can_purchase_from_vendor_if_also_having_same_item", () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  player.gold = 10;
  textworld.add_item_to_player(player, "Fried Chicken & Roasted Vegetables", 1);
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
    "Fried Chicken & Roasted Vegetables",
  );
  assertEquals(
    result,
    "You purchased Fried Chicken & Roasted Vegetables for 2 gold.",
  );
  assertEquals(player.gold, 8);
  assertEquals(player.items.length, 1);
  assertEquals(player.items[0].name, "Fried Chicken & Roasted Vegetables");
  assertEquals(player.items[0].quantity, 2);
  textworld.reset_world();
});

Deno.test("player_cant_purchase_from_vendor_that_doesnt_have_items_for_sale", () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  player.gold = 10;
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_item("Fried Chicken & Roasted Vegetables", "", false);
  textworld.create_vendor("Vendor1", "A friendly food vendor", []);
  textworld.place_npc("Zone1", "Room1", "Vendor1");
  const result = textworld.purchase_from_vendor(
    player,
    "Vendor1",
    "Fried Chicken & Roasted Vegetables",
  );
  assertEquals(
    "That vendor does not exist or doesn't have items for sale.",
    result,
  );
  textworld.reset_world();
});

Deno.test("player_cant_purchase_item_from_vendor_if_not_enough_gold", () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  player.gold = 1;
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
    "Fried Chicken & Roasted Vegetables",
  );
  assertEquals(
    result,
    "You don't have enough gold to purchase Fried Chicken & Roasted Vegetables.",
  );
  textworld.reset_world();
});

Deno.test("player_cant_purchase_nonexistant_item_from_vendor", () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
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
    "Fried Chicken & Roasted Vegetables",
  );
  assertEquals(result, "That item does not exist.");

  textworld.reset_world();
});

Deno.test("player_can_pickup_quest", () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  textworld.create_quest("Quest1", "A quest");
  textworld.add_quest_action("Quest1", "Start", (_player) => {
    return "Hello, World!";
  });
  textworld.pickup_quest(player, "Quest1");
  assertEquals(player.quests.length, 1);
  textworld.reset_world();
});

Deno.test("player_cant_pickup_nonexistant_quest", () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  const result = textworld.pickup_quest(player, "Quest1");
  assertEquals(result, "The quest does not exist.");
  textworld.reset_world();
});

Deno.test("player_cant_pickup_quest_they_already_have", () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  textworld.create_quest("Quest1", "A quest");
  textworld.pickup_quest(player, "Quest1");
  const result = textworld.pickup_quest(player, "Quest1");
  assertEquals(result, "You already have the quest Quest1.");
  textworld.reset_world();
});

Deno.test("player_cant_pickup_more_quests_than_allowed", () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
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
    `You can't have more than ${tw.active_quest_limit} active quests at a time.`,
  );
  textworld.reset_world();
});

Deno.test("player_cant_complete_quest_that_doesnt_exist", () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  try {
    textworld.is_quest_complete(player, "Quest1");
  } catch (e) {
    assertEquals(e.message, "The quest Quest1 does not exist.");
  }
  textworld.reset_world();
});

Deno.test("player_cant_complete_quest_that_player_doesnt_have", () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  textworld.create_quest("Quest1", "A quest");
  const result = textworld.is_quest_complete(player, "Quest1");
  assertEquals(result, false);
  textworld.reset_world();
});

Deno.test("player_cant_complete_quest_that_has_no_steps", () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  textworld.create_quest("Quest1", "A quest");
  textworld.pickup_quest(player, "Quest1");
  try {
    textworld.is_quest_complete(player, "Quest1");
  } catch (e) {
    assertEquals(e.message, "The quest Quest1 does not have any steps.");
  }
  textworld.reset_world();
});

Deno.test("player_can_complete_quest", () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
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
          quest_step.complete = true;
          return true;
        }
      }
      return false;
    },
  );
  textworld.pickup_quest(player, "Quest1");
  textworld.take_item(player, ["Magic Ring"]);
  const result = textworld.is_quest_complete(player, "Quest1");
  assertEquals(result, true);
  assertEquals(player.quests.length, 0);
  const resul2 = textworld.is_quest_complete(player, "Quest1");
  assertEquals(resul2, true);
  textworld.reset_world();
});

Deno.test("player_can_get_quest_progress", () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
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
  const result2 = textworld.is_quest_complete(player, "Quest1");
  assertEquals(result2, false);
  textworld.reset_world();
});

Deno.test("player_cant_get_quest_progress_for_a_quest_that_doesnt_exist", () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );

  try {
    textworld.get_quest_progress(player, "Quest1");
  } catch (e) {
    assertEquals(e.message, "The quest Quest1 does not exist.");
  }

  textworld.reset_world();
});

Deno.test("player_cant_get_quest_progress_for_a_quest_they_dont_have", () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  textworld.create_quest("Quest1", "A quest");
  const result = textworld.get_quest_progress(player, "Quest1");
  assertEquals(result, "You don't have the quest Quest1.");
  textworld.reset_world();
});

Deno.test("player_can_complete_quest_with_multiple_steps", () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_room("Zone1", "Room2", "This is room 2", (player) => {
    textworld.set_flag(player, "visited_room2");
    return null;
  });
  textworld.create_exit("Zone1", "Room1", "north", "Room2");
  textworld.create_npc("Old Woman", "An ordinary old woman");
  textworld.create_dialog("Old Woman", ["hello", "hi"], (player) => {
    if (textworld.has_flag(player, "took_gem")) {
      return "Hi, how are you?";
    } else {
      return "Hi, I have a gem you may want!";
    }
  });

  textworld.create_dialog(
    "Old Woman",
    ["take"],
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
    },
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
  const gem_result = textworld.interact_with_actor(
    player,
    "talk to Old Woman take gem",
    "talk to",
    ["talk", "to", "Old", "Woman", "take", "gem"],
  );
  textworld.switch_room(player, "north");
  assertEquals(gem_result.response, "You took the Gem.");
  const quest_result = textworld.is_quest_complete(player, "Quest1");
  assertEquals(quest_result, true);
  assertEquals(player.quests.length, 0);
  assertEquals(player.flags.length, 0);
  textworld.reset_world();
});

Deno.test("player_can_drop_quest", () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  textworld.create_quest("Quest1", "A quest");
  textworld.pickup_quest(player, "Quest1");
  textworld.drop_quest(player, "Quest1");
  assertEquals(player.quests.length, 0);
  textworld.reset_world();
});

Deno.test("player_cant_drop_quest_that_doesnt_exist", () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  const result = textworld.drop_quest(player, "Quest1");
  assertEquals(result, "The quest Quest1 does not exist.");
  textworld.reset_world();
});

Deno.test("player_cant_drop_quest_they_dont_have", () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  textworld.create_quest("Quest1", "A quest");
  const result = textworld.drop_quest(player, "Quest1");
  assertEquals(result, "You don't have the quest Quest1.");
  textworld.reset_world();
});

Deno.test("player_starts_in_valid_room", () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  const room = textworld.get_player_room(player);
  assertEquals(room!.name, "Room1");
  textworld.reset_world();
});

Deno.test("player_can_navigate_between_rooms", () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_room("Zone1", "Room2", "This is room 2");
  textworld.create_exit("Zone1", "Room1", "north", "Room2");
  textworld.switch_room(player, "north");
  const room = textworld.get_player_room(player);
  assertEquals(room!.name, "Room2");
  textworld.reset_world();
});

Deno.test("player_cant_navigate_to_nonexistent_room", () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  const result = textworld.switch_room(player, "north");
  assertEquals(result.response, "You can't go that way.");
  textworld.reset_world();
});

Deno.test("player_can_goto_new_zone", () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  textworld.set_flag(player, "godmode");
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1 in zone 1");
  textworld.create_zone("Zone2");
  textworld.create_room("Zone2", "Room1", "This is room 1 in zone 2");
  textworld.set_room_as_zone_starter("Zone2", "Room1");
  const result = textworld.goto(player, ["zone", "Zone2"]);
  assertEquals(result.response, "This is room 1 in zone 2");
  textworld.reset_world();
});

Deno.test("player_cant_goto_room_that_doesnt_exist_in_zone", () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  textworld.set_flag(player, "godmode");
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  const result = textworld.goto(player, ["room Room2"]);
  assertEquals(result.response, "That room or zone does not exist.");
  textworld.reset_world();
});

Deno.test("player_can_learn_recipe", () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_recipe(
    "Iron Sword",
    "A quality sword for the everyday fighter",
    [
      { name: "Iron", quantity: 2 },
      { name: "Wood", quantity: 1 },
    ],
    { name: "Iron Sword", quantity: 1 },
  );
  textworld.create_item(
    "Iron Sword recipe",
    "A recipe for an iron sword",
    true,
    (player) => {
      return textworld.learn_recipe(player, "Iron Sword");
    },
  );
  textworld.place_item("Zone1", "Room1", "Iron Sword recipe");
  textworld.take_item(player, ["Iron Sword recipe"]);
  const result = textworld.use_item(player, ["Iron Sword recipe"]);
  assertEquals(result.response, "You learned the recipe for Iron Sword.");
  assertEquals(player.known_recipes.length, 1);

  textworld.reset_world();
});

Deno.test("player_cant_learn_recipe_player_already_knows", () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
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
    { name: "Iron Sword", quantity: 1 },
  );
  textworld.create_item(
    "Iron Sword recipe",
    "A recipe for an iron sword",
    true,
    (player) => {
      return textworld.learn_recipe(player, "Iron Sword");
    },
  );
  textworld.place_item("Zone1", "Room1", "Iron Sword recipe");
  textworld.take_item(player, ["Iron Sword recipe"]);
  const result = textworld.use_item(player, ["Iron Sword recipe"]);
  assertEquals(result.response, "You already know that recipe.");
  assertEquals(player.known_recipes.length, 1);
  assertEquals(player.items.length, 1);

  textworld.reset_world();
});

Deno.test("player_can_craft_recipe", () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
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
    { name: "Iron Sword", quantity: 1 },
  );
  textworld.learn_recipe(player, "Iron Sword");
  const result = textworld.craft_recipe(player, ["Iron Sword"]);
  assertEquals(result.response, "Iron Sword has been crafted.");
  assertEquals(player.items.length, 3);
  textworld.reset_world();
});

Deno.test("player_cant_learn_recipe_that_doesnt_exist", () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  const result = textworld.learn_recipe(player, "Iron Sword");
  assertEquals(result, "That recipe does not exist.");
});

Deno.test("player_cant_craft_unknown_recipe", () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  const result = textworld.craft_recipe(player, ["Iron Sword"]);
  assertEquals(result.response, "You don't know how to craft that.");
  textworld.reset_world();
});

Deno.test("cant_get_recipe_that_does_not_exist", () => {
  const result = textworld.get_recipe("Iron Sword");
  assertEquals(result, null);
});

Deno.test("player_can_talk_to_npc", () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_npc("Big Guard", "A strong guard");
  textworld.create_dialog(
    "Big Guard",
    ["Hello"],
    "Hello citizen, make sure you mind the law!",
  );
  textworld.place_npc("Zone1", "Room1", "Big Guard");
  let result = textworld.interact_with_actor(
    player,
    "talk to Big Guard say Hello",
    "talk to",
    ["talk", "to", "Big", "Guard", "say", "Hello"],
  );
  assertEquals(result.response, "Hello citizen, make sure you mind the law!");
  result = textworld.interact_with_actor(
    player,
    "talk to Big Guard say Goodbye",
    "talk to",
    ["talk", "to", "Big", "Guard", "say", "Goodbye"],
  );
  assertEquals(result.response, "hmm...");
  textworld.reset_world();
});

Deno.test("player_can_talk_to_npc_and_say_something_npc_doesnt_understand", () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_npc("Big Guard", "A strong guard");
  textworld.create_dialog(
    "Big Guard",
    ["Hello"],
    "Hello citizen, make sure you mind the law!",
  );
  textworld.place_npc("Zone1", "Room1", "Big Guard");
  const result = textworld.interact_with_actor(
    player,
    "talk to Big Guard say Goodbye",
    "talk to",
    ["talk", "to", "Big", "Guard", "say", "fizzbuzz"],
  );
  assertEquals(result.response, "hmm...");

  const malformed_npc = textworld.create_npc("Witch", "A mysterious witch");
  malformed_npc.dialog = [
    { name: crypto.randomUUID(), trigger: ["hello"], response: undefined },
  ];
  textworld.place_npc("Zone1", "Room1", "Witch");
  const result2 = textworld.interact_with_actor(
    player,
    "talk to Witch say Hello",
    "talk to",
    ["talk", "to", "Witch", "say", "Hello"],
  );
  assertEquals(result2.response, "hmm...");
  textworld.reset_world();
});

Deno.test("player_cant_talk_to_npc_that_doesnt_exist", () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  const result = textworld.interact_with_actor(
    player,
    "talk to Big Guard say Hello",
    "talk to",
    ["talk", "to", "Big", "Guard", "say", "Hello"],
  );
  assertEquals(result.response, "hmm...");
  textworld.reset_world();
});

Deno.test("player_cant_talk_to_npc_if_room_doesnt_exist", () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_npc("Big Guard", "A strong guard");
  textworld.create_dialog(
    "Big Guard",
    ["Hello"],
    "Hello citizen, make sure you mind the law!",
  );
  textworld.place_npc("Zone1", "Room1", "Big Guard");
  let result = textworld.interact_with_actor(
    player,
    "talk to Big Guard say Hello",
    "talk to",
    ["talk", "to", "Big", "Guard", "say", "Hello"],
  );
  assertEquals(result.response, "Hello citizen, make sure you mind the law!");
  player.zone = "Zone2";
  player.room = "Room2";
  try {
    result = textworld.interact_with_actor(
      player,
      "talk to Big Guard say Goodbye",
      "talk to",
      ["talk", "to", "Big", "Guard", "say", "Goodbye"],
    );
  } catch (e) {
    assertEquals(e.message, "Player is not in a valid zone or room.");
  }
  textworld.reset_world();
});

Deno.test("player_can_talk_to_vendor_and_list_items", () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  player.gold = 10;
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_item(
    "Fried Chicken & Roasted Vegetables",
    "A delicious dinner of fried chicken and roasted vegetables.",
    false,
  );
  textworld.create_vendor("Vendor1", "A friendly food vendor", [
    { name: "Fried Chicken & Roasted Vegetables", price: 2 },
  ]);
  textworld.place_npc("Zone1", "Room1", "Vendor1");
  const result = textworld.interact_with_actor(
    player,
    "talk to Vendor1 say items",
    "talk to",
    ["talk", "to", "Vendor1", "say", "items"],
  );
  assertEquals(
    result.response,
    "Items for sale: Fried Chicken & Roasted Vegetables (2 gold)",
  );
  textworld.reset_world();
});

Deno.test("player_can_talk_to_vendor_and_purchase_item", () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  player.gold = 10;
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_item(
    "Fried Chicken & Roasted Vegetables",
    "A delicious dinner of fried chicken and roasted vegetables.",
    false,
  );
  textworld.create_vendor("Vendor1", "A friendly food vendor", [
    { name: "Fried Chicken & Roasted Vegetables", price: 2 },
  ]);
  textworld.place_npc("Zone1", "Room1", "Vendor1");
  const result = textworld.interact_with_actor(
    player,
    "talk to Vendor1 buy Fried Chicken & Roasted Vegetables",
    "talk to",
    ["talk", "to", "Vendor1", "buy", "Fried Chicken & Roasted Vegetables"],
  );
  assertEquals(
    result.response,
    "You purchased Fried Chicken & Roasted Vegetables for 2 gold.",
  );
  textworld.reset_world();
});

Deno.test("player_can_talk_to_npc_without_dialog", () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_npc("Big Guard", "A strong guard");
  textworld.place_npc("Zone1", "Room1", "Big Guard");
  const result = textworld.interact_with_actor(
    player,
    "talk to Big Guard say Hello",
    "talk to",
    ["talk", "to", "Big", "Guard", "say", "Hello"],
  );
  assertEquals(result.response, "hmm...");
  textworld.reset_world();
});

Deno.test("player_can_goto_any_room_in_zone", () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  textworld.set_flag(player, "godmode");
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "The Room1", "This is room 1");
  textworld.create_room("Zone1", "The Room2", "This is room 2");
  const result = textworld.goto(player, ["room", "The", "Room2"]);
  assertEquals(result.response, "This is room 2");
  textworld.reset_world();
});

Deno.test(
  "player_can_navigate_to_new_zone_using_custom_room_action",
  async () => {
    const player = textworld.create_player(
      "Player",
      "You are a strong adventurer",
      "Zone1",
      "Room1",
    );
    textworld.set_flag(player, "godmode");
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
      (player, _input, _command, _args) =>
        textworld.goto(player, ["zone", "Zone2"]).response,
    );
    const result = JSON.parse(await textworld.parse_command(player, "warp"));
    assertEquals(
      result.response,
      "Blue waves of light start spinning all around you. They get faster and faster until you can't see anything. When the light fades, you find yourself in a new place.\n\nThis is room 1 in zone 2",
    );
    assertEquals(player.zone, "Zone2");
    assertEquals(player.room, "Room1");
    textworld.reset_world();
  },
);

Deno.test("player_can_save_progress", async () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  const result = await textworld.save_player_progress(
    player,
    "test_game_saves.db",
    "test_slot",
  );
  assertEquals(result.response, "Progress has been saved to slot: test_slot");
  await Deno.remove("test_game_saves.db");
  textworld.reset_world();
});

Deno.test("player_can_load_progress", async () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  player.gold = 1000;
  await textworld.save_player_progress(
    player,
    "test_game_saves.db",
    "test_slot",
  );
  const result = await textworld.load_player_progress(
    "test_game_saves.db",
    "test_slot",
  );
  assertNotEquals(result, null);
  assertNotEquals(result!.player, null);
  assertNotEquals(result!.world, null);
  assertEquals(result!.player.gold, 1000);
  await Deno.remove("test_game_saves.db");
  textworld.reset_world();
});

Deno.test("room_actions_work_after_loading_player_progress", async () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  textworld.create_zone("Zone1");
  textworld.create_room(
    "Zone1",
    "Room1",
    "This is room 1 in zone 1",
    (_player) => {
      return "This message is from a room action";
    },
  );
  await textworld.save_player_progress(
    player,
    "test_game_saves.db",
    "test_slot",
  );
  await textworld.load_player_progress("test_game_saves.db", "test_slot");
  const result = textworld.switch_room(player);
  assertEquals(
    result.response,
    "This is room 1 in zone 1\n\nThis message is from a room action",
  );
  await Deno.remove("test_game_saves.db");
  textworld.reset_world();
});

Deno.test("item_actions_work_after_loading_player_progress", async () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  textworld.create_item("Potion", "A potion", true, (_player) => {
    return "You drank the potion but nothing happened.";
  });
  const item = textworld.get_item("Potion");
  assertEquals(item?.name, "Potion");
  await textworld.save_player_progress(
    player,
    "test_game_saves.db",
    "test_slot",
  );
  await textworld.load_player_progress("test_game_saves.db", "test_slot");
  const item_action = textworld.get_item_action("Potion");
  assertEquals(
    item_action?.action(player),
    "You drank the potion but nothing happened.",
  );
  await Deno.remove("test_game_saves.db");
  textworld.reset_world();
});

Deno.test(
  "room_command_actions_work_after_loading_player_progress",
  async () => {
    const player = textworld.create_player(
      "Player",
      "You are a strong adventurer",
      "Zone1",
      "Room1",
    );
    textworld.create_zone("Zone1");
    textworld.create_room("Zone1", "Room1", "This is room 1 in zone 1");
    textworld.set_room_as_zone_starter("Zone1", "Room1");
    textworld.add_room_command_action(
      "Zone1",
      "Room1",
      "warp action",
      "Blue waves of light start spinning all around you. They get faster and faster until you can't see anything. When the light fades, you find yourself in a new place.",
      ["warp"],
      (_player, _input, _command, _args) => "warping...",
    );
    await textworld.save_player_progress(
      player,
      "test_game_saves.db",
      "test_slot",
    );
    await textworld.load_player_progress("test_game_saves.db", "test_slot");
    const result = JSON.parse(await textworld.parse_command(player, "warp"));
    assertEquals(
      result.response,
      "Blue waves of light start spinning all around you. They get faster and faster until you can't see anything. When the light fades, you find yourself in a new place.\n\nwarping...",
    );
    await Deno.remove("test_game_saves.db");
    textworld.reset_world();
  },
);

Deno.test("room_actions_work_after_loading_player_progress", async () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.add_room_command_action(
    "Zone1",
    "Room1",
    "xyzzy action",
    "You recited the magical word XYZZY!!!",
    ["xyzzy"],
    (_player: tw.Player, _input: string, _command: string, _args: string[]) =>
      "How dare you utter the magical word XYZZY!",
  );
  await textworld.save_player_progress(
    player,
    "test_game_saves.db",
    "test_slot",
  );
  await textworld.load_player_progress("test_game_saves.db", "test_slot");
  const result = JSON.parse(await textworld.parse_command(player, "xyzzy"));
  await Deno.remove("test_game_saves.db");
  assertEquals(
    result.response,
    "You recited the magical word XYZZY!!!\n\nHow dare you utter the magical word XYZZY!",
  );
  textworld.reset_world();
});

Deno.test("quest_actions_work_after_loading_player_progress", async () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
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
    },
  );
  textworld.pickup_quest(player, "Quest1");
  await textworld.save_player_progress(
    player,
    "test_game_saves.db",
    "test_slot",
  );
  await textworld.load_player_progress("test_game_saves.db", "test_slot");
  textworld.take_item(player, ["Magic Ring"]);
  const result = textworld.is_quest_complete(player, "Quest1");
  assertEquals(result, true);
  assertEquals(player.quests.length, 0);

  await Deno.remove("test_game_saves.db");
  textworld.reset_world();
});

Deno.test("dialog_actions_work_after_loading_player_progress", async () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_npc("Guard", "A strong guard");
  textworld.create_dialog(
    "Guard",
    ["hello"],
    (_player, _input, _command, _args) => "this is a dialog action",
  );
  textworld.place_npc("Zone1", "Room1", "Guard");
  await textworld.save_player_progress(
    player,
    "test_game_saves.db",
    "test_slot",
  );
  await textworld.load_player_progress("test_game_saves.db", "test_slot");
  const result = JSON.parse(
    await textworld.parse_command(
      player,
      "talk to Guard say hello",
    ),
  );
  assertEquals(result.response, "this is a dialog action");
  await Deno.remove("test_game_saves.db");
  textworld.reset_world();
});

Deno.test("can_set_players_room_to_zone_start", () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  textworld.create_zone("Zone1");
  textworld.create_zone("Zone2");
  textworld.create_room("Zone1", "Room1", "This is room 1 in zone 1");
  textworld.create_room("Zone2", "Room1", "This is room 1 in zone 2");
  textworld.set_room_as_zone_starter("Zone1", "Room1");
  textworld.set_room_as_zone_starter("Zone2", "Room1");
  textworld.set_player_room_to_zone_start(player, "Zone2");
  assertEquals(player.zone, "Zone2");
  assertEquals(player.room, "Room1");
  textworld.reset_world();
});

Deno.test("cant_set_players_room_to_zone_start_if_there_is_no_starter_room_in_zone", () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  textworld.create_zone("Zone1");
  textworld.create_zone("Zone2");
  textworld.create_room("Zone1", "Room1", "This is room 1 in zone 1");
  textworld.create_room("Zone2", "Room1", "This is room 1 in zone 2");
  textworld.set_room_as_zone_starter("Zone1", "Room1");
  try {
    textworld.set_player_room_to_zone_start(player, "Zone2");
  } catch (e) {
    assertEquals(e.message, "Zone Zone2 does not have a starter room.");
  }
  textworld.reset_world();
});

Deno.test("can_set_players_room_to_another_room", () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_room("Zone1", "Room2", "This is room 2");
  textworld.set_room_as_zone_starter("Zone1", "Room1");
  textworld.set_player_zone_and_room(player, "Zone1", "Room2");
  assertEquals(player.zone, "Zone1");
  assertEquals(player.room, "Room2");
  textworld.reset_world();
});

Deno.test("can_set_players_zone_and_room", () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room2",
  );
  textworld.create_zone("Zone1");
  textworld.create_zone("Zone2");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  textworld.create_room("Zone2", "Room1", "This is room 1");
  textworld.set_player_zone_and_room(player, "Zone2", "Room1");
  assertEquals(player.zone, "Zone2");
  assertEquals(player.room, "Room1");
  textworld.reset_world();
});

Deno.test("can_get_help", () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  const result = textworld.get_help(player);
  assertEquals(
    result.response,
    "Commands:\n\nnorth, south, east, west - Commands for moving around the world.\ntake, get - Take an item from the room or an NPC.\nuse - Use an item in your inventory.\ndrop - Drop an item or all your items from your inventory.\nlook, l - Look around the room or at yourself.\nls - Look at yourself.\nexamine, x - Examine an object in a room.\ninspect, i, search - Inspect a room to see what items are there.\nmap - Plot a map showing nearby rooms.\nshow - Show an item in your inventory.\ntalk to, tt - Talk to an NPC or Vendor.\ngoto - Go to a room or zone.\nhelp - Show the help text.\nattack - Attack a mob.\ncraft - Craft an item.",
  );
});

Deno.test("can_get_help_when_player_is_dead", () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  textworld.set_actor_health(player, 0);
  const result = textworld.get_help(player);
  assertEquals(
    result.response,
    "Commands:\n\nhelp - Show the help text.\nresurrect, rez - resurrect yourself.",
  );
  textworld.reset_world();
});

Deno.test("can_calculate_level_experience", () => {
  const result = textworld.calculate_level_experience(1, 1.2, 5);
  assertEquals(result, [
    {
      level: 1,
      xp: 1,
    },
    {
      level: 2,
      xp: 1.2,
    },
    {
      level: 3,
      xp: 1.44,
    },
    {
      level: 4,
      xp: 1.7279999999999998,
    },
    {
      level: 5,
      xp: 2.0736,
    },
  ]);
});

Deno.test("can_convert_string_to_title_case", () => {
  let result = textworld.to_title_case("hello world");
  assertEquals(result, "Hello World");
  result = textworld.to_title_case("hello");
  assertEquals(result, "Hello");
  result = textworld.to_title_case("");
  assertEquals(result, "");
});

Deno.test("can_get_description_of_room", () => {
  const player = textworld.create_player(
    "Player",
    "You are a strong adventurer",
    "Zone1",
    "Room1",
  );
  textworld.create_zone("Zone1");
  textworld.create_room("Zone1", "Room1", "This is room 1");
  const current_room = textworld
    .get_player_zone(player)
    ?.rooms.find(
      (room) => room.name.toLowerCase() === player.room.toLowerCase(),
    );
  assertNotEquals(current_room, null);
  const result = textworld.get_description(player, current_room!, "default");
  assertEquals(result, "This is room 1");
  textworld.reset_world();
});
