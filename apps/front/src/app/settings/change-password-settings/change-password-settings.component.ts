import { ChangeDetectionStrategy, Component, signal } from "@angular/core";
import { NgForm, FormsModule } from "@angular/forms";
import { AuthService } from "../../auth/auth.service";
import { ApiResponseOptions } from "@scholarsome/shared";
import { CommonModule } from "@angular/common";

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "scholarsome-change-password-settings",
  templateUrl: "./change-password-settings.component.html",
  styleUrls: ["./change-password-settings.component.scss"],
  imports: [CommonModule, FormsModule]
})
export class ChangePasswordSettingsComponent {
  constructor(
    private readonly authService: AuthService
  ) {}

  protected clicked = signal(false);
  protected error = signal(false);
  protected invalidPassword = signal(false);
  protected notMatching = signal(false);
  protected rateLimit = signal(false);
  protected success = signal(false);

  async submit(form: NgForm) {
    this.clicked.set(true);
    this.error.set(false);
    this.invalidPassword.set(false);
    this.notMatching.set(false);
    this.rateLimit.set(false);
    this.success.set(false);

    if (form.value["newPassword"] !== form.value["confirmNewPassword"]) {
      this.notMatching.set(true);
      this.clicked.set(false);
      return;
    }

    const response = await this.authService.setPasswordAuthenticated(
        form.value["existingPassword"],
        form.value["newPassword"]
    );

    this.clicked.set(false);

    switch (response) {
      case ApiResponseOptions.Success:
        this.success.set(true);
        form.resetForm();
        break;
      case ApiResponseOptions.Ratelimit:
        this.rateLimit.set(true);
        break;
      case ApiResponseOptions.Incorrect:
        this.invalidPassword.set(true);
        break;
      default:
        this.error.set(true);
        break;
    }
  }
}
