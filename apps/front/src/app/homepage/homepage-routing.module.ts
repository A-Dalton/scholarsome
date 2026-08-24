import { Routes } from "@angular/router";
import { HomepageComponent } from "./homepage.component";
import { AuthGuardService } from "../auth/auth-guard.service";

export const homepageRoutes: Routes = [
  {
    path: "",
    component: HomepageComponent,
    canActivate: [AuthGuardService]
  }
];
