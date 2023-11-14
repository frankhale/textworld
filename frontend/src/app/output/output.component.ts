import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameMessage, GameService } from '../game.service';

@Component({
  selector: 'app-output',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './output.component.html',
  styleUrls: ['./output.component.scss']
})
export class OutputComponent {
  history: GameMessage[] = [];

  @ViewChild('scrollContainer', { static: false }) scrollContainer!: ElementRef;

  constructor(
    public game: GameService) {
  }

  ngOnChanges() {
    //if (this.serverOutput.includes("/clear")) {
    //  this.history = [];
    //} else {
    // this.serverOutput = this.serverOutput.filter(message =>
    //   message.trim() !== '' &&
    //   !message.startsWith("Location:"));
    //console.log("HISTORY", this.serverOutput);
    // if (this.serverOutput != null) {
    //   this.history.push(this.serverOutput);
    //   this.scrollToBottom();
    // }
    //}
    this.scrollToBottom();
  }

  getCssClass(message: string): string {
    if (message.startsWith("command:")) {
      return "command-text";
    } else if (message.startsWith("Exits:")) {
      return "exits-text";
    } else if (message.startsWith("NPCs:")) {
      return "npcs-text";
    } else if (message.startsWith("Inventory:")) {
      return "inventory-text";
    }

    return "response-text";
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    if (this.scrollContainer) {
      const container = this.scrollContainer.nativeElement;
      container.scrollTop = container.scrollHeight;
    }
  }
}
