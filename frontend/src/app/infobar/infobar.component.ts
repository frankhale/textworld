import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameService } from '../game.service';

@Component({
  selector: 'app-infobar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './infobar.component.html',
  styleUrls: ['./infobar.component.scss']
})
export class InfobarComponent {
  constructor(public game: GameService) { }
}
