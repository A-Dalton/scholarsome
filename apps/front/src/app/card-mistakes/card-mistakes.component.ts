import { Component, ElementRef, OnInit, ViewChild } from "@angular/core";
import { CardMistake } from "@scholarsome/shared";
import { Meta, Title } from "@angular/platform-browser";
import { CardMistakesService } from "../shared/http/card-mistakes.service";
import { faHistory } from "@fortawesome/free-solid-svg-icons";

@Component({
  selector: "scholarsome-card-mistakes",
  templateUrl: "./card-mistakes.component.html",
  styleUrls: ["./card-mistakes.component.scss"]
})
export class CardMistakesComponent implements OnInit {
  @ViewChild("container", { static: true }) container: ElementRef;
  @ViewChild("spinner", { static: true }) spinner: ElementRef;

  mistakes: CardMistake[] | null = null;

  protected readonly faHistory = faHistory;

  constructor(
    private readonly cardMistakesService: CardMistakesService,
    private readonly titleService: Title,
    private readonly metaService: Meta
  ) {
    this.titleService.setTitle("Previous mistakes — Scholarsome");
    this.metaService.addTag({ name: "description", content: "Review the flashcards you previously did not know on Scholarsome." });
  }

  async ngOnInit(): Promise<void> {
    this.mistakes = await this.cardMistakesService.mistakes();

    if (this.mistakes) {
      this.mistakes.forEach((m) => {
        m.createdAt = new Date(m.createdAt);
      });
    }

    this.spinner.nativeElement.remove();
    this.container.nativeElement.removeAttribute("hidden");
  }
}
