import { ChangeDetectionStrategy, Component, TemplateRef, ViewChild, signal } from "@angular/core";
import { NgForm, FormsModule } from "@angular/forms";
import { AuthService } from "../../auth/auth.service";
import { BsModalRef, BsModalService } from "ngx-bootstrap/modal";
import { ApiResponseOptions } from "@scholarsome/shared";
import { Router } from "@angular/router";
import { ModalService } from "../../shared/modal.service";
import { CommonModule } from "@angular/common";

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "scholarsome-forgot-password-modal",
  templateUrl: "./forgot-password-modal.component.html",
  styleUrls: ["./forgot-password-modal.component.scss"],
  imports: [CommonModule, FormsModule]
})
export class ForgotPasswordModalComponent {
  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly bsModalService: BsModalService,
    public readonly modalService: ModalService
  ) {
    this.bsModalService.onHide.subscribe(() => {
      this.response.set(null);
      this.clicked.set(false);
    });
  }

  @ViewChild("modal") modal: TemplateRef<HTMLElement>;

  protected clicked = signal(false);
  protected response = signal<ApiResponseOptions | null>(null);

  protected publicAppEnv = signal(false);
  protected onLandingPage = signal(false);

  protected readonly ApiResponseOptions = ApiResponseOptions;
  protected modalRef?: BsModalRef;

  public open(): BsModalRef {
    this.publicAppEnv.set(import.meta.env.NODE_ENV === "public");
    this.onLandingPage.set(this.router.url === "/");

    this.modalRef = this.bsModalService.show(this.modal, { ignoreBackdropClick: !this.publicAppEnv() });
    return this.modalRef;
  }

  protected async submit(form: NgForm) {
    this.clicked.set(true);
    this.response.set(await this.authService.sendPasswordReset(form.value));
    this.clicked.set(false);
  }
}
