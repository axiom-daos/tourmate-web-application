import { Component, inject } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { TranslatePipe } from '@ngx-translate/core';
import { IncidentStore } from '../../../application/incident.store';
import { Incident } from '../../../domain/model/aggregates/incident.entity';
import { IncidentStatus } from '../../../domain/model/value-object/incident-status';

/**
 * Creates and edits incident entities.
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
    RouterLink,
    TranslatePipe,
  ],
  templateUrl: './incident-form.html',
  styleUrl: './incident-form.css',
})
export class IncidentForm {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private store = inject(IncidentStore);

  form = this.fb.group({
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
    reportedAt: new FormControl<string>(new Date().toISOString(), {
      nonNullable: true,
      validators: [Validators.required],
    }),
    status: new FormControl<string>(IncidentStatus.OPEN, {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  statuses = Object.values(IncidentStatus);
  isEdit = false;
  incidentId: number | null = null;

  constructor() {
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
            reportedAt: incident.reportedAt,
            status: incident.status,
          });
        }
      }
    });
  }

  submit() {
    if (this.form.invalid) return;
    const incident: Incident = new Incident({
      id: this.incidentId ?? 0,
      activeTourId: this.form.value.activeTourId!,
      reportedByUserId: this.form.value.reportedByUserId!,
      description: this.form.value.description!,
      latitude: this.form.value.latitude!,
      longitude: this.form.value.longitude!,
      reportedAt: this.form.value.reportedAt!,
      status: this.form.value.status!,
    });

    if (this.isEdit) {
      this.store.updateIncident(incident);
    } else {
      this.store.addIncident(incident);
    }

    this.router.navigate(['safety-and-incident-management/incidents']).then();
  }
}
