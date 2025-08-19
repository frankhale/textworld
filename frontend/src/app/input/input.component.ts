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
  currentIndex: number = 0;

  @ViewChild("playerTextInput", { static: false })
  playerTextInput!: ElementRef;

  constructor(public gameService: GameService) { }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === "Enter") {
      //this.response.length = 0;
      //if (this.playerInput.startsWith("/clear")) {
      //  this.response = [this.playerInput];
      //} else {
      this.gameService.send(this.playerInput);
      //}
      if (!this.history.includes(this.playerInput)) {
        this.history.push(this.playerInput);
      }
      this.playerInput = "";
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      this.currentIndex = (this.currentIndex - 1 + this.history.length) %
        this.history.length;
      this.playerInput = this.history[this.currentIndex];

      this.playerTextInput.nativeElement.setSelectionRange(
        this.playerInput.length,
        this.playerInput.length,
      );
    } else if (event.key === "ArrowDown") {
      this.currentIndex = (this.currentIndex + 1) % this.history.length;
      this.playerInput = this.history[this.currentIndex];

      this.playerTextInput.nativeElement.setSelectionRange(
        this.playerInput.length,
        this.playerInput.length,
      );
    }
  }
}
