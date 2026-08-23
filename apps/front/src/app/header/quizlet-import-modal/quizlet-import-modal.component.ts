import { ChangeDetectionStrategy, Component, DestroyRef, TemplateRef, ViewChild, signal } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { faQ } from "@fortawesome/free-solid-svg-icons";
import { NgForm, FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { BsModalRef, BsModalService } from "ngx-bootstrap/modal";
import { faQuestionCircle } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { ConvertingService } from "../../shared/http/converting.service";
import { CommonModule } from "@angular/common";

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "scholarsome-quizlet-import-modal",
  templateUrl: "./quizlet-import-modal.component.html",
  styleUrls: ["./quizlet-import-modal.component.scss"],
  imports: [CommonModule, FormsModule, FontAwesomeModule]
})
export class QuizletImportModalComponent {
  constructor(
    private readonly bsModalService: BsModalService,
    private readonly convertingService: ConvertingService,
    private readonly router: Router,
    private readonly destroyRef: DestroyRef
  ) {
    this.bsModalService.onHide
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          this.clicked.set(false);
          this.response.set("");
        });
  }

  @ViewChild("modal") modal: TemplateRef<HTMLElement>;

  protected clicked = signal(false);
  protected response = signal("");

  protected modalRef?: BsModalRef;

  protected readonly faQuestionCircle = faQuestionCircle;
  protected readonly faQ = faQ;

  public open(): BsModalRef {
    this.modalRef = this.bsModalService.show(this.modal);
    return this.modalRef;
  }

  protected async submit(form: NgForm) {
    this.clicked.set(true);
    this.response.set("");

    const set = await this.convertingService.importSetFromQuizletTxt({
      title: form.value["title"],
      description: form.value["description"],
      private: form.value["privateCheck"] === true,
      sideDiscriminator: form.value["termDefinitionDiscriminator"],
      cardDiscriminator: form.value["rowDiscriminator"],
      set: form.value["set"]
    });

    if (set) {
      this.router.navigateByUrl("/", { skipLocationChange: true }).then(() => {
        this.router.navigate(["/study-set", set.id]);
      });
    } else {
      this.response.set("pattern");
      this.clicked.set(false);
      return;
    }
  }
}
