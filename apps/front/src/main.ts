import { bootstrapApplication } from "@angular/platform-browser";
import { appConfig } from "./app/app.config";
import { AppComponent } from "./app/app.component";

import Quill from "quill";
import QuillResize from "quill-resize-module";
Quill.register("modules/resize", QuillResize);

bootstrapApplication(AppComponent, appConfig)
    .catch((err) => console.error(err));
