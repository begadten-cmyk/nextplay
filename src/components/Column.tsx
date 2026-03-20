import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Inbox } from 'lucide-react';
import { TaskCard } from './TaskCard';
import type { Task, Status, Label } from '../types';

interface ColumnProps {
  id: Status;
  title: string;
  tasks: Task[];
  labels: Label[];
  isOver: boolean;
  onTaskClick: (task: Task) => void;
}

export function Column({ id, title, tasks, labels, isOver, onTaskClick }: ColumnProps) {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`column ${isOver ? 'column-over' : ''}`}
    >
      <div className="column-header">
        <h3 className="column-title">{title}</h3>
        <span className="column-count">{tasks.length}</span>
      </div>
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="column-tasks">
          {tasks.length === 0 ? (
            <div className="empty-state">
              <Inbox size={32} className="empty-icon" />
              <p className="empty-text">No tasks yet</p>
              <p className="empty-subtext">Drop a task here or create one</p>
            </div>
          ) : (
            tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                labels={labels}
                onClick={() => onTaskClick(task)}
              />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
}

export function ColumnSkeleton() {
  return (
    <div className="column">
      <div className="column-header">
        <div className="skeleton skeleton-title" />
        <div className="skeleton skeleton-badge" />
      </div>
      <div className="column-tasks">
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton skeleton-card" />
        ))}
      </div>
    </div>
  );
}
