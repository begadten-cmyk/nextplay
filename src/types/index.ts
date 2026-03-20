export type Status = 'todo' | 'in_progress' | 'in_review' | 'done';
export type Priority = 'low' | 'normal' | 'high';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: Status;
  priority: Priority;
  due_date: string | null;
  user_id: string;
  assignee_ids: string[];
  created_at: string;
  task_labels?: TaskLabel[];
}

export interface Comment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

export interface Label {
  id: string;
  name: string;
  color: string;
  user_id: string;
}

export interface TaskLabel {
  task_id: string;
  label_id: string;
  label?: Label;
}

export interface ActivityLog {
  id: string;
  task_id: string;
  user_id: string;
  action: string;
  created_at: string;
}

export interface TeamMember {
  id: string;
  name: string;
  color: string;
  user_id: string;
  created_at: string;
}

export interface Column {
  id: Status;
  title: string;
}

export const COLUMNS: Column[] = [
  { id: 'todo', title: 'To Do' },
  { id: 'in_progress', title: 'In Progress' },
  { id: 'in_review', title: 'In Review' },
  { id: 'done', title: 'Done' },
];

export const PRIORITY_CONFIG: Record<Priority, { label: string; color: string }> = {
  low: { label: 'Low', color: '#22c55e' },
  normal: { label: 'Normal', color: '#1e3a8a' },
  high: { label: 'High', color: '#ef4444' },
};
