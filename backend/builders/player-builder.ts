// Player Builder for TextWorld
// Provides a fluent interface for creating players

import type {
  TextWorld,
  Player,
  Stats,
  Drop,
  ResourceAmount,
  Level,
  Question,
  DataType,
  QuestionSequence,
  SessionAction,
} from "../textworld.ts";
import { BaseBuilder } from "./base-builder.ts";

interface QuestionConfig {
  id: string;
  dataType: DataType;
  questionText: string;
}

interface QuestionSequenceConfig {
  name: string;
  questions: QuestionConfig[];
  onComplete?: SessionAction;
}

/**
 * Builder for creating Player objects with a fluent interface.
 */
export class PlayerBuilder extends BaseBuilder<Player> {
  private _name: string;
  private _description: string = "";
  private _zoneName: string = "";
  private _roomName: string = "";
  private _health: ResourceAmount = { current: 10, max: 10 };
  private _stamina: ResourceAmount = { current: 10, max: 10 };
  private _magicka: ResourceAmount = { current: 10, max: 10 };
  private _physical_damage: number = 10;
  private _physical_defense: number = 10;
  private _spell_damage: number = 10;
  private _spell_defense: number = 10;
  private _critical_chance: number = 0.05;
  private _progress: Level = { level: 1, xp: 0 };
  private _gold: number = 0;
  private _items: Drop[] = [];
  private _flags: string[] = [];
  private _statsObject: Stats | null = null;
  private _questionSequence: QuestionSequenceConfig | null = null;

  constructor(textworld: TextWorld, name: string) {
    super(textworld);
    this._name = name;
  }

  /**
   * Sets the player description.
   */
  description(text: string): this {
    this._description = text;
    return this;
  }

  /**
   * Sets the starting location.
   */
  location(zoneName: string, roomName: string): this {
    this._zoneName = zoneName;
    this._roomName = roomName;
    return this;
  }

  /**
   * Sets the health values.
   */
  health(current: number, max: number): this {
    this._health = { current, max };
    return this;
  }

  /**
   * Sets the stamina values.
   */
  stamina(current: number, max: number): this {
    this._stamina = { current, max };
    return this;
  }

  /**
   * Sets the magicka values.
   */
  magicka(current: number, max: number): this {
    this._magicka = { current, max };
    return this;
  }

  /**
   * Sets the physical damage value.
   */
  physicalDamage(value: number): this {
    this._physical_damage = value;
    return this;
  }

  /**
   * Sets the physical defense value.
   */
  physicalDefense(value: number): this {
    this._physical_defense = value;
    return this;
  }

  /**
   * Sets the spell damage value.
   */
  spellDamage(value: number): this {
    this._spell_damage = value;
    return this;
  }

  /**
   * Sets the spell defense value.
   */
  spellDefense(value: number): this {
    this._spell_defense = value;
    return this;
  }

  /**
   * Sets the critical hit chance (0-1).
   */
  criticalChance(value: number): this {
    this._critical_chance = value;
    return this;
  }

  /**
   * Sets the level.
   */
  level(value: number): this {
    this._progress.level = value;
    return this;
  }

  /**
   * Sets all stats at once using a Stats object.
   */
  stats(statsObj: Stats): this {
    this._statsObject = statsObj;
    return this;
  }

  /**
   * Sets the starting gold amount.
   */
  gold(amount: number): this {
    this._gold = amount;
    return this;
  }

  /**
   * Adds a starting item.
   */
  item(name: string, quantity: number = 1): this {
    this._items.push({ name, quantity });
    return this;
  }

  /**
   * Sets all starting items at once.
   */
  items(drops: Drop[]): this {
    this._items = drops;
    return this;
  }

  /**
   * Adds a starting flag.
   */
  flag(name: string): this {
    this._flags.push(name);
    return this;
  }

  /**
   * Sets all starting flags at once.
   */
  flags(names: string[]): this {
    this._flags = names;
    return this;
  }

  /**
   * Starts a question sequence for the player.
   * Call question() to add questions and onQuestionSequenceComplete() to handle completion.
   * @param name - Unique name for the question sequence
   */
  questionSequence(name: string): this {
    this._questionSequence = {
      name,
      questions: [],
    };
    return this;
  }

  /**
   * Adds a question to the question sequence.
   * Must call questionSequence() first.
   * @param id - Unique identifier for the question (used to retrieve the answer)
   * @param questionText - The question to ask the player
   * @param dataType - Expected data type of the answer (default: "String")
   */
  question(id: string, questionText: string, dataType: DataType = "String"): this {
    if (!this._questionSequence) {
      throw new Error("Must call questionSequence() before adding questions");
    }
    this._questionSequence.questions.push({ id, dataType, questionText });
    return this;
  }

  /**
   * Sets the action to run when the question sequence is complete.
   * The action receives the player and session, where session.payload is the QuestionSequence.
   * @param action - Callback function that runs after all questions are answered
   */
  onQuestionSequenceComplete(action: SessionAction): this {
    if (!this._questionSequence) {
      throw new Error("Must call questionSequence() before setting completion action");
    }
    this._questionSequence.onComplete = action;
    return this;
  }

  /**
   * Builds and registers the player.
   */
  build(): Player {
    const player = this.textworld.create_player(
      this._name,
      this._description,
      this._zoneName,
      this._roomName
    );

    // Apply custom stats if provided, or use individual values
    if (this._statsObject) {
      player.stats = this._statsObject;
    } else {
      player.stats = {
        health: this._health,
        stamina: this._stamina,
        magicka: this._magicka,
        physical_damage: this._physical_damage,
        physical_defense: this._physical_defense,
        spell_damage: this._spell_damage,
        spell_defense: this._spell_defense,
        critical_chance: this._critical_chance,
        progress: this._progress,
      };
    }

    // Set gold
    player.gold = this._gold;

    // Add items
    for (const item of this._items) {
      this.textworld.add_item_to_player(player, item.name, item.quantity);
    }

    // Add flags
    for (const flagName of this._flags) {
      this.textworld.set_flag(player, flagName);
    }

    // Set up question sequence if configured
    if (this._questionSequence && this._questionSequence.questions.length > 0) {
      const questions: Question[] = this._questionSequence.questions.map((q) => ({
        id: q.id,
        data_type: q.dataType,
        question: q.questionText,
      }));

      const questionSequence: QuestionSequence = {
        name: this._questionSequence.name,
        questions,
      };

      // Set the current question sequence name
      this.textworld.add_session(
        player,
        this.textworld.current_question_sequence,
        "String",
        this._questionSequence.name,
      );

      // Add the question sequence session with optional completion action
      if (this._questionSequence.onComplete) {
        this.textworld.add_session(
          player,
          this._questionSequence.name,
          "QuestionSequence",
          questionSequence,
          {
            name: this._questionSequence.name,
            action: this._questionSequence.onComplete,
          },
        );
      } else {
        this.textworld.add_session(
          player,
          this._questionSequence.name,
          "QuestionSequence",
          questionSequence,
        );
      }
    }

    return player;
  }
}
