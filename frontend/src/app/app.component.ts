import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterOutlet } from "@angular/router";
import { InputComponent } from "./input/input.component";
import { OutputComponent } from "./output/output.component";

@Component({
  selector: "app-root",
  imports: [CommonModule, InputComponent, OutputComponent],
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"]
})
export class AppComponent {
  title = "textworld-ui";
}
