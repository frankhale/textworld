# TextWorld Scripting System - Design Discussion

This document explores a hypothetical scripting system for TextWorld that would allow game content creators to define dynamic behaviors using string-based scripts rather than TypeScript functions.

## Motivation

Currently, TextWorld uses TypeScript functions for all dynamic behavior:

```typescript
textworld.room("The Forest", "Pool of Water")
  .description("A magical pool...")
  .onEnter((player) => {
    if (!textworld.is_actor_health_full(player)) {
      textworld.set_actor_health_to_max(player);
      return "Your health has been regenerated.";
    }
    return "The healing waters have no effect on you.";
  })
  .build();
```

While powerful, this approach has limitations:
- Game data cannot be purely data-driven (requires code)
- Non-programmers cannot easily create content
- Game content cannot be loaded from external files (JSON/YAML)
- No modding support without code access
- Hot-reloading game logic is difficult

A scripting system would address these limitations while maintaining the expressiveness needed for rich game experiences.

## Script Attachment Points

### Room Scripts

| Event | Trigger | Use Cases |
|-------|---------|-----------|
| `onEnter` | Player enters the room | Healing pools, traps, ambient messages, enemy spawns |
| `onExit` | Player leaves the room | Door closing sounds, one-way passages, pursuit triggers |
| `onLook` | Player examines the room | Revealing hidden details based on flags, time-based descriptions |
| `onTick` | Periodic timer (if player present) | Environmental hazards, NPC movement, weather changes |
| `onSearch` | Player searches the room | Finding hidden items, triggering traps |

### Item Scripts

| Event | Trigger | Use Cases |
|-------|---------|-----------|
| `onUse` | Player uses the item | Potions, keys, tools, consumables |
| `onPickup` | Player picks up the item | Cursed items, quest triggers, weight limits |
| `onDrop` | Player drops the item | Item decay, NPC reactions, puzzle mechanics |
| `onExamine` | Player examines the item | Revealing lore, hidden properties, identification |
| `onEquip` | Player equips the item | Stat modifications, set bonuses, curses |
| `onUnequip` | Player unequips the item | Removing buffs, curse prevention |
| `onCombine` | Player combines with another item | Crafting, puzzle solving, item transformation |

### NPC Scripts

| Event | Trigger | Use Cases |
|-------|---------|-----------|
| `onTalk` | Player initiates conversation | Dynamic dialog based on quest state, reputation |
| `onGive` | Player gives item to NPC | Quest completion, bribes, trade |
| `onAttack` | Player attacks the NPC | Reputation changes, guard alerts, fleeing |
| `onTick` | Periodic timer | Wandering, schedules, ambient actions |
| `onPlayerEnter` | Player enters NPC's room | Greetings, warnings, merchant calls |
| `onDeath` | NPC is killed | Loot drops, quest updates, faction changes |

### Mob Scripts

| Event | Trigger | Use Cases |
|-------|---------|-----------|
| `onSpawn` | Mob is created | Initial positioning, buff application |
| `onAggro` | Mob notices player | Battle cries, calling reinforcements |
| `onDamage` | Mob takes damage | Enrage mechanics, flee behavior, phase changes |
| `onDeath` | Mob is killed | Loot generation, quest updates, respawn timers |
| `onTick` | Combat round | AI behavior, special attacks, healing |

### Quest Scripts

| Event | Trigger | Use Cases |
|-------|---------|-----------|
| `onStart` | Quest is accepted | Initial dialog, item grants, flag setting |
| `onStepComplete` | Quest step finished | Progress messages, intermediate rewards |
| `onComplete` | Quest finished | Rewards, unlocks, reputation changes |
| `onAbandon` | Quest dropped | Cleanup, penalty application |
| `canStart` | Checking availability | Prerequisites, level requirements, faction standing |

### Global/World Scripts

| Event | Trigger | Use Cases |
|-------|---------|-----------|
| `onGameStart` | New game begins | Character creation, intro sequence |
| `onTimeChange` | Game time advances | Day/night cycles, shop hours, NPC schedules |
| `onZoneEnter` | Player enters a zone | Zone-wide effects, music changes, tutorials |
| `onPlayerDeath` | Player dies | Respawn logic, death penalties, permadeath |
| `onCombatStart` | Combat begins | Initiative, ambush detection, pre-battle dialog |
| `onCombatEnd` | Combat finishes | Loot distribution, flee consequences |

## Script Language Considerations

### Option 1: Domain-Specific Language (DSL)

A simple, safe, purpose-built language:

```
# Healing Pool Script
on_enter:
  if player.health < player.max_health then
    player.health = player.max_health
    say "Your health has been regenerated."
  else
    say "The healing waters have no effect on you."
  end
```

**Pros:**
- Simple to learn for non-programmers
- Easy to sandbox and secure
- Can be optimized for game-specific operations

**Cons:**
- Limited expressiveness
- Another language to maintain
- Learning curve for new syntax

### Option 2: Lua Integration

Embed Lua as the scripting language:

```lua
function on_enter(player, room)
  if player.health < player.max_health then
    player.health = player.max_health
    return "Your health has been regenerated."
  else
    return "The healing waters have no effect on you."
  end
end
```

**Pros:**
- Well-established game scripting language
- Rich ecosystem and documentation
- Powerful and flexible

**Cons:**
- Requires Lua runtime integration
- Security sandboxing complexity
- Heavier dependency

### Option 3: JavaScript/TypeScript Subset

Use a safe subset of JavaScript:

```javascript
// on_enter
if (player.health < player.maxHealth) {
  player.health = player.maxHealth;
  return "Your health has been regenerated.";
} else {
  return "The healing waters have no effect on you.";
}
```

**Pros:**
- Familiar syntax (same as codebase)
- Can use existing JS parsers
- Deno has built-in sandboxing capabilities

**Cons:**
- Security concerns with eval
- Need to carefully restrict available APIs

### Option 4: Expression Language

A minimal expression-based language for simple conditions and effects:

```yaml
on_enter:
  conditions:
    - "player.health < player.max_health"
  effects:
    - "set player.health player.max_health"
    - "say 'Your health has been regenerated.'"
  else_effects:
    - "say 'The healing waters have no effect on you.'"
```

**Pros:**
- Very safe and predictable
- Easy to validate and parse
- Good for data-driven content

**Cons:**
- Limited complexity
- May need to fall back to code for complex logic

## Script API Surface

Scripts would need access to a controlled API:

### Player Operations
```
player.health / player.maxHealth
player.stamina / player.maxStamina
player.magicka / player.maxMagicka
player.gold
player.level
player.location.zone / player.location.room
player.hasItem(name) / player.itemCount(name)
player.hasFlag(name)
player.addItem(name, quantity)
player.removeItem(name, quantity)
player.setFlag(name) / player.clearFlag(name)
player.teleport(zone, room)
player.damage(amount) / player.heal(amount)
```

### Room Operations
```
room.name / room.zone
room.hasItem(name) / room.itemCount(name)
room.addItem(name, quantity) / room.removeItem(name, quantity)
room.hasNpc(name) / room.hasMob(name)
room.spawnMob(name) / room.removeMob(name)
room.setDescription(text)
room.addExit(direction, destination) / room.removeExit(direction)
room.isExitHidden(direction) / room.setExitHidden(direction, hidden)
```

### World Operations
```
world.getRoom(zone, room)
world.getPlayer(id)
world.getTime() / world.setTime(time)
world.broadcast(message)  -- to all players
world.getRandomNumber(min, max)
```

### Utility Operations
```
say(message)           -- output to current player
log(message)           -- debug logging
delay(ms, callback)    -- delayed execution
random(min, max)       -- random number
chance(percent)        -- returns true percent% of time
format(template, ...)  -- string formatting
```

## Data-Driven Game Definition

With scripting, games could be defined entirely in data files:

```yaml
# world.yaml
zones:
  - name: "The Forest"
    description: "A mysterious forest"
    starting_room: "Open Field"
    rooms:
      - name: "Open Field"
        description: "Tall grass surrounds you."
        exits:
          north: "Stream"
          east: "Dark Cave"
        items:
          - name: "Rusty Sword"
            quantity: 1
        scripts:
          on_enter: |
            if not player.hasFlag("visited_field") then
              player.setFlag("visited_field")
              say "You feel a sense of adventure!"
            end

      - name: "Healing Pool"
        description: "A shimmering pool of water."
        scripts:
          on_enter: |
            if player.health < player.maxHealth then
              player.health = player.maxHealth
              say "The waters restore your vitality!"
            end

items:
  - name: "Health Potion"
    description: "A red potion"
    usable: true
    consumable: true
    scripts:
      on_use: |
        player.heal(50)
        say "You drink the potion and feel better. (+50 HP)"

npcs:
  - name: "Old Sage"
    description: "A wise old man"
    scripts:
      on_talk: |
        if player.hasFlag("knows_sage_secret") then
          say "Ah, you've discovered my secret. Take this reward."
          player.addItem("Ancient Tome", 1)
          player.clearFlag("knows_sage_secret")
          player.setFlag("received_tome")
        else
          say "Greetings, traveler. Seek the hidden cave to the east."
        end
```

## Security Considerations

Scripts executing in a game environment need careful sandboxing:

1. **No File System Access** - Scripts cannot read/write files
2. **No Network Access** - Scripts cannot make HTTP requests
3. **No System Commands** - Scripts cannot execute shell commands
4. **Memory Limits** - Scripts have bounded memory allocation
5. **Execution Timeouts** - Scripts must complete within time limits
6. **API Whitelisting** - Only exposed game APIs are available
7. **Rate Limiting** - Prevent infinite loops and resource exhaustion

## Implementation Approaches

### Approach 1: Interpreter

Build a custom interpreter that executes scripts:

```typescript
class ScriptInterpreter {
  execute(script: string, context: ScriptContext): ScriptResult {
    const ast = this.parse(script);
    return this.evaluate(ast, context);
  }
}
```

### Approach 2: Transpilation

Transpile scripts to TypeScript and execute:

```typescript
class ScriptTranspiler {
  transpile(script: string): string {
    // Convert DSL to safe TypeScript
    return safeTypeScript;
  }
}
```

### Approach 3: Deno Workers

Execute scripts in isolated Deno workers:

```typescript
const worker = new Worker(
  new URL("./script_worker.ts", import.meta.url).href,
  { type: "module", deno: { permissions: "none" } }
);
worker.postMessage({ script, context });
```

## Builder Integration

Scripts could integrate with the existing builder pattern:

```typescript
// Current approach (TypeScript function)
textworld.room("Zone", "Room")
  .onEnter((player) => { /* TypeScript code */ })
  .build();

// New approach (string script)
textworld.room("Zone", "Room")
  .script("on_enter", `
    if player.health < player.maxHealth then
      player.heal(player.maxHealth - player.health)
      say "You feel refreshed!"
    end
  `)
  .build();

// Or load from file
textworld.room("Zone", "Room")
  .scriptFile("on_enter", "./scripts/healing_pool.lua")
  .build();
```

## Potential Script Examples

### Trapped Chest

```lua
-- Item: Trapped Chest (on_use)
if not player.hasFlag("chest_disarmed") then
  if chance(50) then
    player.damage(20)
    say "A dart shoots out! You take 20 damage."
  else
    say "Click. Nothing happens... this time."
  end
else
  player.addItem("Gold Coins", random(10, 50))
  say "You find some gold coins inside!"
  room.removeItem("Trapped Chest", 1)
end
```

### Day/Night Merchant

```lua
-- NPC: Merchant (on_talk)
local hour = world.getTime().hour

if hour >= 8 and hour < 20 then
  say "Welcome to my shop! What would you like to buy?"
  -- trigger shop interface
else
  say "The shop is closed. Come back between 8am and 8pm."
end
```

### Progressive Puzzle Room

```lua
-- Room: Puzzle Chamber (on_enter)
local levers_pulled = 0

if player.hasFlag("lever_1") then levers_pulled = levers_pulled + 1 end
if player.hasFlag("lever_2") then levers_pulled = levers_pulled + 1 end
if player.hasFlag("lever_3") then levers_pulled = levers_pulled + 1 end

if levers_pulled == 3 then
  say "The door to the treasure room slides open!"
  room.setExitHidden("north", false)
elseif levers_pulled > 0 then
  say "You hear machinery rumbling. " .. levers_pulled .. " of 3 levers activated."
end
```

### Companion NPC

```lua
-- NPC: Faithful Dog (on_tick)
if player.location.room ~= npc.location.room then
  -- Follow player
  npc.teleport(player.location.zone, player.location.room)
  say "Your dog catches up to you, tail wagging."
end

-- Random ambient actions
if chance(10) then
  local actions = {
    "Your dog sniffs the ground curiously.",
    "Your dog barks happily.",
    "Your dog sits and scratches behind its ear."
  }
  say actions[random(1, #actions)]
end
```

## Conclusion

A scripting system would significantly enhance TextWorld's flexibility and accessibility. The key decisions to make are:

1. **Language Choice** - DSL vs Lua vs JavaScript subset
2. **Security Model** - How to safely sandbox scripts
3. **Performance** - Interpreted vs compiled/transpiled
4. **Tooling** - Editor support, debugging, error messages
5. **Migration Path** - How to support both code and scripts

The builder pattern already in place provides a natural integration point, and the existing action system (onEnter, onUse, etc.) maps directly to script attachment points.
