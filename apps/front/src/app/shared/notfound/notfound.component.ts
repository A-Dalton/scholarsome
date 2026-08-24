import { ChangeDetectionStrategy, Component } from "@angular/core";
import { Title } from "@angular/platform-browser";
import { RouterLink } from "@angular/router";

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "scholarsome-notfound",
  templateUrl: "./notfound.component.html",
  styleUrls: ["./notfound.component.scss"],
  imports: [RouterLink]
})
export class NotfoundComponent {
  constructor(
    private readonly titleService: Title
  ) {
    this.titleService.setTitle("Not found — Scholarsome");
  }
}
