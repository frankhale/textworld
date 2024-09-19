import { Component, ElementRef, ViewChild } from "@angular/core";
import { toObservable } from "@angular/core/rxjs-interop";
import { CommonModule } from "@angular/common";
import { GameService } from "../game.service";
import { GameMessage } from "../models/game-message";

@Component({
  selector: "app-output",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./output.component.html",
  styleUrls: ["./output.component.scss"],
})
export class OutputComponent {
  history: GameMessage[] = [];
  currentMessage: GameMessage | null = null;

  @ViewChild("scrollContainer", { static: false })
  scrollContainer!: ElementRef;

  constructor(public gameService: GameService) {
    toObservable(this.gameService.messageHistory$).subscribe(
      (history: GameMessage[]) => {
        this.history = history;
      },
    );
    toObservable(this.gameService.message$).subscribe(
      (message: GameMessage) => {
        this.currentMessage = message;
      },
    );
  }

  ngOnChanges() {
    this.scrollToBottom();
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

  getCssClass(message: string): string {
    if (message.startsWith("command:")) {
      return "command-text";
    } else if (message.startsWith("Inventory:")) {
      return "inventory-text";
    }

    return "response-text";
  }
}
