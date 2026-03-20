import { useState } from 'react';
import { Plus, X, Users } from 'lucide-react';
import type { TeamMember } from '../types';

interface TeamManagerProps {
  members: TeamMember[];
  onCreateMember: (name: string, color: string) => Promise<{ data: TeamMember | null; error: string | null }>;
  onDeleteMember: (id: string) => Promise<{ error: string | null }>;
  onError: (message: string) => void;
}

const MEMBER_COLORS = [
  '#1e3a8a', '#dc2626', '#16a34a', '#ca8a04',
  '#9333ea', '#0891b2', '#e11d48', '#ea580c',
];

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function TeamManager({ members, onCreateMember, onDeleteMember, onError }: TeamManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState(MEMBER_COLORS[0]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const { error } = await onCreateMember(name.trim(), color);
    if (error) {
      onError(`Failed to add team member: ${error}`);
      return;
    }
    setName('');
    setColor(MEMBER_COLORS[0]);
  }

  async function handleDelete(id: string) {
    const { error } = await onDeleteMember(id);
    if (error) {
      onError(`Failed to remove team member: ${error}`);
    }
  }

  return (
    <div className="label-manager">
      <button className="btn-secondary btn-sm" onClick={() => setIsOpen(!isOpen)}>
        <Users size={14} />
        Team
      </button>

      {isOpen && (
        <div className="label-dropdown team-dropdown">
          <div className="label-dropdown-header">
            <span>Team Members</span>
            <button className="btn-icon" onClick={() => setIsOpen(false)}>
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleCreate} className="label-create-form">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Member name"
              className="label-name-input"
            />
            <div className="color-picker">
              {MEMBER_COLORS.map((c) => (
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
            {members.map((m) => (
              <div key={m.id} className="label-list-item">
                <span className="member-avatar-sm" style={{ backgroundColor: m.color }}>
                  {getInitials(m.name)}
                </span>
                <span className="label-name">{m.name}</span>
                <button className="btn-icon btn-xs" onClick={() => handleDelete(m.id)}>
                  <X size={12} />
                </button>
              </div>
            ))}
            {members.length === 0 && (
              <p className="empty-text-sm">No team members yet</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
