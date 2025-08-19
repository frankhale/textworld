import { Game } from './game.ts';
import { Direction } from './types.ts';
import { getItemFromRoom, getItemFromInventory, getRecipeByName } from './utils.ts';

interface Command {
  execute: (game: Game, args: string[]) => string | void;
  description: string;
}

export class REPL {
  private game: Game;
  private commands: Map<string, Command>;

  constructor(game: Game) {
    this.game = game;
    this.commands = new Map<string, Command>();
    this.registerCommands();
  }

  private registerCommands() {
    this.registerCommand('look', {
      execute: (game) => game.look(),
      description: 'Look around the current room'
    });

    this.registerCommand('go', {
      execute: (game, args) => {
        if (!args[0]) return 'Go where?';
        return game.move(args[0] as Direction);
      },
      description: 'Move in a direction (north, south, east, west)'
    });

    this.registerCommand('take', {
      execute: (game, args) => {
        if (!args.length) return 'Take what?';
        const itemName = args.join(' ');
        const item = getItemFromRoom(game, itemName);
        if (!item) return `No "${itemName}" found in the room!`;
        return game.take(item.id);
      },
      description: 'Pick up an item (e.g., "take rusty key")'
    });

    this.registerCommand('drop', {
      execute: (game, args) => {
        if (!args.length) return 'Drop what?';
        const itemName = args.join(' ');
        const item = getItemFromInventory(game, itemName);
        if (!item) return `No "${itemName}" in inventory!`;
        return game.drop(item.id);
      },
      description: 'Drop an item (e.g., "drop rusty key")'
    });

    this.registerCommand('use', {
      execute: (game, args) => {
        if (!args.length) return 'Use what?';
        const itemName = args.join(' ');
        const item = getItemFromInventory(game, itemName);
        if (!item) return `No "${itemName}" in inventory!`;
        return game.use(item.id);
      },
      description: 'Use an item (e.g., "use health potion")'
    });

    this.registerCommand('learn', {
      execute: (game, args) => {
        if (!args.length) return 'Learn what?';
        const itemName = args.join(' ');
        const item = getItemFromInventory(game, itemName);
        if (!item) return `No "${itemName}" in inventory!`;
        return game.learn(item.id);
      },
      description: 'Learn a recipe from an item (e.g., "learn potion recipe")'
    });

    this.registerCommand('craft', {
      execute: (game, args) => {
        if (!args.length) return 'Craft what?';
        const recipeName = args.join(' ');
        const recipeId = getRecipeByName(game, recipeName);
        if (!recipeId) return `No known recipe matching "${recipeName}"!`;
        return game.craft(recipeId);
      },
      description: 'Craft an item using a recipe (e.g., "craft health potion")'
    });

    this.registerCommand('inventory', {
      execute: (game) => game.inventory(),
      description: 'Show inventory contents'
    });

    this.registerCommand('export', {
      execute: (game) => game.exportState(),
      description: 'Export game state as JSON'
    });

    this.registerCommand('map', {
      execute: (game) => this.generateMap(game),
      description: 'Show a map of nearby rooms'
    });

    this.registerCommand('quit', {
      execute: () => {
        console.log("Goodbye!");
        Deno.exit(0);
      },
      description: 'Exit the game'
    });

    this.registerCommand('help', {
      execute: () => this.getHelpText(),
      description: 'Show this help message'
    });
  }

  private registerCommand(name: string, command: Command) {
    this.commands.set(name, command);
  }

  private getHelpText(): string {
    let help = "Available commands:\n";
    for (const [name, command] of this.commands) {
      help += `${name}: ${command.description}\n`;
    }
    return help;
  }

  processCommand(input: string) {
    const parts = input.trim().toLowerCase().split(' ');
    const commandName = parts[0];
    const args = parts.slice(1);

    try {
      const command = this.commands.get(commandName);
      if (!command) {
        return "Unknown command! Type 'help' for available commands.";
      }

      const result = command.execute(this.game, args);
      if (result) {
        return result;
      }
    } catch (e) {
      if (e instanceof Error) {
        return `Error: ${e.message}`;
      } else {
        return "An unknown error occurred";
      }
    }
  }

  start() {
    console.log("Welcome to the Adventure Game!");
    console.log("Type 'help' for a list of commands");
    console.log(this.game.look());

    while (true) {
      const input = prompt("> ");
      if (!input) continue;

      console.log(this.processCommand(input));
    }
  }

  private generateMap(game: Game): string {
    const WINDOW_SIZE = 3; // Max 3 rooms in each direction
    const GRID_SIZE = WINDOW_SIZE * 2 + 1; // 7x7 grid
    const grid: string[][] = Array(GRID_SIZE).fill(null)
      .map(() => Array(GRID_SIZE).fill(' '));

    const currentRoomId = game.getPlayersCurrentRoomId();
    const rooms = game.getRooms();
    const centerX = WINDOW_SIZE;
    const centerY = WINDOW_SIZE;

    // Place player's current room
    grid[centerY][centerX] = '@';

    // Queue for BFS traversal with coordinates
    const queue: { id: string; x: number; y: number; distance: number }[] = [
      { id: currentRoomId, x: centerX, y: centerY, distance: 0 }
    ];
    const visited = new Set<string>([currentRoomId]);

    const directions: Record<string, [number, number, string]> = {
      north: [0, -2, '|'],  // Move 2 spaces for room + exit
      south: [0, 2, '|'],
      east: [2, 0, '-'],
      west: [-2, 0, '-'],
    };

    while (queue.length > 0) {
      const { id, x, y, distance } = queue.shift()!;
      const room = rooms[id];

      if (distance >= WINDOW_SIZE) continue;

      for (const [dir, nextId] of Object.entries(room.exits)) {
        if (!visited.has(nextId)) {
          const [dx, dy, connector] = directions[dir];
          const newX = x + dx;
          const newY = y + dy;

          // Check bounds
          if (
            newX >= 0 && newX < GRID_SIZE &&
            newY >= 0 && newY < GRID_SIZE &&
            grid[newY][newX] === ' ' // Ensure spot is empty
          ) {
            // Place the room
            grid[newY][newX] = '#';
            // Place the connector
            if (dir === 'north') grid[y - 1][x] = connector;
            else if (dir === 'south') grid[y + 1][x] = connector;
            else if (dir === 'east') grid[y][x + 1] = connector;
            else if (dir === 'west') grid[y][x - 1] = connector;

            visited.add(nextId);
            queue.push({ id: nextId, x: newX, y: newY, distance: distance + 1 });
          }
        }
      }
    }

    return grid
      .map(row => row.join(''))
      .filter((line, index, array) =>
        // Skip first and last line
        index === 0 || index === array.length - 1 || line.trim().length > 0
      )
      .join('\n');
  }

  public addCommand(name: string, command: Command) {
    this.registerCommand(name, command);
  }
}