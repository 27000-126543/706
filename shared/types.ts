export type UserRole = 'national' | 'provincial' | 'municipal' | 'factory' | 'safety' | 'director';

export interface User {
  id: string;
  username: string;
  realName: string;
  role: UserRole;
  region?: string;
  province?: string;
  city?: string;
  permissions: string[];
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface ProvinceProduction {
  province: string;
  code: string;
  value: number;
}

export interface RiskRankingItem {
  province: string;
  code: string;
  riskIndex: number;
  level: 'low' | 'medium' | 'high' | 'critical';
}

export interface DashboardOverviewResponse {
  totalProduction: number;
  totalStorage: number;
  totalTransport: number;
  totalRefueling: number;
  activeAlerts: { level1: number; level2: number };
  safetyScore: number;
  provinceProduction: ProvinceProduction[];
  riskRanking: RiskRankingItem[];
  updatedAt: Date;
}

export interface ProductionTrendItem {
  date: string;
  production: number;
  purity: number;
}

export interface StorageHealthItem {
  level: 'excellent' | 'good' | 'warning' | 'danger';
  count: number;
  percentage: number;
}

export interface RefuelingStatItem {
  station: string;
  dailyAmount: number;
  utilization: number;
}

export interface Factory {
  id: string;
  name: string;
  type: string;
  province: string;
  city: string;
  dailyProduction: number;
  safetyScore: number;
  longitude?: number;
  latitude?: number;
}

export interface ProvinceDetailResponse {
  province: string;
  code: string;
  productionTrend: ProductionTrendItem[];
  storageHealth: StorageHealthItem[];
  refuelingStats: RefuelingStatItem[];
  factories: Factory[];
}

export interface ProductionData {
  id: string;
  factoryId: string;
  factoryName: string;
  timestamp: Date;
  electrolyzerCurrent: number;
  electrolyzerVoltage: number;
  hydrogenProduction: number;
  hydrogenPurity: number;
  temperature: number;
  pressure: number;
}

export interface StorageTankData {
  id: string;
  tankId: string;
  tankName: string;
  factoryId: string;
  factoryName: string;
  timestamp: Date;
  pressure: number;
  designPressure: number;
  temperature: number;
  humidity: number;
  level: number;
  safetyFactor: number;
  healthStatus: 'excellent' | 'good' | 'warning' | 'danger';
}

export interface TransportData {
  id: string;
  vehicleId: string;
  plateNumber: string;
  factoryId: string;
  timestamp: Date;
  longitude: number;
  latitude: number;
  speed: number;
  pressure: number;
  temperature: number;
  leakDetected: boolean;
  leakLevel: number;
  riskIndex: number;
  route?: string;
}

export interface RefuelingData {
  id: string;
  stationId: string;
  stationName: string;
  factoryId: string;
  timestamp: Date;
  dispenserStatus: 'normal' | 'warning' | 'fault';
  totalDispensed: number;
  dailyDispensed: number;
  pressure: number;
  temperature: number;
  utilizationRate: number;
}

export type AlertType = 'storage_overpressure' | 'transport_leak' | 'equipment_failure' | 'other';
export type AlertLevel = 1 | 2;
export type AlertStatus = 'pending' | 'processing' | 'approved' | 'resolved' | 'escalated';
export type ApprovalAction = 'pending' | 'approved' | 'rejected';

export interface ApprovalFlowStep {
  step: number;
  role: string;
  userId?: string;
  userName?: string;
  action: ApprovalAction;
  comment: string;
  timestamp?: Date;
}

export interface Alert {
  id: string;
  type: AlertType;
  level: AlertLevel;
  status: AlertStatus;
  source: string;
  sourceId: string;
  location: string;
  province: string;
  city: string;
  message: string;
  triggeredAt: Date;
  escalationTime?: Date;
  resolvedAt?: Date;
  approvalFlow?: ApprovalFlowStep[];
  currentStep?: number;
}

export interface ApprovalRequest {
  alertId: string;
  step: number;
  action: ApprovalAction;
  comment: string;
}

export interface PlanTarget {
  province: string;
  productionTarget: number;
  transportCapacity: number;
  refuelingTarget: number;
}

export interface PlanData {
  id?: string;
  year: number;
  targets: PlanTarget[];
  uploadedBy?: string;
  uploadedAt?: Date;
}

export interface ForecastItem {
  date: string;
  value: number;
}

export interface GapItem {
  date: string;
  gap: number;
  severity: 'low' | 'medium' | 'high';
  contractRisk: boolean;
}

export interface Recommendation {
  type: 'production' | 'procurement' | 'optimization';
  title: string;
  description: string;
  estimatedCost: number;
  priority: 'high' | 'medium' | 'low';
}

export interface ForecastResult {
  forecastDays: number;
  supplyForecast: ForecastItem[];
  demandForecast: ForecastItem[];
  gaps: GapItem[];
  recommendations: Recommendation[];
}

export interface AccidentDistribution {
  type: string;
  count: number;
  percentage: number;
}

export interface OptimizationSuggestion {
  area: string;
  suggestion: string;
  priority: 'high' | 'medium' | 'low';
}

export interface WeeklyReport {
  id: string;
  week: string;
  startDate: Date;
  endDate: Date;
  region: string;
  summary: {
    totalProduction: number;
    productionYoY: number;
    productionMoM: number;
    alertCount: number;
    alertResolutionRate: number;
    equipmentFailureRate: number;
  };
  accidentDistribution: AccidentDistribution[];
  productionTrend: ForecastItem[];
  optimizationSuggestions: OptimizationSuggestion[];
  generatedBy?: string;
  createdAt: Date;
}

export interface MonitoringStats {
  production: {
    total: number;
    purity: number;
    trend: number[];
  };
  storage: {
    totalCapacity: number;
    usedCapacity: number;
    safetyScore: number;
  };
  transport: {
    activeVehicles: number;
    riskIndex: number;
    leakCount: number;
  };
  refueling: {
    activeStations: number;
    dailyAmount: number;
    utilizationRate: number;
  };
}
