import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '../../lib/utils.js';

interface StatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: LucideIcon;
  trend?: number;
  trendLabel?: string;
  color?: 'blue' | 'green' | 'orange' | 'red' | 'purple';
  className?: string;
}

const colorStyles = {
  blue: 'from-blue-500 to-blue-600',
  green: 'from-emerald-500 to-emerald-600',
  orange: 'from-orange-500 to-orange-600',
  red: 'from-red-500 to-red-600',
  purple: 'from-purple-500 to-purple-600'
};

export default function StatCard({
  title,
  value,
  unit,
  icon: Icon,
  trend,
  trendLabel,
  color = 'blue',
  className
}: StatCardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 mb-2">{title}</p>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-gray-900">{value}</span>
            {unit && <span className="text-sm text-gray-500 ml-1">{unit}</span>}
          </div>
          {trend !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              {trend >= 0 ? (
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500" />
              )}
              <span
                className={cn(
                  'text-sm font-medium',
                  trend >= 0 ? 'text-emerald-600' : 'text-red-600'
                )}
              >
                {Math.abs(trend)}%
              </span>
              {trendLabel && (
                <span className="text-sm text-gray-500">{trendLabel}</span>
              )}
            </div>
          )}
        </div>
        <div
          className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br',
            colorStyles[color]
          )}
        >
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}
