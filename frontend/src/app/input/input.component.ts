import { Component, ElementRef, ViewChild, ChangeDetectionStrategy } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { GameService } from "../game.service";

const MAX_HISTORY_SIZE = 100;

@Component({
  selector: "app-input",
  imports: [FormsModule],
  templateUrl: "./input.component.html",
  styleUrls: ["./input.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputComponent {
  playerInput: string = "";
  private history: string[] = [];
  private historySet = new Set<string>();
  private currentIndex: number = 0;

  @ViewChild("playerTextInput", { static: false })
  playerTextInput!: ElementRef;

  constructor(public gameService: GameService) {}

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === "Enter") {
      if (this.playerInput.trim()) {
        this.gameService.send(this.playerInput);
        this.addToHistory(this.playerInput);
        this.currentIndex = this.history.length;
      }
      this.playerInput = "";
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      this.navigateHistory(-1);
    } else if (event.key === "ArrowDown") {
      this.navigateHistory(1);
    }
  }

  private addToHistory(command: string): void {
    if (this.historySet.has(command)) {
      return;
    }

    this.historySet.add(command);
    this.history.push(command);

    if (this.history.length > MAX_HISTORY_SIZE) {
      const removed = this.history.shift();
      if (removed) {
        this.historySet.delete(removed);
      }
    }
  }

  private navigateHistory(direction: number): void {
    if (this.history.length === 0) return;

    this.currentIndex = (this.currentIndex + direction + this.history.length) % this.history.length;
    this.playerInput = this.history[this.currentIndex];
    this.setCursorToEnd();
  }

  private setCursorToEnd(): void {
    if (this.playerTextInput?.nativeElement) {
      this.playerTextInput.nativeElement.setSelectionRange(
        this.playerInput.length,
        this.playerInput.length,
      );
    }
  }
}
