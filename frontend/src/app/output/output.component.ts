import {
  Component,
  ElementRef,
  ViewChild,
  ChangeDetectionStrategy,
  effect,
  Signal,
  NgZone,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { GameService } from "../game.service";
import { GameMessage } from "../models/game-message";

const MESSAGE_PREFIXES = {
  COMMAND: "command:",
  INVENTORY: "Inventory:",
  MOBS: "Mobs:",
  NPCS: "NPCs:",
  EXITS: "Exits:",
} as const;

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
  readonly error: Signal<string | null>;

  private scrollPending = false;

  constructor(
    public gameService: GameService,
    private ngZone: NgZone,
  ) {
    this.history = this.gameService.messageHistory$;
    this.currentMessage = this.gameService.message$;
    this.error = this.gameService.error$;

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
    if (this.scrollContainer?.nativeElement) {
      const container = this.scrollContainer.nativeElement;
      container.scrollTop = container.scrollHeight;
    }
  }

  getCssClass(message: string): string {
    if (message.startsWith(MESSAGE_PREFIXES.COMMAND)) {
      return "command-text";
    } else if (message.startsWith(MESSAGE_PREFIXES.INVENTORY)) {
      return "inventory-text";
    } else if (message.startsWith(MESSAGE_PREFIXES.MOBS)) {
      return "mobs-text";
    } else if (message.startsWith(MESSAGE_PREFIXES.NPCS)) {
      return "npcs-text";
    } else if (message.startsWith(MESSAGE_PREFIXES.EXITS)) {
      return "exits-text";
    }

    return "response-text";
  }
}
