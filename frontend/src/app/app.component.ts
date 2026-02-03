import { Component } from "@angular/core";
import { InputComponent } from "./input/input.component";
import { OutputComponent } from "./output/output.component";

@Component({
  selector: "app-root",
  imports: [InputComponent, OutputComponent],
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"]
})
export class AppComponent {}
