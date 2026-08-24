import { Routes } from "@angular/router";
import { NotfoundComponent } from "./shared/notfound/notfound.component";

export const routes: Routes = [
  {
    path: "",
    loadChildren: () => import("./landing/landing-routing.module").then((m) => m.landingRoutes)
  },
  {
    path: "create",
    loadChildren: () => import("./create/create-routing.module").then((m) => m.createRoutes)
  },
  {
    path: "homepage",
    loadChildren: () => import("./homepage/homepage-routing.module").then((m) => m.homepageRoutes)
  },
  {
    path: "card-mistakes",
    loadChildren: () => import("./card-mistakes/card-mistakes-routing.module").then((m) => m.cardMistakesRoutes)
  },
  {
    path: "study-set",
    loadChildren: () => import("./study-set/study-set-routing.module").then((m) => m.studySetRoutes)
  },
  {
    path: "profile",
    loadChildren: () => import("./profile/profile-routing.module").then((m) => m.profileRoutes)
  },
  {
    path: "settings",
    loadChildren: () => import("./settings/settings-routing.module").then((m) => m.settingsRoutes)
  },
  {
    path: "folder",
    loadChildren: () => import("./folder/folder-routing.module").then((m) => m.folderRoutes)
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
