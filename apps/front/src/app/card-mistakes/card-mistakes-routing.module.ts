import { RouterModule, Routes } from "@angular/router";
import { NgModule } from "@angular/core";
import { CardMistakesComponent } from "./card-mistakes.component";
import { AuthGuardService } from "../auth/auth-guard.service";

const routes: Routes = [
  {
    path: "",
    component: CardMistakesComponent,
    canActivate: [AuthGuardService]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CardMistakesRoutingModule {}
