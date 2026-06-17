import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Factory,
  Gauge,
  AlertTriangle,
  TrendingUp,
  FileBarChart,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut
} from 'lucide-react';
import { useAppStore } from '../../store/index.js';
import { authApi } from '../../api/client.js';

const menuItems = [
  { path: '/dashboard', label: '核心看板', icon: LayoutDashboard },
  {
    path: '/monitoring',
    label: '实时监测',
    icon: Gauge,
    children: [
      { path: '/monitoring/hydrogen-production', label: '制氢监测' },
      { path: '/monitoring/storage', label: '储氢监测' },
      { path: '/monitoring/transport', label: '运输监测' },
      { path: '/monitoring/refueling', label: '加注监测' }
    ]
  },
  { path: '/alerts', label: '预警中心', icon: AlertTriangle },
  { path: '/forecast', label: '供需预测', icon: TrendingUp },
  { path: '/reports', label: '安全诊断', icon: FileBarChart },
  { path: '/admin/users', label: '系统管理', icon: Settings }
];

export default function Sidebar() {
  const { sidebarCollapsed, toggleSidebar, user, logout } = useAppStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } finally {
      logout();
      navigate('/login');
    }
  };

  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-slate-900 text-white transition-all duration-300 z-50 ${
        sidebarCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-700">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center">
              <Factory className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg">氢能监测</span>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
      </div>

      <nav className="mt-4 px-2">
        {menuItems.map((item) => (
          <div key={item.path} className="mb-1">
            <NavLink
              to={item.path}
              end={!item.children}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!sidebarCollapsed && <span className="text-sm font-medium">{item.label}</span>}
            </NavLink>

            {item.children && !sidebarCollapsed && (
              <div className="ml-4 mt-1 space-y-1">
                {item.children.map((child) => (
                  <NavLink
                    key={child.path}
                    to={child.path}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                        isActive
                          ? 'bg-blue-600/20 text-blue-400'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                      }`
                    }
                  >
                    {child.label}
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700">
        {!sidebarCollapsed && user && (
          <div className="mb-3 px-2">
            <p className="text-sm font-medium text-white">{user.realName}</p>
            <p className="text-xs text-slate-400">
              {user.role === 'national' && '国家级管理员'}
              {user.role === 'provincial' && '省级管理员'}
              {user.role === 'municipal' && '市级管理员'}
              {user.role === 'factory' && '企业厂长'}
              {user.role === 'safety' && '现场安全员'}
              {user.role === 'director' && '总部安全总监'}
            </p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-red-600/20 hover:text-red-400 transition-all"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!sidebarCollapsed && <span className="text-sm font-medium">退出登录</span>}
        </button>
      </div>
    </aside>
  );
}
