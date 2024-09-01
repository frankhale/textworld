// A Text Adventure Library & Game for Deno
// Frank Hale &lt;frankhaledevelops AT gmail.com&gt;
// 29 August 2024

export const player_progress_db_name = "game_saves.db";
export const input_character_limit = 256;
export const active_quest_limit = 5;

type Action<T = void> = (player: Player) => T | string | null;
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
  id: string;
}

export interface Entity extends Id {
  name: string;
  descriptions: Description[];
}

export interface Parent {
  name: string;
}

export interface Storage {
  items: ItemDrop[];
}

export interface Stats {
  stats: Resources;
  damage_and_defense: DamageAndDefense;
}

export interface Stat {
  current: number;
  max: number;
}

export interface InnateCharacteristics {
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
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

export interface Race {
  name: string;
  innate_characteristics: InnateCharacteristics;
}

export interface Player extends Entity, Stats, Storage {
  race: Race;
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

export interface Recipe extends Entity {
  ingredients: ItemDrop[];
  crafted_item: ItemDrop;
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

export interface Dialog extends Parent {
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
      (player, _input, _command, args) =>
        this.initiate_attack_on_mob(player, args, true)
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
        if (args.length > 0) {
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
      race: {
        name: "Human",
        innate_characteristics: {
          dexterity: 1,
          constitution: 1,
          intelligence: 1,
          wisdom: 1,
          charisma: 1,
        },
      },
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
    this.set_players_room_to_zone_start(player, player.zone);
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
    return this.world.zones.find((zone) => zone.name === player.zone) || null;
  }

  get_players_room(player: Player): Room | null {
    const zone = this.get_players_zone(player);
    return (
      zone?.rooms.find(
        (room) => room.name.toLowerCase() === player.room.toLowerCase()
      ) || null
    );
  }

  look_self(player: Player): string {
    if (!player) return "You can't see anything.";

    let description = this.get_description(player, player, "default");

    if (!description) {
      description = "You don't really like looking at yourself.";
    }

    if (!player.items || player.items.length === 0) {
      return description;
    }

    const inventory = player.items
      .map((item) => `${item.name} (${item.quantity})`)
      .join(", ");

    return `${description}\n\nInventory: ${inventory}`;
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
      id: crypto.randomUUID(),
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
        (quest_action) => quest_action.name === quest.name
      ) || null
    );
  }

  get_quest_step_action(quest_name: string, name: string) {
    const quest_step = this.get_quest_step(quest_name, name);
    if (!quest_step) return null;

    return (
      this.world_actions.quest_step_actions.find(
        (quest_step_action) => quest_step_action.name === quest_step.name
      ) || null
    );
  }

  add_quest_action(
    quest_name: string,
    action_type: QuestActionType,
    action: Action | null
  ) {
    const quest = this.get_quest(quest_name);
    if (!quest) return;

    let quest_action = this.world_actions.quest_actions.find(
      (qa) => qa.name === quest_name
    );

    if (!quest_action) {
      quest_action = {
        name: quest_name,
        start: null,
        end: null,
      };
      this.world_actions.quest_actions.push(quest_action);
    }

    if (action_type === "Start") {
      quest_action.start = action;
    } else {
      quest_action.end = action;
    }
  }

  add_quest_step(
    quest_name: string,
    name: string,
    description: string,
    action: ActionDecision | null = null
  ) {
    const quest = this.get_quest(quest_name);

    if (!quest) return;
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
        (qa) => qa.name === name
      );

      if (!existingAction) {
        this.world_actions.quest_step_actions.push({
          name,
          action,
        });
      }
    }
  }

  get_quest(name: string): Quest | null {
    return (
      this.world.quests.find(
        (quest) => quest.name.toLowerCase() === name.toLowerCase()
      ) || null
    );
  }

  get_quest_step(quest_name: string, name: string): QuestStep | null {
    const quest = this.get_quest(quest_name);
    return (
      quest?.steps?.find(
        (step) => step.name.toLowerCase() === name.toLowerCase()
      ) || null
    );
  }

  pickup_quest(player: Player, quest_name: string): string {
    if (!player) return "The quest does not exist.";

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

  drop_quest(player: Player, quest_name: string): string {
    const quest = this.get_quest(quest_name);

    if (!quest) {
      return `The quest ${quest_name} does not exist.`;
    }

    if (!player || !player.quests.includes(quest.name)) {
      return `You don't have the quest ${quest_name}.`;
    }

    player.quests = player.quests.filter((q) => q !== quest_name);
    let result = `You dropped the quest ${quest.name}.`;

    const quest_action = this.get_quest_action(quest.name);
    if (quest_action?.end) {
      const quest_end_result = quest_action.end(player);
      if (quest_end_result) {
        result += `\n\n${quest_end_result}`;
      }
    }

    return result;
  }

  is_quest_complete(player: Player, quest_name: string): boolean {
    const quest = this.get_quest(quest_name);
    if (!quest || !player || !player.quests.includes(quest.name)) {
      return false;
    }

    if (!quest.steps) {
      return false;
    }

    const allStepsComplete = quest.steps.every((step) => {
      const quest_step_action = this.get_quest_step_action(
        quest.name,
        step.name
      );
      if (!step.complete && quest_step_action) {
        return quest_step_action.action(player);
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

  get_quest_progress(player: Player, quest_name: string): string {
    const quest = this.get_quest(quest_name);

    if (!quest) {
      return `The quest ${quest_name} does not exist.`;
    }

    if (!player || !player.quests.includes(quest.name)) {
      return `You don't have the quest ${quest_name}.`;
    }

    let result = `Quest: ${quest.name}\n\n${this.get_description(
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

    return result;
  }

  // check_for_quest_completion(player: Player) {
  //   player.quests.every((quest) => {
  //     return this.is_quest_complete(player, quest);
  //   });
  // }

  show_quests(player: Player): string {
    if (!player || player.quests.length === 0) {
      return "You have no quests.";
    }

    const quests_description = player.quests.map((player_quest) => {
      const quest = this.world.quests.find(
        (quest) => quest.name === player_quest
      );
      if (quest) {
        return `${quest.name} - ${this.get_description(
          player,
          quest,
          "default"
        )}`;
      } else {
        return `${player_quest} - Description not found.`;
      }
    });

    return quests_description.join("\n\n");
  }

  /////////
  // NPC //
  /////////

  remove_npc(name: string) {
    const lowerCaseName = name.toLowerCase();
    this.world.zones.forEach((zone) => {
      zone.rooms.forEach((room) => {
        room.npcs = room.npcs.filter(
          (npc) => npc.name.toLowerCase() !== lowerCaseName
        );
      });
    });

    this.world.npcs = this.world.npcs.filter(
      (npc) => npc.name.toLowerCase() !== lowerCaseName
    );
  }

  get_npc(name: string): NPC | null {
    return (
      this.world.npcs.find(
        (npc) => npc.name.toLowerCase() === name.toLowerCase()
      ) || null
    );
  }

  place_npc(zone_name: string, in_room_name: string, npc_name: string) {
    const in_room = this.get_room(zone_name, in_room_name);
    const npc = this.get_npc(npc_name);

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
    if (!zone) return null;

    const room = zone.rooms.find(
      (room) => room.name.toLowerCase() === room_name.toLowerCase()
    );
    if (!room) return null;

    return (
      room.npcs.find(
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
    const zone = this.get_players_zone(player);
    if (!zone) {
      return "That NPC does not exist.";
    }

    const possible_triggers = this.generate_combinations(args);
    const current_room = this.get_players_room(player);

    if (!current_room) {
      return "You are not in a valid room.";
    }

    const npc = this.world.npcs.find((npc) =>
      possible_triggers.some(
        (trigger) => npc.name.toLowerCase() === trigger.toLowerCase()
      )
    );

    if (!npc || !current_room.npcs.includes(npc)) {
      return "That NPC does not exist in this room.";
    }

    if (!npc.dialog) {
      return `${npc.name} does not want to talk to you.`;
    }

    const dialog = npc.dialog.find((dialog) =>
      dialog.trigger.some((trigger) => possible_triggers.includes(trigger))
    );

    if (!dialog) {
      return "hmm...";
    }

    const dialog_action = this.world_actions.dialog_actions.find(
      (action) => action.trigger === dialog.trigger
    );

    if (dialog_action) {
      return dialog_action.action(player, input, command, args) as string;
    }

    return dialog.response || "hmm...";
  }

  create_npc(name: string, description: string) {
    this.world.npcs.push({
      id: crypto.randomUUID(),
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
    // Create and add the vendor NPC
    const vendor = {
      id: crypto.randomUUID(),
      name,
      descriptions: [{ flag: "default", description }],
      stats: this.create_resources(10, 10, 10, 10, 10, 10),
      inventory: [],
      killable: false,
      damage_and_defense: this.create_damage_and_defense(10, 10, 10, 10, 10),
      dialog: [],
      vendor_items,
    };
    this.world.npcs.push(vendor);

    // Create a dialog for listing items
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

    // Create a dialog for purchasing items
    this.create_dialog(
      name,
      ["purchase", "buy"],
      null,
      (player, input, _command, _args) => {
        if (!input) {
          return "You must specify an item to purchase.";
        }

        const command_bits = input.split(" ");
        const trigger_word_index =
          command_bits.lastIndexOf("purchase") >= 0
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
      }
    );
  }

  purchase_from_vendor(
    player: Player,
    vendor_name: string,
    item_name: string
  ): string {
    const npc = this.get_npc(vendor_name);
    if (!npc || !npc.vendor_items) {
      return "That vendor does not exist.";
    }

    const vendor_item = npc.vendor_items.find(
      (item) => item.name.toLowerCase() === item_name.toLowerCase()
    );
    const item = this.world.items.find(
      (item) => item.name.toLowerCase() === item_name.toLowerCase()
    );

    if (!vendor_item || !item) {
      return "That item does not exist.";
    }

    if (player.gold < vendor_item.price) {
      return `You don't have enough gold to purchase ${item_name}.`;
    }

    player.gold -= vendor_item.price;
    const player_item = player.items.find(
      (i) => i.name.toLowerCase() === vendor_item.name.toLowerCase()
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

  add_item_drops_to_room(player: Player, item_drops: ItemDrop[]) {
    const current_room = this.get_players_room(player);
    if (!current_room) return;

    item_drops.forEach((item_drop) => {
      const room_item = current_room.items.find(
        (room_item) => room_item.name === item_drop.name
      );

      if (room_item) {
        room_item.quantity += item_drop.quantity;
      } else {
        current_room.items.push({ ...item_drop });
      }
    });
  }

  get_room_item(
    zone_name: string,
    room_name: string,
    item_name: string
  ): ItemDrop | null {
    const zone = this.get_zone(zone_name);
    if (!zone) return null;

    const room = zone.rooms.find(
      (room) => room.name.toLowerCase() === room_name.toLowerCase()
    );
    if (!room) return null;

    return (
      room.items.find(
        (item) => item.name.toLowerCase() === item_name.toLowerCase()
      ) || null
    );
  }

  place_item(
    zone_name: string,
    in_room_name: string,
    item_name: string,
    quantity = 1
  ) {
    const zone = this.get_zone(zone_name);
    if (!zone) {
      throw new Error(`Zone ${zone_name} does not exist.`);
    }

    const in_room = zone.rooms.find(
      (room) => room.name.toLowerCase() === in_room_name.toLowerCase()
    );

    if (!in_room) {
      throw new Error(
        `Room ${in_room_name} does not exist in zone ${zone_name}.`
      );
    }

    const room_item = in_room.items.find(
      (item) => item.name.toLowerCase() === item_name.toLowerCase()
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

  create_item(
    name: string,
    description: string,
    usable: boolean,
    action: Action | null = null
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

  get_item(name: string): Item | null {
    return (
      this.world.items.find(
        (item) => item.name.toLowerCase() === name.toLowerCase()
      ) || null
    );
  }

  get_item_action(name: string): ItemAction | null {
    const item = this.get_item(name);
    if (!item) return null;

    return (
      this.world_actions.item_actions.find(
        (item_action) =>
          item_action.name.toLowerCase() === item.name.toLowerCase()
      ) || null
    );
  }

  has_item(player: Player, item_name: string): boolean {
    return player.items.some(
      (item) => item.name.toLowerCase() === item_name.toLowerCase()
    );
  }

  has_item_in_quantity(
    player: Player,
    item_name: string,
    quantity: number
  ): boolean {
    const item = player.items.find(
      (item) => item.name.toLowerCase() === item_name.toLowerCase()
    );

    return item ? item.quantity >= quantity : false;
  }

  take_item(player: Player, args: string[]): string {
    const zone = this.get_players_zone(player);
    if (!zone) {
      return "That item does not exist.";
    }

    const current_room = zone.rooms.find((room) => room.name === player.room);
    if (!current_room) {
      return "That item does not exist.";
    }

    const possible_items = this.generate_combinations(args);

    if (possible_items.includes("all")) {
      return this.take_all_items(player);
    }

    const room_item = current_room.items.find((item) =>
      possible_items.some(
        (possible_item) =>
          item.name.toLowerCase() === possible_item.toLowerCase()
      )
    );

    if (!room_item) {
      return "That item does not exist.";
    }

    const player_item = player.items.find(
      (item) => item.name.toLowerCase() === room_item.name.toLowerCase()
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
      (item) => item.name.toLowerCase() !== room_item.name.toLowerCase()
    );

    return `You took the ${room_item.name}.`;
  }

  take_all_items(player: Player): string {
    const current_room = this.get_players_zone(player)?.rooms.find(
      (room) => room.name === player.room
    );

    if (!current_room || current_room.items.length === 0) {
      return "There are no items to take.";
    }

    current_room.items.forEach((room_item) => {
      const player_item = player.items.find(
        (pitem) => pitem.name.toLowerCase() === room_item.name.toLowerCase()
      );

      if (player_item) {
        player_item.quantity += room_item.quantity;
      } else {
        player.items.push({ ...room_item });
      }
    });

    current_room.items = [];

    return "You took all items.";
  }

  use_item(player: Player, args: string[]): string {
    const possible_items = this.generate_combinations(args);
    const player_item = player.items.find((item) =>
      possible_items.some(
        (possible_item) =>
          item.name.toLowerCase() === possible_item.toLowerCase()
      )
    );

    if (!player_item) {
      return "That item does not exist.";
    }

    const item_definition = this.world.items.find(
      (item) => item.name.toLowerCase() === player_item.name.toLowerCase()
    );

    if (!item_definition || !item_definition.usable) {
      return "You can't use that item.";
    }

    const item_action = this.world_actions.item_actions.find(
      (action) =>
        action.name.toLowerCase() === item_definition.name.toLowerCase()
    );

    const result =
      item_action?.action(player) ?? "You used the item but nothing happened.";

    if (this.has_flag(player, "prevent_item_consumption")) {
      this.remove_flag(player, "prevent_item_consumption");
    } else {
      player_item.quantity--;
      if (player_item.quantity === 0) {
        player.items = player.items.filter(
          (item) => item.name.toLowerCase() !== player_item.name.toLowerCase()
        );
      }
    }

    return result;
  }

  remove_player_item(player: Player, item_name: string) {
    const item_index = player.items.findIndex(
      (item) => item.name.toLowerCase() === item_name.toLowerCase()
    );

    if (item_index !== -1) {
      player.items[item_index].quantity--;

      if (player.items[item_index].quantity === 0) {
        player.items.splice(item_index, 1);
      }
    }
  }

  remove_item(item_name: string) {
    this.world.items = this.world.items.filter(
      (item) => item.name.toLowerCase() !== item_name.toLowerCase()
    );
  }

  drop_item(player: Player, args: string[]): string {
    const zone = this.get_players_zone(player);
    if (!zone) {
      return "That item does not exist.";
    }

    const possible_items = this.generate_combinations(args);

    if (possible_items.includes("all")) {
      return this.drop_all_items(player);
    }

    const player_item = player.items.find((item) =>
      possible_items.some(
        (possible_item) =>
          item.name.toLowerCase() === possible_item.toLowerCase()
      )
    );

    if (!player_item) {
      return "That item does not exist.";
    }

    const current_room = zone.rooms.find(
      (room) => room.name.toLowerCase() === player.room.toLowerCase()
    );
    if (!current_room) {
      return "You are not in a valid room.";
    }

    current_room.items.push({
      name: player_item.name,
      quantity: player_item.quantity,
    });

    player.items = player.items.filter(
      (item) => item.name.toLowerCase() !== player_item.name.toLowerCase()
    );

    return `You dropped the ${player_item.name}.`;
  }

  drop_all_items(player: Player): string {
    const current_room = this.get_players_zone(player)?.rooms.find(
      (room) => room.name.toLowerCase() === player.room.toLowerCase()
    );

    if (!current_room || player.items.length === 0) {
      return "You have no items to drop.";
    }

    current_room.items.push(...player.items);
    player.items = [];

    return "You dropped all your items.";
  }

  show_item(player: Player, args: string[]): string {
    const possible_items = this.generate_combinations(args);

    if (possible_items.includes("all")) {
      return this.show_all_items(player);
    }

    if (possible_items.includes("quests")) {
      return this.show_quests(player);
    }

    const player_item = player.items.find((item) =>
      possible_items.some(
        (possible_item) =>
          item.name.toLowerCase() === possible_item.toLowerCase()
      )
    );

    if (!player_item) {
      return "That item does not exist.";
    }

    const item = this.world.items.find(
      (item) => item.name.toLowerCase() === player_item.name.toLowerCase()
    );

    if (!item) {
      return "That item does not exist in the world.";
    }

    return (
      this.get_description(player, item, "default") ||
      "No description available."
    );
  }

  show_all_items(player: Player): string {
    if (player.items.length === 0) {
      return "You have no items to show.";
    }

    const items_description = player.items
      .map((item) => {
        const item_definition = this.world.items.find(
          (item_definition) =>
            item_definition.name.toLowerCase() === item.name.toLowerCase()
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

    return items_description.length > 0
      ? items_description.join("\n\n")
      : "You have no items to show.";
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
      ) || null
    );
  }

  place_mob(zone_name: string, in_room_name: string, mob_name: string) {
    const in_room = this.get_room(zone_name, in_room_name);
    const mob = this.get_mob(mob_name);

    if (!in_room) {
      throw new Error(
        `Room ${in_room_name} does not exist in zone ${zone_name}.`
      );
    }

    if (!mob) {
      throw new Error(`MOB ${mob_name} does not exist.`);
    }

    in_room.mobs.push(structuredClone(mob));
  }

  get_room_mob(
    zone_name: string,
    room_name: string,
    mob_name: string
  ): Mob | null {
    const zone = this.get_zone(zone_name);
    if (!zone) return null;

    const room = zone.rooms.find(
      (room) => room.name.toLowerCase() === room_name.toLowerCase()
    );
    if (!room) return null;

    return (
      room.mobs.find(
        (mob) => mob.name.toLowerCase() === mob_name.toLowerCase()
      ) || null
    );
  }

  perform_attack(attacker: Player | Mob, defender: Player | Mob): string {
    const isCriticalHit =
      Math.random() < attacker.damage_and_defense.critical_chance;
    const attacker_damage = isCriticalHit
      ? attacker.damage_and_defense.physical_damage * 2
      : attacker.damage_and_defense.physical_damage;

    const damage_dealt = Math.max(
      0,
      attacker_damage - defender.damage_and_defense.physical_defense
    );

    defender.stats.health.current = Math.max(
      0,
      defender.stats.health.current - damage_dealt
    );

    let result = `${attacker.name} attacks ${defender.name} for ${damage_dealt} damage.\n${defender.name} health: ${defender.stats.health.current}`;

    if (defender.stats.health.current <= 0) {
      result += `\n${defender.name} has been defeated!`;
    } else if (attacker.stats.health.current <= 0) {
      result += `\n${attacker.name} has been defeated!`;
    }

    return result;
  }

  initiate_attack_on_mob(
    player: Player,
    args: string[],
    should_mob_attack = false
  ): string {
    const zone = this.get_players_zone(player);
    if (!zone) return "That mob does not exist.";

    const current_room = this.get_players_room(player);
    if (!current_room) return "That mob does not exist.";

    const possible_mobs = this.generate_combinations(args);
    const mob_name = possible_mobs.find((mob_name) =>
      current_room.mobs.some(
        (mob) => mob.name.toLowerCase() === mob_name.toLowerCase()
      )
    );

    const mob = current_room.mobs.find(
      (mob) => mob.name.toLowerCase() === mob_name?.toLowerCase()
    );

    if (!mob) return "That mob does not exist.";

    let result = this.perform_attack(player, mob);

    if (should_mob_attack && mob.stats.health.current > 0) {
      result += `\n${this.perform_attack(mob, player)}`;
    }

    if (mob.stats.health.current <= 0) {
      mob.stats.health.current = 0;
      this.add_item_drops_to_room(player, mob.items);
      result += `\n${mob.name} dropped: ${mob.items
        .map((item) => item.name)
        .join(", ")}`;
      current_room.mobs = current_room.mobs.filter(
        (room_mob) => room_mob.name.toLowerCase() !== mob.name.toLowerCase()
      );
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
    if (!room) return null;

    return (
      this.world_actions.room_command_actions.find(
        (action) => action.name.toLowerCase() === room.name.toLowerCase()
      ) || null
    );
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
    if (!room) {
      throw new Error(`Room ${room_name} does not exist in zone ${zone_name}.`);
    }

    const room_command_actions = this.get_room_command_action(
      zone_name,
      room_name
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

  remove_room_command_action(
    zone_name: string,
    room_name: string,
    action_name: string
  ) {
    const room_command_actions = this.get_room_command_action(
      zone_name,
      room_name
    );
    if (room_command_actions) {
      room_command_actions.command_actions =
        room_command_actions.command_actions.filter(
          (action) => action.name.toLowerCase() !== action_name.toLowerCase()
        );
    }
  }

  has_room_command_action(
    zone_name: string,
    room_name: string,
    action_name: string
  ): boolean {
    const room_command_actions = this.get_room_command_action(
      zone_name,
      room_name
    );
    return (
      room_command_actions?.command_actions.some(
        (action) => action.name.toLowerCase() === action_name.toLowerCase()
      ) || false
    );
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

    const from_room = zone.rooms.find(
      (room) => room.name.toLowerCase() === from_room_name.toLowerCase()
    );
    const to_room = zone.rooms.find(
      (room) => room.name.toLowerCase() === to_room_name.toLowerCase()
    );

    if (!from_room || !to_room) {
      throw new Error(
        `Room ${from_room_name} or ${to_room_name} does not exist in zone ${zone_name}.`
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

  get_opposite_exit_name(exit_name: string): string | null {
    const opposites: { [key: string]: string } = {
      north: "south",
      south: "north",
      east: "west",
      west: "east",
    };
    return opposites[exit_name] || null;
  }

  remove_exit(zone_name: string, from_room_name: string, exit_name: string) {
    const zone = this.get_zone(zone_name);
    if (!zone) throw new Error(`Zone ${zone_name} does not exist.`);

    const from_room = zone.rooms.find(
      (room) => room.name.toLowerCase() === from_room_name.toLowerCase()
    );
    if (!from_room) {
      throw new Error(
        `Room ${from_room_name} does not exist in zone ${zone_name}.`
      );
    }

    from_room.exits = from_room.exits.filter(
      (exit) => exit.name.toLowerCase() !== exit_name.toLowerCase()
    );
  }

  get_exit(zone_name: string, from_room_name: string, exit_name: string): Exit {
    const zone = this.get_zone(zone_name);
    if (!zone) {
      throw new Error(`Zone ${zone_name} does not exist.`);
    }

    const from_room = zone.rooms.find(
      (room) => room.name.toLowerCase() === from_room_name.toLowerCase()
    );
    if (!from_room) {
      throw new Error(
        `Room ${from_room_name} does not exist in zone ${zone_name}.`
      );
    }

    const exit = from_room.exits.find(
      (exit) => exit.name.toLowerCase() === exit_name.toLowerCase()
    );
    if (!exit) {
      throw new Error(
        `Exit ${exit_name} does not exist in room ${from_room_name}.`
      );
    }

    return exit;
  }

  get_room_description(player: Player): string {
    const zone = this.get_players_zone(player);
    if (!zone) return "You can't see anything.";

    const current_room = zone.rooms.find(
      (room) => room.name.toLowerCase() === player.room.toLowerCase()
    );
    if (!current_room) return "You can't see anything.";

    const exits = current_room.exits
      .filter((exit) => !exit.hidden)
      .map((exit) => exit.name);

    const npcs_in_room = current_room.npcs.map((npc) =>
      npc.vendor_items ? `${npc.name} (Vendor)` : npc.name
    );

    let result = `Location: ${current_room.name}\n\n${this.get_description(
      player,
      current_room,
      "default"
    )}`;

    if (npcs_in_room.length > 0) {
      result += `\n\nNPCs: ${npcs_in_room.join(", ")}`;
    }

    if (exits.length > 0) {
      result += `\n\nExits: ${exits.join(", ")}`;
    }

    return result;
  }

  switch_room(player: Player, command = ""): string {
    const zone = this.get_players_zone(player);
    if (!zone) return "You can't go that way.";

    let current_room = zone.rooms.find((room) => room.name === player.room);
    const has_command = command.length > 0;

    // Check if current room exists and whether a command was provided
    if (
      !current_room ||
      (!has_command && !this.has_room_actions(current_room.name))
    ) {
      return this.describe_room(player);
    }

    if (has_command) {
      const exit = current_room.exits.find((exit) => exit.name === command);
      if (!exit) return "You can't go that way.";

      if (exit.hidden) exit.hidden = false;
      player.room = exit.location;

      current_room =
        zone.rooms.find((room) => room.name === player.room) || current_room;
    }

    return this.describe_room(player);
  }

  has_room_actions(room_name: string): boolean {
    return !!this.world_actions.room_actions.find(
      (action) => action.name === room_name
    );
  }

  plot_room_map(player: Player, window_size: number): string {
    const zone = this.get_players_zone(player);
    if (!zone) return "You are not in a zone.";

    let rooms = zone.rooms;

    if (window_size !== 0) {
      const current_room_index = rooms.findIndex(
        (room) => room.name === player.room
      );
      const window_start = Math.max(current_room_index - window_size, 0);
      const window_end = Math.min(
        current_room_index + window_size + 1,
        rooms.length
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

          room_grid[`${new_x},${new_y}`] =
            neighbor_room.name === player.room ? "@" : "#";
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

    return `Map:\n\n${map_result.join("\n")}\n`;
  }

  create_room(
    zone_name: string,
    name: string,
    description: string,
    action: Action | null = null
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
    });

    // Add the action to the room actions if provided
    if (action) {
      this.world_actions.room_actions.push({
        name: id,
        actions: [action],
      });
    }
  }

  set_room_as_zone_starter(zone_name: string, room_name: string) {
    const room = this.get_room(zone_name, room_name);
    if (!room) {
      throw new Error(`Room ${room_name} does not exist in zone ${zone_name}.`);
    }
    room.zone_start = true;
  }

  add_room_action(zone_name: string, room_name: string, action: Action) {
    const room = this.get_room(zone_name, room_name);
    if (!room) {
      throw new Error(`Room ${room_name} does not exist in zone ${zone_name}.`);
    }

    const room_action = this.world_actions.room_actions.find(
      (action_obj) => action_obj.name.toLowerCase() === room_name.toLowerCase()
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
    if (!zone) return null;
    return zone.rooms.find((room) => room.zone_start) ?? null;
  }

  inspect_room(player: Player): string {
    const current_room = this.get_players_zone(player)?.rooms.find(
      (room) => room.name.toLowerCase() === player.room.toLowerCase()
    );

    if (!current_room) {
      return "There is nothing else of interest here.";
    }

    const items_string =
      current_room.items.length > 0
        ? `Items: ${current_room.items
            .map((item) => `${item.name} (${item.quantity})`)
            .join(", ")}`
        : "There is nothing else of interest here.";

    const mobs_string =
      current_room.mobs.length > 0
        ? `Mobs: ${current_room.mobs.map((mob) => mob.name).join(", ")}`
        : "";

    return `You inspect the room and found:\n\n${[mobs_string, items_string]
      .filter(Boolean)
      .join("\n")}`;
  }

  look(player: Player, input: string, command: string, args: string[]): string {
    const possible_actions = this.generate_combinations(args);

    if (possible_actions.includes("self")) {
      return this.look_self(player);
    }

    if (possible_actions.includes("at")) {
      return this.look_at_or_examine_object(player, input, command, args);
    }

    const current_room = this.get_players_zone(player)?.rooms.find(
      (room) => room.name.toLowerCase() === player.room.toLowerCase()
    );

    if (!current_room) {
      return "You can't see anything.";
    }

    const exits = current_room.exits
      .filter((exit) => !exit.hidden)
      .map((exit) => exit.name)
      .join(", ");

    return `${this.get_description(player, current_room, "default")}${
      exits ? `\n\nExits: ${exits}` : ""
    }`;
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
    if (!room) {
      throw new Error(`Room ${room_name} does not exist in zone ${zone_name}.`);
    }

    room.objects.push({
      id: crypto.randomUUID(),
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
      ) || null
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
    const zone = this.get_players_zone(player);
    if (!zone) return "That object does not exist.";

    const possible_triggers = this.generate_combinations(args);
    const current_room = this.get_players_room(player);

    if (!current_room) return "That object does not exist.";

    const obj = current_room.objects.find((obj) =>
      possible_triggers.some(
        (trigger) => obj.name.toLowerCase() === trigger.toLowerCase()
      )
    );

    if (!obj) return "That object does not exist.";

    if (input.startsWith("look at")) {
      return (
        this.get_description(player, obj, "default") ||
        "There's nothing special about it."
      );
    }

    if (input.startsWith("examine") && obj.dialog) {
      const dialog = obj.dialog.find((dialog) =>
        dialog.trigger.some((trigger) => possible_triggers.includes(trigger))
      );

      if (dialog) {
        const dialog_action = this.world_actions.dialog_actions.find(
          (action) => action.name === dialog.name
        );

        if (dialog_action) {
          return dialog_action.action(player, input, command, args) as string;
        } else if (dialog.response) {
          return dialog.response;
        }
      }
    }

    return "There's nothing more to learn about this object.";
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
      id: crypto.randomUUID(),
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
      ) || null
    );
  }

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

  craft_recipe(player: Player, args: string[]): string {
    const recipe_names = this.generate_combinations(args);
    const recipe_name = recipe_names.find((name) =>
      this.world.recipes.some(
        (recipe) => recipe.name.toLowerCase() === name.toLowerCase()
      )
    );

    if (!recipe_name) {
      return "You don't know how to craft that.";
    }

    const recipe = this.get_recipe(recipe_name);
    if (!recipe) {
      return "You don't know how to craft that.";
    }

    const has_ingredients = recipe.ingredients.every((ingredient) =>
      this.has_item_in_quantity(player, ingredient.name, ingredient.quantity)
    );

    if (!has_ingredients) {
      return "You don't have the ingredients to craft that.";
    }

    // Remove ingredients from player inventory
    recipe.ingredients.forEach((ingredient) => {
      this.remove_player_item(player, ingredient.name);
    });

    // Add crafted item to player's inventory
    player.items.push({
      name: recipe.crafted_item.name,
      quantity: recipe.crafted_item.quantity,
    });

    return `${recipe.crafted_item.name} has been crafted.`;
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
      timer: function () {
        this.timer_id = setInterval(() => {
          if (this.active) {
            this.action(this);
          }
        }, this.interval);
      },
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
      this.world_actions.spawn_locations =
        this.world_actions.spawn_locations.filter(
          (location) => location.name !== name
        );
    }
  }

  create_dialog(
    npc_name: string,
    trigger: string[],
    response: string | null,
    action: CommandParserAction | null
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

  create_dialog_action(
    dialog_id: string,
    trigger: string[],
    action: CommandParserAction
  ) {
    this.world_actions.dialog_actions.push({
      name: dialog_id,
      trigger,
      action,
    });
  }

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

  create_command_action(
    name: string,
    description: string,
    synonyms: string[],
    action: CommandParserAction
  ): CommandAction {
    return {
      id: name,
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
      .map((word) =>
        word.length > 0
          ? word[0].toUpperCase() + word.slice(1).toLowerCase()
          : ""
      )
      .join(" ");
  }

  calculate_level_experience(
    starting_experience: number,
    growth_rate: number,
    num_levels: number
  ): Level[] {
    return Array.from({ length: num_levels }, (_, i) => ({
      level: i + 1,
      xp: starting_experience * Math.pow(growth_rate, i),
    }));
  }

  generate_combinations(input_array: string[]): string[] {
    const result: string[] = [];

    function generate_helper(combination: string, start_idx: number) {
      if (combination.length > 0) {
        result.push(combination);
      }

      for (let i = start_idx; i < input_array.length; i++) {
        const new_combination =
          combination.length > 0
            ? `${combination} ${input_array[i]}`
            : input_array[i];
        generate_helper(new_combination, i + 1);
      }
    }

    generate_helper("", 0);
    return result;
  }

  get_help(player: Player): string {
    const command_actions =
      player.stats.health.current <= 0
        ? this.player_dead_command_actions
        : this.main_command_actions;

    const result = command_actions
      .map((action) => {
        const synonyms = action.synonyms.join(", ");
        const description =
          this.get_description(player, action, "default") ||
          "No description available.";
        return `${synonyms} - ${description}`;
      })
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
    const create_stat = (current: number, max: number): Stat => ({
      current,
      max,
    });

    return {
      health: create_stat(health_current, health_max),
      stamina: create_stat(stamina_current, stamina_max),
      magicka: create_stat(magicka_current, magicka_max),
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
      const new_room_description = this.describe_room(player);
      result = new_room_description;
    }

    return result;
  }

  describe_room(player: Player): string {
    let room_description = this.get_room_description(player);
    const current_room = this.get_players_room(player);

    if (current_room) {
      const room_actions = this.world_actions.room_actions.find(
        (action) => action.name === current_room.name
      );

      if (room_actions?.actions) {
        const action_result = room_actions.actions
          .map((action) => action(player))
          .filter(Boolean)
          .join("");

        if (action_result) {
          room_description += `\n\n${action_result}`;
        }
      }
    }

    return room_description;
  }

  async parse_command(player: Player, input: string): Promise<string> {
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

    let result: string | undefined;
    let command_action: CommandAction | undefined;

    if (!this.has_flag(player, "disable_main_commands")) {
      command_action = this.find_command_action(
        filtered_actions,
        player.stats.health.current <= 0
          ? this.player_dead_command_actions
          : this.main_command_actions
      );

      if (command_action) {
        result = command_action.action(player, input, command, args) as string;
      }

      if (!result) {
        const async_command_action = this.find_command_action(
          possible_actions,
          this.main_async_command_actions
        );

        if (async_command_action) {
          result = await async_command_action.action(
            player,
            input,
            command,
            args
          );
        }
      }
    }

    if (!result) {
      const players_room = this.get_players_room(player);
      if (players_room) {
        const room_command_action = this.find_room_command_action(
          filtered_actions,
          player.zone,
          players_room.name
        );

        if (room_command_action) {
          result = `${this.get_description(
            player,
            room_command_action,
            "default"
          )}\n\n${room_command_action.action(player, input, command, args)}`;
        }
      }
    }

    return result || "I don't understand that command.";
  }

  find_command_action(
    possible_actions: string[],
    command_actions: CommandAction[]
  ): CommandAction | undefined {
    return command_actions.find((action) =>
      action.synonyms.some((synonym) => possible_actions.includes(synonym))
    );
  }

  find_room_command_action(
    filtered_actions: string[],
    zone_name: string,
    room_name: string
  ): CommandAction | undefined {
    const room_command_actions = this.get_room_command_action(
      zone_name,
      room_name
    );
    return room_command_actions?.command_actions.find((action) =>
      action.synonyms.some((synonym) => filtered_actions.includes(synonym))
    );
  }
}
