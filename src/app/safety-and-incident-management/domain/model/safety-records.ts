export type SafetyAlertType =
  | 'ROUTE_DEVIATION'
  | 'COMMUNICATION_LOST'
  | 'HEALTH_CRITICAL'
  | 'INCIDENT';

export type SafetyAlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface LocationReport {
  id: string | number;
  incidentId?: number;
  expeditionId: number;
  touristId: number;
  latitude: number;
  longitude: number;
  recordedAt: string;
  expectedLatitude?: number;
  expectedLongitude?: number;
}

export interface SafetyAlert {
  id: string | number;
  incidentId?: number;
  expeditionId: number;
  touristId: number;
  type: SafetyAlertType;
  severity: SafetyAlertSeverity;
  message: string;
  createdAt: string;
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
  sourceRecordId?: string | number;
}

export interface TelemetryRecord {
  id: string | number;
  incidentId?: number;
  expeditionId: number;
  touristId: number;
  wearableId: string;
  heartRate: number;
  bloodOxygen: number;
  batteryLevel: number;
  connectivity: 'CONNECTED' | 'DISCONNECTED';
  recordedAt: string;
}

export interface WearableRecord {
  id: string | number;
  incidentId?: number;
  deviceId: string;
  touristId: number;
  batteryLevel: number;
  connectivity: 'CONNECTED' | 'DISCONNECTED';
  lastSyncAt: string;
  activeExpeditionId?: number | null;
}

export type NewLocationReport = Omit<LocationReport, 'id'>;
export type NewSafetyAlert = Omit<SafetyAlert, 'id'>;
export type NewTelemetryRecord = Omit<TelemetryRecord, 'id'>;
export type NewWearableRecord = Omit<WearableRecord, 'id'>;
