import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from "@angular/core";
import { ActivatedRoute, RouterLink, Router } from "@angular/router";
import { UsersService } from "../shared/http/users.service";
import { DomSanitizer, Meta, SafeResourceUrl, Title } from "@angular/platform-browser";
import { User } from "@scholarsome/shared";
import { faFolder, faClone } from "@fortawesome/free-solid-svg-icons";
import { CommonModule } from "@angular/common";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  selector: "scholarsome-profile",
  templateUrl: "./profile.component.html",
  styleUrls: ["./profile.component.scss"],
  imports: [CommonModule, FontAwesomeModule, RouterLink]
})
export class ProfileComponent implements OnInit {
  constructor(
    private readonly usersService: UsersService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly titleService: Title,
    private readonly metaService: Meta,
    private readonly sanitizer: DomSanitizer,
    private readonly cdr: ChangeDetectorRef
  ) {}

  @ViewChild("spinner", { static: true }) spinner: ElementRef;

  user: User | null;
  avatarUrl?: SafeResourceUrl;
  registrationDate: string;

  protected readonly faFolder = faFolder;
  protected readonly faClone = faClone;

  async ngOnInit(): Promise<void> {
    const userId = this.route.snapshot.paramMap.get("userId");
    if (!userId) {
      await this.router.navigate(["404"]);
      return;
    }

    const avatar = await this.usersService.getAvatar(userId, 128, 128);

    if (avatar) {
      this.avatarUrl = this.sanitizer.bypassSecurityTrustResourceUrl(URL.createObjectURL(avatar));
    }

    this.user = await this.usersService.user(userId);
    if (!this.user) {
      await this.router.navigate(["404"]);
      return;
    }

    this.user.sets.forEach((s) => {
      s.updatedAt = new Date(s.updatedAt);
    });
    this.user.sets = this.user.sets.sort((a, b) => {
      return new Date(b.updatedAt).valueOf() - new Date(a.updatedAt).valueOf();
    });

    this.spinner.nativeElement.remove();

    this.titleService.setTitle(this.user.username + " — Scholarsome");
    this.metaService.addTag({ name: "description", content: "Scholarsome is the way studying was meant to be. No monthly fees or upsells to get between you and your study tools. Just flashcards." });

    this.user.createdAt = new Date(this.user.createdAt);

    this.registrationDate = this.user.createdAt.toLocaleString("en-us", { month: "long", day: "numeric", year: "numeric" } );

    // The profile data above is loaded asynchronously. Mark the view for change
    // detection so it re-renders with the loaded user data.
    this.cdr.markForCheck();
  }
}
