import { ChangeDetectionStrategy, Component, DestroyRef, EventEmitter, Output, TemplateRef, ViewChild, signal } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ApiResponseOptions } from "@scholarsome/shared";
import { NgForm, FormsModule } from "@angular/forms";
import { AuthService } from "../../auth/auth.service";
import { BsModalRef, BsModalService } from "ngx-bootstrap/modal";
import { ModalService } from "../../shared/modal.service";
import { Router, RouterLink } from "@angular/router";
import { CommonModule } from "@angular/common";

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "scholarsome-register-modal",
  templateUrl: "./register-modal.component.html",
  styleUrls: ["./register-modal.component.scss"],
  imports: [CommonModule, FormsModule, RouterLink]
})
export class RegisterModalComponent {
  constructor(
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly bsModalService: BsModalService,
    private readonly destroyRef: DestroyRef,
    public readonly modalService: ModalService
  ) {
    this.bsModalService.onHide
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          this.response.set(null);
          this.clicked.set(false);
        });
  }

  @ViewChild("modal") modal: TemplateRef<HTMLElement>;
  @Output() registerEvent = new EventEmitter();

  protected response = signal<ApiResponseOptions | null>(null);
  protected clicked = signal(false);

  protected publicAppEnv = signal(false);
  protected onLandingPage = signal(false);
  protected recaptchaEnabled = signal(false);
  protected appUrl = signal("");

  protected modalRef?: BsModalRef;

  protected readonly ApiResponseOptions = ApiResponseOptions;

  public open(): BsModalRef {
    this.publicAppEnv.set(import.meta.env.NODE_ENV === "public");
    this.onLandingPage.set(this.router.url === "/");
    this.recaptchaEnabled.set(!import.meta.env.SCHOLARSOME_RECAPTCHA_SECRET || !import.meta.env.SCHOLARSOME_RECAPTCHA_SITE);
    this.appUrl.set(window.location.host);

    this.modalRef = this.bsModalService.show(this.modal, { ignoreBackdropClick: !this.publicAppEnv() && this.onLandingPage() });
    return this.modalRef;
  }

  protected async submit(form: NgForm) {
    this.response.set(null);
    this.clicked.set(true);
    this.response.set(await this.authService.register(form.value));

    if (this.response() === ApiResponseOptions.Success) {
      await this.router.navigate(["/homepage"]);
      this.registerEvent.emit();
    }

    this.clicked.set(false);
  }
}
