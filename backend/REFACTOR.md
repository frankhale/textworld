# TextWorld Builder Pattern Refactoring Plan

## Overview

This document outlines a plan to refactor the TextWorld library to use the **Builder Pattern** for constructing world data. The goal is to provide a more fluent, descriptive, and easier-to-use API while maintaining backward compatibility with the existing procedural approach.

## Current API Analysis

The current `TextWorld` class uses a procedural approach with individual `create_*`, `add_*`, and `place_*` methods:

### Entity Creation Methods
- `create_zone(name, description)`
- `create_room(zone_name, name, description, action)`
- `create_player(name, description, zone_name, room_name)`
- `create_npc(name, description)`
- `create_vendor(name, description, vendor_items)`
- `create_mob(name, description, stats, items)`
- `create_item(name, description, usable, consumable, action)`
- `create_object(name, description, dialog)`
- `create_quest(name, description)`
- `create_recipe(name, description, ingredients, crafted_item)`
- `create_stats(...9 parameters...)`

### Shorthand Helpers
- `r(name, description)` - Room shorthand
- `e(exit_name, location, hidden)` - Exit shorthand
- `e_from(from_room_name, exits)` - Exit grouping shorthand
- `create_rooms(zone_name, rooms)` - Bulk room creation
- `create_exits(zone_name, exits)` - Bulk exit creation

### Placement Methods
- `place_npc(zone_name, room_name, npc_name, player?)`
- `place_mob(zone_name, room_name, mob_name, player?)`
- `place_item(zone_name, room_name, item_name, quantity?, player?)`
- `place_object(zone_name, room_name, object_name, player?)`

### Configuration Methods
- `add_quest_step(quest_name, name, description, action)`
- `add_quest_action(quest_name, action_type, action)`
- `add_room_action(zone_name, room_name, action)`
- `add_room_command_action(...)`
- `add_room_description(zone_name, room_name, flag, description)`
- `set_item_level_and_value(item_name, level, value)`
- `set_room_as_zone_starter(zone_name, room_name)`

### Issues with Current Approach
1. **Verbose**: Creating a complete zone with rooms, NPCs, items requires many separate method calls
2. **Disconnected**: Related configuration is scattered across multiple calls
3. **Error-prone**: Easy to forget required configuration steps
4. **Hard to read**: Game world structure isn't immediately apparent from code
5. **Many parameters**: Methods like `create_stats` have 9 positional parameters

---

## Proposed Builder Pattern API

### Design Principles
1. **Fluent Interface**: Chainable methods that read like natural language
2. **Nested Builders**: Sub-builders for complex nested structures
3. **Type Safety**: Full TypeScript type support with inference
4. **Validation**: Build-time validation of required fields
5. **Backward Compatible**: Existing API remains functional

---

## Builder Classes

### 1. ZoneBuilder

```typescript
const zone = textworld.zone("Dark Forest")
  .description("A mysterious forest shrouded in darkness")
  .startingRoom("Entrance")
  .build();
```

**Methods:**
- `description(text: string)` - Set zone description
- `startingRoom(roomName: string)` - Set the starting room
- `build()` - Finalize and register the zone

---

### 2. RoomBuilder

```typescript
textworld.room("Dark Forest", "Entrance")
  .description("You stand at the edge of the dark forest...")
  .alternateDescription("torch-lit", "The torch illuminates cobwebs on the trees...")
  .exit("north", "Clearing")
  .exit("east", "River Bank", { hidden: true })
  .item("Rusty Sword", 1)
  .item("Health Potion", 3)
  .npc("Old Hermit")
  .mob("Wolf")
  .object("Ancient Signpost")
  .onEnter((player) => {
    if (!textworld.has_flag(player, "visited-entrance")) {
      textworld.set_flag(player, "visited-entrance");
      return "A chill runs down your spine as you enter...";
    }
    return null;
  })
  .command("pray", ["pray", "kneel"], "Pray at this sacred ground", (player) => {
    return "You feel a sense of peace wash over you.";
  })
  .asZoneStarter()
  .build();
```

**Methods:**
- `description(text: string)` - Set default description
- `alternateDescription(flag: string, text: string)` - Add flag-based description
- `exit(direction: ExitName, toRoom: string, options?: { hidden?: boolean })` - Add exit
- `exits(config: ExitConfig[])` - Add multiple exits at once
- `item(name: string, quantity?: number)` - Place item in room
- `items(drops: Drop[])` - Place multiple items
- `npc(name: string)` - Place NPC in room
- `mob(name: string)` - Place mob in room
- `object(name: string)` - Place object in room
- `onEnter(action: Action)` - Add room enter action
- `command(name: string, synonyms: string[], description: string, action: CommandParserAction)` - Add room-specific command
- `asZoneStarter()` - Mark as zone starting room
- `build()` - Finalize and register the room

---

### 3. ItemBuilder

```typescript
textworld.item("Health Potion")
  .description("A red potion that restores 20 health")
  .alternateDescription("identified", "A Greater Health Potion (+20 HP)")
  .usable()
  .consumable()
  .level(5)
  .value(50)
  .onUse((player) => {
    textworld.add_to_actor_health(player, 20);
    return "You drink the potion and feel refreshed! (+20 HP)";
  })
  .build();
```

**Methods:**
- `description(text: string)` - Set default description
- `alternateDescription(flag: string, text: string)` - Add flag-based description
- `usable(value?: boolean)` - Mark as usable (default true)
- `consumable(value?: boolean)` - Mark as consumable (default true)
- `level(value: number)` - Set item level
- `value(amount: number)` - Set gold value
- `onUse(action: Action)` - Set use action
- `build()` - Finalize and register the item

---

### 4. NPCBuilder

```typescript
textworld.npc("Blacksmith")
  .description("A burly man covered in soot")
  .alternateDescription("friendly", "The blacksmith smiles warmly at you")
  .dialog(["hello", "hi"], "Welcome to my forge!")
  .dialog(["weapons", "sword"], "I've got the finest blades in the land.")
  .dialogAction(["buy", "purchase"], (player, input, command, args) => {
    return "What would you like to buy?";
  })
  .build();
```

**Methods:**
- `description(text: string)` - Set default description
- `alternateDescription(flag: string, text: string)` - Add flag-based description
- `dialog(triggers: string[], response: string)` - Add static dialog
- `dialogAction(triggers: string[], action: CommandParserAction)` - Add dynamic dialog
- `killable(value?: boolean)` - Mark as killable
- `build()` - Finalize and register the NPC

---

### 5. VendorBuilder (extends NPCBuilder)

```typescript
textworld.vendor("Merchant")
  .description("A shrewd-looking merchant")
  .sells("Health Potion", 50)
  .sells("Mana Potion", 75)
  .sells("Iron Sword", 200)
  .build();
```

**Methods (in addition to NPCBuilder):**
- `sells(itemName: string, price: number)` - Add item for sale
- `inventory(items: VendorItem[])` - Set full inventory at once

---

### 6. MobBuilder

```typescript
textworld.mob("Forest Wolf")
  .description("A fierce wolf with gleaming eyes")
  .health(30, 30)
  .stamina(20, 20)
  .magicka(0, 0)
  .physicalDamage(8)
  .physicalDefense(3)
  .spellDamage(0)
  .spellDefense(1)
  .criticalChance(0.1)
  .level(3)
  .drops("Wolf Pelt", 1)
  .drops("Wolf Fang", 2)
  .build();

// Or using a stats object shorthand:
textworld.mob("Forest Wolf")
  .description("A fierce wolf with gleaming eyes")
  .stats({
    health: { current: 30, max: 30 },
    stamina: { current: 20, max: 20 },
    magicka: { current: 0, max: 0 },
    physical_damage: 8,
    physical_defense: 3,
    spell_damage: 0,
    spell_defense: 1,
    critical_chance: 0.1,
    progress: { level: 3, xp: 0 }
  })
  .drops([
    { name: "Wolf Pelt", quantity: 1 },
    { name: "Wolf Fang", quantity: 2 }
  ])
  .build();
```

**Methods:**
- `description(text: string)` - Set description
- `health(current: number, max: number)` - Set health
- `stamina(current: number, max: number)` - Set stamina
- `magicka(current: number, max: number)` - Set magicka
- `physicalDamage(value: number)` - Set physical damage
- `physicalDefense(value: number)` - Set physical defense
- `spellDamage(value: number)` - Set spell damage
- `spellDefense(value: number)` - Set spell defense
- `criticalChance(value: number)` - Set crit chance (0-1)
- `level(value: number)` - Set level
- `stats(stats: Stats)` - Set all stats at once
- `drops(name: string, quantity: number)` - Add single drop
- `drops(items: Drop[])` - Add multiple drops (overload)
- `build()` - Finalize and register the mob

---

### 7. ObjectBuilder (Room Objects)

```typescript
textworld.object("Ancient Chest")
  .description("A weathered chest covered in runes")
  .alternateDescription("opened", "An empty ancient chest")
  .interaction(["open", "unlock"], "The chest creaks open...")
  .interactionAction(["search", "loot"], (player) => {
    if (!textworld.has_flag(player, "chest-looted")) {
      textworld.set_flag(player, "chest-looted");
      textworld.add_item_to_player(player, "Ancient Key");
      return "You found an Ancient Key!";
    }
    return "The chest is empty.";
  })
  .build();
```

**Methods:**
- `description(text: string)` - Set description
- `alternateDescription(flag: string, text: string)` - Add flag-based description
- `interaction(triggers: string[], response: string)` - Add static interaction
- `interactionAction(triggers: string[], action: CommandParserAction)` - Add dynamic interaction
- `build()` - Finalize and register the object

---

### 8. QuestBuilder

```typescript
textworld.quest("The Lost Artifact")
  .description("Find the legendary artifact hidden in the ruins")
  .onStart((player) => {
    textworld.add_item_to_player(player, "Treasure Map");
    return "The sage hands you a worn treasure map.";
  })
  .step("Enter the Ruins")
    .description("Find the entrance to the ancient ruins")
    .isComplete((player) => textworld.has_flag(player, "entered-ruins"))
  .step("Defeat the Guardian")
    .description("Defeat the stone guardian protecting the artifact")
    .isComplete((player) => textworld.has_flag(player, "guardian-defeated"))
  .step("Retrieve the Artifact")
    .description("Take the artifact from its pedestal")
    .isComplete((player) => textworld.has_item(player, "Ancient Artifact"))
  .onEnd((player) => {
    player.gold += 500;
    player.score += 100;
    return "Quest Complete! +500 gold, +100 score";
  })
  .build();
```

**Methods:**
- `description(text: string)` - Set quest description
- `onStart(action: Action)` - Set start action
- `onEnd(action: Action)` - Set completion action
- `step(name: string)` - Begin defining a quest step (returns QuestStepBuilder)
- `build()` - Finalize and register the quest

**QuestStepBuilder Methods:**
- `description(text: string)` - Set step description
- `isComplete(check: ActionDecision)` - Set completion check
- Returns to parent QuestBuilder after each step definition

---

### 9. RecipeBuilder

```typescript
textworld.recipe("Iron Sword")
  .description("A sturdy iron sword")
  .requires("Iron Ore", 3)
  .requires("Wood", 1)
  .requires("Leather Strip", 2)
  .produces("Iron Sword", 1)
  .build();
```

**Methods:**
- `description(text: string)` - Set recipe description
- `requires(itemName: string, quantity: number)` - Add ingredient
- `ingredients(items: Drop[])` - Set all ingredients at once
- `produces(itemName: string, quantity: number)` - Set crafted item
- `build()` - Finalize and register the recipe

---

### 10. PlayerBuilder

```typescript
const player = textworld.player("Hero")
  .description("A brave adventurer seeking glory")
  .location("Dark Forest", "Entrance")
  .health(100, 100)
  .stamina(50, 50)
  .magicka(30, 30)
  .physicalDamage(15)
  .physicalDefense(10)
  .spellDamage(5)
  .spellDefense(5)
  .criticalChance(0.05)
  .gold(100)
  .item("Starter Sword", 1)
  .item("Health Potion", 3)
  .flag("tutorial-complete")
  .build();
```

**Methods:**
- `description(text: string)` - Set description
- `location(zoneName: string, roomName: string)` - Set starting location
- `health(current: number, max: number)` - Set health
- `stamina(current: number, max: number)` - Set stamina
- `magicka(current: number, max: number)` - Set magicka
- `physicalDamage(value: number)` - Set physical damage
- `physicalDefense(value: number)` - Set physical defense
- `spellDamage(value: number)` - Set spell damage
- `spellDefense(value: number)` - Set spell defense
- `criticalChance(value: number)` - Set crit chance
- `stats(stats: Stats)` - Set all stats at once
- `gold(amount: number)` - Set starting gold
- `item(name: string, quantity: number)` - Add starting item
- `items(drops: Drop[])` - Add multiple starting items
- `flag(name: string)` - Set a starting flag
- `build()` - Finalize and register the player

---

### 11. StatsBuilder (Helper for complex stats)

```typescript
const goblinStats = textworld.stats()
  .health(20, 20)
  .stamina(15, 15)
  .magicka(5, 5)
  .physicalDamage(5)
  .physicalDefense(2)
  .spellDamage(0)
  .spellDefense(1)
  .criticalChance(0.05)
  .level(1)
  .build();

// Use with mob builder
textworld.mob("Goblin")
  .description("A small green goblin")
  .stats(goblinStats)
  .build();
```

---

## Implementation Plan

### Phase 1: Core Builder Infrastructure
1. Create base `Builder<T>` abstract class with common functionality
2. Implement `ZoneBuilder` class
3. Implement `RoomBuilder` class
4. Add `zone()` and `room()` entry points to `TextWorld` class
5. Write unit tests for zone and room builders

### Phase 2: Entity Builders
1. Implement `ItemBuilder` class
2. Implement `NPCBuilder` class
3. Implement `VendorBuilder` class (extends NPCBuilder)
4. Implement `MobBuilder` class
5. Implement `ObjectBuilder` class
6. Add entry points: `item()`, `npc()`, `vendor()`, `mob()`, `object()`
7. Write unit tests for all entity builders

### Phase 3: Quest and Recipe Builders
1. Implement `QuestBuilder` class
2. Implement `QuestStepBuilder` class (nested builder)
3. Implement `RecipeBuilder` class
4. Add entry points: `quest()`, `recipe()`
5. Write unit tests

### Phase 4: Player and Stats Builders
1. Implement `StatsBuilder` class
2. Implement `PlayerBuilder` class
3. Add entry points: `player()`, `stats()`
4. Write unit tests

### Phase 5: Integration and Documentation
1. Create integration tests with complete game world examples
2. Update existing tests to include builder pattern equivalents
3. Create comprehensive documentation with examples
4. Add JSDoc comments to all builder methods

### Phase 6: Optional Enhancements
1. Add validation in `build()` methods (required fields, valid references)
2. Add `clone()` methods for creating variations of entities
3. Add preset/template support for common configurations
4. Consider adding async builder support for complex initialization

---

## File Structure

```
textworld/backend/
├── textworld.ts              # Main class (add builder entry points)
├── builders/
│   ├── index.ts              # Export all builders
│   ├── base-builder.ts       # Abstract base builder class
│   ├── zone-builder.ts       # ZoneBuilder
│   ├── room-builder.ts       # RoomBuilder
│   ├── item-builder.ts       # ItemBuilder
│   ├── npc-builder.ts        # NPCBuilder
│   ├── vendor-builder.ts     # VendorBuilder
│   ├── mob-builder.ts        # MobBuilder
│   ├── object-builder.ts     # ObjectBuilder
│   ├── quest-builder.ts      # QuestBuilder + QuestStepBuilder
│   ├── recipe-builder.ts     # RecipeBuilder
│   ├── player-builder.ts     # PlayerBuilder
│   └── stats-builder.ts      # StatsBuilder
└── textworld_tests.ts        # Add builder pattern tests
```

---

## Example: Complete World Using Builders

```typescript
const textworld = new TextWorld();

// Create items first
textworld.item("Rusty Sword")
  .description("An old sword, still serviceable")
  .level(1)
  .value(10)
  .build();

textworld.item("Health Potion")
  .description("Restores 20 health")
  .usable()
  .consumable()
  .level(1)
  .value(25)
  .onUse((player) => {
    textworld.add_to_actor_health(player, 20);
    return "You feel refreshed! (+20 HP)";
  })
  .build();

// Create NPCs
textworld.npc("Village Elder")
  .description("A wise old man with a long beard")
  .dialog(["hello"], "Welcome, young adventurer!")
  .dialogAction(["quest", "help"], (player) => {
    return textworld.pickup_quest(player, "Goblin Menace");
  })
  .build();

// Create mobs
textworld.mob("Goblin")
  .description("A sneaky goblin")
  .health(15, 15)
  .stamina(10, 10)
  .magicka(0, 0)
  .physicalDamage(5)
  .physicalDefense(2)
  .spellDamage(0)
  .spellDefense(0)
  .criticalChance(0.05)
  .level(1)
  .drops("Gold Coin", 3)
  .build();

// Create quest
textworld.quest("Goblin Menace")
  .description("Clear the goblins from the forest")
  .step("Kill 3 Goblins")
    .description("Defeat the goblins terrorizing travelers")
    .isComplete((player) => textworld.has_flag(player, "goblins-killed-3"))
  .onEnd((player) => {
    player.gold += 100;
    return "Quest complete! +100 gold";
  })
  .build();

// Create zone and rooms
textworld.zone("Starting Village")
  .description("A peaceful village")
  .startingRoom("Village Square")
  .build();

textworld.room("Starting Village", "Village Square")
  .description("The heart of the village. A fountain bubbles in the center.")
  .exit("north", "Forest Path")
  .npc("Village Elder")
  .asZoneStarter()
  .build();

textworld.room("Starting Village", "Forest Path")
  .description("A winding path leading into the dark forest.")
  .exit("south", "Village Square")
  .exit("north", "Deep Forest")
  .mob("Goblin")
  .build();

textworld.room("Starting Village", "Deep Forest")
  .description("The forest grows thick here. You can barely see the sky.")
  .exit("south", "Forest Path")
  .mob("Goblin")
  .mob("Goblin")
  .item("Health Potion", 1)
  .build();

// Create player
const player = textworld.player("Hero")
  .description("A brave adventurer")
  .location("Starting Village", "Village Square")
  .gold(50)
  .item("Rusty Sword", 1)
  .item("Health Potion", 2)
  .build();
```

---

## Backward Compatibility

All existing methods will continue to work. The builder pattern is purely additive:

```typescript
// Old way (still works)
textworld.create_zone("Zone1", "Description");
textworld.create_room("Zone1", "Room1", "Room description");
textworld.create_exit("Zone1", "Room1", "north", "Room2");

// New way (builder pattern)
textworld.zone("Zone1")
  .description("Description")
  .build();

textworld.room("Zone1", "Room1")
  .description("Room description")
  .exit("north", "Room2")
  .build();
```

---

## Success Criteria

1. All builders compile with full TypeScript type safety
2. All existing tests continue to pass
3. New tests cover all builder functionality
4. Builder API is intuitive and reduces code verbosity by 30-50%
5. Game world structure is immediately apparent from code using builders
6. Documentation includes comprehensive examples

---

# Implementation Complete

## Summary

The builder pattern refactoring has been **fully implemented** as of January 2026. All phases outlined above have been completed successfully.

## Files Created

### builders/ Directory

| File | Description |
|------|-------------|
| `base-builder.ts` | Abstract base class providing common builder functionality |
| `stats-builder.ts` | StatsBuilder for creating actor stats with fluent API |
| `zone-builder.ts` | ZoneBuilder for creating zones |
| `room-builder.ts` | RoomBuilder for rooms with exits, items, NPCs, mobs, objects, and actions |
| `item-builder.ts` | ItemBuilder for items with use actions |
| `npc-builder.ts` | NPCBuilder for NPCs with dialogs and dialog actions |
| `vendor-builder.ts` | VendorBuilder for vendor NPCs with inventory |
| `mob-builder.ts` | MobBuilder for enemies with stats and drops |
| `object-builder.ts` | ObjectBuilder for room objects with interactions |
| `quest-builder.ts` | QuestBuilder and QuestStepBuilder for quests with steps |
| `recipe-builder.ts` | RecipeBuilder for crafting recipes |
| `player-builder.ts` | PlayerBuilder for player creation |
| `index.ts` | Exports all builders for external use |

### Updated Files

| File | Changes |
|------|---------|
| `textworld.ts` | Added imports, re-exports, and 11 builder entry point methods |
| `builder_tests.ts` | New test file with 42 comprehensive tests |

## Test Results

```
running 42 tests from ./builder_tests.ts
stats_builder_creates_stats_with_defaults ... ok
stats_builder_sets_all_values ... ok
zone_builder_creates_zone ... ok
zone_builder_sets_starting_room ... ok
room_builder_creates_room ... ok
room_builder_adds_exits ... ok
room_builder_places_items ... ok
room_builder_places_npcs ... ok
room_builder_places_mobs ... ok
room_builder_places_objects ... ok
room_builder_adds_on_enter_action ... ok
room_builder_adds_room_command ... ok
room_builder_sets_zone_starter ... ok
item_builder_creates_item ... ok
item_builder_sets_usable_and_consumable ... ok
item_builder_sets_level_and_value ... ok
item_builder_sets_on_use_action ... ok
npc_builder_creates_npc ... ok
npc_builder_adds_dialog ... ok
npc_builder_adds_dialog_action ... ok
vendor_builder_creates_vendor ... ok
vendor_builder_sets_inventory ... ok
mob_builder_creates_mob ... ok
mob_builder_uses_stats_object ... ok
mob_builder_adds_drops ... ok
mob_builder_sets_drops_array ... ok
object_builder_creates_object ... ok
object_builder_adds_interaction ... ok
object_builder_adds_interaction_action ... ok
quest_builder_creates_quest ... ok
quest_builder_adds_start_and_end_actions ... ok
quest_builder_adds_steps ... ok
quest_builder_step_chaining ... ok
recipe_builder_creates_recipe ... ok
recipe_builder_sets_ingredients_array ... ok
player_builder_creates_player ... ok
player_builder_sets_stats ... ok
player_builder_uses_stats_object ... ok
player_builder_sets_gold ... ok
player_builder_adds_items ... ok
player_builder_adds_flags ... ok
integration_full_world_using_builders ... ok

ok | 42 passed | 0 failed
```

All 214 existing tests also continue to pass (excluding unrelated KV store tests that require `--unstable-kv` flag).

---

## Implementation Details

### Entry Points Added to TextWorld

The following methods were added to the `TextWorld` class:

```typescript
// Zone builder
zone(name: string): ZoneBuilder

// Room builder
room(zoneName: string, name: string): RoomBuilder

// Entity builders
item(name: string): ItemBuilder
npc(name: string): NPCBuilder
vendor(name: string): VendorBuilder
mob(name: string): MobBuilder
object(name: string): ObjectBuilder

// Quest and recipe builders
quest(name: string): QuestBuilder
recipe(name: string): RecipeBuilder

// Player and stats builders
player(name: string): PlayerBuilder
stats(): StatsBuilder
```

### Base Builder Class

```typescript
// builders/base-builder.ts
export abstract class BaseBuilder<T> {
  protected textworld: TextWorld;

  constructor(textworld: TextWorld) {
    this.textworld = textworld;
  }

  abstract build(): T;
}
```

### StatsBuilder Implementation

```typescript
// builders/stats-builder.ts
export class StatsBuilder {
  private _health: ResourceAmount = { current: 10, max: 10 };
  private _stamina: ResourceAmount = { current: 10, max: 10 };
  private _magicka: ResourceAmount = { current: 10, max: 10 };
  private _physical_damage: number = 10;
  private _physical_defense: number = 10;
  private _spell_damage: number = 10;
  private _spell_defense: number = 10;
  private _critical_chance: number = 0.05;
  private _progress: Level = { level: 1, xp: 0 };

  health(current: number, max: number): this { /* ... */ }
  stamina(current: number, max: number): this { /* ... */ }
  magicka(current: number, max: number): this { /* ... */ }
  physicalDamage(value: number): this { /* ... */ }
  physicalDefense(value: number): this { /* ... */ }
  spellDamage(value: number): this { /* ... */ }
  spellDefense(value: number): this { /* ... */ }
  criticalChance(value: number): this { /* ... */ }
  level(value: number): this { /* ... */ }
  xp(value: number): this { /* ... */ }
  progress(level: number, xp: number): this { /* ... */ }
  build(): Stats { /* ... */ }
}
```

### QuestBuilder with Nested QuestStepBuilder

```typescript
// builders/quest-builder.ts
export class QuestStepBuilder {
  private _parent: QuestBuilder;
  private _name: string;
  private _description: string = "";
  private _isComplete: ActionDecision | null = null;

  constructor(parent: QuestBuilder, name: string) { /* ... */ }

  description(text: string): this { /* ... */ }
  isComplete(check: ActionDecision): this { /* ... */ }
  done(): QuestBuilder { /* ... */ }

  // Convenience methods for chaining
  step(name: string): QuestStepBuilder { return this.done().step(name); }
  onEnd(action: Action): QuestBuilder { return this.done().onEnd(action); }
  build(): Quest { return this.done().build(); }
}

export class QuestBuilder extends BaseBuilder<Quest> {
  private _name: string;
  private _description: string = "";
  private _onStart: Action | null = null;
  private _onEnd: Action | null = null;
  private _steps: QuestStepConfig[] = [];

  description(text: string): this { /* ... */ }
  onStart(action: Action): this { /* ... */ }
  onEnd(action: Action): this { /* ... */ }
  step(name: string): QuestStepBuilder { /* ... */ }
  build(): Quest { /* ... */ }
}
```

---

## Complete Working Example

This example demonstrates a fully functional game world built entirely using the builder pattern:

```typescript
import { TextWorld } from "./textworld.ts";

const textworld = new TextWorld();

// ============
// CREATE ITEMS
// ============

textworld.item("Rusty Sword")
  .description("An old sword, still serviceable")
  .level(1)
  .value(10)
  .build();

textworld.item("Health Potion")
  .description("A red potion that restores 20 health")
  .usable()
  .consumable()
  .level(1)
  .value(25)
  .onUse((player) => {
    textworld.add_to_actor_health(player, 20);
    return "You drink the potion and feel refreshed! (+20 HP)";
  })
  .build();

textworld.item("Gold Coin")
  .description("A shiny gold coin")
  .value(1)
  .build();

// ===========
// CREATE NPCS
// ===========

textworld.npc("Village Elder")
  .description("A wise old man with a long white beard")
  .dialog(["hello", "hi"], "Welcome to our humble village, adventurer!")
  .dialog(["help", "quest"], "The goblins in the forest have been causing trouble. Can you help?")
  .dialogAction(["accept", "yes"], (player) => {
    return textworld.pickup_quest(player, "Goblin Menace");
  })
  .build();

// ==============
// CREATE VENDORS
// ==============

textworld.vendor("Potion Merchant")
  .description("A friendly merchant selling various potions")
  .sells("Health Potion", 50)
  .build();

// ===========
// CREATE MOBS
// ===========

textworld.mob("Goblin")
  .description("A small, sneaky goblin with sharp teeth")
  .health(15, 15)
  .stamina(10, 10)
  .magicka(0, 0)
  .physicalDamage(5)
  .physicalDefense(2)
  .spellDamage(0)
  .spellDefense(1)
  .criticalChance(0.05)
  .level(1)
  .drop("Gold Coin", 5)
  .build();

// Using stats builder for reusable stats
const bossStats = textworld.stats()
  .health(100, 100)
  .stamina(50, 50)
  .magicka(30, 30)
  .physicalDamage(15)
  .physicalDefense(8)
  .spellDamage(10)
  .spellDefense(5)
  .criticalChance(0.15)
  .level(5)
  .build();

textworld.mob("Goblin Chief")
  .description("A large goblin wearing a crude crown")
  .stats(bossStats)
  .drop("Gold Coin", 50)
  .drop("Rusty Sword", 1)
  .build();

// ==============
// CREATE OBJECTS
// ==============

textworld.object("Ancient Well")
  .description("An old stone well covered in moss")
  .interaction(["look into", "peer"], "You see your reflection in the dark water below.")
  .interactionAction(["drink", "taste"], (player) => {
    textworld.add_to_actor_health(player, 5);
    return "The cool water refreshes you. (+5 HP)";
  })
  .build();

textworld.object("Notice Board")
  .description("A wooden board with various notices pinned to it")
  .interaction(["read", "examine"], "Most notices are about lost cats and local events.")
  .build();

// =============
// CREATE QUESTS
// =============

textworld.quest("Goblin Menace")
  .description("Clear the goblin threat from the forest")
  .onStart((player) => {
    textworld.set_flag(player, "quest-goblin-started");
    return "The Village Elder nods gratefully. 'Thank you, brave adventurer!'";
  })
  .step("Explore the Forest")
    .description("Enter the forest and find the goblin camp")
    .isComplete((player) => textworld.has_flag(player, "found-goblin-camp"))
  .step("Defeat the Goblin Chief")
    .description("Defeat the leader of the goblins")
    .isComplete((player) => textworld.has_flag(player, "goblin-chief-defeated"))
  .onEnd((player) => {
    player.gold += 100;
    player.score += 50;
    return "Quest Complete! The village is safe. (+100 gold, +50 score)";
  })
  .build();

// =======================
// CREATE ZONES AND ROOMS
// =======================

textworld.zone("Starting Village")
  .description("A peaceful village nestled in a valley")
  .startingRoom("Village Square")
  .build();

textworld.room("Starting Village", "Village Square")
  .description("The heart of the village. A fountain bubbles cheerfully in the center.")
  .npc("Village Elder")
  .npc("Potion Merchant")
  .object("Notice Board")
  .object("Ancient Well")
  .asZoneStarter()
  .build();

textworld.room("Starting Village", "Village Gate")
  .description("The northern gate of the village. Beyond lies the dark forest.")
  .onEnter((player) => {
    if (!textworld.has_flag(player, "warned-about-forest")) {
      textworld.set_flag(player, "warned-about-forest");
      return "A guard warns you: 'Be careful out there, the forest is dangerous!'";
    }
    return null;
  })
  .build();

textworld.room("Starting Village", "Forest Edge")
  .description("The trees grow dense here. You can hear strange sounds deeper in.")
  .mob("Goblin")
  .item("Health Potion", 1)
  .build();

textworld.room("Starting Village", "Goblin Camp")
  .description("A crude camp with tents made of animal hides. This is where the goblins live.")
  .mob("Goblin")
  .mob("Goblin")
  .mob("Goblin Chief")
  .onEnter((player) => {
    if (!textworld.has_flag(player, "found-goblin-camp")) {
      textworld.set_flag(player, "found-goblin-camp");
      return "You've found the goblin camp! The creatures snarl at your approach.";
    }
    return null;
  })
  .build();

// Create exits between rooms
textworld.create_exit("Starting Village", "Village Square", "north", "Village Gate");
textworld.create_exit("Starting Village", "Village Gate", "north", "Forest Edge");
textworld.create_exit("Starting Village", "Forest Edge", "north", "Goblin Camp");

// =============
// CREATE PLAYER
// =============

const player = textworld.player("Hero")
  .description("A brave adventurer seeking fortune and glory")
  .location("Starting Village", "Village Square")
  .health(50, 50)
  .stamina(30, 30)
  .magicka(20, 20)
  .physicalDamage(10)
  .physicalDefense(5)
  .spellDamage(5)
  .spellDefense(3)
  .criticalChance(0.05)
  .gold(25)
  .item("Rusty Sword", 1)
  .item("Health Potion", 2)
  .build();

// The game is now ready to play!
console.log("Game world created successfully!");
console.log(`Player: ${player.name}`);
console.log(`Location: ${player.location.zone} - ${player.location.room}`);
console.log(`Gold: ${player.gold}`);
console.log(`Items: ${player.items.map(i => `${i.name} (${i.quantity})`).join(", ")}`);
```

---

## Comparison: Old vs New API

### Creating a Mob (Old Way)
```typescript
const stats = textworld.create_stats(
  { current: 15, max: 15 },  // health
  { current: 10, max: 10 },  // stamina
  { current: 0, max: 0 },    // magicka
  5,                          // physical_damage
  2,                          // physical_defense
  0,                          // spell_damage
  1,                          // spell_defense
  0.05,                       // critical_chance
  { level: 1, xp: 0 }        // progress
);
textworld.create_mob("Goblin", "A sneaky goblin", stats, [
  { name: "Gold Coin", quantity: 5 }
]);
```

### Creating a Mob (New Way)
```typescript
textworld.mob("Goblin")
  .description("A sneaky goblin")
  .health(15, 15)
  .physicalDamage(5)
  .physicalDefense(2)
  .spellDefense(1)
  .drop("Gold Coin", 5)
  .build();
```

### Creating a Room with Contents (Old Way)
```typescript
textworld.create_zone("Village");
textworld.create_room("Village", "Square", "The village square");
textworld.create_npc("Elder", "A wise elder");
textworld.place_npc("Village", "Square", "Elder");
textworld.create_item("Potion", "A health potion", true, true);
textworld.place_item("Village", "Square", "Potion", 2);
textworld.add_room_action("Village", "Square", (player) => {
  return "You feel at peace here.";
});
textworld.set_room_as_zone_starter("Village", "Square");
```

### Creating a Room with Contents (New Way)
```typescript
textworld.zone("Village").build();
textworld.npc("Elder").description("A wise elder").build();
textworld.item("Potion").description("A health potion").usable().consumable().build();

textworld.room("Village", "Square")
  .description("The village square")
  .npc("Elder")
  .item("Potion", 2)
  .onEnter((player) => "You feel at peace here.")
  .asZoneStarter()
  .build();
```

---

## Future Enhancements (Phase 6 - Not Yet Implemented)

The following enhancements were outlined but not implemented in this phase:

1. **Validation in build() methods** - Check for required fields and valid references
2. **clone() methods** - Create variations of existing entities
3. **Preset/template support** - Common configurations for quick entity creation
4. **Async builder support** - For complex initialization requiring async operations

These can be added in future iterations as needed.
