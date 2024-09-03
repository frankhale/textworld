import { Level } from "./level";
import { ResourceAmount } from "./resource-amount";

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
