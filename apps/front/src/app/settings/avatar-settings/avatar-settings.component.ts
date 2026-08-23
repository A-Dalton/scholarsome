import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from "@angular/core";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";
import { SharedService } from "../../shared/shared.service";
import { UsersService } from "../../shared/http/users.service";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  selector: "scholarsome-avatar-settings",
  templateUrl: "./avatar-settings.component.html",
  styleUrls: ["./avatar-settings.component.scss"],
  imports: [CommonModule, FormsModule]
})
export class AvatarSettingsComponent implements OnInit {
  constructor(
    private readonly usersService: UsersService,
    private readonly sanitizer: DomSanitizer,
    private readonly sharedService: SharedService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  protected changeClicked = false;
  protected changeError = false;

  protected deleteClicked = false;

  protected newAvatar: File;
  protected existingAvatarUrl: SafeResourceUrl | null;

  async submit() {
    this.changeClicked = true;
    this.changeError = false;

    const response = await this.usersService.setMyAvatar(this.newAvatar);

    this.changeError = !response;

    this.changeClicked = false;

    await this.viewAvatar();
    this.sharedService.avatarUpdateEvent.next();
  }

  async viewAvatar() {
    const avatar = await this.usersService.getMyAvatar(128, 128);

    if (avatar) {
      this.existingAvatarUrl = this.sanitizer.bypassSecurityTrustResourceUrl(URL.createObjectURL(avatar));
    } else {
      this.existingAvatarUrl = null;
    }
  }

  async deleteAvatar() {
    this.deleteClicked = true;

    await this.usersService.deleteMyAvatar();
    this.sharedService.avatarUpdateEvent.next();

    this.existingAvatarUrl = null;
    this.deleteClicked = false;
  }

  protected onFileUpload(event: Event): void {
    const files = (event.target as HTMLInputElement).files;

    if (files) {
      this.newAvatar = files[0];
    }
  }

  async ngOnInit(): Promise<void> {
    await this.viewAvatar();

    // The avatar is loaded asynchronously; mark the view for change detection so it
    // re-renders with the loaded avatar.
    this.cdr.markForCheck();
  }
}
