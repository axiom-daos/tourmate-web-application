import {Component, inject, signal} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {TranslatePipe} from '@ngx-translate/core';

export interface FinishExpeditionDialogData {
  tourTitle: string;
  guideName: string;
}

@Component({
  selector: 'app-finish-expedition-dialog',
  imports: [MatButtonModule, MatDialogModule, MatIconModule, TranslatePipe],
  templateUrl: './finish-expedition-dialog.html',
  styleUrl: './finish-expedition-dialog.css',
})
export class FinishExpeditionDialog {
  protected readonly data = inject<FinishExpeditionDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<FinishExpeditionDialog, boolean>);
  protected readonly step = signal<1 | 2>(1);
  protected readonly acknowledged = signal(false);

  protected continueToFinalConfirmation(): void {
    this.step.set(2);
  }

  protected updateAcknowledgement(event: Event): void {
    const checkbox = event.target;
    if (checkbox instanceof HTMLInputElement) {
      this.acknowledged.set(checkbox.checked);
    }
  }

  protected finish(): void {
    if (this.step() === 2 && this.acknowledged()) {
      this.dialogRef.close(true);
    }
  }

  protected cancel(): void {
    this.dialogRef.close(false);
  }
}
