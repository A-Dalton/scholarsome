import { Routes } from "@angular/router";
import { FolderComponent } from "./folder.component";

export const folderRoutes: Routes = [
  {
    path: ":folderId",
    component: FolderComponent
  }
];
