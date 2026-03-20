import { Search, Filter } from 'lucide-react';
import type { Priority, Label } from '../types';

interface SearchBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  priorityFilter: Priority | 'all';
  onPriorityFilterChange: (value: Priority | 'all') => void;
  labelFilter: string | 'all';
  onLabelFilterChange: (value: string | 'all') => void;
  labels: Label[];
}

export function SearchBar({
  search,
  onSearchChange,
  priorityFilter,
  onPriorityFilterChange,
  labelFilter,
  onLabelFilterChange,
  labels,
}: SearchBarProps) {
  return (
    <div className="search-bar">
      <div className="search-input-wrapper">
        <Search size={16} className="search-icon" />
        <input
          type="text"
          placeholder="Search tasks..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="search-input"
        />
      </div>
      <div className="filter-group">
        <Filter size={16} className="filter-icon" />
        <select
          value={priorityFilter}
          onChange={(e) => onPriorityFilterChange(e.target.value as Priority | 'all')}
          className="filter-select"
        >
          <option value="all">All Priorities</option>
          <option value="low">Low</option>
          <option value="normal">Normal</option>
          <option value="high">High</option>
        </select>
        <select
          value={labelFilter}
          onChange={(e) => onLabelFilterChange(e.target.value)}
          className="filter-select"
        >
          <option value="all">All Labels</option>
          {labels.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
