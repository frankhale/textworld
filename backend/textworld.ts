// A Text Adventure Library & Game for Deno
// Frank Hale &lt;frankhaledevelops AT gmail.com&gt;
// 7 September 2024

// TODO:
//
// - Make room objects the same as NPCs and Mobs, you add them to the world and
// then place them in a room.
// - Add rest of the support for multiplayer
// - Rooms now have a players array, this is for multiplayer support and will
// need to be populated when players switch rooms or join the game.
// - Add support for instancing (items, npcs, mobs, etc...) to support
// multiplayer

export const player_progress_db_name = "game_saves.db";
export const input_character_limit = 256;
export const active_quest_limit = 5;

export type Action<T = void> = (player: Player) => T | string | null;
export type ActionDecision = (player: Player) => boolean;
export type CommandParserAction = (
  player: Player,
  input: string,
  command: string,
  args: string[],
) => string | Promise<string>;
export type SpawnLocationAction = (spawn_location: SpawnLocation) => void;

///////////////////////////////
// CORE GAME DATA STRUCTURES //
///////////////////////////////

export interface Description {
  flag: string;
  description: string;
}

export interface Id {
  id: string;
}

export interface Entity extends Id {
  name: string;
  descriptions: Description[];
}

export interface Parent {
  name: string;
}

export interface GameMessage {
  player_id: string;
  command: string;
}

export interface Storage {
  items: Drop[];
}

export interface ResourceAmount {
  current: number;
  max: number;
}

export interface Stats {
  health: ResourceAmount;
  stamina: ResourceAmount;
  magicka: ResourceAmount;
  physical_damage: number;
  physical_defense: number;
  spell_damage: number;
  spell_defense: number;
  critical_chance: number;
  progress: Level;
}

export interface Race {
  name: string;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
}

export interface Actor extends Entity, Storage {
  dialog?: Dialog[] | null;
  vendor_items?: VendorItem[] | null;
  killable?: boolean;
  flags: string[];
  stats?: Stats;
  race?: Race; // TODO: Currently not being used
}

export interface Player extends Actor {
  score: number;
  gold: number;
  zone: string;
  room: string;
  quests: string[];
  quests_completed: string[];
  known_recipes: string[];
}

export interface Recipe extends Entity {
  ingredients: Drop[];
  crafted_item: Drop;
}

export interface Level {
  level: number;
  xp: number;
}

export interface VendorItem {
  name: string;
  price: number;
}

export interface Dialog extends Parent {
  trigger: string[];
  response: string | null;
}

export interface Item extends Entity {
  usable: boolean;
}

export interface Exit {
  name: string;
  location: string;
  hidden: boolean;
}

export interface Drop {
  name: string;
  quantity: number;
}

export interface Room extends Entity, Storage {
  zone_start: boolean;
  npcs: Actor[];
  exits: Exit[];
  mobs: Actor[];
  objects: Actor[];
  players: Player[];
}

export interface Zone {
  name: string;
  rooms: Room[];
}

export interface World {
  zones: Zone[];
  items: Item[];
  recipes: Recipe[];
  npcs: Actor[];
  mobs: Actor[];
  objects: Actor[];
  players: Player[];
  quests: Quest[];
  level_data: Level[];
}

export interface QuestStep extends Entity {
  complete: boolean;
}

export interface Quest extends Entity {
  complete: boolean;
  steps: QuestStep[] | null;
}

export interface PlayerProgress {
  player: Player;
  world: World;
}

//////////////////////
// RESPONSE OBJECTS //
//////////////////////

export interface CommandResponse {
  response: string;
  exits?: string;
  npcs?: string;
  mobs?: string;
  objects?: string;
}

////////////////////
// ACTION OBJECTS //
////////////////////

export interface QuestAction extends Parent {
  start: Action | null;
  end: Action | null;
}

export interface QuestStepAction extends Parent {
  action: ActionDecision;
}

type QuestActionType = "Start" | "End";

export interface CommandAction extends Entity, Parent {
  synonyms: string[];
  action: CommandParserAction;
}

export interface DialogAction extends Parent {
  trigger: string[];
  action: CommandParserAction;
}

export interface ItemAction extends Parent {
  action: Action;
}

export interface RoomAction extends Parent {
  actions: Action[] | null;
}

export interface RoomCommandActions extends Parent {
  command_actions: CommandAction[];
}

export interface SpawnLocation {
  name: string;
  zone: string;
  room: string;
  interval: number;
  active: boolean;
  timer_id: number;
  timer: () => void;
  action: (spawn_location: SpawnLocation) => void;
}

export interface WorldActions {
  spawn_locations: SpawnLocation[];
  dialog_actions: DialogAction[];
  item_actions: ItemAction[];
  room_actions: RoomAction[];
  room_command_actions: RoomCommandActions[];
  quest_actions: QuestAction[];
  quest_step_actions: QuestStepAction[];
}

export class TextWorld {
  private world: World = this.reset_world();
  private world_actions: WorldActions = this.reset_world_actions();
  private main_command_actions: CommandAction[] = [
    this.create_command_action(
      "movement action",
      "Commands for moving around the world.",
      ["north", "south", "east", "west"],
      (player, _input, command, _args) =>
        JSON.stringify(this.switch_room(player, command)),
    ),
    this.create_command_action(
      "take action",
      "Take an item from the room or an NPC.",
      ["take", "get"],
      (player, _input, _command, args) =>
        JSON.stringify(this.take_item(player, args)),
    ),
    this.create_command_action(
      "use action",
      "Use an item in your inventory.",
      ["use"],
      (player, _input, _command, args) =>
        JSON.stringify(this.use_item(player, args)),
    ),
    this.create_command_action(
      "drop action",
      "Drop an item or all your items from your inventory.",
      ["drop"],
      (player, _input, _command, args) =>
        JSON.stringify(this.drop_item(player, args)),
    ),
    this.create_command_action(
      "look action",
      "Look around the room or at yourself.",
      ["look", "l"],
      (player, input, command, args) =>
        JSON.stringify(this.look(player, input, command, args)),
    ),
    this.create_command_action(
      "look self action",
      "Look at yourself.",
      ["ls"],
      (player, input, _command, _args) =>
        JSON.stringify(this.look(player, input, "look self", ["look", "self"])),
    ),
    this.create_command_action(
      "examine action",
      "Examine an object in a room.",
      ["examine", "x"],
      (player, input, command, args) =>
        JSON.stringify(
          this.look_at_or_examine_object(player, input, command, args),
        ),
    ),
    this.create_command_action(
      "inspect action",
      "Inspect a room to see what items are there.",
      ["inspect", "i", "search"],
      (player, _input, _command, _args) =>
        JSON.stringify(this.inspect_room(player)),
    ),
    this.create_command_action(
      "map action",
      "Plot a map showing nearby rooms.",
      ["map"],
      (player, _input, _command, _args) =>
        JSON.stringify(this.plot_room_map(player, 5)),
    ),
    this.create_command_action(
      "show action",
      "Show an item in your inventory.",
      ["show"],
      (player, _input, _command, args) =>
        JSON.stringify(this.show(player, args)),
    ),
    this.create_command_action(
      "talk to action",
      "Talk to an NPC or Vendor.",
      ["talk to", "tt"],
      (player, input, command, args) =>
        JSON.stringify(this.talk_to_npc(player, input, command, args)),
    ),
    this.create_command_action(
      "goto action",
      "Go to a room or zone.",
      ["goto"],
      (player, _input, _command, args) =>
        JSON.stringify(this.goto(player, args)),
    ),
    this.create_command_action(
      "help action",
      "Show the help text.",
      ["help"],
      (player, _input, _command, _args) =>
        JSON.stringify(this.get_help(player)),
    ),
    this.create_command_action(
      "attack action",
      "Attack a mob.",
      ["attack"],
      (player, _input, _command, args) =>
        JSON.stringify(this.initiate_attack(player, args, true)),
    ),
    this.create_command_action(
      "craft action",
      "Craft an item.",
      ["craft"],
      (player, _input, _command, args) =>
        JSON.stringify(this.craft_recipe(player, args)),
    ),
  ];
  private main_async_command_actions: CommandAction[] = [
    this.create_command_action(
      "save action",
      "Save player progress.",
      ["save"],
      async (player, _input, _command, args) => {
        let result = {
          response: "You must specify a slot name",
        };
        if (args.length >= 0) {
          result = await this.save_player_progress(
            player,
            player_progress_db_name,
            args[0],
          );
        }
        return JSON.stringify(result);
      },
    ),
    this.create_command_action(
      "load action",
      "Load player progress.",
      ["load"],
      async (player, _input, _command, args) => {
        let result = {
          response: "You must specify a slot name",
        };
        if (args.length > 0) {
          const player_result = await this.load_player_progress(
            player_progress_db_name,
            args[0],
          );

          if (player_result) {
            result = {
              response: `Progress has been loaded from slot: ${args[0]}`,
            };
            Object.assign(player, player_result.player);
            this.world = player_result.world;
          } else {
            result = {
              response: `Unable to load progress from slot: ${args[0]}`,
            };
          }
        }
        return JSON.stringify(result);
      },
    ),
  ];
  private player_dead_command_actions: CommandAction[] = [
    this.create_command_action(
      "help action",
      "Show the help text.",
      ["help"],
      (player, _input, _command, _args) =>
        JSON.stringify(this.get_help(player)),
    ),
    this.create_command_action(
      "resurrect action",
      "resurrect yourself.",
      ["resurrect", "rez"],
      (player, _input, _command, _args) => {
        this.set_player_room_to_zone_start(player, player.zone);
        return JSON.stringify(this.resurrect_actor(player));
      },
    ),
  ];

  ////////////
  // PLAYER //
  ////////////

  /**
   * Creates a new player and adds it to the world.
   *
   * @param {string} name
   * @param {string} description
   * @param {string} zone_name
   * @param {string} room_name
   */
  create_player(
    name: string,
    description: string,
    zone_name: string,
    room_name: string,
  ) {
    const stats = this.create_stats(
      { current: 10, max: 10 },
      { current: 10, max: 10 },
      { current: 10, max: 10 },
      10,
      10,
      10,
      10,
      0.05,
      { level: 1, xp: 0 },
    );

    const player: Player = {
      id: crypto.randomUUID(),
      race: {
        // FIXME: Don't hard code this
        name: "Human",
        dexterity: 1,
        constitution: 1,
        intelligence: 1,
        wisdom: 1,
        charisma: 1,
      },
      name,
      descriptions: [{ flag: "default", description }],
      score: 0,
      stats,
      gold: 0,
      zone: zone_name,
      room: room_name,
      flags: [],
      items: [],
      quests: [],
      quests_completed: [],
      known_recipes: [],
    };

    this.world.players.push(player);
    return player;
  }

  /**
   * Resurrects an actor by setting their health to max.
   *
   * @param {Actor} actor
   * @returns {CommandResponse}
   */
  resurrect_actor(actor: Actor): CommandResponse {
    if (!actor.stats) {
      throw new Error("Actor does not have stats.");
    }

    actor.stats.health.current = actor.stats.health.max;
    actor.stats.stamina.current = actor.stats.stamina.max;
    actor.stats.magicka.current = actor.stats.magicka.max;

    return {
      response: `${actor.name} has been resurrected.`,
    };
  }

  /**
   * Gets the player object from the world.
   *
   * @param {string} id
   * @returns {Player | null}
   */
  get_player(id: string): Player | null {
    return this.world.players.find((player) => player.id === id) || null;
  }

  /**
   * Removes a player from the world.
   *
   * @param {Player} player
   */
  remove_player(player: Player) {
    this.world.players = this.world.players.filter(
      (p) => p.name !== player.name,
    );
  }

  /**
   * Gets players zone.
   *
   * @param {Player} player
   * @returns {Zone | null}
   */
  get_player_zone(player: Player): Zone | null {
    return this.world.zones.find((zone) => zone.name === player.zone) || null;
  }

  /**
   * Gets players room.
   *
   * @param {Player} player
   * @returns {Room | null}
   */
  get_player_room(player: Player): Room | null {
    const zone = this.get_player_zone(player);
    return (
      zone?.rooms.find(
        (room) => room.name.toLowerCase() === player.room.toLowerCase(),
      ) || null
    );
  }

  /**
   * Gets the players description.
   *
   * @param {Player} player
   * @returns {string}
   */
  look_self(player: Player): string {
    let description = this.get_description(player, player, "default");

    if (!description) {
      description = "You don't really like looking at yourself.";
    }

    if (player.items.length === 0) {
      return description;
    }

    const inventory = player.items
      .map((item) => `${item.name} (${item.quantity})`)
      .join(", ");

    return `${description}\n\nInventory: ${inventory}`;
  }

  /**
   * Sets the players room to the zone start room.
   *
   * @param {Player} player
   * @param {string} zone_name
   */
  set_player_room_to_zone_start(player: Player, zone_name: string) {
    const room = this.get_zone_starter_room(zone_name);
    if (room) {
      player.zone = zone_name;
      player.room = room.name;
    } else {
      throw new Error(`Zone ${zone_name} does not have a starter room.`);
    }
  }

  /**
   * Sets the players zone and room.
   *
   * @param {Player} player
   * @param {string} zone_name
   * @param {string} room_name
   */
  set_player_zone_and_room(
    player: Player,
    zone_name: string,
    room_name: string,
  ) {
    const room = this.get_room(zone_name, room_name);

    if (room) {
      player.zone = zone_name;
      player.room = room_name;
    }
  }

  ///////////
  // ACTOR //
  ///////////

  /**
   * Sets an actors health.
   *
   * @param {Actor} actor
   * @param {number} health
   */
  set_actor_health(actor: Actor, health: number) {
    if (actor.stats) {
      actor.stats.health.current = health;
      if (actor.stats.health.current > actor.stats.health.max) {
        actor.stats.health.current = actor.stats.health.max;
      }
    }
  }

  /**
   * Increase an actors max health.
   *
   * @param {Actor} actor
   * @param {number} amount
   */
  increase_actor_max_heath(actor: Actor, amount: number) {
    if (actor.stats) {
      actor.stats.health.max += amount;
    }
  }

  /**
   * Sets an actors max health.
   *
   * @param {Actor} actor
   */
  set_actor_health_to_max(actor: Actor) {
    if (actor.stats) {
      actor.stats.health.current = actor.stats.health.max;
    }
  }

  /**
   * Adds health to an actor.
   *
   * @param {Actor} actor
   * @param {number} amount
   */
  add_to_actor_health(actor: Actor, amount: number) {
    if (actor.stats) {
      actor.stats.health.current = Math.min(
        actor.stats.health.current + amount,
        actor.stats.health.max,
      );
    }
  }

  /**
   * Checks if an actor's health is full.
   *
   * @param {Actor} actor
   * @returns {boolean}
   */
  is_actor_health_full(actor: Actor): boolean {
    return actor.stats?.health.current === actor.stats?.health.max;
  }

  /**
   * Gets an actors health.
   *
   * @param actor
   * @returns {number}
   */
  get_actor_health(actor: Actor): number {
    return actor.stats?.health.current ?? 0;
  }

  ///////////
  // QUEST //
  ///////////

  /**
   * Creates a new quest and adds it to the world.
   *
   * @param {string} name
   * @param {string} description
   */
  create_quest(name: string, description: string) {
    this.world.quests.push({
      id: crypto.randomUUID(),
      name,
      descriptions: [{ flag: "default", description }],
      complete: false,
      steps: null,
    });
  }

  /**
   * Gets a quest action.
   *
   * @param {string} quest_name
   * @returns {QuestAction | null}
   */
  get_quest_action(
    quest_name: string,
  ): QuestAction | null {
    const quest = this.get_quest(quest_name);
    if (!quest) return null;

    return (
      this.world_actions.quest_actions.find(
        (quest_action) => quest_action.name === quest.name,
      ) || null
    );
  }

  /**
   * Gets a quest step action.
   *
   * @param {string} quest_name
   * @param {string} name
   * @returns {QuestStepAction | null}
   */
  get_quest_step_action(
    quest_name: string,
    name: string,
  ): QuestStepAction | null {
    const quest_step = this.get_quest_step(quest_name, name);
    if (!quest_step) return null;

    return (
      this.world_actions.quest_step_actions.find(
        (quest_step_action) => quest_step_action.name === quest_step.name,
      ) || null
    );
  }

  /**
   * Adds an action to a quest.
   *
   * @param {string} quest_name
   * @param {QuestActionType} action_type
   * @param {Action | null} action
   * @throws {Error}
   */
  add_quest_action(
    quest_name: string,
    action_type: QuestActionType,
    action: Action | null,
  ) {
    const quest = this.get_quest(quest_name);
    if (!quest) {
      throw new Error(`Quest ${quest_name} does not exist.`);
    }

    let quest_action = this.world_actions.quest_actions.find(
      (qa) => qa.name === quest_name,
    );

    if (!quest_action) {
      quest_action = {
        name: quest_name,
        start: null,
        end: null,
      };
      this.world_actions.quest_actions.push(quest_action);
    } else {
      if (
        (quest_action.start && action_type === "Start") ||
        (quest_action.end && action_type === "End")
      ) {
        throw new Error(
          `Quest ${quest_name} already has an action for ${action_type}.`,
        );
      }
    }

    if (action_type === "Start") {
      quest_action.start = action;
    } else {
      quest_action.end = action;
    }
  }

  /**
   * Adds a step to a quest.
   *
   * @param {string} quest_name
   * @param {string} name
   * @param {string} description
   * @param {ActionDecision | null} action
   */
  add_quest_step(
    quest_name: string,
    name: string,
    description: string,
    action: ActionDecision | null = null,
  ) {
    const quest = this.get_quest(quest_name);
    if (!quest) {
      throw new Error(`Quest ${quest_name} does not exist.`);
    }

    if (!quest.steps) quest.steps = [];

    const quest_step = {
      id: crypto.randomUUID(),
      name,
      descriptions: [{ flag: "default", description }],
      complete: false,
    };

    quest.steps.push(quest_step);

    if (action) {
      const existingAction = this.world_actions.quest_step_actions.find(
        (qa) => qa.name === name,
      );

      if (!existingAction) {
        this.world_actions.quest_step_actions.push({
          name,
          action,
        });
      }
    }
  }

  /**
   * Gets a quest.
   *
   * @param {string} name
   * @returns {Quest | null}
   */
  get_quest(name: string): Quest | null {
    return (
      this.world.quests.find(
        (quest) => quest.name.toLowerCase() === name.toLowerCase(),
      ) || null
    );
  }

  /**
   * Gets a quest step.
   *
   * @param {string} quest_name
   * @param {string} name
   * @returns {QuestStep | null}
   */
  get_quest_step(quest_name: string, name: string): QuestStep | null {
    const quest = this.get_quest(quest_name);
    return (
      quest?.steps?.find(
        (step) => step.name.toLowerCase() === name.toLowerCase(),
      ) || null
    );
  }

  /**
   * Pickup a quest.
   *
   * @param {Player} player
   * @param {string} quest_name
   * @returns {string}
   */
  pickup_quest(player: Player, quest_name: string): string {
    if (player.quests.length >= active_quest_limit) {
      return `You can't have more than ${active_quest_limit} active quests at a time.`;
    }

    const quest = this.get_quest(quest_name);
    if (!quest) return "The quest does not exist.";

    if (player.quests.includes(quest.name)) {
      return `You already have the quest ${quest.name}.`;
    }

    player.quests.push(quest.name);
    let result = `You picked up the quest ${quest.name}.`;

    const quest_action = this.get_quest_action(quest.name);
    if (quest_action?.start) {
      const quest_start_result = quest_action.start(player);
      if (quest_start_result) {
        result += `\n\n${quest_start_result}`;
      }
    }

    return result;
  }

  /**
   * Drop a quest.
   *
   * @param {Player} player
   * @param {string} quest_name
   * @returns {string}
   */
  drop_quest(player: Player, quest_name: string): string {
    const quest = this.get_quest(quest_name);

    if (!quest) {
      return `The quest ${quest_name} does not exist.`;
    }

    if (!player || !player.quests.includes(quest.name)) {
      return `You don't have the quest ${quest_name}.`;
    }

    player.quests = player.quests.filter((q) => q !== quest_name);
    return `You dropped the quest ${quest.name}.`;
  }

  /**
   * Check if a quest is complete.
   *
   * @param {Player} player
   * @param {string} quest_name
   * @returns {boolean}
   * @throws {Error}
   */
  is_quest_complete(player: Player, quest_name: string): boolean {
    const quest = this.get_quest(quest_name);
    if (!quest) {
      throw new Error(`The quest ${quest_name} does not exist.`);
    }

    if (player.quests_completed.includes(quest.name)) {
      return true;
    }

    if (!player.quests.includes(quest.name)) {
      return false;
    }

    if (!quest.steps) {
      throw new Error(`The quest ${quest_name} does not have any steps.`);
    }

    const allStepsComplete = quest.steps.every((step) => {
      const quest_step_action = this.get_quest_step_action(
        quest.name,
        step.name,
      );
      if (!step.complete) {
        if (quest_step_action) {
          return quest_step_action.action(player);
        }
      }
      return step.complete;
    });

    if (allStepsComplete) {
      const quest_action = this.get_quest_action(quest.name);
      quest_action?.end?.(player);

      if (!player.quests_completed.includes(quest.name)) {
        player.quests = player.quests.filter((q) => q !== quest_name);
        player.quests_completed.push(quest.name);
      }
    }

    return allStepsComplete;
  }

  /**
   * Get quest progress.
   *
   * @param {Player} player
   * @param {Quest} quest_name
   * @returns {string}
   * @throws {Error}
   */
  get_quest_progress(player: Player, quest_name: string): string {
    const quest = this.get_quest(quest_name);

    if (!quest) {
      throw new Error(`The quest ${quest_name} does not exist.`);
    }

    if (!player.quests.includes(quest.name)) {
      return `You don't have the quest ${quest_name}.`;
    }

    let result = `Quest: ${quest.name}\n\n${
      this.get_description(
        player,
        quest,
        "default",
      )
    }\n\n`;

    if (quest.steps) {
      quest.steps.forEach((step) => {
        const quest_step_action = this.get_quest_step_action(
          quest.name,
          step.name,
        );
        if (quest_step_action && !step.complete) {
          step.complete = quest_step_action.action(player);
        }
        result += `${step.complete ? "[x]" : "[ ]"} ${step.name}\n`;
      });
    }

    return result;
  }

  /**
   * Shows all quests player is currently on.
   *
   * @param {Player} player
   * @returns {CommandResponse}
   */
  show_quests(player: Player): CommandResponse {
    if (!player || player.quests.length === 0) {
      return {
        response: "You have no quests.",
      };
    }

    const quests_description = player.quests.map((player_quest) => {
      const quest = this.world.quests.find(
        (quest) => quest.name === player_quest,
      );
      if (quest) {
        return `${quest.name} - ${
          this.get_description(
            player,
            quest,
            "default",
          )
        }`;
      }
    });

    return {
      response: quests_description.join("\n\n"),
    };
  }

  /////////
  // NPC //
  /////////

  /**
   * Creates a new NPC and adds it to the world.
   *
   * @param {string} name
   * @param {string} description
   */
  create_npc(name: string, description: string) {
    this.world.npcs.push({
      id: crypto.randomUUID(),
      name,
      descriptions: [{ flag: "default", description }],
      items: [],
      killable: false,
      dialog: null,
      vendor_items: null,
      flags: [],
    });
  }

  /**
   * Removes a new NPC from the world.
   *
   * @param {string} name
   */
  remove_npc(name: string) {
    const npcLowerCaseName = name.toLowerCase();
    this.world.zones.forEach((zone) => {
      zone.rooms.forEach((room) => {
        room.npcs = room.npcs.filter(
          (npc) => npc.name.toLowerCase() !== npcLowerCaseName,
        );
      });
    });

    this.world.npcs = this.world.npcs.filter(
      (npc) => npc.name.toLowerCase() !== npcLowerCaseName,
    );
  }

  /**
   * Gets an NPC.
   *
   * @param {string} name
   * @returns {Actor | null}
   */
  get_npc(name: string): Actor | null {
    return (
      this.world.npcs.find(
        (npc) => npc.name.toLowerCase() === name.toLowerCase(),
      ) || null
    );
  }

  /**
   * Places an NPC in a zone and room.
   *
   * @param {string} zone_name
   * @param {string} in_room_name
   * @param {string} npc_name
   */
  place_npc(zone_name: string, in_room_name: string, npc_name: string) {
    const in_room = this.get_room(zone_name, in_room_name);
    const npc = this.get_npc(npc_name);

    if (!in_room || !npc) {
      throw new Error(
        `Room ${in_room_name} or NPC ${npc_name} does not exist.`,
      );
    }

    in_room.npcs.push(npc);
  }

  /**
   * Gets an NPC in a room.
   *
   * @param {string} zone_name
   * @param {string} room_name
   * @param {string} npc_name
   * @returns {Actor | null}
   */
  get_room_npc(
    zone_name: string,
    room_name: string,
    npc_name: string,
  ): Actor | null {
    const zone = this.get_zone(zone_name);
    if (!zone) return null;

    const room = zone.rooms.find(
      (room) => room.name.toLowerCase() === room_name.toLowerCase(),
    );
    if (!room) return null;

    return (
      room.npcs.find(
        (npc) => npc.name.toLowerCase() === npc_name.toLowerCase(),
      ) || null
    );
  }

  /**
   * Talk to an NPC.
   *
   * @param player
   * @param input
   * @param command
   * @param args
   * @returns {CommandResponse}
   */
  talk_to_npc(
    player: Player,
    input: string,
    command: string,
    args: string[],
  ): CommandResponse {
    const zone = this.get_player_zone(player);
    if (!zone) {
      throw new Error("Player is not in a valid zone.");
    }

    if (args.length === 0) {
      return {
        response: "You must specify an NPC to talk to.",
      };
    }

    const possible_triggers = this.generate_combinations(args);
    const current_room = this.get_player_room(player);

    if (!current_room) {
      return {
        response: "You are not in a valid room.",
      };
    }

    const npc = this.world.npcs.find((npc) =>
      possible_triggers.some(
        (trigger) => npc.name.toLowerCase() === trigger.toLowerCase(),
      )
    );

    if (!npc || !current_room.npcs.includes(npc)) {
      return {
        response: "That NPC does not exist.",
      };
    }

    if (!npc.dialog) {
      return {
        response: `${npc.name} does not want to talk to you.`,
      };
    }

    const dialog = npc.dialog.find((dialog) =>
      dialog.trigger.some((trigger) => possible_triggers.includes(trigger))
    );

    if (!dialog) {
      return {
        response: "hmm...",
      };
    }

    const dialog_action = this.world_actions.dialog_actions.find(
      (action) => action.trigger === dialog.trigger,
    );

    if (dialog_action) {
      return {
        response: dialog_action.action(player, input, command, args) as string,
      };
    }

    return {
      response: dialog.response || "hmm...",
    };
  }

  ////////////
  // VENDOR //
  ////////////

  /**
   * Creates a new vendor and adds it to the world.
   *
   * @param {string} name
   * @param {string} description
   * @param {VendorItem[]} vendor_items
   */
  create_vendor(name: string, description: string, vendor_items: VendorItem[]) {
    const vendor = {
      id: crypto.randomUUID(),
      name,
      descriptions: [{ flag: "default", description }],
      inventory: [],
      killable: false,
      dialog: [],
      vendor_items,
      items: [],
      flags: [],
    };
    this.world.npcs.push(vendor);

    this.create_dialog(
      name,
      ["items"],
      null,
      (_player, _input, _command, _args) => {
        const items = vendor_items.map(
          (vendor_item) => `${vendor_item.name} (${vendor_item.price} gold)`,
        );
        return `Items for sale: ${items.join(", ")}`;
      },
    );

    this.create_dialog(
      name,
      ["purchase", "buy"],
      null,
      (player, input, _command, _args) => {
        if (!input) {
          return "You must specify an item to purchase.";
        }

        const command_bits = input.split(" ");
        const trigger_word_index = command_bits.lastIndexOf("purchase") >= 0
          ? command_bits.lastIndexOf("purchase")
          : command_bits.lastIndexOf("buy");

        if (
          trigger_word_index === -1 ||
          trigger_word_index === command_bits.length - 1
        ) {
          return "You must specify an item to purchase.";
        }

        const item_name = command_bits.slice(trigger_word_index + 1).join(" ");
        return this.purchase_from_vendor(player, name, item_name);
      },
    );
  }

  /**
   * Purchase an item from a vendor.
   *
   * @param {Player} player
   * @param {string} vendor_name
   * @param {string} item_name
   * @returns {string}
   */
  purchase_from_vendor(
    player: Player,
    vendor_name: string,
    item_name: string,
  ): string {
    const npc = this.get_npc(vendor_name);
    if (!npc || !npc.vendor_items) {
      return "That vendor does not exist.";
    }

    const vendor_item = npc.vendor_items.find(
      (item) => item.name.toLowerCase() === item_name.toLowerCase(),
    );
    const item = this.world.items.find(
      (item) => item.name.toLowerCase() === item_name.toLowerCase(),
    );

    if (!vendor_item || !item) {
      return "That item does not exist.";
    }

    if (player.gold < vendor_item.price) {
      return `You don't have enough gold to purchase ${item_name}.`;
    }

    player.gold -= vendor_item.price;
    const player_item = player.items.find(
      (i) => i.name.toLowerCase() === vendor_item.name.toLowerCase(),
    );

    if (player_item) {
      player_item.quantity += 1;
    } else {
      player.items.push({ name: vendor_item.name, quantity: 1 });
    }

    return `You purchased ${vendor_item.name} for ${vendor_item.price} gold.`;
  }

  //////////
  // ITEM //
  //////////

  /**
   * Creates a new item and adds it to the world.
   *
   * @param {string} name
   * @param {string} description
   * @param {boolean} usable
   * @param {Action | null} action
   */
  create_item(
    name: string,
    description: string,
    usable: boolean,
    action: Action | null = null,
  ) {
    const item = {
      id: crypto.randomUUID(),
      name,
      descriptions: [{ flag: "default", description }],
      usable,
    };

    this.world.items.push(item);

    if (action) {
      this.world_actions.item_actions.push({
        name,
        action,
      });
    }
  }

  /**
   * Adds an item to a room that can be picked up by a player.
   *
   * @param player
   * @param item_drops
   */
  add_item_drops_to_room(player: Player, item_drops: Drop[]) {
    const current_room = this.get_player_room(player);
    if (!current_room) return;

    item_drops.forEach((item_drop) => {
      const room_item = current_room.items.find(
        (room_item) => room_item.name === item_drop.name,
      );

      if (room_item) {
        room_item.quantity += item_drop.quantity;
      } else {
        current_room.items.push({ ...item_drop });
      }
    });
  }

  /**
   * Gets an item in a room.
   *
   * @param {string} zone_name
   * @param {string} room_name
   * @param {string} item_name
   * @returns {Drop | null}
   */
  get_room_item(
    zone_name: string,
    room_name: string,
    item_name: string,
  ): Drop | null {
    const zone = this.get_zone(zone_name);
    if (!zone) return null;

    const room = zone.rooms.find(
      (room) => room.name.toLowerCase() === room_name.toLowerCase(),
    );
    if (!room) return null;

    return (
      room.items.find(
        (item) => item.name.toLowerCase() === item_name.toLowerCase(),
      ) || null
    );
  }

  /**
   * Places an item in a room.
   *
   * @param {string} zone_name
   * @param {string} in_room_name
   * @param {string} item_name
   * @param {number} quantity
   */
  place_item(
    zone_name: string,
    in_room_name: string,
    item_name: string,
    quantity = 1,
  ) {
    const zone = this.get_zone(zone_name);
    if (!zone) {
      throw new Error(`Zone ${zone_name} does not exist.`);
    }

    const in_room = zone.rooms.find(
      (room) => room.name.toLowerCase() === in_room_name.toLowerCase(),
    );

    if (!in_room) {
      throw new Error(
        `Room ${in_room_name} does not exist in zone ${zone_name}.`,
      );
    }

    const room_item = in_room.items.find(
      (item) => item.name.toLowerCase() === item_name.toLowerCase(),
    );

    if (room_item) {
      room_item.quantity += quantity;
    } else {
      in_room.items.push({
        name: item_name,
        quantity,
      });
    }
  }

  /**
   * Gets an item.
   *
   * @param {string} name
   * @returns {Item | null}
   */
  get_item(name: string): Item | null {
    return (
      this.world.items.find(
        (item) => item.name.toLowerCase() === name.toLowerCase(),
      ) || null
    );
  }

  /**
   * Gets an item action.
   *
   * @param {string} name
   * @returns {ItemAction | null}
   */
  get_item_action(name: string): ItemAction | null {
    const item = this.get_item(name);
    if (!item) return null;

    return (
      this.world_actions.item_actions.find(
        (item_action) =>
          item_action.name.toLowerCase() === item.name.toLowerCase(),
      ) || null
    );
  }

  /**
   * Checks if a player has an item.
   *
   * @param {Player} player
   * @param {string} item_name
   * @returns {boolean}
   */
  has_item(player: Player, item_name: string): boolean {
    return player.items.some(
      (item) => item.name.toLowerCase() === item_name.toLowerCase(),
    );
  }

  /**
   * Checks if a player has an item in a certain quantity.
   *
   * @param {Player} player
   * @param {string} item_name
   * @param {number} quantity
   * @returns {boolean}
   */
  has_item_in_quantity(
    player: Player,
    item_name: string,
    quantity: number,
  ): boolean {
    const item = player.items.find(
      (item) => item.name.toLowerCase() === item_name.toLowerCase(),
    );

    return item ? item.quantity >= quantity : false;
  }

  /**
   * Takes an item from a room.
   *
   * @param Playerplayer
   * @param {string[]} args
   * @returns {CommandResponse}
   */
  take_item(player: Player, args: string[]): CommandResponse {
    const zone = this.get_player_zone(player);
    if (!zone) {
      return {
        response: "That item does not exist.",
      };
    }

    const current_room = zone.rooms.find((room) => room.name === player.room);
    if (!current_room) {
      return {
        response: "That item does not exist.",
      };
    }

    const possible_items = this.generate_combinations(args);

    if (possible_items.includes("all")) {
      return this.take_all_items(player);
    }

    const room_item = current_room.items.find((item) =>
      possible_items.some(
        (possible_item) =>
          item.name.toLowerCase() === possible_item.toLowerCase(),
      )
    );

    if (!room_item) {
      return {
        response: "That item does not exist.",
      };
    }

    const player_item = player.items.find(
      (item) => item.name.toLowerCase() === room_item.name.toLowerCase(),
    );

    if (player_item) {
      player_item.quantity += room_item.quantity;
    } else {
      player.items.push({
        name: room_item.name,
        quantity: room_item.quantity,
      });
    }

    current_room.items = current_room.items.filter(
      (item) => item.name.toLowerCase() !== room_item.name.toLowerCase(),
    );

    return {
      response: `You took the ${room_item.name}.`,
    };
  }

  /**
   * Takes all items from a room.
   *
   * @param {Player} player
   * @returns {CommandResponse}
   */
  take_all_items(player: Player): CommandResponse {
    const current_room = this.get_player_zone(player)?.rooms.find(
      (room) => room.name === player.room,
    );

    if (!current_room || current_room.items.length === 0) {
      return {
        response: "There are no items to take.",
      };
    }

    current_room.items.forEach((room_item) => {
      const player_item = player.items.find(
        (pitem) => pitem.name.toLowerCase() === room_item.name.toLowerCase(),
      );

      if (player_item) {
        player_item.quantity += room_item.quantity;
      } else {
        player.items.push({ ...room_item });
      }
    });

    current_room.items = [];

    return {
      response: "You took all items.",
    };
  }

  /**
   * Uses an item.
   *
   * @param {Player} player
   * @param {string[]} args
   * @returns {CommandResponse}
   */
  use_item(player: Player, args: string[]): CommandResponse {
    const possible_items = this.generate_combinations(args);
    const player_item = player.items.find((item) =>
      possible_items.some(
        (possible_item) =>
          item.name.toLowerCase() === possible_item.toLowerCase(),
      )
    );

    if (!player_item) {
      return {
        response: "That item does not exist.",
      };
    }

    const item_definition = this.world.items.find(
      (item) => item.name.toLowerCase() === player_item.name.toLowerCase(),
    );

    if (!item_definition || !item_definition.usable) {
      return {
        response: "You can't use that item.",
      };
    }

    const item_action = this.world_actions.item_actions.find(
      (action) =>
        action.name.toLowerCase() === item_definition.name.toLowerCase(),
    );

    const result = item_action?.action(player) ??
      "You used the item but nothing happened.";

    if (this.has_flag(player, "prevent_item_consumption")) {
      this.remove_flag(player, "prevent_item_consumption");
    } else {
      player_item.quantity--;
      if (player_item.quantity === 0) {
        player.items = player.items.filter(
          (item) => item.name.toLowerCase() !== player_item.name.toLowerCase(),
        );
      }
    }

    return {
      response: result,
    };
  }

  /**
   * Removes an item from a player.
   *
   * @param {Player} player
   * @param {string} item_name
   */
  remove_player_item(player: Player, item_name: string) {
    const item_index = player.items.findIndex(
      (item) => item.name.toLowerCase() === item_name.toLowerCase(),
    );

    if (item_index !== -1) {
      player.items[item_index].quantity--;

      if (player.items[item_index].quantity === 0) {
        player.items.splice(item_index, 1);
      }
    }
  }

  /**
   * Removes an item from the world.
   *
   * @param {string} item_name
   */
  remove_item(item_name: string) {
    this.world.items = this.world.items.filter(
      (item) => item.name.toLowerCase() !== item_name.toLowerCase(),
    );
  }

  /**
   * Drops an item in a room.
   *
   * @param {Player} player
   * @param {string[]} args
   * @returns {CommandResponse}
   */
  drop_item(player: Player, args: string[]): CommandResponse {
    const zone = this.get_player_zone(player);
    if (!zone) {
      return {
        response: "That item does not exist.",
      };
    }

    const possible_items = this.generate_combinations(args);

    if (possible_items.includes("all")) {
      return this.drop_all_items(player);
    }

    const player_item = player.items.find((item) =>
      possible_items.some(
        (possible_item) =>
          item.name.toLowerCase() === possible_item.toLowerCase(),
      )
    );

    if (!player_item) {
      return {
        response: "That item does not exist.",
      };
    }

    const current_room = zone.rooms.find(
      (room) => room.name.toLowerCase() === player.room.toLowerCase(),
    );
    if (!current_room) {
      return {
        response: "You are not in a valid room.",
      };
    }

    current_room.items.push({
      name: player_item.name,
      quantity: player_item.quantity,
    });

    player.items = player.items.filter(
      (item) => item.name.toLowerCase() !== player_item.name.toLowerCase(),
    );

    return {
      response: `You dropped the ${player_item.name}.`,
    };
  }

  /**
   * Drops all items in a room.
   *
   * @param {Player} player
   * @returns {CommandResponse}
   */
  drop_all_items(player: Player): CommandResponse {
    const current_room = this.get_player_zone(player)?.rooms.find(
      (room) => room.name.toLowerCase() === player.room.toLowerCase(),
    );

    if (!current_room || player.items.length === 0) {
      return {
        response: "You have no items to drop.",
      };
    }

    current_room.items.push(...player.items);
    player.items = [];

    return {
      response: "You dropped all your items.",
    };
  }

  /**
   * Shows items or quests depending on the arguments passed.
   *
   * @example show quests, show all, show item_name
   *
   * @param {Player} player
   * @param {string[]} args
   * @returns {CommandResponse}
   */
  show(player: Player, args: string[]): CommandResponse {
    const possible_commands = this.generate_combinations(args);

    if (possible_commands.includes("quests")) {
      return this.show_quests(player);
    }

    if (possible_commands.includes("all")) {
      return this.show_all_items(player);
    }

    const player_item = player.items.find((item) =>
      possible_commands.some(
        (possible_item) =>
          item.name.toLowerCase() === possible_item.toLowerCase(),
      )
    );

    if (!player_item) {
      return {
        response: "That item does not exist.",
      };
    }

    const item = this.world.items.find(
      (item) => item.name.toLowerCase() === player_item.name.toLowerCase(),
    );

    if (!item) {
      return {
        response: "That item does not exist in the world.",
      };
    }

    return {
      response: this.get_description(player, item, "default") ||
        "No description available.",
    };
  }

  /**
   * Shows all items a player has.
   *
   * @param {Player} player
   * @returns {CommandResponse}
   */
  show_all_items(player: Player): CommandResponse {
    if (player.items.length === 0) {
      return {
        response: "You have no items to show.",
      };
    }

    const items_description = player.items
      .map((item) => {
        const item_definition = this.world.items.find(
          (item_definition) =>
            item_definition.name.toLowerCase() === item.name.toLowerCase(),
        );
        return item_definition
          ? `${item_definition.name} - ${
            this.get_description(
              player,
              item_definition,
              "default",
            )
          }`
          : null;
      })
      .filter(Boolean);

    return {
      response: items_description.length > 0
        ? items_description.join("\n\n")
        : "You have no items to show.",
    };
  }

  /////////
  // MOB //
  /////////

  /**
   * Creates a new mob and adds it to the world.
   *
   * @param {string} name
   * @param {string} description
   * @param {string} stats
   * @param {Drop[]} items
   */
  create_mob(name: string, description: string, stats: Stats, items: Drop[]) {
    const mob: Actor = {
      id: crypto.randomUUID(),
      name,
      descriptions: [{ flag: "default", description }],
      stats,
      killable: true,
      items,
      flags: [],
    };
    this.world.mobs.push(mob);
    return mob;
  }

  /**
   * Gets a mob.
   *
   * @param {string} name
   * @returns {Actor | null}
   */
  get_mob(name: string): Actor | null {
    return (
      this.world.mobs.find(
        (mob) => mob.name.toLowerCase() === name.toLowerCase(),
      ) || null
    );
  }

  /**
   * Places a mob in a zone and room.
   *
   * @param {string} zone_name
   * @param {string} in_room_name
   * @param {string} mob_name
   * @throws {Error}
   */
  place_mob(zone_name: string, in_room_name: string, mob_name: string) {
    const in_room = this.get_room(zone_name, in_room_name);
    const mob = this.get_mob(mob_name);

    if (!in_room) {
      throw new Error(
        `Room ${in_room_name} does not exist in zone ${zone_name}.`,
      );
    }

    if (!mob) {
      throw new Error(`MOB ${mob_name} does not exist.`);
    }

    in_room.mobs.push(structuredClone(mob));
  }

  /**
   * Gets a mob in a room.
   *
   * @param {string} zone_name
   * @param {string} room_name
   * @param {string} mob_name
   * @returns {Actor | null}
   */
  get_room_mob(
    zone_name: string,
    room_name: string,
    mob_name: string,
  ): Actor | null {
    const zone = this.get_zone(zone_name);
    if (!zone) return null;

    const room = zone.rooms.find(
      (room) => room.name.toLowerCase() === room_name.toLowerCase(),
    );
    if (!room) return null;

    return (
      room.mobs.find(
        (mob) => mob.name.toLowerCase() === mob_name.toLowerCase(),
      ) || null
    );
  }

  /**
   * Performs an attack between two actors.
   *
   * @param {Actor} attacker
   * @param {Actor} defender
   * @returns {string}
   */
  perform_attack(attacker: Actor, defender: Actor): string {
    if (!attacker.stats || !defender.stats) {
      return "Cannot perform attack.";
    }

    const is_critical_hit =
      Math.random() < (attacker.stats.critical_chance ?? 0);
    const attacker_damage = (attacker.stats.physical_damage ?? 0) *
      (is_critical_hit ? 2 : 1);
    const damage_dealt = Math.max(
      0,
      attacker_damage - (defender.stats.physical_defense ?? 0),
    );

    defender.stats.health.current = Math.max(
      0,
      (defender.stats.health.current ?? 0) - damage_dealt,
    );

    let result =
      `${attacker.name} attacks ${defender.name} for ${damage_dealt} damage.\n` +
      `${defender.name} health: ${defender.stats.health.current}`;

    if (defender.stats.health.current === 0) {
      result += `\n${defender.name} has been defeated!`;
    }

    return result;
  }

  /**
   * Initiates an attack between a player and a mob.
   *
   * @param {Player} player
   * @param {string[]} args
   * @param {boolean} should_mob_attack
   * @returns {CommandResponse}
   * @throws {Error}
   */
  initiate_attack(
    player: Player,
    args: string[],
    should_mob_attack: boolean = false,
  ): CommandResponse {
    const zone = this.get_player_zone(player);
    if (!zone) {
      throw new Error("Player is not in a valid zone.");
    }

    const current_room = this.get_player_room(player);
    if (!current_room) {
      throw new Error("Player is not in a valid room.");
    }

    const possible_mobs = this.generate_combinations(args);
    const mob_name = possible_mobs.find((mob_name) =>
      current_room.mobs.some(
        (mob) => mob.name.toLowerCase() === mob_name.toLowerCase(),
      )
    );

    const mob = current_room.mobs.find(
      (mob) => mob.name.toLowerCase() === mob_name?.toLowerCase(),
    );

    if (!mob) {
      return {
        response: "That mob does not exist.",
      };
    }

    let result = this.perform_attack(player, mob);

    if (should_mob_attack && this.get_actor_health(mob) > 0) {
      result += `\n${this.perform_attack(mob, player)}`;
    }

    if (this.get_actor_health(mob) <= 0) {
      this.set_actor_health(mob, 0);
      if (mob.items.length > 0) {
        this.add_item_drops_to_room(player, mob.items);
        result += `\n${mob.name} dropped: ${
          mob.items
            .map((item) => item.name)
            .join(", ")
        }`;
        current_room.mobs = current_room.mobs.filter(
          (room_mob) => room_mob.name.toLowerCase() !== mob.name.toLowerCase(),
        );
      }
    }

    return {
      response: result,
    };
  }

  //////////
  // ZONE //
  //////////

  /**
   * Creates a new zone and adds it to the world.
   *
   * @param {string} name
   */
  create_zone(name: string) {
    this.world.zones.push({
      name,
      rooms: [],
    });
  }

  /**
   * Removes a zone from the world.
   *
   * @param {string} name
   */
  remove_zone(name: string) {
    this.world.zones = this.world.zones.filter((zone) => zone.name !== name);
  }

  /**
   * Gets a zone.
   *
   * @param {string} zone_name
   * @returns {Zone | null}
   */
  get_zone(zone_name: string): Zone | null {
    return (
      this.world.zones.find(
        (zone) => zone.name.toLowerCase() === zone_name.toLowerCase(),
      ) || null
    );
  }

  //////////
  // ROOM //
  //////////

  /**
   * Adds a description to a room.
   *
   * @param {string} zone_name
   * @param {string} room_name
   * @param {string} flag
   * @param {string} description
   * @throws {Error}
   */
  add_room_description(
    zone_name: string,
    room_name: string,
    flag: string,
    description: string,
  ) {
    const room = this.get_room(zone_name, room_name);
    if (room) {
      room.descriptions.push({ flag, description });
    } else {
      throw new Error(`Room ${room_name} does not exist in zone ${zone_name}.`);
    }
  }

  /**
   * Removes room from a zone.
   *
   * @param {string} zone_name
   * @param {string} room_name
   */
  remove_room(zone_name: string, room_name: string) {
    const zone = this.get_zone(zone_name);
    if (zone) {
      zone.rooms = zone.rooms.filter((room) => room.name !== room_name);
    }
  }

  /**
   * Gets a room command action.
   *
   * @param {string} zone_name
   * @param {string} room_name
   * @returns {RoomCommandActions | null}
   */
  get_room_command_action(
    zone_name: string,
    room_name: string,
  ): RoomCommandActions | null {
    const room = this.get_room(zone_name, room_name);
    if (!room) return null;

    return (
      this.world_actions.room_command_actions.find(
        (action) => action.name.toLowerCase() === room.name.toLowerCase(),
      ) || null
    );
  }

  /**
   * Adds a command action to a room.
   *
   * @param {string} zone_name
   * @param {string} room_name
   * @param {string} name
   * @param {string} description
   * @param {string[]} synonyms
   * @param {CommandParserAction} action
   */
  add_room_command_action(
    zone_name: string,
    room_name: string,
    name: string,
    description: string,
    synonyms: string[],
    action: CommandParserAction,
  ) {
    const room = this.get_room(zone_name, room_name);
    if (!room) {
      throw new Error(`Room ${room_name} does not exist in zone ${zone_name}.`);
    }

    const room_command_actions = this.get_room_command_action(
      zone_name,
      room_name,
    );
    const command_action = {
      id: crypto.randomUUID(),
      group: name,
      name,
      descriptions: [{ flag: "default", description }],
      synonyms,
      action,
    };

    if (room_command_actions) {
      room_command_actions.command_actions.push(command_action);
    } else {
      this.world_actions.room_command_actions.push({
        name: room.name,
        command_actions: [command_action],
      });
    }
  }

  /**
   * Removes a command action from a room.
   *
   * @param {string} zone_name
   * @param {string} room_name
   * @param {string} action_name
   */
  remove_room_command_action(
    zone_name: string,
    room_name: string,
    action_name: string,
  ) {
    const room_command_actions = this.get_room_command_action(
      zone_name,
      room_name,
    );
    if (room_command_actions) {
      room_command_actions.command_actions = room_command_actions
        .command_actions.filter(
          (action) => action.name.toLowerCase() !== action_name.toLowerCase(),
        );
    }
  }

  /**
   * Checks if a room has a command action.
   *
   * @param {string} zone_name
   * @param {string} room_name
   * @param {string} action_name
   * @returns {boolean}
   */
  has_room_command_action(
    zone_name: string,
    room_name: string,
    action_name: string,
  ): boolean {
    const room_command_actions = this.get_room_command_action(
      zone_name,
      room_name,
    );
    return (
      room_command_actions?.command_actions.some(
        (action) => action.name.toLowerCase() === action_name.toLowerCase(),
      ) || false
    );
  }

  /**
   * Finds a room command action.
   *
   * @param {string[]} filtered_actions
   * @param {string} zone_name
   * @param {string} room_name
   * @returns {CommandAction | null}
   */
  find_room_command_action(
    filtered_actions: string[],
    zone_name: string,
    room_name: string,
  ): CommandAction | null {
    const room_command_actions = this.get_room_command_action(
      zone_name,
      room_name,
    );
    return room_command_actions?.command_actions.find((action) =>
      action.synonyms.some((synonym) => filtered_actions.includes(synonym))
    ) || null;
  }

  /**
   * Creates an exit from one room to another.
   *
   * @param zone_name
   * @param from_room_name
   * @param exit_name
   * @param to_room_name
   * @param hidden
   * @throws {Error}
   */
  create_exit(
    zone_name: string,
    from_room_name: string,
    exit_name: string,
    to_room_name: string,
    hidden = false,
  ) {
    const zone = this.get_zone(zone_name);
    if (!zone) throw new Error(`Zone ${zone_name} does not exist.`);

    const from_room = zone.rooms.find(
      (room) => room.name.toLowerCase() === from_room_name.toLowerCase(),
    );
    const to_room = zone.rooms.find(
      (room) => room.name.toLowerCase() === to_room_name.toLowerCase(),
    );

    if (!from_room || !to_room) {
      throw new Error(
        `Room ${from_room_name} or ${to_room_name} does not exist in zone ${zone_name}.`,
      );
    }

    const opposite_exit_name = this.get_opposite_exit_name(exit_name);
    if (!opposite_exit_name) {
      throw new Error(`Invalid exit name: ${exit_name}.`);
    }

    from_room.exits.push({
      name: exit_name,
      location: to_room_name,
      hidden,
    });

    to_room.exits.push({
      name: opposite_exit_name,
      location: from_room_name,
      hidden,
    });
  }

  /**
   * Gets the opposite exit name for the given exit name.
   *
   * @param {string} exit_name
   * @returns {Exit | null}
   */
  get_opposite_exit_name(exit_name: string): string | null {
    const opposites: { [key: string]: string } = {
      north: "south",
      south: "north",
      east: "west",
      west: "east",
    };
    return opposites[exit_name] || null;
  }

  /**
   * Removes an exit from a room.
   *
   * @param {string} zone_name
   * @param {string} from_room_name
   * @param {string} exit_name
   * @throws {Error}
   */
  remove_exit(zone_name: string, from_room_name: string, exit_name: string) {
    const zone = this.get_zone(zone_name);
    if (!zone) throw new Error(`Zone ${zone_name} does not exist.`);

    const from_room = zone.rooms.find(
      (room) => room.name.toLowerCase() === from_room_name.toLowerCase(),
    );
    if (!from_room) {
      throw new Error(
        `Room ${from_room_name} does not exist in zone ${zone_name}.`,
      );
    }

    from_room.exits = from_room.exits.filter(
      (exit) => exit.name.toLowerCase() !== exit_name.toLowerCase(),
    );
  }

  /**
   * Gets an exit for a room.
   *
   * @param {string} zone_name
   * @param {string} from_room_name
   * @param {string} exit_name
   * @returns {Exit}
   * @throws {Error}
   */
  get_exit(zone_name: string, from_room_name: string, exit_name: string): Exit {
    const zone = this.get_zone(zone_name);
    if (!zone) {
      throw new Error(`Zone ${zone_name} does not exist.`);
    }

    const from_room = zone.rooms.find(
      (room) => room.name.toLowerCase() === from_room_name.toLowerCase(),
    );
    if (!from_room) {
      throw new Error(
        `Room ${from_room_name} does not exist in zone ${zone_name}.`,
      );
    }

    const exit = from_room.exits.find(
      (exit) => exit.name.toLowerCase() === exit_name.toLowerCase(),
    );
    if (!exit) {
      throw new Error(
        `Exit ${exit_name} does not exist in room ${from_room_name}.`,
      );
    }

    return exit;
  }

  /**
   * Gets a room description.
   *
   * @param {Player} player
   * @returns {CommandResponse}
   */
  get_room_description(player: Player): CommandResponse {
    const zone = this.get_player_zone(player);
    if (!zone) {
      throw new Error("Player is not in a valid zone.");
    }

    const current_room = zone.rooms.find(
      (room) => room.name.toLowerCase() === player.room.toLowerCase(),
    );
    if (!current_room) {
      return {
        response: "You can't see anything.",
      };
    }

    const exits = current_room.exits
      .filter((exit) => !exit.hidden)
      .map((exit) => exit.name)
      .join(", ");

    const npcs_in_room = current_room.npcs
      .map((npc) => (npc.vendor_items ? `${npc.name} (Vendor)` : npc.name))
      .join(", ");

    const mobs_in_room = current_room.mobs.map((mob) => mob.name).join(", ");

    const objects_in_room = current_room.objects
      .map((obj) => obj.name)
      .join(", ");

    const description = this.get_description(player, current_room, "default");

    const room_actions = this.world_actions.room_actions.find(
      (action) => action.name === current_room.name,
    );

    const action_result = room_actions?.actions
      ?.map((action) => action(player))
      .filter(Boolean)
      .join("") || "";

    return {
      response: `${description}${action_result ? `\n\n${action_result}` : ""}`,
      exits: exits.length > 0 ? exits : undefined,
      npcs: npcs_in_room.length > 0 ? npcs_in_room : undefined,
      mobs: mobs_in_room.length > 0 ? mobs_in_room : undefined,
      objects: objects_in_room.length > 0 ? objects_in_room : undefined,
    };
  }

  /**
   * Switches player current room to a new room.
   *
   * @param {Player} player
   * @param {string} command
   * @returns {CommandResponse}
   */
  switch_room(player: Player, command: string = ""): CommandResponse {
    const zone = this.get_player_zone(player);
    if (!zone) {
      throw new Error("Player is not in a valid zone.");
    }

    let current_room = zone.rooms.find((room) => room.name === player.room);
    const has_command = command.length > 0;

    if (
      !current_room ||
      (!has_command && !this.has_room_actions(current_room.name))
    ) {
      return {
        response: "You can't go that way.",
      };
    }

    if (has_command) {
      const exit = current_room.exits.find((exit) => exit.name === command);
      if (!exit) {
        return {
          response: "You can't go that way.",
        };
      }

      if (exit.hidden) exit.hidden = false;
      player.room = exit.location;

      current_room = zone.rooms.find((room) => room.name === player.room) ||
        current_room;
    }

    return this.get_room_description(player);
  }

  /**
   * Checks if a room has actions.
   *
   * @param {string} room_name
   * @returns {boolean}
   */
  has_room_actions(room_name: string): boolean {
    return !!this.world_actions.room_actions.find(
      (action) => action.name === room_name,
    );
  }

  /**
   * Plots a map of the rooms.
   *
   * @param {Player} player
   * @param {number} window_size
   * @returns {CommandResponse}
   * @throws {Error}
   */
  plot_room_map(player: Player, window_size: number): CommandResponse {
    const zone = this.get_player_zone(player);
    if (!zone) {
      throw new Error("Player is not in a valid zone.");
    }

    let rooms = zone.rooms;

    if (window_size !== 0) {
      const current_room_index = rooms.findIndex(
        (room) => room.name === player.room,
      );
      const window_start = Math.max(current_room_index - window_size, 0);
      const window_end = Math.min(
        current_room_index + window_size + 1,
        rooms.length,
      );
      rooms = rooms.slice(window_start, window_end);
    }

    const room_grid: { [key: string]: string } = {};
    const visited_rooms = new Set<string>();
    const direction_to_coords: Record<string, [number, number]> = {
      north: [0, 1],
      south: [0, -1],
      east: [1, 0],
      west: [-1, 0],
    };
    const direction_to_symbol: Record<string, string> = {
      north: "|",
      south: "|",
      east: "-",
      west: "-",
    };

    const queue = [
      { room: rooms.find((room) => room.name === player.room)!, x: 0, y: 0 },
    ];
    room_grid["0,0"] = "@";

    while (queue.length > 0) {
      const { room, x, y } = queue.shift()!;
      if (visited_rooms.has(room.name)) continue;
      visited_rooms.add(room.name);

      room.exits.forEach((exit) => {
        if (exit.hidden) return;

        const [dx, dy] = direction_to_coords[exit.name] || [];
        if (dx === undefined || dy === undefined) return;

        const neighbor_room = rooms.find((r) => r.name === exit.location);
        if (neighbor_room) {
          const new_x = x + dx;
          const new_y = y + dy;
          const symbol = direction_to_symbol[exit.name];

          room_grid[`${new_x},${new_y}`] = neighbor_room.name === player.room
            ? "@"
            : "#";
          room_grid[`${x + dx / 2},${y + dy / 2}`] = symbol;

          queue.push({ room: neighbor_room, x: new_x, y: new_y });
        }
      });
    }

    const keys = Object.keys(room_grid);
    const xs = keys.map((key) => parseFloat(key.split(",")[0]));
    const ys = keys.map((key) => parseFloat(key.split(",")[1]));
    const min_x = Math.min(...xs);
    const max_x = Math.max(...xs);
    const min_y = Math.min(...ys);
    const max_y = Math.max(...ys);

    const map_result: string[] = [];
    for (let y = max_y; y >= min_y; y -= 0.5) {
      let row = "";
      for (let x = min_x; x <= max_x; x += 0.5) {
        row += room_grid[`${x},${y}`] || " ";
      }
      map_result.push(row);
    }

    return {
      response: map_result.join("\n"),
    };
  }

  /**
   * Creates a new room and adds it to a zone.
   *
   * @param {string} zone_name
   * @param {string} name
   * @param {string} description
   * @param {Action | null} action
   */
  create_room(
    zone_name: string,
    name: string,
    description: string,
    action: Action | null = null,
  ) {
    const zone = this.get_zone(zone_name);
    if (!zone) throw new Error(`Zone ${zone_name} does not exist.`);

    const id = name;

    // Create the new room and add it to the zone
    zone.rooms.push({
      id,
      name,
      descriptions: [{ flag: "default", description }],
      zone_start: false,
      items: [],
      npcs: [],
      mobs: [],
      objects: [],
      exits: [],
      players: [],
    });

    // Add the action to the room actions if provided
    if (action) {
      this.world_actions.room_actions.push({
        name: id,
        actions: [action],
      });
    }
  }

  /**
   * Sets a room as the starting room for a zone.
   *
   * @param {string} zone_name
   * @param {string} room_name
   */
  set_room_as_zone_starter(zone_name: string, room_name: string) {
    const room = this.get_room(zone_name, room_name);
    if (!room) {
      throw new Error(`Room ${room_name} does not exist in zone ${zone_name}.`);
    }
    room.zone_start = true;
  }

  /**
   * Adds an action to a room.
   *
   * @param {string} zone_name
   * @param {string} room_name
   * @param {Action} action
   */
  add_room_action(zone_name: string, room_name: string, action: Action) {
    const room = this.get_room(zone_name, room_name);
    if (!room) {
      throw new Error(`Room ${room_name} does not exist in zone ${zone_name}.`);
    }

    const room_action = this.world_actions.room_actions.find(
      (action_obj) => action_obj.name.toLowerCase() === room_name.toLowerCase(),
    );

    if (room_action) {
      room_action.actions?.push(action);
    } else {
      this.world_actions.room_actions.push({
        name: room.name,
        actions: [action],
      });
    }
  }

  /**
   * Gets a room.
   *
   * @param {string} zone_name
   * @param {string} room_name
   * @returns {Room | null}
   * @throws {Error}
   */
  get_room(zone_name: string, room_name: string): Room | null {
    const zone = this.get_zone(zone_name);
    if (!zone) throw new Error(`Zone ${zone_name} does not exist.`);

    return (
      zone.rooms.find(
        (room) => room.name.toLowerCase() === room_name.toLowerCase(),
      ) ?? null
    );
  }

  /**
   * Gets the zone starting room.
   *
   * @param {string} zone_name
   * @returns {Room | null}
   */
  get_zone_starter_room(zone_name: string): Room | null {
    const zone = this.get_zone(zone_name);
    if (!zone) return null;
    return zone.rooms.find((room) => room.zone_start) ?? null;
  }

  /**
   * Inpects the current room for items and mobs.
   *
   * @param {Player} player
   * @returns {CommandResponse}
   */
  inspect_room(player: Player): CommandResponse {
    const current_room = this.get_player_zone(player)?.rooms.find(
      (room) => room.name.toLowerCase() === player.room.toLowerCase(),
    );

    if (!current_room) {
      return {
        response: "There is nothing else of interest here.",
      };
    }

    const items_string = current_room.items.length > 0
      ? `Items: ${
        current_room.items
          .map((item) => `${item.name} (${item.quantity})`)
          .join(", ")
      }`
      : "There is nothing else of interest here.";

    const mobs_string = current_room.mobs.length > 0
      ? `Mobs: ${current_room.mobs.map((mob) => mob.name).join(", ")}`
      : "";

    return {
      response: `You inspect the room and found:\n\n${
        [
          mobs_string,
          items_string,
        ]
          .filter(Boolean)
          .join("\n")
      }`,
    };
  }

  /**
   * Looks at the current room or the player or an object in the room.
   *
   * @param {Player} player
   * @param {string} input
   * @param {string} command
   * @param {string[]} args
   * @returns {CommandResponse}
   */
  look(
    player: Player,
    input: string,
    command: string,
    args: string[],
  ): CommandResponse {
    const possible_actions = this.generate_combinations(args);

    if (possible_actions.includes("self")) {
      return {
        response: this.look_self(player),
      };
    }

    if (possible_actions.includes("at")) {
      return this.look_at_or_examine_object(player, input, command, args);
    }

    return this.get_room_description(player);
  }

  /////////////////
  // ROOM OBJECT //
  /////////////////

  /**
   * Creates a new room object and places it in a room.
   *
   * @param {string} zone_name
   * @param {string} room_name
   * @param {string} name
   * @param {string} description
   * @param {Dialog[] | null} dialog
   * @throws {Error}
   */
  create_and_place_room_object(
    zone_name: string,
    room_name: string,
    name: string,
    description: string,
    dialog: Dialog[] | null = null,
  ) {
    const room = this.get_room(zone_name, room_name);
    if (!room) {
      throw new Error(`Room ${room_name} does not exist in zone ${zone_name}.`);
    }

    room.objects.push({
      id: crypto.randomUUID(),
      name,
      descriptions: [{ flag: "default", description }],
      items: [],
      dialog,
      flags: [],
    });
  }

  /**
   * Gets a room object.
   *
   * @param {string} zone_name
   * @param {string} room_name
   * @param {string} object_name
   * @returns {Actor | null}
   * @throws {Error}
   */
  get_room_object(
    zone_name: string,
    room_name: string,
    object_name: string,
  ): Actor | null {
    const room = this.get_room(zone_name, room_name);
    if (!room) {
      throw new Error(`Room ${room_name} does not exist in zone ${zone_name}.`);
    }

    return (
      room.objects.find(
        (object) => object.name.toLowerCase() === object_name.toLowerCase(),
      ) || null
    );
  }

  /**
   * Looks at a room or examines an object in the room.
   *
   * @param {Player} player
   * @param {string} input
   * @param {string} command
   * @param {string[]} args
   * @returns {CommandResponse}
   */
  look_at_or_examine_object(
    player: Player,
    input: string,
    command: string,
    args: string[],
  ): CommandResponse {
    const zone = this.get_player_zone(player);
    if (!zone) {
      return {
        response: "That object does not exist.",
      };
    }

    const possible_triggers = this.generate_combinations(args);
    const current_room = this.get_player_room(player);

    if (!current_room) {
      return {
        response: "That object does not exist.",
      };
    }

    const obj = current_room.objects.find((obj) =>
      possible_triggers.some(
        (trigger) => obj.name.toLowerCase() === trigger.toLowerCase(),
      )
    );

    if (!obj) {
      return {
        response: "That object does not exist.",
      };
    }

    if (input.startsWith("look at")) {
      return {
        response: this.get_description(player, obj, "default") ||
          "There's nothing special about it.",
      };
    }

    if (input.startsWith("examine") && obj.dialog) {
      const dialog = obj.dialog.find((dialog) =>
        dialog.trigger.some((trigger) => possible_triggers.includes(trigger))
      );

      if (dialog) {
        const dialog_action = this.world_actions.dialog_actions.find(
          (action) => action.name === dialog.name,
        );

        if (dialog_action) {
          return {
            response: dialog_action.action(
              player,
              input,
              command,
              args,
            ) as string,
          };
        } else if (dialog.response) {
          return {
            response: dialog.response,
          };
        }
      }
    }

    return {
      response: "There's nothing more to learn about this object.",
    };
  }

  //////////////
  // CRAFTING //
  //////////////

  /**
   * Creates a new recipe and adds it to the world.
   *
   * @param {string} name
   * @param {string} description
   * @param {Drop[]} ingredients
   * @param {Drop} crafted_item
   */
  create_recipe(
    name: string,
    description: string,
    ingredients: Drop[],
    crafted_item: Drop,
  ) {
    this.world.recipes.push({
      id: crypto.randomUUID(),
      name,
      descriptions: [{ flag: "default", description }],
      ingredients,
      crafted_item,
    });
  }

  /**
   * Gets a recipe.
   *
   * @param {string} name
   * @returns {Recipe | null}
   */
  get_recipe(name: string): Recipe | null {
    return (
      this.world.recipes.find(
        (recipe) => recipe.name.toLowerCase() === name.toLowerCase(),
      ) || null
    );
  }

  /**
   * Learns a recipe.
   *
   * @param {Player} player
   * @param {string} recipe_name
   * @returns {string}
   */
  learn_recipe(player: Player, recipe_name: string): string {
    const recipe = this.get_recipe(recipe_name);
    if (!recipe) return "That recipe does not exist.";

    if (player.known_recipes.includes(recipe.name)) {
      this.set_flag(player, "prevent_item_consumption");
      return "You already know that recipe.";
    }

    player.known_recipes.push(recipe.name);
    return `You learned the recipe for ${recipe.name}.`;
  }

  /**
   * Crafts an item using a recipe.
   *
   * @param {Player} player
   * @param {string[]} args
   * @returns {CommandResponse}
   */
  craft_recipe(player: Player, args: string[]): CommandResponse {
    const recipe_names = this.generate_combinations(args);
    const recipe_name = recipe_names.find((name) =>
      this.world.recipes.some(
        (recipe) => recipe.name.toLowerCase() === name.toLowerCase(),
      )
    );

    if (!recipe_name) {
      return {
        response: "You don't know how to craft that.",
      };
    }

    const recipe = this.get_recipe(recipe_name);
    if (!recipe) {
      return {
        response: "You don't know how to craft that.",
      };
    }

    const has_ingredients = recipe.ingredients.every((ingredient) =>
      this.has_item_in_quantity(player, ingredient.name, ingredient.quantity)
    );

    if (!has_ingredients) {
      return {
        response: "You don't have the ingredients to craft that.",
      };
    }

    recipe.ingredients.forEach((ingredient) => {
      this.remove_player_item(player, ingredient.name);
    });

    player.items.push({
      name: recipe.crafted_item.name,
      quantity: recipe.crafted_item.quantity,
    });

    return {
      response: `${recipe.crafted_item.name} has been crafted.`,
    };
  }

  //////////
  // MISC //
  //////////

  /**
   * Saves player progress to a database.
   *
   * @param {Player} player
   * @param {string} database_name
   * @param {string} slot_name
   * @returns {Promise<CommandResponse>}
   */
  async save_player_progress(
    player: Player,
    database_name: string,
    slot_name: string,
  ): Promise<CommandResponse> {
    let result = "Unable to save progress.";
    const player_progress: PlayerProgress = {
      player,
      world: this.world,
    };
    const kv = await Deno.openKv(database_name);
    await kv.set([slot_name], structuredClone(player_progress));
    const save_result = await kv.get([slot_name]);
    kv.close();
    if (save_result) {
      result = `Progress has been saved to slot: ${slot_name}`;
    }
    return {
      response: result,
    };
  }

  /**
   * Loads player progress from a database.
   *
   * @param {string} database_name
   * @param {string} slot_name
   * @returns {Promise<PlayerProgress | null>}
   */
  async load_player_progress(
    database_name: string,
    slot_name: string,
  ): Promise<PlayerProgress | null> {
    const kv = await Deno.openKv(database_name);
    const result = await kv.get([slot_name]);
    kv.close();
    if (result.value) {
      return result.value as PlayerProgress;
    }
    return null;
  }

  /**
   * Gets a random number.
   *
   * @param {number} upper
   * @returns {number}
   */
  get_random_number(upper = 100): number {
    const nums = new Uint32Array(1);
    window.crypto.getRandomValues(nums);
    return nums[0] % (upper + 1);
  }

  /**
   * Creates a spawn location.
   *
   * @param {string} name
   * @param {string} zone
   * @param {string} room
   * @param {number} interval
   * @param {boolean} active
   * @param {SpawnLocationAction} action
   */
  create_spawn_location(
    name: string,
    zone: string,
    room: string,
    interval: number,
    active: boolean,
    action: SpawnLocationAction,
  ) {
    const spawn_location: SpawnLocation = {
      name,
      zone,
      room,
      interval,
      active,
      action,
      timer_id: 0,
      timer: function () {
        // If the interval is 0, run the action immediately
        if (this.interval === 0) {
          this.action(this);
        } else {
          this.timer_id = setInterval(() => {
            if (this.active) {
              this.action(this);
            }
          }, this.interval);
        }
      },
    };

    this.world_actions.spawn_locations.push(spawn_location);
  }

  /**
   * Gets a spawn location.
   *
   * @param {string} name
   * @returns {SpawnLocation | null}
   */
  get_spawn_location(name: string): SpawnLocation | null {
    return (
      this.world_actions.spawn_locations.find(
        (location) => location.name === name,
      ) || null
    );
  }

  /**
   * Sets a spawn location as active or inactive.
   *
   * @param {string} name
   * @param {boolean} active
   */
  set_spawn_location_active(name: string, active: boolean) {
    const spawn_location = this.world_actions.spawn_locations.find(
      (location) => location.name === name,
    );
    if (spawn_location) {
      spawn_location.active = active;
    }
  }

  /**
   * Starts a spawn location.
   *
   * @param {string} name
   */
  start_spawn_location(name: string) {
    const spawn_location = this.world_actions.spawn_locations.find(
      (location) => location.name === name,
    );
    if (spawn_location) {
      spawn_location.timer();
    }
  }

  /**
   * Removes a spawn location.
   *
   * @param {string} name
   */
  remove_spawn_location(name: string) {
    const spawn_location = this.world_actions.spawn_locations.find(
      (location) => location.name === name,
    );

    if (spawn_location) {
      clearInterval(spawn_location.timer_id);
      this.world_actions.spawn_locations = this.world_actions.spawn_locations
        .filter(
          (location) => location.name !== name,
        );
    }
  }

  /**
   * Creates a new dialog for an NPC.
   *
   * @param {string} npc_name
   * @param {string[]} trigger
   * @param {string | null} response
   * @param {CommandParserAction | null} action
   */
  create_dialog(
    npc_name: string,
    trigger: string[],
    response: string | null,
    action: CommandParserAction | null,
  ) {
    const npc = this.get_npc(npc_name);
    if (!npc) return;

    const dialog_id = crypto.randomUUID();

    if (!npc.dialog) {
      npc.dialog = [];
    }

    npc.dialog.push({
      name: dialog_id,
      trigger,
      response,
    });

    if (action) {
      this.create_dialog_action(dialog_id, trigger, action);
    }
  }

  /**
   * Creates a dialog action.
   *
   * @param {string} dialog_id
   * @param {string[]} trigger
   * @param {CommandParserAction} action
   */
  create_dialog_action(
    dialog_id: string,
    trigger: string[],
    action: CommandParserAction,
  ) {
    this.world_actions.dialog_actions.push({
      name: dialog_id,
      trigger,
      action,
    });
  }

  /**
   * Gets a description for an entity.
   *
   * @param {Player} player
   * @param {Entity} entity
   * @param {string} flag
   * @returns {string | null}
   */
  get_description(player: Player, entity: Entity, flag: string): string | null {
    if (flag === "default" && player.flags.length > 0) {
      const matching_desc = player.flags
        .map((player_flag) =>
          entity.descriptions.find((desc) => desc.flag === player_flag)
        )
        .find((desc) => desc !== undefined);

      if (matching_desc) {
        flag = matching_desc.flag;
      }
    }

    const description = entity.descriptions.find((desc) => desc.flag === flag);
    return description ? description.description : null;
  }

  /**
   * Creates a command action.
   *
   * @param {string} name
   * @param {string} description
   * @param {string[]} synonyms
   * @param {CommandParserAction} action
   * @returns {CommandAction}
   */
  create_command_action(
    name: string,
    description: string,
    synonyms: string[],
    action: CommandParserAction,
  ): CommandAction {
    return {
      id: name,
      name,
      descriptions: [{ flag: "default", description }],
      synonyms,
      action,
    };
  }

  /**
   * Finds a command action.
   *
   * @param {string[]} possible_actions
   * @param {CommandAction[]} command_actions
   * @returns
   */
  find_command_action(
    possible_actions: string[],
    command_actions: CommandAction[],
  ): CommandAction | null {
    return command_actions.find((action) =>
      action.synonyms.some((synonym) => possible_actions.includes(synonym))
    ) || null;
  }

  /**
   * Resets the world.
   *
   * @returns {World}
   */
  reset_world(): World {
    const world: World = {
      zones: [],
      items: [],
      recipes: [],
      npcs: [],
      mobs: [],
      objects: [],
      players: [],
      quests: [],
      level_data: this.calculate_level_experience(1, 1.2, 50),
    };
    this.world = world;
    this.reset_world_actions();
    return world;
  }

  /**
   * Resets the world actions.
   *
   * @returns {World Actions}
   */
  reset_world_actions(): WorldActions {
    const world_actions: WorldActions = {
      spawn_locations: [],
      dialog_actions: [],
      item_actions: [],
      room_actions: [],
      room_command_actions: [],
      quest_actions: [],
      quest_step_actions: [],
    };
    this.world_actions = world_actions;
    return world_actions;
  }

  /**
   * Converts a string to title case.
   *
   * @param {string} str
   * @returns {string}
   */
  to_title_case(str: string): string {
    return str
      .split(" ")
      .map((word) =>
        word.length > 0
          ? word[0].toUpperCase() + word.slice(1).toLowerCase()
          : ""
      )
      .join(" ");
  }

  /**
   * Calculates the experience needed for each level.
   *
   * @param starting_experience
   * @param growth_rate
   * @param num_levels
   * @returns {Level[]}
   */
  calculate_level_experience(
    starting_experience: number,
    growth_rate: number,
    num_levels: number,
  ): Level[] {
    return Array.from({ length: num_levels }, (_, i) => ({
      level: i + 1,
      xp: starting_experience * Math.pow(growth_rate, i),
    }));
  }

  /**
   * Generates all possible combinations of an array of strings. This is used
   * to generate all possible commands from a user input for the purposes of
   * matching them to command actions.
   *
   * @param input_array
   * @returns {string[]}
   */
  generate_combinations(input_array: string[]): string[] {
    const result: string[] = [];

    function generate_helper(combination: string, start_idx: number) {
      if (combination.length > 0) {
        result.push(combination);
      }

      for (let i = start_idx; i < input_array.length; i++) {
        const new_combination = combination.length > 0
          ? `${combination} ${input_array[i]}`
          : input_array[i];
        generate_helper(new_combination, i + 1);
      }
    }

    generate_helper("", 0);
    return result;
  }

  /**
   * Gets help for all commands the player has access to.
   *
   * @param player
   * @returns {CommandResponse}
   */
  get_help(player: Player): CommandResponse {
    const command_actions = this.get_actor_health(player) <= 0
      ? this.player_dead_command_actions
      : this.main_command_actions;

    const result = command_actions
      .map((action) => {
        const synonyms = action.synonyms.join(", ");
        const description = this.get_description(player, action, "default") ||
          "No description available.";
        return `${synonyms} - ${description}`;
      })
      .join("\n");

    return {
      response: `Commands:\n\n${result}`,
    };
  }

  /**
   * Creates a set of stats for an actor.
   *
   * @param health
   * @param stamina
   * @param magicka
   * @param physical_damage
   * @param physical_defense
   * @param spell_damage
   * @param spell_defense
   * @param critical_chance
   * @param progress
   * @returns {Stats}
   */
  create_stats(
    health: ResourceAmount,
    stamina: ResourceAmount,
    magicka: ResourceAmount,
    physical_damage: number,
    physical_defense: number,
    spell_damage: number,
    spell_defense: number,
    critical_chance: number,
    progress: Level,
  ): Stats {
    return {
      health,
      stamina,
      magicka,
      physical_damage,
      physical_defense,
      spell_damage,
      spell_defense,
      critical_chance,
      progress,
    };
  }

  /**
   * Sets the godmode flag for a player.
   *
   * @param {Player} player
   */
  set_godmode(player: Player) {
    this.set_flag(player, "godmode");
  }

  /**
   * Removes the godmode flag for a player.
   *
   * @param {Player} player
   */
  remove_godmode(player: Player) {
    this.remove_flag(player, "godmode");
  }

  /**
   * Sets a flag for a player.
   *
   * @param {Player} player
   * @param {string} flag
   */
  set_flag(player: Player, flag: string) {
    if (player && !player.flags.includes(flag)) {
      player.flags.push(flag);
    }
  }

  /**
   * Checks if a player has a flag.
   *
   * @param {Player} player
   * @param {string} flag
   * @returns {boolean}
   */
  has_flag(player: Player, flag: string): boolean {
    return player && player.flags.includes(flag);
  }

  /**
   * Removes a flag from a player.
   *
   * @param {Player} player
   * @param {string} flag
   */
  remove_flag(player: Player, flag: string) {
    if (player && player.flags.includes(flag)) {
      player.flags = player.flags.filter((f) => f !== flag);
    }
  }

  /**
   * If player is in godmode, they can go to any room or zone.
   *
   * @param {Player} player
   * @param {string[]} args
   * @returns {CommandResponse}
   */
  goto(player: Player, args: string[]): CommandResponse {
    if (!this.has_flag(player, "godmode")) {
      return {
        response: "I don't understand that command.",
      };
    }

    let result = {
      response: "That room or zone does not exist.",
    };

    let new_zone_name: string | null = null;
    let new_room_name: string | null = null;
    const possible_rooms_or_zones = this.generate_combinations(args);

    for (const possible_room_or_zone of possible_rooms_or_zones) {
      const normalized_name = possible_room_or_zone.toLowerCase();

      if (normalized_name.startsWith("room")) {
        const room_name = possible_room_or_zone.replace(/room/i, "").trim();
        const new_room = this.get_room(player.zone, room_name);

        if (new_room) {
          new_room_name = new_room.name;
          break;
        }
      } else if (normalized_name.startsWith("zone")) {
        const zone_name = possible_room_or_zone.replace(/zone/i, "").trim();
        const new_zone = this.get_zone(zone_name);

        if (new_zone) {
          new_zone_name = new_zone.name;
          break;
        }
      }
    }

    if (new_zone_name) {
      player.zone = new_zone_name;
      const starter_room = this.get_zone_starter_room(player.zone);

      if (starter_room) {
        new_room_name = starter_room.name;
      }
    }

    if (new_room_name) {
      player.room = new_room_name;
      result = this.get_room_description(player);
    }

    return result;
  }

  // remove_string_from_array(from_string: string, from_arr: string[]): string[] {
  //   return from_arr.filter((str) => !from_string.includes(str));
  // }

  // array_difference(array1: string[], array2: string[]): string[] {
  //   return array1.filter(element => !array2.includes(element));
  // }

  /**
   * Filters out substrings from an array.
   *
   * @param {string[]} first_array
   * @param {string[]} second_array
   * @returns {string[]}
   */
  filter_substrings(first_array: string[], second_array: string[]): string[] {
    return second_array.filter(
      (word) => !first_array.some((phrase) => phrase.includes(word)),
    );
  }

  /**
   * Parses a command from a player.
   *
   * @param {Player} player
   * @param {string} input
   * @returns {Promise<string>}
   */
  async parse_command(player: Player, input: string): Promise<string> {
    const input_limit = Math.min(input_character_limit, input.length);
    input = input.substring(0, input_limit);

    if (input === "") {
      input = "look";
    }

    const [command, ...args] = input.toLowerCase().split(" ");
    const possible_actions = this.generate_combinations(input.split(" "));

    const talk_to = possible_actions.find((action) =>
      action.toLowerCase().startsWith("talk to")
    );

    const filtered_actions = possible_actions.filter((action) =>
      talk_to ? action.toLowerCase().includes(talk_to) : true
    );

    let result: string | null = "";
    let command_action: CommandAction | null;

    if (!this.has_flag(player, "disable_main_commands")) {
      command_action = this.find_command_action(
        filtered_actions,
        this.get_actor_health(player) <= 0
          ? this.player_dead_command_actions
          : this.main_command_actions,
      );

      if (command_action) {
        const filtered_args = this.filter_substrings(
          command_action.synonyms,
          args,
        );
        result = command_action.action(
          player,
          input,
          command,
          filtered_args,
        ) as string;
      }

      if (!result) {
        const async_command_action = this.find_command_action(
          possible_actions,
          this.main_async_command_actions,
        );

        if (async_command_action) {
          const filtered_args = this.filter_substrings(
            async_command_action.synonyms,
            args,
          );
          result = await async_command_action.action(
            player,
            input,
            command,
            filtered_args,
          );
        }
      }
    }

    if (!result) {
      const players_room = this.get_player_room(player);
      if (players_room) {
        const room_command_action = this.find_room_command_action(
          filtered_actions,
          player.zone,
          players_room.name,
        );

        if (room_command_action) {
          const filtered_args = this.filter_substrings(
            room_command_action.synonyms,
            args,
          );
          const room_command_result = await room_command_action.action(
            player,
            input,
            command,
            filtered_args,
          );
          result = JSON.stringify({
            response: `${
              this.get_description(
                player,
                room_command_action,
                "default",
              )
            }\n\n${room_command_result}`,
          });
        }
      }
    }

    if (result) {
      return result;
    }

    return JSON.stringify({ response: "I don't understand that command." });
  }

  /**
   * Starts up a web socket server to process game commands.
   *
   * Passing player_id here is temporary and will change once we fully implement
   * multiplayer.
   *
   * @param {number} port
   * @param {string} fix_me_player_id
   */
  run_websocket_server(port: number, fix_me_player_id: string) {
    const process_request = async (game_message: GameMessage) => {
      const player = this.get_player(game_message.player_id);
      if (player) {
        const result: CommandResponse = JSON.parse(
          await this.parse_command(player, game_message.command),
        );
        const final_response = {
          id: crypto.randomUUID(),
          input: game_message.command,
          player: player,
          result,
          responseLines: result.response.split("\n"),
          map: this.plot_room_map(player, 5).response,
        };
        console.log("Response: ", result.response);
        return final_response;
      } else {
        const final_response = {
          id: crypto.randomUUID(),
          input: game_message.command,
          player: null,
          response: "Player not found.",
          responseLines: [],
          map: "",
        };
        return final_response;
      }
    };

    const ac = new AbortController();
    const server = Deno.serve(
      {
        port,
        signal: ac.signal,
      },
      (_req: Request) => {
        const { socket, response } = Deno.upgradeWebSocket(_req);
        socket.onopen = async () => {
          const game_message: GameMessage = {
            player_id: fix_me_player_id,
            command: "",
          };
          socket.send(JSON.stringify(await process_request(game_message)));
        };
        socket.onmessage = async (e) => {
          if (e.data === "quit") {
            console.log("Shutting down server...");
            socket.close();
            ac.abort();
          } else {
            const game_message = JSON.parse(e.data);
            socket.send(JSON.stringify(await process_request(game_message)));
          }
        };
        return response;
      },
    );

    server.finished.then(() => {
      console.log("Server has been shutdown!");
      Deno.exit();
    });
  }
}
