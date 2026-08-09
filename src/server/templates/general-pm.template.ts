import type { BoardTemplate } from "./types";

export const generalPmTemplate: BoardTemplate = {
  key: "GENERAL_PM",
  label: "General Project Management",
  description: "Tasks, milestones, and issues for any kind of project.",
  columns: [
    { name: "To Do" },
    { name: "In Progress" },
    { name: "Review" },
    { name: "Done", isDoneColumn: true },
  ],
  cardTypes: [
    { name: "Task", color: "#6B7280", isDefault: true },
    { name: "Milestone", color: "#8B5CF6" },
    { name: "Issue", color: "#EF4444" },
  ],
};
