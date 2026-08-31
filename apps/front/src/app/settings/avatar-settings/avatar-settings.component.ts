import { ChangeDetectionStrategy, Component, OnInit, signal } from "@angular/core";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";
import { SharedService } from "../../shared/shared.service";
import { UsersService } from "../../shared/http/users.service";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "scholarsome-avatar-settings",
  templateUrl: "./avatar-settings.component.html",
  styleUrls: ["./avatar-settings.component.scss"],
  imports: [CommonModule, FormsModule]
})
export class AvatarSettingsComponent implements OnInit {
  constructor(
    private readonly usersService: UsersService,
    private readonly sanitizer: DomSanitizer,
    private readonly sharedService: SharedService
  ) {}

  protected changeClicked = signal(false);
  protected changeError = signal<"tooLarge" | "unsupported" | "error" | false>(false);

  protected deleteClicked = signal(false);

  protected newAvatar: File;
  protected existingAvatarUrl = signal<SafeResourceUrl | null>(null);

  async submit() {
    this.changeClicked.set(true);
    this.changeError.set(false);

    const response = await this.usersService.setMyAvatar(this.newAvatar);

    this.changeError.set(response === "success" ? false : response);

    this.changeClicked.set(false);

    if (response === "success") {
      await this.viewAvatar();
      this.sharedService.avatarUpdateEvent.next();
    }
  }

  async viewAvatar() {
    const avatar = await this.usersService.getMyAvatar(128, 128);

    if (avatar) {
      this.existingAvatarUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(URL.createObjectURL(avatar)));
    } else {
      this.existingAvatarUrl.set(null);
    }
  }

  async deleteAvatar() {
    this.deleteClicked.set(true);

    await this.usersService.deleteMyAvatar();
    this.sharedService.avatarUpdateEvent.next();

    this.existingAvatarUrl.set(null);
    this.deleteClicked.set(false);
  }

  protected onFileUpload(event: Event): void {
    const files = (event.target as HTMLInputElement).files;

    if (files) {
      this.newAvatar = files[0];
    }
  }

  async ngOnInit(): Promise<void> {
    await this.viewAvatar();
  }
}
