import { Component, ElementRef, ViewChild } from "@angular/core";

import { FormsModule } from "@angular/forms";
import { GameService } from "../game.service";

@Component({
  selector: "app-input",
  imports: [FormsModule],
  templateUrl: "./input.component.html",
  styleUrls: ["./input.component.scss"]
})
export class InputComponent {
  playerInput: string = "";
  history: string[] = [];
  historySet = new Set<string>();
  currentIndex: number = 0;

  @ViewChild("playerTextInput", { static: false })
  playerTextInput!: ElementRef;

  constructor(public gameService: GameService) {}

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === "Enter") {
      if (this.playerInput.trim()) {
        this.gameService.send(this.playerInput);
        if (!this.historySet.has(this.playerInput)) {
          this.historySet.add(this.playerInput);
          this.history.push(this.playerInput);
        }
        this.currentIndex = this.history.length;
      }
      this.playerInput = "";
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      if (this.history.length === 0) return;
      this.currentIndex = (this.currentIndex - 1 + this.history.length) % this.history.length;
      this.playerInput = this.history[this.currentIndex];
      this.setCursorToEnd();
    } else if (event.key === "ArrowDown") {
      if (this.history.length === 0) return;
      this.currentIndex = (this.currentIndex + 1) % this.history.length;
      this.playerInput = this.history[this.currentIndex];
      this.setCursorToEnd();
    }
  }

  private setCursorToEnd(): void {
    this.playerTextInput.nativeElement.setSelectionRange(
      this.playerInput.length,
      this.playerInput.length,
    );
  }
}
