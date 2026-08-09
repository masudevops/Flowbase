import type { AuditAction } from "@prisma/client";

// Keys that can appear in a CARD_UPDATED entry's metadata (the raw
// fields object passed to updateCard/setCardLabels) mapped to plain-
// English labels. assigneeId/assigneeContactId intentionally share a
// label — "assignee" changed either way, callers never see both change
// in the same update since they're mutually exclusive.
const FIELD_LABELS: Record<string, string> = {
  title: "the title",
  description: "the description",
  priority: "the priority",
  dueDate: "the due date",
  cardTypeId: "the type",
  location: "the location",
  parentCardId: "the parent",
  assigneeId: "the assignee",
  assigneeContactId: "the assignee",
  labelIds: "labels",
};

function joinLabels(labels: string[]): string {
  if (labels.length === 1) return labels[0];
  return `${labels.slice(0, -1).join(", ")} and ${labels[labels.length - 1]}`;
}

/// Turns a raw AuditLog row into a short, human-readable sentence
/// fragment (paired with the actor's name in the UI: "Alex " + this).
/// Unrecognized actions/shapes fall back to something generic rather
/// than rendering blank — a future AuditAction this doesn't know about
/// yet should still show *something*.
export function describeAuditLog(entry: { action: AuditAction; metadata: unknown }): string {
  switch (entry.action) {
    case "CARD_CREATED":
      return "created this card";
    case "CARD_MOVED":
      return "moved this card to another column";
    case "CARD_BLOCKED":
      return "marked this card as blocked";
    case "CARD_UNBLOCKED":
      return "cleared the blocked flag";
    case "CARD_DELETED":
      return "deleted this card";
    case "CARD_ASSIGNED":
      return "changed the assignee";
    case "CARD_UPDATED": {
      const meta = entry.metadata;
      if (meta && typeof meta === "object" && !Array.isArray(meta)) {
        const labels = [
          ...new Set(Object.keys(meta).filter((key) => key in FIELD_LABELS).map((key) => FIELD_LABELS[key])),
        ];
        if (labels.length > 0) return `updated ${joinLabels(labels)}`;
      }
      return "updated this card";
    }
    default:
      return "updated this card";
  }
}
