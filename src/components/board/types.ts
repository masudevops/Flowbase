export type BoardCard = {
  id: string;
  columnId: string;
  title: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  isBlocked: boolean;
  blockedReason: string | null;
  location: string | null;
  // Server Components pass Date instances (RSC serialization preserves
  // them); the tRPC client hydrates the same field as a Date too, via
  // superjson — never actually a plain string, despite some Prisma
  // return-type printouts suggesting otherwise.
  dueDate: Date | null;
  position: string;
  description: string | null;
  cardType: { id: string; name: string; color: string } | null;
  assignee: { id: string; email: string; fullName: string | null } | null;
  assigneeContact: { id: string; name: string } | null;
  labels: { label: { id: string; name: string; color: string } }[];
  checklistItems: { id: string; text: string; isDone: boolean }[];
  _count: { comments: number };
  parent: { id: string; title: string } | null;
  children: { id: string; title: string; isBlocked: boolean; column: { isDoneColumn: boolean } }[];
};

export type BoardColumn = {
  id: string;
  name: string;
  isDoneColumn: boolean;
  isBlockedColumn: boolean;
  position: string;
  cards: BoardCard[];
};

export type CardTypeOption = { id: string; name: string; color: string };
export type MemberOption = {
  userId: string;
  email: string;
  fullName: string | null;
  role?: "ADMIN" | "MEMBER";
};
export type LabelOption = { id: string; name: string; color: string };
export type ContactOption = { id: string; name: string; email: string | null; phone: string | null };

export const PRIORITY_META: Record<
  BoardCard["priority"],
  { label: string; color: string }
> = {
  LOW: { label: "Low", color: "#5E6C84" },
  MEDIUM: { label: "Medium", color: "#0B5CFF" },
  HIGH: { label: "High", color: "#FF991F" },
  URGENT: { label: "Urgent", color: "#DE350B" },
};
