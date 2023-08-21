import { Component, ElementRef, Input, Renderer2, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-output',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './output.component.html',
  styleUrls: ['./output.component.scss']
})
export class OutputComponent {
  @Input() serverOutput: string[] = [];
  history: string[] = [];

  @ViewChild('scrollContainer', { static: false }) scrollContainer!: ElementRef;

  constructor(private renderer: Renderer2) { }

  ngOnChanges() {
    if (this.serverOutput.includes("/clear")) {
      this.history = [];
    } else {
      this.serverOutput = this.serverOutput.filter(message =>
        message.trim() !== '' &&
        !message.startsWith("Location:"));

      this.history.push(...this.serverOutput);
      this.scrollToBottom();
    }
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
