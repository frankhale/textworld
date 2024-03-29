// A Text Adventure Library & Game for Deno
// Frank Hale &lt;frankhaledevelops AT gmail.com&gt;
// 21 November 2023

import * as tw from "./textworld.ts";

class TextworldGame {
  textworld = new tw.TextWorld();
  player = this.textworld.create_player(
    "player",
    "You are a curious person who is looking for adventure.",
    "The Forest",
    "Open Field"
  );

  constructor() {
    this.create_the_forest_zone();
    this.create_log_cabin_zone();
    this.create_items();
    this.place_items();
    this.create_npcs();
    this.place_npcs();
    this.create_mobs();
    this.place_mobs();
    this.create_spawn_locations();
  }

  create_the_forest_zone() {
    this.textworld.create_zone("The Forest");
    this.textworld.create_room(
      "The Forest",
      "Pool of Water",
      "You are standing in a pool of water. The water is clear and you can see the bottom. You can see a small fish swimming around. The water is about 3 feet deep. There is an electricity about this water that makes your skin buzz.",
      (player) => {
        if (player.stats.health.current != player.stats.health.max) {
          player.stats.health.current = player.stats.health.max;
          return `Your health has been regenerated.`;
        }

        return `The healing waters have no effect on you.`;
      }
    );
    this.textworld.create_room(
      "The Forest",
      "Rock formation",
      "A peculiar rock formation stands before you."
    );
    this.textworld.create_room(
      "The Forest",
      "Open Field",
      "You are standing in an open field. All around you stands tall vibrant green grass. You can hear the sound of flowing water off in the distance which you suspect is a stream."
    );
    this.textworld.create_room(
      "The Forest",
      "Test Room",
      "This is a test room."
    );
    this.textworld.create_room(
      "The Forest",
      "Stream",
      "A shallow rocky stream is swifty flowing from your west to east. The water looks approximately one foot deep from where you are standing."
    );
    this.textworld.create_room(
      "The Forest",
      "Large Rock",
      "You are standing beside a large rock. The rock looks out of place with respect to the rest of your surroundings."
    );
    this.textworld.create_room(
      "The Forest",
      "Old Forest",
      "Thick tall trees block your way but seem to have allowed the stream safe passage. It doesn't appear as though you can travel any further in this direction."
    );
    this.textworld.create_room(
      "The Forest",
      "Dark Passage",
      "Somehow you found a way to get into the forest. It's dark in here, the sound of the stream calms your nerves but you still feel a bit uneasy in here. The trunks of the trees stretch up into the heavens and the foliage above blocks most of the light."
    );
    this.textworld.create_room(
      "The Forest",
      "Hollow Tree",
      "You stepped into a large hollow tree. It's damp in here."
    );

    this.textworld.set_room_as_zone_starter("The Forest", "Open Field");

    this.textworld.create_exit("The Forest", "Open Field", "north", "Stream");
    this.textworld.create_exit("The Forest", "Open Field", "east", "Test Room");
    this.textworld.create_exit(
      "The Forest",
      "Open Field",
      "south",
      "Rock formation"
    );
    this.textworld.create_exit(
      "The Forest",
      "Rock formation",
      "west",
      "Pool of Water"
    );
    this.textworld.create_exit("The Forest", "Stream", "east", "Large Rock");
    this.textworld.create_exit(
      "The Forest",
      "Large Rock",
      "east",
      "Old Forest"
    );
    this.textworld.create_exit(
      "The Forest",
      "Old Forest",
      "east",
      "Dark Passage",
      true
    );
    this.textworld.create_exit(
      "The Forest",
      "Dark Passage",
      "north",
      "Hollow Tree"
    );
  }

  create_log_cabin_zone() {
    this.textworld.create_zone("Log Cabin");
    this.textworld.create_room(
      "Log Cabin",
      "Living Room",
      "You are standing inside the log cabin. The room is small but cozy. A fire is burning in the fireplace directly in front of you.",
      null
    );
    this.textworld.set_room_as_zone_starter("Log Cabin", "Living Room");
  }

  create_items() {
    this.textworld.create_item("Sword", "A sharp sword", false);
    this.textworld.create_item("Potion", "A potion", true);
    this.textworld.create_item("Key", "A key", true);
    this.textworld.create_item(
      "Gold coin purse",
      "A leather purse with gold coins",
      true,
      (player) => {
        player.gold += 10;
        return `You got 10 gold coins!`;
      }
    );
    this.textworld.create_item("Spam", "A can of spam", true, (player) => {
      player.stats.health.current += 50;
      if (player.stats.health.max >= player.stats.health.current) {
        player.stats.health.current = player.stats.health.max;
      }
      return `You ate the spam and gained 50 health!`;
    });
  }

  place_items() {
    this.textworld.place_item("The Forest", "Open Field", "Sword");
    this.textworld.place_item("The Forest", "Open Field", "Potion");
    this.textworld.place_item("The Forest", "Stream", "Potion", 3);
    this.textworld.place_item("The Forest", "Hollow Tree", "Key");
  }

  create_npcs() {
    this.textworld.create_npc("Charlotte", "A very sweet lady spider");
    this.textworld.create_dialog(
      "Charlotte",
      ["hello", "hi"],
      "Have you seen Wilbur? I've been looking around everywhere for him...",
      null
    );
  }

  place_npcs() {
    this.textworld.place_npc("The Forest", "Open Field", "Charlotte");
  }

  create_mobs() {
    this.textworld.create_mob(
      "Goblin",
      "A small goblin",
      this.textworld.create_resources(5, 5, 5, 5, 5, 5),
      this.textworld.create_damage_and_defense(1, 1, 1, 1, 0),
      [{ name: "Gold coin purse", quantity: 1 }]
    );
  }

  place_mobs() {
    this.textworld.place_mob("The Forest", "Open Field", "Goblin");
  }

  create_spawn_locations() {
    this.textworld.create_spawn_location(
      "Gold purse spawner",
      "The Forest",
      "Test Room",
      5000,
      true,
      (spawn_location: tw.SpawnLocation) => {
        const item = this.textworld.get_room_item(
          spawn_location.zone,
          spawn_location.room,
          "Gold coin purse"
        );
        if (!item && this.textworld.get_random_number() > 80) {
          this.textworld.place_item(
            spawn_location.zone,
            spawn_location.room,
            "Gold coin purse",
            1
          );
        }
      }
    );
    this.textworld.spawn_location_start("Gold purse spawner");
  }

  async run_web_game_loop(port: number) {
    const server = Deno.listen({ port });

    const get_response = async (input = "") => {
      let response = "";

      if (input.length <= 0) {
        response = this.textworld.switch_room(this.player);
      } else {
        response = await this.textworld.parse_command(this.player, input);
      }

      return {
        id: crypto.randomUUID(),
        input,
        player: this.player,
        response,
        responseLines: response.split("\n"),
        map: this.textworld.plot_room_map(this.player, 5),
      };
    };

    for await (const conn of server) {
      const httpConn = Deno.serveHttp(conn);
      const e = await httpConn.nextRequest();
      if (e) {
        const { socket, response } = Deno.upgradeWebSocket(e.request);
        socket.onopen = async () => {
          socket.send(JSON.stringify(await get_response()));
        };
        socket.onmessage = async (e) => {
          socket.send(JSON.stringify(await get_response(e.data)));
          if (e.data === "quit") {
            console.log("Shutting down server...");
            socket.close();
            server.close();
          }
        };
        e.respondWith(response);
      }
    }
  }
}

const game = new TextworldGame();
await game.run_web_game_loop(8080);
