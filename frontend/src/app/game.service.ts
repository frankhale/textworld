import { Injectable, signal, OnDestroy } from "@angular/core";
import { GameMessage } from "./models/game-message";
import { Player } from "./models/player";
import { environment } from "../environments/environment";

const RECONNECT_DELAY_MS = 3000;
const MAX_RECONNECT_ATTEMPTS = 5;
const MAX_MESSAGE_HISTORY = 500;

@Injectable({
  providedIn: "root",
})
export class GameService implements OnDestroy {
  private _player: Player | null = null;
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

  private _messageHistory$ = signal<GameMessage[]>([]);
  private _message$ = signal<GameMessage | null>(null);
  private _connected = signal(false);
  private _error$ = signal<string | null>(null);

  public readonly messageHistory$ = this._messageHistory$.asReadonly();
  public readonly message$ = this._message$.asReadonly();
  public readonly connected = this._connected.asReadonly();
  public readonly error$ = this._error$.asReadonly();

  get player(): Player | null {
    return this._player;
  }

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

    this.socket = new WebSocket(environment.websocketUrl);

    this.socket.addEventListener("open", () => {
      this._connected.set(true);
      this._error$.set(null);
      this.reconnectAttempts = 0;
    });

    this.socket.addEventListener("message", (event) => {
      this.handleMessage(event);
    });

    this.socket.addEventListener("error", (event) => {
      console.error("WebSocket error:", event);
      this._error$.set("WebSocket connection error");
    });

    this.socket.addEventListener("close", () => {
      this._connected.set(false);
      this.scheduleReconnect();
    });
  }

  private handleMessage(event: MessageEvent): void {
    let message: GameMessage;

    try {
      const data = JSON.parse(event.data);
      if (!this.isValidGameMessage(data)) {
        console.error("Invalid message format received");
        this._error$.set("Invalid message format received from server");
        return;
      }
      message = data;
      this._error$.set(null);
    } catch (error) {
      console.error("Failed to parse WebSocket message:", error);
      this._error$.set("Failed to parse server response");
      return;
    }

    if (message.player) {
      this._player = message.player;
    }

    this.addMessage(message);
  }

  private isValidGameMessage(data: unknown): data is GameMessage {
    return (
      typeof data === "object" &&
      data !== null &&
      "id" in data &&
      "result" in data &&
      "responseLines" in data
    );
  }

  private addMessage(message: GameMessage): void {
    this._messageHistory$.update((history) => {
      const newHistory = [...history, message];
      if (newHistory.length > MAX_MESSAGE_HISTORY) {
        return newHistory.slice(newHistory.length - MAX_MESSAGE_HISTORY);
      }
      return newHistory;
    });
    this._message$.set(message);
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      this._error$.set("Unable to connect to server after multiple attempts");
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
      this._error$.set(null);
      this.socket.send(
        JSON.stringify({
          player_id: this._player?.id,
          command: command,
        }),
      );
    } else {
      const errorMsg = "Cannot send command: not connected to server";
      console.error(errorMsg);
      this._error$.set(errorMsg);
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
