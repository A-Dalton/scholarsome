import { ChangeDetectionStrategy, Component, ElementRef, Input, OnInit, ViewChild } from "@angular/core";
import { AlertComponent as NgxAlertComponent } from "ngx-bootstrap/alert";

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "scholarsome-alert",
  templateUrl: "./alert.component.html",
  styleUrls: ["./alert.component.css"],
  imports: [NgxAlertComponent]
})
export class AlertComponent implements OnInit {
  @Input() type: string;
  @Input() dismiss: boolean;
  @Input() message: string;
  @Input() spacingClass: string;

  @ViewChild("spacing", { static: true }) spacing: ElementRef;

  ngOnInit(): void {
    if (this.dismiss) {
      setTimeout(() => {
        this.spacing.nativeElement.remove();
      }, 3000);
    }
  }
}
