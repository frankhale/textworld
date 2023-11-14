import { Entity } from "./entity";
import { ItemDrop } from "./item-drop";
import { Level } from "./level";
import { Stats } from "./stats";

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