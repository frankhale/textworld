// A Text Adventure Library & Game for Deno
// Frank Hale &lt;frankhaledevelops AT gmail.com&gt;
// 21 September 2024

// TODO:
//
// - Rooms now have a players array, this is for multiplayer support and will
// need to be populated when players switch rooms or join the game.
// - Player Progress saving/loading needs refactoring to work in a multiplayer
// environment
// - Implement leveling
// - Implement race
// - Look at all exception throwing and make sure it's consistent

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

// Core Interfaces
export interface Description {
  flag: string;
  description: string;
}

export interface Named {
  name: string;
}

export interface Entity extends Named {
  id: string;
  descriptions: Description[];
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

export interface Race extends Entity {
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
}

export interface Actor extends Entity, Storage {
  dialog?: Dialog[];
  vendor_items?: VendorItem[];
  killable?: boolean;
  flags: string[];
  stats?: Stats;
  race?: Race;
}

export interface Player extends Actor {
  score: number;
  gold: number;
  zone: string;
  room: string;
  quests: string[];
  quests_completed: string[];
  known_recipes: string[];
  instance: Zone[];
}

export interface Recipe extends Entity {
  ingredients: Drop[];
  crafted_item: Drop;
}

export interface Level {
  level: number;
  xp: number;
}

export interface VendorItem extends Named {
  price: number;
}

export interface Dialog extends Named {
  trigger: string[];
  response?: string;
}

export interface Item extends Entity {
  usable: boolean;
  level: number;
  value: number;
}

export interface Exit extends Named {
  location: string;
  hidden: boolean;
}

export interface Drop extends Named {
  quantity: number;
}

export interface ActorContainer {
  npcs: Actor[];
  mobs: Actor[];
  objects: Actor[];
  players: Player[];
}

export interface Room extends Entity, Storage, ActorContainer {
  exits: Exit[];
  instance: boolean;
}

export interface Zone extends Entity {
  rooms: Room[];
  instance: boolean;
  starting_room?: string;
}

export interface World extends ActorContainer {
  zones: Zone[];
  items: Item[];
  recipes: Recipe[];
  quests: Quest[];
  level_data: Level[];
}

export interface Quest extends Entity {
  steps?: QuestStep[];
  complete: boolean;
}

export interface QuestStep extends Entity {
  complete: boolean;
}

export interface PlayerProgress {
  player: Player;
  world: World;
}

export interface GameMessage {
  player_id: string;
  command: string;
}

// Response Interface
export interface CommandResponse {
  response: string;
  exits?: string;
  npcs?: string;
  mobs?: string;
  objects?: string;
}

// Actions Interfaces
type QuestActionType = "Start" | "End";

export interface QuestAction extends Named {
  start?: Action;
  end?: Action;
}

export interface QuestStepAction extends Named {
  action: ActionDecision;
}

export interface CommandAction extends Entity {
  synonyms: string[];
  action: CommandParserAction;
}

export interface DialogAction extends Named {
  trigger: string[];
  action: CommandParserAction;
}

export interface NamedAction extends Named {
  action: Action;
}

export interface NamedActions extends Named {
  actions?: Action[];
}

export interface RoomCommandActions extends Named {
  command_actions: CommandAction[];
}

export interface SpawnLocation extends Named {
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
  flag_actions: NamedAction[];
  item_actions: NamedAction[];
  room_actions: NamedActions[];
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
        JSON.stringify(this.interact_with_actor(player, input, command, args)),
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
   * @param {string} name - The name of the player.
   * @param {string} description - The description of the player.
   * @param {string} zone_name - The name of the zone to place the player in.
   * @param {string} room_name - The name of the room to place the player in.
   * @returns {Player} - The player object.
   */
  create_player(
    name: string,
    description: string,
    zone_name: string,
    room_name: string,
  ): Player {
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
        id: crypto.randomUUID(),
        name: "Human",
        descriptions: [{ flag: "default", description: "A human." }],
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
      instance: [],
    };

    this.world.players.push(player);
    return player;
  }

  /**
   * Resurrects an actor by setting their health to max.
   *
   * @param {Actor} actor - The actor to resurrect.
   * @returns {CommandResponse} - The response object.
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
   * @param {string} id - The id of the player to get.
   * @returns {Player | null} - The player or null if it does not exist.
   */
  get_player(id: string): Player | null {
    return this.world.players.find((player) => player.id === id) || null;
  }

  /**
   * Removes a player from the world.
   *
   * @param {Player} player - The player to remove.
   */
  remove_player(player: Player): void {
    this.world.players = this.world.players.filter(
      (p) => p.name !== player.name,
    );
  }

  /**
   * Gets players zone.
   *
   * @param {Player} player - The player to get the zone for.
   * @returns {Zone | null} - The zone or null if it does not exist.
   */
  get_player_zone(player: Player): Zone | null {
    return (
      player.instance.find((zone) => zone.name === player.zone) ||
      this.world.zones.find((zone) => zone.name === player.zone) || null
    );
  }

  /**
   * Gets players room.
   *
   * @param {Player} player - The player to get the room for.
   * @returns {Room | null} - The room or null if it does not exist.
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
   * @param {Player} player - The player to get the description for.
   * @returns {string} - The description of the player.
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
   * @param {Player} player - The player to set the room for.
   * @param {string} zone_name - The name of the zone to set the room to.
   */
  set_player_room_to_zone_start(player: Player, zone_name: string): void {
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
   * @param {Player} player - The player to set the zone and room for.
   * @param {string} zone_name - The name of the zone to set.
   * @param {string} room_name - The name of the room to set.
   */
  set_player_zone_and_room(
    player: Player,
    zone_name: string,
    room_name: string,
  ): void {
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
   * @param {Actor} actor - The actor to set the health for.
   * @param {number} health - The health to set.
   */
  set_actor_health(actor: Actor, health: number): void {
    if (actor.stats) {
      actor.stats.health.current = health;
      if (actor.stats.health.current > actor.stats.health.max) {
        actor.stats.health.current = actor.stats.health.max;
      }
    }
  }

  /**
   * Increase an actors max health by amount. This adds to the current max
   * health.
   *
   * @param {Actor} actor - The actor to increase the max health for.
   * @param {number} amount - The amount to increase the max health by.
   */
  increase_actor_max_heath(actor: Actor, amount: number): void {
    if (actor.stats) {
      actor.stats.health.max += amount;
    }
  }

  /**
   * Sets an actors max health.
   *
   * @param {Actor} actor - The actor to set the max health for.
   */
  set_actor_health_to_max(actor: Actor): void {
    if (actor.stats) {
      actor.stats.health.current = actor.stats.health.max;
    }
  }

  /**
   * Adds health to an actor.
   *
   * @param {Actor} actor - The actor to add health to.
   * @param {number} amount - The amount of health to add.
   */
  add_to_actor_health(actor: Actor, amount: number): void {
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
   * @param {Actor} actor - The actor to check the health for.
   * @returns {boolean} - True if the actor's health is full, false otherwise.
   */
  is_actor_health_full(actor: Actor): boolean {
    return actor.stats?.health.current === actor.stats?.health.max;
  }

  /**
   * Gets an actors health.
   *
   * @param actor - The actor to get the health for.
   * @returns {number} - The actors health.
   */
  get_actor_health(actor: Actor): number {
    return actor.stats?.health.current ?? 0;
  }

  /**
   * Gets an actors max health.
   *
   * @param actor - The actor to get the max health for.
   * @returns {number} - The actors max health
   */
  get_actor_max_health(actor: Actor): number {
    return actor.stats?.health.max ?? 0;
  }

  ///////////
  // QUEST //
  ///////////

  /**
   * Creates a new quest and adds it to the world.
   *
   * @param {string} name - The name of the quest.
   * @param {string} description - The description of the quest.
   */
  create_quest(name: string, description: string): void {
    this.world.quests.push({
      id: crypto.randomUUID(),
      name,
      descriptions: [{ flag: "default", description }],
      complete: false,
    });
  }

  /**
   * Gets a quest action.
   *
   * @param {string} quest_name - The name of the quest to get the action for.
   * @returns {QuestAction | null} - The quest action or null if it does not exist.
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
   * @param {string} quest_name - The name of the quest to get the step action for.
   * @param {string} name - The name of the step to get the action for.
   * @returns {QuestStepAction | null} - The quest step action or null if it does not exist.
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
   * @param {string} quest_name - The name of the quest to add the action to.
   * @param {QuestActionType} action_type - The type of action to add.
   * @param {Action | null} action - The action to add.
   * @throws {Error} - If the quest does not exist or the action already exists.
   */
  add_quest_action(
    quest_name: string,
    action_type: QuestActionType,
    action?: Action,
  ): void {
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
   * @param {string} quest_name - The name of the quest to add the step to.
   * @param {string} name - The name of the step.
   * @param {string} description - The description of the step.
   * @param {ActionDecision | null} action - The action to add.
   * @throws {Error} - If the quest does not exist.
   */
  add_quest_step(
    quest_name: string,
    name: string,
    description: string,
    action: ActionDecision | null = null,
  ): void {
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
   * @param {string} name - The name of the quest to get.
   * @returns {Quest | null} - The quest or null if it does not exist.
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
   * @param {string} quest_name - The name of the quest to get the step for.
   * @param {string} name - The name of the step to get.
   * @returns {QuestStep | null} - The quest step or null if it does not exist.
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
   * @param {Player} player - The player to pickup the quest.
   * @param {string} quest_name - The name of the quest to pickup.
   * @returns {string} - The response message.
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
   * @param {Player} player - The player to drop the quest.
   * @param {string} quest_name - The name of the quest to drop.
   * @returns {string} - The response message.
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
   * @param {Player} player - The player to check the quest for.
   * @param {string} quest_name - The name of the quest to check.
   * @returns {boolean} - True if the quest is complete, false otherwise.
   * @throws {Error} - If the quest does not exist or does not have any steps.
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
   * @param {Player} player - The player to get the quest progress for.
   * @param {Quest} quest_name - The name of the quest to get the progress for.
   * @returns {string} - The quest progress.
   * @throws {Error} - If the quest does not exist.
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
   * @param {Player} player - The player to show the quests for.
   * @returns {CommandResponse} - The response object.
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
   * @param {string} name - The name of the NPC.
   * @param {string} description - The description of the NPC.
   * @returns {Actor} - The NPC object.
   */
  create_npc(name: string, description: string): Actor {
    const npc: Actor = {
      id: crypto.randomUUID(),
      name,
      descriptions: [{ flag: "default", description }],
      items: [],
      killable: false,
      flags: [],
    };

    this.world.npcs.push(npc);

    return npc;
  }

  /**
   * Removes a new NPC from a zone and room.
   *
   * @param {string} name - The name of the NPC to remove.
   */
  remove_npc(
    name: string,
    zone_name: string | null = null,
    room_name: string | null = null,
  ): void {
    if (!zone_name || !room_name) {
      this.world.npcs = this.world.npcs.filter((npc) => npc.name !== name);
    } else {
      const room = this.get_room(zone_name, room_name);
      if (room) {
        room.npcs = room.npcs.filter(
          (npc) => npc.name.toLowerCase() !== name.toLowerCase(),
        );
      }
    }
  }

  /**
   * Gets an NPC.
   *
   * @param {string} name - The name of the NPC to get.
   * @returns {Actor | null} - The NPC or null if it does not exist.
   */
  get_npc(name: string): Actor | null {
    return (
      this.world.npcs.find((npc) =>
        npc.name.toLowerCase() === name.toLowerCase()
      ) ||
      null
    );
  }

  /**
   * Places an NPC in a zone and room.
   *
   * @param {string} zone_name - The name of the zone to place the NPC in.
   * @param {string} in_room_name - The name of the room to place the NPC in.
   * @param {string} npc_name - The name of the NPC to place.
   * @param {Player | null} player - If player is not null, the NPC will be placed in the player's instance.
   * @throws {Error} - If the NPC does not exist.
   */
  place_npc(
    zone_name: string,
    in_room_name: string,
    npc_name: string,
    player: Player | null = null,
  ): void {
    const npc = this.get_npc(npc_name);
    if (!npc) {
      throw new Error(`NPC ${npc_name} does not exist.`);
    }

    const room = player
      ? this.get_instance_room(player, zone_name, in_room_name)
      : this.get_room(zone_name, in_room_name);

    if (!room) {
      throw new Error(
        `Room ${in_room_name} does not exist in zone ${zone_name}.`,
      );
    }

    room.npcs.push(structuredClone(npc));
  }

  /**
   * Gets an NPC in a room.
   *
   * @param {string} zone_name - The name of the zone to get the NPC from.
   * @param {string} room_name - The name of the room to get the NPC from.
   * @param {string} npc_name - The name of the NPC to get.
   * @returns {Actor | null} - The NPC or null if it does not exist.
   * @throws {Error} - If the room does not exist in the zone.
   */
  get_room_npc(
    zone_name: string,
    room_name: string,
    npc_name: string,
  ): Actor | null {
    const room = this.get_room(zone_name, room_name);

    if (!room) {
      throw new Error(
        `Room ${room_name} does not exist in zone ${zone_name}.`,
      );
    }

    return (
      room.npcs.find(
        (npc) => npc.name.toLowerCase() === npc_name.toLowerCase(),
      ) || null
    );
  }

  /**
   * Interact with an Actor.
   *
   * @param player - The player.
   * @param input - The input from the player.
   * @param command - The command from the player.
   * @param args - The arguments from the player.
   * @returns {CommandResponse} - The response object.
   * @throws {Error} - If the player is not in a valid zone or room.
   */
  interact_with_actor(
    player: Player,
    input: string,
    command: string,
    args: string[],
  ): CommandResponse {
    if (args.length === 0) {
      return { response: "hmm..." };
    }

    const possible_triggers = this.generate_combinations(args);
    const current_room = this.get_player_room(player);
    if (!current_room) {
      throw new Error("Player is not in a valid zone or room.");
    }

    const actor_in_room = [...current_room.npcs, ...current_room.objects].find((
      actor,
    ) =>
      possible_triggers.some((trigger) =>
        actor.name.toLowerCase() === trigger.toLowerCase()
      )
    );

    const dialog = actor_in_room?.dialog?.find((d) =>
      d.trigger.some((trigger) =>
        possible_triggers.some((possibleTrigger) =>
          possibleTrigger.toLowerCase() === trigger.toLowerCase()
        )
      )
    );

    if (!actor_in_room || !dialog) {
      return { response: "hmm..." };
    }

    const dialog_action = this.world_actions.dialog_actions.find(
      (action) =>
        action.name === dialog.name &&
        action.trigger.every((value, index) => value === dialog.trigger[index]),
    );

    return {
      response: dialog_action
        ? dialog_action.action(player, input, command, args) as string
        : dialog.response || "hmm...",
    };
  }

  ////////////
  // VENDOR //
  ////////////

  dialog_contains_trigger(triggers: string[], words: string[]): number {
    return words.findIndex((word) => triggers.includes(word));
  }

  // dialog_remove_trigger(triggers: string[], words: string[]): string[] {
  //   return words.filter((word) => !triggers.includes(word));
  // }

  /**
   * Creates a new vendor and adds it to the world.
   *
   * @param {string} name - The name of the vendor.
   * @param {string} description - The description of the vendor.
   * @param {VendorItem[]} vendor_items - The items the vendor has for sale.
   */
  create_vendor(
    name: string,
    description: string,
    vendor_items: VendorItem[],
  ): void {
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
      (player, _input, _command, args) => {
        const trigger_index = this.dialog_contains_trigger(
          ["purchase", "buy"],
          args,
        );
        const item_name = args.slice(trigger_index + 1).join(" ");
        if (!item_name.trim()) {
          return "You must specify an item to purchase.";
        }

        return this.purchase_from_vendor(player, name, item_name);
      },
    );

    this.create_dialog(
      name,
      ["sell"],
      (player, _input, _command, args) => {
        const trigger_index = this.dialog_contains_trigger(["sell"], args);        
        const quantity = parseInt(args[args.length - 1], 10);
        if (isNaN(quantity)) {
          return "You must specify a quantity to sell.";
        }

        const item_name = args.slice(trigger_index + 1, -1).join(" ");
        const has_item = this.has_item_in_quantity(player, item_name, quantity);

        if (!has_item) {
          return `You don't have ${quantity} of ${item_name} to sell.`;
        }

        const item = this.get_item(item_name);

        if (!item) {
          return "That item does not exist.";
        }

        const total_value = item.value * quantity;
        player.gold += total_value;
        this.remove_player_item(player, item_name, quantity);

        return `You sold '${quantity}' of '${item.name}' for a value of '${total_value}'.`;
      },
    );
  }

  /**
   * Purchase an item from a vendor.
   *
   * @param {Player} player - The player to purchase the item.
   * @param {string} vendor_name - The name of the vendor to purchase the item from.
   * @param {string} item_name - The name of the item to purchase.
   * @returns {string} - The response message.
   */
  purchase_from_vendor(
    player: Player,
    vendor_name: string,
    item_name: string,
  ): string {
    const npc = this.get_npc(vendor_name);
    if (!npc || !npc.vendor_items || !(npc.vendor_items?.length > 0)) {
      return "That vendor does not exist or doesn't have items for sale.";
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
   * @param {string} name - The name of the item.
   * @param {string} description - The description of the item.
   * @param {boolean} usable - Whether the item is usable.
   * @param {Action | null} action - The action to perform when the item is used.
   * @returns {Item} - The created item.
   */
  create_item(
    name: string,
    description: string,
    usable: boolean,
    action: Action | null = null,
  ): Item {
    const item = {
      id: crypto.randomUUID(),
      name,
      descriptions: [{ flag: "default", description }],
      usable,
      level: 1,
      value: 1,
    };

    this.world.items.push(item);

    if (action) {
      this.world_actions.item_actions.push({
        name,
        action,
      });
    }

    return item;
  }

  /**
   * Sets the level and value of an item.
   *
   * @param item_name - The name of the item to set the level and value for.
   * @param level - The level to set.
   * @param value - The value to set.
   */
  set_item_level_and_value(
    item_name: string,
    level: number,
    value: number,
  ): void {
    const item = this.get_item(item_name);
    if (item) {
      item.level = level;
      item.value = value;
    }
  }

  /**
   * Gets an item in a room.
   *
   * @param {string} zone_name - The name of the zone to get the item from.
   * @param {string} room_name - The name of the room to get the item from.
   * @param {string} item_name - The name of the item to get.
   * @returns {Drop | null} - The item or null if it does not exist.
   * @throws {Error} - If the zone or room does not exist.
   */
  get_room_item(
    zone_name: string,
    room_name: string,
    item_name: string,
  ): Drop | null {
    const zone = this.get_zone(zone_name);
    if (!zone) {
      throw new Error(`Zone ${zone_name} does not exist.`);
    }

    const room = zone.rooms.find(
      (room) => room.name.toLowerCase() === room_name.toLowerCase(),
    );
    if (!room) {
      throw new Error(
        `Room ${room_name} does not exist in zone ${zone_name}.`,
      );
    }

    return (
      room.items.find(
        (item) => item.name.toLowerCase() === item_name.toLowerCase(),
      ) || null
    );
  }

  /**
   * Places an item in a room.
   *
   * @param {string} zone_name - The name of the zone to place the item in.
   * @param {string} in_room_name - The name of the room to place the item in.
   * @param {string} item_name - The name of the item to place.
   * @param {number} quantity - The quantity of the item to place.
   * @param {Player | null} player - If player is not null, the item will be placed in the player's instance.
   * @throws {Error} - If the zone or room does not exist.
   */
  place_item(
    zone_name: string,
    in_room_name: string,
    item_name: string,
    quantity: number = 1,
    player: Player | null = null,
  ): void {
    const item = this.get_item(item_name);
    if (!item) {
      throw new Error(`Item ${item_name} does not exist.`);
    }

    const room = player
      ? this.get_instance_room(player, zone_name, in_room_name)
      : this.get_room(zone_name, in_room_name);

    if (!room) {
      throw new Error(
        `Room ${in_room_name} does not exist in zone ${zone_name}.`,
      );
    }

    room.items.push({ name: item_name, quantity });
  }

  /**
   * Adds an item to a player.
   *
   * @param {Player} player - The player to add the item to.
   * @param {string} item_name - The name of the item to add.
   * @param {number} quantity - The quantity of the item to add.
   */
  add_item_to_player(
    player: Player,
    item_name: string,
    quantity: number = 1,
  ): void {
    const item = player.items.find(
      (item) => item.name.toLowerCase() === item_name.toLowerCase(),
    );

    if (item) {
      item.quantity += quantity;
    } else {
      player.items.push({ name: item_name, quantity });
    }
  }

  /**
   * Gets an item.
   *
   * @param {string} name - The name of the item to get.
   * @returns {Item | null} - The item or null if it does not exist.
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
   * @param {string} name - The name of the item to get the action for.
   * @returns {NamedAction | null} - The item action or null if it does not exist.
   * @throws {Error} - If the item does not exist.
   */
  get_item_action(name: string): NamedAction | null {
    const item = this.get_item(name);
    if (!item) {
      throw new Error(`Item ${name} does not exist.`);
    }

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
   * @param {Player} player - The player to check the item for.
   * @param {string} item_name - The name of the item to check.
   * @returns {boolean} - True if the player has the item, false otherwise.
   */
  has_item(player: Player, item_name: string): boolean {
    return player.items.some(
      (item) => item.name.toLowerCase() === item_name.toLowerCase(),
    );
  }

  /**
   * Checks if a player has an item in a certain quantity.
   *
   * @param {Player} player - The player to check the item for.
   * @param {string} item_name - The name of the item to check.
   * @param {number} quantity - The quantity of the item to check.
   * @returns {boolean} - True if the player has the item in the quantity, false otherwise.
   */
  has_item_in_quantity(
    player: Player,
    item_name: string,
    quantity: number,
  ): boolean {
    const item = player.items.find(
      (item) => item.name.toLowerCase() === item_name.toLowerCase(),
    );

    if (item && item.quantity >= quantity) {
      return true;
    }

    return false;
  }

  /**
   * Takes an item from a room.
   *
   * @param Playerplayer - The player to take the item.
   * @param {string[]} args - The arguments from the player.
   * @returns {CommandResponse} - The response object.
   */
  take_item(player: Player, args: string[]): CommandResponse {
    const current_room = this.get_player_room(player);

    if (!current_room) {
      throw new Error("Player is not in a valid room.");
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
   * @param {Player} player - The player to take the items.
   * @returns {CommandResponse} - The response object.
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

    const items = current_room.items
      .map((item) => `${item.name} (${item.quantity})`)
      .join(", ");

    current_room.items = [];

    return {
      response: `You took all items: ${items}`,
    };
  }

  /**
   * Uses an item.
   *
   * @param {Player} player - The player to use the item.
   * @param {string[]} args - The arguments from the player.
   * @returns {CommandResponse} - The response object.
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
   * Removes an item from a player. If the item quantity is 0, the item is
   * removed from the player. If the item quantity is greater than 0, the
   * quantity is decremented by 1.
   *
   * @param {Player} player - The player to remove the item from.
   * @param {string} item_name - The name of the item to remove.
   */
  remove_player_item(
    player: Player,
    item_name: string,
    quantity: number = 1,
  ): void {
    const item_index = player.items.findIndex(
      (item) => item.name.toLowerCase() === item_name.toLowerCase(),
    );

    if (item_index !== -1) {
      player.items[item_index].quantity -= quantity;

      if (
        player.items[item_index].quantity === 0 ||
        player.items[item_index].quantity < 0
      ) {
        player.items.splice(item_index, 1);
      }
    }
  }

  /**
   * Removes an item from the world.
   *
   * @param {string} item_name - The name of the item to remove.
   */
  remove_item(item_name: string): void {
    this.world.items = this.world.items.filter(
      (item) => item.name.toLowerCase() !== item_name.toLowerCase(),
    );
  }

  /**
   * Drops an item in a room.
   *
   * @param {Player} player - The player to drop the item.
   * @param {string[]} args - The arguments from the player.
   * @returns {CommandResponse} - The response object.
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
   * @param {Player} player - The player to drop the items.
   * @returns {CommandResponse} - The response object.
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
   * @param {Player} player - The player to show the items or quests for.
   * @param {string[]} args - The arguments from the player.
   * @returns {CommandResponse} - The response object.
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
   * @param {Player} player - The player to show the items for.
   * @returns {CommandResponse} - The response object.
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
   * @param {string} name - The name of the mob.
   * @param {string} description - The description of the mob.
   * @param {string} stats - The stats of the mob.
   * @param {Drop[]} items - The items the mob has.
   * @returns {Actor} - The created mob.
   */
  create_mob(
    name: string,
    description: string,
    stats: Stats,
    items: Drop[],
  ): Actor {
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
   * @param {string} name - The name of the mob to get.
   * @returns {Actor | null} - The mob or null if it does not exist.
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
   * @param {string} zone_name - The name of the zone to place the mob in.
   * @param {string} in_room_name - The name of the room to place the mob in.
   * @param {string} mob_name - The name of the mob to place.
   * @param {Player | null} player - If player is not null, the mob will be placed in the player's instance.
   * @throws {Error} - If the mob does not exist or the room does not exist in the zone.
   */
  place_mob(
    zone_name: string,
    in_room_name: string,
    mob_name: string,
    player: Player | null = null,
  ): void {
    const mob = this.get_mob(mob_name);
    if (!mob) {
      throw new Error(`MOB ${mob_name} does not exist.`);
    }

    const room = player
      ? this.get_instance_room(player, zone_name, in_room_name)
      : this.get_room(zone_name, in_room_name);

    if (!room) {
      throw new Error(
        `Room ${in_room_name} does not exist in zone ${zone_name}.`,
      );
    }

    room.mobs.push(structuredClone(mob));
  }

  /**
   * Gets a mob in a room.
   *
   * @param {string} zone_name - The name of the zone to get the mob from.
   * @param {string} room_name - The name of the room to get the mob from.
   * @param {string} mob_name - The name of the mob to get.
   * @returns {Actor | null} - The mob or null if it does not exist.
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
   * @param {Actor} attacker - The actor performing the attack.
   * @param {Actor} defender - The actor defending the attack.
   * @returns {string} - The result of the attack.
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
   * @param {Player} player - The player to initiate the attack.
   * @param {string[]} args - The arguments from the player.
   * @param {boolean} should_mob_attack - Whether the mob should attack the player.
   * @returns {CommandResponse} - The response object.
   * @throws {Error} - If the player is not in a valid zone or room.
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
        mob.items.forEach((item) => {
          this.place_item(
            zone.name,
            current_room.name,
            item.name,
            item.quantity,
          );
        });

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
   * @param {string} name - The name of the zone.
   */
  create_zone(name: string, description: string = ""): void {
    this.world.zones.push({
      id: crypto.randomUUID(),
      descriptions: [{
        flag: "default",
        description: description.length === 0 ? name : description,
      }],
      name,
      rooms: [],
      instance: false,
    });
  }

  /**
   * Create an instanced zone for a player.
   *
   * @param player - The player to create the zone for.
   * @param name - The name of the zone to create.
   */
  create_instanced_zone(player: Player, name: string): void {
    const zone = this.get_zone(name);
    if (!zone) {
      throw new Error(`Zone ${name} does not exist.`);
    }

    // If zone already exists in player instance then filter it out.
    player.instance = player.instance.filter(
      (z) => z.name.toLowerCase() !== name.toLowerCase(),
    );

    player.instance.push(structuredClone(zone));
  }

  /**
   * Removes a zone from the world.
   *
   * @param {string} name - The name of the zone to remove.
   */
  remove_zone(name: string): void {
    this.world.zones = this.world.zones.filter((zone) => zone.name !== name);
  }

  /**
   * Gets a zone.
   *
   * @param {string} zone_name - The name of the zone to get.
   * @returns {Zone | null} - The zone or null if it does not exist.
   */
  get_zone(zone_name: string): Zone | null {
    return (
      this.world.zones.find(
        (zone) => zone.name.toLowerCase() === zone_name.toLowerCase(),
      ) || null
    );
  }

  /**
   * Gets a player's instance zone.
   *
   * @param {Player} player - The player to get the zone from.
   * @param {string} zone_name - The name of the zone to get.
   * @returns {Zone | null} - The zone or null if it does not exist.
   */
  get_instance_zone(player: Player, zone_name: string): Zone | null {
    return (
      player.instance.find(
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
   * @param {string} zone_name - The name of the zone the room is in.
   * @param {string} room_name - The name of the room to add the description to.
   * @param {string} flag - The flag of the description.
   * @param {string} description - The description to add.
   * @throws {Error} - If the room does not exist in the zone.
   */
  add_room_description(
    zone_name: string,
    room_name: string,
    flag: string,
    description: string,
  ): void {
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
   * @param {string} zone_name - The name of the zone to remove the room from.
   * @param {string} room_name - The name of the room to remove.
   */
  remove_room(zone_name: string, room_name: string): void {
    const zone = this.get_zone(zone_name);
    if (zone) {
      zone.rooms = zone.rooms.filter((room) => room.name !== room_name);
    }
  }

  /**
   * Gets a room command action.
   *
   * @param {string} zone_name - The name of the zone to get the room command action from.
   * @param {string} room_name - The name of the room to get the room command action from.
   * @returns {RoomCommandActions | null} - The room command action or null if it does not exist.
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
   * @param {string} zone_name - The name of the zone the room is in.
   * @param {string} room_name - The name of the room to add the command action to.
   * @param {string} name - The name of the command action.
   * @param {string} description - The description of the command action.
   * @param {string[]} synonyms - The synonyms of the command action.
   * @param {CommandParserAction} action - The action to perform when the command is executed.
   * @throws {Error} - If the room does not exist in the zone.
   */
  add_room_command_action(
    zone_name: string,
    room_name: string,
    name: string,
    description: string,
    synonyms: string[],
    action: CommandParserAction,
  ): void {
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
   * @param {string} zone_name - The name of the zone the room is in.
   * @param {string} room_name - The name of the room to remove the command action from.
   * @param {string} action_name - The name of the command action to remove.
   */
  remove_room_command_action(
    zone_name: string,
    room_name: string,
    action_name: string,
  ): void {
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
   * @param {string} zone_name - The name of the zone to check the room in.
   * @param {string} room_name - The name of the room to check the command action in.
   * @param {string} action_name - The name of the command action to check.
   * @returns {boolean} - True if the room has the command action, false otherwise.
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
   * @param {string[]} filtered_actions - The filtered actions to find.
   * @param {string} zone_name - The name of the zone to find the room command action in.
   * @param {string} room_name - The name of the room to find the room command action in.
   * @returns {CommandAction | null} - The command action or null if it does not exist.
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
   * @param zone_name - The name of the zone to create the exit in.
   * @param from_room_name - The name of the room to create the exit from.
   * @param exit_name - The name of the exit.
   * @param to_room_name - The name of the room to create the exit to.
   * @param hidden - Whether the exit is hidden or not.
   * @throws {Error} - If the zone, room, or exit name does not exist.
   */
  create_exit(
    zone_name: string,
    from_room_name: string,
    exit_name: string,
    to_room_name: string,
    hidden = false,
  ): void {
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
   * @param {string} exit_name - The name of the exit.
   * @returns {Exit | null} - The opposite exit name or null if it does not exist.
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
   * @param {string} zone_name - The name of the zone to remove the exit from.
   * @param {string} from_room_name - The name of the room to remove the exit from.
   * @param {string} exit_name - The name of the exit to remove.
   * @throws {Error} - If the zone, room, or exit name does not exist.
   */
  remove_exit(
    zone_name: string,
    from_room_name: string,
    exit_name: string,
  ): void {
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
   * @param {string} zone_name - The name of the zone to get the exit from.
   * @param {string} from_room_name - The name of the room to get the exit from.
   * @param {string} exit_name - The name of the exit to get.
   * @returns {Exit} - The exit.
   * @throws {Error} - If the zone, room, or exit name does not exist.
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
   * @param {Player} player - The player to get the description for.
   * @returns {CommandResponse} - The response object.
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
   * @param {Player} player - The player to switch the room for.
   * @param {string} command - The command to switch the room with.
   * @returns {CommandResponse} - The response object.
   * @throws {Error} - If the player is not in a valid zone.
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
   * @param {string} room_name - The name of the room to check.
   * @returns {boolean} - True if the room has actions, false otherwise.
   */
  has_room_actions(room_name: string): boolean {
    return !!this.world_actions.room_actions.find(
      (action) => action.name === room_name,
    );
  }

  /**
   * Plots a map of the rooms.
   *
   * @param {Player} player - The player to plot the room map for.
   * @param {number} window_size - The window size to plot the map.
   * @returns {CommandResponse} - The response object.
   * @throws {Error} - If the player is not in a valid zone.
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
   * @param {string} zone_name - The name of the zone to create the room in.
   * @param {string} name - The name of the room.
   * @param {string} description - The description of the room.
   * @param {Action | null} action - The action to add to the room.
   * @returns {Room} - The created room.
   * @throws {Error} - If the zone does not exist.
   */
  create_room(
    zone_name: string,
    name: string,
    description: string,
    action: Action | null = null,
  ): Room {
    const zone = this.get_zone(zone_name);
    if (!zone) throw new Error(`Zone ${zone_name} does not exist.`);

    const id = name;

    // Create the new room and add it to the zone
    const room = {
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
      instance: false,
    };

    zone.rooms.push(room);

    // Add the action to the room actions if provided
    if (action) {
      this.world_actions.room_actions.push({
        name: id,
        actions: [action],
      });
    }

    return room;
  }

  /**
   * Creates an instanced room for a player.
   *
   * @param {Player} player - The player to create the room for.
   * @param {string} zone_name - The name of the zone to create the room in.
   * @param {string} room_name - The name of the room to create.
   * @returns {Room | null} - The created room or null if it does not exist.
   */
  create_instanced_room(
    player: Player,
    zone_name: string,
    room_name: string,
  ): Room | null {
    const zone = this.get_zone(zone_name);
    if (zone) {
      const room = zone.rooms.find((r) =>
        r.name.toLowerCase() === room_name.toLowerCase()
      );

      if (room) {
        const instance_zone = this.get_instance_zone(player, zone_name);

        if (instance_zone) {
          instance_zone.rooms.filter((r) =>
            r.name.toLowerCase() !== room_name.toLowerCase()
          );
        }

        const instanced_room = structuredClone(room);
        instanced_room.instance = true;

        player.instance.push({
          id: zone.id,
          descriptions: zone.descriptions,
          name: zone.name,
          rooms: [instanced_room],
          instance: true,
        });

        return instanced_room;
      }
    }

    return null;
  }

  /**
   * Sets a room as the starting room for a zone.
   *
   * @param {string} zone_name - The name of the zone to set the room as the starting room for.
   * @param {string} room_name - The name of the room to set as the starting room.
   * @throws {Error} - If the room does not exist in the zone.
   */
  set_room_as_zone_starter(zone_name: string, room_name: string): void {
    const zone = this.get_zone(zone_name);
    const room = this.get_room(zone_name, room_name);

    if (!zone) {
      throw new Error(`Zone ${zone_name} does not exist.`);
    }
    if (!room) {
      throw new Error(`Room ${room_name} does not exist in zone ${zone_name}.`);
    }

    zone.starting_room = room_name;
  }

  /**
   * Adds an action to a room.
   *
   * @param {string} zone_name - The name of the zone the room is in.
   * @param {string} room_name - The name of the room to add the action to.
   * @param {Action} action - The action to add.
   * @throws {Error} - If the room does not exist in the zone.
   */
  add_room_action(zone_name: string, room_name: string, action: Action): void {
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
   * @param {string} zone_name - The name of the zone to get the room from.
   * @param {string} room_name - The name of the room to get.
   * @returns {Room | null} - The room or null if it does not exist.
   * @throws {Error} - If the zone does not exist.
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
   * Gets a player's instance room.
   *
   * @param {Player} player - The player to get the room from.
   * @param {string} zone_name - The name of the zone to get the room from.
   * @param {string} room_name - The name of the room to get.
   * @returns {Room | null} - The room or null if it does not exist.
   */
  get_instance_room(
    player: Player,
    zone_name: string,
    room_name: string,
  ): Room | null {
    const zone = this.get_instance_zone(player, zone_name);
    if (!zone) return null;

    return (
      zone.rooms.find(
        (room) => room.name.toLowerCase() === room_name.toLowerCase(),
      ) ?? null
    );
  }

  /**
   * Gets the zone starting room.
   *
   * @param {string} zone_name - The name of the zone to get the starting room from.
   * @returns {Room | null} - The starting room or null if it does not exist.
   */
  get_zone_starter_room(zone_name: string): Room | null {
    const zone = this.get_zone(zone_name);
    if (!zone) return null;
    return zone.rooms.find((room) => zone.starting_room == room.name) ?? null;
  }

  /**
   * Inpects the current room for items and mobs.
   *
   * @param {Player} player - The player to inspect the room for.
   * @returns {CommandResponse} - The response object.
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
   * @param {Player} player - The player to look for.
   * @param {string} input - The input to look for.
   * @param {string} command - The command to look for.
   * @param {string[]} args - The arguments to look for.
   * @returns {CommandResponse} - The response object.
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
   * @param {string} name - The name of the room object.
   * @param {string} description - The description of the room object.
   * @param {Dialog[] | null} dialog - The dialog of the room object.
   * @returns {Actor} - The created room object.
   * @throws {Error} - If the room does not exist in the zone.
   */
  create_object(
    name: string,
    description: string,
    dialog?: Dialog[],
  ) {
    const object = {
      id: crypto.randomUUID(),
      name,
      descriptions: [{ flag: "default", description }],
      items: [],
      flags: [],
      dialog,
    };

    this.world.objects.push(object);

    return object;
  }

  /**
   * Places an object in a room.
   *
   * @param name - The name of the object to place.
   * @param zone_name - The name of the zone to place the object in.
   * @param room_name - The name of the room to place the object in.
   * @param {Player | null} player - If player is not null, the NPC will be placed in the player's instance.
   * @throws {Error} - If the object, zone or room does not exist.
   */
  place_object(
    zone_name: string,
    in_room_name: string,
    object_name: string,
    player: Player | null = null,
  ): void {
    const object = this.get_object(object_name);
    if (!object) {
      throw new Error(`Object ${object_name} does not exist.`);
    }

    const room = player
      ? this.get_instance_room(player, zone_name, in_room_name)
      : this.get_room(zone_name, in_room_name);

    if (!room) {
      throw new Error(
        `Room ${in_room_name} does not exist in zone ${zone_name}.`,
      );
    }

    room.objects.push(structuredClone(object));
  }

  /**
   * Gets an object.
   *
   * @param name - The name of the object to remove.
   * @returns {Actor | null} - The object or null if it does not exist.
   */
  get_object(name: string): Actor | null {
    return (
      this.world.objects.find(
        (object) => object.name.toLowerCase() === name.toLowerCase(),
      ) || null
    );
  }

  /**
   * Gets a room object.
   *
   * @param {string} zone_name - The name of the zone to get the room object from.
   * @param {string} room_name - The name of the room to get the room object from.
   * @param {string} object_name - The name of the room object to get.
   * @returns {Actor | null} - The room object or null if it does not exist.
   * @throws {Error} - If the room does not exist in the zone.
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
   * @param {Player} player - The player to look for.
   * @param {string} input - The input to look for.
   * @param {string} command - The command to look for.
   * @param {string[]} args - The arguments to look for.
   * @returns {CommandResponse} - The response object.
   */
  look_at_or_examine_object(
    player: Player,
    input: string,
    command: string,
    args: string[],
  ): CommandResponse {
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
   * @param {string} name - The name of the recipe.
   * @param {string} description - The description of the recipe.
   * @param {Drop[]} ingredients - The ingredients of the recipe.
   * @param {Drop} crafted_item - The crafted item of the recipe.
   */
  create_recipe(
    name: string,
    description: string,
    ingredients: Drop[],
    crafted_item: Drop,
  ): void {
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
   * @param {string} name - The name of the recipe to get.
   * @returns {Recipe | null} - The recipe or null if it does not exist.
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
   * @param {Player} player - The player to learn the recipe for.
   * @param {string} recipe_name - The name of the recipe to learn.
   * @returns {string} - The response message.
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
   * @param {Player} player - The player to craft the item for.
   * @param {string[]} args - The arguments to craft the item with.
   * @returns {CommandResponse} - The response object.
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
   * Adds a flag action.
   *
   * @param {string} name - The name of the flag action.
   * @param {Action} action - The action to add.
   */
  add_flag_action(name: string, action: Action): void {
    const flag_action = this.world_actions.flag_actions.find(
      (flag) => flag.name === name,
    );

    if (flag_action) {
      flag_action.action = action;
    } else {
      this.world_actions.flag_actions.push({
        name,
        action,
      });
    }
  }

  /**
   * Gets a flag action.
   *
   * @param {string} name - The name of the flag action to remove.
   * @returns {Action | null} - The flag action or null if it does not exist.
   */
  get_flag_action(name: string): Action | null {
    const flag_action = this.world_actions.flag_actions.find(
      (flag) => flag.name === name,
    );

    return flag_action ? flag_action.action : null;
  }

  /**
   * Saves player progress to a database.
   *
   * @param {Player} player - The player to save progress for.
   * @param {string} database_name - The name of the database to save progress to.
   * @param {string} slot_name - The name of the slot to save progress to.
   * @returns {Promise<CommandResponse>} - The response object.
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
   * @param {string} database_name - The name of the database to load progress from.
   * @param {string} slot_name - The name of the slot to load progress from.
   * @returns {Promise<PlayerProgress | null>} - The player progress or null if it does not exist.
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
   * @param {number} upper - The upper limit of the random number.
   * @returns {number} - The random number.
   */
  get_random_number(upper: number = 100): number {
    const nums = new Uint32Array(1);
    window.crypto.getRandomValues(nums);
    return nums[0] % (upper + 1);
  }

  /**
   * Creates a spawn location.
   *
   * @param {string} name - The name of the spawn location.
   * @param {string} zone - The name of the zone to spawn in.
   * @param {string} room - The name of the room to spawn in.
   * @param {number} interval - The interval to spawn at.
   * @param {boolean} active - Whether the spawn location is active.
   * @param {SpawnLocationAction} action - The action to run when spawning.
   * @returns {SpawnLocation} - The created spawn location.
   */
  create_spawn_location(
    name: string,
    zone: string,
    room: string,
    interval: number,
    active: boolean,
    action: SpawnLocationAction,
  ): SpawnLocation {
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

    return spawn_location;
  }

  /**
   * Gets a spawn location.
   *
   * @param {string} name - The name of the spawn location.
   * @returns {SpawnLocation | null} - The spawn location or null if it does not exist.
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
   * @param {string} name - The name of the spawn location.
   * @param {boolean} active - Whether the spawn location is active.
   */
  set_spawn_location_active(name: string, active: boolean): void {
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
   * @param {string} name - The name of the spawn location.
   */
  start_spawn_location(name: string): void {
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
   * @param {string} name - The name of the spawn location.
   */
  remove_spawn_location(name: string): void {
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
   * @param {string} npc_name - The name of the NPC to create the dialog for.
   * @param {string[]} trigger - The trigger for the dialog.
   * @param {string | CommandParserAction} responseOrAction - The response or action for the dialog.
   */
  create_dialog(
    npc_name: string,
    trigger: string[],
    responseOrAction: string | CommandParserAction,
  ): void {
    const npc = this.get_npc(npc_name);
    if (!npc) return;

    const dialog_id = crypto.randomUUID();

    if (!npc.dialog) {
      npc.dialog = [];
    }

    let response = undefined;
    if (typeof responseOrAction === "string") {
      response = responseOrAction;
    }

    npc.dialog.push({
      name: dialog_id,
      trigger,
      response,
    });

    if (responseOrAction instanceof Function) {
      this.create_dialog_action(dialog_id, trigger, responseOrAction);
    }
  }

  /**
   * Creates a dialog action.
   *
   * @param {string} dialog_id - The ID of the dialog.
   * @param {string[]} trigger - The trigger for the dialog.
   * @param {CommandParserAction} action - The action for the dialog.
   */
  create_dialog_action(
    dialog_id: string,
    trigger: string[],
    action: CommandParserAction,
  ): void {
    this.world_actions.dialog_actions.push({
      name: dialog_id,
      trigger,
      action,
    });
  }

  /**
   * Gets a description for an entity.
   *
   * @param {Player} player - The player to get the description for.
   * @param {Entity} entity - The entity to get the description for.
   * @param {string} flag - The flag to get the description for.
   * @returns {string | null} - The description or null if it does not exist.
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
   * @param {string} name - The name of the command action.
   * @param {string} description - The description of the command action.
   * @param {string[]} synonyms - The synonyms of the command action.
   * @param {CommandParserAction} action - The action of the command action.
   * @returns {CommandAction} - The command action.
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
   * @param {string[]} possible_actions - The possible actions to find.
   * @param {CommandAction[]} command_actions - The command actions to search.
   * @returns {CommandAction | null} - The command action or null if it does not exist.
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
   * @returns {World} - The reset world.
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
   * @returns {World Actions} - The reset world actions.
   */
  reset_world_actions(): WorldActions {
    const world_actions: WorldActions = {
      spawn_locations: [],
      dialog_actions: [],
      flag_actions: [],
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
   * @param {string} str - The string to convert to title case.
   * @returns {string} - The string in title case.
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
   * @param starting_experience - The starting experience.
   * @param growth_rate - The growth rate.
   * @param num_levels - The number of levels to calculate.
   * @returns {Level[]} - The levels.
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
   * @param input_array - The input array to generate combinations for.
   * @returns {string[]} - The generated combinations.
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
   * @param player - The player to get help for.
   * @returns {CommandResponse} - The response object.
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
   * @param health - The health of the actor.
   * @param stamina - The stamina of the actor.
   * @param magicka - The magicka of the actor.
   * @param physical_damage - The physical damage of the actor.
   * @param physical_defense - The physical defense of the actor.
   * @param spell_damage - The spell damage of the actor.
   * @param spell_defense - The spell defense of the actor.
   * @param critical_chance - The critical chance of the actor.
   * @param progress - The progress of the actor.
   * @returns {Stats} - The stats.
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
   * @param {Player} player - The player to set the godmode flag for.
   */
  set_godmode(player: Player): void {
    this.set_flag(player, "godmode");
  }

  /**
   * Removes the godmode flag for a player.
   *
   * @param {Player} player - The player to remove the godmode flag for.
   */
  remove_godmode(player: Player): void {
    this.remove_flag(player, "godmode");
  }

  /**
   * Sets a flag for a player.
   *
   * @param {Player} player - The player to set the flag for.
   * @param {string} flag - The flag to set.
   */
  set_flag(player: Player, flag: string): void {
    if (player && !player.flags.includes(flag)) {
      player.flags.push(flag);
    }
  }

  /**
   * Checks if a player has a flag.
   *
   * @param {Player} player - The player to check the flag for.
   * @param {string} flag - The flag to check.
   * @returns {boolean} - Whether the player has the flag.
   */
  has_flag(player: Player, flag: string): boolean {
    return player && player.flags.includes(flag);
  }

  /**
   * Removes a flag from a player.
   *
   * @param {Player} player - The player to remove the flag from.
   * @param {string} flag - The flag to remove.
   */
  remove_flag(player: Player, flag: string): void {
    if (player && player.flags.includes(flag)) {
      player.flags = player.flags.filter((f) => f !== flag);
    }
  }

  /**
   * If player is in godmode, they can go to any room or zone.
   *
   * @param {Player} player - The player to go to the room or zone for.
   * @param {string[]} args - The arguments to go to the room or zone with.
   * @returns {CommandResponse} - The response object.
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
   * @param {string[]} first_array - The first array to filter from.
   * @param {string[]} second_array - The second array to filter with.
   * @returns {string[]} - The filtered array.
   */
  filter_substrings(first_array: string[], second_array: string[]): string[] {
    return second_array.filter(
      (word) => !first_array.some((phrase) => phrase.includes(word)),
    );
  }

  /**
   * Parses a command from a player.
   *
   * @param {Player} player - The player to parse the command for.
   * @param {string} input - The input to parse the command with.
   * @returns {Promise<string>} - The parsed command.
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
   * @param {number} port - The port to run the server on.
   * @param {string} fix_me_player_id - The hard coded player ID.
   */
  run_websocket_server(port: number, fix_me_player_id: string): void {
    const process_request = async (game_message: GameMessage) => {
      const player = this.get_player(game_message.player_id);
      if (player) {
        console.log(`${player.id}: ${game_message.command}`);
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
        return final_response;
      } else {
        console.log(`${game_message.player_id}: player not found`);
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
