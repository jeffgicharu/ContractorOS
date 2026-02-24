import { type ReactNode } from 'react';
import { type LucideIcon } from 'lucide-react';

interface StatItem {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  trend?: { value: string; positive?: boolean };
}

interface StatCardGroupProps {
  stats: StatItem[];
  className?: string;
}

export function StatCardGroup({ stats, className = '' }: StatCardGroupProps) {
  return (
    <div
      className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 rounded-xl border border-slate-200 bg-white shadow-xs ${className}`}
    >
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className={`flex items-center gap-4 px-6 py-5 ${
              i > 0 ? 'border-t sm:border-t-0 sm:border-l border-slate-100' : ''
            }`}
          >
            {Icon && (
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                  stat.iconBg ?? 'bg-brand-50'
                }`}
              >
                <Icon
                  className={`h-5 w-5 ${stat.iconColor ?? 'text-brand-500'}`}
                />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-2xl font-bold tracking-tight text-slate-900">
                {stat.value}
              </p>
              <p className="text-[13px] text-slate-500">{stat.label}</p>
            </div>
            {stat.trend && (
              <span
                className={`ml-auto text-[13px] font-medium ${
                  stat.trend.positive ? 'text-success-600' : 'text-error-600'
                }`}
              >
                {stat.trend.value}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  trend?: { value: string; positive?: boolean };
  children?: ReactNode;
  className?: string;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  iconColor,
  iconBg,
  trend,
  children,
  className = '',
}: StatCardProps) {
  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white px-6 py-5 shadow-xs ${className}`}
    >
      <div className="flex items-center gap-4">
        {Icon && (
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
              iconBg ?? 'bg-brand-50'
            }`}
          >
            <Icon className={`h-5 w-5 ${iconColor ?? 'text-brand-500'}`} />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-2xl font-bold tracking-tight text-slate-900">
            {value}
          </p>
          <p className="text-[13px] text-slate-500">{label}</p>
        </div>
        {trend && (
          <span
            className={`text-[13px] font-medium ${
              trend.positive ? 'text-success-600' : 'text-error-600'
            }`}
          >
            {trend.value}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}
