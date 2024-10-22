/**
 * A Text Adventure Library & Game for Deno
 * Frank Hale &lt;frankhaledevelops AT gmail.com&gt;
 * 22 October 2024
 */

import * as tw from "../textworld.ts";

const textworld = new tw.TextWorld();

function create_the_forest_zone() {
  textworld.create_rooms("The Forest", [
    textworld.r(
      "Pool of Water",
      "You are standing in a pool of water. The water is clear and you can see the bottom. You can see a small fish swimming around. The water is about 3 feet deep. There is an electricity about this water that makes your skin buzz.",
    ),
    textworld.r(
      "Rock formation",
      "A peculiar rock formation stands before you.",
    ),
    textworld.r(
      "Open Field",
      "You are standing in an open field. All around you stands tall vibrant green grass. You can hear the sound of flowing water off in the distance which you suspect is a stream.",
    ),
    textworld.r("Test Room", "This is a test room."),
    textworld.r(
      "Stream",
      "A shallow rocky stream is swifty flowing from your west to east. The water looks approximately one foot deep from where you are standing.",
    ),
    textworld.r(
      "Large Rock",
      "You are standing beside a large rock. The rock looks out of place with respect to the rest of your surroundings.",
    ),
    textworld.r(
      "Old Forest",
      "Thick tall trees block your way but seem to have allowed the stream safe passage. It doesn't appear as though you can travel any further in this direction.",
    ),
    textworld.r(
      "Dark Passage",
      "Somehow you found a way to get into the forest. It's dark in here, the sound of the stream calms your nerves but you still feel a bit uneasy in here. The trunks of the trees stretch up into the heavens and the foliage above blocks most of the light.",
    ),
    textworld.r(
      "Hollow Tree",
      "You are standing inside a hollow tree. The tree is massive and the inside is hollowed out. You can see the sky above you through the opening in the tree.",
    ),
  ]);

  textworld.add_room_action("The Forest", "Pool of Water", (player) => {
    if (!textworld.is_actor_health_full(player)) {
      textworld.set_actor_health_to_max(player);
      return `Your health has been regenerated.`;
    }

    return `The healing waters have no effect on you.`;
  });

  textworld.set_room_as_zone_starter("The Forest", "Open Field");

  textworld.create_exits("The Forest", [
    textworld.e_from("Open Field", [
      textworld.e("north", "Stream"),
      textworld.e("east", "Test Room"),
      textworld.e("south", "Rock formation"),
    ]),
  ]);

  textworld.create_exit(
    "The Forest",
    "Rock formation",
    "west",
    "Pool of Water",
  );
  textworld.create_exit("The Forest", "Stream", "east", "Large Rock");
  textworld.create_exit(
    "The Forest",
    "Large Rock",
    "east",
    "Old Forest",
  );
  textworld.create_exit(
    "The Forest",
    "Old Forest",
    "east",
    "Dark Passage",
    true,
  );
  textworld.create_exit(
    "The Forest",
    "Dark Passage",
    "north",
    "Hollow Tree",
  );
}

function create_log_cabin_zone() {
  textworld.create_zone("Log Cabin");
  textworld.create_room(
    "Log Cabin",
    "Living Room",
    "You are standing inside the log cabin. The room is small but cozy. A fire is burning in the fireplace directly in front of you.",
    null,
  );
  textworld.set_room_as_zone_starter("Log Cabin", "Living Room");
}

function create_items() {
  textworld.create_item("Sword", "A sharp sword", false, false);
  textworld.create_item("Potion", "A potion", true, true);
  textworld.create_item("Key", "A key", true, true);
  textworld.create_item(
    "Gold coin purse",
    "A leather purse with gold coins",
    true,
    true,
    (player) => {
      player.gold += 10;
      return `You got 10 gold coins!`;
    },
  );
  textworld.create_item("Spam", "A can of spam", true, true, (player) => {
    textworld.add_to_actor_health(player, 50);
    return `You ate the spam and gained 50 health!`;
  });
}

function place_items() {
  textworld.place_items("The Forest", "Open Field", [
    { name: "Sword", quantity: 1 },
    { name: "Potion", quantity: 1 },
    { name: "Gold coin purse", quantity: 1 },
  ]);
  textworld.place_item("The Forest", "Stream", "Potion", 3);
  textworld.place_item("The Forest", "Hollow Tree", "Key");
}

function create_npcs() {
  textworld.create_npc("Charlotte", "A very sweet lady spider");
  textworld.create_dialog(
    "Charlotte",
    ["hello", "hi"],
    "Have you seen Wilbur? I've been looking around everywhere for him...",
  );
}

function place_npcs() {
  textworld.place_npc("The Forest", "Open Field", "Charlotte");
}

function create_mobs() {
  textworld.create_mob(
    "Goblin",
    "A small goblin",
    textworld.create_stats(
      { current: 5, max: 5 },
      { current: 5, max: 5 },
      { current: 5, max: 5 },
      1,
      1,
      1,
      1,
      0,
      { level: 1, xp: 0 },
    ),
    [{ name: "Gold coin purse", quantity: 1 }],
  );
}

function place_mobs() {
  textworld.place_mob("The Forest", "Open Field", "Goblin");
}

function create_spawn_locations() {
  textworld.create_spawn_location(
    "Gold purse spawner",
    "The Forest",
    "Test Room",
    5000,
    true,
    (spawn_location: tw.SpawnLocation) => {
      const item = textworld.get_room_item(
        spawn_location.zone,
        spawn_location.room,
        "Gold coin purse",
      );
      if (!item && textworld.get_random_number() > 80) {
        textworld.place_item(
          spawn_location.zone,
          spawn_location.room,
          "Gold coin purse",
          1,
        );
      }
    },
  );
  textworld.start_spawn_location("Gold purse spawner");
}

function create_question_sequence(player: tw.Player) {
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
      action: (player: tw.Player, session: tw.Session) => {
        const session_payload = session.payload as tw.QuestionSequence;
        const name = session_payload.questions.find((q) => q.id === "name")
          ?.answer;
        if (name) {
          player.name = name;
        }
      },
    },
  );
}

create_the_forest_zone();
create_log_cabin_zone();
create_items();
place_items();
create_npcs();
place_npcs();
create_mobs();
place_mobs();
create_spawn_locations();

// FIXME: This is temporary until full multiplayer is supported.
const player = textworld.create_player(
  "player",
  "You are a curious person who is looking for adventure.",
  "The Forest",
  "Open Field",
);

// Ask the player for their name.
create_question_sequence(player);

textworld.run_websocket_server(8080, player.id);
