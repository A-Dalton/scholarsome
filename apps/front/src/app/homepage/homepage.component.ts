import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from "@angular/core";
import { User } from "@scholarsome/shared";
import { Meta, Title } from "@angular/platform-browser";
import { UsersService } from "../shared/http/users.service";
import { faPlus, faClone, faFolder } from "@fortawesome/free-solid-svg-icons";

@Component({
  standalone: false,
  changeDetection: ChangeDetectionStrategy.Eager,
  selector: "scholarsome-view",
  templateUrl: "./homepage.component.html",
  styleUrls: ["./homepage.component.scss"]
})
export class HomepageComponent implements OnInit {
  constructor(
    private readonly usersService: UsersService,
    private readonly titleService: Title,
    private readonly metaService: Meta,
    private readonly cdr: ChangeDetectorRef
  ) {
    this.titleService.setTitle("Homepage — Scholarsome");
    this.metaService.addTag({ name: "description", content: "Scholarsome is the way studying was meant to be. No monthly fees or upsells to get between you and your study tools. Just flashcards." });
  }

  @ViewChild("container", { static: true }) container: ElementRef;
  @ViewChild("spinner", { static: true }) spinner: ElementRef;

  user: User;

  protected readonly faClone = faClone;
  protected readonly faFolder = faFolder;
  protected readonly faPlus = faPlus;

  async ngOnInit(): Promise<void> {
    const user = await this.usersService.myUser();
    if (user) {
      this.user = user;

      this.user.sets.forEach((s) => {
        s.updatedAt = new Date(s.updatedAt);
      });
      this.user.sets = this.user.sets.sort((a, b) => {
        return new Date(b.updatedAt).valueOf() - new Date(a.updatedAt).valueOf();
      });

      this.user.folders = this.user.folders
          .sort((a, b) => {
            return new Date(b.updatedAt).valueOf() - new Date(a.updatedAt).valueOf();
          })
          .filter((f) => !f.parentFolderId);
    }

    this.spinner.nativeElement.remove();
    this.container.nativeElement.removeAttribute("hidden");
    // The HTTP request above completes outside of the change-detection cycle, so the view
    // would not re-render with the loaded user. Mark the view for change detection so the
    // next tick refreshes it with the loaded data.
    this.cdr.markForCheck();
  }
}
