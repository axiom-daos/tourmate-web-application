import { Component, inject } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { NgClass } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { IncidentStore } from '../../../application/incident.store';
import { Incident } from '../../../domain/model/aggregates/incident.entity';
import { IncidentStatus } from '../../../domain/model/value-object/incident-status';

/**
 * Creates and edits incident entities with live guided emergency protocols.
 */
@Component({
  selector: 'app-incident-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatInputModule,
    MatIconModule,
    TranslatePipe,
    RouterLink,
    NgClass,
  ],
  templateUrl: './incident-form.html',
  styleUrl: './incident-form.css',
})
export class IncidentForm {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private store = inject(IncidentStore);

  public form = this.fb.group({
    activeTourId: new FormControl<number>(1, {
      nonNullable: true,
      validators: [Validators.required],
    }),
    reportedByUserId: new FormControl<number>(1, {
      nonNullable: true,
      validators: [Validators.required],
    }),
    description: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    latitude: new FormControl<number>(0, { nonNullable: true, validators: [Validators.required] }),
    longitude: new FormControl<number>(0, { nonNullable: true, validators: [Validators.required] }),
    reportedAt: new FormControl<string>(this.toLocalDateTime(new Date().toISOString()), {
      nonNullable: true,
      validators: [Validators.required],
    }),
    status: new FormControl<string>(IncidentStatus.OPEN, {
      nonNullable: true,
      validators: [Validators.required],
    }),
    severity: new FormControl<string>('HIGH', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  public statuses: string[] = Object.values(IncidentStatus);
  public readonly severities: string[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  public activeProtocols: string[] = [];
  public currentSeverity: string = 'HIGH';

  public isEdit = false;
  public incidentId: number | null = null;

  constructor() {
    this.form.get('severity')?.valueChanges.subscribe((val) => {
      if (val) {
        this.currentSeverity = val;
        this.updateProtocols(val);
      }
    });

    this.route.params.subscribe((params) => {
      this.incidentId = params['id'] ? +params['id'] : null;
      this.isEdit = !!this.incidentId;
      if (this.isEdit && this.incidentId) {
        const id = this.incidentId;
        const incident = this.store.getIncidentById(id)();
        if (incident) {
          this.form.patchValue({
            activeTourId: incident.activeTourId,
            reportedByUserId: incident.reportedByUserId,
            description: incident.description,
            latitude: incident.latitude,
            longitude: incident.longitude,
            reportedAt: this.toLocalDateTime(incident.reportedAt),
            status: incident.status,
            severity: incident.severity ?? 'HIGH',
          });
          this.currentSeverity = incident.severity ?? 'HIGH';
          this.updateProtocols(this.currentSeverity);
        }
      } else {
        this.updateProtocols(this.currentSeverity);
      }
    });
  }

  private updateProtocols(severity: string) {
    const protocolCount = severity === 'CRITICAL' || severity === 'HIGH' ? 3 : 2;
    this.activeProtocols = Array.from(
      { length: protocolCount },
      (_, index) => `incidents.protocols.${severity.toLowerCase()}.${index + 1}`,
    );
  }

  public submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formValues = this.form.value;
    const reportedAt = formValues.reportedAt
      ? new Date(formValues.reportedAt).toISOString()
      : new Date().toISOString();

    const incident: Incident = new Incident({
      id: this.incidentId ?? 0,
      activeTourId: Number(formValues.activeTourId ?? 1),
      reportedByUserId: Number(formValues.reportedByUserId ?? 1),
      description: formValues.description ?? '',
      latitude: Number(formValues.latitude ?? 0),
      longitude: Number(formValues.longitude ?? 0),
      reportedAt: reportedAt,
      status: (formValues.status as IncidentStatus) ?? IncidentStatus.OPEN,
      severity: formValues.severity ?? 'HIGH',
      isSynced: false,
    });

    if (this.isEdit) {
      this.store.updateIncident(incident);
    } else {
      this.store.addIncident(incident);
    }

    this.router.navigate(['/safety-and-incident-management/incidents']).then((success) => {
      if (!success) {
        console.warn('Navigation to incident list failed.');
      }
    });
  }

  private toLocalDateTime(value: string): string {
    const date = new Date(value);
    const offset = date.getTimezoneOffset();
    return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16);
  }
}
