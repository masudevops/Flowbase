import type { BoardTemplate } from "./types";

export const constructionTemplate: BoardTemplate = {
  key: "CONSTRUCTION",
  label: "Construction",
  description: "Punch lists, scheduling, and inspection sign-off states.",
  columns: [
    { name: "Backlog" },
    { name: "Scheduled" },
    { name: "In Progress" },
    { name: "Blocked / Waiting on Inspection", isBlockedColumn: true },
    { name: "Punch List" },
    { name: "Complete", isDoneColumn: true },
  ],
  cardTypes: [
    { name: "Task", color: "#6B7280", isDefault: true },
    { name: "Punch Item", color: "#F59E0B" },
    { name: "Inspection", color: "#8B5CF6" },
  ],
};
