import { Routes } from "@angular/router";
import { NotfoundComponent } from "./shared/notfound/notfound.component";

export const routes: Routes = [
  {
    path: "",
    loadChildren: () => import("./landing/landing.module").then((m) => m.LandingModule)
  },
  {
    path: "create",
    loadChildren: () => import("./create/create.module").then((m) => m.CreateModule)
  },
  {
    path: "homepage",
    loadChildren: () => import("./homepage/homepage.module").then((m) => m.HomepageModule)
  },
  {
    path: "card-mistakes",
    loadChildren: () => import("./card-mistakes/card-mistakes.module").then((m) => m.CardMistakesModule)
  },
  {
    path: "study-set",
    loadChildren: () => import("./study-set/study-set.module").then((m) => m.StudySetModule)
  },
  {
    path: "profile",
    loadChildren: () => import("./profile/profile.module").then((m) => m.ProfileModule)
  },
  {
    path: "settings",
    loadChildren: () => import("./settings/settings.module").then((m) => m.SettingsModule)
  },
  {
    path: "folder",
    loadChildren: () => import("./folder/folder.module").then((m) => m.FolderModule)
  },
  {
    path: "404",
    component: NotfoundComponent
  },
  {
    path: "**",
    pathMatch: "full",
    redirectTo: "404"
  }
];
