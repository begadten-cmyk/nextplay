import { useState } from 'react';
import { Plus, X, Tag } from 'lucide-react';
import type { Label } from '../types';

interface LabelManagerProps {
  labels: Label[];
  onCreateLabel: (name: string, color: string) => Promise<Label | null>;
  onDeleteLabel: (id: string) => Promise<boolean>;
}

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4',
  '#6366f1', '#a855f7', '#ec4899', '#64748b',
];

export function LabelManager({ labels, onCreateLabel, onDeleteLabel }: LabelManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    await onCreateLabel(name.trim(), color);
    setName('');
    setColor(PRESET_COLORS[0]);
  }

  return (
    <div className="label-manager">
      <button className="btn-secondary btn-sm" onClick={() => setIsOpen(!isOpen)}>
        <Tag size={14} />
        Labels
      </button>

      {isOpen && (
        <div className="label-dropdown">
          <div className="label-dropdown-header">
            <span>Manage Labels</span>
            <button className="btn-icon" onClick={() => setIsOpen(false)}>
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleCreate} className="label-create-form">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Label name"
              className="label-name-input"
            />
            <div className="color-picker">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`color-swatch ${color === c ? 'color-swatch-active' : ''}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
            <button type="submit" className="btn-primary btn-sm" disabled={!name.trim()}>
              <Plus size={14} /> Add
            </button>
          </form>

          <div className="label-list">
            {labels.map((l) => (
              <div key={l.id} className="label-list-item">
                <span className="label-dot" style={{ backgroundColor: l.color }} />
                <span className="label-name">{l.name}</span>
                <button className="btn-icon btn-xs" onClick={() => onDeleteLabel(l.id)}>
                  <X size={12} />
                </button>
              </div>
            ))}
            {labels.length === 0 && (
              <p className="empty-text-sm">No labels created</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
