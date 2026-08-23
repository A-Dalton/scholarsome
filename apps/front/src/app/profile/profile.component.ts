import { ChangeDetectionStrategy, Component, ElementRef, OnInit, ViewChild, signal } from "@angular/core";
import { ActivatedRoute, RouterLink, Router } from "@angular/router";
import { UsersService } from "../shared/http/users.service";
import { DomSanitizer, Meta, SafeResourceUrl, Title } from "@angular/platform-browser";
import { User } from "@scholarsome/shared";
import { faFolder, faClone } from "@fortawesome/free-solid-svg-icons";
import { CommonModule } from "@angular/common";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
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
    private readonly sanitizer: DomSanitizer
  ) {}

  @ViewChild("spinner", { static: true }) spinner: ElementRef;

  user = signal<User | null>(null);
  avatarUrl = signal<SafeResourceUrl | undefined>(undefined);
  registrationDate = signal<string>("");

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
      this.avatarUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(URL.createObjectURL(avatar)));
    }

    const user = await this.usersService.user(userId);
    if (!user) {
      await this.router.navigate(["404"]);
      return;
    }

    user.sets.forEach((s) => {
      s.updatedAt = new Date(s.updatedAt);
    });
    user.sets = user.sets.sort((a, b) => {
      return new Date(b.updatedAt).valueOf() - new Date(a.updatedAt).valueOf();
    });

    this.spinner.nativeElement.remove();

    this.titleService.setTitle(user.username + " — Scholarsome");
    this.metaService.addTag({ name: "description", content: "Scholarsome is the way studying was meant to be. No monthly fees or upsells to get between you and your study tools. Just flashcards." });

    user.createdAt = new Date(user.createdAt);

    this.registrationDate.set(user.createdAt.toLocaleString("en-us", { month: "long", day: "numeric", year: "numeric" }));

    this.user.set(user);
  }
}
