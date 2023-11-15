import { Player } from "./player";

export interface GameMessage {
    id: string;
    input: string;
    player: Player;
    response: string;
    responseLines: string[];
    map: string;
}