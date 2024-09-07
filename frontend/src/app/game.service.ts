import { Injectable, signal } from "@angular/core";
import { GameMessage } from "./models/game-message";
import { Player } from "./models/player";

@Injectable({
  providedIn: "root",
})
export class GameService {
  private player: Player | null = null;
  private socket: WebSocket = new WebSocket("ws://localhost:8080");
  public messageHistory$ = signal<GameMessage[]>([]);
  public message$ = signal({} as GameMessage);

  public connected: boolean = false;

  constructor() {
    this.socket.addEventListener("open", (event) => {
      console.log("WebSocket connection established:", event);
    });
    this.socket.addEventListener("message", (event) => {
      this.connected = true;
      console.log("WebSocket message received:", event);
      const message: GameMessage = JSON.parse(event.data);

      if (!this.player) {
        this.player = message.player;
      }

      this.messageHistory$.set([...this.messageHistory$(), message]);
      this.message$.set(message);
    });
    this.socket.addEventListener("error", (event) => {
      console.error("WebSocket error:", event);

      const message: GameMessage = {
        id: crypto.randomUUID(),
        input: "error",
        player: null,
        result: { response: "Unable to connect to server." },
        responseLines: ["Unable to connect to server."],
        map: null,
      };

      this.messageHistory$.set([...this.messageHistory$(), message]);
      this.message$.set(message);
    });
  }

  public send(command: string): void {
    if (this.socket && this.socket.readyState === this.socket.OPEN) {
      this.socket.send(
        JSON.stringify({
          player_id: this.player?.id,
          command: command,
        }),
      );
    } else {
      console.error("Socket is not open. Cannot send message.");
    }
  }

  public close(): void {
    if (this.socket) {
      this.socket.close();
    }
  }
}
