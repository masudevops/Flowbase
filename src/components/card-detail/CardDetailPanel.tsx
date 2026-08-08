"use client";

import { useState } from "react";
import { X, Tag, Flag, User, Calendar, MapPin, Ban, ListChecks, MessageSquare, Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import { trpc } from "@/trpc/client";
import { PRIORITY_META } from "@/components/board/types";
import type { CardTypeOption, MemberOption, LabelOption, ContactOption } from "@/components/board/types";
import { AttachmentsSection } from "./AttachmentsSection";

const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

function formatDateInput(iso: string | null): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

function memberLabel(m: { fullName: string | null; email: string }): string {
  return m.fullName ?? m.email;
}

const markdownComponents: Components = {
  h1: (props) => <h1 className="mt-1 mb-1 text-base font-semibold text-[#172B4D] dark:text-[#E4E7EC]" {...props} />,
  h2: (props) => <h2 className="mt-1 mb-1 text-sm font-semibold text-[#172B4D] dark:text-[#E4E7EC]" {...props} />,
  h3: (props) => <h3 className="mt-1 mb-1 text-sm font-semibold text-[#172B4D] dark:text-[#E4E7EC]" {...props} />,
  p: (props) => <p className="mb-2 text-sm text-[#172B4D] last:mb-0 dark:text-[#E4E7EC]" {...props} />,
  ul: (props) => <ul className="mb-2 ml-4 list-disc text-sm text-[#172B4D] dark:text-[#E4E7EC]" {...props} />,
  ol: (props) => <ol className="mb-2 ml-4 list-decimal text-sm text-[#172B4D] dark:text-[#E4E7EC]" {...props} />,
  li: (props) => <li className="mb-0.5" {...props} />,
  a: (props) => (
    <a className="text-[#0B5CFF] underline dark:text-[#4C9AFF]" target="_blank" rel="noreferrer" {...props} />
  ),
  code: (props) => (
    <code className="rounded bg-[#F4F6FA] px-1 py-0.5 text-xs dark:bg-[#0E1624]" {...props} />
  ),
  pre: (props) => (
    <pre className="mb-2 overflow-x-auto rounded-md bg-[#F4F6FA] p-2 text-xs dark:bg-[#0E1624]" {...props} />
  ),
  strong: (props) => <strong className="font-semibold" {...props} />,
  blockquote: (props) => (
    <blockquote
      className="border-l-2 border-[#DFE1E6] pl-2 text-[#5E6C84] dark:border-[#2A3547] dark:text-[#8C9BAB]"
      {...props}
    />
  ),
};

export function CardDetailPanel({
  cardId,
  cardTypes,
  members,
  labels,
  contacts,
  onClose,
  onChanged,
}: {
  cardId: string;
  cardTypes: CardTypeOption[];
  members: MemberOption[];
  labels: LabelOption[];
  contacts: ContactOption[];
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
  const [editingDescription, setEditingDescription] = useState(false);

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
    setEditingDescription(false);
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
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Field grid */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-[#5E6C84] dark:text-[#8C9BAB]">
              <Tag className="h-3.5 w-3.5" />
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
            <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-[#5E6C84] dark:text-[#8C9BAB]">
              <Flag className="h-3.5 w-3.5" />
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
            <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-[#5E6C84] dark:text-[#8C9BAB]">
              <User className="h-3.5 w-3.5" />
              Assignee
            </label>
            <select
              value={
                card.assigneeId
                  ? `user:${card.assigneeId}`
                  : card.assigneeContactId
                    ? `contact:${card.assigneeContactId}`
                    : ""
              }
              onChange={(e) => {
                const value = e.target.value;
                if (!value) {
                  updateCard.mutate({ cardId, assigneeId: null });
                } else if (value.startsWith("user:")) {
                  updateCard.mutate({ cardId, assigneeId: value.slice(5) });
                } else {
                  updateCard.mutate({ cardId, assigneeContactId: value.slice(8) });
                }
              }}
              className="w-full rounded-md border border-[#DFE1E6] bg-white px-2 py-1.5 text-sm dark:border-[#2A3547] dark:bg-[#0E1624]"
            >
              <option value="">Unassigned</option>
              <optgroup label="Team">
                {members.map((m) => (
                  <option key={m.userId} value={`user:${m.userId}`}>
                    {memberLabel(m)}
                  </option>
                ))}
              </optgroup>
              {contacts.length > 0 && (
                <optgroup label="Contacts">
                  {contacts.map((c) => (
                    <option key={c.id} value={`contact:${c.id}`}>
                      {c.name}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          <div>
            <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-[#5E6C84] dark:text-[#8C9BAB]">
              <Calendar className="h-3.5 w-3.5" />
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
            <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-[#5E6C84] dark:text-[#8C9BAB]">
              <MapPin className="h-3.5 w-3.5" />
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
            <Ban className="h-3.5 w-3.5 text-[#DE350B] dark:text-[#FF5630]" />
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
          <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-[#5E6C84] dark:text-[#8C9BAB]">
            <Tag className="h-3.5 w-3.5" />
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
          {editingDescription ? (
            <textarea
              value={descDraft}
              onChange={(e) => setDescDraft(e.target.value)}
              onBlur={() => {
                if (descDraft !== (card.description ?? "")) {
                  updateCard.mutate({ cardId, description: descDraft || null });
                }
                setEditingDescription(false);
              }}
              placeholder="Markdown supported"
              rows={4}
              autoFocus
              className="w-full resize-none rounded-md border border-[#DFE1E6] bg-white px-2 py-1.5 text-sm dark:border-[#2A3547] dark:bg-[#0E1624]"
            />
          ) : (
            <div
              onClick={() => setEditingDescription(true)}
              className="min-h-[2.5rem] cursor-text rounded-md border border-transparent px-2 py-1.5 hover:border-[#DFE1E6] dark:hover:border-[#2A3547]"
            >
              {card.description ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                  {card.description}
                </ReactMarkdown>
              ) : (
                <p className="text-sm text-[#5E6C84] dark:text-[#8C9BAB]">
                  Click to add a description (markdown supported)
                </p>
              )}
            </div>
          )}
        </div>

        <AttachmentsSection cardId={cardId} organizationId={card.organizationId} />

        {/* Checklist */}
        <div className="mt-4">
          <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-[#5E6C84] dark:text-[#8C9BAB]">
            <ListChecks className="h-3.5 w-3.5" />
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
                  aria-label="Delete checklist item"
                  className="text-[#5E6C84] hover:text-[#DE350B] dark:text-[#8C9BAB] dark:hover:text-[#FF5630]"
                >
                  <X className="h-3.5 w-3.5" />
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
          <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-[#5E6C84] dark:text-[#8C9BAB]">
            <MessageSquare className="h-3.5 w-3.5" />
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
            className="flex items-center gap-1.5 text-sm text-[#DE350B] hover:underline dark:text-[#FF5630]"
          >
            <Trash2 className="h-4 w-4" />
            Delete card
          </button>
        </div>
      </div>
    </div>
  );
}
