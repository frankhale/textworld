import { Injectable, signal, OnDestroy } from "@angular/core";
import { GameMessage } from "./models/game-message";
import { Player } from "./models/player";

const WEBSOCKET_URL = "ws://localhost:8080";
const RECONNECT_DELAY_MS = 3000;
const MAX_RECONNECT_ATTEMPTS = 5;

@Injectable({
  providedIn: "root",
})
export class GameService implements OnDestroy {
  private player: Player | null = null;
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

  public messageHistory$ = signal<GameMessage[]>([]);
  public message$ = signal<GameMessage | null>(null);
  public connected = signal(false);

  constructor() {
    this.connect();
  }

  ngOnDestroy(): void {
    this.close();
  }

  private connect(): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      return;
    }

    this.socket = new WebSocket(WEBSOCKET_URL);

    this.socket.addEventListener("open", () => {
      this.connected.set(true);
      this.reconnectAttempts = 0;
    });

    this.socket.addEventListener("message", (event) => {
      this.handleMessage(event);
    });

    this.socket.addEventListener("error", (event) => {
      console.error("WebSocket error:", event);
    });

    this.socket.addEventListener("close", () => {
      this.connected.set(false);
      this.scheduleReconnect();
    });
  }

  private handleMessage(event: MessageEvent): void {
    let message: GameMessage;

    try {
      message = JSON.parse(event.data);
    } catch (error) {
      console.error("Failed to parse WebSocket message:", error);
      return;
    }

    if (!this.player) {
      this.player = message.player;
    }

    this.addMessage(message);
  }

  private addMessage(message: GameMessage): void {
    this.messageHistory$.update((history) => [...history, message]);
    this.message$.set(message);
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      this.addMessage({
        id: crypto.randomUUID(),
        input: "error",
        player: null,
        result: { response: "Unable to connect to server after multiple attempts." },
        responseLines: ["Unable to connect to server after multiple attempts."],
        map: null,
      });
      return;
    }

    this.reconnectAttempts++;
    const delay = RECONNECT_DELAY_MS * this.reconnectAttempts;

    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, delay);
  }

  public send(command: string): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
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
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}
