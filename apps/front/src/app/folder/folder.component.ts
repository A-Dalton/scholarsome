import { ChangeDetectionStrategy, Component, ElementRef, OnInit, ViewChild, signal } from "@angular/core";
import { FoldersService } from "../shared/http/folders.service";
import { Folder } from "@scholarsome/shared";
import { Set, Folder as PrismaFolder } from "@scholarsome/prisma";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { faFolder, faClone, faFolderTree, faPencil, faCancel, faSave, faArrowUp, faTrashCan, faUser } from "@fortawesome/free-solid-svg-icons";
import { UsersService } from "../shared/http/users.service";
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { SetsService } from "../shared/http/sets.service";
import { Meta, Title } from "@angular/platform-browser";
import { CommonModule } from "@angular/common";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "scholarsome-folder",
  templateUrl: "./folder.component.html",
  styleUrls: ["./folder.component.scss"],
  imports: [CommonModule, FontAwesomeModule, RouterLink, ReactiveFormsModule]
})
export class FolderComponent implements OnInit {
  constructor(
    private readonly foldersService: FoldersService,
    private readonly usersService: UsersService,
    private readonly setsService: SetsService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly metaService: Meta,
    private readonly titleService: Title
  ) {}

  @ViewChild("spinner", { static: true }) spinner: ElementRef;

  protected folder = signal<Folder | undefined>(undefined);
  protected folderId: string;
  protected folderPath = signal<{ name: string; id: string; }[]>([]);

  protected subfolders = signal<PrismaFolder[]>([]);
  protected folderSets = signal<Set[]>([]);

  protected username = signal("");
  protected userSets = signal<Set[]>([]);
  protected userFolders = signal<Folder[]>([]);

  protected saveForm = new FormGroup({
    name: new FormControl("", Validators.required),
    description: new FormControl(""),
    color: new FormControl(""),
    private: new FormControl(false),
    parentFolderId: new FormControl(""),
    sets: new FormGroup({}),
    subfolders: new FormGroup({})
  });
  protected saveInProgress = signal(false);

  protected deleteClicked = signal(false);

  protected userIsAuthor = signal(false);
  protected editing = signal(false);
  protected editingLoading = signal(false);
  protected loading = signal(true);

  protected readonly faArrowUp = faArrowUp;
  protected readonly faFolder = faFolder;
  protected readonly faClone = faClone;
  protected readonly faFolderTree = faFolderTree;
  protected readonly faPencil = faPencil;
  protected readonly faCancel = faCancel;
  protected readonly faSave = faSave;
  protected readonly faTrashCan = faTrashCan;
  protected readonly faUser = faUser;

  toggleParentFolderSelection(index: string) {
    if (this.saveForm.disabled) return;
    if (this.isSubfolderSelected(index)) {
      this.toggleSubfolderSelection(index);
    }

    if (this.saveForm.controls.parentFolderId.value === index) {
      this.saveForm.controls.parentFolderId.setValue("");
    } else {
      this.saveForm.controls.parentFolderId.setValue(index);
    }
  }

  toggleSubfolderSelection(index: string) {
    if (this.saveForm.disabled) return;
    if (this.saveForm.controls.parentFolderId.value === index) {
      this.toggleParentFolderSelection(index);
    }

    const folder = this.saveForm.controls.subfolders.get(index);
    if (!folder) return;

    folder.setValue(!folder.value);
  }

  isSubfolderSelected(index: string): boolean {
    const subfolder = this.saveForm.controls.subfolders.get(index);
    if (!subfolder) return false;

    return subfolder.value;
  }

  toggleSetSelection(index: string) {
    if (this.saveForm.disabled) return;

    const set = this.saveForm.controls.sets.get(index);
    if (!set) return;

    set.setValue(!set.value);
  }

  isSetSelected(index: string): boolean {
    const set = this.saveForm.controls.sets.get(index);
    if (!set) return false;

    return set.value;
  }

  async delete() {
    await this.foldersService.deleteFolder(this.folder()!.id);
    await this.router.navigate(["homepage"]);
  }

  async save() {
    if (this.saveForm.invalid) {
      this.saveForm.markAllAsTouched();
      return;
    }

    this.saveForm.disable();
    this.saveInProgress.set(true);
    this.deleteClicked.set(false);

    const selectedSets: string[] = [];
    const selectedSubfolders: string[] = [];

    const sets = this.saveForm.controls.sets.controls as { [key: string]: AbstractControl };

    Object.keys(sets).forEach((set) => {
      if (sets[set].value) selectedSets.push(set);
    });

    const subfolders = this.saveForm.controls.subfolders.controls as { [key: string]: AbstractControl };

    Object.keys(subfolders).forEach((subfolder) => {
      if (subfolders[subfolder].value) selectedSubfolders.push(subfolder);
    });

    // we know that these are valid
    /* eslint-disable */
    await this.foldersService.updateFolder({
      id: this.folder()!.id,
      name: this.saveForm.controls.name.value!,
      description: this.saveForm.controls.description.value!,
      color: this.saveForm.controls.color.value!,
      private: this.saveForm.controls.private.value!,
      parentFolderId: this.saveForm.controls.parentFolderId.value!,
      subfolders: selectedSubfolders,
      sets: selectedSets
    });
    /* eslint-enable */

    await this.view();
    this.saveForm.enable();
  }

  async edit() {
    this.editing.set(true);
    this.editingLoading.set(true);

    const userSetsValue = await this.setsService.mySets();
    const userFoldersValue = await this.foldersService.myFolders();

    this.saveForm.controls.name.setValue(this.folder()!.name);
    this.saveForm.controls.description.setValue(this.folder()!.description);
    this.saveForm.controls.color.setValue(this.folder()!.color);
    this.saveForm.controls.private.setValue(this.folder()!.private);
    this.saveForm.controls.parentFolderId.setValue(this.folder()!.parentFolderId ? this.folder()!.parentFolderId : "");

    this.editingLoading.set(false);

    if (userSetsValue && userSetsValue.length > 0) {
      this.userSets.set(userSetsValue);

      const formUserSets = new FormGroup({});

      for (const set of this.userSets()) {
        formUserSets.addControl(
            set.id,
            new FormControl(this.folderSets().some((s) => s.id === set.id))
        );
      }

      this.saveForm.setControl("sets", formUserSets);
    }

    if (userFoldersValue && userFoldersValue.length > 0) {
      this.userFolders.set(userFoldersValue.filter((f) => f.id !== this.folder()!.id));

      const formUserFolders = new FormGroup({});

      for (const folder of this.userFolders()) {
        if (folder.id === this.folder()!.id) continue;

        formUserFolders.addControl(
            folder.id,
            new FormControl(this.subfolders().some((f) => f.id === folder.id))
        );
      }

      this.saveForm.setControl("subfolders", formUserFolders);
    }
  }

  async view() {
    this.deleteClicked.set(false);

    const folder = await this.foldersService.folder(this.folderId);
    if (!folder) {
      this.router.navigate(["404"]);
      return;
    }

    this.folder.set(folder);
    this.folder()!.sets = this.folder()!.sets.map((f) => {
      return { ...f, updatedAt: new Date(f.updatedAt) };
    });

    const user = await this.usersService.myUser();

    const folderPath = [];

    if (user && folder.authorId === user.id) {
      this.userIsAuthor.set(true);
    }

    let parentFolderId = folder.parentFolderId;

    folderPath.push({
      name: folder.name,
      id: folder.id
    });

    while (parentFolderId) {
      const parentFolder = await this.foldersService.folder(parentFolderId);

      if (parentFolder) {
        folderPath.push({
          name: parentFolder.name,
          id: parentFolder.id
        });

        parentFolderId = parentFolder.parentFolderId;
      } else {
        parentFolderId = "";
      }
    }

    this.folderPath.set(folderPath.reverse());

    this.editing.set(false);
    this.saveInProgress.set(false);
    this.userFolders.set([]);
    this.userSets.set([]);

    this.folderSets.set(folder.sets);
    this.subfolders.set(folder.subfolders);
  }

  async ngOnInit() {
    const folderId = this.route.snapshot.paramMap.get("folderId");
    if (!folderId) {
      this.router.navigate(["404"]);
      return;
    }

    this.folderId = folderId;

    await this.view();

    this.username.set(this.folder()!.author.username);

    // for when someone clicks on a folder from within another folder
    // we need to manually trigger the change in the page
    this.route.url.subscribe(async () => {
      if (this.router.getCurrentNavigation()?.previousNavigation) {
        this.loading.set(true);

        const folderId = this.route.snapshot.paramMap.get("folderId");
        if (!folderId) {
          await this.router.navigate(["404"]);
          return;
        }

        this.folderId = folderId;
        this.username.set(this.folder()!.author.username);

        await this.view();

        this.titleService.setTitle(this.folder()!.name + " Folder — Scholarsome");
        this.metaService.addTag({ name: "description", content: "Study using the sets inside the " + this.folder()!.name + " folder on Scholarsome." });

        this.loading.set(false);
      }
    });

    this.titleService.setTitle(this.folder()!.name + " Folder — Scholarsome");
    this.metaService.addTag({ name: "description", content: "Study using the sets inside the " + this.folder()!.name + " folder on Scholarsome." });

    this.loading.set(false);
  }
}
