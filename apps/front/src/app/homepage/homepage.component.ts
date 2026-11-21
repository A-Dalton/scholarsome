import { ChangeDetectionStrategy, Component, ElementRef, OnInit, ViewChild, signal } from "@angular/core";
import { User } from "@scholarsome/shared";
import { Meta, Title } from "@angular/platform-browser";
import { Router } from "@angular/router";
import { NgTemplateOutlet } from "@angular/common";
import { UsersService } from "../shared/http/users.service";
import { faPlus, faClone, faFolder, faBolt, faChevronDown, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { CommonModule } from "@angular/common";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { RouterLink } from "@angular/router";

/**
 * Node of the folder tree used to select a folder to review
 */
interface FolderTreeNode {
  id: string;
  name: string;
  color: string;
  children: FolderTreeNode[];
}

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "scholarsome-view",
  templateUrl: "./homepage.component.html",
  styleUrls: ["./homepage.component.scss"],
  imports: [CommonModule, FontAwesomeModule, RouterLink, NgTemplateOutlet]
})
export class HomepageComponent implements OnInit {
  constructor(
    private readonly usersService: UsersService,
    private readonly router: Router,
    private readonly titleService: Title,
    private readonly metaService: Meta
  ) {
    this.titleService.setTitle("Homepage — Scholarsome");
    this.metaService.addTag({ name: "description", content: "Scholarsome is the way studying was meant to be. No monthly fees or upsells to get between you and your study tools. Just flashcards." });
  }

  @ViewChild("container", { static: true }) container: ElementRef;
  @ViewChild("spinner", { static: true }) spinner: ElementRef;

  user = signal<User | undefined>(undefined);

  // Hierarchical tree of all of the user's folders, including subfolders,
  // from which a folder to review can be selected
  protected folderTree = signal<FolderTreeNode[]>([]);
  // Whether the folder tree is shown below the review cards
  protected folderTreeVisible = signal(false);
  // IDs of the folders that are expanded within the tree
  private expandedFolderIds = signal<Set<string>>(new Set());
  // ID of the folder selected within the tree
  protected selectedFolderId = signal<string | null>(null);
  // IDs of the selected folder and all of its subfolders, highlighted within
  // the tree to show that they are included in the review
  private selectedFolderIds = signal<Set<string>>(new Set());

  protected readonly faClone = faClone;
  protected readonly faFolder = faFolder;
  protected readonly faPlus = faPlus;
  protected readonly faBolt = faBolt;
  protected readonly faChevronDown = faChevronDown;
  protected readonly faChevronRight = faChevronRight;

  /**
   * Shows or hides the folder tree used to select a folder to review
   */
  toggleFolderTree(): void {
    this.folderTreeVisible.update((visible) => !visible);
  }

  /**
   * Expands or collapses the subfolders of a folder within the tree
   *
   * @param node Folder to expand or collapse
   */
  toggleFolderExpanded(node: FolderTreeNode): void {
    this.expandedFolderIds.update((ids) => {
      const next = new Set(ids);
      if (next.has(node.id)) {
        next.delete(node.id);
      } else {
        next.add(node.id);
      }
      return next;
    });
  }

  /**
   * Whether the subfolders of a folder are currently expanded within the tree
   *
   * @param node Folder to check
   */
  isFolderExpanded(node: FolderTreeNode): boolean {
    return this.expandedFolderIds().has(node.id);
  }

  /**
   * Whether a folder is currently selected within the tree. All subfolders of
   * the selected folder are shown as selected as well, since they are also
   * included in the review
   *
   * @param node Folder to check
   */
  isFolderSelected(node: FolderTreeNode): boolean {
    return this.selectedFolderIds().has(node.id);
  }

  /**
   * Selects a folder within the tree. All of its subfolders are shown as
   * selected as well, since they are also included in the review
   *
   * @param node Folder to select
   */
  selectFolder(node: FolderTreeNode): void {
    this.selectedFolderId.set(node.id);

    const ids = new Set<string>();
    const collectIds = (treeNode: FolderTreeNode): void => {
      ids.add(treeNode.id);
      for (const child of treeNode.children) collectIds(child);
    };
    collectIds(node);

    this.selectedFolderIds.set(ids);
  }

  /**
   * Navigates to the SRS review of the folder selected within the tree,
   * which includes the cards of all of its subfolders
   */
  reviewSelectedFolder(): void {
    const folderId = this.selectedFolderId();
    if (!folderId) return;

    void this.router.navigate(["/folder", folderId, "review"]);
  }

  /**
   * Builds a hierarchical tree of the given folders. Folders whose parent
   * is missing or whose parent chain is cyclic are treated as top-level
   * folders to keep the tree renderable regardless of the stored data
   *
   * @param folders Folders to build the tree from
   */
  private buildFolderTree(folders: User["folders"]): FolderTreeNode[] {
    const nodesById = new Map<string, FolderTreeNode>();
    const parentIds = new Map<string, string | null>();

    for (const folder of folders) {
      nodesById.set(folder.id, {
        id: folder.id,
        name: folder.name,
        color: folder.color,
        children: []
      });
      parentIds.set(folder.id, folder.parentFolderId);
    }

    // determines whether walking up the parent chain of a folder terminates
    const hasTerminatingParentChain = (folderId: string): boolean => {
      const visited = new Set<string>([folderId]);
      let parentId = parentIds.get(folderId) ?? null;

      while (parentId) {
        if (!nodesById.has(parentId) || visited.has(parentId)) return false;
        visited.add(parentId);
        parentId = parentIds.get(parentId) ?? null;
      }

      return true;
    };

    const roots: FolderTreeNode[] = [];
    for (const folder of folders) {
      const node = nodesById.get(folder.id);
      if (!node) continue;

      const parent = folder.parentFolderId ? nodesById.get(folder.parentFolderId) : undefined;

      if (parent && hasTerminatingParentChain(folder.id)) {
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    }

    const sortNodes = (treeNodes: FolderTreeNode[]): void => {
      treeNodes.sort((a, b) => a.name.localeCompare(b.name));
      for (const treeNode of treeNodes) sortNodes(treeNode.children);
    };
    sortNodes(roots);

    return roots;
  }

  async ngOnInit(): Promise<void> {
    const user = await this.usersService.myUser();
    if (user) {
      user.sets.forEach((s) => {
        s.updatedAt = new Date(s.updatedAt);
      });
      user.sets = user.sets.sort((a, b) => {
        return new Date(b.updatedAt).valueOf() - new Date(a.updatedAt).valueOf();
      });

      this.folderTree.set(this.buildFolderTree(user.folders));

      user.folders = user.folders
          .sort((a, b) => {
            return new Date(b.updatedAt).valueOf() - new Date(a.updatedAt).valueOf();
          })
          .filter((f) => !f.parentFolderId);
    }

    this.user.set(user ?? undefined);

    this.spinner.nativeElement.remove();
    this.container.nativeElement.removeAttribute("hidden");
  }
}
