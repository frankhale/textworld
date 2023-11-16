import { Entity } from "./entity";
import { Inventory } from "./inventory";
import { Level } from "./level";
import { Stats } from "./stats";

export interface Player extends Entity, Stats, Inventory {
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