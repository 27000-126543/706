import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Search, Clock, RefreshCw } from 'lucide-react';
import { useAppStore } from '../../store/index.js';
import { alertsApi } from '../../api/client.js';
import dayjs from 'dayjs';

export default function Header() {
  const navigate = useNavigate();
  const { sidebarCollapsed, unreadAlerts, setUnreadAlerts } = useAppStore();
  const [currentTime, setCurrentTime] = useState(dayjs());
  const [alerts, setAlerts] = useState<Array<{ id: string; message: string; level: number; triggeredAt: Date }>>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(dayjs());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const { data } = await alertsApi.getAlerts({ status: 'pending' });
        setAlerts(data.slice(0, 5).map(a => ({
          id: a.id,
          message: a.message,
          level: a.level,
          triggeredAt: a.triggeredAt
        })));
      } catch (error) {
        console.error('Failed to fetch alerts:', error);
      }
    };
    fetchAlerts();
  }, []);

  const handleBellClick = () => {
    setShowNotifications(!showNotifications);
    if (unreadAlerts > 0) {
      setUnreadAlerts(0);
    }
  };

  return (
    <header
      className={`fixed top-0 right-0 h-16 bg-white border-b border-gray-200 z-40 transition-all duration-300 ${
        sidebarCollapsed ? 'left-16' : 'left-64'
      }`}
    >
      <div className="h-full px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索工厂、设备、预警..."
              className="pl-10 pr-4 py-2 w-80 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-gray-600">
            <RefreshCw className="w-4 h-4" />
            <span className="text-sm">实时更新中</span>
          </div>

          <div className="flex items-center gap-2 text-gray-600">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-mono">
              {currentTime.format('YYYY-MM-DD HH:mm:ss')}
            </span>
          </div>

          <div className="relative">
            <button
              onClick={handleBellClick}
              className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Bell className="w-5 h-5 text-gray-600" />
              {unreadAlerts > 0 && (
                <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                  {unreadAlerts}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                  <h3 className="font-semibold text-gray-800">最新预警</h3>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {alerts.length === 0 ? (
                    <div className="px-4 py-8 text-center text-gray-500">
                      暂无待处理预警
                    </div>
                  ) : (
                    alerts.map((alert) => (
                      <div
                        key={alert.id}
                        className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer ${
                          alert.level === 2 ? 'bg-red-50' : 'bg-orange-50'
                        }`}
                        onClick={() => {
                          setShowNotifications(false);
                          navigate('/alerts');
                        }}
                      >
                        <div className="flex items-start gap-2">
                          <span
                            className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${
                              alert.level === 2 ? 'bg-red-500' : 'bg-orange-500'
                            }`}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-800 truncate">{alert.message}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {dayjs(alert.triggeredAt).fromNow()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
                  <button
                    className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium text-left"
                    onClick={() => {
                      setShowNotifications(false);
                      navigate('/alerts');
                    }}
                  >
                    查看全部预警
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
