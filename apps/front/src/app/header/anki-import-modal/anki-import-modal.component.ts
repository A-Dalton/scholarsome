import { ChangeDetectionStrategy, Component, DestroyRef, TemplateRef, ViewChild, signal } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
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
  selector: "scholarsome-anki-import-modal",
  templateUrl: "./anki-import-modal.component.html",
  styleUrls: ["./anki-import-modal.component.scss"],
  imports: [CommonModule, FormsModule, FontAwesomeModule]
})
export class AnkiImportModalComponent {
  constructor(
    private readonly bsModalService: BsModalService,
    private readonly convertingService: ConvertingService,
    private readonly router: Router,
    private readonly destroyRef: DestroyRef
  ) {
    this.bsModalService.onHide
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          this.file.set(null);
          this.response.set("");
          this.clicked.set(false);
        });
  }

  @ViewChild("modal") modal: TemplateRef<HTMLElement>;

  protected submitted = signal(false);
  protected uploading = signal(false);
  protected clicked = signal(false);
  protected response = signal("");
  protected file = signal<File | null>(null);

  protected modalRef?: BsModalRef;
  protected readonly faQuestionCircle = faQuestionCircle;

  public open(): BsModalRef {
    this.modalRef = this.bsModalService.show(this.modal);
    return this.modalRef;
  }

  protected async submit(form: NgForm) {
    this.clicked.set(true);
    this.response.set("");
    this.submitted.set(false);

    if (!this.file()) return;

    setTimeout(() => {
      if (this.response() !== "incompatible" && !this.submitted()) this.uploading.set(true);
    }, 3000);

    const set = await this.convertingService.importSetFromAnkiApkg({
      title: form.value["title"],
      description: form.value["description"],
      private: form.value["privateCheck"] === true,
      file: this.file()!
    });

    if (set) {
      this.router.navigateByUrl("/", { skipLocationChange: true }).then(() => {
        this.router.navigate(["/study-set", set.id]);
      });
      this.uploading.set(false);
      this.clicked.set(false);
      this.file.set(null);
      this.submitted.set(true);
    } else {
      this.response.set("incompatible");
      this.clicked.set(false);
      this.file.set(null);
      this.uploading.set(false);
      return;
    }
  }

  protected onFileUpload(event: Event): void {
    const files = (event.target as HTMLInputElement).files;

    if (files) {
      this.file.set(files[0]);
    }
  }
}
