import axios from 'axios';
import type {
  LoginRequest,
  LoginResponse,
  User,
  UserRole,
  DashboardOverviewResponse,
  ProvinceDetailResponse,
  Alert,
  ForecastResult,
  PlanData,
  WeeklyReport,
  ProductionData,
  StorageTankData,
  TransportData,
  RefuelingData,
  MonitoringStats,
  ApprovalRequest
} from '../../shared/types.js';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (data: LoginRequest) =>
    axiosInstance.post<LoginResponse>('/auth/login', data).then(r => r.data),

  logout: () =>
    axiosInstance.post('/auth/logout').then(r => r.data),

  getCurrentUser: () =>
    axiosInstance.get<User>('/auth/me').then(r => r.data)
};

export const dashboardApi = {
  getOverview: () =>
    axiosInstance.get<DashboardOverviewResponse>('/dashboard/overview').then(r => r.data),

  getProvinceDetail: (code: string) =>
    axiosInstance.get<ProvinceDetailResponse>(`/dashboard/province/${code}`).then(r => r.data),

  getProvinces: () =>
    axiosInstance.get<Array<{ name: string; code: string }>>('/dashboard/provinces').then(r => r.data)
};

export const monitoringApi = {
  getProduction: (limit = 20) =>
    axiosInstance.get<{ data: ProductionData[]; total: number }>(`/monitoring/production?limit=${limit}`).then(r => r.data),

  getStorage: (limit = 20) =>
    axiosInstance.get<{ data: StorageTankData[]; total: number }>(`/monitoring/storage?limit=${limit}`).then(r => r.data),

  getTransport: (limit = 20) =>
    axiosInstance.get<{ data: TransportData[]; total: number }>(`/monitoring/transport?limit=${limit}`).then(r => r.data),

  getRefueling: (limit = 20) =>
    axiosInstance.get<{ data: RefuelingData[]; total: number }>(`/monitoring/refueling?limit=${limit}`).then(r => r.data),

  getStats: () =>
    axiosInstance.get<MonitoringStats>('/monitoring/stats').then(r => r.data)
};

export const alertsApi = {
  getAlerts: (params?: { level?: number; status?: string; province?: string }) =>
    axiosInstance.get<{ data: Alert[]; total: number }>('/alerts', { params }).then(r => r.data),

  getAlert: (id: string) =>
    axiosInstance.get<Alert>(`/alerts/${id}`).then(r => r.data),

  createAlert: (data: Partial<Alert>) =>
    axiosInstance.post<Alert>('/alerts', data).then(r => r.data),

  approveAlert: (id: string, data: ApprovalRequest) =>
    axiosInstance.post<Alert>(`/alerts/${id}/approve`, data).then(r => r.data),

  escalateAlert: (id: string) =>
    axiosInstance.post<Alert>(`/alerts/${id}/escalate`).then(r => r.data),

  resolveAlert: (id: string) =>
    axiosInstance.post<Alert>(`/alerts/${id}/resolve`).then(r => r.data),

  getAlertHistory: (id: string) =>
    axiosInstance.get(`/alerts/${id}/history`).then(r => r.data),

  getStats: () =>
    axiosInstance.get('/alerts/stats/summary').then(r => r.data)
};

export const forecastApi = {
  getPlan: () =>
    axiosInstance.get<PlanData>('/forecast/plan').then(r => r.data),

  uploadPlan: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return axiosInstance.post<PlanData>('/forecast/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(r => r.data);
  },

  getAnalysis: () =>
    axiosInstance.get<ForecastResult>('/forecast/analysis').then(r => r.data),

  getRecommendations: () =>
    axiosInstance.get<{ data: Array<{ type: string; title: string; description: string; estimatedCost: number; priority: string }> }>('/forecast/recommendations').then(r => r.data),

  acceptRecommendation: (index: number) =>
    axiosInstance.post(`/forecast/recommendations/${index}/accept`).then(r => r.data)
};

export const reportsApi = {
  getReports: (params?: { region?: string; year?: number }) =>
    axiosInstance.get<{ data: WeeklyReport[]; total: number }>('/reports', { params }).then(r => r.data),

  getReport: (id: string) =>
    axiosInstance.get<WeeklyReport>(`/reports/${id}`).then(r => r.data),

  generateReport: () =>
    axiosInstance.post<WeeklyReport>('/reports/generate').then(r => r.data),

  downloadReport: (id: string) =>
    axiosInstance.get(`/reports/${id}/download`, { responseType: 'blob' }).then(r => r.data),

  getTrend: () =>
    axiosInstance.get('/reports/trend/summary').then(r => r.data)
};

interface PermissionTreeNode {
  key: string;
  title: string;
  children?: PermissionTreeNode[];
}

export const adminApi = {
  getUsers: (params?: { role?: string; search?: string }) =>
    axiosInstance.get<{ data: User[]; total: number }>('/admin/users', { params }).then(r => r.data),

  createUser: (data: Partial<User>) =>
    axiosInstance.post<User>('/admin/users', data).then(r => r.data),

  updateUser: (id: string, data: Partial<User>) =>
    axiosInstance.put<User>(`/admin/users/${id}`, data).then(r => r.data),

  deleteUser: (id: string) =>
    axiosInstance.delete(`/admin/users/${id}`).then(r => r.data),

  getPermissionTree: () =>
    axiosInstance.get<PermissionTreeNode[]>('/admin/permissions/tree').then(r => r.data),

  getRolePermissions: () =>
    axiosInstance.get<Record<UserRole, string[]>>('/admin/permissions/roles').then(r => r.data),

  saveRolePermissions: (role: UserRole, permissions: string[]) =>
    axiosInstance.post<{ success: boolean }>('/admin/permissions/roles', { role, permissions }).then(r => r.data)
};

export default axiosInstance;
