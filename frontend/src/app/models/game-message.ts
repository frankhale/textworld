import { CommandResponse } from "./command-response";
import { Player } from "./player";

export interface GameMessage {
  id: string;
  input: string;
  player: Player | null;
  result: CommandResponse;
  responseLines: string[];
  map: string | null;
}
