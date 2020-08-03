# TextWorld

An experiment in creating a text based role playing adventure game using a
custom Entity Component System (from my current evolving understanding of what
an ECS is). The code is still very rough.

## Status

I'm experimenting to figure out the details of how to write an ECS to do this
sort of game. The current project is single player focused whereas the ultimate
end goal is to have a MUD*like game.

I've replaced the command line interface with a pseudo command like interface
using Blazor. This is going to open things up so that we can retain an old
school look and feel but also mix in some modern UI to assist in some areas.

## LONG TERM IDEAS ABOUT GAME ENTITIES/SYSTEMS BELOWS

The stuff listed below does not correspond to what is currently being developed.
I started fiddling with the idea to create an entity component system and this
is what I'm currently experimenting on. Everything listed below is for my vision
of a MUD*like game (eg. multiplayer text RPG).

## Game Entities

These are aspects of an engine that you'll likely want to have. Some things
listed are not necessary and can be swapped out for whatever you like.

### Accounts

When a player creates a new user account they will be able to create multiple
characters. The number of accounts can be constrained if necessary.

- username
- email address
- password
- characters
- achievements
- inventory
  - crafting resources
  - armor
  - weapons
  - furnishing
  - etc...
- currency : (Gold, custom currency, etc...)
- personal zones : (Player housing, etc...)
- guilds
- flags
- created date
- last login date

### Characters

- name
- race
- class
- level
- experience
- currency\* : Stored at account level
- location
  - zone
  - scene
  - room
- stats : Health, (Magicka, Stamina, Energy, Resistances), etc...
- buffs/debuffs
- equipment slots
  - Armor
    - head
    - shoulders
    - chest
    - waist
    - hands
    - legs
    - feet
  - Weapons
    - One handed
    - Dual wield
  - Modifiers
    - Equipment slots that add bonuses. These would be additional slots like
      jewelry or some other additional equipment slot
- skills
  - combat
  - crafting
  - etc...
- commands : some are common but others can be acquired like (banker, merchant)
- passives
- quests
- inventory\* : Inventory is stored at the account level, not per character. All
  items you have are available across characters
- Pets & Companions
  - name
  - skill(s)
  - bonus(es)
- created date

### Zones

Zones have a collection of scenes. Scenes should be thought about in the
following manner, a player enters a house (the house is a scene with a
collection of rooms).

- name
- scenes
- flags

### Scenes

An example of a scene would be a character entering a house. The house is a
collection of rooms.

- name
- rooms
- flags
- scripts

### Rooms

An individual location that a character can inhabit.

- name
- description
- short description
- items
- npcs
- mobs
- scripts
  - example: mob spawning, item spawning scripts
- exits
- flags

### Items

- name
- description
- short description
- modifiers
- flags
- scripts

### Exits

- name
- scripts

### Mobs

- name
- race
- class
- level
- stats
- equipment build
- skills
- passives
- loot table
- scripts

### NPCs

- name
- race
- class
- level
- stats
- equipment build
- skills
- passives
- loot table
- dialog
- scripts

### Quests

- name
- provider(s) : The NPCs or other entities that can provide this quest
- step(s)
  - dialog
  - scripts
- loot table

### Guilds

- name
- description
- affiliation
- owner
- date created
- members

## Flags

Flags are any designator that can be used to make decisions off of. The obvious
one would be if PVP is enabled on a zone, scene or room level.

## Scripts (Lua, etc...)

Scripts will be provided with a public API and have necessary functions to
inspect and perform actions based on the context they are called. The engine
will execute the script based on the objects and context of the current game
state.

- name
- flags
- code

## Game Systems

- Account
- Chat (can be zone, scene, room or private between players)
- Mail
- Daily Rewards
- Daily quests
- Game wide buffs (double XP gain)
- Inventory
- Combat
- PVP
  - Battle Royale
  - Open zone
  - Small scale : battlegrounds
- Events (events for holiday's, etc...)
- Crafting
  - item deconstruction (to obtain raw materials)
- Economy (central auction house, merchants)
  - personal merchants
- Banker
  - personal banker
- Guild
- Grouping
- Personal Zones (think player housing)
- Furnishings (for player housing)
- Player Death
- Armor/Weapons
- Loot
  - drops from MOBs
  - treasure chests, maps, hidden items, etc..
- Queuing
- Thievery
  - pick pocketing NPCs
  - breaking into NPC homes and stealing items
- Resource gathering (for crafting)
- Spawning (mobs, treasure, resource gathering)
- Script runner

## Scripting

The idea of scripting I think should be left up to the engine implementor to do
with as they wish. I'd like to think of the game engine to enforce a set of
constraints and then publishes an API that script authors can take advantage of
given the context.

- Lua &lt;https://www.lua.org/&gt;

## Author(s)

Frank Hale &lt;frankhale AT gmail.com&gt;

## Date

2 August 2020
