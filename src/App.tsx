import { useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { Header } from './components/Header';
import { StatsBar } from './components/StatsBar';
import { SearchBar } from './components/SearchBar';
import { LabelManager } from './components/LabelManager';
import { TeamManager } from './components/TeamManager';
import { Board } from './components/Board';
import { TaskModal } from './components/TaskModal';
import { TaskDetailPanel } from './components/TaskDetailPanel';
import { ToastContainer } from './components/ToastContainer';
import { useAuth } from './hooks/useAuth';
import { useTasks } from './hooks/useTasks';
import { useLabels } from './hooks/useLabels';
import { useTeamMembers } from './hooks/useTeamMembers';
import { useTheme } from './hooks/useTheme';
import { useToast } from './hooks/useToast';
import type { Task, Priority } from './types';
import './App.css';

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const { user, loading: authLoading, error: authError } = useAuth();
  const { toasts, addToast, dismissToast } = useToast();
  const {
    tasks,
    loading: tasksLoading,
    fetchError,
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
  const {
    members,
    createMember,
    deleteMember,
  } = useTeamMembers(user?.id);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all');
  const [labelFilter, setLabelFilter] = useState<string | 'all'>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string | 'all'>('all');

  // Show auth error as toast
  useEffect(() => {
    if (authError) addToast(authError);
  }, [authError, addToast]);

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
      if (assigneeFilter !== 'all') {
        if (!(task.assignee_ids ?? []).includes(assigneeFilter)) return false;
      }
      return true;
    });
  }, [tasks, search, priorityFilter, labelFilter, assigneeFilter]);

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
          assigneeFilter={assigneeFilter}
          onAssigneeFilterChange={setAssigneeFilter}
          labels={labels}
          members={members}
        />
        <div className="toolbar-actions">
          <TeamManager
            members={members}
            onCreateMember={createMember}
            onDeleteMember={deleteMember}
            onError={addToast}
          />
          <LabelManager
            labels={labels}
            onCreateLabel={createLabel}
            onDeleteLabel={async (id) => {
              const result = await deleteLabel(id);
              await refetch();
              return result;
            }}
            onError={addToast}
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
        members={members}
        loading={tasksLoading}
        fetchError={fetchError}
        onMoveTask={moveTask}
        onTaskClick={setSelectedTask}
        onError={addToast}
      />

      {showCreateModal && (
        <TaskModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={createTask}
          labels={labels}
          members={members}
          onAddLabel={addLabelToTask}
          onRefetch={refetch}
          onError={addToast}
        />
      )}

      {currentSelectedTask && (
        <TaskDetailPanel
          task={currentSelectedTask}
          labels={labels}
          members={members}
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
          onError={addToast}
        />
      )}

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
