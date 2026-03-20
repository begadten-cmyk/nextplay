import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Task, Status, Priority, ActivityLog, Comment } from '../types';

export function useTasks(userId: string | undefined) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('tasks')
      .select('*, task_labels(task_id, label_id, label:labels(*))')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tasks:', error);
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
  }) => {
    if (!userId) return null;
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        ...task,
        user_id: userId,
        status: task.status ?? 'todo',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating task:', error);
      return null;
    }

    await logActivity(data.id, 'Created this task');
    await fetchTasks();
    return data;
  };

  const updateTask = async (
    id: string,
    updates: Partial<Pick<Task, 'title' | 'description' | 'priority' | 'due_date' | 'status'>>
  ) => {
    const { error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error('Error updating task:', error);
      return false;
    }
    await fetchTasks();
    return true;
  };

  const moveTask = async (id: string, newStatus: Status) => {
    const statusLabels: Record<Status, string> = {
      todo: 'To Do',
      in_progress: 'In Progress',
      in_review: 'In Review',
      done: 'Done',
    };

    const success = await updateTask(id, { status: newStatus });
    if (success) {
      await logActivity(id, `Moved to ${statusLabels[newStatus]}`);
    }
    return success;
  };

  const deleteTask = async (id: string) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) {
      console.error('Error deleting task:', error);
      return false;
    }
    setTasks((prev) => prev.filter((t) => t.id !== id));
    return true;
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
      console.error('Error fetching activity:', error);
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
      console.error('Error fetching comments:', error);
      return [];
    }
    return data ?? [];
  };

  const addComment = async (taskId: string, content: string) => {
    if (!userId) return null;
    const { data, error } = await supabase
      .from('comments')
      .insert({ task_id: taskId, user_id: userId, content })
      .select()
      .single();

    if (error) {
      console.error('Error adding comment:', error);
      return null;
    }
    return data;
  };

  return {
    tasks,
    loading,
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
