import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GameService, GameMessage } from '../game.service';
import { OutputComponent } from '../output/output.component';

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [CommonModule, FormsModule, OutputComponent],
  templateUrl: './input.component.html',
  styleUrls: ['./input.component.scss']
})
export class InputComponent {
  playerInput: string = "";
  history: string[] = [];
  currentIndex: number = 0;
  response: string = "";

  @ViewChild('playerTextInput', { static: false }) playerTextInput!: ElementRef;

  constructor(private game: GameService) {
    this.game.messages$.subscribe((message: GameMessage) => {
      //this.response.length = 0;
      this.response = message.response; //.split("\n");
      //this.response = this.response.filter(message => message.trim() !== '');
      //console.table(this.response);
    });
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      //this.response.length = 0;
      //if (this.playerInput.startsWith("/clear")) {
      //  this.response = [this.playerInput];
      //} else {
      this.game.send(this.playerInput);
      //}
      if (!this.history.includes(this.playerInput)) {
        this.history.push(this.playerInput);
      }
      this.playerInput = '';
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.currentIndex = (this.currentIndex - 1 + this.history.length) % this.history.length;
      this.playerInput = this.history[this.currentIndex];

      this.playerTextInput.nativeElement.setSelectionRange(this.playerInput.length, this.playerInput.length);
    } else if (event.key === 'ArrowDown') {
      this.currentIndex = (this.currentIndex + 1) % this.history.length;
      this.playerInput = this.history[this.currentIndex];

      this.playerTextInput.nativeElement.setSelectionRange(this.playerInput.length, this.playerInput.length);
    }
  }
}
