import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameService, GameMessage } from '../game.service';

@Component({
  selector: 'app-infobar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './infobar.component.html',
  styleUrls: ['./infobar.component.scss']
})
export class InfobarComponent {
  gameMessage: GameMessage | null = null;
  zone: string = '';
  room: string = '';
  health: string = '';
  gold: string = '';

  constructor(private gameService: GameService) {
    this.gameService.messages$.subscribe((message: GameMessage) => {
      this.gameMessage = message;
      this.zone = message.player.zone;
      this.room = message.player.room;
      this.health = `${message.player.stats.health.current}/${message.player.stats.health.max}`;
      this.gold = `${message.player.gold}`;
    });
  }
}
