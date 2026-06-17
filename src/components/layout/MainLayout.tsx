import { Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import Sidebar from './Sidebar.js';
import Header from './Header.js';
import { useAppStore } from '../../store/index.js';
import { useWebSocket } from '../../hooks/useWebSocket.js';
import { authApi, monitoringApi, alertsApi } from '../../api/client.js';

export default function MainLayout() {
  const { sidebarCollapsed, setUser, setMonitoringStats, setAlerts, user } = useAppStore();
  const { connect } = useWebSocket();

  useEffect(() => {
    const initApp = async () => {
      try {
        if (!user) {
          const userData = await authApi.getCurrentUser();
          setUser(userData);
        }

        const [stats, alertsData] = await Promise.all([
          monitoringApi.getStats(),
          alertsApi.getAlerts()
        ]);

        setMonitoringStats(stats);
        setAlerts(alertsData.data);
      } catch (error) {
        console.error('Failed to initialize app:', error);
      }
    };

    initApp();
    connect();
  }, [connect, setUser, setMonitoringStats, setAlerts, user]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <Header />
      <main
        className={`pt-16 min-h-screen transition-all duration-300 ${
          sidebarCollapsed ? 'ml-16' : 'ml-64'
        }`}
      >
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
