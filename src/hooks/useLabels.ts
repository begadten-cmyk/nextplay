import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Label } from '../types';

export function useLabels(userId: string | undefined) {
  const [labels, setLabels] = useState<Label[]>([]);

  const fetchLabels = useCallback(async () => {
    if (!userId) return;
    const { data, error } = await supabase
      .from('labels')
      .select('*')
      .eq('user_id', userId)
      .order('name');

    if (error) {
      console.error('Error fetching labels:', error);
    } else {
      setLabels(data ?? []);
    }
  }, [userId]);

  useEffect(() => {
    fetchLabels();
  }, [fetchLabels]);

  const createLabel = async (name: string, color: string): Promise<{ data: Label | null; error: string | null }> => {
    if (!userId) return { data: null, error: 'Not authenticated' };
    const { data, error } = await supabase
      .from('labels')
      .insert({ name, color, user_id: userId })
      .select()
      .single();

    if (error) {
      return { data: null, error: `Failed to create label: ${error.message}` };
    }
    await fetchLabels();
    return { data, error: null };
  };

  const deleteLabel = async (id: string): Promise<{ error: string | null }> => {
    const { error } = await supabase.from('labels').delete().eq('id', id);
    if (error) {
      return { error: `Failed to delete label: ${error.message}` };
    }
    await fetchLabels();
    return { error: null };
  };

  const addLabelToTask = async (taskId: string, labelId: string): Promise<{ error: string | null }> => {
    const { error } = await supabase
      .from('task_labels')
      .insert({ task_id: taskId, label_id: labelId });

    if (error && error.code !== '23505') {
      return { error: `Failed to add label: ${error.message}` };
    }
    return { error: null };
  };

  const removeLabelFromTask = async (taskId: string, labelId: string): Promise<{ error: string | null }> => {
    const { error } = await supabase
      .from('task_labels')
      .delete()
      .eq('task_id', taskId)
      .eq('label_id', labelId);

    if (error) {
      return { error: `Failed to remove label: ${error.message}` };
    }
    return { error: null };
  };

  return {
    labels,
    createLabel,
    deleteLabel,
    addLabelToTask,
    removeLabelFromTask,
    refetch: fetchLabels,
  };
}
