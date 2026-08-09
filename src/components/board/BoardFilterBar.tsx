"use client";

import { SlidersHorizontal } from "lucide-react";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import type { CardTypeOption, MemberOption } from "./types";

export type BoardFilters = {
  assigneeId: string;
  cardTypeId: string;
  priority: string;
  blockedOnly: boolean;
};

export const EMPTY_BOARD_FILTERS: BoardFilters = {
  assigneeId: "",
  cardTypeId: "",
  priority: "",
  blockedOnly: false,
};

export function hasActiveFilters(filters: BoardFilters): boolean {
  return !!filters.assigneeId || !!filters.cardTypeId || !!filters.priority || filters.blockedOnly;
}

export function BoardFilterBar({
  filters,
  onChange,
  members,
  cardTypes,
}: {
  filters: BoardFilters;
  onChange: (filters: BoardFilters) => void;
  members: MemberOption[];
  cardTypes: CardTypeOption[];
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <SlidersHorizontal className="h-4 w-4 shrink-0 text-[#55707D] dark:text-[#8FA8B3]" />

      <Select
        value={filters.assigneeId}
        onChange={(e) => onChange({ ...filters, assigneeId: e.target.value })}
        className="w-auto"
      >
        <option value="">All assignees</option>
        {members.map((m) => (
          <option key={m.userId} value={m.userId}>
            {m.fullName ?? m.email}
          </option>
        ))}
      </Select>

      <Select
        value={filters.cardTypeId}
        onChange={(e) => onChange({ ...filters, cardTypeId: e.target.value })}
        className="w-auto"
      >
        <option value="">All types</option>
        {cardTypes.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </Select>

      <Select
        value={filters.priority}
        onChange={(e) => onChange({ ...filters, priority: e.target.value })}
        className="w-auto"
      >
        <option value="">All priorities</option>
        <option value="URGENT">Urgent</option>
        <option value="HIGH">High</option>
        <option value="MEDIUM">Medium</option>
        <option value="LOW">Low</option>
      </Select>

      <label className="flex items-center gap-1.5 text-sm text-[#14242E] dark:text-[#E7EEF0]">
        <Checkbox
          checked={filters.blockedOnly}
          onChange={(e) => onChange({ ...filters, blockedOnly: e.target.checked })}
        />
        Blocked only
      </label>

      {hasActiveFilters(filters) && (
        <button
          type="button"
          onClick={() => onChange(EMPTY_BOARD_FILTERS)}
          className="text-sm font-medium text-[#1D5C8A] hover:underline dark:text-[#5FB4E0]"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
