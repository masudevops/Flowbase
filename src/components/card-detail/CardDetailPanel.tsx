"use client";

import { useState } from "react";
import { trpc } from "@/trpc/client";
import { PRIORITY_META } from "@/components/board/types";
import type { CardTypeOption, MemberOption, LabelOption } from "@/components/board/types";

const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

function formatDateInput(iso: string | null): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

function memberLabel(m: { fullName: string | null; email: string }): string {
  return m.fullName ?? m.email;
}

export function CardDetailPanel({
  cardId,
  cardTypes,
  members,
  labels,
  onClose,
  onChanged,
}: {
  cardId: string;
  cardTypes: CardTypeOption[];
  members: MemberOption[];
  labels: LabelOption[];
  onClose: () => void;
  onChanged: () => void;
}) {
  const utils = trpc.useUtils();
  const { data: card } = trpc.card.byId.useQuery({ cardId });
  const { data: comments } = trpc.comment.list.useQuery({ cardId });

  const invalidateCard = () => {
    utils.card.byId.invalidate({ cardId });
    onChanged();
  };

  const updateCard = trpc.card.update.useMutation({ onSuccess: invalidateCard });
  const toggleBlocked = trpc.card.toggleBlocked.useMutation({ onSuccess: invalidateCard });
  const setLabels = trpc.card.setLabels.useMutation({ onSuccess: invalidateCard });
  const deleteCard = trpc.card.delete.useMutation({
    onSuccess: () => {
      onChanged();
      onClose();
    },
  });
  const createComment = trpc.comment.create.useMutation({
    onSuccess: () => utils.comment.list.invalidate({ cardId }),
  });
  const createChecklistItem = trpc.checklist.create.useMutation({ onSuccess: invalidateCard });
  const toggleChecklistItem = trpc.checklist.toggle.useMutation({ onSuccess: invalidateCard });
  const deleteChecklistItem = trpc.checklist.delete.useMutation({ onSuccess: invalidateCard });

  const [titleDraft, setTitleDraft] = useState("");
  const [descDraft, setDescDraft] = useState("");
  const [locationDraft, setLocationDraft] = useState("");
  const [blockedReasonDraft, setBlockedReasonDraft] = useState("");
  const [commentDraft, setCommentDraft] = useState("");
  const [checklistDraft, setChecklistDraft] = useState("");

  // Re-sync drafts from server data only when we start looking at a
  // genuinely different card, not on every refetch of the same one —
  // otherwise an in-progress edit in one field gets clobbered by a
  // invalidation triggered by saving a different field. "Adjusting state
  // during render" per React's guidance, not a useEffect: an effect here
  // would fire on every new `card` object reference, including refetches
  // of the same card.
  const [syncedCardId, setSyncedCardId] = useState<string | null>(null);
  if (card && card.id !== syncedCardId) {
    setSyncedCardId(card.id);
    setTitleDraft(card.title);
    setDescDraft(card.description ?? "");
    setLocationDraft(card.location ?? "");
    setBlockedReasonDraft(card.blockedReason ?? "");
  }

  if (!card) {
    return (
      <div className="fixed inset-0 z-50 flex justify-end bg-black/20" onClick={onClose}>
        <div className="h-full w-full max-w-lg bg-white dark:bg-[#161D2E]" />
      </div>
    );
  }

  const selectedLabelIds = new Set(card.labels.map((l) => l.label.id));

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/20" onClick={onClose}>
      <div
        className="flex h-full w-full max-w-lg flex-col overflow-y-auto border-l border-[#DFE1E6] bg-white p-6 dark:border-[#2A3547] dark:bg-[#161D2E]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-2">
          <textarea
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={() => {
              if (titleDraft.trim() && titleDraft !== card.title) {
                updateCard.mutate({ cardId, title: titleDraft.trim() });
              }
            }}
            rows={2}
            className="w-full resize-none bg-transparent text-lg font-semibold text-[#172B4D] outline-none dark:text-[#E4E7EC]"
          />
          <button
            onClick={onClose}
            className="shrink-0 rounded p-1 text-[#5E6C84] hover:bg-[#DFE1E6]/50 dark:text-[#8C9BAB] dark:hover:bg-[#2A3547]/50"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Field grid */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <label className="mb-1 block text-xs font-medium text-[#5E6C84] dark:text-[#8C9BAB]">
              Type
            </label>
            <select
              value={card.cardTypeId ?? ""}
              onChange={(e) =>
                updateCard.mutate({ cardId, cardTypeId: e.target.value || null })
              }
              className="w-full rounded-md border border-[#DFE1E6] bg-white px-2 py-1.5 text-sm dark:border-[#2A3547] dark:bg-[#0E1624]"
            >
              <option value="">None</option>
              {cardTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-[#5E6C84] dark:text-[#8C9BAB]">
              Priority
            </label>
            <select
              value={card.priority}
              onChange={(e) =>
                updateCard.mutate({
                  cardId,
                  priority: e.target.value as (typeof PRIORITIES)[number],
                })
              }
              className="w-full rounded-md border border-[#DFE1E6] bg-white px-2 py-1.5 text-sm dark:border-[#2A3547] dark:bg-[#0E1624]"
              style={{ color: PRIORITY_META[card.priority].color }}
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_META[p].label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-[#5E6C84] dark:text-[#8C9BAB]">
              Assignee
            </label>
            <select
              value={card.assigneeId ?? ""}
              onChange={(e) =>
                updateCard.mutate({ cardId, assigneeId: e.target.value || null })
              }
              className="w-full rounded-md border border-[#DFE1E6] bg-white px-2 py-1.5 text-sm dark:border-[#2A3547] dark:bg-[#0E1624]"
            >
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {memberLabel(m)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-[#5E6C84] dark:text-[#8C9BAB]">
              Due date
            </label>
            <input
              type="date"
              value={formatDateInput(card.dueDate ? card.dueDate.toString() : null)}
              onChange={(e) =>
                updateCard.mutate({
                  cardId,
                  dueDate: e.target.value ? new Date(e.target.value).toISOString() : null,
                })
              }
              className="w-full rounded-md border border-[#DFE1E6] bg-white px-2 py-1.5 text-sm dark:border-[#2A3547] dark:bg-[#0E1624]"
            />
          </div>

          <div className="col-span-2">
            <label className="mb-1 block text-xs font-medium text-[#5E6C84] dark:text-[#8C9BAB]">
              Location / zone
            </label>
            <input
              value={locationDraft}
              onChange={(e) => setLocationDraft(e.target.value)}
              onBlur={() => {
                if (locationDraft !== (card.location ?? "")) {
                  updateCard.mutate({ cardId, location: locationDraft || null });
                }
              }}
              placeholder="e.g. Building A / Floor 3"
              className="w-full rounded-md border border-[#DFE1E6] bg-white px-2 py-1.5 text-sm dark:border-[#2A3547] dark:bg-[#0E1624]"
            />
          </div>
        </div>

        {/* Blocked */}
        <div className="mt-4 rounded-md border border-[#DFE1E6] p-3 dark:border-[#2A3547]">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={card.isBlocked}
              onChange={(e) =>
                toggleBlocked.mutate({
                  cardId,
                  isBlocked: e.target.checked,
                  blockedReason: e.target.checked ? blockedReasonDraft : null,
                })
              }
            />
            Blocked
          </label>
          {card.isBlocked && (
            <input
              value={blockedReasonDraft}
              onChange={(e) => setBlockedReasonDraft(e.target.value)}
              onBlur={() => {
                if (blockedReasonDraft !== (card.blockedReason ?? "")) {
                  toggleBlocked.mutate({
                    cardId,
                    isBlocked: true,
                    blockedReason: blockedReasonDraft || null,
                  });
                }
              }}
              placeholder="Why is this blocked?"
              className="mt-2 w-full rounded-md border border-[#DFE1E6] bg-white px-2 py-1.5 text-sm dark:border-[#2A3547] dark:bg-[#0E1624]"
            />
          )}
        </div>

        {/* Labels */}
        <div className="mt-4">
          <label className="mb-1 block text-xs font-medium text-[#5E6C84] dark:text-[#8C9BAB]">
            Labels
          </label>
          <div className="flex flex-wrap gap-1.5">
            {labels.map((label) => {
              const selected = selectedLabelIds.has(label.id);
              return (
                <button
                  key={label.id}
                  type="button"
                  onClick={() => {
                    const next = selected
                      ? [...selectedLabelIds].filter((id) => id !== label.id)
                      : [...selectedLabelIds, label.id];
                    setLabels.mutate({ cardId, labelIds: next });
                  }}
                  className="rounded px-2 py-1 text-xs font-medium transition-opacity"
                  style={{
                    backgroundColor: label.color,
                    color: "white",
                    opacity: selected ? 1 : 0.35,
                  }}
                >
                  {label.name}
                </button>
              );
            })}
            {labels.length === 0 && (
              <p className="text-xs text-[#5E6C84] dark:text-[#8C9BAB]">No labels yet.</p>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="mt-4">
          <label className="mb-1 block text-xs font-medium text-[#5E6C84] dark:text-[#8C9BAB]">
            Description
          </label>
          <textarea
            value={descDraft}
            onChange={(e) => setDescDraft(e.target.value)}
            onBlur={() => {
              if (descDraft !== (card.description ?? "")) {
                updateCard.mutate({ cardId, description: descDraft || null });
              }
            }}
            placeholder="Markdown supported"
            rows={4}
            className="w-full resize-none rounded-md border border-[#DFE1E6] bg-white px-2 py-1.5 text-sm dark:border-[#2A3547] dark:bg-[#0E1624]"
          />
        </div>

        {/* Checklist */}
        <div className="mt-4">
          <label className="mb-1 block text-xs font-medium text-[#5E6C84] dark:text-[#8C9BAB]">
            Checklist
          </label>
          <div className="space-y-1">
            {card.checklistItems.map((item) => (
              <div key={item.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={item.isDone}
                  onChange={(e) =>
                    toggleChecklistItem.mutate({ itemId: item.id, isDone: e.target.checked })
                  }
                />
                <span
                  className={`flex-1 text-sm ${item.isDone ? "text-[#5E6C84] line-through dark:text-[#8C9BAB]" : ""}`}
                >
                  {item.text}
                </span>
                <button
                  onClick={() => deleteChecklistItem.mutate({ itemId: item.id })}
                  className="text-xs text-[#5E6C84] hover:text-[#DE350B] dark:text-[#8C9BAB]"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <form
            className="mt-2 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!checklistDraft.trim()) return;
              createChecklistItem.mutate({ cardId, text: checklistDraft.trim() });
              setChecklistDraft("");
            }}
          >
            <input
              value={checklistDraft}
              onChange={(e) => setChecklistDraft(e.target.value)}
              placeholder="Add checklist item"
              className="w-full rounded-md border border-[#DFE1E6] bg-white px-2 py-1.5 text-sm dark:border-[#2A3547] dark:bg-[#0E1624]"
            />
          </form>
        </div>

        {/* Comments */}
        <div className="mt-4">
          <label className="mb-1 block text-xs font-medium text-[#5E6C84] dark:text-[#8C9BAB]">
            Comments
          </label>
          <div className="space-y-3">
            {comments?.map((comment) => (
              <div key={comment.id} className="rounded-md bg-[#F4F6FA] p-2 dark:bg-[#0E1624]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[#172B4D] dark:text-[#E4E7EC]">
                    {comment.author.fullName ?? comment.author.email}
                  </span>
                  <span className="text-[10px] text-[#5E6C84] dark:text-[#8C9BAB]">
                    {new Date(comment.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="mt-1 text-sm whitespace-pre-wrap text-[#172B4D] dark:text-[#E4E7EC]">
                  {comment.body}
                </p>
              </div>
            ))}
          </div>
          <form
            className="mt-2 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!commentDraft.trim()) return;
              createComment.mutate({ cardId, body: commentDraft.trim() });
              setCommentDraft("");
            }}
          >
            <input
              value={commentDraft}
              onChange={(e) => setCommentDraft(e.target.value)}
              placeholder="Write a comment"
              className="w-full rounded-md border border-[#DFE1E6] bg-white px-2 py-1.5 text-sm dark:border-[#2A3547] dark:bg-[#0E1624]"
            />
          </form>
        </div>

        <div className="mt-6 border-t border-[#DFE1E6] pt-4 dark:border-[#2A3547]">
          <button
            onClick={() => {
              if (confirm("Delete this card?")) {
                deleteCard.mutate({ cardId });
              }
            }}
            className="text-sm text-[#DE350B] hover:underline dark:text-[#FF5630]"
          >
            Delete card
          </button>
        </div>
      </div>
    </div>
  );
}
