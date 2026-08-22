import { ChangeDetectionStrategy, Component } from "@angular/core";
import { NavigationEnd, Router, RouterOutlet } from "@angular/router";
import { Meta } from "@angular/platform-browser";
import { ThemeService } from "./shared/theme.service";
import { HeaderComponent } from "./header/header.component";
import { HeadScriptsComponent } from "./head-scripts/head-scripts.component";
import {
  FaIconLibrary,
  FontAwesomeModule
} from "@fortawesome/angular-fontawesome";
import {
  faCaretSquareLeft,
  faClone,
  faUser,
  faPlusSquare,
  faTrashCan,
  faArrowAltCircleUp,
  faArrowAltCircleDown,
  faCheckSquare,
  faEyeSlash,
  faCircleQuestion,
  faPenToSquare,
  faComments,
  faFlag,
  faArrowAltCircleLeft,
  faArrowAltCircleRight,
  faRectangleList
} from "@fortawesome/free-regular-svg-icons";
import { CommonModule } from "@angular/common";

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  selector: "scholarsome-root",
  templateUrl: "./app.component.html",
  imports: [
    CommonModule,
    RouterOutlet,
    HeaderComponent,
    HeadScriptsComponent,
    FontAwesomeModule
  ]
})
export class AppComponent {
  constructor(
    private router: Router,
    private metaService: Meta,
    private themeService: ThemeService,
    library: FaIconLibrary
  ) {
    library.addIcons(
        faClone,
        faUser,
        faCaretSquareLeft,
        faPlusSquare,
        faTrashCan,
        faArrowAltCircleUp,
        faArrowAltCircleDown,
        faArrowAltCircleLeft,
        faArrowAltCircleRight,
        faCheckSquare,
        faEyeSlash,
        faCircleQuestion,
        faPenToSquare,
        faComments,
        faFlag,
        faRectangleList
    );

    // Apply the stored theme before the app renders to avoid a flash
    this.themeService.initialize();
    // Meta tags are not automatically removed after navigation events
    // This is to manually remove them after every NavigationEnd event
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        if (this.initialNavigation) {
          this.initialNavigation = false;
          return;
        }

        this.metaService.removeTag("name=\"description\"");
      }
    });
  }

  protected initialNavigation = true;
}
