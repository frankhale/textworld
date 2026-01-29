import {
  Component,
  ElementRef,
  ViewChild,
  ChangeDetectionStrategy,
  computed,
  effect,
  Signal,
  NgZone,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { GameService } from "../game.service";
import { GameMessage } from "../models/game-message";

@Component({
  selector: "app-output",
  imports: [CommonModule],
  templateUrl: "./output.component.html",
  styleUrls: ["./output.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OutputComponent {
  @ViewChild("scrollContainer", { static: false })
  scrollContainer!: ElementRef;

  readonly history: Signal<GameMessage[]>;
  readonly currentMessage: Signal<GameMessage | null>;

  private scrollPending = false;

  constructor(
    public gameService: GameService,
    private ngZone: NgZone,
  ) {
    this.history = this.gameService.messageHistory$;
    this.currentMessage = this.gameService.message$;

    effect(() => {
      const messages = this.history();
      if (messages.length > 0) {
        this.scheduleScrollToBottom();
      }
    });
  }

  private scheduleScrollToBottom(): void {
    if (this.scrollPending) return;
    this.scrollPending = true;

    this.ngZone.runOutsideAngular(() => {
      requestAnimationFrame(() => {
        this.scrollToBottom();
        this.scrollPending = false;
      });
    });
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
