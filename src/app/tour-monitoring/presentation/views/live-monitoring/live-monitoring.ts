import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TourMonitoringStore } from '../../../application/tour-monitoring.store';
import { Participant } from '../../../domain/model/participant.entity';
import { UserRole } from '../../../../iam/domain/model/value-object/user-role';
import { FinishExpeditionDialog } from './finish-expedition-dialog';
import { ActiveTour } from '../../../domain/model/active-tour.entity';

@Component({
  selector: 'app-live-monitoring',
  imports: [DatePipe, FormsModule, MatButtonModule, MatDialogModule, MatIconModule, MatProgressSpinnerModule, RouterLink, TranslatePipe],
  templateUrl: './live-monitoring.html',
  styleUrl: './live-monitoring.css',
})
export class LiveMonitoring {
  protected readonly store = inject(TourMonitoringStore);
  private readonly route = inject(ActivatedRoute);
  private readonly translate = inject(TranslateService);
  private readonly dialog = inject(MatDialog);
  protected readonly search = signal('');
  protected readonly zoom = signal(1);
  protected readonly selectedParticipantUserId = signal<number | null>(null);
  protected readonly availableTourists = computed(() => {
    const assignedUserIds = new Set(this.store.participantsForTour().map(participant => participant.userId));
    return this.store.users().filter(
      user => user.role === UserRole.TOURIST && !assignedUserIds.has(user.id),
    );
  });

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe(params => {
      const idParam = params.get('id');
      const id = idParam === null ? null : Number(idParam);
      this.store.selectActiveTour(id !== null && Number.isInteger(id) && id > 0 ? id : null);
    });
  }

  protected readonly filteredParticipants = computed(() => {
    const query = this.search().trim().toLocaleLowerCase();
    if (!query) return this.store.participantCards();
    return this.store
      .participantCards()
      .filter((participant) => participant.displayName.toLocaleLowerCase().includes(query));
  });

  protected selectExpedition(value: number | string): void {
    const id = Number(value);
    if (Number.isInteger(id) && id > 0) {
      this.store.selectActiveTour(id);
    }
  }

  protected zoomIn(): void {
    this.zoom.update((value) => Math.min(value + 0.2, 2));
  }

  protected zoomOut(): void {
    this.zoom.update((value) => Math.max(value - 0.2, 1));
  }

  protected updateSearch(event: Event): void {
    const input = event.target;
    if (input instanceof HTMLInputElement) {
      this.search.set(input.value);
    }
  }

  protected selectParticipant(event: Event): void {
    const select = event.target;
    if (select instanceof HTMLSelectElement) {
      const userId = Number(select.value);
      this.selectedParticipantUserId.set(Number.isInteger(userId) && userId > 0 ? userId : null);
    }
  }

  protected addParticipant(): void {
    const tourScheduleId = this.store.selectedActiveTour()?.tourScheduleId;
    const userId = this.selectedParticipantUserId();
    if (!tourScheduleId || !userId || this.store.loading()) return;

    this.store.addParticipant(new Participant({
      id: 0,
      userId,
      joinedAt: new Date().toISOString(),
      tourScheduleId,
    }));
    this.selectedParticipantUserId.set(null);
  }

  protected removeParticipant(participantId: number, participantName: string): void {
    const confirmation = this.translate.instant('liveMonitoring.remove_participant_confirmation', {
      name: participantName,
    });
    if (this.store.loading() || !window.confirm(confirmation)) return;
    this.store.deleteParticipant(participantId);
  }

  protected confirmFinishExpedition(expedition: ActiveTour): void {
    if (expedition.status !== 'IN_PROGRESS' || this.store.loading()) return;

    this.dialog.open(FinishExpeditionDialog, {
      width: 'min(440px, calc(100vw - 32px))',
      maxWidth: '100vw',
      autoFocus: 'first-tabbable',
      restoreFocus: true,
      role: 'alertdialog',
      ariaLabelledBy: 'finish-expedition-title',
      data: {
        tourTitle: this.store.selectedTour()?.details.title ?? '',
        guideName: this.store.guideName() ?? '',
      },
    }).afterClosed().pipe(takeUntilDestroyed()).subscribe(confirmed => {
      if (!confirmed || this.store.loading()) return;

      const finishedExpedition = new ActiveTour({
        id: expedition.id,
        tourScheduleId: expedition.tourScheduleId,
        guideId: expedition.guideId,
        status: 'FINISHED',
        currentLatitude: expedition.currentLatitude,
        currentLongitude: expedition.currentLongitude,
        startedAt: expedition.startedAt,
        finishedAt: new Date().toISOString(),
        tourSchedule: expedition.tourSchedule,
        guide: expedition.guide,
      });
      this.store.updateActiveTour(finishedExpedition);
    });
  }

  protected coordinates(latitude: number, longitude: number): string {
    return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
  }
}
