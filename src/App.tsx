import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { Header } from './components/Header';
import { StatsBar } from './components/StatsBar';
import { SearchBar } from './components/SearchBar';
import { LabelManager } from './components/LabelManager';
import { Board } from './components/Board';
import { TaskModal } from './components/TaskModal';
import { TaskDetailPanel } from './components/TaskDetailPanel';
import { useAuth } from './hooks/useAuth';
import { useTasks } from './hooks/useTasks';
import { useLabels } from './hooks/useLabels';
import { useTheme } from './hooks/useTheme';
import type { Task, Priority } from './types';
import './App.css';

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const { user, loading: authLoading } = useAuth();
  const {
    tasks,
    loading: tasksLoading,
    createTask,
    updateTask,
    moveTask,
    deleteTask,
    logActivity,
    getActivity,
    getComments,
    addComment,
    refetch,
  } = useTasks(user?.id);
  const {
    labels,
    createLabel,
    deleteLabel,
    addLabelToTask,
    removeLabelFromTask,
    refetch: refetchLabels,
  } = useLabels(user?.id);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all');
  const [labelFilter, setLabelFilter] = useState<string | 'all'>('all');

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (search && !task.title.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      if (priorityFilter !== 'all' && task.priority !== priorityFilter) {
        return false;
      }
      if (labelFilter !== 'all') {
        const hasLabel = (task.task_labels ?? []).some(
          (tl) => tl.label_id === labelFilter
        );
        if (!hasLabel) return false;
      }
      return true;
    });
  }, [tasks, search, priorityFilter, labelFilter]);

  const currentSelectedTask = selectedTask
    ? tasks.find((t) => t.id === selectedTask.id) ?? null
    : null;

  if (authLoading) {
    return (
      <div className="app-loading">
        <div className="spinner" />
        <p>Initializing...</p>
      </div>
    );
  }

  return (
    <div className="app">
      <Header theme={theme} onToggleTheme={toggleTheme} />
      <div className="toolbar">
        <StatsBar tasks={tasks} />
        <SearchBar
          search={search}
          onSearchChange={setSearch}
          priorityFilter={priorityFilter}
          onPriorityFilterChange={setPriorityFilter}
          labelFilter={labelFilter}
          onLabelFilterChange={setLabelFilter}
          labels={labels}
        />
        <div className="toolbar-actions">
          <LabelManager
            labels={labels}
            onCreateLabel={createLabel}
            onDeleteLabel={async (id) => {
              const result = await deleteLabel(id);
              await refetch();
              return result;
            }}
          />
          <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={16} />
            New Task
          </button>
        </div>
      </div>
      <Board
        tasks={filteredTasks}
        labels={labels}
        loading={tasksLoading}
        onMoveTask={moveTask}
        onTaskClick={setSelectedTask}
      />

      {showCreateModal && (
        <TaskModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={createTask}
          labels={labels}
          onAddLabel={addLabelToTask}
          onRefetch={refetch}
        />
      )}

      {currentSelectedTask && (
        <TaskDetailPanel
          task={currentSelectedTask}
          labels={labels}
          onClose={() => setSelectedTask(null)}
          onDelete={deleteTask}
          onUpdate={updateTask}
          onLogActivity={logActivity}
          getComments={getComments}
          addComment={addComment}
          getActivity={getActivity}
          onAddLabel={async (taskId, labelId) => {
            const result = await addLabelToTask(taskId, labelId);
            await refetchLabels();
            return result;
          }}
          onRemoveLabel={async (taskId, labelId) => {
            const result = await removeLabelFromTask(taskId, labelId);
            await refetchLabels();
            return result;
          }}
          onRefetch={refetch}
        />
      )}
    </div>
  );
}
