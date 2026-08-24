import { bootstrapApplication } from "@angular/platform-browser";
import { appConfig } from "./app/app.config";
import { AppComponent } from "./app/app.component";

import Quill from "quill";
import QuillResize from "quill-resize-module";
Quill.register("modules/resize", QuillResize);

// Load Bootstrap JS as an ES module instead of a global script tag.
import "bootstrap/dist/js/bootstrap.esm.js";

// KaTeX is required as a global by Quill's formula module. Import it as an ES
// module and expose it on `window` rather than loading a global script tag.
import katex from "katex";
(window as { katex?: unknown }).katex = katex;

bootstrapApplication(AppComponent, appConfig)
    .catch((err) => console.error(err));
