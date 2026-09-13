import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, signal } from "@angular/core";
import { SrsCadence, srsCadenceOptions } from "@scholarsome/shared";
import { UsersService } from "../../shared/http/users.service";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "scholarsome-srs-settings",
  templateUrl: "./srs-settings.component.html",
  styleUrls: ["./srs-settings.component.scss"],
  imports: [CommonModule, FormsModule]
})
export class SrsSettingsComponent implements OnInit {
  constructor(
    private readonly usersService: UsersService,
    private readonly changeDetector: ChangeDetectorRef
  ) {}

  protected readonly cadenceOptions = srsCadenceOptions;

  protected selectedCadence: SrsCadence | undefined;
  protected savedCadence: SrsCadence | undefined;

  protected saveClicked = signal(false);
  protected saveError = signal(false);

  async submit() {
    if (!this.selectedCadence) return;

    this.saveClicked.set(true);
    this.saveError.set(false);

    const response = await this.usersService.setMySrsCadence(this.selectedCadence);

    this.saveClicked.set(false);

    if (response) {
      this.savedCadence = this.selectedCadence;
    } else {
      this.saveError.set(true);
    }
  }

  async ngOnInit(): Promise<void> {
    const user = await this.usersService.myUser();

    if (user) {
      this.selectedCadence = user.srsCadence;
      this.savedCadence = user.srsCadence;

      // the app runs zoneless change detection, so assignments made outside of a
      // template event (like this HTTP callback) have to schedule a CD pass
      // explicitly for the select to pick up the loaded value
      this.changeDetector.markForCheck();
    }
  }
}
