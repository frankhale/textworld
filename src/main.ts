interface Command {
  names: string[];
  action: (args: string[]) => void;
}

interface Player {
  name: string;
  level: number;
  experience: number;
  gold: number;
  inventory: string[];
}

enum Direction {
  North,
  South,
  East,
  West,
}

interface Exit {
  id: string;
  direction: Direction;
}

interface Room {
  id: string;
  name: string;
  description: string;
  items: string[];
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
      action: (args: string[]) => {
        playing = false;
        clearInterval(gameLoop);
      },
    },
    {
      names: ["inv", "inventory"],
      action: (args: string[]) => {
        console.log(player.inventory);
      },
    },
    {
      names: ["look"],
      action: (args: string[]) => {
        if (args.find((x) => x === "self")) {
          console.log(
            {
              name: player.name, 
              level: player.level, 
              gold: player.gold,
              inventory: player.inventory
            }
          );
        }
      },
    },
  ];
}

let playing = true,
  motd = "Welcome to this wonderful non-game!\r\n",
  commands: Command[] = setCommands(),
  rooms: Room[],
  player = {
    name: "Hero",
    level: 1,
    experience: 0,
    gold: 100,
    inventory: [
      "wooden sword",
    ],
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
    result.action(_args);
  }
}

console.log(motd);

while (playing) {
  const command = await commandPrompt("> ");

  processCommand(command);
}
