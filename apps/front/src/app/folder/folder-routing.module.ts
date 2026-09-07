import { Routes } from "@angular/router";
import { FolderComponent } from "./folder.component";
import { SrsReviewComponent } from "./srs-review/srs-review.component";

export const folderRoutes: Routes = [
  {
    path: ":folderId",
    children: [
      {
        path: "",
        component: FolderComponent
      },
      {
        path: "review",
        component: SrsReviewComponent
      }
    ]
  }
];
