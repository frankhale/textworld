// A Text Adventure Library & Game for Deno
// Frank Hale &lt;frankhaledevelops AT gmail.com&gt;
// 28 September 2024

import * as tw from "./textworld.ts";

const textworld = new tw.TextWorld();

function create_the_forest_zone() {
  textworld.create_zone("The Forest");
  textworld.create_room(
    "The Forest",
    "Pool of Water",
    "You are standing in a pool of water. The water is clear and you can see the bottom. You can see a small fish swimming around. The water is about 3 feet deep. There is an electricity about this water that makes your skin buzz.",
    (player) => {
      if (!textworld.is_actor_health_full(player)) {
        textworld.set_actor_health_to_max(player);
        return `Your health has been regenerated.`;
      }

      return `The healing waters have no effect on you.`;
    },
  );
  textworld.create_room(
    "The Forest",
    "Rock formation",
    "A peculiar rock formation stands before you.",
  );
  textworld.create_room(
    "The Forest",
    "Open Field",
    "You are standing in an open field. All around you stands tall vibrant green grass. You can hear the sound of flowing water off in the distance which you suspect is a stream.",
  );
  textworld.create_room(
    "The Forest",
    "Test Room",
    "This is a test room.",
  );
  textworld.create_room(
    "The Forest",
    "Stream",
    "A shallow rocky stream is swifty flowing from your west to east. The water looks approximately one foot deep from where you are standing.",
  );
  textworld.create_room(
    "The Forest",
    "Large Rock",
    "You are standing beside a large rock. The rock looks out of place with respect to the rest of your surroundings.",
  );
  textworld.create_room(
    "The Forest",
    "Old Forest",
    "Thick tall trees block your way but seem to have allowed the stream safe passage. It doesn't appear as though you can travel any further in this direction.",
  );
  textworld.create_room(
    "The Forest",
    "Dark Passage",
    "Somehow you found a way to get into the forest. It's dark in here, the sound of the stream calms your nerves but you still feel a bit uneasy in here. The trunks of the trees stretch up into the heavens and the foliage above blocks most of the light.",
  );
  textworld.create_room(
    "The Forest",
    "Hollow Tree",
    "You stepped into a large hollow tree. It's damp in here.",
  );

  textworld.set_room_as_zone_starter("The Forest", "Open Field");

  textworld.create_exit("The Forest", "Open Field", "north", "Stream");
  textworld.create_exit("The Forest", "Open Field", "east", "Test Room");
  textworld.create_exit(
    "The Forest",
    "Open Field",
    "south",
    "Rock formation",
  );
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
  textworld.place_item("The Forest", "Open Field", "Gold coin purse");
  textworld.place_item("The Forest", "Open Field", "Sword");
  textworld.place_item("The Forest", "Open Field", "Potion");
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
// THIS IS TEST CODE:
//
// const question_sequence: tw.QuestionSequence = {
//   name: "player_name_and_age",
//   questions: [
//     {
//       id: "name",
//       data_type: "String",
//       question: "What is your name?",
//     },
//     {
//       id: "age",
//       data_type: "Number",
//       question: "How old are you?",
//     },
//     {
//       id: "adventure",
//       data_type: "Boolean",
//       question: "Are you ready for an adventure?",
//     },
//   ],
// };
// textworld.add_session(
//   player,
//   "QuestionSequence",
//   question_sequence,
//   {
//     name: "player_questions",
//     action: (_player: tw.Player) => {},
//   },
// );
textworld.run_websocket_server(8080, player.id);
