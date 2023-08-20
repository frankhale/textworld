# TextWorld

A text based role playing game engine written in TypeScript on Deno. This is still a work in progress but there is a lot here. There is a strong focus on test driven design to ensure the code works as expected. Eventually I will expose the engine through a web socket server and create a web front end for it.

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
- [ ] Leveling
- [ ] Save/Load (Deno KV)
- [ ] Multiplayer?
- [ ] Exposed through WebSocket server
- [ ] Web UI

## Thoughts for the future

The ultimate plan is to have a web frontend and expose the game from a web
socket server. Currently we return strings for the game output but this would
be better served if we returned JSON with some metadata. Additionally, support
for multiplayer is planned but it's not clear yet what sort of refactoring to
code is needed.

## Author(s)

Frank Hale &lt;frankhale AT gmail.com&gt;

## Date

20 August 2023
