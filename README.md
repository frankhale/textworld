# TextWorld

A text based role playing game engine written in TypeScript on Deno. This is still a work in progress but there is a lot here. There is a strong focus on test driven design to ensure the code works as expected.

## Screenshot(s)

![Screenshot](screenshots/game.png)

## TODO

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

> deno run --unstable --allow-read --allow-write --allow-net .\textworld_game.ts

## Test

> deno test --unstable --allow-read --allow-write .\textworld_tests.ts

## Author(s)

Frank Hale &lt;frankhale AT gmail.com&gt;

## Date

17 November 2023
