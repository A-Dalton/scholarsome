import { NgModule } from "@angular/core";
import { CardMistakesComponent } from "./card-mistakes.component";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { CardMistakesRoutingModule } from "./card-mistakes-routing.module";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { SharedModule } from "../shared/shared.module";

@NgModule({
  imports: [
    CommonModule,
    CardMistakesRoutingModule,
    FontAwesomeModule,
    FormsModule,
    SharedModule
  ],
  declarations: [CardMistakesComponent]
})
export class CardMistakesModule {}
