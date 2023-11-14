import { DamageAndDefense } from "./damage-and-defense";
import { Resources } from "./resources";

export interface Stats {
    stats: Resources;
    damage_and_defense: DamageAndDefense;
}