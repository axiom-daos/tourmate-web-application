import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { TourMonitoringStore } from '../../../application/tour-monitoring.store';
import { Participant } from '../../../domain/model/participant.entity';
import { UserRole } from '../../../../iam/domain/model/value-object/user-role';

@Component({
  selector: 'app-live-monitoring',
  imports: [DatePipe, MatButtonModule, MatIconModule, MatProgressSpinnerModule, RouterLink, TranslatePipe],
  templateUrl: './live-monitoring.html',
  styleUrl: './live-monitoring.css',
})
export class LiveMonitoring {
  protected readonly store = inject(TourMonitoringStore);
  private readonly translate = inject(TranslateService);
  protected readonly search = signal('');
  protected readonly zoom = signal(1);
  protected readonly selectedParticipantUserId = signal<number | null>(null);
  protected readonly availableTourists = computed(() => {
    const assignedUserIds = new Set(this.store.participantsForTour().map(participant => participant.userId));
    return this.store.users().filter(
      user => user.role === UserRole.TOURIST && !assignedUserIds.has(user.id),
    );
  });

  protected readonly filteredParticipants = computed(() => {
    const query = this.search().trim().toLocaleLowerCase();
    if (!query) return this.store.participantCards();
    return this.store
      .participantCards()
      .filter((participant) => participant.displayName.toLocaleLowerCase().includes(query));
  });

  protected selectExpedition(event: Event): void {
    const select = event.target;
    if (select instanceof HTMLSelectElement && select.value) {
      this.store.selectActiveTour(Number(select.value));
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

  protected coordinates(latitude: number, longitude: number): string {
    return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
  }
}
