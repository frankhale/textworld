// This is just a couple hours of playing around, my end game is a multiplayer
// game, not this. LOL!
//
// Something more realistic would be to create a websocket server here and then
// create a simple web UI to go with it and then do what I'm doing here but
// in a multiplayer context...
//
// 7 July 2020

// import { v4 } from "https://deno.land/std/uuid/mod.ts";

interface Command {
  names: string[];
  action: (command: string, args: string[]) => void;
}

interface Player {
  name: string;
  level: number;
  experience: number;
  gold: number;
  inventory: string[];
  room: string;
}

enum Direction {
  north = "north",
  south = "south",
  east = "east",
  west = "west",
}

interface Exit {
  name: string;
  direction: Direction;
}

interface Room {
  name: string;
  description: string;
  items: string[] | null;
  exits: Exit[];
}

async function commandPrompt(prompt: string) {
  // https://www.danvega.dev/blog/2020/06/03/deno-stdin-stdout/
  const buf = new Uint8Array(1024);
  await Deno.stdout.write(new TextEncoder().encode(prompt));
  const n = <number> await Deno.stdin.read(buf);
  return new TextDecoder().decode(buf.subarray(0, n)).trim();
}

function setCommands(): Command[] {
  return [
    {
      names: ["quit"],
      action: (command: string, args: string[]) => {
        playing = false;
        clearInterval(gameLoop);
      },
    },
    {
      names: ["inv", "inventory"],
      action: (command: string, args: string[]) => {
        console.log(player.inventory);
      },
    },
    {
      names: ["look"],
      action: (command: string, args: string[]) => {
        if (args.find((x) => x === "self")) {
          console.log(
            {
              name: player.name,
              level: player.level,
              gold: player.gold,
              inventory: player.inventory,
            },
          );
        } else if(args.length === 0) {
          let currentRoom = rooms.find((x) => x.name === player.room);
          if(currentRoom) {
            console.log(currentRoom.items);
          }
        }
      },
    },
    {
      names: ["north", "south", "east", "west"],
      action: (command: string, args: string[]) => {
        let currentRoom = rooms.find((x) => x.name === player.room);        
        let exit = currentRoom?.exits.find((y) => y.direction === command);          
        let gotoRoom = rooms.find((z) => z.name === exit?.name);
        if (gotoRoom) {
          player.room = gotoRoom.name;
          console.log(gotoRoom.description);
        }               
      },
    },
  ];
}

let playing = true,
  motd = "Welcome to this wonderful non-game!\r\n",
  commands: Command[] = setCommands(),
  rooms: Room[] = [
    {
      name: "Open Field",
      description:
        "You are standing in an open field with green grass that stretches for as far as your eyes can see or so you think, you can hear running water to your north.",
      items: ["piece of bread"],
      exits: [
        {
          direction: Direction.north,
          name: "Stream",
        },
      ],
    },
    {
      name: "Stream",
      description:
        "A small stream runs from your east to west, the water looks shallow. You can see fish swimming.",
      items: [],
      exits: [
        {
          direction: Direction.south,
          name: "Open Field",
        },
      ],
    },
  ] as Room[],
  player = {
    name: "Hero",
    level: 1,
    experience: 0,
    gold: 100,
    inventory: [
      "wooden sword",
    ],
    room: "Open Field",
  } as Player;

let gameLoop = window.setInterval(() => {
  // do some game world stuff here...
}, 1000);

function processCommand(command: string) {
  if (command === "") return;

  let commandParts = command.split(" "),
    _command = commandParts[0],
    _args: string[] = [];

  if (commandParts.length > 1) {
    _args = commandParts.slice(1);
  }

  let result = commands.find((x) => x.names.find((y) => y === _command));

  if (result) {
    result.action(_command, _args);
  }
}

console.log(motd);
console.log(rooms.find((x) => x.name === player.room)?.description);

while (playing) {
  const command = await commandPrompt("> ");

  processCommand(command);
}
