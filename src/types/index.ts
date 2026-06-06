export type TaskStatus =
  | 'pending'
  | 'preprocessing'
  | 'meshing'
  | 'calculating'
  | 'routing'
  | 'completed'
  | 'error';

export type AlertLevel = 'blue' | 'yellow' | 'orange' | 'red';

export type ApprovalStatus =
  | 'draft'
  | 'engineer_pending'
  | 'engineer_approved'
  | 'chief_pending'
  | 'approved'
  | 'rejected';

export type UserRole =
  | 'hydrologist'
  | 'engineer'
  | 'chief'
  | 'commander'
  | 'scientist'
  | 'admin';

export type FileType = 'dem' | 'soil' | 'rainfall';

export interface TimeSeriesPoint {
  time: string;
  value: number;
}

export interface InundationCell {
  x: number;
  y: number;
  depth: number;
}

export interface ProbabilityBin {
  range: string;
  probability: number;
  count: number;
}

export interface UploadedFile {
  id: string;
  name: string;
  type: FileType;
  size: number;
  uploadedAt: string;
  status: 'uploading' | 'validated' | 'error';
}

export interface ModelParameters {
  demResolution: number;
  soilType: string;
  cnValue: number;
  initialLoss: number;
  recessionCoefficient: number;
  routingVelocity: number;
  manningN: number;
}

export interface RiverSection {
  id: string;
  name: string;
  riverKm: number;
  warningLevel: number;
  guaranteedLevel: number;
  currentWaterLevel: number;
  currentDischarge: number;
  historicalLevels: TimeSeriesPoint[];
  historicalDischarges: TimeSeriesPoint[];
  risingRate: number;
}

export interface Alert {
  id: string;
  taskId: string;
  sectionId: string;
  sectionName: string;
  level: AlertLevel;
  type: 'water_level' | 'rising_rate';
  value: number;
  threshold: number;
  triggeredAt: string;
  reviewed: boolean;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewComment?: string;
}

export interface DispatchPlan {
  id: string;
  taskId: string;
  taskName: string;
  alertId: string;
  type: 'reservoir' | 'flood_diversion';
  reservoirName?: string;
  releaseRate: number;
  diversionArea?: string;
  diversionVolume: number;
  estimatedEffect: string;
  createdAt: string;
  status: ApprovalStatus;
}

export interface ApprovalRecord {
  id: string;
  taskId: string;
  engineerId: string;
  engineerName: string;
  engineerComment: string;
  engineerApprovedAt?: string;
  accuracyScore: number;
  chiefId?: string;
  chiefName?: string;
  chiefComment?: string;
  chiefApprovedAt?: string;
  status: ApprovalStatus;
}

export interface SimulationResult {
  id: string;
  taskId: string;
  peakDischarge: number;
  peakTime: string;
  totalRunoffDepth: number;
  floodVolume: number;
  inundationArea: number;
  hydrograph: TimeSeriesPoint[];
  inundationMap: InundationCell[];
  peakProbability: ProbabilityBin[];
  completedAt: string;
}

export interface SimulationTask {
  id: string;
  name: string;
  basinName: string;
  basinArea: number;
  createdAt: string;
  status: TaskStatus;
  progress: number;
  rainfallReturnPeriod: number;
  timeWindow: string;
  parameters: ModelParameters;
  files: UploadedFile[];
  alerts: Alert[];
  sections: RiverSection[];
  result?: SimulationResult;
  approval?: ApprovalRecord;
  deviationRate?: number;
  logs: TaskLog[];
}

export interface TaskLog {
  timestamp: string;
  stage: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export interface DailyStats {
  date: string;
  completionRate: number;
  avgLeadTime: number;
  forecastAccuracy: number;
  totalTasks: number;
  completedTasks: number;
  alertsCount: number;
}

export interface RadarStat {
  subject: string;
  value: number;
  fullMark: number;
}

export interface DispatchRule {
  id: string;
  name: string;
  basinName: string;
  triggerCondition: string;
  action: string;
  confidence: number;
  usageCount: number;
  lastUsedAt: string;
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar?: string;
  email: string;
}
