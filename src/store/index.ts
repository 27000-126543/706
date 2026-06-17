import { create } from 'zustand';
import type { User, Alert, MonitoringStats, ProductionData, StorageTankData, TransportData, RefuelingData } from '../../shared/types.js';

interface AppState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  alerts: Alert[];
  unreadAlerts: number;
  monitoringStats: MonitoringStats | null;
  realtimeData: {
    production: ProductionData[];
    storage: StorageTankData[];
    transport: TransportData[];
    refueling: RefuelingData[];
  };
  sidebarCollapsed: boolean;
  currentProvince: string | null;

  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setIsLoading: (loading: boolean) => void;
  setAlerts: (alerts: Alert[]) => void;
  addAlert: (alert: Alert) => void;
  setUnreadAlerts: (count: number) => void;
  setMonitoringStats: (stats: MonitoringStats | null) => void;
  updateRealtimeData: (data: Partial<AppState['realtimeData']>) => void;
  toggleSidebar: () => void;
  setCurrentProvince: (code: string | null) => void;
  logout: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  isLoading: false,
  alerts: [],
  unreadAlerts: 0,
  monitoringStats: null,
  realtimeData: {
    production: [],
    storage: [],
    transport: [],
    refueling: []
  },
  sidebarCollapsed: false,
  currentProvince: null,

  setUser: (user) => set({ user }),
  setToken: (token) => {
    if (token) {
      localStorage.setItem('token', token);
      set({ token, isAuthenticated: true });
    } else {
      localStorage.removeItem('token');
      set({ token: null, isAuthenticated: false });
    }
  },
  setIsLoading: (loading) => set({ isLoading: loading }),
  setAlerts: (alerts) => set({ alerts }),
  addAlert: (alert) => set((state) => ({
    alerts: [alert, ...state.alerts],
    unreadAlerts: state.unreadAlerts + 1
  })),
  setUnreadAlerts: (count) => set({ unreadAlerts: count }),
  setMonitoringStats: (stats) => set({ monitoringStats: stats }),
  updateRealtimeData: (data) => set((state) => ({
    realtimeData: { ...state.realtimeData, ...data }
  })),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setCurrentProvince: (code) => set({ currentProvince: code }),
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      alerts: [],
      unreadAlerts: 0
    });
  }
}));
