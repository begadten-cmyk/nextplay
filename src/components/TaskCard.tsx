import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Calendar, AlertCircle } from 'lucide-react';
import { format, differenceInDays, isAfter, startOfDay } from 'date-fns';
import type { Task, Label, TeamMember } from '../types';
import { PRIORITY_CONFIG } from '../types';

interface TaskCardProps {
  task: Task;
  labels: Label[];
  members: TeamMember[];
  onClick: () => void;
}

function getDueBadge(dueDate: string | null, status: string) {
  if (!dueDate || status === 'done') return null;

  const today = startOfDay(new Date());
  const due = startOfDay(new Date(dueDate));
  const daysUntil = differenceInDays(due, today);

  if (isAfter(today, due)) {
    return <span className="due-badge due-overdue">Overdue</span>;
  }
  if (daysUntil <= 3) {
    return <span className="due-badge due-soon">Due soon</span>;
  }
  return <span className="due-badge due-ok">Due {format(due, 'MMM d')}</span>;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function TaskCard({ task, labels, members, onClick }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, data: { task } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const taskLabels = (task.task_labels ?? [])
    .map((tl) => {
      const found = tl.label ?? labels.find((l) => l.id === tl.label_id);
      return found;
    })
    .filter(Boolean) as Label[];

  const assignees = (task.assignee_ids ?? [])
    .map((id) => members.find((m) => m.id === id))
    .filter(Boolean) as TeamMember[];

  const priorityConfig = PRIORITY_CONFIG[task.priority];
  const visibleAssignees = assignees.slice(0, 3);
  const overflowCount = assignees.length - 3;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`task-card ${isDragging ? 'task-card-dragging' : ''}`}
      onClick={onClick}
    >
      <div className="task-card-header">
        <div
          className="task-drag-handle"
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical size={14} />
        </div>
        <span
          className="priority-dot"
          style={{ backgroundColor: priorityConfig.color }}
          title={priorityConfig.label}
        />
      </div>
      <h4 className="task-card-title">{task.title}</h4>
      {task.description && (
        <p className="task-card-desc">{task.description}</p>
      )}
      <div className="task-card-footer">
        {taskLabels.length > 0 && (
          <div className="task-labels">
            {taskLabels.map((label) => (
              <span
                key={label.id}
                className="label-chip"
                style={{ backgroundColor: label.color + '25', color: label.color, borderColor: label.color + '40' }}
              >
                {label.name}
              </span>
            ))}
          </div>
        )}
        <div className="task-card-bottom">
          <div className="task-card-meta">
            {task.due_date && (
              <span className="task-date">
                <Calendar size={12} />
                {format(new Date(task.due_date), 'MMM d')}
              </span>
            )}
            {getDueBadge(task.due_date, task.status)}
          </div>
          {assignees.length > 0 && (
            <div className="assignee-avatars">
              {visibleAssignees.map((m) => (
                <span
                  key={m.id}
                  className="assignee-avatar"
                  style={{ backgroundColor: m.color }}
                  title={m.name}
                >
                  {getInitials(m.name)}
                </span>
              ))}
              {overflowCount > 0 && (
                <span className="assignee-avatar assignee-overflow">
                  +{overflowCount}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
      {task.priority === 'high' && (
        <AlertCircle size={14} className="high-priority-icon" />
      )}
    </div>
  );
}
