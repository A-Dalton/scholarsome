import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { lastValueFrom, Subject } from "rxjs";
// eslint-disable-next-line @nx/enforce-module-boundaries
import packageJson from "../../../../../package.json";

@Injectable({
  providedIn: "root"
})
export class SharedService {
  constructor(private readonly http: HttpClient) {
    this.releaseCheckRes = lastValueFrom(this.http.get("https://api.github.com/repos/A-Dalton/scholarsome/releases"));
    this.starsRes = lastValueFrom(this.http.get("https://api.github.com/repos/A-Dalton/scholarsome"));
  }

  public avatarUpdateEvent = new Subject<void>();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly releaseCheckRes: Promise<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly starsRes: Promise<any>;

  async isUpdateAvailable(): Promise<boolean> {
    const latestRelease = (await this.releaseCheckRes)[0]["name"];
    // Only report an update if the latest release is strictly newer than the local version
    return this.compareVersions(latestRelease, packageJson.version) > 0;
  }

  private compareVersions(a: string, b: string): number {
    const parse = (s: string): number[] => {
      const cleaned = s.replace(/^v/i, "");
      const parts = cleaned.split(".");
      return parts.filter((p) => p.length > 0).map((p) => parseInt(p, 10) || 0);
    };

    const aParts = parse(a);
    const bParts = parse(b);
    const maxLength = Math.max(aParts.length, bParts.length);

    for (let i = 0; i < maxLength; i++) {
      const aNum = aParts[i] ?? 0;
      const bNum = bParts[i] ?? 0;
      if (aNum > bNum) return 1;
      if (aNum < bNum) return -1;
    }

    return 0;
  }

  async getReleaseUrl(): Promise<string> {
    return (await this.releaseCheckRes)[0]["html_url"];
  }

  async getStargazers(): Promise<number> {
    return (await this.starsRes)["stargazers_count"];
  }
}
