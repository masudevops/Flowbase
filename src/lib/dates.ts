/// A card reads as overdue only while its work is still open — once it's
/// sitting in a done column, a due date in the past is just history, not
/// something to flag red. Shared by every place that shows a due date
/// (board card, My Work, backlog).
export function isCardOverdue(dueDate: Date | null, isDoneColumn: boolean): boolean {
  if (!dueDate || isDoneColumn) return false;
  return new Date(dueDate).getTime() < Date.now();
}
