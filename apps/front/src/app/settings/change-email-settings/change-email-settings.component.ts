import { ChangeDetectionStrategy, Component, signal } from "@angular/core";
import { NgForm, FormsModule } from "@angular/forms";
import { AuthService } from "../../auth/auth.service";
import { ApiResponseOptions } from "@scholarsome/shared";
import { Router } from "@angular/router";
import { CommonModule } from "@angular/common";

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "scholarsome-change-email-settings",
  templateUrl: "./change-email-settings.component.html",
  styleUrls: ["./change-email-settings.component.scss"],
  imports: [CommonModule, FormsModule]
})
export class ChangeEmailSettingsComponent {
  constructor(private readonly authService: AuthService, private readonly router: Router) {}

  protected clicked = signal(false);
  protected error = signal(false);
  protected notMatching = signal(false);
  protected rateLimit = signal(false);

  async submit(form: NgForm) {
    this.clicked.set(true);
    this.error.set(false);
    this.notMatching.set(false);
    this.rateLimit.set(false);

    if (form.value["newEmail"] !== form.value["confirmNewEmail"]) {
      this.notMatching.set(true);
      this.clicked.set(false);
      return;
    }

    const response = await this.authService.setEmail(
        form.value["newEmail"]
    );

    this.clicked.set(false);

    switch (response) {
      case ApiResponseOptions.Success:
        form.resetForm();
        this.router.navigate(["/"]);
        break;
      case ApiResponseOptions.Ratelimit:
        this.rateLimit.set(true);
        break;
      default:
        this.error.set(true);
    }
  }
}
