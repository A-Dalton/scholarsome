import { ChangeDetectionStrategy, Component, signal } from "@angular/core";
import { AuthService } from "../../auth/auth.service";
import { ApiResponseOptions } from "@scholarsome/shared";
import { CommonModule } from "@angular/common";

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "scholarsome-resend-email",
  templateUrl: "./resend-email.component.html",
  styleUrls: ["./resend-email.component.scss"],
  imports: [CommonModule]
})
export class ResendEmailComponent {
  constructor(private authService: AuthService) {}

  protected clicked = signal(false);
  protected response = signal<ApiResponseOptions | undefined>(undefined);
  protected readonly ApiResponseOptions = ApiResponseOptions;

  async onClick() {
    this.clicked.set(true);
    this.response.set(await this.authService.resendVerificationEmail());
    this.clicked.set(false);
  }
}
