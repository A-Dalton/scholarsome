import { ChangeDetectionStrategy, Component, EventEmitter, Output, TemplateRef, ViewChild } from "@angular/core";
import { ApiResponseOptions } from "@scholarsome/shared";
import { NgForm, FormsModule } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { CommonModule } from "@angular/common";
import { AuthService } from "../../auth/auth.service";
import { BsModalRef, BsModalService } from "ngx-bootstrap/modal";
import { ModalService } from "../../shared/modal.service";

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  selector: "scholarsome-login-modal",
  templateUrl: "./login-modal.component.html",
  styleUrls: ["./login-modal.component.scss"],
  imports: [CommonModule, FormsModule, RouterLink]
})
export class LoginModalComponent {
  constructor(
    private readonly router: Router,
    private readonly bsModalService: BsModalService,
    private readonly authService: AuthService,
    public readonly modalService: ModalService
  ) {
    this.bsModalService.onHide.subscribe(() => {
      this.response = null;
      this.clicked = false;
    });
  }

  @ViewChild("modal") modal: TemplateRef<HTMLElement>;

  @Output() loginEvent = new EventEmitter();

  protected response: ApiResponseOptions | null;
  protected clicked = false;

  protected publicAppEnv = false;
  protected onLandingPage = false;
  protected recaptchaEnabled = false;
  protected appUrl = "";

  protected modalRef?: BsModalRef;

  protected readonly ApiResponseOptions = ApiResponseOptions;

  public open(): BsModalRef {
    this.publicAppEnv = import.meta.env.NODE_ENV === "public";
    this.onLandingPage = this.router.url === "/";
    this.recaptchaEnabled = !import.meta.env.SCHOLARSOME_RECAPTCHA_SECRET || !import.meta.env.SCHOLARSOME_RECAPTCHA_SITE;
    this.appUrl = window.location.host;

    this.modalRef = this.bsModalService.show(this.modal, { ignoreBackdropClick: !this.publicAppEnv && this.onLandingPage });
    return this.modalRef;
  }

  protected async submit(form: NgForm) {
    this.response = null;
    this.clicked = true;
    this.response = await this.authService.login(form.value);

    if (this.response === ApiResponseOptions.Success) {
      await this.router.navigate(["/homepage"]);
      this.loginEvent.emit();
    } else {
      this.clicked = false;
    }
  }
}
