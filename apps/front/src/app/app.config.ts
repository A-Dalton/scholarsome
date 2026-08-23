import { ApplicationConfig, provideZonelessChangeDetection } from "@angular/core";
import { provideHttpClient } from "@angular/common/http";
import { provideRouter, withPreloading } from "@angular/router";
import { provideAnimations } from "@angular/platform-browser/animations";
import { PreloadAllModules } from "@angular/router";
import { provideQuillConfig } from "ngx-quill";
import { ReCaptchaV3Service, RecaptchaLoaderService, RECAPTCHA_V3_SITE_KEY } from "ng-recaptcha";
import { routes } from "./app-routing.module";

const quillConfig = {
  modules: {
    resize: true,
    keyboard: {
      bindings: {
        tab: {
          key: 9,
          handler: () => {
            const editors = document.querySelectorAll("quill-editor");

            const buttons = [
              ...Array.from(editors[0].querySelectorAll("button")),
              ...Array.from(editors[0].querySelectorAll("[role=\"button\"]")),
              ...Array.from(editors[1].querySelectorAll("button")),
              ...Array.from(editors[1].querySelectorAll("[role=\"button\"]"))
            ];

            for (const button of buttons) {
              button.setAttribute("tabindex", "-1");
            }

            return true;
          }
        }
      }
    },
    toolbar: [
      ["bold", "italic", "underline", "strike"],
      ["code-block", "formula"],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ header: 1 }, { header: 2 }],
      [{ color: [] }, { background: [] }],
      [{ script: "sub" }, { script: "super" }],
      ["link", "image"],
      ["clean"]
    ]
  }
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideHttpClient(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideAnimations(),
    provideQuillConfig(quillConfig),
    {
      provide: RECAPTCHA_V3_SITE_KEY,
      useValue: import.meta.env.SCHOLARSOME_RECAPTCHA_SITE
    },
    ReCaptchaV3Service,
    RecaptchaLoaderService
  ]
};
