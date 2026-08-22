import { NgModule } from "@angular/core";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { RouterLinkWithHref } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { AlertComponent } from "./alert/alert.component";
import { AlertModule } from "ngx-bootstrap/alert";
import { RECAPTCHA_V3_SITE_KEY, RecaptchaV3Module } from "ng-recaptcha";
import { CardComponent } from "./card/card.component";
import { CommonModule } from "@angular/common";
import { QuillEditorComponent } from "ngx-quill";

@NgModule({
  imports: [
    FontAwesomeModule,
    RouterLinkWithHref,
    FormsModule,
    AlertModule,
    CommonModule,
    RecaptchaV3Module,
    QuillEditorComponent
  ],
  providers: [
    {
      provide: RECAPTCHA_V3_SITE_KEY,
      useValue: import.meta.env.SCHOLARSOME_RECAPTCHA_SITE
    }
  ],
  declarations: [
    AlertComponent,
    CardComponent
  ],
  exports: [AlertComponent, CardComponent]
})
export class SharedModule {}
