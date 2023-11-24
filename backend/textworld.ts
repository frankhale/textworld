// A Text Adventure Library & Game for Deno
// Frank Hale &lt;frankhale AT gmail.com&gt;
// 21 November 2023

// FIXME: The commenting out of crypto.randomUUID() for id naming is a hack to
// get around the fact that loading from a save file will result in all action
// instances not having the correct id. For now we are using predictable ids to
// get around this. The names are set to `name` primarily for the various
// objects these actions go with. So for instance a room action will have the
// same id as the name of the room it goes with. Collisions are bound to happen
// like this and not be obvious.

export const player_progress_db_name = "game_saves.db";
export const input_character_limit = 256;
export const active_quest_limit = 5;

type Action = (player: Player) => string | null;
type ActionNoOutput = (player: Player) => void | null;
type ActionDecision = (player: Player) => boolean;
type CommandParserAction = (
  player: Player,
  input: string,
  command: string,
  args: string[]
) => string | Promise<string>;

export interface Description {
  flag: string;
  description: string;
}

export interface Id {
  id?: string | null;
}

export interface Entity extends Id {
  name: string;
  descriptions: Description[];
}

export interface Stats {
  stats: Resources;
  damage_and_defense: DamageAndDefense;
}

export interface Storage {
  items: ItemDrop[];
}

export interface Player extends Entity, Stats, Storage {
  score: number;
  gold: number;
  progress: Level;
  zone: string;
  room: string;
  flags: string[];
  quests: string[];
  quests_completed: string[];
  known_recipes: string[];
}

export interface Resources {
  health: Stat;
  stamina: Stat;
  magicka: Stat;
}

export interface DamageAndDefense {
  physical_damage: number;
  physical_defense: number;
  spell_damage: number;
  spell_defense: number;
  critical_chance: number;
}

export interface Recipe extends Entity {
  ingredients: ItemDrop[];
  crafted_item: ItemDrop;
}

export interface Stat {
  current: number;
  max: number;
}

export interface Level {
  level: number;
  xp: number;
}

export interface NPC extends Entity, Stats {
  inventory: string[];
  dialog: Dialog[] | null;
  killable: boolean;
  vendor_items: VendorItem[] | null;
}

export interface Mob extends Entity, Stats, Storage {}

export interface VendorItem {
  name: string;
  price: number;
}

export interface Dialog extends Id {
  trigger: string[];
  response: string | null;
}

export interface RoomObject extends Entity {
  dialog: Dialog[] | null;
  inventory: string[];
}

export interface Item extends Entity {
  usable: boolean;
}

export interface Exit {
  name: string;
  location: string;
  hidden: boolean;
}

export interface ItemDrop {
  name: string;
  quantity: number;
}

export interface World {
  zones: Zone[];
  items: Item[];
  recipes: Recipe[];
  npcs: NPC[];
  mobs: Mob[];
  players: Player[];
  quests: Quest[];
  level_data: Level[];
}

export interface Zone {
  name: string;
  rooms: Room[];
}

export interface Room extends Entity, Storage {
  zone_start: boolean;
  npcs: NPC[];
  exits: Exit[];
  mobs: Mob[];
  objects: RoomObject[];
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

////////////////////
// ACTION OBJECTS //
////////////////////

export interface QuestAction extends Id {
  start: ActionNoOutput | null;
  end: ActionNoOutput | null;
}

export interface QuestStepAction extends Id {
  action: ActionDecision;
}

type QuestActionType = "Start" | "End";

export interface CommandAction extends Entity {
  synonyms: string[];
  action: CommandParserAction;
}

export interface DialogAction extends Id {
  trigger: string[];
  action: CommandParserAction;
}

export interface ItemAction extends Id {
  action: Action;
}

export interface RoomAction extends Id {
  actions: Action[] | null;
}

export interface RoomCommandActions extends Id {
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
      (player, _input, command, _args) => this.switch_room(player, command)
    ),
    this.create_command_action(
      "take action",
      "Take an item from the room or an NPC.",
      ["take", "get"],
      (player, _input, _command, args) => this.take_item(player, args)
    ),
    this.create_command_action(
      "use action",
      "Use an item in your inventory.",
      ["use"],
      (player, _input, _command, args) => this.use_item(player, args)
    ),
    this.create_command_action(
      "drop action",
      "Drop an item or all your items from your inventory.",
      ["drop"],
      (player, _input, _command, args) => this.drop_item(player, args)
    ),
    this.create_command_action(
      "look action",
      "Look around the room or at yourself.",
      ["look", "l"],
      (player, input, command, args) => this.look(player, input, command, args)
    ),
    this.create_command_action(
      "look self action",
      "Look at yourself.",
      ["ls"],
      (player, input, _command, _args) =>
        this.look(player, input, "look self", ["look", "self"])
    ),
    this.create_command_action(
      "examine action",
      "Examine an object in a room.",
      ["examine", "x"],
      (player, input, command, args) =>
        this.look_at_or_examine_object(player, input, command, args)
    ),
    this.create_command_action(
      "inspect action",
      "Inspect a room to see what items are there.",
      ["inspect", "i"],
      (player, _input, _command, _args) => this.inspect_room(player)
    ),
    this.create_command_action(
      "map action",
      "Plot a map showing nearby rooms.",
      ["map"],
      (player, _input, _command, _args) => this.plot_room_map(player, 5)
    ),
    this.create_command_action(
      "show action",
      "Show an item in your inventory.",
      ["show"],
      (player, _input, _command, args) => this.show_item(player, args)
    ),
    this.create_command_action(
      "talk to action",
      "Talk to an NPC or Vendor.",
      ["talk to", "tt"],
      (player, input, command, args) => {
        if (args) {
          return this.talk_to_npc(player, input, command, args);
        }
        return "You must specify an NPC to talk to.";
      }
    ),
    this.create_command_action(
      "quit action",
      "Quit the game.",
      ["quit"],
      (_player, _input, _command, _args) => {
        return "You quit the game.";
      }
    ),
    this.create_command_action(
      "goto action",
      "Go to a room or zone.",
      ["goto"],
      (player, _input, _command, args) => {
        if (this.has_flag(player, "godmode")) {
          return this.goto(player, args);
        }
        return "I don't understand that command.";
      }
    ),
    this.create_command_action(
      "help action",
      "Show the help text.",
      ["help"],
      (player, _input, _command, _args) => this.get_help(player)
    ),
    this.create_command_action(
      "attack action",
      "Attack a mob.",
      ["attack"],
      (player, _input, _command, args) => this.attack_mob(player, args, true)
    ),
    this.create_command_action(
      "craft action",
      "Craft an item.",
      ["craft"],
      (player, _input, _command, args) => this.craft_recipe(player, args)
    ),
  ];
  private main_async_command_actions: CommandAction[] = [
    this.create_command_action(
      "save action",
      "Save player progress.",
      ["save"],
      async (player, _input, _command, args) => {
        let result = "You must specify a slot name";
        if (args.length >= 0) {
          await this.save_player_progress(
            player,
            player_progress_db_name,
            args[0]
          );
          result = `Progress has been saved to slot: ${args[0]}`;
        }
        return result;
      }
    ),
    this.create_command_action(
      "load action",
      "Load player progress.",
      ["load"],
      async (player, _input, _command, args) => {
        let result = "You must specify a slot name";
        if (args.length >= 0) {
          const player_result = await this.load_player_progress(
            player_progress_db_name,
            args[0]
          );

          if (player_result) {
            result = `Progress has been loaded from slot: ${args[0]}`;
            player.score = player_result.player.score;
            player.stats = player_result.player.stats;
            player.damage_and_defense = player_result.player.damage_and_defense;
            player.progress = player_result.player.progress;
            player.gold = player_result.player.gold;
            player.zone = player_result.player.zone;
            player.room = player_result.player.room;
            player.flags = player_result.player.flags;
            player.items = player_result.player.items;
            player.quests = player_result.player.quests;
            player.quests_completed = player_result.player.quests_completed;
            player.known_recipes = player_result.player.known_recipes;

            this.world.zones = player_result.world.zones;
            this.world.items = player_result.world.items;
            this.world.recipes = player_result.world.recipes;
            this.world.npcs = player_result.world.npcs;
            this.world.mobs = player_result.world.mobs;
            this.world.players = player_result.world.players;
            this.world.quests = player_result.world.quests;
            this.world.level_data = player_result.world.level_data;
          } else {
            result = `Unable to load progress from slot: ${args[0]}`;
          }
        }
        return result;
      }
    ),
  ];
  private player_dead_command_actions: CommandAction[] = [
    this.create_command_action(
      "quit action",
      "Quit the game.",
      ["quit"],
      (_player, _input, _command, _args) => "You quit the game."
    ),
    this.create_command_action(
      "help action",
      "Show the help text.",
      ["help"],
      (player, _input, _command, _args) => this.get_help(player)
    ),
    this.create_command_action(
      "resurrect action",
      "resurrect yourself.",
      ["resurrect", "rez"],
      (player, _input, _command, _args) => this.resurrect_player(player)
    ),
  ];

  constructor() {}

  ////////////
  // PLAYER //
  ////////////

  create_player(
    name: string,
    description: string,
    zone_name: string,
    room_name: string
  ) {
    const player: Player = {
      id: crypto.randomUUID(),
      name,
      descriptions: [{ flag: "default", description }],
      score: 0,
      stats: {
        health: {
          current: 10,
          max: 10,
        },
        stamina: {
          current: 10,
          max: 10,
        },
        magicka: {
          current: 10,
          max: 10,
        },
      },
      damage_and_defense: {
        physical_damage: 10,
        physical_defense: 10,
        spell_damage: 10,
        spell_defense: 5,
        critical_chance: 0.1,
      },
      progress: {
        level: 1,
        xp: 0,
      },
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

  resurrect_player(player: Player) {
    player.stats.health.current = player.stats.health.max;
    player.stats.stamina.current = player.stats.stamina.max;
    player.stats.magicka.current = player.stats.magicka.max;
    // TODO: Move player to starting room
    return "You have been resurrected.";
  }

  get_player(id: string) {
    return this.world.players.find((player) => player.id === id);
  }

  remove_player(player: Player) {
    this.world.players = this.world.players.filter(
      (p) => p.name !== player.name
    );
  }

  get_players_zone(player: Player): Zone | null {
    if (!player) return null;
    return this.world.zones.find((zone) => zone.name === player.zone)!;
  }

  get_players_room(player: Player): Room | null {
    const zone = this.get_players_zone(player);
    if (zone) {
      return zone.rooms.find(
        (room) => room.name.toLowerCase() === player.room.toLowerCase()
      )!;
    }
    return null;
  }

  look_self(player: Player): string {
    if (!player) return "You can't see anything.";

    const inventory = player.items
      .map((item) => `${item.name} (${item.quantity})`)
      .join(", ");

    return `${this.get_description(player, player, "default")}${
      player.items.length > 0 ? `\n\nInventory: ${inventory}` : ""
    }`;
  }

  set_players_room_to_zone_start(player: Player, zone_name: string) {
    const room = this.get_zone_starter_room(zone_name);
    if (room) {
      player.zone = zone_name;
      player.room = room.name;
    } else {
      throw new Error(`Zone ${zone_name} does not have a starter room.`);
    }
  }

  set_players_room(player: Player, zone_name: string, room_name: string) {
    const room = this.get_room(zone_name, room_name);
    if (room) {
      player.zone = zone_name;
      player.room = room_name;
    }
  }

  ///////////
  // QUEST //
  ///////////

  create_quest(name: string, description: string) {
    this.world.quests.push({
      id: name, //crypto.randomUUID(),
      name,
      descriptions: [{ flag: "default", description }],
      complete: false,
      steps: null,
    });
  }

  get_quest_action(quest_name: string) {
    const quest = this.get_quest(quest_name);
    if (!quest) return null;
    return (
      this.world_actions.quest_actions.find(
        (quest_action) => quest_action.id === quest.id
      ) ?? null
    );
  }

  get_quest_step_action(quest_name: string, name: string) {
    const quest_step = this.get_quest_step(quest_name, name);
    if (!quest_step) return null;
    return (
      this.world_actions.quest_step_actions.find(
        (quest_step_action) => quest_step_action.id === quest_step.id
      ) ?? null
    );
  }

  add_quest_action(
    quest_name: string,
    action_type: QuestActionType,
    action: ActionNoOutput | null
  ) {
    const quest = this.get_quest(quest_name);
    if (quest) {
      const quest_action: QuestAction = {
        id: quest.id,
        start: null,
        end: null,
      };
      if (action_type === "Start") {
        quest_action.start = action;
      } else {
        quest_action.end = action;
      }
      this.world_actions.quest_actions.push(quest_action);
    }
  }

  add_quest_step(
    quest_name: string,
    name: string,
    description: string,
    action: ActionDecision | null = null
  ) {
    const quest = this.get_quest(quest_name);
    if (quest) {
      if (!quest.steps) quest.steps = [];
      const id = name; //crypto.randomUUID();
      quest.steps.push({
        id,
        name,
        descriptions: [{ flag: "default", description }],
        complete: false,
      });
      if (action) {
        this.world_actions.quest_step_actions.push({
          id,
          action,
        });
      }
    }
  }

  get_quest(name: string): Quest | null {
    return (
      this.world.quests.find(
        (quest) => quest.name.toLowerCase() === name.toLowerCase()
      ) ?? null
    );
  }

  get_quest_step(quest_name: string, name: string): QuestStep | null {
    const quest = this.get_quest(quest_name);
    return quest?.steps?.find((step) => step.name === name) ?? null;
  }

  pickup_quest(player: Player, quest_name: string): string {
    let result = "The quest does not exist.";

    if (player) {
      if (player.quests.length >= active_quest_limit) {
        result = `You can't have more than ${active_quest_limit} active quests at a time.`;
      } else {
        const quest = this.get_quest(quest_name);
        if (quest) {
          if (!player.quests.includes(quest.name)) {
            player.quests.push(quest.name);
            result = `You picked up the quest ${quest.name}.`;
            const quest_action = this.get_quest_action(quest.name);
            if (quest_action && quest_action.start) {
              const quest_start_result = quest_action.start(player);
              if (quest_start_result) {
                result += `\n\n${quest_start_result}`;
              }
            }
          } else {
            result = `You already have the quest ${quest.name}.`;
          }
        }
      }
    }
    return result;
  }

  drop_quest(player: Player, quest_name: string): string {
    const quest = this.get_quest(quest_name);

    let result = `The quest ${quest_name} does not exist.`;

    if (quest) {
      if (player && player.quests.includes(quest.name)) {
        player.quests = player.quests.filter((quest) => quest !== quest_name);
        result = `You dropped the quest ${quest.name}.`;
        const quest_action = this.get_quest_action(quest.name);
        if (quest_action && quest_action.end) {
          const quest_end_result = quest_action.end(player);
          if (quest_end_result) {
            result += `\n\n${quest_end_result}`;
          }
        }
      } else {
        result = `You don't have the quest ${quest.name}.`;
      }
    }
    return result;
  }

  is_quest_complete(player: Player, quest_name: string): boolean {
    let result = false;

    const quest = this.get_quest(quest_name);
    if (quest) {
      if (player && player.quests.includes(quest.name)) {
        if (quest.steps) {
          result = quest.steps.every((step) => {
            const quest_step_action = this.get_quest_step_action(
              quest.name,
              step.name
            );
            if (!step.complete && quest_step_action) {
              return quest_step_action.action(player);
            } else {
              return step.complete;
            }
          });

          if (result) {
            const quest_action = this.get_quest_action(quest.name);
            if (quest_action && quest_action.end) quest_action.end(player);

            if (!player.quests_completed.includes(quest.name)) {
              player.quests = player.quests.filter(
                (quest) => quest !== quest_name
              );
              player.quests_completed.push(quest.name);
            }
          }
        }
      }
    }
    return result;
  }

  get_quest_progress(player: Player, quest_name: string): string {
    let result = `The quest ${quest_name} does not exist.`;
    const quest = this.get_quest(quest_name);

    if (quest && player && player.quests.includes(quest.name)) {
      result = `Quest: ${quest.name}\n\n${this.get_description(
        player,
        quest,
        "default"
      )}\n\n`;
      if (quest.steps) {
        quest.steps.forEach((step) => {
          const quest_step_action = this.get_quest_step_action(
            quest.name,
            step.name
          );
          if (quest_step_action && !step.complete) {
            step.complete = quest_step_action.action(player);
          }
          result += `${step.complete ? "[x]" : "[ ]"} ${step.name}\n`;
        });
      }
    } else {
      result = `You don't have the quest ${quest_name}.`;
    }

    return result;
  }

  // check_for_quest_completion(player: Player) {
  //   player.quests.every((quest) => {
  //     return this.is_quest_complete(player, quest);
  //   });
  // }

  show_quests(player: Player): string {
    let result = "You have no quests.";

    if (player && player.quests.length > 0) {
      const quests_description = player.quests.map((player_quest) => {
        const quest = this.world.quests.find(
          (quest) => quest.name === player_quest
        );
        return `${quest!.name} - ${this.get_description(
          player,
          quest!,
          "default"
        )}`;
      });

      result = quests_description.join("\n\n");
    }

    return result;
  }

  /////////
  // NPC //
  /////////

  remove_npc(name: string) {
    this.world.zones.forEach((zone) => {
      zone.rooms.forEach((room) => {
        room.npcs = room.npcs.filter((npc) => npc.name !== name);
      });
    });
    this.world.npcs = this.world.npcs.filter((npc) => npc.name !== name);
  }

  get_npc(name: string): NPC | null {
    return (
      this.world.npcs.find(
        (npc) => npc.name.toLowerCase() === name.toLowerCase()
      ) ?? null
    );
  }

  place_npc(zone_name: string, in_room_name: string, npc_name: string) {
    const in_room = this.get_room(zone_name, in_room_name);
    const npc = this.world.npcs.find((npc) => npc.name === npc_name);

    if (!in_room || !npc) {
      throw new Error(
        `Room ${in_room_name} or NPC ${npc_name} does not exist.`
      );
    }

    in_room.npcs.push(npc);
  }

  get_room_npc(
    zone_name: string,
    room_name: string,
    npc_name: string
  ): NPC | null {
    const zone = this.get_zone(zone_name);
    const room = zone?.rooms.find((room) => room.name === room_name);
    return (
      room?.npcs.find(
        (npc) => npc.name.toLowerCase() === npc_name.toLowerCase()
      ) || null
    );
  }

  talk_to_npc(
    player: Player,
    input: string,
    command: string,
    args: string[]
  ): string {
    let result = "That NPC does not exist.";
    const zone = this.get_players_zone(player);
    if (zone) {
      const possible_triggers = this.generate_combinations(args);
      const current_room = this.get_players_room(player);
      const npc = this.world.npcs.find((npc) =>
        possible_triggers.some(
          (trigger) => npc.name.toLowerCase() === trigger.toLowerCase()
        )
      );

      if (npc && !npc.dialog) {
        result = `${npc.name} does not want to talk to you.`;
      } else if (
        npc &&
        current_room &&
        npc.dialog &&
        current_room.npcs.includes(npc)
      ) {
        const dialog = npc.dialog?.find((dialog) =>
          dialog.trigger.some((trigger) => possible_triggers.includes(trigger))
        );
        if (dialog) {
          const dialog_action = this.world_actions.dialog_actions.find(
            (action) => action.trigger === dialog.trigger
          );

          if (dialog_action) {
            result = dialog_action.action(
              player,
              input,
              command,
              args
            ) as string;
          } else {
            result = dialog.response || "hmm...";
          }
        } else {
          result = "hmm...";
        }
      }
    }
    return result;
  }

  create_npc(name: string, description: string) {
    this.world.npcs.push({
      id: name, //crypto.randomUUID(),
      name,
      descriptions: [{ flag: "default", description }],
      inventory: [],
      stats: this.create_resources(10, 10, 10, 10, 10, 10),
      damage_and_defense: this.create_damage_and_defense(10, 10, 10, 10, 10),
      killable: false,
      dialog: null,
      vendor_items: null,
    });
  }

  ////////////
  // VENDOR //
  ////////////

  create_vendor(name: string, description: string, vendor_items: VendorItem[]) {
    this.world.npcs.push({
      id: name, //crypto.randomUUID(),
      name,
      descriptions: [{ flag: "default", description }],
      stats: this.create_resources(10, 10, 10, 10, 10, 10),
      inventory: [],
      killable: false,
      damage_and_defense: this.create_damage_and_defense(10, 10, 10, 10, 10),
      dialog: [],
      vendor_items,
    });

    this.create_dialog(
      name,
      ["items"],
      null,
      (_player, _input, _command, _args) => {
        const items = vendor_items.map(
          (vendor_item) => `${vendor_item.name} (${vendor_item.price} gold)`
        );
        return `Items for sale: ${items.join(", ")}`;
      }
    );
    this.create_dialog(
      name,
      ["purchase", "buy"],
      null,
      (player, input, _command, _args) => {
        if (input) {
          const command_bits = input.split(" ");
          if (command_bits) {
            let trigger_word = command_bits.lastIndexOf("purchase") ?? -1;
            if (trigger_word === -1) {
              trigger_word = command_bits.lastIndexOf("buy") ?? -1;
              const item_name = command_bits.slice(trigger_word + 1).join(" ");
              return this.purchase_from_vendor(player, name, item_name!);
            }
          }
        }
        return "You must specify an item to purchase.";
      }
    );
  }

  purchase_from_vendor(
    player: Player,
    vendor_name: string,
    item_name: string
  ): string {
    let result = "That vendor does not exist.";
    const npc = this.get_npc(vendor_name);

    if (npc && npc.vendor_items) {
      const vendor_item = npc.vendor_items.find(
        (item) => item.name.toLowerCase() === item_name.toLowerCase()
      );
      const item = this.world.items.find(
        (item) => item.name.toLowerCase() === item_name.toLowerCase()
      );

      if (!vendor_item || !item) {
        result = "That item does not exist.";
      } else {
        if (player && vendor_item && player.gold >= vendor_item.price) {
          player.gold -= vendor_item.price;
          player.items.push({ name: vendor_item.name, quantity: 1 });
          result = `You purchased ${vendor_item.name} for ${vendor_item.price} gold.`;
        } else {
          result = `You don't have enough gold to purchase ${item_name}.`;
        }
      }
    }

    return result;
  }

  //////////
  // ITEM //
  //////////

  add_item_drops_to_room(player: Player, item_drops: ItemDrop[]) {
    const current_room = this.get_players_room(player);
    if (current_room) {
      item_drops.forEach((item) => {
        const room_item = current_room.items.find(
          (room_item) => room_item.name === item.name
        );
        if (room_item) {
          room_item.quantity += item.quantity;
        } else {
          current_room.items.push(item);
        }
      });
    }
  }

  get_room_item(
    zone_name: string,
    room_name: string,
    item_name: string
  ): ItemDrop | null {
    const zone = this.get_zone(zone_name);
    const room = zone.rooms.find((room) => room.name === room_name);
    if (room) {
      return (
        room.items.find(
          (item) => item.name.toLowerCase() === item_name.toLowerCase()
        ) ?? null
      );
    }
    return null;
  }

  place_item(
    zone_name: string,
    in_room_name: string,
    item_name: string,
    quantity = 1
  ) {
    const zone = this.get_zone(zone_name);
    const in_room = zone.rooms.find((room) => room.name === in_room_name);
    if (in_room) {
      in_room.items.push({
        name: item_name,
        quantity,
      });
    } else {
      throw new Error(
        `Room ${in_room_name} does not exist in zone ${zone_name}.`
      );
    }
  }

  create_item(
    name: string,
    description: string,
    usable: boolean,
    action: Action | null = null
  ) {
    const id = name; //crypto.randomUUID();
    this.world.items.push({
      id,
      name: name,
      descriptions: [{ flag: "default", description }],
      usable,
    });
    if (action) {
      this.world_actions.item_actions.push({
        id,
        action,
      });
    }
  }

  get_item(name: string): Item | null {
    return (
      this.world.items.find(
        (item) => item.name.toLowerCase() === name.toLowerCase()
      ) ?? null
    );
  }

  get_item_action(name: string): ItemAction | null {
    const item = this.get_item(name);
    if (!item) return null;
    return (
      this.world_actions.item_actions.find(
        (item_action) => item_action.id === item.id
      ) ?? null
    );
  }

  has_item(player: Player, item_name: string): boolean {
    return player.items.some(
      (item) => item.name.toLowerCase() === item_name.toLowerCase()
    );
  }

  has_item_in_quantity(player: Player, item_name: string, quantity: number) {
    const item = player.items.find(
      (item) => item.name.toLowerCase() === item_name.toLowerCase()
    );
    if (item) {
      return item.quantity >= quantity;
    }
    return false;
  }

  take_item(player: Player, args: string[]): string {
    let result = "That item does not exist.";
    const zone = this.get_players_zone(player);
    if (zone) {
      const current_room = zone.rooms.find((room) => room.name === player.room);
      if (current_room) {
        const possible_items = this.generate_combinations(args);

        if (possible_items.includes("all")) {
          return this.take_all_items(player);
        } else {
          const room_item = current_room.items.find((item) =>
            possible_items.find(
              (possible_item) =>
                item.name.toLowerCase() === possible_item.toLowerCase()
            )
          );

          if (room_item) {
            const player_item = player.items.find(
              (item) => item.name === room_item.name
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
              (item) => item.name !== room_item.name
            );
            result = `You took the ${room_item.name}.`;
          }
        }
      }
    }
    return result;
  }

  take_all_items(player: Player): string {
    let result = "That item does not exist.";
    const current_room = this.get_players_zone(player)?.rooms.find(
      (room) => room.name === player.room
    );

    if (current_room) {
      current_room.items.forEach((room_item) => {
        const player_item = player.items.find(
          (pitem) => pitem.name === room_item.name
        );

        if (player_item) {
          player_item.quantity += room_item.quantity;
        } else {
          player.items.push({
            name: room_item.name,
            quantity: room_item.quantity,
          });
        }
      });

      current_room.items = [];
      result = "You took all items.";
    }

    return result;
  }

  use_item(player: Player, args: string[]): string {
    let result = "That item does not exist.";

    if (player) {
      const possible_items = this.generate_combinations(args);
      const player_item = player.items.find((item) =>
        possible_items.find(
          (possible_item) =>
            item.name.toLowerCase() === possible_item.toLowerCase()
        )
      );

      if (player_item) {
        const item_definition = this.world.items.find(
          (item) => item.name === player_item.name
        );
        if (item_definition) {
          if (!item_definition.usable) return "You can't use that item.";

          const item_action = this.world_actions.item_actions.find(
            (action) => action.id === item_definition.id
          );

          if (item_action) {
            const action_result = item_action.action(player);
            if (action_result) {
              result = action_result;
            }
          }

          if (!result) {
            result = "You used the item but nothing happened.";
          }

          if (this.has_flag(player, "prevent_item_consumption")) {
            this.remove_flag(player, "prevent_item_consumption");
          } else {
            player_item.quantity--;
            if (player_item.quantity === 0) {
              player.items = player.items.filter(
                (item) => item.name !== player_item.name
              );
            }
          }
        }
      }
    }
    return result;
  }

  remove_player_item(player: Player, item_name: string) {
    const item_index = player?.items.findIndex(
      (item) => item.name.toLowerCase() === item_name.toLowerCase()
    );

    if (item_index !== undefined && item_index !== -1) {
      player.items[item_index].quantity--;

      if (player.items[item_index].quantity === 0) {
        player.items.splice(item_index, 1);
      }
    }
  }

  remove_item(item_name: string) {
    this.world.items = this.world.items.filter(
      (item) => item.name !== item_name
    );
  }

  drop_item(player: Player, args: string[]): string {
    let result = "That item does not exist.";
    const zone = this.get_players_zone(player);
    if (zone) {
      const possible_items = this.generate_combinations(args);

      if (possible_items.includes("all")) {
        return this.drop_all_items(player);
      } else {
        const player_item = player.items.find((item) =>
          possible_items.find(
            (possible_item) =>
              item.name.toLowerCase() === possible_item.toLowerCase()
          )
        );

        if (player_item) {
          const current_room = zone.rooms.find(
            (room) => room.name === player.room
          );
          if (current_room) {
            current_room.items.push({
              name: player_item.name,
              quantity: player_item.quantity,
            });
            player.items = player.items.filter(
              (item) => item.name !== player_item.name
            );
            result = `You dropped the ${player_item.name}.`;
          }
        }
      }
    }
    return result;
  }

  drop_all_items(player: Player): string {
    let result = "You have no items to drop.";
    const current_room = this.get_players_zone(player)?.rooms.find(
      (room) => room.name === player.room
    );

    if (current_room && player.items.length > 0) {
      current_room.items.push(...player.items);
      player.items = [];

      result = "You dropped all your items.";
    }
    return result;
  }

  show_item(player: Player, args: string[]): string {
    let result = "That item does not exist.";
    const possible_items = this.generate_combinations(args);

    if (possible_items.includes("all")) {
      result = this.show_all_items(player);
    } else if (possible_items.includes("quests")) {
      result = this.show_quests(player);
    } else if (player) {
      const player_item = player.items.find((item) =>
        possible_items.find(
          (possible_item) =>
            item.name.toLowerCase() === possible_item.toLowerCase()
        )
      );

      if (player_item) {
        const item = this.world.items.find(
          (item) => item.name === player_item.name
        );
        if (item) {
          result = this.get_description(player, item, "default")!;
        }
      }
    }
    return result;
  }

  show_all_items(player: Player): string {
    let result = "You have no items to show.";

    if (player && player.items.length > 0) {
      const items_description = player.items
        .map((item) => {
          const item_definition = this.world.items.find(
            (item_definition) => item_definition.name === item.name
          );
          return item_definition
            ? `${item_definition.name} - ${this.get_description(
                player,
                item_definition,
                "default"
              )}`
            : null;
        })
        .filter(Boolean);

      result = items_description.join("\n\n");
    }
    return result;
  }

  /////////
  // MOB //
  /////////

  create_mob(
    name: string,
    description: string,
    stats: Resources,
    damage_and_defense: DamageAndDefense,
    items: ItemDrop[]
  ) {
    const mob: Mob = {
      id: crypto.randomUUID(),
      name,
      descriptions: [{ flag: "default", description }],
      stats,
      damage_and_defense,
      items,
    };
    this.world.mobs.push(mob);
    return mob;
  }

  get_mob(name: string): Mob | null {
    return (
      this.world.mobs.find(
        (mob) => mob.name.toLowerCase() === name.toLowerCase()
      ) ?? null
    );
  }

  place_mob(zone_name: string, in_room_name: string, mob_name: string) {
    const in_room = this.get_room(zone_name, in_room_name);
    const mob = this.get_mob(mob_name);
    if (in_room && mob) {
      in_room.mobs.push(structuredClone(mob));
    } else {
      throw new Error(
        `Room ${in_room_name} or MOB ${mob_name} does not exist.`
      );
    }
  }

  get_room_mob(
    zone_name: string,
    room_name: string,
    mob_name: string
  ): Mob | null {
    const zone = this.get_zone(zone_name);
    const room = zone.rooms.find((room) => room.name === room_name);
    if (room) {
      return (
        room.mobs.find(
          (mob) => mob.name.toLowerCase() === mob_name.toLowerCase()
        ) ?? null
      );
    }
    return null;
  }

  attack(attacker: Player | Mob, defender: Player | Mob): string {
    const attacker_damage =
      Math.random() < attacker.damage_and_defense.critical_chance
        ? attacker.damage_and_defense.physical_damage * 2
        : attacker.damage_and_defense.physical_damage;

    const damage_dealt = Math.max(
      0,
      attacker_damage - defender.damage_and_defense.physical_defense
    );

    defender.stats.health.current -= damage_dealt;

    defender.stats.health.current = Math.max(0, defender.stats.health.current);
    attacker.stats.health.current = Math.max(0, attacker.stats.health.current);

    let result = `${attacker.name} attacks ${defender.name} for ${damage_dealt} damage.\n${defender.name} health: ${defender.stats.health.current}`;

    if (
      defender.stats.health.current <= 0 ||
      attacker.stats.health.current <= 0
    ) {
      result += `\n${
        defender.stats.health.current <= 0 ? defender.name : attacker.name
      } has been defeated!`;
    }

    return result;
  }

  attack_mob(
    player: Player,
    args: string[],
    should_mob_attack = false
  ): string {
    let result = "That mob does not exist.";
    const zone = this.get_players_zone(player);
    if (zone) {
      const possible_mobs = this.generate_combinations(args);
      const current_room = this.get_players_room(player);
      if (current_room) {
        const mob = current_room?.mobs.find(
          (mob) =>
            mob.name.toLowerCase() ===
            possible_mobs
              .find((mob_name) => {
                return mob_name.toLowerCase() === mob_name.toLowerCase();
              })
              ?.toLowerCase()
        );
        if (mob) {
          result = this.attack(player, mob);
          if (should_mob_attack && mob.stats.health.current > 0) {
            result += `\n${this.attack(mob, player)}`;
          }

          if (mob.stats.health.current <= 0) {
            mob.stats.health.current = 0;
            this.add_item_drops_to_room(player, mob.items);
            result += `\n${mob.name} dropped: ${mob.items
              .map((item) => item.name)
              .join(", ")}`;
            current_room.mobs = current_room.mobs.filter(
              (mob) => mob.name !== mob.name
            );
          }
        }
      }
    }
    return result;
  }

  //////////
  // ZONE //
  //////////

  create_zone(name: string) {
    this.world.zones.push({
      name,
      rooms: [],
    });
  }

  remove_zone(name: string) {
    this.world.zones = this.world.zones.filter((zone) => zone.name !== name);
  }

  get_zone(zone_name: string): Zone {
    return this.world.zones.find(
      (zone) => zone.name.toLowerCase() === zone_name.toLowerCase()
    )!;
  }

  //////////
  // ROOM //
  //////////

  add_room_description(
    zone_name: string,
    room_name: string,
    flag: string,
    description: string
  ) {
    const room = this.get_room(zone_name, room_name);
    if (room) {
      room.descriptions.push({ flag, description });
    } else {
      throw new Error(`Room ${room_name} does not exist in zone ${zone_name}.`);
    }
  }

  remove_room(zone_name: string, room_name: string) {
    const zone = this.get_zone(zone_name);
    zone.rooms = zone.rooms.filter((room) => room.name !== room_name);
  }

  get_room_command_action(zone_name: string, room_name: string) {
    const room = this.get_room(zone_name, room_name);
    if (room) {
      return this.world_actions.room_command_actions.find(
        (action) => action.id === room.id
      );
    }
    return null;
  }

  add_room_command_action(
    zone_name: string,
    room_name: string,
    name: string,
    description: string,
    synonyms: string[],
    action: CommandParserAction
  ) {
    const room = this.get_room(zone_name, room_name);
    if (room) {
      const room_command_actions = this.get_room_command_action(
        zone_name,
        room_name
      );
      const command_action = {
        id: name, //crypto.randomUUID(),
        name,
        descriptions: [{ flag: "default", description }],
        synonyms,
        action,
      };
      if (room_command_actions) {
        room_command_actions.command_actions.push(command_action);
      } else {
        this.world_actions.room_command_actions.push({
          id: room.id,
          command_actions: [command_action],
        });
      }
    } else {
      throw new Error(`Room ${room_name} does not exist in zone ${zone_name}.`);
    }
  }

  remove_room_command_action(
    zone_name: string,
    room_name: string,
    action_name: string
  ) {
    const zone = this.get_zone(zone_name);
    const room = zone.rooms.find((room) => room.name === room_name);
    if (room) {
      const room_command_actions = this.get_room_command_action(
        zone_name,
        room_name
      );
      if (room_command_actions) {
        room_command_actions.command_actions =
          room_command_actions.command_actions.filter(
            (action) => action.name !== action_name
          );
      }
    }
  }

  has_room_command_action(
    zone_name: string,
    room_name: string,
    action_name: string
  ): boolean {
    const zone = this.get_zone(zone_name);
    const room = zone.rooms.find((room) => room.name === room_name);
    if (room) {
      const room_command_actions = this.get_room_command_action(
        zone_name,
        room_name
      );
      if (room_command_actions) {
        return room_command_actions.command_actions.some(
          (action) => action.name === action_name
        );
      }
    }
    return false;
  }

  create_exit(
    zone_name: string,
    from_room_name: string,
    exit_name: string,
    to_room_name: string,
    hidden = false
  ) {
    const zone = this.get_zone(zone_name);
    if (!zone) throw new Error(`Zone ${zone_name} does not exist.`);
    const from_room = zone.rooms.find((room) => room.name === from_room_name);
    const to_room = zone.rooms.find((room) => room.name === to_room_name);

    if (from_room && to_room) {
      let opposite_exit_name = "";
      switch (exit_name) {
        case "north":
          opposite_exit_name = "south";
          break;
        case "south":
          opposite_exit_name = "north";
          break;
        case "east":
          opposite_exit_name = "west";
          break;
        case "west":
          opposite_exit_name = "east";
          break;
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
    } else {
      throw new Error(
        `Room ${from_room_name} or ${to_room_name} does not exist in zone ${zone_name}.`
      );
    }
  }

  remove_exit(zone_name: string, from_room_name: string, exit_name: string) {
    const zone = this.get_zone(zone_name);
    if (!zone) throw new Error(`Zone ${zone_name} does not exist.`);
    const from_room = zone.rooms.find((room) => room.name === from_room_name);

    if (from_room) {
      from_room.exits = from_room.exits.filter(
        (exit) => exit.name !== exit_name
      );
    } else {
      throw new Error(
        `Room ${from_room_name} does not exist in zone ${zone_name}.`
      );
    }
  }

  get_exit(zone_name: string, from_room_name: string, exit_name: string): Exit {
    const zone = this.get_zone(zone_name);
    if (zone) {
      const from_room = zone.rooms.find((room) => room.name === from_room_name);

      if (from_room) {
        const exit = from_room.exits.find((exit) => exit.name === exit_name);
        if (exit) {
          return exit;
        }
      }
    }

    throw new Error("The room or zone does not exist.");
  }

  get_room_description(player: Player): string {
    let result = "You can't see anything.";
    const zone = this.get_players_zone(player);
    if (zone) {
      const current_room = zone.rooms.find(
        (room) => room.name.toLowerCase() === player.room.toLowerCase()
      );

      if (current_room) {
        const exits: string[] = [];
        current_room.exits.forEach((exit) => {
          if (!exit.hidden) {
            exits.push(exit.name);
          }
        });
        const npcs_in_room: string[] = [];
        if (current_room.npcs.length > 0) {
          current_room.npcs.forEach((npc) => {
            let npc_name = npc.name;
            if (npc.vendor_items) {
              npc_name = `${npc_name} (Vendor)`;
            }
            npcs_in_room.push(npc_name);
          });
        }

        result = `Location: ${current_room.name}\n\n${this.get_description(
          player,
          current_room,
          "default"
        )}`;

        if (npcs_in_room.length > 0) {
          result += `\n\NPCs: ${npcs_in_room}`;
        }

        if (exits.length > 0) {
          result += `\n\nExits: ${exits.join(", ")}`;
        }
      }
    }
    return result;
  }

  switch_room(player: Player, command = ""): string {
    let result = "You can't go that way.";
    const zone = this.get_players_zone(player);
    if (zone) {
      let current_room = zone.rooms.find((room) => room.name === player.room);
      if (current_room && command.length > 0) {
        const exit = current_room.exits.find((exit) => exit.name === command);
        if (exit) {
          if (exit.hidden) exit.hidden = false;
          player.room = exit.location;
          result = this.get_room_description(player);
          const new_room = zone.rooms.find((room) => room.name === player.room);
          if (new_room) {
            current_room = new_room;
          }
        }
      } else {
        result = this.get_room_description(player);
      }

      if (current_room) {
        const new_room_actions = this.world_actions.room_actions.find(
          (action) => action.id === current_room?.id
        );

        if (new_room_actions && new_room_actions.actions) {
          let action_result = "";
          new_room_actions.actions.every((action) => {
            const result = action(player);
            if (result) {
              action_result += result;
            }
          });

          if (action_result) {
            result = `${result}\n\n${action_result}`;
          }
        }
      }
    }
    return result;
  }

  plot_room_map(player: Player, window_size: number) {
    let result = "You are not in a zone.";
    const zone = this.get_players_zone(player);
    if (zone) {
      let rooms = zone.rooms;

      if (window_size != 0) {
        const current_room_index = rooms.findIndex(
          (room) => room.name === player.room
        );
        let window_start = current_room_index - 5;
        let window_end = current_room_index + 5;
        if (window_start - window_size <= 0) window_start = 0;
        if (window_end + window_size >= rooms.length) window_end = rooms.length;
        rooms = rooms.slice(window_start, window_end);
      }

      const room_grid: { [key: string]: string } = {};
      const visited_rooms = new Set<string>();
      let current_room = rooms[0];
      let current_x = 0;
      let current_y = 0;
      room_grid[`${current_x},${current_y}`] =
        current_room.name === player.room ? "@" : "#";

      const queue = [{ room: current_room, x: current_x, y: current_y }];
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

      while (queue.length > 0) {
        const item = queue.shift();
        if (item) {
          current_room = item.room;
          current_x = item.x;
          current_y = item.y;

          if (visited_rooms.has(current_room.name)) continue;
          visited_rooms.add(current_room.name);

          current_room.exits.forEach((exit) => {
            if (exit.hidden) return;
            const room = rooms.find((room) => room.name === exit.location);
            if (room && direction_to_coords[exit.name]) {
              const [dx, dy] = direction_to_coords[exit.name];
              const symbol = direction_to_symbol[exit.name];
              room_grid[`${current_x + dx},${current_y + dy}`] =
                room.name === player.room ? "@" : "#";
              room_grid[`${current_x + dx / 2},${current_y + dy / 2}`] = symbol;
              queue.push({ room, x: current_x + dx, y: current_y + dy });
            }
          });
        }
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
      result = `Map:\n\n${map_result.join("\n")}\n`;
    }

    return result;
  }

  create_room(
    zone_name: string,
    name: string,
    description: string,
    action: Action | null = null
  ) {
    const zone = this.get_zone(zone_name);
    if (!zone) throw new Error(`Zone ${zone_name} does not exist.`);

    const id = name; //crypto.randomUUID();

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
    });

    let actions: Action[] | null = null;
    if (action) {
      actions = [action];

      this.world_actions.room_actions.push({
        id,
        actions,
      });
    }
  }

  set_room_as_zone_starter(zone_name: string, room_name: string) {
    const zone = this.get_zone(zone_name);
    if (!zone) throw new Error(`Zone ${zone_name} does not exist.`);
    const room = zone.rooms.find((room) => room.name === room_name);
    if (room) {
      room.zone_start = true;
    } else {
      throw new Error(`Room ${room_name} does not exist in zone ${zone_name}.`);
    }
  }

  add_room_action(zone_name: string, room_name: string, action: Action) {
    const room = this.get_room(zone_name, room_name);
    if (room) {
      this.world_actions.room_actions.push({
        id: room.id,
        actions: [action],
      });
    }
  }

  get_room(zone_name: string, room_name: string): Room | null {
    const zone = this.get_zone(zone_name);
    if (!zone) throw new Error(`Zone ${zone_name} does not exist.`);
    return (
      zone.rooms.find(
        (room) => room.name.toLowerCase() === room_name.toLowerCase()
      ) ?? null
    );
  }

  get_zone_starter_room(zone_name: string): Room | null {
    const zone = this.get_zone(zone_name);
    return zone.rooms.find((room) => room.zone_start) ?? null;
  }

  inspect_room(player: Player): string {
    let result = "There is nothing else of interest here.";
    const current_room = this.get_players_zone(player)?.rooms.find(
      (room) => room.name === player.room
    );

    if (current_room) {
      const items = current_room.items.map(
        (item) => `${item.name} (${item.quantity})`
      );
      const items_string =
        items.length > 0
          ? `Items: ${items.join(", ")}`
          : "There is nothing else of interest here.";

      const mobs = current_room.mobs.map((mob) => mob.name);
      const mobs_string = mobs.length > 0 ? `Mobs: ${mobs.join(", ")}` : "";

      //result = [mobs_string, items_string].filter(Boolean).join("\n");
      result = `You inspect the room and found:\n\n${[mobs_string, items_string]
        .filter(Boolean)
        .join("\n")}`;
    }

    return result;
  }

  look(player: Player, input: string, command: string, args: string[]): string {
    let result = "You can't see anything.";
    const possible_actions = this.generate_combinations(args);

    if (possible_actions.includes("self")) {
      result = this.look_self(player);
    } else if (possible_actions.includes("at")) {
      result = this.look_at_or_examine_object(player, input, command, args);
    } else {
      const current_room = this.get_players_zone(player)?.rooms.find(
        (room) => room.name === player.room
      );

      if (current_room) {
        const exits = current_room.exits
          .filter((exit) => !exit.hidden)
          .map((exit) => exit.name)
          .join(", ");
        result = `${this.get_description(player, current_room, "default")}${
          exits.length > 0 ? `\n\nExits: ${exits}` : ""
        }`;
      }
    }

    return result;
  }

  /////////////////
  // ROOM OBJECT //
  /////////////////

  create_and_place_room_object(
    zone_name: string,
    room_name: string,
    name: string,
    description: string,
    dialog: Dialog[] | null = null
  ) {
    const room = this.get_room(zone_name, room_name);
    if (!room)
      throw new Error(`Room ${room_name} does not exist in zone ${zone_name}.`);
    room.objects.push({
      id: name, //crypto.randomUUID(),
      name,
      descriptions: [{ flag: "default", description }],
      inventory: [],
      dialog,
    });
  }

  get_room_object(
    zone_name: string,
    room_name: string,
    object_name: string
  ): RoomObject | null {
    const room = this.get_room(zone_name, room_name);
    if (!room) {
      throw new Error(`Room ${room_name} does not exist in zone ${zone_name}.`);
    }
    return (
      room.objects.find(
        (object) => object.name.toLowerCase() === object_name.toLowerCase()
      ) ?? null
    );
  }

  // TODO: Objects are almost entirely NPCs except for the fact that we interact
  // with them differently. We could definitely benefit from having one function
  // that handles both NPCs and objects.
  look_at_or_examine_object(
    player: Player,
    input: string,
    command: string,
    args: string[]
  ): string {
    let result = "That object does not exist.";
    const zone = this.get_players_zone(player);
    if (zone) {
      const possible_triggers = this.generate_combinations(args);
      const current_room = this.get_players_room(player);
      const obj = current_room?.objects.find((obj) =>
        possible_triggers.some(
          (trigger) => obj.name.toLowerCase() === trigger.toLowerCase()
        )
      );

      if (obj && current_room && current_room.objects.includes(obj)) {
        if (input.startsWith("look at")) {
          return this.get_description(player, obj, "default")!;
        } else if (input.startsWith("examine") && obj.dialog) {
          const dialog = obj.dialog.find((dialog) =>
            dialog.trigger.some((trigger) =>
              possible_triggers.includes(trigger)
            )
          );
          if (dialog) {
            const dialog_action = this.world_actions.dialog_actions.find(
              (action) => action.id === dialog.id
            );

            if (dialog_action) {
              result = dialog_action.action(
                player,
                input,
                command,
                args
              ) as string;
            } else if (dialog?.response) {
              result = dialog.response;
            }
          }
        }
      }
    }
    return result;
  }

  //////////////
  // CRAFTING //
  //////////////

  create_recipe(
    name: string,
    description: string,
    ingredients: ItemDrop[],
    crafted_item: ItemDrop
  ) {
    this.world.recipes.push({
      id: name, //crypto.randomUUID(),
      name,
      descriptions: [{ flag: "default", description }],
      ingredients,
      crafted_item,
    });
  }

  get_recipe(name: string): Recipe | null {
    return (
      this.world.recipes.find(
        (recipe) => recipe.name.toLowerCase() === name.toLowerCase()
      ) ?? null
    );
  }

  learn_recipe(player: Player, recipe_name: string): string {
    let result = "That recipe does not exist.";
    const recipe = this.get_recipe(recipe_name);
    if (recipe) {
      if (player.known_recipes.includes(recipe.name)) {
        this.set_flag(player, "prevent_item_consumption");
        result = "You already know that recipe.";
      } else {
        player.known_recipes.push(recipe.name);
        result = `You learned the recipe for ${recipe.name}.`;
      }
    }
    return result;
  }

  craft_recipe(player: Player, args: string[]): string {
    let result = "You don't know how to craft that.";
    const recipe_names = this.generate_combinations(args);
    const recipe_name = recipe_names.find((name) =>
      this.world.recipes.some(
        (recipe) => recipe.name.toLowerCase() === name.toLowerCase()
      )
    );
    if (recipe_name) {
      const recipe = this.get_recipe(recipe_name);
      if (recipe) {
        let has_ingredients = true;
        recipe.ingredients.forEach((ingredient) => {
          if (
            !this.has_item_in_quantity(
              player,
              ingredient.name,
              ingredient.quantity
            )
          ) {
            has_ingredients = false;
          }
        });

        if (has_ingredients) {
          recipe.ingredients.forEach((ingredient) => {
            for (let i = 0; i < ingredient.quantity; i++) {
              this.remove_player_item(player, ingredient.name);
            }
          });
          player.items.push({
            name: recipe.crafted_item.name,
            quantity: recipe.crafted_item.quantity,
          });
          result = `${recipe.crafted_item.name} has been crafted.`;
        } else {
          result = "You don't have the ingredients to craft that.";
        }
      }
    }
    return result;
  }

  //////////
  // MISC //
  //////////

  async save_player_progress(
    player: Player,
    database_name: string,
    slot_name: string
  ): Promise<string> {
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
    return result;
  }

  async load_player_progress(
    database_name: string,
    slot_name: string
  ): Promise<PlayerProgress | null> {
    const kv = await Deno.openKv(database_name);
    const result = await kv.get([slot_name]);
    kv.close();
    if (result.value) {
      return result.value as PlayerProgress;
    }
    return null;
  }

  get_random_number(upper = 100) {
    const nums = new Uint32Array(1);
    window.crypto.getRandomValues(nums);
    return nums[0] % (upper + 1);
  }

  create_spawn_location(
    name: string,
    zone: string,
    room: string,
    interval: number,
    active: boolean,
    action: (spawn_location: SpawnLocation) => void
  ) {
    const spawn_location: SpawnLocation = {
      name,
      zone,
      room,
      interval,
      active,
      action,
      timer_id: 0,
      timer: () => {},
    };

    spawn_location.timer = () => {
      spawn_location.timer_id = setInterval(() => {
        if (spawn_location.active) {
          spawn_location.action(spawn_location);
        }
      }, spawn_location.interval);
    };

    this.world_actions.spawn_locations.push(spawn_location);
  }

  set_spawn_location_active(name: string, active: boolean) {
    const spawn_location = this.world_actions.spawn_locations.find(
      (location) => location.name === name
    );
    if (spawn_location) {
      spawn_location.active = active;
    }
  }

  spawn_location_start(name: string) {
    const spawn_location = this.world_actions.spawn_locations.find(
      (location) => location.name === name
    );
    if (spawn_location) {
      spawn_location.timer();
    }
  }

  remove_spawn_location(name: string) {
    const spawn_location = this.world_actions.spawn_locations.find(
      (location) => location.name === name
    );

    if (spawn_location) {
      clearInterval(spawn_location.timer_id);
    }

    this.world_actions.spawn_locations =
      this.world_actions.spawn_locations.filter(
        (location) => location.name !== name
      );
  }

  create_dialog(
    npc_name: string,
    trigger: string[],
    response: string | null,
    action: CommandParserAction | null
  ) {
    const npc = this.get_npc(npc_name);
    if (npc) {
      const id = npc_name; //crypto.randomUUID();
      if (!npc.dialog) {
        npc.dialog = [];
      }
      npc.dialog.push({
        id,
        trigger,
        response,
      });
      if (action) {
        this.world_actions.dialog_actions.push({
          id,
          trigger,
          action,
        });
      }
    }
  }

  create_dialog_action(
    id: string,
    trigger: string[],
    action: CommandParserAction
  ) {
    this.world_actions.dialog_actions.push({
      id,
      trigger,
      action,
    });
  }

  get_description(player: Player, entity: Entity, flag: string): string | null {
    if (flag === "default" && player.flags.length > 0) {
      for (const player_flag of player.flags) {
        const matching_desc = entity.descriptions.find(
          (desc) => desc.flag === player_flag
        );
        if (matching_desc) {
          flag = matching_desc.flag;
        }
      }
    }
    const description = entity.descriptions.find((desc) => desc.flag === flag);
    return description ? description.description : null;
  }

  create_command_action(
    name: string,
    description: string,
    synonyms: string[],
    action: CommandParserAction
  ): CommandAction {
    return {
      id: name, //crypto.randomUUID(),
      name,
      descriptions: [{ flag: "default", description }],
      synonyms,
      action,
    };
  }

  reset_world() {
    const world: World = {
      zones: [],
      items: [],
      recipes: [],
      npcs: [],
      mobs: [],
      players: [],
      quests: [],
      level_data: this.calculate_level_experience(1, 1.2, 50),
    };
    this.world = world;
    this.reset_world_actions();
    return world;
  }

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

  to_title_case(str: string): string {
    return str
      .split(" ")
      .map((word) => word[0].toUpperCase() + word.slice(1))
      .join(" ");
  }

  calculate_level_experience(
    starting_experience: number,
    growth_rate: number,
    num_levels: number
  ): Level[] {
    const required_experience_points: Level[] = [];

    for (let level = 1; level <= num_levels; level++) {
      const xp = starting_experience * Math.pow(growth_rate, level - 1);
      required_experience_points.push({ level, xp });
    }

    return required_experience_points;
  }

  generate_combinations(input_array: string[]): string[] {
    const result: string[] = [];

    function generate_helper(combination: string, start_idx: number) {
      result.push(combination.trim());

      for (let i = start_idx; i < input_array.length; i++) {
        const new_combination =
          combination + (combination.length > 0 ? " " : "") + input_array[i];
        generate_helper(new_combination, i + 1);
      }
    }

    generate_helper("", 0);
    return result.filter((str) => str !== "");
  }

  get_help(player: Player) {
    const command_actions =
      player.stats.health.current <= 0
        ? this.player_dead_command_actions
        : this.main_command_actions;
    const result = command_actions
      .map(
        (action) =>
          `${action.synonyms.join(", ")} - ${this.get_description(
            player,
            action,
            "default"
          )}`
      )
      .join("\n");
    return `Commands:\n\n${result}`;
  }

  create_resources(
    health_current: number,
    health_max: number,
    stamina_current: number,
    stamina_max: number,
    magicka_current: number,
    magicka_max: number
  ): Resources {
    return {
      health: {
        current: health_current,
        max: health_max,
      },
      stamina: {
        current: stamina_current,
        max: stamina_max,
      },
      magicka: {
        current: magicka_current,
        max: magicka_max,
      },
    };
  }

  create_damage_and_defense(
    physical_damage: number,
    physical_defense: number,
    spell_damage: number,
    spell_defense: number,
    critical_chance: number
  ): DamageAndDefense {
    return {
      physical_damage,
      physical_defense,
      spell_damage,
      spell_defense,
      critical_chance,
    };
  }

  set_godmode(player: Player) {
    this.set_flag(player, "godmode");
  }

  remove_godmode(player: Player) {
    this.remove_flag(player, "godmode");
  }

  set_flag(player: Player, flag: string) {
    if (player && !player.flags.includes(flag)) {
      player.flags.push(flag);
    }
  }

  has_flag(player: Player, flag: string) {
    return player && player.flags.includes(flag);
  }

  remove_flag(player: Player, flag: string) {
    if (player && player.flags.includes(flag)) {
      player.flags = player.flags.filter((f) => f !== flag);
    }
  }

  goto(player: Player, args: string[]): string {
    let result = "That room or zone does not exist.";
    let new_zone_name: string | null = null;
    let new_room_name: string | null = null;
    const possible_rooms_or_zones = this.generate_combinations(args);

    for (const possible_room_or_zone of possible_rooms_or_zones) {
      const room_or_zone = possible_room_or_zone.toLowerCase();

      if (room_or_zone.startsWith("room")) {
        const room_name = possible_room_or_zone.replace(/room/, "").trim();
        const new_room = this.get_room(player.zone, room_name);

        if (new_room) {
          new_room_name = new_room.name;
          break;
        }
      } else if (room_or_zone.startsWith("zone")) {
        const zone_name = possible_room_or_zone.replace(/zone/, "").trim();
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
      let new_room_description = this.get_room_description(player);

      const new_room = this.get_players_room(player);
      const new_room_actions = this.world_actions.room_actions.find(
        (action) => action.id === new_room?.id
      );
      if (new_room && new_room_actions && new_room_actions.actions) {
        const actionResult = new_room_actions.actions
          .map((action) => action(player))
          .filter((result) => result)
          .join("");

        new_room_description = `${new_room_description}\n\n${actionResult}`;
      }

      result = new_room_description;
    }

    return result;
  }

  async parse_command(player: Player, input: string): Promise<string> {
    let result = "I don't understand that command.";
    const input_limit = Math.min(input_character_limit, input.length);
    input = input.substring(0, input_limit);

    const [command, ...args] = input.toLowerCase().split(" ");
    const possible_actions = this.generate_combinations(input.split(" "));

    const talk_to = possible_actions.find((action) =>
      action.toLowerCase().startsWith("talk to")
    );
    const filtered_actions = possible_actions.filter((action) =>
      talk_to ? action.toLowerCase().includes(talk_to) : true
    );

    const command_actions =
      player.stats.health.current <= 0
        ? this.player_dead_command_actions
        : this.main_command_actions;

    const command_action = command_actions.find((action) =>
      action.synonyms.some((synonym) => filtered_actions.includes(synonym))
    );

    if (command_action) {
      result = command_action.action(player, input, command, args) as string;
    } else {
      const async_command_action = this.main_async_command_actions.find(
        (action) =>
          action.synonyms.some((synonym) => filtered_actions.includes(synonym))
      );

      if (async_command_action) {
        result = await async_command_action.action(
          player,
          input,
          command,
          args
        );
      } else {
        if (this.world.zones.length > 0) {
          const players_room = this.get_players_room(player);
          if (players_room) {
            const players_room_command_actions = this.get_room_command_action(
              player.zone,
              players_room.name
            );

            if (players_room_command_actions) {
              const room_command_action =
                players_room_command_actions.command_actions.find((action) =>
                  action.synonyms.some((synonym) =>
                    filtered_actions.includes(synonym)
                  )
                );

              if (room_command_action) {
                result = `${this.get_description(
                  player,
                  room_command_action,
                  "default"
                )}\n\n${room_command_action.action(
                  player,
                  input,
                  command,
                  args
                )}`;
              } else {
                result = "I don't understand that command.";
              }
            }
          } else {
            result = "Player's room does not exist.";
          }
        }
      }
    }

    return result;
  }
}
