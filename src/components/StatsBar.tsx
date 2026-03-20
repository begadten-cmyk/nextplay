import { CheckCircle, AlertTriangle, LayoutList } from 'lucide-react';
import { isAfter, startOfDay } from 'date-fns';
import type { Task } from '../types';

interface StatsBarProps {
  tasks: Task[];
}

export function StatsBar({ tasks }: StatsBarProps) {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === 'done').length;
  const overdue = tasks.filter((t) => {
    if (!t.due_date || t.status === 'done') return false;
    return isAfter(startOfDay(new Date()), startOfDay(new Date(t.due_date)));
  }).length;

  return (
    <div className="stats-bar">
      <div className="stat">
        <LayoutList size={16} />
        <span className="stat-value">{total}</span>
        <span className="stat-label">Total</span>
      </div>
      <div className="stat stat-done">
        <CheckCircle size={16} />
        <span className="stat-value">{completed}</span>
        <span className="stat-label">Done</span>
      </div>
      <div className="stat stat-overdue">
        <AlertTriangle size={16} />
        <span className="stat-value">{overdue}</span>
        <span className="stat-label">Overdue</span>
      </div>
    </div>
  );
}
