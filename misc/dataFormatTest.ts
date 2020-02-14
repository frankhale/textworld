import * as _ from "lodash";

// So in this example the data format is very clean and getting very close if
// not to where I really want it. My ultimate goal is to have a very simple data
// format that makes it trivial to update items/descriptions/etc...
//
// Details are packed into a string and separated by a colon. Id's are added by
// the various create* functions and packed arrays are position sensitive. For
// instance the exits array defines the positions North, South, East, West for
// the corresponding 0, 1, 2, 3 index positions in the array. The same thing
// will be true for the item traits array, however, the actual trait meanings
// have not been decided on.

type Room = {
  id: number;
  name: string;
  exits: number[];
  desc: string;
};

type Item = {
  id: number;
  name: string;
  vendorBuy: number;
  vendorSell: number;
  traits: number[];
  desc: string;
};

const roomDescriptions: string[] = [
  // Name : N S E W : Description
  "Room 1 : 0 2 0 0 : This is room 1",
  "Room 2 : 1 0 3 0 : This is room 2",
  "Room 3 : 4 0 0 2 : This is room 3",
  "Room 4 : 5 3 0 0 : This is room 4",
  "Room 5 : 0 4 0 0 : This is room 5",
  "Room 6 : 0 0 0 0 : This is room 6 and there is no way to get inside it because it has no exits and no other rooms lead to it as well."
];

const itemDescriptions: string[] = [
  // Name : Vendor Price : Traits (undetermined) : Description
  "Wooden Short Sword : 10 : 5  : 0 0 0 0 : A rickety old short wooden sword",
  "Steel Dagger       : 15 : 10 : 0 0 0 0 : An ordinary nice looking steel dagger",
  "Silver Ring        : 25 : 20 : 0 0 0 0 : A silver ring that has no magical properties"
];

function createRooms(roomDescs: string[]): Room[] {
  let idCounter = 1;
  let rooms: Room[] = _.map(roomDescriptions, r => {
    let roomDescSplit = r.split(":");

    return {
      id: idCounter++,
      name: roomDescSplit[0].trim(),
      desc: roomDescSplit[2].trim(),
      exits: _.map(roomDescSplit[1].trim().split(" "), es => {
        return Number(es);
      })
    };
  });

  return rooms;
}

function createItems(itemDescs: string[]): Item[] {
  let idCounter = 1;
  let items: Item[] = _.map(itemDescriptions, i => {
    let itemDescSplit = i.split(":");

    return {
      id: idCounter++,
      name: itemDescSplit[0].trim(),
      vendorBuy: Number(itemDescSplit[1]),
      vendorSell: Number(itemDescSplit[2]),
      traits: _.map(itemDescSplit[3].trim().split(" "), t => {
        return Number(t);
      }),
      desc: itemDescSplit[4].trim()
    };
  });

  return items;
}

//let rooms = createRooms(roomDescriptions),
let items = createItems(itemDescriptions);

// _.forEach(rooms, r => {
//   console.log(r);
// });

_.forEach(items, i => {
  console.log(i);
});
