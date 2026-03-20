import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import { Column, ColumnSkeleton } from './Column';
import { TaskCard } from './TaskCard';
import type { Task, Status, Label, TeamMember } from '../types';
import { COLUMNS } from '../types';

interface BoardProps {
  tasks: Task[];
  labels: Label[];
  members: TeamMember[];
  loading: boolean;
  fetchError: string | null;
  onMoveTask: (id: string, status: Status) => Promise<{ error: string | null }>;
  onTaskClick: (task: Task) => void;
  onError: (message: string) => void;
}

export function Board({ tasks, labels, members, loading, fetchError, onMoveTask, onTaskClick, onError }: BoardProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [overColumn, setOverColumn] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  function handleDragStart(event: DragStartEvent) {
    const task = tasks.find((t) => t.id === event.active.id);
    if (task) setActiveTask(task);
  }

  function handleDragOver(event: DragOverEvent) {
    const overId = event.over?.id;
    if (!overId) {
      setOverColumn(null);
      return;
    }
    const columnId = COLUMNS.find((c) => c.id === overId)?.id;
    if (columnId) {
      setOverColumn(columnId);
      return;
    }
    const overTask = tasks.find((t) => t.id === overId);
    if (overTask) {
      setOverColumn(overTask.status);
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveTask(null);
    setOverColumn(null);

    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    let targetStatus: Status | null = null;
    const col = COLUMNS.find((c) => c.id === over.id);
    if (col) {
      targetStatus = col.id;
    } else {
      const overTask = tasks.find((t) => t.id === over.id);
      if (overTask) {
        targetStatus = overTask.status;
      }
    }

    if (targetStatus && targetStatus !== task.status) {
      const { error } = await onMoveTask(taskId, targetStatus);
      if (error) onError(error);
    }
  }

  if (loading) {
    return (
      <div className="board">
        {COLUMNS.map((col) => (
          <ColumnSkeleton key={col.id} />
        ))}
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="board-error">
        <div className="board-error-content">
          <p className="board-error-title">Failed to load tasks</p>
          <p className="board-error-message">{fetchError}</p>
        </div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="board">
        {COLUMNS.map((col) => (
          <Column
            key={col.id}
            id={col.id}
            title={col.title}
            tasks={tasks.filter((t) => t.status === col.id)}
            labels={labels}
            members={members}
            isOver={overColumn === col.id}
            onTaskClick={onTaskClick}
          />
        ))}
      </div>
      <DragOverlay>
        {activeTask ? (
          <TaskCard task={activeTask} labels={labels} members={members} onClick={() => {}} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
