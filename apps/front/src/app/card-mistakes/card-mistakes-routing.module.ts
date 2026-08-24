import { Routes } from "@angular/router";
import { CardMistakesComponent } from "./card-mistakes.component";
import { AuthGuardService } from "../auth/auth-guard.service";

export const cardMistakesRoutes: Routes = [
  {
    path: "",
    component: CardMistakesComponent,
    canActivate: [AuthGuardService]
  }
];
