// A Text Adventure Library for Deno
// Frank Hale &lt;frankhaledevelops AT gmail.com&gt;
// 31 January 2026

import * as tw from "../textworld.ts";

const textworld = new tw.TextWorld();

textworld.zone("The Forest").build();

textworld
  .room("The Forest", "Pool of Water")
  .description(
    "You are standing in a pool of water. The water is clear and you can see the bottom. You can see a small fish swimming around. The water is about 3 feet deep. There is an electricity about this water that makes your skin buzz.",
  )
  .onEnter((player) => {
    if (!textworld.is_actor_health_full(player)) {
      textworld.set_actor_health_to_max(player);
      return `Your health has been regenerated.`;
    }
    return `The healing waters have no effect on you.`;
  })
  .build();

textworld
  .room("The Forest", "Rock formation")
  .description("A peculiar rock formation stands before you.")
  .exit("west", "Pool of Water")
  .build();

textworld
  .room("The Forest", "Open Field")
  .description(
    "You are standing in an open field. All around you stands tall vibrant green grass. You can hear the sound of flowing water off in the distance which you suspect is a stream.",
  )
  .item("Sword", 1)
  .item("Potion", 1)
  .item("Gold coin purse", 1)
  .exit("north", "Stream")
  .exit("east", "Test Room")
  .exit("south", "Rock formation")
  .npc("Charlotte")
  .mob("Goblin")
  .asZoneStarter()
  .build();

textworld
  .room("The Forest", "Test Room")
  .description("This is a test room.")
  .spawnLocation(
    "Gold purse spawner",
    5000,
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
  )
  .build();

textworld
  .room("The Forest", "Stream")
  .description(
    "A shallow rocky stream is swifty flowing from your west to east. The water looks approximately one foot deep from where you are standing.",
  )
  .item("Potion", 3)
  .exit("east", "Large Rock")
  .build();

textworld
  .room("The Forest", "Large Rock")
  .description(
    "You are standing beside a large rock. The rock looks out of place with respect to the rest of your surroundings.",
  )
  .exit("east", "Old Forest")
  .build();

textworld
  .room("The Forest", "Old Forest")
  .description(
    "Thick tall trees block your way but seem to have allowed the stream safe passage. It doesn't appear as though you can travel any further in this direction.",
  )
  .exit("east", "Dark Passage", { hidden: true })
  .build();

textworld
  .room("The Forest", "Dark Passage")
  .description(
    "Somehow you found a way to get into the forest. It's dark in here, the sound of the stream calms your nerves but you still feel a bit uneasy in here. The trunks of the trees stretch up into the heavens and the foliage above blocks most of the light.",
  )
  .exit("north", "Hollow Tree")
  .build();

textworld
  .room("The Forest", "Hollow Tree")
  .description(
    "You are standing inside a hollow tree. The tree is massive and the inside is hollowed out. You can see the sky above you through the opening in the tree.",
  )
  .item("Key", 1)
  .build();

textworld.zone("Log Cabin").build();

textworld
  .room("Log Cabin", "Living Room")
  .description(
    "You are standing inside the log cabin. The room is small but cozy. A fire is burning in the fireplace directly in front of you.",
  )
  .asZoneStarter()
  .build();

textworld.item("Sword").description("A sharp sword").build();

textworld.item("Potion").description("A potion").usable().consumable()
  .build();

textworld.item("Key").description("A key").usable().consumable().build();

textworld
  .item("Gold coin purse")
  .description("A leather purse with gold coins")
  .usable()
  .consumable()
  .onUse((player) => {
    player.gold += 10;
    return `You got 10 gold coins!`;
  })
  .build();

textworld
  .item("Spam")
  .description("A can of spam")
  .usable()
  .consumable()
  .onUse((player) => {
    textworld.add_to_actor_health(player, 50);
    return `You ate the spam and gained 50 health!`;
  })
  .build();

textworld
  .npc("Charlotte")
  .description("A very sweet lady spider")
  .dialog(
    ["hello", "hi"],
    "Have you seen Wilbur? I've been looking around everywhere for him...",
  )
  .build();

textworld
  .mob("Goblin")
  .description("A small goblin")
  .health(5, 5)
  .stamina(5, 5)
  .magicka(5, 5)
  .physicalDamage(1)
  .physicalDefense(1)
  .spellDamage(1)
  .spellDefense(1)
  .criticalChance(0)
  .level(1)
  .drop("Gold coin purse", 1)
  .build();

// FIXME: This is temporary until full multiplayer is supported.
const player = textworld
  .player("player")
  .description("You are a curious person who is looking for adventure.")
  .location("The Forest", "Open Field")
  .questionSequence("player_questions")
  .question("name", "What is your name?")
  .onQuestionSequenceComplete((player, session) => {
    const payload = session.payload as tw.QuestionSequence;
    const name = payload.questions.find((q) => q.id === "name")?.answer;
    if (name) {
      player.name = name;
    }
  })
  .build();

textworld.run_websocket_server(8080, player.id);
