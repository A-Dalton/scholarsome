import { Routes } from "@angular/router";
import { AuthGuardService } from "../auth/auth-guard.service";
import { HomepageComponent } from "../homepage/homepage.component";
import { StudySetFlashcardsComponent } from "./study-set-flashcards/study-set-flashcards.component";
import { StudySetQuizComponent } from "./study-set-quiz/study-set-quiz.component";
import { StudySetComponent } from "./study-set.component";

export const studySetRoutes: Routes = [
  {
    path: "",
    component: HomepageComponent,
    canActivate: [AuthGuardService]
  },
  {
    path: ":setId",
    component: StudySetComponent
  },
  {
    path: ":setId/flashcards",
    component: StudySetFlashcardsComponent
  },
  {
    path: ":setId/quiz",
    component: StudySetQuizComponent
  }
];
