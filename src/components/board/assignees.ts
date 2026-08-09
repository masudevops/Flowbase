import type { BoardCard } from "./types";

export type Assignee = BoardCard["assignees"][number];

export function assigneeId(a: Assignee): string {
  return a.user?.id ?? a.contact!.id;
}

export function assigneeName(a: Assignee): string {
  if (a.user) return a.user.fullName ?? a.user.email;
  return `${a.contact!.name} (contact)`;
}

export function assigneeInitial(a: Assignee): string {
  return assigneeName(a).charAt(0).toUpperCase();
}
