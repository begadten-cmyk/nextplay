import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Task, Status, Priority, ActivityLog, Comment } from '../types';

export function useTasks(userId: string | undefined) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setFetchError(null);
    const { data, error } = await supabase
      .from('tasks')
      .select('*, task_labels(task_id, label_id, label:labels(*))')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      setFetchError(`Failed to load tasks: ${error.message}`);
    } else {
      setTasks(data ?? []);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const createTask = async (task: {
    title: string;
    description?: string;
    priority: Priority;
    due_date?: string | null;
    status?: Status;
    assignee_ids?: string[];
  }): Promise<{ data: Task | null; error: string | null }> => {
    if (!userId) return { data: null, error: 'Not authenticated' };
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        ...task,
        user_id: userId,
        status: task.status ?? 'todo',
        assignee_ids: task.assignee_ids ?? [],
      })
      .select()
      .single();

    if (error) {
      return { data: null, error: `Failed to create task: ${error.message}` };
    }

    await logActivity(data.id, 'Created this task');
    await fetchTasks();
    return { data, error: null };
  };

  const updateTask = async (
    id: string,
    updates: Partial<Pick<Task, 'title' | 'description' | 'priority' | 'due_date' | 'status' | 'assignee_ids'>>
  ): Promise<{ error: string | null }> => {
    const { error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id);

    if (error) {
      return { error: `Failed to update task: ${error.message}` };
    }
    await fetchTasks();
    return { error: null };
  };

  const moveTask = async (id: string, newStatus: Status): Promise<{ error: string | null }> => {
    const statusLabels: Record<Status, string> = {
      todo: 'To Do',
      in_progress: 'In Progress',
      in_review: 'In Review',
      done: 'Done',
    };

    const result = await updateTask(id, { status: newStatus });
    if (!result.error) {
      await logActivity(id, `Moved to ${statusLabels[newStatus]}`);
    }
    return result;
  };

  const deleteTask = async (id: string): Promise<{ error: string | null }> => {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) {
      return { error: `Failed to delete task: ${error.message}` };
    }
    setTasks((prev) => prev.filter((t) => t.id !== id));
    return { error: null };
  };

  const logActivity = async (taskId: string, action: string) => {
    if (!userId) return;
    await supabase.from('activity_log').insert({
      task_id: taskId,
      user_id: userId,
      action,
    });
  };

  const getActivity = async (taskId: string): Promise<ActivityLog[]> => {
    const { data, error } = await supabase
      .from('activity_log')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: true });

    if (error) {
      return [];
    }
    return data ?? [];
  };

  const getComments = async (taskId: string): Promise<Comment[]> => {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: true });

    if (error) {
      return [];
    }
    return data ?? [];
  };

  const addComment = async (taskId: string, content: string): Promise<{ data: Comment | null; error: string | null }> => {
    if (!userId) return { data: null, error: 'Not authenticated' };
    const { data, error } = await supabase
      .from('comments')
      .insert({ task_id: taskId, user_id: userId, content })
      .select()
      .single();

    if (error) {
      return { data: null, error: `Failed to add comment: ${error.message}` };
    }
    return { data, error: null };
  };

  return {
    tasks,
    loading,
    fetchError,
    createTask,
    updateTask,
    moveTask,
    deleteTask,
    logActivity,
    getActivity,
    getComments,
    addComment,
    refetch: fetchTasks,
  };
}
