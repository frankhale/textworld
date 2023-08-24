// A Text Adventure Library & Game for Deno
// Frank Hale <frankhale@gmail.com
// 23 August 2023

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
) => string;

export interface Entity {
  id: string;
  name: string;
  description: string;
}

export interface Stats {
  stats: Resources;
  damage_and_defense: DamageAndDefense;
}

export interface Player extends Entity, Stats {
  score: number;
  gold: number;
  progress: Level;
  zone: string;
  room: string;
  flags: string[];
  inventory: ItemDrop[];
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

export interface NPC extends Entity {
  stats: Resources;
  inventory: string[];
  dialog: Dialog[] | null;
  killable: boolean;
  vendor_items: VendorItem[] | null;
}

export interface Mob extends Entity, Stats {
  inventory: ItemDrop[];
}

export interface VendorItem {
  name: string;
  price: number;
}

export interface Dialog {
  trigger: string[];
  response: string | null;
  action: CommandParserAction | null;
}

export interface RoomObject extends Entity {
  dialog: Dialog[] | null;
  inventory: string[];
}

export interface Item extends Entity {
  usable: boolean;
  action: Action | null;
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
  player: Player[];
  quests: Quest[];
  level_data: Level[];
}

export interface Zone {
  name: string;
  rooms: Room[];
}

export interface Room extends Entity {
  zone_start: boolean;
  items: ItemDrop[];
  npcs: NPC[];
  exits: Exit[];
  mobs: Mob[];
  objects: RoomObject[];
  action: Action[] | null;
  command_actions: CommandAction[];
}

export interface Quest extends Entity {
  complete: boolean;
  steps: QuestStep[] | null;
  start: ActionNoOutput | null;
  end: ActionNoOutput | null;
}

export interface QuestStep extends Entity {
  complete: boolean;
  action: ActionDecision | null;
}

type QuestActionType = "Start" | "End";

export interface CommandAction extends Entity {
  synonyms: string[];
  action: CommandParserAction;
}

export class TextWorld {
  private world: World = this.reset_world();
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
      (_player, _input, _command, _args) => "You quit the game."
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
      description,
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
      inventory: [],
      quests: [],
      quests_completed: [],
      known_recipes: [],
    };
    this.world.player.push(player);
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
    return this.world.player.find((player) => player.id === id);
  }

  remove_player(player: Player) {
    this.world.player = this.world.player.filter((p) => p.name !== player.name);
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

    const inventory = player.inventory
      .map((item) => `${item.name} (${item.quantity})`)
      .join(", ");
    const result = `${player.description}${
      player.inventory.length > 0 ? `\n\nInventory: ${inventory}` : ""
    }`;

    return result;
  }

  ///////////
  // QUEST //
  ///////////

  create_quest(name: string, description: string) {
    this.world.quests.push({
      id: crypto.randomUUID(),
      name,
      description,
      complete: false,
      steps: null,
      start: null,
      end: null,
    });
  }

  add_quest_action(
    quest_name: string,
    action_type: QuestActionType,
    action: ActionNoOutput
  ) {
    const quest = this.get_quest(quest_name);
    if (quest) {
      if (action_type === "Start") {
        quest.start = action;
      } else {
        quest.end = action;
      }
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
      quest.steps.push({
        id: crypto.randomUUID(),
        name,
        description,
        complete: false,
        action,
      });
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
    if (player) {
      if (player.quests.length >= active_quest_limit) {
        return `You can't have more than ${active_quest_limit} active quests at a time.`;
      }

      const quest = this.get_quest(quest_name);
      if (quest) {
        if (!player.quests.includes(quest.name)) {
          player.quests.push(quest.name);

          let result = `You picked up the quest ${quest.name}.`;
          if (quest.start) {
            const quest_start_result = quest.start(player);
            if (quest_start_result) {
              result += `\n\n${quest_start_result}`;
            }
          }

          return result;
        }
        return `You already have the quest ${quest.name}.`;
      }
    }
    return "The quest does not exist.";
  }

  drop_quest(player: Player, quest_name: string): string {
    const quest = this.get_quest(quest_name);
    if (quest) {
      if (player && player.quests.includes(quest.name)) {
        player.quests = player.quests.filter((quest) => quest !== quest_name);
        let result = `You dropped the quest ${quest.name}.`;

        if (quest.end) {
          const quest_end_result = quest.end(player);
          if (quest_end_result) {
            result += `\n\n${quest_end_result}`;
          }
        }

        return result;
      }
      return `You don't have the quest ${quest.name}.`;
    }
    return `The quest ${quest_name} does not exist.`;
  }

  is_quest_complete(player: Player, quest_name: string): boolean {
    const quest = this.get_quest(quest_name);
    if (quest) {
      if (player && player.quests.includes(quest.name)) {
        if (quest.steps) {
          const result = quest.steps.every((step) => {
            if (!step.complete && step.action) {
              return step.action(player);
            } else {
              return step.complete;
            }
          });

          if (result) {
            if (quest.end) quest.end(player);

            if (!player.quests_completed.includes(quest.name)) {
              player.quests = player.quests.filter(
                (quest) => quest !== quest_name
              );
              player.quests_completed.push(quest.name);
            }
          }

          return result;
        }
      }
    }
    return false;
  }

  get_quest_progress(player: Player, quest_name: string): string {
    const quest = this.get_quest(quest_name);
    if (quest) {
      if (player && player.quests.includes(quest.name)) {
        let result = `Quest: ${quest.name}\n\n${quest.description}\n\n`;
        if (quest.steps) {
          quest.steps.forEach((step) => {
            if (step.action && !step.complete) {
              step.complete = step.action(player);
            }
            result += `${step.complete ? "[x]" : "[ ]"} ${step.name}\n`;
          });
        }
        return result;
      }
      return `You don't have the quest ${quest.name}.`;
    }
    return `The quest ${quest_name} does not exist.`;
  }

  show_quests(player: Player): string {
    if (!player || player.quests.length === 0) {
      return "You have no quests.";
    }

    const quests_description = player.quests.map((player_quest) => {
      const quest = this.world.quests.find(
        (quest) => quest.name === player_quest
      );
      return `${quest!.name} - ${quest!.description}`;
    });

    return quests_description.join("\n\n");
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
        return `${npc.name} does not want to talk to you.`;
      } else if (
        npc &&
        current_room &&
        npc.dialog &&
        current_room.npcs.includes(npc)
      ) {
        const dialog = npc.dialog?.find((dialog) =>
          dialog.trigger.some((trigger) => possible_triggers.includes(trigger))
        );

        return dialog
          ? dialog.response ||
              dialog.action?.(player, input, command, args) ||
              "hmm..."
          : "hmm...";
      }
    }
    return "That NPC does not exist.";
  }

  create_npc(name: string, description: string, dialog: Dialog[] | null) {
    this.world.npcs.push({
      id: crypto.randomUUID(),
      name,
      description,
      inventory: [],
      stats: this.create_resources(10, 10, 10, 10, 10, 10),
      killable: false,
      dialog,
      vendor_items: null,
    });
  }

  ////////////
  // VENDOR //
  ////////////

  create_vendor(name: string, description: string, vendor_items: VendorItem[]) {
    this.world.npcs.push({
      id: crypto.randomUUID(),
      name,
      description,
      stats: this.create_resources(10, 10, 10, 10, 10, 10),
      inventory: [],
      killable: false,
      dialog: [
        {
          trigger: ["items"],
          response: null,
          action: (_player, _input, _command, _args) => {
            const items = vendor_items.map(
              (vendor_item) => `${vendor_item.name} (${vendor_item.price} gold)`
            );
            return `Items for sale: ${items.join(", ")}`;
          },
        },
        {
          trigger: ["purchase", "buy"],
          response: null,
          action: (player, input, _command, _args) => {
            if (input) {
              const command_bits = input.split(" ");
              if (command_bits) {
                let trigger_word = command_bits.lastIndexOf("purchase") ?? -1;
                if (trigger_word === -1) {
                  trigger_word = command_bits.lastIndexOf("buy") ?? -1;
                  const item_name = command_bits
                    .slice(trigger_word + 1)
                    .join(" ");
                  return this.purchase_from_vendor(player, name, item_name!);
                }
              }
            }
            return "You must specify an item to purchase.";
          },
        },
      ],
      vendor_items,
    });
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

    if (player.gold >= vendor_item.price) {
      player.gold -= vendor_item.price;
      player.inventory.push({ name: vendor_item.name, quantity: 1 });
      return `You purchased ${vendor_item.name} for ${vendor_item.price} gold.`;
    }

    return `You don't have enough gold to purchase ${vendor_item.name}.`;
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
    this.world.items.push({
      id: crypto.randomUUID(),
      name: name,
      description: description,
      usable,
      action,
    });
  }

  get_item(name: string): Item | null {
    return (
      this.world.items.find(
        (item) => item.name.toLowerCase() === name.toLowerCase()
      ) ?? null
    );
  }

  has_item(player: Player, item_name: string): boolean {
    return player.inventory.some(
      (item) => item.name.toLowerCase() === item_name.toLowerCase()
    );
  }

  has_item_in_quantity(player: Player, item_name: string, quantity: number) {
    const item = player.inventory.find(
      (item) => item.name.toLowerCase() === item_name.toLowerCase()
    );
    if (item) {
      return item.quantity >= quantity;
    }
    return false;
  }

  take_item(player: Player, args: string[]): string {
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
            player.inventory.push({
              name: room_item.name,
              quantity: room_item.quantity,
            });
            current_room.items = current_room.items.filter(
              (item) => item.name !== room_item.name
            );
            return `You took the ${room_item.name}.`;
          }
        }
      }
    }
    return "That item does not exist.";
  }

  take_all_items(player: Player): string {
    const current_room = this.get_players_zone(player)?.rooms.find(
      (room) => room.name === player.room
    );

    if (!current_room) {
      return "That item does not exist.";
    }

    current_room.items.forEach((item) => {
      player.inventory.push({ ...item });
    });

    current_room.items = [];

    return "You took all items.";
  }

  use_item(player: Player, args: string[]): string {
    if (player) {
      const possible_items = this.generate_combinations(args);
      const player_item = player.inventory.find((item) =>
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

          let result: string | null = null;

          if (item_definition.action) {
            result = item_definition.action(player);
          }

          if (!result) {
            result = "You used the item but nothing happened.";
          }

          player_item.quantity--;
          if (player_item.quantity === 0) {
            player.inventory = player.inventory.filter(
              (item) => item.name !== player_item.name
            );
          }

          return result;
        }
      }
    }
    return "That item does not exist.";
  }

  remove_player_item(player: Player, item_name: string) {
    const itemIndex = player?.inventory.findIndex(
      (item) => item.name.toLowerCase() === item_name.toLowerCase()
    );

    if (itemIndex !== undefined && itemIndex !== -1) {
      player.inventory[itemIndex].quantity--;

      if (player.inventory[itemIndex].quantity === 0) {
        player.inventory.splice(itemIndex, 1);
      }
    }
  }

  remove_item(item_name: string) {
    this.world.items = this.world.items.filter(
      (item) => item.name !== item_name
    );
  }

  drop_item(player: Player, args: string[]): string {
    const zone = this.get_players_zone(player);
    if (zone) {
      const possible_items = this.generate_combinations(args);

      if (possible_items.includes("all")) {
        return this.drop_all_items(player);
      } else {
        const player_item = player.inventory.find((item) =>
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
            player.inventory = player.inventory.filter(
              (item) => item.name !== player_item.name
            );
            return `You dropped the ${player_item.name}.`;
          }
        }
      }
    }
    return "That item does not exist.";
  }

  drop_all_items(player: Player): string {
    const current_room = this.get_players_zone(player)?.rooms.find(
      (room) => room.name === player.room
    );

    if (!current_room || player.inventory.length === 0) {
      return "You have no items to drop.";
    }

    current_room.items.push(...player.inventory);
    player.inventory = [];

    return "You dropped all your items.";
  }

  show_item(player: Player, args: string[]): string {
    const possible_items = this.generate_combinations(args);

    if (possible_items.includes("all")) {
      return this.show_all_items(player);
    } else if (possible_items.includes("quests")) {
      return this.show_quests(player);
    } else {
      if (player) {
        const player_item = player.inventory.find((item) =>
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
            return item.description;
          }
        }
      }
    }
    return "That item does not exist.";
  }

  show_all_items(player: Player): string {
    if (!player || player.inventory.length === 0) {
      return "You have no items to show.";
    }

    const items_description = player.inventory
      .map((item) => {
        const item_definition = this.world.items.find(
          (item_definition) => item_definition.name === item.name
        );
        return item_definition
          ? `${item_definition.name} - ${item_definition.description}`
          : null;
      })
      .filter(Boolean);

    return items_description.join("\n\n");
  }

  /////////
  // MOB //
  /////////

  create_mob(
    name: string,
    description: string,
    stats: Resources,
    damage_and_defense: DamageAndDefense,
    inventory: ItemDrop[]
  ) {
    const mob: Mob = {
      id: crypto.randomUUID(),
      name,
      description,
      stats,
      damage_and_defense,
      inventory,
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
    const attackerDamage =
      Math.random() < attacker.damage_and_defense.critical_chance
        ? attacker.damage_and_defense.physical_damage * 2
        : attacker.damage_and_defense.physical_damage;

    const damageDealt = Math.max(
      0,
      attackerDamage - defender.damage_and_defense.physical_defense
    );

    defender.stats.health.current -= damageDealt;

    defender.stats.health.current = Math.max(0, defender.stats.health.current);
    attacker.stats.health.current = Math.max(0, attacker.stats.health.current);

    let result = `${attacker.name} attacks ${defender.name} for ${damageDealt} damage.\n${defender.name} health: ${defender.stats.health.current}`;

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
          let result = this.attack(player, mob);
          if (should_mob_attack && mob.stats.health.current > 0) {
            result += `\n${this.attack(mob, player)}`;
          }

          if (mob.stats.health.current <= 0) {
            mob.stats.health.current = 0;
            this.add_item_drops_to_room(player, mob.inventory);
            result += `\n${mob.name} dropped: ${mob.inventory
              .map((item) => item.name)
              .join(", ")}`;
            current_room.mobs = current_room.mobs.filter(
              (mob) => mob.name !== mob.name
            );
          }

          return result;
        }
      }
    }
    return "That mob does not exist.";
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

  remove_room(zone_name: string, room_name: string) {
    const zone = this.get_zone(zone_name);
    zone.rooms = zone.rooms.filter((room) => room.name !== room_name);
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
      room.command_actions.push({
        id: crypto.randomUUID(),
        name,
        description,
        synonyms,
        action,
      });
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
      room.command_actions = room.command_actions.filter(
        (action) => action.name !== action_name
      );
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
      return room.command_actions.some((action) => action.name === action_name);
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

        let result = `Location: ${current_room.name}\n\n${current_room.description}`;

        if (npcs_in_room.length > 0) {
          result += `\n\NPCs: ${npcs_in_room}`;
        }

        if (exits.length > 0) {
          result += `\n\nExits: ${exits.join(", ")}`;
        }

        return result;
      }
    }
    return "You can't see anything.";
  }

  switch_room(player: Player, command: string): string {
    const zone = this.get_players_zone(player);
    if (zone) {
      const current_room = zone.rooms.find((room) => room.name === player.room);
      if (current_room) {
        const exit = current_room.exits.find((exit) => exit.name === command);
        if (exit) {
          if (exit.hidden) exit.hidden = false;
          player.room = exit.location;

          let new_room_description = this.get_room_description(player);
          const new_room = zone.rooms.find((room) => room.name === player.room);
          if (new_room && new_room.action) {
            let action_result = "";
            new_room.action.every((action) => {
              const result = action(player);
              if (result) {
                action_result += result;
              }
            });

            if (action_result) {
              new_room_description = `${new_room_description}\n\n${action_result}`;
            }
          }

          return new_room_description;
        }
      }
    }
    return "You can't go that way.";
  }

  plot_room_map(player: Player, window_size: number) {
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
      const result: string[] = [];

      for (let y = max_y; y >= min_y; y -= 0.5) {
        let row = "";
        for (let x = min_x; x <= max_x; x += 0.5) {
          row += room_grid[`${x},${y}`] || " ";
        }
        result.push(row);
      }
      return `Map:\n\n${result.join("\n")}\n`;
    }
    return "You are not in a zone.";
  }

  create_room(
    zone_name: string,
    name: string,
    description: string,
    action: Action | null = null
  ) {
    const zone = this.get_zone(zone_name);
    if (!zone) throw new Error(`Zone ${zone_name} does not exist.`);

    let actions: Action[] | null = null;
    if (action) {
      actions = [action];
    }

    zone.rooms.push({
      id: crypto.randomUUID(),
      name: name,
      description: description,
      zone_start: false,
      items: [],
      npcs: [],
      mobs: [],
      objects: [],
      exits: [],
      action: actions,
      command_actions: [],
    });
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
      if (!room.action) {
        room.action = [];
      }
      room.action.push(action);
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
    const current_room = this.get_players_zone(player)?.rooms.find(
      (room) => room.name === player.room
    );

    if (!current_room) {
      return "There is nothing else of interest here.";
    }

    const items = current_room.items.map(
      (item) => `${item.name} (${item.quantity})`
    );
    const itemsString =
      items.length > 0
        ? `Items: ${items.join(", ")}`
        : "There is nothing else of interest here.";

    const mobs = current_room.mobs.map((mob) => mob.name);
    const mobsString = mobs.length > 0 ? `Mobs: ${mobs.join(", ")}` : "";

    //return [mobsString, itemsString].filter(Boolean).join("\n");
    return `You inspect the room and found:\n\n${[mobsString, itemsString]
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
      (room) => room.name === player.room
    );

    if (current_room) {
      const exits = current_room.exits
        .filter((exit) => !exit.hidden)
        .map((exit) => exit.name)
        .join(", ");
      const description = `${current_room.description}${
        exits.length > 0 ? `\n\nExits: ${exits}` : ""
      }`;
      return description;
    }

    return "You can't see anything.";
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
      id: crypto.randomUUID(),
      name,
      description,
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
          return obj.description;
        } else if (input.startsWith("examine") && obj.dialog) {
          const dialog = obj.dialog.find((dialog) =>
            dialog.trigger.some((trigger) =>
              possible_triggers.includes(trigger)
            )
          );

          if (dialog?.action) {
            dialog.action?.(player, input, command, args);
          } else if (dialog?.response) {
            return dialog.response;
          }
        }
      }
    }
    return "That object does not exist.";
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
      description,
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
    const recipe = this.get_recipe(recipe_name);
    if (recipe) {
      player.known_recipes.push(recipe.name);
      return `You learned the recipe for ${recipe.name}.`;
    }
    return "That recipe does not exist.";
  }

  craft_recipe(player: Player, recipe_name: string): string {
    const knows_recipe = player.known_recipes.includes(recipe_name);
    if (knows_recipe) {
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
          player.inventory.push({
            name: recipe.crafted_item.name,
            quantity: recipe.crafted_item.quantity,
          });
          return `${recipe.crafted_item.name} has been crafted.`;
        }
        return "You don't have the ingredients to craft that.";
      }
    }
    return "You don't know how to craft that.";
  }

  //////////
  // MISC //
  //////////

  create_command_action(
    name: string,
    description: string,
    synonyms: string[],
    action: CommandParserAction
  ): CommandAction {
    return {
      id: crypto.randomUUID(),
      name,
      description,
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
      player: [],
      quests: [],
      level_data: this.calculate_level_experience(1, 1.2, 50),
    };
    this.world = world;
    return world;
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

    function generate_helper(combination: string, startIdx: number) {
      result.push(combination.trim());

      for (let i = startIdx; i < input_array.length; i++) {
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
      .map((action) => `${action.synonyms.join(", ")} - ${action.description}`)
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
    let newZoneName: string | null = null;
    let newRoomName: string | null = null;
    const possibleRoomsOrZones = this.generate_combinations(args);

    for (const possibleRoomOrZone of possibleRoomsOrZones) {
      const room_or_zone = possibleRoomOrZone.toLowerCase();

      if (room_or_zone.startsWith("room")) {
        const roomName = possibleRoomOrZone.replace(/room/, "").trim();
        const newRoom = this.get_room(player.zone, roomName);

        if (newRoom) {
          newRoomName = newRoom.name;
          break;
        }
      } else if (room_or_zone.startsWith("zone")) {
        const zoneName = possibleRoomOrZone.replace(/zone/, "").trim();
        const newZone = this.get_zone(zoneName);

        if (newZone) {
          newZoneName = newZone.name;
          break;
        }
      }
    }

    if (newZoneName) {
      player.zone = newZoneName;
      const starterRoom = this.get_zone_starter_room(player.zone);

      if (starterRoom) {
        newRoomName = starterRoom.name;
      }
    }

    if (newRoomName) {
      player.room = newRoomName;
      let newRoomDescription = this.get_room_description(player);

      const newRoom = this.get_players_room(player);
      if (newRoom?.action) {
        const actionResult = newRoom.action
          .map((action) => action(player))
          .filter((result) => result)
          .join("");

        newRoomDescription = `${newRoomDescription}\n\n${actionResult}`;
      }

      return newRoomDescription;
    }

    return "That room or zone does not exist.";
  }

  parse_command(player: Player, input: string): string {
    const inputLimit = Math.min(input_character_limit, input.length);
    input = input.substring(0, inputLimit);

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
      return command_action.action(player, input, command, args);
    }

    if (this.world.zones.length > 0) {
      const players_room = this.get_players_room(player);
      if (players_room) {
        const room_command_action = players_room.command_actions.find(
          (action) =>
            action.synonyms.some((synonym) =>
              filtered_actions.includes(synonym)
            )
        );

        if (room_command_action) {
          return room_command_action.action(player, input, command, args);
        } else {
          return "I don't understand that command.";
        }
      } else {
        return "Player's room does not exist.";
      }
    }

    // TODO: We need a way to complete quest steps that is not
    // obtrustive to the player and just happens in the background.
    //
    // player.quests.every((quest) => {
    //   return this.is_quest_complete(player, quest);
    // });

    return "I don't understand that command.";
  }
}
