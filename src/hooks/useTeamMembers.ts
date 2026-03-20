import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { TeamMember } from '../types';

export function useTeamMembers(userId: string | undefined) {
  const [members, setMembers] = useState<TeamMember[]>([]);

  const fetchMembers = useCallback(async () => {
    if (!userId) return;
    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching team members:', error);
      return { error: error.message };
    }
    setMembers(data ?? []);
    return { error: null };
  }, [userId]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const createMember = async (name: string, color: string): Promise<{ data: TeamMember | null; error: string | null }> => {
    if (!userId) return { data: null, error: 'Not authenticated' };
    const { data, error } = await supabase
      .from('team_members')
      .insert({ name, color, user_id: userId })
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }
    await fetchMembers();
    return { data, error: null };
  };

  const deleteMember = async (id: string): Promise<{ error: string | null }> => {
    const { error } = await supabase.from('team_members').delete().eq('id', id);
    if (error) {
      return { error: error.message };
    }
    await fetchMembers();
    return { error: null };
  };

  return {
    members,
    createMember,
    deleteMember,
    refetch: fetchMembers,
  };
}
