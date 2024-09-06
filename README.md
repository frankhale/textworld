# TextWorld

A text based role playing game engine written in TypeScript on Deno with an
Angular frontend. This is still a work in progress but there is a lot here.
There is a strong focus on test driven design.

The current focus is more on the game engine and less on the little world that
was created to play in. This will change as time moves on.

## Screenshot(s)

![Screenshot](screenshots/game.png)

## Features

- [x] Command line interface
- [x] Parser
- [x] Rooms/Zones
- [x] Room/Zone movement
- [x] Items (pickup, use, drop)
- [x] Objects (look, examine)
- [x] Crafting
- [x] NPCs
- [x] NPC interaction
- [x] Vendors
- [x] Quests
- [x] Mapping
- [x] Basic command help
- [x] Combat
- [x] Exposed through WebSocket server
- [x] Exposed through command line interface
- [x] Web UI
- [x] Spawn Locations
- [x] Save/Load (uses Deno KV)
- [ ] Leveling

## Run

NOTE: Because we are using Deno.Kv we need to pass the --unstable flag

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

## Author(s)

Frank Hale &lt;frankhaledevelops AT gmail.com&gt;

## Date

6 September 2024
