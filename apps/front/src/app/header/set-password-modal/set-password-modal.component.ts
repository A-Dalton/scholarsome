import { ChangeDetectionStrategy, Component, TemplateRef, ViewChild } from "@angular/core";
import { NgForm, FormsModule } from "@angular/forms";
import { AuthService } from "../../auth/auth.service";
import { BsModalRef, BsModalService } from "ngx-bootstrap/modal";
import { ModalService } from "../../shared/modal.service";
import { CommonModule } from "@angular/common";

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  selector: "scholarsome-set-password-modal",
  templateUrl: "./set-password-modal.component.html",
  styleUrls: ["./set-password-modal.component.scss"],
  imports: [CommonModule, FormsModule]
})
export class SetPasswordModalComponent {
  constructor(
    private readonly authService: AuthService,
    private readonly bsModalService: BsModalService,
    private readonly modalService: ModalService
  ) {
    this.bsModalService.onHide.subscribe(() => {
      this.notMatching = false;
      this.clicked = false;
    });
  }

  @ViewChild("modal") modal: TemplateRef<HTMLElement>;

  protected notMatching = false;
  protected clicked = false;

  protected modalRef?: BsModalRef;

  public open(): BsModalRef {
    this.modalRef = this.bsModalService.show(this.modal, { keyboard: false, ignoreBackdropClick: true });
    return this.modalRef;
  }

  protected async submit(form: NgForm) {
    this.notMatching = false;
    this.clicked = true;

    if (form.value["password"] !== form.value["confirmPassword"]) {
      this.clicked = false;
      this.notMatching = true;
      return;
    }

    await this.authService.setPassword(form.value);
    this.modalRef?.hide();
    this.modalService.modal.next("login-open");
  }
}
