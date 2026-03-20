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

  const createLabel = async (name: string, color: string) => {
    if (!userId) return null;
    const { data, error } = await supabase
      .from('labels')
      .insert({ name, color, user_id: userId })
      .select()
      .single();

    if (error) {
      console.error('Error creating label:', error);
      return null;
    }
    await fetchLabels();
    return data;
  };

  const deleteLabel = async (id: string) => {
    const { error } = await supabase.from('labels').delete().eq('id', id);
    if (error) {
      console.error('Error deleting label:', error);
      return false;
    }
    await fetchLabels();
    return true;
  };

  const addLabelToTask = async (taskId: string, labelId: string) => {
    const { error } = await supabase
      .from('task_labels')
      .insert({ task_id: taskId, label_id: labelId });

    if (error && error.code !== '23505') {
      console.error('Error adding label to task:', error);
      return false;
    }
    return true;
  };

  const removeLabelFromTask = async (taskId: string, labelId: string) => {
    const { error } = await supabase
      .from('task_labels')
      .delete()
      .eq('task_id', taskId)
      .eq('label_id', labelId);

    if (error) {
      console.error('Error removing label from task:', error);
      return false;
    }
    return true;
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
