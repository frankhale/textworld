import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GameService, GameMessage } from '../game.service';
import { OutputComponent } from '../output/output.component';
import { InfobarComponent } from '../infobar/infobar.component';

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [CommonModule, FormsModule, OutputComponent, InfobarComponent],
  templateUrl: './input.component.html',
  styleUrls: ['./input.component.scss']
})
export class InputComponent {
  input: string = "";
  history: string[] = [];
  currentIndex: number = 0;
  response: string = "";

  constructor(private game: GameService) {
    this.game.messages$.subscribe((message: GameMessage) => {
      console.log(message);
      this.response = message.response;
    });
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      if (this.input === "/clear") {
        this.response = "/clear";
      } else {
        this.game.send(this.input);
      }
      this.history.push(this.input);
      this.input = '';
    } else if (event.key === 'ArrowUp') {
      this.currentIndex = (this.currentIndex - 1 + this.history.length) % this.history.length;
      this.input = this.history[this.currentIndex];
    } else if (event.key === 'ArrowDown') {
      this.currentIndex = (this.currentIndex + 1) % this.history.length;
      this.input = this.history[this.currentIndex];
    }
  }
}
