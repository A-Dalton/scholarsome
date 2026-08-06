import { NgModule } from "@angular/core";
import { CardMistakesComponent } from "./card-mistakes.component";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { CardMistakesRoutingModule } from "./card-mistakes-routing.module";
import { CommonModule } from "@angular/common";

@NgModule({
  imports: [
    CommonModule,
    CardMistakesRoutingModule,
    FontAwesomeModule
  ],
  declarations: [CardMistakesComponent]
})
export class CardMistakesModule {}
