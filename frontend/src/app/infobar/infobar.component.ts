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
  zone: string = '';
  room: string = '';

  constructor(private gameService: GameService) {
    this.gameService.messages$.subscribe((message: GameMessage) => {
      this.zone = message.player.zone;
      this.room = message.player.room;
    });
  }
}
