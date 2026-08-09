import type { BoardCard } from "./types";
import { PRIORITY_META } from "./types";

export type GroupBy = "none" | "assignee" | "priority" | "type";

export type Band = { key: string; label: string };

const UNASSIGNED_KEY = "__unassigned__";
const NO_TYPE_KEY = "__none__";
const PRIORITY_ORDER = ["URGENT", "HIGH", "MEDIUM", "LOW"] as const;

function bandKeyFor(card: BoardCard, groupBy: GroupBy): string {
  switch (groupBy) {
    case "assignee":
      return card.assignee?.id ?? card.assigneeContact?.id ?? UNASSIGNED_KEY;
    case "priority":
      return card.priority;
    case "type":
      return card.cardType?.id ?? NO_TYPE_KEY;
    case "none":
      return "__all__";
  }
}

/// Bands are computed from every card on the board, not just one
/// column's — that's what makes the same band appear in the same
/// position in every column, so the board still reads as a grid
/// instead of each column shuffling independently.
export function computeBands(allCards: BoardCard[], groupBy: GroupBy): Band[] {
  if (groupBy === "none") return [{ key: "__all__", label: "" }];

  if (groupBy === "priority") {
    return PRIORITY_ORDER.map((p) => ({ key: p, label: PRIORITY_META[p].label }));
  }

  const labels = new Map<string, string>();
  for (const card of allCards) {
    if (groupBy === "assignee") {
      if (card.assignee) labels.set(card.assignee.id, card.assignee.fullName ?? card.assignee.email);
      else if (card.assigneeContact) labels.set(card.assigneeContact.id, `${card.assigneeContact.name} (contact)`);
    } else if (groupBy === "type" && card.cardType) {
      labels.set(card.cardType.id, card.cardType.name);
    }
  }

  const bands = [...labels.entries()]
    .sort((a, b) => a[1].localeCompare(b[1]))
    .map(([key, label]) => ({ key, label }));

  bands.push(groupBy === "assignee" ? { key: UNASSIGNED_KEY, label: "Unassigned" } : { key: NO_TYPE_KEY, label: "No type" });
  return bands;
}

/// Stable partition of `cards` into band order — used for BOTH rendering
/// (so bands appear grouped visually) and drag-end neighbor lookup (so
/// "before/after" position math agrees with what's visually adjacent).
/// Using the same function for both is what keeps a drag between bands
/// from producing a fractional-index jump to the wrong neighbor.
export function groupCardsByBand<T extends BoardCard>(cards: T[], bands: Band[], groupBy: GroupBy): T[] {
  const byKey = new Map<string, T[]>();
  for (const band of bands) byKey.set(band.key, []);

  // A card's key always matches one of `bands` in the normal case (both
  // are derived from the same board's cards) — the `?? []` fallback here
  // is only a guard against `bands` being computed from a stale render,
  // so a card is never silently dropped from the board.
  const overflow: T[] = [];
  for (const card of cards) {
    const key = bandKeyFor(card, groupBy);
    const bucket = byKey.get(key);
    if (bucket) bucket.push(card);
    else overflow.push(card);
  }

  return [...bands.flatMap((band) => byKey.get(band.key) ?? []), ...overflow];
}

export function cardsInBand<T extends BoardCard>(cards: T[], band: Band, groupBy: GroupBy): T[] {
  return cards.filter((card) => bandKeyFor(card, groupBy) === band.key);
}

// A board's "Group by" choice, persisted per board id in localStorage —
// exposed as a tiny external store (read via useSyncExternalStore in
// Board.tsx) rather than component state synced from an effect, so the
// initial render matches the server (localStorage isn't available
// there) without a setState-during-effect render cascade.
const GROUP_BY_STORAGE_PREFIX = "kelbara-board-groupby-";
const groupByListeners = new Set<() => void>();

export function subscribeToGroupBy(callback: () => void) {
  groupByListeners.add(callback);
  return () => groupByListeners.delete(callback);
}

export function getStoredGroupBy(boardId: string): GroupBy {
  const saved = localStorage.getItem(`${GROUP_BY_STORAGE_PREFIX}${boardId}`);
  return saved === "assignee" || saved === "priority" || saved === "type" ? saved : "none";
}

export function getStoredGroupByServerSnapshot(): GroupBy {
  return "none";
}

export function setStoredGroupBy(boardId: string, groupBy: GroupBy) {
  localStorage.setItem(`${GROUP_BY_STORAGE_PREFIX}${boardId}`, groupBy);
  groupByListeners.forEach((listener) => listener());
}
