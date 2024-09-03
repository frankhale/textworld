import { Actor } from "./actor";

export interface Player extends Actor {
    score: number;
    gold: number;
    zone: string;
    room: string;
    flags: string[];
    quests: string[];
    quests_completed: string[];
    known_recipes: string[];
}
