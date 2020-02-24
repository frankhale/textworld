import _ from "lodash";

enum Zone {
  Lumania,
  Sazavan
}

enum Direction {
  North,
  NorthEast,
  NorthWest,
  South,
  SouthEast,
  SouthWest,
  East,
  West,
  Up,
  Down
}

type Item = {
  name: string;
};

type Exit = {
  roomId: string;
  direction: Direction;
};

type Room = {
  id: string;
  zone: Zone;
  name: string;
  description: string;
  items: Item[];
  exits: Exit[];
};

type Mob = {
  type: string;
  level: number;
  loot: Item[];
};

type Player = {
  name: string;
  level: number;
  experience: number;
  gold: number;
  inventory: string[];
  zone: Zone;
  location: string;
};

function createRoom(
  zone: Zone,
  name: string,
  description: string,
  ...exits: Exit[]
): Room {
  let _exits = [] as Exit[],
    items = [] as Item[];

  for (var i = 0; i < exits.length; i++) {
    _exits.push(exits[i]);
  }

  return {
    id: _.uniqueId(`${zone}_`),
    zone,
    name,
    description,
    items,
    exits
  } as Room;
}

function createExit(roomId: string, direction: Direction) {
  return {
    roomId,
    direction
  };
}

function addItemsToRoom(zone: Zone, roomId: string, ...items: Item[]) {
  // TODO
}

function switchRoom(player: Player, zone: Zone, roomId: string) {
  if (player) {
    player.zone = zone;
    player.location = `${zone}_${roomId}`;
  }
}

let player: Player = {
  name: "Zavin",
  level: 1,
  experience: 0,
  gold: 500,
  inventory: [],
  zone: Zone.Lumania,
  location: "1"
};

let rooms: Room[] = [] as Room[];
let roomData: string[] = [
  "Lumania|Open Field|You are in an open field. You are standing on soft green grass that stretches in all directions. There is a dirt road to the north.",
  "Lumania|Dirt Road|You are standing on a dirt road that runs to the east and west. The road is well worn."
];

_.forEach(roomData, (rd, i) => {
  let d = rd.split("|");

  let zone;

  switch (d[0]) {
    case "Lumania":
      zone = Zone.Lumania;
    case "Sazavan":
      zone = Zone.Sazavan;
    default:
      zone = Zone.Lumania;
  }

  if (d.length === 3) {
    rooms.push(createRoom(zone, d[1], d[2]));
  }
});

// console.log(rooms);
// console.log(`Hello, World!`);
console.log(Zone.Lumania.toString());
