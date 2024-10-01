# TextWorld

A text based role playing game engine written in TypeScript for Deno with an
Angular frontend and tiny sample game. This is still a work in progress but
there is a lot here.

The current focus is more on the game engine and less on the little world that
was created to play in. Development is drivin primarily from the tests rather
than the tiny game that is included.

## Screenshot(s)

![Screenshot](screenshots/game.png)

## Features

- [x] Web UI (Angular / Websockets)
- [x] Parser
- [x] Rooms/Zones
- [x] Room/Zone movement
- [x] Items (pickup, use, drop)
- [x] Objects (look, examine)
- [x] Crafting
- [x] NPCs and interaction
- [x] Vendors
- [x] Quests
- [x] Mapping
- [x] Basic command help
- [x] Spawn Locations
- [x] Save/Load (uses Deno KV)
- [x] Combat (very basic)
- [x] Instancing (zones, rooms, items, npcs, mobs)
- [x] Question sequences
- [ ] Leveling
- [ ] Multiplayer

## Run

Backend:

> deno task run

Frontend:

NOTE: Requires Node.js and Angular CLI

> npm install

> ng serve

## Testing

Run tests:

> deno task test

Get coverage report:

> deno task coverage

## Usage

Have a look at the sample game `textworld_game.ts` to see a basic usage of the
library. Additionally take a look at `textworld_test.ts` to see how usage of
every feature in the library.

## Author(s)

Frank Hale &lt;frankhaledevelops AT gmail.com&gt;

## Date

30 September 2024
