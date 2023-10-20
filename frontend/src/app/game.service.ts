import { Injectable } from "@angular/core";
import { Subject, Observable } from 'rxjs';

export interface Entity {
  id: string;
  name: string;
  description: string;
}

export interface Stats {
  stats: Resources;
  damage_and_defense: DamageAndDefense;
}

export interface Stat {
  current: number;
  max: number;
}

export interface Level {
  level: number;
  xp: number;
}

export interface Player extends Entity, Stats {
  score: number;
  gold: number;
  progress: Level;
  zone: string;
  room: string;
  flags: string[];
  inventory: ItemDrop[];
  quests: string[];
  quests_completed: string[];
  known_recipes: string[];
}

export interface ItemDrop {
  name: string;
  quantity: number;
}

export interface Resources {
  health: Stat;
  stamina: Stat;
  magicka: Stat;
}

export interface DamageAndDefense {
  physical_damage: number;
  physical_defense: number;
  spell_damage: number;
  spell_defense: number;
  critical_chance: number;
}

export interface GameMessage {
  player: Player;
  input: string;
  response: string;
}

@Injectable({
  providedIn: 'root'
})
export class GameService {
  private socket: WebSocket = new WebSocket('ws://localhost:8080');
  private messagesSubject = new Subject<GameMessage>();

  public messages$: Observable<GameMessage> = this.messagesSubject.asObservable();

  constructor() {
    this.connect();
  }

  public connect(): void {
    if (!this.socket || this.socket.readyState !== this.socket.OPEN) {
      this.socket.onmessage = (event) => {
        //console.log('WebSocket message received:', event);
        const message: GameMessage = JSON.parse(event.data);
        this.messagesSubject.next(message);
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
