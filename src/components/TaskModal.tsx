import { useState } from 'react';
import { X } from 'lucide-react';
import type { Priority, Label, Task } from '../types';
import { PRIORITY_CONFIG } from '../types';

interface TaskModalProps {
  onClose: () => void;
  onSubmit: (task: {
    title: string;
    description?: string;
    priority: Priority;
    due_date?: string | null;
  }) => Promise<Task | null>;
  labels: Label[];
  onAddLabel: (taskId: string, labelId: string) => Promise<boolean>;
  onRefetch: () => Promise<void>;
}

export function TaskModal({ onClose, onSubmit, labels, onAddLabel, onRefetch }: TaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('normal');
  const [dueDate, setDueDate] = useState('');
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    const task = await onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      due_date: dueDate || null,
    });

    if (task) {
      for (const labelId of selectedLabels) {
        await onAddLabel(task.id, labelId);
      }
      if (selectedLabels.length > 0) {
        await onRefetch();
      }
    }
    setSubmitting(false);
    onClose();
  };

  const toggleLabel = (id: string) => {
    setSelectedLabels((prev) =>
      prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id]
    );
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create Task</h2>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">Title *</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title"
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description..."
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
                    className={`priority-btn ${priority === p ? 'priority-btn-active' : ''}`}
                    style={{
                      borderColor: priority === p ? PRIORITY_CONFIG[p].color : undefined,
                      backgroundColor: priority === p ? PRIORITY_CONFIG[p].color + '20' : undefined,
                      color: priority === p ? PRIORITY_CONFIG[p].color : undefined,
                    }}
                    onClick={() => setPriority(p)}
                  >
                    {PRIORITY_CONFIG[p].label}
                  </button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="dueDate">Due Date</label>
              <input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>
          {labels.length > 0 && (
            <div className="form-group">
              <label>Labels</label>
              <div className="label-selector">
                {labels.map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    className={`label-chip-btn ${selectedLabels.includes(l.id) ? 'label-chip-btn-active' : ''}`}
                    style={{
                      backgroundColor: selectedLabels.includes(l.id)
                        ? l.color + '25'
                        : undefined,
                      color: selectedLabels.includes(l.id) ? l.color : undefined,
                      borderColor: selectedLabels.includes(l.id)
                        ? l.color + '40'
                        : undefined,
                    }}
                    onClick={() => toggleLabel(l.id)}
                  >
                    <span
                      className="label-dot"
                      style={{ backgroundColor: l.color }}
                    />
                    {l.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={!title.trim() || submitting}
            >
              {submitting ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
