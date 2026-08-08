import type { BoardTemplate } from "./types";

export const itDevTemplate: BoardTemplate = {
  key: "IT_DEV",
  label: "IT / Dev",
  description: "Sprints, bugs, features, and code-review states.",
  columns: [
    { name: "Backlog" },
    { name: "To Do" },
    { name: "In Progress" },
    { name: "Blocked", isBlockedColumn: true },
    { name: "In Review" },
    { name: "Done", isDoneColumn: true },
  ],
  cardTypes: [
    { name: "Task", color: "#6B7280", isDefault: true },
    { name: "Bug", color: "#EF4444" },
    { name: "Feature", color: "#3B82F6" },
  ],
};
