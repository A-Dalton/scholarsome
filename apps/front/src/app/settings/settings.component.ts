import { ChangeDetectionStrategy, Component } from "@angular/core";
import { faImage, faKey, faEnvelope } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { AvatarSettingsComponent } from "./avatar-settings/avatar-settings.component";
import { ChangePasswordSettingsComponent } from "./change-password-settings/change-password-settings.component";
import { ChangeEmailSettingsComponent } from "./change-email-settings/change-email-settings.component";

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "scholarsome-settings",
  templateUrl: "./settings.component.html",
  styleUrls: ["./settings.component.scss"],
  imports: [FontAwesomeModule, AvatarSettingsComponent, ChangePasswordSettingsComponent, ChangeEmailSettingsComponent]
})
export class SettingsComponent {
  protected readonly faImage = faImage;
  protected readonly faKey = faKey;
  protected readonly faEnvelope = faEnvelope;
}
