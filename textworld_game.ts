// A Text Adventure Library & Game for Deno
// Frank Hale <frankhale@gmail.com
// 20 August 2023

import * as tw from "./textworld.ts";

const textworld = new tw.TextWorld();

function create_the_forest_zone() {
  textworld.create_zone("The Forest");
  textworld.create_room(
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
  textworld.create_room(
    "The Forest",
    "Rock formation",
    "A peculiar rock formation stands before you."
  );
  textworld.create_room(
    "The Forest",
    "Open Field",
    "You are standing in an open field. All around you stands tall vibrant green grass. You can hear the sound of flowing water off in the distance which you suspect is a stream."
  );
  textworld.create_room(
    "The Forest",
    "Stream",
    "A shallow rocky stream is swifty flowing from your west to east. The water looks approximately one foot deep from where you are standing."
  );
  textworld.create_room(
    "The Forest",
    "Large Rock",
    "You are standing beside a large rock. The rock looks out of place with respect to the rest of your surroundings."
  );
  textworld.create_room(
    "The Forest",
    "Old Forest",
    "Thick tall trees block your way but seem to have allowed the stream safe passage. It doesn't appear as though you can travel any further in this direction."
  );
  textworld.create_room(
    "The Forest",
    "Dark Passage",
    "Somehow you found a way to get into the forest. It's dark in here, the sound of the stream calms your nerves but you still feel a bit uneasy in here. The trunks of the trees stretch up into the heavens and the foliage above blocks most of the light."
  );
  textworld.create_room(
    "The Forest",
    "Hollow Tree",
    "You stepped into a large hollow tree. It's damp in here."
  );

  textworld.set_room_as_zone_starter("The Forest", "Open Field");

  textworld.create_exit("The Forest", "Open Field", "north", "Stream");
  textworld.create_exit("The Forest", "Open Field", "south", "Rock formation");
  textworld.create_exit(
    "The Forest",
    "Rock formation",
    "west",
    "Pool of Water"
  );
  textworld.create_exit("The Forest", "Stream", "east", "Large Rock");
  textworld.create_exit("The Forest", "Large Rock", "east", "Old Forest");
  textworld.create_exit(
    "The Forest",
    "Old Forest",
    "east",
    "Dark Passage",
    true
  );
  textworld.create_exit("The Forest", "Dark Passage", "north", "Hollow Tree");
}

function create_items() {
  textworld.create_item("Sword", "A sharp sword", false);
  textworld.create_item("Potion", "A potion", true);
  textworld.create_item("Key", "A key", true);
}

function place_items() {
  textworld.place_item("The Forest", "Open Field", "Sword");
  textworld.place_item("The Forest", "Open Field", "Potion");
  textworld.place_item("The Forest", "Stream", "Potion", 3);
  textworld.place_item("The Forest", "Hollow Tree", "Key");
}

function create_npcs() {
  textworld.create_npc("Charlotte", "A very sweet lady spider", [
    {
      trigger: ["hello", "hi"],
      response:
        "Have you seen Wilbur? I've been looking around everywhere for him...",
      action: null,
    },
  ]);
}

function place_npcs() {
  textworld.place_npc("The Forest", "Open Field", "Charlotte");
}

create_the_forest_zone();
create_items();
place_items();
create_npcs();
place_npcs();

textworld.create_mob(
  "Goblin",
  "A small goblin",
  textworld.create_resources(5, 5, 5, 5, 5, 5),
  textworld.create_damage_and_defense(1, 1, 1, 1, 0),
  []
);
textworld.place_mob("The Forest", "Open Field", "Goblin");

const player = textworld.create_player(
  "player",
  "You are a curious person who is looking for adventure.",
  "The Forest",
  "Open Field"
);

console.log(textworld.get_room_description(player));

let game_running = true;
while (game_running) {
  const input = prompt(
    `${player.stats.health.current}/${player.stats.health.max}:${player.gold}>`
  );
  if (input !== null) {
    console.log(`command: ${input}\n`);
    const result = textworld.parse_command(player, input);
    console.log(result);
    if (result === "You quit the game.") {
      game_running = false;
    }
  }
}

// const server = Deno.listen({ port: 8080 });
// for await (const conn of server) {
//   const httpConn = Deno.serveHttp(conn);
//   const e = await httpConn.nextRequest();
//   if (e) {
//     const { socket, response } = Deno.upgradeWebSocket(e.request);
//     socket.onopen = () => {
//       socket.send("Connected to game server...");
//     };
//     socket.onmessage = (e) => {
//       console.log(`player: ${e.data}`);
//       const result = tw.parse_command(player, rooms, items, npcs, e.data);
//       console.log(`game: ${result}`);
//       socket.send(result);
//       if (result === "You quit the game.") {
//         socket.close();
//       }
//     };
//     //socket.onclose = () => console.log("WebSocket has been closed.");
//     socket.onerror = (e) => console.error("WebSocket error:", e);
//     e.respondWith(response);
//   }
// }

//// @deno-types="npm:@types/lodash"
// import _ from "npm:lodash@4.17.21";

// const foo = {
//   name: "foo",
//   action: () => {
//     console.log("Hello, World!");
//   }
// }

// const baz = _.cloneDeep(foo);
// baz.action();
