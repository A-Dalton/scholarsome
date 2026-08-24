import { Routes } from "@angular/router";
import { CreateStudySetComponent } from "./study-set/create-study-set.component";
import { AuthGuardService } from "../auth/auth-guard.service";
import { CreateFolderComponent } from "./create-folder/create-folder.component";

export const createRoutes: Routes = [
  {
    path: "set",
    component: CreateStudySetComponent,
    canActivate: [AuthGuardService]
  },
  {
    path: "folder",
    component: CreateFolderComponent,
    canActivate: [AuthGuardService]
  }
];
