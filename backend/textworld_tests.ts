// A Text Adventure Library for Deno
// Frank Hale &lt;frankhaledevelops AT gmail.com&gt;
// 20 December 2025

import {
  assert,
  assertEquals,
  assertGreater,
  assertNotEquals,
  assertObjectMatch,
  assertRejects,
  assertStringIncludes,
  assertThrows,
} from "@std/assert";

import * as tw from "./textworld.ts";

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

const textworld = new tw.TextWorld();

Deno.test("can_get_random_number", () => {
  const result = textworld.get_random_number(10);
  assert(result >= 0 && result <= 10);
  textworld.reset_world();
});

Deno.test("can_create_zone", () => {
  textworld.zone("Zone1").build();
  const zone = textworld.get_zone("Zone1");
  assertEquals(zone?.name, "Zone1");
  textworld.zone("Zone2").description("This is zone 2").build();
  const zone2 = textworld.get_zone("Zone2");
  assertEquals(zone2?.name, "Zone2");
  textworld.reset_world();
});

Deno.test("can_create_instance_zone", () => {
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
  textworld.create_instance_zone(player, "Zone1");
  const zone = textworld.get_player_zone(player);
  assertEquals(zone?.name, "Zone1");
  assertEquals(zone?.instance, true);
  // Replace the instance zone with a new instance zone
  textworld.create_instance_zone(player, "Zone1");
  const zone2 = textworld.get_player_zone(player);
  assertEquals(zone2?.name, "Zone1");
  assertThrows(
    () => {
      textworld.create_instance_zone(player, "InvalidZone");
    },
    Error,
    "Zone InvalidZone does not exist.",
  );
  textworld.reset_world();
});

Deno.test("can_remove_zone", () => {
  textworld.zone("Zone1").build();
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
  textworld.zone(zoneName).build();
  textworld.room(zoneName, roomName).description("A test room").build();
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
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  const result = textworld.get_player(player.id);
  assertEquals(result?.name, "Player");
  textworld.reset_world();
});

Deno.test("can_get_player", () => {
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  const p1 = textworld.get_player(player.id!);
  assertEquals(p1?.name, "Player");
  textworld.reset_world();
});

Deno.test("can_add_item_to_player", () => {
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.item("Sword").description("A sharp sword").build();
  textworld.add_item_to_player(player, "Sword");
  assertEquals(player.items.length, 1);
  assertEquals(player.items[0]!.name, "Sword");
  textworld.add_item_to_player(player, "Sword");
  assertEquals(player.items[0]!.name, "Sword");
  assertEquals(player.items[0]!.quantity, 2);
  textworld.reset_world();
});

Deno.test("can_set_players_health_to_max", () => {
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.set_actor_health_to_max(player);
  assertEquals(textworld.get_actor_health(player), 10);
  textworld.reset_world();
});

Deno.test("can_add_health_to_player", () => {
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.set_actor_health(player, 2);
  textworld.add_to_actor_health(player, 3);
  assertEquals(textworld.get_actor_health(player), 5);
  textworld.reset_world();
});

Deno.test("can_increase_player_max_health", () => {
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.increase_actor_max_health(player, 20);
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
  textworld.increase_actor_max_health(actor, 20);
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
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  const result = textworld.is_actor_health_full(player);
  assertEquals(result, true);
  textworld.reset_world();
});

Deno.test("cant_get_player_zone_if_player_zone_is_invalid", () => {
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("", "Room1")
    .build();
  const result = textworld.get_player_zone(player);
  assertEquals(result, null);
  textworld.reset_world();
});

Deno.test("cant_resurrect_actor_that_has_no_stats", () => {
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  player.stats = undefined;
  assertThrows(
    () => {
      textworld.resurrect_actor(player);
    },
    Error,
    "Actor does not have stats.",
  );
  textworld.reset_world();
});

Deno.test("can_resurrect_player", () => {
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
  textworld.set_room_as_zone_starter("Zone1", "Room1");
  textworld.set_actor_health(player, 0);
  textworld.resurrect_actor(player);
  assertEquals(textworld.get_actor_health(player), 10);
  textworld.reset_world();
});

Deno.test("can_remove_player", () => {
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.remove_player(player);
  const p1 = textworld.get_player(player.id!);
  assertEquals(p1, null);
  textworld.reset_world();
});

Deno.test("can_create_quest", () => {
  textworld.quest("Quest1").description("A quest").build();
  const quest = textworld.get_quest("Quest1");
  assertEquals(quest?.name, "Quest1");
  textworld.reset_world();
});

Deno.test("can_add_quest_step_to_quest", () => {
  textworld.quest("Quest1").description("A quest").build();
  textworld.add_quest_step("Quest1", "Step1", "A step");
  const quest = textworld.get_quest("Quest1");
  assertEquals(quest?.steps?.length, 1);
  textworld.reset_world();
});

Deno.test("cant_add_quest_action_to_quest_that_doesnt_exist", () => {
  assertThrows(
    () => {
      textworld.add_quest_action("Quest1", "Start", (_player) => {
        return "Hello, World!";
      });
    },
    Error,
    "Quest Quest1 does not exist.",
  );
  textworld.reset_world();
});

Deno.test("can_add_quest_action_to_quest", () => {
  textworld.quest("Quest1").description("A quest").build();
  textworld.add_quest_action("Quest1", "Start", (_player) => {
    return "Hello, World!";
  });
  const quest_action = textworld.get_quest_action("Quest1");
  assertNotEquals(quest_action, null);
  textworld.reset_world();
});

Deno.test("cant_add_quest_action_to_quest_that_has_quest_actions", () => {
  textworld.quest("Quest1").description("A quest").build();
  textworld.add_quest_action("Quest1", "Start", (_player) => {
    return "Hello, World!";
  });
  textworld.add_quest_action("Quest1", "End", (_player) => {
    return "Hello, World!";
  });
  assertThrows(
    () => {
      textworld.add_quest_action("Quest1", "Start", (_player) => {
        return "Hello, World!";
      });
    },
    Error,
    "Quest Quest1 already has an action for Start.",
  );
  assertThrows(
    () => {
      textworld.add_quest_action("Quest1", "End", (_player) => {
        return "Hello, World!";
      });
    },
    Error,
    "Quest Quest1 already has an action for End.",
  );
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
  textworld.quest("Quest1").description("A quest").build();
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
  assertThrows(
    () => {
      textworld.add_quest_step("Quest1", "Step1", "A step", (_player) => {
        return true;
      });
    },
    Error,
    "Quest Quest1 does not exist.",
  );
  textworld.reset_world();
});

Deno.test("cant_get_quest_step_action_that_doesnt_exist", () => {
  textworld.quest("Quest1").description("A quest").build();
  textworld.add_quest_step("Quest1", "Step1", "A step", null);
  const quest_step_action = textworld.get_quest_step_action("Quest1", "Step1");
  assertEquals(quest_step_action, null);
  textworld.reset_world();
});

Deno.test("can_create_room", () => {
  textworld.zone("Zone1").build();
  const zone = textworld.get_zone("Zone1");
  textworld.room("Zone1", "Room1").description("This is room 1").build();
  assertEquals(zone!.rooms.length, 1);
  // create room but the zone does not exist
  textworld.room("Zone2", "Room1").description("This is room 1").build();
  const zone2 = textworld.get_zone("Zone2");
  assertNotEquals(zone2, null);
  textworld.reset_world();
});

Deno.test("can_create_rooms_alternate", () => {
  textworld.create_rooms("Zone1", [
    textworld.r("Room1", "This is room 1"),
    textworld.r("Room2", "This is room 2"),
    textworld.r("Room3", "This is room 3"),
  ]);
  const zone = textworld.get_zone("Zone1");
  assertEquals(zone?.rooms.length, 3);
  textworld.reset_world();
});

Deno.test("can_create_instance_room", () => {
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
  textworld.room("Zone1", "Room2").description("This is room 2").build();
  const non_instance_room = textworld.get_room("Zone1", "Room1");
  assertEquals(non_instance_room?.instance, false);
  textworld.create_instance_room(player, "Zone1", "Room1");
  const result = textworld.get_instance_room(player, "Zone1", "Room1");
  assertEquals(result?.instance, true);
  textworld.create_instance_room(player, "Zone1", "Room2");
  const result2 = textworld.get_instance_room(player, "Zone1", "Room2");
  assertEquals(result2?.instance, true);
  const result3 = textworld.create_instance_room(player, "Zone1", "Room3");
  assertEquals(result3, null);
  // Invalid Zone
  const result4 = textworld.get_instance_room(player, "InvalidZone", "Room1");
  assertEquals(result4, null);
  // Invalid Room
  const result5 = textworld.get_instance_room(player, "Zone1", "InvalidRoom");
  assertEquals(result5, null);
  textworld.reset_world();
});

Deno.test("can_create_instance_room_with_item", () => {
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
  textworld.create_instance_room(player, "Zone1", "Room1");
  textworld.item("Sword").description("A sharp sword").build();
  textworld.place_item("Zone1", "Room1", "Sword", 1, player);
  const instance_room = textworld.get_instance_room(player, "Zone1", "Room1");
  assertEquals(instance_room?.items.length, 1);
  const non_instance_room = textworld.get_room("Zone1", "Room1");
  assertEquals(non_instance_room?.items.length, 0);
  textworld.reset_world();
});

Deno.test("can_create_instance_room_with_mob", () => {
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
  textworld.create_instance_room(player, "Zone1", "Room1");
  textworld.mob("Goblin")
    .description("A small goblin")
    .health(10, 10)
    .stamina(10, 10)
    .magicka(10, 10)
    .physicalDamage(15)
    .physicalDefense(8)
    .spellDamage(5)
    .spellDefense(2)
    .criticalChance(0.05)
    .level(1)
    .build();
  textworld.place_mob("Zone1", "Room1", "Goblin", player);
  const instance_room = textworld.get_instance_room(player, "Zone1", "Room1");
  assertEquals(instance_room?.mobs.length, 1);
  const non_instance_room = textworld.get_room("Zone1", "Room1");
  assertEquals(non_instance_room?.mobs.length, 0);
  textworld.reset_world();
});

Deno.test("create_instance_room_with_npc", () => {
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
  textworld.create_instance_room(player, "Zone1", "Room1");
  textworld.npc("Guard").description("A strong guard").build();
  textworld.place_npc("Zone1", "Room1", "Guard", player);
  const instance_room = textworld.get_instance_room(player, "Zone1", "Room1");
  assertEquals(instance_room?.npcs.length, 1);
  const non_instance_room = textworld.get_room("Zone1", "Room1");
  assertEquals(non_instance_room?.npcs.length, 0);
  textworld.reset_world();
});

Deno.test("can_describe_room", () => {
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
  const result = textworld.get_room_description(player);
  assertEquals(result.response, "This is room 1");
  textworld.npc("Guard").description("A strong guard").build();
  textworld.place_npc("Zone1", "Room1", "Guard");
  const result2 = textworld.get_room_description(player);
  assertEquals(result2.response, "This is room 1");
  assertEquals(result2.npcs, "Guard");
  textworld.item("Silver Sword").description("A shiny silver sword").build();
  textworld.vendor("Foxnir").description("A vendor").inventory([{
    name: "Silver Sword",
    price: 1000,
  }]).build();
  textworld.place_npc("Zone1", "Room1", "Foxnir");
  const result3 = textworld.get_room_description(player);
  assertEquals(result3.npcs, "Guard, Foxnir (Vendor)");
  textworld.mob("Goblin")
    .description("A small goblin")
    .health(10, 10)
    .stamina(10, 10)
    .magicka(10, 10)
    .physicalDamage(15)
    .physicalDefense(8)
    .spellDamage(5)
    .spellDefense(2)
    .criticalChance(0.05)
    .level(1)
    .build();
  textworld.place_mob("Zone1", "Room1", "Goblin");
  const result4 = textworld.get_room_description(player);
  assertEquals(result4.mobs, "Goblin");
  textworld.object("Chest").description("A locked chest").build();
  textworld.place_object("Zone1", "Room1", "Chest");
  const result5 = textworld.get_room_description(player);
  assertEquals(result5.objects, "Chest");
  // INVALID ZONE
  player.location.zone = "InvalidZone";
  assertThrows(
    () => {
      textworld.get_room_description(player);
    },
    Error,
    "Player is not in a valid zone.",
  );
  // INVALID ROOM
  player.location.zone = "Zone1";
  player.location.room = "InvalidRoom";
  assertThrows(
    () => {
      textworld.get_room_description(player);
    },
    Error,
    "Player is not in a valid room.",
  );
  textworld.reset_world();
});

Deno.test("can_describe_room_with_room_actions", () => {
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").onEnter((_player) => {
    return `The healing waters have no effect on you.`;
  }).build();
  const result = textworld.get_room_description(player);
  assertEquals(
    result.response,
    "This is room 1\n\nThe healing waters have no effect on you.",
  );
  textworld.reset_world();
});

Deno.test("can_create_alternate_room_description", () => {
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
  textworld.add_room_description(
    "Zone1",
    "Room1",
    "room1-alt",
    "This is room 1, again!",
  );
  const room = textworld.get_room("Zone1", "Room1");
  assertEquals(room?.descriptions.length, 2);
  assertThrows(
    () => {
      textworld.add_room_description(
        "Zone1",
        "Room2",
        "room2-alt",
        "This is room 2",
      );
    },
    Error,
    "Room Room2 does not exist in zone Zone1.",
  );
  textworld.reset_world();
});

Deno.test("can_show_alternate_room_description", () => {
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
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
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
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
  textworld.zone("Zone1").build();
  const zone = textworld.get_zone("Zone1");
  textworld.room("Zone1", "Room1").description("This is room 1").build();
  textworld.remove_room("Zone1", "Room1");
  assertEquals(zone!.rooms.length, 0);
  textworld.reset_world();
});

Deno.test("can_create_exit", () => {
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
  textworld.room("Zone1", "Room2").description("This is room 2").build();
  textworld.create_exit("Zone1", "Room1", "north", "Room2");
  const exit = textworld.get_exit("Zone1", "Room1", "north");
  assertEquals(exit?.name, "north");
  assertEquals(exit?.location, "Room2");
  assertThrows(
    () => {
      textworld.get_exit("InvalidZone", "Room1", "south");
    },
    Error,
    "Zone InvalidZone does not exist.",
  );
  assertThrows(
    () => {
      textworld.get_exit("Zone1", "InvalidRoom", "south");
    },
    Error,
    "Room InvalidRoom does not exist in zone Zone1.",
  );
  assertThrows(
    () => {
      textworld.get_exit("Zone1", "Room1", "south");
    },
    Error,
    "Exit south does not exist in room Room1.",
  );
  assertThrows(
    () => {
      textworld.create_exit("InvalidZone", "Room1", "north", "Room2");
    },
    Error,
    "Zone InvalidZone does not exist.",
  );
  assertThrows(
    () => {
      textworld.create_exit("InvalidZone", "Room1", "north", "Room2");
    },
    Error,
    "Zone InvalidZone does not exist.",
  );
  assertThrows(
    () => {
      textworld.create_exit("Zone1", "InvalidRoom", "north", "Room2");
    },
    Error,
    "Room InvalidRoom or Room2 does not exist in zone Zone1.",
  );
  textworld.reset_world();
});

Deno.test("can_create_exits", () => {
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
  textworld.room("Zone1", "Room2").description("This is room 2").build();
  textworld.create_exits("Zone1", [
    textworld.e_from("Room1", [
      textworld.e("north", "Room2"),
      textworld.e("south", "Room2"),
      textworld.e("east", "Room2"),
    ]),
  ]);
  const room = textworld.get_room("Zone1", "Room1");
  assertEquals(room?.exits.length, 3);
  assertThrows(
    () => {
      textworld.create_exits("InvalidZone", [
        textworld.e_from("Room1", [
          textworld.e("north", "Room2"),
          textworld.e("south", "Room2"),
          textworld.e("east", "Room2"),
        ]),
      ]);
    },
    Error,
    "Zone InvalidZone does not exist.",
  );
  assertThrows(
    () => {
      textworld.create_exits("Zone1", [
        textworld.e_from("InvalidRoom", [
          textworld.e("north", "Room2"),
          textworld.e("south", "Room2"),
          textworld.e("east", "Room2"),
        ]),
      ]);
    },
    Error,
    "Room InvalidRoom or Room2 does not exist in zone Zone1.",
  );
  textworld.reset_world();
});

Deno.test("can_remove_exit", () => {
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
  textworld.room("Zone1", "Room2").description("This is room 2").build();
  textworld.create_exit("Zone1", "Room1", "north", "Room2");
  textworld.remove_exit("Zone1", "Room1", "north");
  const room = textworld.get_room("Zone1", "Room1");
  assertEquals(room?.exits.length, 0);
  assertThrows(
    () => {
      textworld.remove_exit("InvalidZone", "Room1", "north");
    },
    Error,
    "Zone InvalidZone does not exist.",
  );
  assertThrows(
    () => {
      textworld.remove_exit("Zone1", "InvalidRoom", "north");
    },
    Error,
    "Room InvalidRoom does not exist in zone Zone1.",
  );
  textworld.reset_world();
});

Deno.test("can_create_room_with_action", () => {
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
  textworld.room("Zone1", "Room2").description("This is room 2").onEnter((_player) => {
    return `The healing waters have no effect on you.`;
  }).build();
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
  textworld.recipe("Iron Sword")
    .description("A quality sword for the everyday fighter")
    .ingredients([
      { name: "Iron", quantity: 2 },
      { name: "Wood", quantity: 1 },
    ])
    .produces("Iron Sword", 1)
    .build();
  const recipe = textworld.get_recipe("Iron Sword");
  assertEquals(recipe?.name, "Iron Sword");
  textworld.reset_world();
});

Deno.test("can_create_item", () => {
  textworld.item("Sword").description("A sharp sword").build();
  const item = textworld.get_item("Sword");
  assertEquals(item?.name, "Sword");
  textworld.reset_world();
});

Deno.test("can_create_item_with_action", () => {
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.item("Sword").description("A sharp sword").build();
  textworld.item("Potion").description("A potion").usable().onUse((_player) => {
    return "You drank the potion but nothing happened.";
  }).build();
  const item = textworld.get_item("Potion");
  assertEquals(item?.name, "Potion");
  const result = textworld.get_item_action("Potion");
  assertEquals(
    result?.action(player),
    "You drank the potion but nothing happened.",
  );
  assertThrows(
    () => {
      textworld.get_item_action("Foobar");
    },
    Error,
    "Item Foobar does not exist.",
  );
  const result2 = textworld.get_item_action("Sword");
  assertEquals(result2, null);
  textworld.reset_world();
});

Deno.test("can_get_item", () => {
  textworld.item("Sword").description("A sharp sword").build();
  const item = textworld.get_item("Sword");
  assertEquals(item?.name, "Sword");
  textworld.reset_world();
});

Deno.test("cant_get_room_when_zone_is_invalid", () => {
  assertThrows(
    () => {
      textworld.get_room("InvalidZone", "Room1");
    },
    Error,
    "Zone InvalidZone does not exist.",
  );
  textworld.reset_world();
});

Deno.test("can_get_room_item", () => {
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
  textworld.item("Sword").description("A sharp sword").build();
  textworld.place_item("Zone1", "Room1", "Sword");
  const item = textworld.get_room_item("Zone1", "Room1", "Sword");
  assertEquals(item?.name, "Sword");
  textworld.reset_world();
});

Deno.test("cant_get_room_item_if_zone_does_not_exist", () => {
  assertThrows(
    () => {
      textworld.get_room_item("Zone1", "Room1", "Sword");
    },
    Error,
    "Zone Zone1 does not exist.",
  );
  textworld.reset_world();
});

Deno.test("cant_get_room_item_if_room_does_not_exist", () => {
  textworld.zone("Zone1").build();
  assertThrows(
    () => {
      textworld.get_room_item("Zone1", "Room1", "Sword");
    },
    Error,
    "Room Room1 does not exist in zone Zone1.",
  );
  textworld.reset_world();
});

Deno.test("can_place_object_in_room", () => {
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
  textworld.object("Chest").description("A locked chest").build();
  textworld.place_object("Zone1", "Room1", "Chest");
  const object = textworld.get_room_object("Zone1", "Room1", "Chest");
  assertEquals(object?.name, "Chest");
  // Invalid Object
  assertThrows(
    () => {
      textworld.place_object("Zone1", "Room1", "Crystal Ball");
    },
    Error,
    "Object Crystal Ball does not exist.",
  );
  // Invalid Room
  assertThrows(
    () => {
      textworld.place_object("Zone1", "Room2", "Chest");
    },
    Error,
    "Room Room2 does not exist in zone Zone1.",
  );
  // Instance room
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.object("Tree Branch").description("A sturdy tree branch").build();
  textworld.create_instance_room(player, "Zone1", "Room1");
  textworld.place_object("Zone1", "Room1", "Tree Branch", player);
  const instance_room = textworld.get_instance_room(player, "Zone1", "Room1");
  assertEquals(instance_room?.objects.length, 2);
  textworld.reset_world();
});

Deno.test("can_place_item_in_room", () => {
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
  textworld.item("Sword").description("A sharp sword").build();
  textworld.place_item("Zone1", "Room1", "Sword");
  const item = textworld.get_room_item("Zone1", "Room1", "Sword");
  assertEquals(item?.name, "Sword");
  textworld.reset_world();
});

Deno.test("can_place_items_in_room", () => {
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
  textworld.item("Sword").description("A sharp sword").build();
  textworld.item("Potion").description("An ordinary potion").build();
  textworld.item("Gold Coin").description("A shiny gold coin").build();
  textworld.place_items("Zone1", "Room1", [
    { name: "Sword", quantity: 1 },
    { name: "Potion", quantity: 1 },
    { name: "Gold Coin", quantity: 1 },
  ]);
  const room = textworld.get_room("Zone1", "Room1");
  assertEquals(room?.items.length, 3);
  assertEquals(room!.items[0]!.name, "Sword");
  assertEquals(room!.items[1]!.name, "Potion");
  assertEquals(room!.items[2]!.name, "Gold Coin");
  assertThrows(
    () => {
      textworld.place_items("Zone1", "Room1", [
        { name: "Crystal Ball", quantity: 1 },
      ]);
    },
    Error,
    "Item Crystal Ball does not exist.",
  );
  assertThrows(
    () => {
      textworld.place_items("Zone1", "Room2", [
        { name: "Sword", quantity: 1 },
      ]);
    },
    Error,
    "Room Room2 does not exist in zone Zone1.",
  );
  if (room) {
    room.items.length = 0;
  }
  textworld.create_instance_room(player, "Zone1", "Room1");
  textworld.place_items("Zone1", "Room1", [
    { name: "Sword", quantity: 1 },
    { name: "Potion", quantity: 1 },
    { name: "Gold Coin", quantity: 1 },
  ], player);
  const instance_room = textworld.get_instance_room(player, "Zone1", "Room1");
  assertEquals(instance_room?.items.length, 3);
  assertEquals(instance_room!.items[0]!.name, "Sword");
  assertEquals(instance_room!.items[1]!.name, "Potion");
  assertEquals(instance_room!.items[2]!.name, "Gold Coin");
  textworld.reset_world();
});

Deno.test("cant_place_item_in_room_if_item_doesnt_exist", () => {
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
  assertThrows(
    () => {
      textworld.place_item("Zone1", "Room1", "Sword");
    },
    Error,
    "Item Sword does not exist.",
  );
  textworld.reset_world();
});

Deno.test("cant_place_item_in_room_if_room_doesnt_exist", () => {
  textworld.zone("Zone1").build();
  textworld.item("Sword").description("A sharp sword").build();
  assertThrows(
    () => {
      textworld.place_item("Zone1", "Room1", "Sword");
    },
    Error,
    "Room Room1 does not exist in zone Zone1.",
  );
  textworld.reset_world();
});

Deno.test("can_add_item_drops_to_room", () => {
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
  textworld.item("Sword").description("A sharp sword").build();
  textworld.item("Potion").description("An ordinary potion").usable().consumable().build();
  textworld.create_instance_room(player, "Zone1", "Room1");
  textworld.place_item("Zone1", "Room1", "Sword", 1, player);
  textworld.place_item("Zone1", "Room1", "Potion", 2, player);
  const room = textworld.get_player_room(player);
  assertEquals(room?.items.length, 2);
  assertEquals(room!.items[0]!.name, "Sword");
  assertEquals(room!.items[1]!.name, "Potion");
  textworld.reset_world();
});

Deno.test("can_create_mob", () => {
  textworld.mob("Goblin")
    .description("A small goblin")
    .health(10, 10)
    .stamina(10, 10)
    .magicka(10, 10)
    .physicalDamage(15)
    .physicalDefense(8)
    .spellDamage(5)
    .spellDefense(2)
    .criticalChance(0.05)
    .level(1)
    .build();
  const mob = textworld.get_mob("Goblin");
  assertEquals(mob?.name, "Goblin");
  textworld.reset_world();
});

Deno.test("cant_get_mob_that_does_not_exist", () => {
  const mob = textworld.get_mob("Goblin");
  assertEquals(mob, null);
});

Deno.test("can_place_mob_in_room", () => {
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
  textworld.mob("Goblin")
    .description("A small goblin")
    .health(10, 10)
    .stamina(10, 10)
    .magicka(10, 10)
    .physicalDamage(15)
    .physicalDefense(8)
    .spellDamage(5)
    .spellDefense(2)
    .criticalChance(0.05)
    .level(1)
    .build();
  textworld.place_mob("Zone1", "Room1", "Goblin");
  const room = textworld.get_room("Zone1", "Room1");
  assertEquals(room?.mobs.length, 1);
  assertEquals(room!.mobs[0]!.name, "Goblin");
  assertThrows(
    () => {
      textworld.place_mob("Zone1", "Room1", "Moblin");
    },
    Error,
    "MOB Moblin does not exist.",
  );
  textworld.remove_room("Zone1", "Room1");
  assertThrows(
    () => {
      textworld.place_mob("Zone1", "Room1", "Goblin");
    },
    Error,
    "Room Room1 does not exist in zone Zone1.",
  );
  textworld.reset_world();
});

Deno.test("can_get_room_mob", () => {
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
  textworld.mob("Goblin")
    .description("A small goblin")
    .health(10, 10)
    .stamina(10, 10)
    .magicka(10, 10)
    .physicalDamage(15)
    .physicalDefense(8)
    .spellDamage(5)
    .spellDefense(2)
    .criticalChance(0.05)
    .level(1)
    .build();
  textworld.place_mob("Zone1", "Room1", "Goblin");
  const mob = textworld.get_room_mob("Zone1", "Room1", "Goblin");
  assertEquals(mob?.name, "Goblin");
  const mob2 = textworld.get_room_mob("Zone1", "Room1", "Moblin");
  assertEquals(mob2, null);
  const mob3 = textworld.get_room_mob("Zone2", "Room1", "Goblin");
  assertEquals(mob3, null);
  const mob4 = textworld.get_room_mob("Zone1", "Room2", "Goblin");
  assertEquals(mob4, null);
  textworld.reset_world();
});

Deno.test("can_create_npc", () => {
  textworld.npc("Guard").description("A strong guard").build();
  const npc = textworld.get_npc("Guard");
  assertEquals(npc?.name, "Guard");
  textworld.reset_world();
});

Deno.test("can_create_npc_with_dialog", () => {
  textworld.npc("Guard").description("A strong guard").build();
  textworld.create_dialog(
    "Guard",
    ["Hello"],
    "Hello citizen, make sure you mind the law!",
  );
  const npc = textworld.get_npc("Guard");
  assertEquals(npc?.name, "Guard");
  assertEquals(npc?.dialog?.length, 1);
  assertThrows(
    () => {
      textworld.create_dialog("InvalidNpc", ["Goodbye"], "Goodbye citizen!");
    },
    Error,
    "NPC InvalidNpc does not exist.",
  );
  textworld.reset_world();
});

Deno.test("can_create_vendor", () => {
  textworld.vendor("Vendor1").description("A friendly food vendor").inventory([
    { name: "Fried Chicken & Roasted Vegetables", price: 2 },
    { name: "Steak & Potatoes with Gravy", price: 3 },
  ]).build();
  const vendor = textworld.get_npc("Vendor1");
  assertEquals(vendor?.name, "Vendor1");
  assertEquals(vendor?.vendor_items?.length, 2);
  textworld.reset_world();
});

Deno.test("can_remove_npc", () => {
  textworld.npc("Guard").description("A strong guard").build();
  textworld.remove_npc("Guard");
  const npc = textworld.get_npc("Guard");
  assertEquals(npc, null);
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
  textworld.npc("Old Lady").description("A sweet old lady").build();
  textworld.place_npc("Zone1", "Room1", "Old Lady");
  textworld.remove_npc("Old Lady", "Zone1", "Room1");
  const room = textworld.get_room("Zone1", "Room1");
  assertEquals(room?.npcs.length, 0);
  textworld.reset_world();
});

Deno.test("can_add_room_action", () => {
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.set_actor_health(player, 5);
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
  textworld.add_room_action("Zone1", "Room1", (player) => {
    textworld.set_actor_health_to_max(player);
    return "You feel a rush of energy wash over you! Your health is restored.";
  });
  const result = textworld.get_room_actions("Zone1", "Room1");
  assertEquals(result?.actions?.length, 1);
  // Add additional room action
  textworld.add_room_action("Zone1", "Room1", (_player) => {
    return "Second room action.";
  });
  const result2 = textworld.get_room_actions("Zone1", "Room1");
  assertEquals(result2?.actions?.length, 2);
  // Invalid room
  assertThrows(
    () => {
      textworld.add_room_action("Zone1", "InvalidRoom", (_player) => {
        return "Do something";
      });
    },
    Error,
    "Room InvalidRoom does not exist in zone Zone1.",
  );
  textworld.reset_world_actions();
  const result3 = textworld.get_room_actions("Zone1", "Room1");
  assertEquals(result3, null);
  textworld.reset_world();
});

Deno.test("can_add_room_command_action", () => {
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
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
  const result = textworld.get_room_command_action("Zone1", "InvalidRoom");
  assertEquals(result, null);
  assertThrows(
    () => {
      textworld.add_room_command_action(
        "Zone1",
        "InvalidRoom",
        "xyzzy action",
        "You recited the magical word XYZZY!!!",
        ["xyzzy"],
        (
          _player: tw.Player,
          _input: string,
          _command: string,
          _args: string[],
        ) => "How dare you utter the magical word XYZZY!",
      );
    },
    Error,
    "Room InvalidRoom does not exist in zone Zone1.",
  );
  textworld.reset_world();
});

Deno.test("can_add_flag_on_player", () => {
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.set_flag(player, "flag1");
  const has_flag = textworld.has_flag(player, "flag1");
  assertEquals(has_flag, true);
  player.flags.length = 0;
  textworld.reset_world();
});

Deno.test("can_remove_flag_on_player", () => {
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.set_flag(player, "flag1");
  textworld.remove_flag(player, "flag1");
  const has_flag = textworld.has_flag(player, "flag1");
  assertEquals(has_flag, false);
  textworld.reset_world();
});

Deno.test("can_add_god_mode_flag_on_player", () => {
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.set_godmode(player);
  const has_flag = textworld.has_flag(player, "godmode");
  assertEquals(has_flag, true);
  textworld.reset_world();
});

Deno.test("can_remove_god_mode_flag_on_player", () => {
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.set_godmode(player);
  textworld.remove_godmode(player);
  const has_flag = textworld.has_flag(player, "godmode");
  assertEquals(has_flag, false);
  textworld.reset_world();
});

Deno.test("can_remove_room_command_action", () => {
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
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
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
  textworld.npc("Guard").description("A strong guard").build();
  textworld.place_npc("Zone1", "Room1", "Guard");
  const npc = textworld.get_room_npc("Zone1", "Room1", "Guard");
  assertEquals(npc?.name, "Guard");
  textworld.reset_world();
});

Deno.test("cant_place_npc_in_room_if_npc_doesnt_exist", () => {
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
  assertThrows(
    () => {
      textworld.place_npc("Zone1", "Room1", "Guard");
    },
    Error,
    "NPC Guard does not exist.",
  );
  textworld.reset_world();
});

Deno.test("cant_place_npc_in_room_if_room_doesnt_exist", () => {
  textworld.zone("Zone1").build();
  textworld.npc("Guard").description("A strong guard").build();
  assertThrows(
    () => {
      textworld.place_npc("Zone1", "Room1", "Guard");
    },
    Error,
    "Room Room1 does not exist in zone Zone1.",
  );
  textworld.reset_world();
});

Deno.test("cant_get_room_npc_if_room_doesnt_exist", () => {
  textworld.zone("Zone1").build();
  assertThrows(
    () => {
      textworld.get_room_npc("Zone1", "Room1", "Guard");
    },
    Error,
    "Room Room1 does not exist in zone Zone1.",
  );
  textworld.reset_world();
});

Deno.test("cant_get_room_npc_if_npc_doesnt_exist", () => {
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
  const result = textworld.get_room_npc("Zone1", "Room1", "Guard");
  assertEquals(result, null);
  textworld.reset_world();
});

Deno.test("can_set_and_remove_godmode_on_player", () => {
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.set_godmode(player);
  let result = textworld.has_flag(player, "godmode");
  assertEquals(result, true);
  textworld.remove_godmode(player);
  result = textworld.has_flag(player, "godmode");
  assertEquals(result, false);
  textworld.reset_world();
});

Deno.test("can_create_room_object", () => {
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
  textworld.object("Fireplace")
    .description("A warm fire burns in the fireplace and you can feel the heat radiating from it.")
    .build();
  textworld.place_object("Zone1", "Room1", "Fireplace");
  const object = textworld.get_room_object("Zone1", "Room1", "Fireplace");
  assertEquals(object?.name, "Fireplace");
  assertEquals(
    object!.descriptions[0]!.description,
    "A warm fire burns in the fireplace and you can feel the heat radiating from it.",
  );
  // Invalid Room
  assertThrows(
    () => {
      textworld.get_room_object("Zone1", "InvalidRoom", "Fireplace");
    },
    Error,
    "Room InvalidRoom does not exist in zone Zone1.",
  );
  // Invalid Object
  const result = textworld.get_room_object("Zone1", "Room1", "Crystal Ball");
  assertEquals(result, null);
  textworld.reset_world();
});

Deno.test("can_create_room_object_with_action", () => {
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
  textworld.object("Fireplace")
    .description("A warm fire burns in the fireplace and you can feel the heat radiating from it.")
    .interaction(["fan flame"], "The flames become stronger as you fan them.")
    .build();
  textworld.create_dialog_action(
    "Fireplace",
    ["snuff fire"],
    (_player) => {
      return "You snuffed out the fire.";
    },
  );
  textworld.place_object("Zone1", "Room1", "Fireplace");
  const object = textworld.get_room_object("Zone1", "Room1", "Fireplace");
  assertEquals(object?.name, "Fireplace");
  assertEquals(
    object!.descriptions[0]!.description,
    "A warm fire burns in the fireplace and you can feel the heat radiating from it.",
  );
  const action = textworld.get_dialog_action("Fireplace");
  assert(action);
  const result = action(player, "snuff fire", "fire", ["snuff", "fire"]);
  assertEquals(result, "You snuffed out the fire.");
  const action2 = textworld.get_dialog_action("InvalidObject");
  assertEquals(action2, null);
  textworld.reset_world();
});

Deno.test("can_process_look_at_room_object", () => {
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
  textworld.object("Fireplace")
    .description("A warm fire burns in the fireplace and you can feel the heat radiating from it.")
    .build();
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
  // Description is empty
  const object = textworld.get_room_object("Zone1", "Room1", "Fireplace");
  if (object) {
    object.descriptions = [];
  }
  const result2 = textworld.look_at_or_examine_object(
    player,
    "look at fireplace",
    "look at",
    ["look", "at", "fireplace"],
  );
  assertEquals(
    result2.response,
    "There's nothing special about it.",
  );
  // Invalid Player Room
  player.location.room = "InvalidRoom";
  const result3 = textworld.look_at_or_examine_object(
    player,
    "look at fireplace",
    "look at",
    ["look", "at", "fireplace"],
  );
  assertEquals(result3.response, "Player is not in a valid room.");
  // Invalid Object
  player.location.room = "Room1";
  const result4 = textworld.look_at_or_examine_object(
    player,
    "look at crystal ball",
    "look at",
    ["look", "at", "crystal", "ball"],
  );
  assertEquals(result4.response, "That object does not exist.");
  // Object with dialog
  const firepit_object = textworld.object("Firepit")
    .description("A warm fire burns in the firepit and you can feel the heat radiating from it.")
    .interaction(["blow on fire"], "You blew on the fire and it grew stronger.")
    .build();
  textworld.create_dialog_action(
    firepit_object.name,
    ["blow on fire"],
    (_player) => {
      return "You blew on the fire and it went out.";
    },
  );
  textworld.place_object("Zone1", "Room1", "Firepit");
  const result5 = textworld.look_at_or_examine_object(
    player,
    "examine Firepit",
    "examine",
    ["examine", "Firepit", "blow on fire"],
  );
  assertEquals(
    result5.response,
    "You blew on the fire and it went out.",
  );
  const result6 = textworld.look_at_or_examine_object(
    player,
    "examine Firepit",
    "examine",
    ["examine", "Firepit", "invalid action"],
  );
  assertEquals(
    result6.response,
    "There's nothing more to learn about this object.",
  );
  textworld.reset_world();
});

Deno.test("can_process_examine_room_object", () => {
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
  textworld.object("Fireplace")
    .description("A warm fire burns in the fireplace and you can feel the heat radiating from it.")
    .interaction(["fan flame"], "The flames become stronger as you fan them.")
    .build();
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
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.zone("Zone1").build();
  assertThrows(
    () => {
      textworld.get_room_description(player);
    },
    Error,
    "Player is not in a valid room.",
  );
  textworld.reset_world();
});

Deno.test("can_process_get_exit_with_no_rooms", () => {
  assertThrows(
    () => {
      textworld.get_exit("Zone1", "Room1", "north");
    },
    Error,
    "Zone Zone1 does not exist.",
  );
  textworld.reset_world();
});

Deno.test("can_parse_command_get_help", async () => {
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  const result = JSON.parse(await textworld.parse_command(player, "help"));
  assertEquals(
    result.response,
    "Commands:\n\nnorth, south, east, west - Commands for moving around the world.\ntake, get - Take an item from the room or an NPC.\nuse - Use an item in your inventory.\ndrop - Drop an item or all your items from your inventory.\nlook, l - Look around the room or at yourself.\nls - Look at yourself.\nexamine, x - Examine an object in a room.\ninspect, i, search - Inspect a room to see what items are there.\nmap - Plot a map showing nearby rooms.\nshow - Show an item in your inventory.\ntalk to, tt - Talk to an NPC or Vendor.\ngoto - Go to a room or zone.\nhelp - Show the help text.\nattack - Attack a mob.\ncraft - Craft an item.",
  );
  textworld.reset_world();
});

Deno.test("can_parse_command_get_help_when_player_is_dead", async () => {
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.set_actor_health(player, 0);
  const result = JSON.parse(await textworld.parse_command(player, "help"));
  assertEquals(
    result.response,
    "Commands:\n\nhelp - Show the help text.\nresurrect, rez - resurrect yourself.",
  );
  textworld.reset_world();
});

Deno.test("can_parse_command_examine_room_object", async () => {
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
  textworld.object("Fireplace")
    .description("A warm fire burns in the fireplace and you can feel the heat radiating from it.")
    .interaction(["fan flame"], "The flames become stronger as you fan them.")
    .build();
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
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.set_actor_health(player, 100);
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
  textworld.mob("Goblin")
    .description("A small goblin")
    .health(10, 10)
    .stamina(10, 10)
    .magicka(10, 10)
    .physicalDamage(15)
    .physicalDefense(8)
    .spellDamage(5)
    .spellDefense(2)
    .criticalChance(0.05)
    .level(1)
    .build();
  textworld.place_mob("Zone1", "Room1", "Goblin");
  const result = JSON.parse(
    await textworld.parse_command(player, "attack goblin"),
  );
  assertStringIncludes(result.response, "Player attacks Goblin");
  textworld.reset_world();
});

Deno.test("can_parse_command_direction", async () => {
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
  textworld.room("Zone1", "Room2").description("This is room 2").build();
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
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.set_godmode(player);
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "The Room1").description("This is room 1").build();
  textworld.room("Zone1", "The Room2").description("This is room 2").build();
  const result = JSON.parse(
    await textworld.parse_command(player, "goto room The Room2"),
  );
  assertEquals(result.response, "This is room 2");
  textworld.remove_godmode(player);
  textworld.reset_world();
});

Deno.test("can_parse_command_goto_when_requirements_arent_met", async () => {
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.zone("Zone1").build();
  const result = JSON.parse(
    await textworld.parse_command(player, "goto room The Room2"),
  );
  assertEquals(result.response, "I don't understand that command.");
  textworld.reset_world();
});

Deno.test("can_parse_command_goto_zone", async () => {
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.set_godmode(player);
  textworld.zone("Zone1").build();
  textworld.zone("Zone2").build();
  textworld.room("Zone1", "The Room1").description("This is room 1").build();
  textworld.room("Zone2", "The Forest").description("This is the forest").build();
  textworld.set_room_as_zone_starter("Zone2", "The Forest");
  const result = JSON.parse(
    await textworld.parse_command(player, "goto zone Zone2"),
  );
  assertEquals(result.response, "This is the forest");
  textworld.remove_godmode(player);
  textworld.reset_world();
});

Deno.test("can_parse_command_take", async () => {
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
  textworld.item("Sword").description("A sharp sword").build();
  textworld.place_item("Zone1", "Room1", "Sword");
  const result = JSON.parse(
    await textworld.parse_command(player, "take sword"),
  );
  assertEquals(result.response, "You took the Sword.");
  assertEquals(player.items.length, 1);
  textworld.reset_world();
});

Deno.test("can_parse_command_take_all", async () => {
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
  textworld.item("Sword").description("A sharp sword").build();
  textworld.item("Potion").description("An ordinary potion").usable().consumable().build();
  textworld.place_item("Zone1", "Room1", "Sword");
  textworld.place_item("Zone1", "Room1", "Potion", 2);
  const result = JSON.parse(await textworld.parse_command(player, "take all"));
  assertEquals(result.response, "You took all items: Sword (1), Potion (2)");
  assertEquals(player.items.length, 2);
  textworld.reset_world();
});

Deno.test("can_parse_command_use", async () => {
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
  textworld.item("Potion")
    .description("An ordinary potion")
    .usable()
    .consumable()
    .onUse((_player) => {
      return "You drank the potion but nothing happened.";
    })
    .build();
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
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.zone("Zone1").build();
  textworld.item("Potion").description("An ordinary potion").usable().consumable().build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
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
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
  textworld.item("Sword").description("A sharp sword").build();
  textworld.item("Potion").description("An ordinary potion").usable().consumable().build();
  textworld.place_item("Zone1", "Room1", "Sword");
  textworld.place_item("Zone1", "Room1", "Potion", 2);
  textworld.take_all_items(player);
  const result = JSON.parse(await textworld.parse_command(player, "drop all"));
  assertEquals(result.response, "You dropped all your items.");
  assertEquals(player.items.length, 0);
  textworld.reset_world();
});

Deno.test("can_parse_command_look", async () => {
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
  const result = JSON.parse(await textworld.parse_command(player, "look"));
  assertEquals(result.response, "This is room 1");
  textworld.reset_world();
});

Deno.test("can_parse_command_look_at_self", async () => {
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  const result = JSON.parse(await textworld.parse_command(player, "look self"));
  assertEquals(result.response, "You are a strong adventurer");
});

Deno.test("can_parse_command_look_at_self_synonym_ls", async () => {
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  const result = JSON.parse(await textworld.parse_command(player, "ls"));
  assertEquals(result.response, "You are a strong adventurer");
});

Deno.test("can_parse_command_look_at_object", async () => {
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
  textworld.object("Sword").description("A sharp sword").build();
  textworld.place_object("Zone1", "Room1", "Sword");
  const result = JSON.parse(
    await textworld.parse_command(player, "look at sword"),
  );
  assertEquals(result.response, "A sharp sword");
  textworld.reset_world();
});

Deno.test("can_parse_command_examine_object", async () => {
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
  textworld.object("Fireplace")
    .description("A warm fire burns in the fireplace and you can feel the heat radiating from it.")
    .interaction(["fan flames"], "The flames become stronger as you fan them.")
    .build();
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

Deno.test("can_parse_command_inspect_room", async () => {
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
  textworld.item("Sword").description("A sharp sword").build();
  textworld.item("Potion").description("An ordinary potion").usable().consumable().build();
  textworld.place_item("Zone1", "Room1", "Sword");
  textworld.place_item("Zone1", "Room1", "Potion", 2);
  const result = JSON.parse(await textworld.parse_command(player, "inspect"));
  assertEquals(
    result.response,
    "You inspect the room and found:\n\nItems: Sword (1), Potion (2)",
  );
  // Inspect with no items
  textworld.reset_world();
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
  const result2 = JSON.parse(await textworld.parse_command(player, "inspect"));
  assertEquals(
    result2.response,
    "You inspect the room and found:\n\nThere is nothing else of interest here.",
  );
  // Inspect with mobs
  textworld.reset_world();
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
  textworld.mob("Goblin")
    .description("A small goblin")
    .health(10, 10)
    .stamina(10, 10)
    .magicka(10, 10)
    .physicalDamage(15)
    .physicalDefense(8)
    .spellDamage(5)
    .spellDefense(2)
    .criticalChance(0.05)
    .level(1)
    .build();
  textworld.place_mob("Zone1", "Room1", "Goblin");
  const result3 = JSON.parse(await textworld.parse_command(player, "inspect"));
  assertEquals(
    result3.response,
    "You inspect the room and found:\n\nMobs: Goblin\nThere is nothing else of interest here.",
  );
  textworld.reset_world();
});

Deno.test("can_parse_command_show_item", async () => {
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
  textworld.item("Potion").description("An ordinary potion").usable().consumable().build();
  textworld.place_item("Zone1", "Room1", "Potion", 2);
  textworld.take_item(player, ["Potion"]);
  const result = JSON.parse(
    await textworld.parse_command(player, "show potion"),
  );
  assertEquals(result.response, "An ordinary potion");
  textworld.reset_world();
});

Deno.test("can_parse_command_show_all_items", async () => {
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
  textworld.item("Sword").description("A sharp sword").build();
  textworld.item("Potion").description("An ordinary potion").usable().consumable().build();
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
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.quest("Kill the dragon").description("Kill the dragon").build();
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
    const player = textworld.player("Player")
      .description("You are a strong adventurer")
      .location("Zone1", "Room1")
      .build();
    const result = JSON.parse(
      await textworld.parse_command(player, "show quests"),
    );
    assertEquals(result.response, "You have no quests.");
    textworld.reset_world();
  },
);

Deno.test("can_parse_incorrect_command_to_talk_to_npc", async () => {
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
  textworld.npc("Guard").description("A strong guard").build();
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
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
  textworld.npc("Guard").description("A strong guard").build();
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
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
  textworld.npc("Old_woman").description("An ordinary old woman").build();
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
            textworld.item("Gem").description("A shiny gem").build();
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
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
  textworld.vendor("Vendor1").description("A friendly food vendor").inventory([
    { name: "Fried Chicken & Roasted Vegetables", price: 2 },
  ]).build();
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
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  player.gold = 10;
  textworld.item("Sword").description("A sharp sword").build();
  textworld.set_item_level_and_value("Sword", 5, 25);
  textworld.add_item_to_player(player, "Sword", 2);
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
  textworld.vendor("Vendor1").description("A friendly vendor").inventory([]).build();
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
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  player.gold = 10;
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
  textworld.item("Fried Chicken & Roasted Vegetables")
    .description("A delicious dinner of fried chicken and roasted vegetables.")
    .build();
  textworld.vendor("Vendor1").description("A friendly food vendor").inventory([
    { name: "Fried Chicken & Roasted Vegetables", price: 2 },
  ]).build();
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

Deno.test("can_parse_command_talk_to_vendor_and_purchase_item_with_synonym", async () => {
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  player.gold = 10;
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
  textworld.item("Fried Chicken & Roasted Vegetables")
    .description("A delicious dinner of fried chicken and roasted vegetables.")
    .build();
  textworld.vendor("Vendor1").description("A friendly food vendor").inventory([
    { name: "Fried Chicken & Roasted Vegetables", price: 2 },
  ]).build();
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

Deno.test("can_parse_command_talk_to_vendor_and_handle_when_item_is_not_specified", async () => {
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  player.gold = 10;
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
  textworld.item("Fried Chicken & Roasted Vegetables")
    .description("A delicious dinner of fried chicken and roasted vegetables.")
    .build();
  textworld.vendor("Vendor1").description("A friendly food vendor").inventory([
    { name: "Fried Chicken & Roasted Vegetables", price: 2 },
  ]).build();
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
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
  textworld.room("Zone1", "Room2").description("This is room 2").build();
  textworld.room("Zone1", "Room3").description("This is room 3").build();
  textworld.create_exit("Zone1", "Room1", "north", "Room2");
  textworld.create_exit("Zone1", "Room2", "east", "Room3");
  const result = JSON.parse(await textworld.parse_command(player, "map"));
  assertEquals(result.response, `#-#\n|  \n@  `);
  textworld.reset_world();
});

Deno.test("can_parse_room_command_action", async () => {
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
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
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.zone("Zone1").build();
  let result = JSON.parse(await textworld.parse_command(player, "talk to"));
  assertEquals(result.response, "hmm...");
  result = JSON.parse(await textworld.parse_command(player, "foobar"));
  assertEquals(result.response, "I don't understand that command.");
  result = JSON.parse(await textworld.parse_command(player, "show"));
  assertEquals(result.response, "That item does not exist.");
  assertRejects(
    async () => {
      await textworld.parse_command(player, "take");
    },
    Error,
    "Player is not in a valid room.",
  );
  result = JSON.parse(await textworld.parse_command(player, "use"));
  assertEquals(result.response, "That item does not exist.");
  result = JSON.parse(await textworld.parse_command(player, "drop"));
  assertEquals(result.response, "That item does not exist.");
  textworld.set_godmode(player);
  result = JSON.parse(await textworld.parse_command(player, "goto"));
  assertEquals(result.response, "That room or zone does not exist.");
  textworld.remove_godmode(player);
  assertRejects(
    async () => {
      await textworld.parse_command(player, "look");
    },
    Error,
    "Player is not in a valid room.",
  );
  result = JSON.parse(await textworld.parse_command(player, "inspect"));
  assertEquals(result.response, "There is nothing else of interest here.");
  result = JSON.parse(await textworld.parse_command(player, "north"));
  assertEquals(result.response, "You can't go that way.");
});

Deno.test("can_parse_empty_command", async () => {
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
  const result = JSON.parse(await textworld.parse_command(player, ""));
  assertEquals(result.response, "This is room 1");
  textworld.reset_world();
});

Deno.test("can_parse_command_craft", async () => {
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
  textworld.item("Iron").description("A piece of iron").build();
  textworld.item("Wood").description("A piece of wood").build();
  textworld.place_item("Zone1", "Room1", "Iron", 4);
  textworld.place_item("Zone1", "Room1", "Wood", 4);
  textworld.take_all_items(player);
  textworld.recipe("Iron Sword")
    .description("A quality sword for the everyday fighter")
    .ingredients([
      { name: "Iron", quantity: 2 },
      { name: "Wood", quantity: 1 },
    ])
    .produces("Iron Sword", 1)
    .build();
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
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
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
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  const result = JSON.parse(
    await textworld.parse_command(player, "load test-slot"),
  );
  assertEquals(result.response, "Unable to load progress from slot: test-slot");
  await Deno.remove(tw.player_progress_db_name);
  textworld.reset_world();
});

Deno.test("can_parse_command_save", async () => {
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
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

Deno.test("can_spawn_item_in_room_using_spawn_location", async () => {
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
  textworld.item("Iron").description("A piece of iron").build();
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
  assertEquals(room!.items[0]!.name, "Iron");
  const result = textworld.create_spawn_location(
    "Test Spawner 2",
    "Zone1",
    "Room1",
    10,
    true,
    (_spawn_location: tw.SpawnLocation) => {},
  );
  textworld.start_spawn_location("Test Spawner 2");
  assertEquals(result.interval, 10);
  // Let the spawner interval run
  await delay(15);
  textworld.remove_spawn_location("Test Spawner 2");
  textworld.reset_world();
});

Deno.test("can_remove_spawn_location", () => {
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
  textworld.item("Iron").description("A piece of iron").build();
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

Deno.test("player_cannot_attack_npc", () => {
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  const npc = textworld.npc("Old man").description("A wise old man").build();
  const result = textworld.perform_attack(player, npc);
  assertStringIncludes(result, "Cannot perform attack.");
  textworld.reset_world();
});

Deno.test("mob_can_attack_player", () => {
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.set_actor_health(player, 100);
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
  const mob = textworld.mob("Goblin")
    .description("A small goblin")
    .health(10, 10)
    .stamina(10, 10)
    .magicka(10, 10)
    .physicalDamage(15)
    .physicalDefense(8)
    .spellDamage(5)
    .spellDefense(2)
    .criticalChance(0.05)
    .level(1)
    .build();
  textworld.place_mob("Zone1", "Room1", "Goblin");
  const result = textworld.perform_attack(mob, player);
  assertStringIncludes(result, "Goblin attacks Player");
  textworld.reset_world();
});

Deno.test("mob_can_kill_player", () => {
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.set_actor_health(player, 1);
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
  const mob = textworld.mob("Goblin")
    .description("A small goblin")
    .health(10, 10)
    .stamina(10, 10)
    .magicka(10, 10)
    .physicalDamage(15)
    .physicalDefense(8)
    .spellDamage(5)
    .spellDefense(2)
    .criticalChance(0.05)
    .level(1)
    .build();
  textworld.place_mob("Zone1", "Room1", "Goblin");
  const result = textworld.perform_attack(mob, player);
  assertStringIncludes(result, "Goblin attacks Player");
  assertStringIncludes(result, "Player has been defeated!");
  textworld.reset_world();
});

Deno.test("player_can_attack_mob", () => {
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
  const mob = textworld.mob("Goblin")
    .description("A small goblin")
    .health(100, 100)
    .stamina(10, 10)
    .magicka(10, 10)
    .physicalDamage(15)
    .physicalDefense(8)
    .spellDamage(5)
    .spellDefense(2)
    .criticalChance(0.05)
    .level(1)
    .build();
  textworld.place_mob("Zone1", "Room1", "Goblin");
  const result = textworld.perform_attack(player, mob);
  assertStringIncludes(result, "Player attacks Goblin");
  textworld.reset_world();
});

Deno.test("player_can_kill_mob", () => {
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
  const mob = textworld.mob("Goblin")
    .description("A small goblin")
    .health(1, 1)
    .stamina(1, 1)
    .magicka(1, 1)
    .physicalDamage(1)
    .physicalDefense(1)
    .spellDamage(1)
    .spellDefense(1)
    .criticalChance(0.05)
    .level(1)
    .build();
  textworld.place_mob("Zone1", "Room1", "Goblin");
  const result = textworld.perform_attack(player, mob);
  assertStringIncludes(result, "Player attacks Goblin");
  assertStringIncludes(result, "Goblin has been defeated!");
  textworld.reset_world();
});

Deno.test("player_can_initiate_attack_on_mob", () => {
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.mob("Goblin")
    .description("A small goblin")
    .health(100, 100)
    .stamina(10, 10)
    .magicka(10, 10)
    .physicalDamage(15)
    .physicalDefense(8)
    .spellDamage(5)
    .spellDefense(2)
    .criticalChance(0.05)
    .level(1)
    .build();
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
  textworld.place_mob("Zone1", "Room1", "Goblin");
  const result = textworld.initiate_attack(player, ["goblin"]);
  assertStringIncludes(result.response, "Player attacks Goblin");
  player.location.zone = "InvalidZone";
  assertThrows(
    () => {
      textworld.initiate_attack(player, ["goblin"]);
    },
    Error,
    "Player is not in a valid zone.",
  );
  player.location.zone = "Zone1";
  player.location.room = "InvalidRoom";
  assertThrows(
    () => {
      textworld.initiate_attack(player, ["goblin"]);
    },
    Error,
    "Player is not in a valid room.",
  );
  player.location.room = "Room1";
  const result2 = textworld.initiate_attack(player, ["zombie"]);
  assertStringIncludes(result2.response, "That mob does not exist.");
  textworld.reset_world();
});

Deno.test("player_can_kill_mob_and_drop_loot", () => {
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
  textworld.item("Sword").description("A sharp sword").build();
  textworld.item("Shield").description("A strong shield").build();
  textworld.mob("Goblin")
    .description("A small goblin")
    .health(1, 1)
    .stamina(1, 1)
    .magicka(1, 1)
    .physicalDamage(1)
    .physicalDefense(1)
    .spellDamage(1)
    .spellDefense(1)
    .criticalChance(0.05)
    .level(1)
    .drops([
      { name: "Sword", quantity: 1 },
      { name: "Shield", quantity: 1 },
    ])
    .build();
  textworld.place_mob("Zone1", "Room1", "Goblin");
  const result = textworld.initiate_attack(player, ["goblin"]);
  assertStringIncludes(result.response, "Player attacks Goblin");
  assertStringIncludes(result.response, "Goblin has been defeated!");
  const room = textworld.get_room("Zone1", "Room1");
  assertEquals(room?.items.length, 2);
  assertEquals(room!.items[0]!.name, "Sword");
  assertEquals(room!.items[1]!.name, "Shield");
  textworld.reset_world();
});

Deno.test("player_can_kill_mob_and_pickup_look", () => {
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
  textworld.item("Sword").description("A sharp sword").build();
  textworld.item("Shield").description("A strong shield").build();
  textworld.mob("Goblin")
    .description("A small goblin")
    .health(1, 1)
    .stamina(1, 1)
    .magicka(1, 1)
    .physicalDamage(1)
    .physicalDefense(1)
    .spellDamage(1)
    .spellDefense(1)
    .criticalChance(0.05)
    .level(1)
    .drops([
      { name: "Sword", quantity: 1 },
      { name: "Shield", quantity: 1 },
    ])
    .build();
  textworld.place_mob("Zone1", "Room1", "Goblin");
  const result = textworld.initiate_attack(player, ["goblin"], true);
  assertStringIncludes(result.response, "Player attacks Goblin");
  assertStringIncludes(result.response, "Goblin has been defeated!");
  textworld.take_all_items(player);
  const room = textworld.get_room("Zone1", "Room1");
  assertEquals(room?.items.length, 0);
  assertEquals(player.items.length, 2);
  assertEquals(player.items[0]!.name, "Sword");
  assertEquals(player.items[1]!.name, "Shield");

  textworld.reset_world();
});

Deno.test("player_can_attack_mob_and_mob_can_attack_player", () => {
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.set_actor_health(player, 100);
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
  textworld.mob("Goblin")
    .description("A small goblin")
    .health(20, 20)
    .stamina(1, 1)
    .magicka(1, 1)
    .physicalDamage(1)
    .physicalDefense(1)
    .spellDamage(1)
    .spellDefense(1)
    .criticalChance(0.05)
    .level(1)
    .build();
  textworld.place_mob("Zone1", "Room1", "Goblin");
  const result = textworld.initiate_attack(player, ["goblin"], true);
  assertStringIncludes(result.response, "Player attacks Goblin");
  assertStringIncludes(result.response, "Goblin attacks Player");
  textworld.reset_world();
});

Deno.test("player_can_die_from_mob_attack", () => {
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.set_actor_health(player, 1);
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
  textworld.mob("Goblin")
    .description("A small goblin")
    .health(100, 100)
    .stamina(10, 10)
    .magicka(10, 10)
    .physicalDamage(55)
    .physicalDefense(55)
    .spellDamage(55)
    .spellDefense(55)
    .criticalChance(0.5)
    .level(1)
    .build();
  textworld.place_mob("Zone1", "Room1", "Goblin");
  const result = textworld.initiate_attack(player, ["goblin"], true);
  assertStringIncludes(result.response, "Player attacks Goblin");
  assertStringIncludes(result.response, "Goblin attacks Player");
  assertStringIncludes(result.response, "Player has been defeated!");
  textworld.reset_world();
});

Deno.test("player_can_die_from_mob_attack_and_resurrect", async () => {
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.set_actor_health(player, 1);
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
  textworld.set_room_as_zone_starter("Zone1", "Room1");
  textworld.mob("Goblin")
    .description("A small goblin")
    .health(100, 100)
    .stamina(10, 10)
    .magicka(10, 10)
    .physicalDamage(55)
    .physicalDefense(55)
    .spellDamage(55)
    .spellDefense(55)
    .criticalChance(5)
    .level(1)
    .build();
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
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
  textworld.item("Cane").description("A wooden cane").build();
  textworld.item("Sword").description("A sharp sword").build();
  textworld.place_item("Zone1", "Room1", "Sword");
  textworld.take_item(player, ["Sword"]);
  assertEquals(player.items.length, 1);
  const result = textworld.take_item(player, ["Cane"]);
  assertEquals(result?.response, "That item does not exist.");
  textworld.reset_world();
});

Deno.test("player_can_take_all_items", () => {
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
  textworld.item("Sword").description("A sharp sword").build();
  textworld.item("Potion").description("A potion").usable(true).consumable(true).build();
  textworld.place_item("Zone1", "Room1", "Sword");
  textworld.place_item("Zone1", "Room1", "Potion");
  textworld.take_all_items(player);
  assertEquals(player.items.length, 2);
  const result = textworld.take_all_items(player);
  assertEquals(result?.response, "There are no items to take.");
  textworld.reset_world();
});

Deno.test("player_takes_item_and_players_inventory_contains_item", () => {
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
  textworld.item("Sword").description("A sharp sword").build();
  textworld.place_item("Zone1", "Room1", "Sword");
  textworld.take_item(player, ["Sword"]);
  const result = textworld.has_item(player, "Sword");
  assertEquals(result, true);

  textworld.reset_world();
});

Deno.test("player_can_take_item_and_it_stacks_in_inventory", () => {
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
  textworld.item("Potion").description("An ordinary potion").build();
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
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.zone("Zone1").build();
  textworld.item("Potion").description("A potion").usable(true).consumable(true).build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
  textworld.place_item("Zone1", "Room1", "Potion");
  textworld.take_item(player, ["Potion"]);
  textworld.drop_item(player, ["Potion"]);
  assertEquals(player.items.length, 0);

  textworld.reset_world();
});

Deno.test("player_can_drop_all_items", () => {
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
  textworld.item("Sword").description("A sharp sword").build();
  textworld.item("Potion").description("A potion").usable(true).consumable(true).build();
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
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
  textworld.item("Glove").description("A glove").usable(true).consumable(true).onUse((_player) => {
    return "";
  }).build();
  textworld.item("Cane").description("A wooden cane").usable(true).consumable(true).onUse((_player) => {
    return "";
  }).build();
  textworld.item("Potion").description("A potion").usable(true).consumable(true).onUse((_player) => {
    return "You drank the potion but nothing happened.";
  }).build();
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

Deno.test("player_cant_use_item_that_is_not_usable", () => {
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.zone("Zone1").build();
  textworld.item("Sword").description("A sharp sword").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
  textworld.place_item("Zone1", "Room1", "Sword");
  textworld.take_item(player, ["Sword"]);
  const result = textworld.use_item(player, ["Sword"]);
  assertEquals(result.response, "You can't use that item.");
  assertEquals(player.items.length, 1);
  textworld.reset_world();
});

Deno.test("can_remove_item_from_player_inventory", () => {
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
  textworld.item("Potion").description("A potion").usable(true).consumable(true).onUse((_player) => {
    return "You drank the potion but nothing happened.";
  }).build();
  textworld.place_item("Zone1", "Room1", "Potion");
  textworld.take_item(player, ["Potion"]);
  textworld.remove_player_item(player, "Potion");
  assertEquals(player.items.length, 0);
  textworld.reset_world();
});

Deno.test("can_create_item_and_remove_it", () => {
  textworld.item("Potion").description("A potion").usable(true).consumable(true).build();
  textworld.remove_item("Potion");
  const result = textworld.get_item("Potion");
  assertEquals(result, null);
});

Deno.test("player_can_look", () => {
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
  const result = textworld.look(player, "look", "look", ["look"]);
  assertEquals(result.response, "This is room 1");
  textworld.reset_world();
});

Deno.test("player_can_look_at_self_with_description", () => {
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  const result = textworld.look_self(player);
  assertEquals(result, "You are a strong adventurer");
});

Deno.test("player_can_look_at_self_with_no_description", () => {
  const player = textworld.player("Player")
    .description("Player Description")
    .location("Zone1", "Room1")
    .build();
  player.descriptions = [];
  const result = textworld.look_self(player);
  assertEquals(result, "You don't really like looking at yourself.");
});

Deno.test("player_can_look_at_self_with_no_description_and_has_inventory", () => {
  const player = textworld.player("Player")
    .description("Player Description")
    .location("Zone1", "Room1")
    .build();
  player.descriptions = [];
  const result = textworld.look_self(player);
  assertEquals(result, "You don't really like looking at yourself.");
});

Deno.test("player_can_look_at_self_without_inventory", () => {
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
  textworld.item("Sword").description("A sharp sword").build();
  textworld.item("Diamond").description("A diamond surely worth a fortune").build();
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
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
  textworld.item("Sword").description("A sharp sword").build();
  textworld.item("Diamond").description("A diamond surely worth a fortune").build();
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
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
  const result = textworld.inspect_room(player);
  assertEquals(
    result.response,
    "You inspect the room and found:\n\nThere is nothing else of interest here.",
  );
  textworld.reset_world();
});

Deno.test("player_can_inspect_room_with_items", () => {
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
  textworld.item("Sword").description("A sharp sword").build();
  textworld.item("Potion").description("An ordinary potion").usable(true).consumable(true).build();
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
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
  textworld.item("Potion").description("An ordinary potion").usable(true).consumable(true).build();
  textworld.place_item("Zone1", "Room1", "Potion", 2);
  textworld.take_item(player, ["Potion"]);
  const result = textworld.show(player, ["Potion"]);
  assertEquals(result.response, "An ordinary potion");
  textworld.remove_item("Potion");
  const result2 = textworld.show(player, ["Potion"]);
  assertEquals(result2.response, "That item does not exist.");
  textworld.item("Sword").description("A sharp sword").build();
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
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  const result = textworld.show_all_items(player);
  assertEquals(result.response, "You have no items to show.");
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
  textworld.item("Sword").description("A sharp sword").build();
  textworld.item("Potion").description("An ordinary potion").usable(true).consumable(true).build();
  textworld.place_item("Zone1", "Room1", "Sword");
  textworld.place_item("Zone1", "Room1", "Potion", 2);
  textworld.take_all_items(player);
  const result2 = textworld.show_all_items(player);
  assertEquals(
    result2.response,
    "Sword - A sharp sword\n\nPotion - An ordinary potion",
  );
  player.items.length = 0;
  player.items.push({ name: "Foo", quantity: 1 });
  const result3 = textworld.show_all_items(player);
  assertEquals(result3.response, "You have no items to show.");
  textworld.reset_world();
});

Deno.test("player_can_purchase_from_vendor", () => {
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  player.gold = 10;
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
  textworld.item("Fried Chicken & Roasted Vegetables").description("").build();
  textworld.vendor("Vendor1")
    .description("A friendly food vendor")
    .inventory([{ name: "Fried Chicken & Roasted Vegetables", price: 2 }])
    .build();
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
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  player.gold = 10;
  textworld.add_item_to_player(player, "Fried Chicken & Roasted Vegetables", 1);
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
  textworld.item("Fried Chicken & Roasted Vegetables").description("").build();
  textworld.vendor("Vendor1")
    .description("A friendly food vendor")
    .inventory([{ name: "Fried Chicken & Roasted Vegetables", price: 2 }])
    .build();
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
  assertEquals(player.items[0]!.name, "Fried Chicken & Roasted Vegetables");
  assertEquals(player.items[0]!.quantity, 2);
  textworld.reset_world();
});

Deno.test("player_cant_purchase_from_vendor_that_doesnt_have_items_for_sale", () => {
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  player.gold = 10;
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
  textworld.item("Fried Chicken & Roasted Vegetables").description("").build();
  textworld.vendor("Vendor1").description("A friendly food vendor").inventory([]).build();
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
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  player.gold = 1;
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
  textworld.item("Fried Chicken & Roasted Vegetables").description("").build();
  textworld.vendor("Vendor1")
    .description("A friendly food vendor")
    .inventory([{ name: "Fried Chicken & Roasted Vegetables", price: 2 }])
    .build();
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

Deno.test("player_cant_purchase_nonexistent_item_from_vendor", () => {
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  player.gold = 10;
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
  textworld.vendor("Vendor1")
    .description("A friendly food vendor")
    .inventory([{ name: "Fried Chicken in Thick Gravy", price: 2 }])
    .build();
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
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.quest("Quest1").description("A quest").build();
  textworld.add_quest_action("Quest1", "Start", (_player) => {
    return "Hello, World!";
  });
  textworld.pickup_quest(player, "Quest1");
  assertEquals(player.quests.length, 1);
  textworld.reset_world();
});

Deno.test("player_cant_pickup_nonexistent_quest", () => {
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  const result = textworld.pickup_quest(player, "Quest1");
  assertEquals(result, "The quest does not exist.");
  textworld.reset_world();
});

Deno.test("player_cant_pickup_quest_they_already_have", () => {
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.quest("Quest1").description("A quest").build();
  textworld.pickup_quest(player, "Quest1");
  const result = textworld.pickup_quest(player, "Quest1");
  assertEquals(result, "You already have the quest Quest1.");
  textworld.reset_world();
});

Deno.test("player_cant_pickup_more_quests_than_allowed", () => {
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.quest("Quest1").description("A quest").build();
  textworld.quest("Quest2").description("A quest").build();
  textworld.quest("Quest3").description("A quest").build();
  textworld.quest("Quest4").description("A quest").build();
  textworld.quest("Quest5").description("A quest").build();
  textworld.quest("Quest6").description("A quest").build();
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
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  assertThrows(
    () => {
      textworld.is_quest_complete(player, "Quest1");
    },
    Error,
    "The quest Quest1 does not exist.",
  );
  textworld.reset_world();
});

Deno.test("player_cant_complete_quest_that_player_doesnt_have", () => {
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.quest("Quest1").description("A quest").build();
  const result = textworld.is_quest_complete(player, "Quest1");
  assertEquals(result, false);
  textworld.reset_world();
});

Deno.test("player_cant_complete_quest_that_has_no_steps", () => {
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.quest("Quest1").description("A quest").build();
  textworld.pickup_quest(player, "Quest1");
  assertThrows(
    () => {
      textworld.is_quest_complete(player, "Quest1");
    },
    Error,
    "The quest Quest1 does not have any steps.",
  );
  textworld.reset_world();
});

Deno.test("player_can_complete_quest", () => {
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
  textworld.item("Magic Ring").description("A magic ring").build();
  textworld.place_item("Zone1", "Room1", "Magic Ring");
  textworld.quest("Quest1").description("A quest").build();
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
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.quest("Quest1").description("A quest").build();
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
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  assertThrows(
    () => {
      textworld.get_quest_progress(player, "Quest1");
    },
    Error,
    "The quest Quest1 does not exist.",
  );
  textworld.reset_world();
});

Deno.test("player_cant_get_quest_progress_for_a_quest_they_dont_have", () => {
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.quest("Quest1").description("A quest").build();
  const result = textworld.get_quest_progress(player, "Quest1");
  assertEquals(result, "You don't have the quest Quest1.");
  textworld.reset_world();
});

Deno.test("player_can_complete_quest_with_multiple_steps", () => {
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
  textworld.room("Zone1", "Room2")
    .description("This is room 2")
    .onEnter((player) => {
      textworld.set_flag(player, "visited_room2");
      return null;
    })
    .build();
  textworld.create_exit("Zone1", "Room1", "north", "Room2");
  textworld.npc("Old Woman").description("An ordinary old woman").build();
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
            textworld.item("Gem").description("A shiny gem").build();
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
  textworld.quest("Quest1").description("A quest").build();
  textworld.add_quest_action("Quest1", "End", (player) => {
    if (textworld.has_flag(player, "took_gem")) {
      textworld.remove_flag(player, "took_gem");
      textworld.remove_flag(player, "visited_room2");
    }
    return null;
  });
  textworld.add_quest_step("Quest1", "Step1", "Visit room 2", () => {
    return player.flags.includes("visited_room2");
  });
  textworld.add_quest_step("Quest1", "Step2", "Get gem from old woman", () => {
    return textworld.has_flag(player, "took_gem");
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
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.quest("Quest1").description("A quest").build();
  textworld.pickup_quest(player, "Quest1");
  textworld.drop_quest(player, "Quest1");
  assertEquals(player.quests.length, 0);
  textworld.reset_world();
});

Deno.test("player_cant_drop_quest_that_doesnt_exist", () => {
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  const result = textworld.drop_quest(player, "Quest1");
  assertEquals(result, "The quest Quest1 does not exist.");
  textworld.reset_world();
});

Deno.test("player_cant_drop_quest_they_dont_have", () => {
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.quest("Quest1").description("A quest").build();
  const result = textworld.drop_quest(player, "Quest1");
  assertEquals(result, "You don't have the quest Quest1.");
  textworld.reset_world();
});

Deno.test("player_starts_in_valid_room", () => {
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
  const room = textworld.get_player_room(player);
  assertEquals(room!.name, "Room1");
  textworld.reset_world();
});

Deno.test("player_can_navigate_between_rooms", () => {
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
  textworld.room("Zone1", "Room2").description("This is room 2").build();
  textworld.create_exit("Zone1", "Room1", "north", "Room2");
  textworld.switch_room(player, "north");
  const room = textworld.get_player_room(player);
  assertEquals(room!.name, "Room2");
  player.location.zone = "InvalidZone";
  assertThrows(
    () => {
      textworld.switch_room(player, "north");
    },
    Error,
    "Player is not in a valid zone.",
  );
  player.location.zone = "Zone1";
  player.location.room = "Room1";
  textworld.create_exit("Zone1", "Room1", "south", "Room2", true);
  textworld.switch_room(player, "south");
  const room2 = textworld.get_player_room(player);
  assertEquals(room2!.name, "Room2");
  textworld.reset_world();
});

Deno.test("player_cant_navigate_to_nonexistent_room", () => {
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
  const result = textworld.switch_room(player, "north");
  assertEquals(result.response, "You can't go that way.");
  textworld.reset_world();
});

Deno.test("player_can_goto_new_zone", () => {
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.set_flag(player, "godmode");
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1 in zone 1").build();
  textworld.zone("Zone2").build();
  textworld.room("Zone2", "Room1").description("This is room 1 in zone 2").build();
  textworld.set_room_as_zone_starter("Zone2", "Room1");
  const result = textworld.goto(player, ["zone", "Zone2"]);
  assertEquals(result.response, "This is room 1 in zone 2");
  textworld.reset_world();
});

Deno.test("player_cant_goto_room_that_doesnt_exist_in_zone", () => {
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.set_flag(player, "godmode");
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
  const result = textworld.goto(player, ["room Room2"]);
  assertEquals(result.response, "That room or zone does not exist.");
  textworld.reset_world();
});

Deno.test("player_can_learn_recipe", () => {
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
  textworld.recipe("Iron Sword")
    .description("A quality sword for the everyday fighter")
    .ingredients([
      { name: "Iron", quantity: 2 },
      { name: "Wood", quantity: 1 },
    ])
    .produces("Iron Sword", 1)
    .build();
  textworld.item("Iron Sword recipe")
    .description("A recipe for an iron sword")
    .usable(true)
    .consumable(true)
    .onUse((player) => {
      return textworld.learn_recipe(player, "Iron Sword");
    })
    .build();
  textworld.place_item("Zone1", "Room1", "Iron Sword recipe");
  textworld.take_item(player, ["Iron Sword recipe"]);
  const result = textworld.use_item(player, ["Iron Sword recipe"]);
  assertEquals(result.response, "You learned the recipe for Iron Sword.");
  assertEquals(player.known_recipes.length, 1);

  textworld.reset_world();
});

Deno.test("player_cant_learn_recipe_player_already_knows", () => {
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  player.known_recipes.push("Iron Sword");
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
  textworld.recipe("Iron Sword")
    .description("A quality sword for the everyday fighter")
    .ingredients([
      { name: "Iron", quantity: 2 },
      { name: "Wood", quantity: 1 },
    ])
    .produces("Iron Sword", 1)
    .build();
  textworld.item("Iron Sword recipe")
    .description("A recipe for an iron sword")
    .usable(true)
    .onUse((player) => {
      return textworld.learn_recipe(player, "Iron Sword");
    })
    .build();
  textworld.place_item("Zone1", "Room1", "Iron Sword recipe");
  textworld.take_item(player, ["Iron Sword recipe"]);
  const result = textworld.use_item(player, ["Iron Sword recipe"]);
  assertEquals(result.response, "You already know that recipe.");
  assertEquals(player.known_recipes.length, 1);
  assertEquals(player.items.length, 1);

  textworld.reset_world();
});

Deno.test("player_can_craft_recipe", () => {
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
  textworld.item("Iron").description("A piece of iron").build();
  textworld.item("Wood").description("A piece of wood").build();
  textworld.place_item("Zone1", "Room1", "Iron", 2);
  textworld.place_item("Zone1", "Room1", "Wood", 1);
  textworld.take_all_items(player);
  textworld.recipe("Iron Sword")
    .description("A quality sword for the everyday fighter")
    .ingredients([
      { name: "Iron", quantity: 2 },
      { name: "Wood", quantity: 1 },
    ])
    .produces("Iron Sword", 1)
    .build();
  textworld.learn_recipe(player, "Iron Sword");
  const result = textworld.craft_recipe(player, ["Iron Sword"]);
  assertEquals(result.response, "Iron Sword has been crafted.");
  assertEquals(player.items.length, 1);
  // Not enough materials
  const result2 = textworld.craft_recipe(player, ["Iron Sword"]);
  assertEquals(
    result2.response,
    "You don't have the ingredients to craft that.",
  );
  // Invalid Recipe
  textworld.reset_world();
  assertThrows(
    () => {
      textworld.craft_recipe(player, ["Iron Sword"]);
    },
    Error,
    "Recipe does not exist.",
  );
  textworld.reset_world();
});

Deno.test("player_cant_learn_recipe_that_doesnt_exist", () => {
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  const result = textworld.learn_recipe(player, "Iron Sword");
  assertEquals(result, "That recipe does not exist.");
});

Deno.test("player_cant_craft_unknown_recipe", () => {
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  const result = textworld.craft_recipe(player, ["Iron Sword"]);
  assertEquals(result.response, "You don't know how to craft that.");
  textworld.reset_world();
});

Deno.test("cant_get_recipe_that_does_not_exist", () => {
  const result = textworld.get_recipe("Iron Sword");
  assertEquals(result, null);
});

Deno.test("player_can_talk_to_npc", () => {
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
  textworld.npc("Big Guard").description("A strong guard").build();
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
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
  textworld.npc("Big Guard").description("A strong guard").build();
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

  const malformed_npc = textworld.npc("Witch").description("A mysterious witch").build();
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
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
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
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
  textworld.npc("Big Guard").description("A strong guard").build();
  textworld.create_dialog(
    "Big Guard",
    ["Hello"],
    "Hello citizen, make sure you mind the law!",
  );
  textworld.place_npc("Zone1", "Room1", "Big Guard");
  const result = textworld.interact_with_actor(
    player,
    "talk to Big Guard say Hello",
    "talk to",
    ["talk", "to", "Big", "Guard", "say", "Hello"],
  );
  assertEquals(result.response, "Hello citizen, make sure you mind the law!");
  player.location.zone = "Zone2";
  player.location.room = "Room2";
  assertThrows(
    () => {
      textworld.interact_with_actor(
        player,
        "talk to Big Guard say Goodbye",
        "talk to",
        ["talk", "to", "Big", "Guard", "say", "Goodbye"],
      );
    },
    Error,
    "Player is not in a valid zone or room.",
  );
  textworld.reset_world();
});

Deno.test("player_can_talk_to_vendor_and_list_items", () => {
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  player.gold = 10;
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
  textworld.item("Fried Chicken & Roasted Vegetables")
    .description("A delicious dinner of fried chicken and roasted vegetables.")
    .build();
  textworld.vendor("Vendor1")
    .description("A friendly food vendor")
    .inventory([{ name: "Fried Chicken & Roasted Vegetables", price: 2 }])
    .build();
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
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  player.gold = 10;
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
  textworld.item("Fried Chicken & Roasted Vegetables")
    .description("A delicious dinner of fried chicken and roasted vegetables.")
    .build();
  textworld.vendor("Vendor1")
    .description("A friendly food vendor")
    .inventory([{ name: "Fried Chicken & Roasted Vegetables", price: 2 }])
    .build();
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
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
  textworld.npc("Big Guard").description("A strong guard").build();
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
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.set_flag(player, "godmode");
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "The Room1").description("This is room 1").build();
  textworld.room("Zone1", "The Room2").description("This is room 2").build();
  const result = textworld.goto(player, ["room", "The", "Room2"]);
  assertEquals(result.response, "This is room 2");
  textworld.reset_world();
});

Deno.test(
  "player_can_navigate_to_new_zone_using_custom_room_action",
  async () => {
    const player = textworld.player("Player")
      .description("You are a strong adventurer")
      .location("Zone1", "Room1")
      .build();
    textworld.set_flag(player, "godmode");
    textworld.zone("Zone1").build();
    textworld.room("Zone1", "Room1").description("This is room 1 in zone 1").build();
    textworld.zone("Zone2").build();
    textworld.room("Zone2", "Room1").description("This is room 1 in zone 2").build();
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
    assertEquals(player.location.zone, "Zone2");
    assertEquals(player.location.room, "Room1");
    textworld.reset_world();
  },
);

Deno.test("player_can_save_progress", async () => {
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
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
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
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
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1")
    .description("This is room 1 in zone 1")
    .onEnter((_player) => {
      return "This message is from a room action";
    })
    .build();
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
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.item("Potion").description("A potion").usable(true).consumable(true).onUse((_player) => {
    return "You drank the potion but nothing happened.";
  }).build();
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
    const player = textworld.player("Player")
      .description("You are a strong adventurer")
      .location("Zone1", "Room1")
      .build();
    textworld.zone("Zone1").build();
    textworld.room("Zone1", "Room1").description("This is room 1 in zone 1").build();
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
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
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
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
  textworld.item("Magic Ring").description("A magic ring").build();
  textworld.place_item("Zone1", "Room1", "Magic Ring");
  textworld.quest("Quest1").description("A quest").build();
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
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
  textworld.npc("Guard").description("A strong guard").build();
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
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.zone("Zone1").build();
  textworld.zone("Zone2").build();
  textworld.room("Zone1", "Room1").description("This is room 1 in zone 1").build();
  textworld.room("Zone2", "Room1").description("This is room 1 in zone 2").build();
  textworld.set_room_as_zone_starter("Zone1", "Room1");
  textworld.set_room_as_zone_starter("Zone2", "Room1");
  textworld.set_player_room_to_zone_start(player, "Zone2");
  assertEquals(player.location.zone, "Zone2");
  assertEquals(player.location.room, "Room1");
  assertThrows(
    () => {
      textworld.set_room_as_zone_starter("InvalidZone", "Room1");
    },
    Error,
    "Zone InvalidZone does not exist.",
  );
  assertThrows(
    () => {
      textworld.set_room_as_zone_starter("Zone1", "InvalidRoom");
    },
    Error,
    "Room InvalidRoom does not exist in zone Zone1.",
  );
  textworld.reset_world();
});

Deno.test("cant_set_players_room_to_zone_start_if_there_is_no_starter_room_in_zone", () => {
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.zone("Zone1").build();
  textworld.zone("Zone2").build();
  textworld.room("Zone1", "Room1").description("This is room 1 in zone 1").build();
  textworld.room("Zone2", "Room1").description("This is room 1 in zone 2").build();
  textworld.set_room_as_zone_starter("Zone1", "Room1");
  assertThrows(
    () => {
      textworld.set_player_room_to_zone_start(player, "Zone2");
    },
    Error,
    "Zone Zone2 does not have a starter room.",
  );
  // Invalid Zone
  const result = textworld.get_zone_starter_room("InvalidZone");
  assertEquals(result, null);
  textworld.reset_world();
});

Deno.test("can_set_players_room_to_another_room", () => {
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
  textworld.room("Zone1", "Room2").description("This is room 2").build();
  textworld.set_room_as_zone_starter("Zone1", "Room1");
  textworld.set_player_zone_and_room(player, "Zone1", "Room2");
  assertEquals(player.location.zone, "Zone1");
  assertEquals(player.location.room, "Room2");
  textworld.reset_world();
});

Deno.test("can_set_players_zone_and_room", () => {
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room2")
    .build();
  textworld.zone("Zone1").build();
  textworld.zone("Zone2").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
  textworld.room("Zone2", "Room1").description("This is room 1").build();
  textworld.set_player_zone_and_room(player, "Zone2", "Room1");
  assertEquals(player.location.zone, "Zone2");
  assertEquals(player.location.room, "Room1");
  textworld.reset_world();
});

Deno.test("can_get_help", () => {
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  const result = textworld.get_help(player);
  assertEquals(
    result.response,
    "Commands:\n\nnorth, south, east, west - Commands for moving around the world.\ntake, get - Take an item from the room or an NPC.\nuse - Use an item in your inventory.\ndrop - Drop an item or all your items from your inventory.\nlook, l - Look around the room or at yourself.\nls - Look at yourself.\nexamine, x - Examine an object in a room.\ninspect, i, search - Inspect a room to see what items are there.\nmap - Plot a map showing nearby rooms.\nshow - Show an item in your inventory.\ntalk to, tt - Talk to an NPC or Vendor.\ngoto - Go to a room or zone.\nhelp - Show the help text.\nattack - Attack a mob.\ncraft - Craft an item.",
  );
  const textworld2 = new tw.TextWorld();
  textworld2.add_command_action(
    "Main",
    textworld2.create_command_action(
      "foo",
      "",
      ["foo"],
      (_player, _input, _command, _args) => {
        return "foo";
      },
    ),
  );
  const result2 = textworld2.get_help(player);
  assertStringIncludes(result2.response, "No description available.");
  textworld2.add_command_action(
    "PlayerDead",
    textworld2.create_command_action(
      "foo",
      "",
      ["foo"],
      (_player, _input, _command, _args) => {
        return "foo";
      },
    ),
  );
  const result3 = textworld2.get_help(player);
  assertStringIncludes(result3.response, "No description available.");
  textworld.reset_world();
});

Deno.test("can_get_help_when_player_is_dead", () => {
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
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
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
  const current_room = textworld
    .get_player_zone(player)
    ?.rooms.find(
      (room) => room.name.toLowerCase() === player.location.room.toLowerCase(),
    );
  assertNotEquals(current_room, null);
  const result = textworld.get_description(player, current_room!, "default");
  assertEquals(result, "This is room 1");
  textworld.reset_world();
});

Deno.test("can_plot_room_map", () => {
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room2")
    .build();
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
  textworld.room("Zone1", "Room2").description("This is room 2").build();
  textworld.room("Zone1", "Room3").description("This is room 3").build();
  textworld.room("Zone1", "Room4").description("This is room 4").build();
  textworld.create_exit("Zone1", "Room1", "north", "Room2");
  textworld.create_exit("Zone1", "Room2", "south", "Room1");
  textworld.create_exit("Zone1", "Room2", "north", "Room3");
  textworld.create_exit("Zone1", "Room3", "south", "Room2");
  textworld.create_exit("Zone1", "Room3", "north", "Room4", true);
  const result = textworld.plot_room_map(player);
  assertEquals(result.response, "#\n|\n@\n|\n#");
  player.location.zone = "InvalidZone";
  assertThrows(
    () => {
      textworld.plot_room_map(player);
    },
    Error,
    "Player is not in a valid zone.",
  );
  textworld.reset_world();
});

Deno.test("can_add_flag_action", () => {
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room2")
    .build();
  textworld.set_flag(player, "foobar");
  // this adds flag action if it doesn't exist
  textworld.add_flag_action(
    "foobar",
    (_player) => {},
  );
  // this replaces flag action if it exists
  textworld.add_flag_action(
    "foobar",
    (_player) => {},
  );
  const result = textworld.get_flag_action("foobar");
  assertNotEquals(result, null);
  const result2 = textworld.get_flag_action("baz");
  assertEquals(result2, null);
  textworld.reset_world();
});

Deno.test("can_add_session", () => {
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room2")
    .build();
  textworld.add_session(player, "foobar", "String", "baz");
  const result = textworld.get_session(player, "foobar");
  assertNotEquals(result, null);
  assertEquals(result?.payload, "baz");
  textworld.add_session(player, "foobar", "String", "xyzzy");
  const result2 = textworld.get_session(player, "foobar");
  assertNotEquals(result2, null);
  assertEquals(result2?.payload, "xyzzy");
  textworld.remove_session(player, "foobar");
  const result3 = textworld.get_session(player, "foobar");
  assertEquals(result3, null);
  textworld.reset_world();
});

Deno.test("can_process_question_sequence", () => {
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room2")
    .build();
  const question_sequence: tw.QuestionSequence = {
    name: "player_questions",
    questions: [
      {
        id: "name",
        data_type: "String",
        question: "What is your name?",
      },
      {
        id: "age",
        data_type: "Number",
        question: "How old are you?",
      },
      {
        id: "adventure",
        data_type: "Boolean",
        question: "Are you ready for an adventure?",
      },
    ],
  };
  textworld.add_session(
    player,
    textworld.current_question_sequence,
    "String",
    "player_questions",
  );

  textworld.add_session(
    player,
    "player_questions",
    "QuestionSequence",
    question_sequence,
    {
      name: "player_questions",
      action: (_player: tw.Player, _session: tw.Session) => {},
    },
  );
  const result = textworld.get_session(player, "player_questions");
  assertNotEquals(result, null);

  const question_result = textworld.parse_question_sequence(
    player,
    "",
    () => {},
  );
  assertNotEquals(question_result, null);
  assertStringIncludes(question_result!, "What is your name?");

  const question_result2 = textworld.parse_question_sequence(
    player,
    "Frank",
    () => {},
  );
  assertNotEquals(question_result2, null);
  assertStringIncludes(question_result2!, "How old are you?");

  const question_result3 = textworld.parse_question_sequence(
    player,
    "18",
    () => {},
  );
  assertNotEquals(question_result3, null);
  assertStringIncludes(question_result3!, "Are you ready for an adventure?");

  // Question answer should be something that can be parsed to a boolean
  // e.g., yes, no, true or false
  const question_result4 = textworld.parse_question_sequence(
    player,
    "hello",
    () => {},
  );
  assertNotEquals(question_result4, null);
  assertStringIncludes(question_result4!, "Are you ready for an adventure?");

  // Since the previous answer is not valid, the same question will get asked again
  const question_result5 = textworld.parse_question_sequence(
    player,
    "yes",
    () => {},
  );
  assertEquals(question_result5, null);

  const payload = result?.payload as tw.QuestionSequence;
  assertEquals(payload.questions[0]!.answer, "Frank");
  assertEquals(payload.questions[1]!.answer, "18");
  assertEquals(payload.questions[2]!.answer, "yes");

  textworld.remove_session(player, "player_questions");
  const result3 = textworld.parse_question_sequence(
    player,
    "",
    () => {},
  );
  assertEquals(result3, null);
  // Can't get a session if it doesn't exist
  player.sessions = [];
  const result2 = textworld.get_session(player, "QuestionSequence");
  assertEquals(result2, null);
  textworld.reset_world();
});

Deno.test("can_parse_command_with_question_sequence", async () => {
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();

  const question_sequence: tw.QuestionSequence = {
    name: "player_questions",
    questions: [
      {
        id: "name",
        data_type: "String",
        question: "What is your name?",
      },
    ],
  };
  textworld.add_session(
    player,
    textworld.current_question_sequence,
    "String",
    "player_questions",
  );
  textworld.add_session(
    player,
    "player_questions",
    "QuestionSequence",
    question_sequence,
    {
      name: "player_questions",
      action: (_player: tw.Player, _session: tw.Session) => {
        assertNotEquals(_player, null);
      },
    },
  );
  const result = textworld.get_session(player, "player_questions");
  assertNotEquals(result, null);

  const command_result = await textworld.parse_command(player, "");
  assertNotEquals(command_result, null);
  assertStringIncludes(command_result, "What is your name?");

  const command_result2 = await textworld.parse_command(player, "Frank");
  assertNotEquals(command_result2, null);

  textworld.reset_world();
});

Deno.test("can_send_email", () => {
  const player1 = textworld.player("Player1")
    .description("You are a strong adventurer")
    .location("Zone1", "Room2")
    .build();
  const player2 = textworld.player("Player2")
    .description("You are a strong adventurer")
    .location("Zone1", "Room2")
    .build();
  textworld.send_email(player1.id, player2.id, "Hello", "Hello, how are you?");
  assertEquals(player2.email.length, 1);
  textworld.delete_email(player2, player2.email[0]!.id);
  assertEquals(player2.email.length, 0);
  assertThrows(
    () => {
      textworld.send_email(
        "InvalidPlayerId",
        player2.id,
        "Hello",
        "Hello, how are you?",
      );
    },
    Error,
    "Player does not exist.",
  );
  assertThrows(
    () => {
      textworld.send_email(
        player1.id,
        "InvalidPlayerId",
        "Hello",
        "Hello, how are you?",
      );
    },
    Error,
    "Player does not exist.",
  );
  textworld.reset_world();
});

Deno.test("can_add_achievement", () => {
  textworld.add_achievement(
    "First is Best",
    "Complete your first quest",
    "first_quest",
    (_player) => {
      return true;
    },
  );
  const result = textworld.get_achievement("First is Best");
  assertNotEquals(result, null);
  assertObjectMatch(result!, {
    name: "First is Best",
    description: "Complete your first quest",
    flag: "first_quest",
  });
  assertThrows(
    () => {
      textworld.add_achievement(
        "First is Best",
        "",
        "fail",
        (_player) => {
          return true;
        },
      );
    },
    Error,
    "An achievement with the name First is Best or flag fail already exists.",
  );
  assertThrows(
    () => {
      textworld.add_achievement(
        "Fail",
        "",
        "first_quest",
        (_player) => {
          return true;
        },
      );
    },
    Error,
    "An achievement with the name Fail or flag first_quest already exists.",
  );
  const result2 = textworld.get_achievement("Fail");
  assertEquals(result2, null);
  textworld.reset_world();
});

Deno.test("can_get_achievement", () => {
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.add_achievement(
    "Easy Achievement",
    "Earn your first achievement",
    "first_achievement",
    (_player) => {
      // player has completed the achievement
      return true;
    },
  );
  textworld.add_achievement(
    "Another Achievement",
    "This is the second achievement",
    "second_achievement",
    (_player) => {
      // player has not completed this achievement
      return false;
    },
  );
  textworld.process_achievements(player);
  assertEquals(player.achievements.length, 1);
  // should be no change if we process achievements again
  textworld.process_achievements(player);
  assertEquals(player.achievements.length, 1);
  textworld.reset_world();
});

Deno.test("can_run_websocket_server", async () => {
  const player = textworld.player("Player")
    .description("You are a strong adventurer")
    .location("Zone1", "Room1")
    .build();
  textworld.zone("Zone1").build();
  textworld.room("Zone1", "Room1").description("This is room 1").build();
  const server = textworld.run_websocket_server(8080, player.id);
  const client = new WebSocket("ws://localhost:8080");
  client.onopen = (event) => {
    client.send(
      JSON.stringify({ player_id: "InvalidPlayer", command: "look" }),
    );
    client.send(JSON.stringify({ player_id: player.id, command: "look" }));
    assertNotEquals(event, null);
  };
  client.onmessage = (e) => {
    const response = JSON.parse(e.data).responseLines;
    assertNotEquals(response, null);
    assertGreater(response.length, 0);
    //["This is room 1"]
    //["Invalid player"]
  };
  await delay(2500);
  client.close();
  server.shutdown();
});
