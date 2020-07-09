// This is just a sandbox for experimentation right now. All the previous code
// is commented out and I am experimenting with creating an ECS.
//
// 9 July 2020

import { v4 } from "https://deno.land/std/uuid/mod.ts";

interface Component {
  name: string;
  props: Record<string, any>;
}

interface Entity {
  id: string;
  name: string;
  components: Component[];
}

function createEntity(name: string, components: Component[]): Entity {
  return {
    id: v4.generate(),
    name,
    components,
  };
}

function getEntity(entities: Entity[], entityName: string) {
  return entities.find(x => x.name === entityName);
}

function createComponent(name: string, props: Record<string, any>): Component {
  return {
    name,
    props,
  };
}

function getComponent(entity: Entity, componentName: string) {
  return entity.components.find((x) => x.name == componentName);
}

function removeComponent(entity: Entity, componentName: string) {
  return entity.components.filter((x) => {
    if (!x.props.hasKey(componentName)) {
      return x;
    }
  });
}

let playing = true,
  motd = "Welcome to this wonderful non-game!\r\n",
  commandsEntity = createEntity("commands", []),
  roomEntities: Entity[] = [
    createEntity("Open Field", [
      createComponent(
        "description",
        {
          value:
            "You are standing in an open field with green grass that stretches for as far as your eyes can see or so you think, you can hear running water to your north.",
        },
      ),
    ]),
    createEntity("Stream", [
      createComponent(
        "description",
        {
          value:
            "A small stream runs from your east to west, the water looks shallow. You can see fish swimming.",
        },
      ),
    ]),
  ],
  playerEntity = createEntity("player", [
    createComponent("name", { value: "Hero" }),
    createComponent("level", { value: 1 }),
    createComponent("experience", { value: 0 }),
    createComponent("health", { value: 50 }),
    createComponent("gold", { value: 100 }),
    createComponent("room", { value: "Open Field" }),
    createComponent("inventory", {
      value: [
        "wooden sword",
      ],
    }),
  ]),
  gameLoop = window.setInterval(() => {
    // do some game world stuff here...
  }, 1000);

enum Direction {
  north = "north",
  south = "south",
  east = "east",
  west = "west",
}

function processCommandSystem(commandsEntity: Entity) {
  let returnComponents: Component[] = [];

  commandsEntity.components.forEach((x) => {
    if (x.props["name"] == "quit") {
      console.log("Goodbye...");
      playing = false;
      clearInterval(gameLoop);
    } else {
      returnComponents.push(x);
    }
  });

  commandsEntity = createEntity("commands", returnComponents);
}

function processMovementSystem(commmandsEntity: Entity, roomEntities: Entity[], playerEntity: Entity) {
  let returnComponents: Component[] = [],
      currentRoomComponent = getComponent(playerEntity, "room"),
      currentRoomEntity = getEntity(roomEntities, currentRoomComponent?.props.value);

  // still in the process of writing this...

  commandsEntity.components.forEach((x) => {    
    if (x.props["name"] == Direction.north) {}
    else if (x.props["name"] == Direction.south) {}
    else if (x.props["name"] == Direction.east) {}
    else if (x.props["name"] == Direction.west) {} 
    else {
      returnComponents.push(x);
    }
  });
  
  commmandsEntity = createEntity("commands", returnComponents);
}

async function commandPrompt(prompt: string, commands: Entity) {
  // https://www.danvega.dev/blog/2020/06/03/deno-stdin-stdout/
  const buf = new Uint8Array(1024);
  await Deno.stdout.write(new TextEncoder().encode(prompt));
  const n = <number> await Deno.stdin.read(buf);
  let fullCommand = new TextDecoder().decode(buf.subarray(0, n)).trim();

  if (fullCommand !== "") {
    let commandParts = fullCommand.split(" "),
      command = commandParts[0].toLowerCase(),
      args: string[] = [];

    if (commandParts.length > 1) {
      args = commandParts.slice(1).map((x) => x.toLowerCase());
    }

    return createComponent("command", {
      name: command,
      args,
    });
  } else {
    return createComponent("empty command", {});
  }
}

console.log(motd);

while (playing) {
  commandsEntity.components.push(await commandPrompt("> ", commandsEntity));

  if (commandsEntity.components.length > 0) {
    processCommandSystem(commandsEntity);
    processMovementSystem(commandsEntity, roomEntities, playerEntity);
  }
}

// OLD CODE BELOW

// interface Exit {
//   name: string;
//   direction: Direction;
// }

// interface Command {
//   names: string[];
//   action: (command: string, args: string[]) => void;
// }

//   commands: Command[] = setCommands(),
//   rooms: Room[] = [
//     {
//       name: "Open Field",
//       description:
//         "You are standing in an open field with green grass that stretches for as far as your eyes can see or so you think, you can hear running water to your north.",
//       items: ["piece of bread"],
//       exits: [
//         {
//           direction: Direction.north,
//           name: "Stream",
//         },
//       ],
//     },
//     {
//       name: "Stream",
//       description:
//         "A small stream runs from your east to west, the water looks shallow. You can see fish swimming.",
//       items: [],
//       exits: [
//         {
//           direction: Direction.south,
//           name: "Open Field",
//         },
//       ],
//     },
//   ] as Room[],
//   player = {
//     name: "Hero",
//     level: 1,
//     experience: 0,
//     gold: 100,
//     inventory: [
//       "wooden sword",
//     ],
//     room: "Open Field",
//   } as Player;

// function processCommand(command: string) {
//   if (command === "") return;

//   let commandParts = command.split(" "),
//     _command = commandParts[0],
//     _args: string[] = [];

//   if (commandParts.length > 1) {
//     _args = commandParts.slice(1);
//   }

//   let result = commands.find((x) => x.names.find((y) => y === _command));

//   if (result) {
//     result.action(_command, _args);
//   } else {
//     console.log("I don't understand");
//   }
// }

// if (command.toLowerCase() === "quit") {
//   playing = false;
//   clearInterval(gameLoop);
// }

//console.log(rooms.find((x) => x.name === player.room)?.description);

// interface Player {
//   name: string;
//   level: number;
//   experience: number;
//   gold: number;
//   inventory: string[];
//   room: string;
// }

// interface Room {
//   name: string;
//   description: string;
//   items: string[] | null;
//   exits: Exit[];
// }

// function setCommands(): Command[] {
//   return [
//     {
//       names: ["quit"],
//       action: (command: string, args: string[]) => {
//         playing = false;
//         clearInterval(gameLoop);
//       },
//     },
//     {
//       names: ["inv", "inventory"],
//       action: (command: string, args: string[]) => {
//         console.log(player.inventory);
//       },
//     },
//     {
//       names: ["look"],
//       action: (command: string, args: string[]) => {
//         if (args.find((x) => x === "self")) {
//           console.log(
//             {
//               name: player.name,
//               level: player.level,
//               gold: player.gold,
//               inventory: player.inventory,
//             },
//           );
//         } else if(args.length === 0) {
//           let currentRoom = rooms.find((x) => x.name === player.room);
//           if(currentRoom) {
//             console.log(currentRoom.items);
//           }
//         }
//       },
//     },
//     {
//       names: [Direction.north, Direction.south, Direction.east, Direction.west],
//       action: (command: string, args: string[]) => {
//         let currentRoom = rooms.find((x) => x.name === player.room);
//         let exit = currentRoom?.exits.find((y) => y.direction === command);
//         let gotoRoom = rooms.find((z) => z.name === exit?.name);
//         if (gotoRoom) {
//           player.room = gotoRoom.name;
//           console.log(gotoRoom.description);
//         } else {
//           console.log("You can't go in that direction");
//         }
//       },
//     }
//   ];
// }
