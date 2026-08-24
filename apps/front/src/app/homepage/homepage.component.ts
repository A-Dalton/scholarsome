import { ChangeDetectionStrategy, Component, ElementRef, OnInit, ViewChild, signal } from "@angular/core";
import { User } from "@scholarsome/shared";
import { Meta, Title } from "@angular/platform-browser";
import { UsersService } from "../shared/http/users.service";
import { faPlus, faClone, faFolder } from "@fortawesome/free-solid-svg-icons";
import { CommonModule } from "@angular/common";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { RouterLink } from "@angular/router";

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "scholarsome-view",
  templateUrl: "./homepage.component.html",
  styleUrls: ["./homepage.component.scss"],
  imports: [CommonModule, FontAwesomeModule, RouterLink]
})
export class HomepageComponent implements OnInit {
  constructor(
    private readonly usersService: UsersService,
    private readonly titleService: Title,
    private readonly metaService: Meta
  ) {
    this.titleService.setTitle("Homepage — Scholarsome");
    this.metaService.addTag({ name: "description", content: "Scholarsome is the way studying was meant to be. No monthly fees or upsells to get between you and your study tools. Just flashcards." });
  }

  @ViewChild("container", { static: true }) container: ElementRef;
  @ViewChild("spinner", { static: true }) spinner: ElementRef;

  user = signal<User | undefined>(undefined);

  protected readonly faClone = faClone;
  protected readonly faFolder = faFolder;
  protected readonly faPlus = faPlus;

  async ngOnInit(): Promise<void> {
    const user = await this.usersService.myUser();
    if (user) {
      user.sets.forEach((s) => {
        s.updatedAt = new Date(s.updatedAt);
      });
      user.sets = user.sets.sort((a, b) => {
        return new Date(b.updatedAt).valueOf() - new Date(a.updatedAt).valueOf();
      });

      user.folders = user.folders
          .sort((a, b) => {
            return new Date(b.updatedAt).valueOf() - new Date(a.updatedAt).valueOf();
          })
          .filter((f) => !f.parentFolderId);
    }

    this.user.set(user ?? undefined);

    this.spinner.nativeElement.remove();
    this.container.nativeElement.removeAttribute("hidden");
  }
}
