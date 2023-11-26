import { Player } from "./player";

export interface GameMessage {
  id: string;
  input: string;
  player: Player | null;
  response: string;
  responseLines: string[];
  map: string | null;
}
