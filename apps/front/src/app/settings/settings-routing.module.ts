import { Routes } from "@angular/router";
import { SettingsComponent } from "./settings.component";
import { AuthGuardService } from "../auth/auth-guard.service";

export const settingsRoutes: Routes = [
  {
    path: "",
    component: SettingsComponent,
    canActivate: [AuthGuardService]
  }
];
