import { Injectable, signal } from "@angular/core";
import { GameMessage } from "./models/game-message";

@Injectable({
  providedIn: 'root'
})
export class GameService {
  private socket: WebSocket = new WebSocket('ws://localhost:8080');
  public messageHistory$ = signal<GameMessage[]>([]);
  public message$ = signal({} as GameMessage);

  constructor() {
    this.connect();
  }

  public connect(): void {
    if (!this.socket || this.socket.readyState !== this.socket.OPEN) {
      this.socket.onmessage = (event) => {
        console.log('WebSocket message received:', event);
        const message: GameMessage = JSON.parse(event.data);
        this.messageHistory$.set([...this.messageHistory$(), message]);
        this.message$.set(message);
      };
    }
  }

  public send(message: string): void {
    if (this.socket && this.socket.readyState === this.socket.OPEN) {
      this.socket.send(message);
    } else {
      console.error('Socket is not open. Cannot send message.');
    }
  }

  public close(): void {
    if (this.socket) {
      this.socket.close();
    }
  }
}
