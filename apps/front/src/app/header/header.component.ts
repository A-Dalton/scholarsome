import { AfterViewInit, ChangeDetectionStrategy, Component, OnDestroy, OnInit, ViewChild, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { RouterLinkWithHref } from "@angular/router";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { BsDropdownDirective, BsDropdownMenuDirective, BsDropdownToggleDirective } from "ngx-bootstrap/dropdown";
import { BsModalRef } from "ngx-bootstrap/modal";
import { ModalService } from "../shared/modal.service";
import { AuthService } from "../auth/auth.service";
import { CookieService } from "ngx-cookie";
import { faGithub } from "@fortawesome/free-brands-svg-icons";
import { DeviceDetectorService } from "ngx-device-detector";
import { NavigationEnd, Router } from "@angular/router";
import { filter } from "rxjs";
import { faQ, faArrowRightFromBracket, faStar, faFileCsv, faGear, faFolder, faClone, faUser, faMoon, faSun } from "@fortawesome/free-solid-svg-icons";
import { SharedService } from "../shared/shared.service";
import { ThemeService } from "../shared/theme.service";
// eslint-disable-next-line @nx/enforce-module-boundaries
import packageJson from "../../../../../package.json";
import { AnkiImportModalComponent } from "./anki-import-modal/anki-import-modal.component";
import { QuizletImportModalComponent } from "./quizlet-import-modal/quizlet-import-modal.component";
import { SetPasswordModalComponent } from "./set-password-modal/set-password-modal.component";
import { LoginModalComponent } from "./login-modal/login-modal.component";
import { ForgotPasswordModalComponent } from "./forgot-password-modal/forgot-password-modal.component";
import { RegisterModalComponent } from "./register-modal/register-modal.component";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";
import { User } from "@scholarsome/shared";
import { UsersService } from "../shared/http/users.service";
import { CsvImportModalComponent } from "./csv-import-modal/csv-import-modal.component";
import { ResendEmailComponent } from "./resend-email/resend-email.component";

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "scholarsome-header",
  templateUrl: "./header.component.html",
  styleUrls: ["./header.component.scss"],
  imports: [
    CommonModule,
    FormsModule,
    RouterLinkWithHref,
    FontAwesomeModule,
    BsDropdownDirective,
    BsDropdownMenuDirective,
    BsDropdownToggleDirective,
    ResendEmailComponent,
    AnkiImportModalComponent,
    QuizletImportModalComponent,
    SetPasswordModalComponent,
    LoginModalComponent,
    ForgotPasswordModalComponent,
    RegisterModalComponent,
    CsvImportModalComponent
  ]
})
export class HeaderComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild("ankiImport") ankiImportModal: AnkiImportModalComponent;
  @ViewChild("quizletImport") quizletImportModal: QuizletImportModalComponent;
  @ViewChild("setPassword") setPasswordModal: SetPasswordModalComponent;
  @ViewChild("login") loginModal: LoginModalComponent;
  @ViewChild("forgot") forgotPasswordModal: ForgotPasswordModalComponent;
  @ViewChild("register") registerModal: RegisterModalComponent;
  @ViewChild("csvImport") csvImportModal: CsvImportModalComponent;

  // Whether an update is available compared to the current running version
  protected updateAvailable = signal(false);
  // URL of the new version
  protected releaseUrl = signal("");

  // Used to show the verify email banner
  protected verificationResult = signal<boolean | null>(null);

  // Whether the header is hidden - hidden on the landing page
  protected hidden = signal(false);

  // If the user is signed in
  protected signedIn = signal(false);

  // URL of avatar
  protected avatarUrl = signal<SafeResourceUrl | null>(null);

  // User object
  protected user = signal<User | undefined>(undefined);

  protected isMobile = signal(false);

  protected modalRef?: BsModalRef;

  protected readonly packageJson = packageJson;
  protected readonly window = window;

  protected readonly faUser = faUser;
  protected readonly faQ = faQ;
  protected readonly faGithub = faGithub;
  protected readonly faStar = faStar;
  protected readonly faArrowRightFromBracket = faArrowRightFromBracket;
  protected readonly faFileCsv = faFileCsv;
  protected readonly faGear = faGear;
  protected readonly faFolder = faFolder;
  protected readonly faClone = faClone;
  protected readonly faMoon = faMoon;
  protected readonly faSun = faSun;

  // Whether dark mode is currently active
  protected darkMode = signal(false);

  async toggleTheme(): Promise<void> {
    this.darkMode.set(this.themeService.toggle() === "dark");
  }

  constructor(
    private readonly modalService: ModalService,
    private readonly authService: AuthService,
    private readonly deviceService: DeviceDetectorService,
    private readonly router: Router,
    private readonly sharedService: SharedService,
    private readonly sanitizer: DomSanitizer,
    private readonly usersService: UsersService,
    private readonly themeService: ThemeService,
    public readonly cookieService: CookieService
  ) {}

  async submitLogout() {
    await this.authService.logout();
    await this.router.navigate(["/"]);
  }

  async viewAvatar() {
    const avatar = await this.usersService.getMyAvatar(64, 64);

    if (avatar) {
      this.avatarUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(URL.createObjectURL(avatar)));
    } else {
      // for when users sign out from an account with an avatar and switch to one without one
      this.avatarUrl.set(null);
    }
  }

  async ngOnInit(): Promise<void> {
    this.darkMode.set(this.themeService.currentTheme() === "dark");

    if (this.cookieService.get("authenticated")) {
      // we set this.user here so that it can be checked on every router event and log users out if auth invalid
      // however since header initializes on the homepage, this.user will not be set immediately after login
      // technically this would cause an issue if the tokens were invalid immediately after login
      // however it is more than overwhelmingly likely that any token issues with be on a future page reload when the user is already logged in
      this.signedIn.set(true);
      const user = await this.usersService.myUser();

      if (user) {
        this.user.set(user);
      } else {
        this.signedIn.set(false);
      }
    }

    this.sharedService
        .isUpdateAvailable()
        .then((r) => this.updateAvailable.set(r));
    this.sharedService.getReleaseUrl().then((r) => this.releaseUrl.set(r));

    this.router.events.subscribe(async (e) => {
      if (e instanceof NavigationEnd) {
        this.hidden.set(this.router.url === "/" || this.router.url === "/reset");

        if (!this.hidden() && this.signedIn()) {
          const user = await this.usersService.myUser();

          // if this user was authenticated and is now no longer authenticated, sign them out
          if (this.user() && !user) {
            await this.authService.logout();
            await this.router.navigate([""]);
          } else if (user) {
            this.user.set(user);
          }

          this.sharedService.avatarUpdateEvent.asObservable().subscribe(async () => {
            await this.viewAvatar();
          });
        }
      }
    });

    this.modalService.modal.subscribe((e) => {
      switch (e) {
        case "register-open":
          this.modalRef = this.registerModal.open();
          break;
        case "login-open":
          this.modalRef = this.loginModal.open();
          break;
        case "set-password-open":
          this.modalRef = this.setPasswordModal.open();
          break;
        case "forgot-password-open":
          this.modalRef = this.forgotPasswordModal.open();
          break;
      }
    });

    this.checkIfVerifiedInCookie();

    if (this.deviceService.isMobile()) {
      this.isMobile.set(true);
    }

    if (this.signedIn() && !this.hidden()) await this.viewAvatar();

    // Hide modals when the route changes. Note: the router also emits events for lazy
    // module preloading (PreloadAllModules), which would otherwise close the login dialog
    // right after it opens on first load. Only react to actual navigations.
    this.router.events
        .pipe(filter((event) => event instanceof NavigationEnd))
        .subscribe(() => this.modalRef?.hide());
  }

  ngAfterViewInit() {
    this.loginModal.loginEvent.subscribe(async () => {
      this.signedIn.set(true);
      this.checkIfVerifiedInCookie();
      await this.viewAvatar();
    });

    this.registerModal.registerEvent.subscribe(async () => {
      this.signedIn.set(true);
      this.checkIfVerifiedInCookie();
      await this.viewAvatar();
    });
  }

  checkIfVerifiedInCookie() {
    const cookies = document.cookie.split(";");
    for (const cookie of cookies) {
      if (!cookie.includes("verified")) {
        continue;
      }
      this.verificationResult.set(cookie.includes("true"));
    }

    this.sharedService.avatarUpdateEvent.subscribe(() => {
      this.viewAvatar();
    });
  }

  ngOnDestroy() {
    this.modalService.modal.unsubscribe();
  }
}
