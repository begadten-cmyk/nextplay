import { useEffect, useState } from 'react';
import {
  X,
  Trash2,
  MessageSquare,
  Activity,
  Calendar,
  Tag,
  Send,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import type { Task, Comment, ActivityLog, Label, Priority } from '../types';
import { PRIORITY_CONFIG } from '../types';

interface TaskDetailPanelProps {
  task: Task;
  labels: Label[];
  onClose: () => void;
  onDelete: (id: string) => Promise<boolean>;
  onUpdate: (
    id: string,
    updates: Partial<Pick<Task, 'title' | 'description' | 'priority' | 'due_date'>>
  ) => Promise<boolean>;
  onLogActivity: (taskId: string, action: string) => Promise<void>;
  getComments: (taskId: string) => Promise<Comment[]>;
  addComment: (taskId: string, content: string) => Promise<Comment | null>;
  getActivity: (taskId: string) => Promise<ActivityLog[]>;
  onAddLabel: (taskId: string, labelId: string) => Promise<boolean>;
  onRemoveLabel: (taskId: string, labelId: string) => Promise<boolean>;
  onRefetch: () => Promise<void>;
}

export function TaskDetailPanel({
  task,
  labels,
  onClose,
  onDelete,
  onUpdate,
  onLogActivity,
  getComments,
  addComment,
  getActivity,
  onAddLabel,
  onRemoveLabel,
  onRefetch,
}: TaskDetailPanelProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [activity, setActivity] = useState<ActivityLog[]>([]);
  const [newComment, setNewComment] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDesc, setEditDesc] = useState(task.description ?? '');
  const [editPriority, setEditPriority] = useState(task.priority);
  const [editDueDate, setEditDueDate] = useState(task.due_date ?? '');
  const [tab, setTab] = useState<'comments' | 'activity'>('comments');

  const taskLabels = (task.task_labels ?? [])
    .map((tl) => tl.label ?? labels.find((l) => l.id === tl.label_id))
    .filter(Boolean) as Label[];

  const availableLabels = labels.filter(
    (l) => !taskLabels.some((tl) => tl.id === l.id)
  );

  useEffect(() => {
    loadData();
  }, [task.id]);

  async function loadData() {
    const [c, a] = await Promise.all([
      getComments(task.id),
      getActivity(task.id),
    ]);
    setComments(c);
    setActivity(a);
  }

  async function handleAddComment() {
    if (!newComment.trim()) return;
    const comment = await addComment(task.id, newComment.trim());
    if (comment) {
      setComments((prev) => [...prev, comment]);
      setNewComment('');
    }
  }

  async function handleDelete() {
    const success = await onDelete(task.id);
    if (success) onClose();
  }

  async function handleSave() {
    const changes: string[] = [];
    if (editTitle !== task.title) changes.push('Updated title');
    if (editDesc !== (task.description ?? '')) changes.push('Updated description');
    if (editPriority !== task.priority)
      changes.push(`Changed priority to ${PRIORITY_CONFIG[editPriority].label}`);
    if (editDueDate !== (task.due_date ?? '')) changes.push('Updated due date');

    await onUpdate(task.id, {
      title: editTitle,
      description: editDesc || undefined,
      priority: editPriority as Priority,
      due_date: editDueDate || undefined,
    });

    for (const change of changes) {
      await onLogActivity(task.id, change);
    }
    setEditing(false);
    await onRefetch();
    loadData();
  }

  async function handleToggleLabel(labelId: string, isAttached: boolean) {
    if (isAttached) {
      await onRemoveLabel(task.id, labelId);
    } else {
      await onAddLabel(task.id, labelId);
    }
    await onRefetch();
  }

  return (
    <div className="panel-overlay" onClick={onClose}>
      <div className="detail-panel" onClick={(e) => e.stopPropagation()}>
        <div className="panel-header">
          <h2>Task Details</h2>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="panel-content">
          {editing ? (
            <div className="edit-form">
              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Priority</label>
                  <div className="priority-selector">
                    {(Object.keys(PRIORITY_CONFIG) as Priority[]).map((p) => (
                      <button
                        key={p}
                        type="button"
                        className={`priority-btn ${editPriority === p ? 'priority-btn-active' : ''}`}
                        style={{
                          borderColor: editPriority === p ? PRIORITY_CONFIG[p].color : undefined,
                          backgroundColor: editPriority === p ? PRIORITY_CONFIG[p].color + '20' : undefined,
                          color: editPriority === p ? PRIORITY_CONFIG[p].color : undefined,
                        }}
                        onClick={() => setEditPriority(p as Priority)}
                      >
                        {PRIORITY_CONFIG[p].label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label>Due Date</label>
                  <input
                    type="date"
                    value={editDueDate}
                    onChange={(e) => setEditDueDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
                <button className="btn-primary" onClick={handleSave}>Save Changes</button>
              </div>
            </div>
          ) : (
            <>
              <div className="task-detail-top">
                <h3 className="task-detail-title">{task.title}</h3>
                <div className="task-detail-actions">
                  <button className="btn-secondary btn-sm" onClick={() => setEditing(true)}>Edit</button>
                  {showDeleteConfirm ? (
                    <div className="delete-confirm">
                      <span>Delete?</span>
                      <button className="btn-danger btn-sm" onClick={handleDelete}>Yes</button>
                      <button className="btn-secondary btn-sm" onClick={() => setShowDeleteConfirm(false)}>No</button>
                    </div>
                  ) : (
                    <button className="btn-icon btn-danger-icon" onClick={() => setShowDeleteConfirm(true)}>
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>

              {task.description && (
                <p className="task-detail-desc">{task.description}</p>
              )}

              <div className="task-detail-meta">
                <div className="meta-item">
                  <span className="meta-label">Priority</span>
                  <span className="meta-value" style={{ color: PRIORITY_CONFIG[task.priority].color }}>
                    {PRIORITY_CONFIG[task.priority].label}
                  </span>
                </div>
                {task.due_date && (
                  <div className="meta-item">
                    <Calendar size={14} />
                    <span className="meta-label">Due</span>
                    <span className="meta-value">{format(new Date(task.due_date), 'MMM d, yyyy')}</span>
                  </div>
                )}
                <div className="meta-item">
                  <span className="meta-label">Created</span>
                  <span className="meta-value">{formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}</span>
                </div>
              </div>

              <div className="task-labels-section">
                <div className="meta-label-header">
                  <Tag size={14} />
                  <span>Labels</span>
                </div>
                <div className="label-chips-wrapper">
                  {taskLabels.map((label) => (
                    <button
                      key={label.id}
                      className="label-chip label-chip-removable"
                      style={{ backgroundColor: label.color + '25', color: label.color, borderColor: label.color + '40' }}
                      onClick={() => handleToggleLabel(label.id, true)}
                      title="Click to remove"
                    >
                      {label.name} ×
                    </button>
                  ))}
                  {availableLabels.map((label) => (
                    <button
                      key={label.id}
                      className="label-chip label-chip-add"
                      onClick={() => handleToggleLabel(label.id, false)}
                      title="Click to add"
                    >
                      <span className="label-dot" style={{ backgroundColor: label.color }} />
                      {label.name}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="panel-tabs">
            <button
              className={`panel-tab ${tab === 'comments' ? 'panel-tab-active' : ''}`}
              onClick={() => setTab('comments')}
            >
              <MessageSquare size={14} /> Comments ({comments.length})
            </button>
            <button
              className={`panel-tab ${tab === 'activity' ? 'panel-tab-active' : ''}`}
              onClick={() => setTab('activity')}
            >
              <Activity size={14} /> Activity ({activity.length})
            </button>
          </div>

          {tab === 'comments' ? (
            <div className="comments-section">
              <div className="comments-list">
                {comments.length === 0 ? (
                  <p className="empty-text-sm">No comments yet</p>
                ) : (
                  comments.map((c) => (
                    <div key={c.id} className="comment">
                      <p className="comment-content">{c.content}</p>
                      <span className="comment-time">
                        {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  ))
                )}
              </div>
              <div className="comment-input-wrapper">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  className="comment-input"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddComment();
                  }}
                />
                <button className="btn-icon btn-send" onClick={handleAddComment} disabled={!newComment.trim()}>
                  <Send size={16} />
                </button>
              </div>
            </div>
          ) : (
            <div className="activity-section">
              {activity.length === 0 ? (
                <p className="empty-text-sm">No activity yet</p>
              ) : (
                activity.map((a) => (
                  <div key={a.id} className="activity-item">
                    <div className="activity-dot" />
                    <div className="activity-info">
                      <span className="activity-action">{a.action}</span>
                      <span className="activity-time">
                        {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
