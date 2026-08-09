"use client";

import { useEffect, useState } from "react";
import { X, Tag, Flag, User, Calendar, MapPin, Ban, ListChecks, MessageSquare, Trash2, Layers, CheckCircle2, Circle, Paperclip, History } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import { trpc } from "@/trpc/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/field";
import { PRIORITY_META } from "@/components/board/types";
import type { CardTypeOption, MemberOption, LabelOption, ContactOption } from "@/components/board/types";
import { describeAuditLog } from "@/lib/auditLog";
import { timeAgo } from "@/lib/time";
import { AttachmentsSection } from "./AttachmentsSection";
import { CustomFieldsSection } from "./CustomFieldsSection";

const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

// card.dueDate is a real Date instance (superjson-hydrated), not a string
// — Date.toString() gives a human-readable format like "Wed Aug 12 2026
// ...", not ISO, so slicing that never produced a valid "YYYY-MM-DD" for
// <input type="date"> to display. The browser silently rejects an
// invalid value and shows the field blank, which is what made it look
// like picking a date "didn't work": the write succeeded, the redisplay
// just never showed it.
function formatDateInput(date: Date | null): string {
  if (!date) return "";
  return date.toISOString().slice(0, 10);
}

function memberLabel(m: { fullName: string | null; email: string }): string {
  return m.fullName ?? m.email;
}

const markdownComponents: Components = {
  h1: (props) => <h1 className="mt-1 mb-1 text-base font-semibold text-[#14242E] dark:text-[#E7EEF0]" {...props} />,
  h2: (props) => <h2 className="mt-1 mb-1 text-sm font-semibold text-[#14242E] dark:text-[#E7EEF0]" {...props} />,
  h3: (props) => <h3 className="mt-1 mb-1 text-sm font-semibold text-[#14242E] dark:text-[#E7EEF0]" {...props} />,
  p: (props) => <p className="mb-2 text-sm text-[#14242E] last:mb-0 dark:text-[#E7EEF0]" {...props} />,
  ul: (props) => <ul className="mb-2 ml-4 list-disc text-sm text-[#14242E] dark:text-[#E7EEF0]" {...props} />,
  ol: (props) => <ol className="mb-2 ml-4 list-decimal text-sm text-[#14242E] dark:text-[#E7EEF0]" {...props} />,
  li: (props) => <li className="mb-0.5" {...props} />,
  a: (props) => (
    <a className="text-[#1D5C8A] underline dark:text-[#5FB4E0]" target="_blank" rel="noreferrer" {...props} />
  ),
  code: (props) => (
    <code className="rounded bg-[#EEF2F0] px-1 py-0.5 text-xs dark:bg-[#0B1F2E]" {...props} />
  ),
  pre: (props) => (
    <pre className="mb-2 overflow-x-auto rounded-md bg-[#EEF2F0] p-2 text-xs dark:bg-[#0B1F2E]" {...props} />
  ),
  strong: (props) => <strong className="font-semibold" {...props} />,
  blockquote: (props) => (
    <blockquote
      className="border-l-2 border-[#D3DBD8] pl-2 text-[#55707D] dark:border-[#23414F] dark:text-[#8FA8B3]"
      {...props}
    />
  ),
};

/// Small uppercase mono divider label — the same "section eyebrow"
/// convention used throughout the rest of the product (column headers,
/// card-type tags) — used here to separate the panel's three tiers
/// (primary content / metadata / collaboration) without adding boxes.
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-[family-name:var(--font-plex-mono)] text-[10px] font-medium tracking-[0.1em] text-[#55707D] uppercase dark:text-[#8FA8B3]">
      {children}
    </p>
  );
}

export function CardDetailPanel({
  cardId,
  cardTypes,
  members,
  labels,
  contacts,
  onClose,
  onChanged,
  onOpenCard,
}: {
  cardId: string;
  cardTypes: CardTypeOption[];
  members: MemberOption[];
  labels: LabelOption[];
  contacts: ContactOption[];
  onClose: () => void;
  onChanged: () => void;
  /// Lets "Parent: X" and sub-task rows switch which card this same
  /// panel is showing, instead of only being able to open one card per
  /// panel instance. Optional — callers that don't wire it up just won't
  /// get click-through (the parent/child names still render as text).
  onOpenCard?: (cardId: string) => void;
}) {
  const utils = trpc.useUtils();
  const { data: card } = trpc.card.byId.useQuery({ cardId });
  const { data: comments } = trpc.comment.list.useQuery({ cardId });
  const { data: auditLog } = trpc.auditLog.listByCard.useQuery({ cardId });
  const { data: me } = trpc.user.me.useQuery();
  const { data: boardCards } = trpc.card.listByBoard.useQuery(
    { boardId: card?.boardId ?? "" },
    { enabled: !!card },
  );

  const invalidateCard = () => {
    utils.card.byId.invalidate({ cardId });
    utils.auditLog.listByCard.invalidate({ cardId });
    onChanged();
  };

  const updateCard = trpc.card.update.useMutation({ onSuccess: invalidateCard });
  const toggleBlocked = trpc.card.toggleBlocked.useMutation({ onSuccess: invalidateCard });
  const setLabels = trpc.card.setLabels.useMutation({ onSuccess: invalidateCard });
  const setAssignees = trpc.card.setAssignees.useMutation({ onSuccess: invalidateCard });
  const deleteCard = trpc.card.delete.useMutation({
    onSuccess: () => {
      onChanged();
      onClose();
    },
  });
  const createComment = trpc.comment.create.useMutation({
    onSuccess: () => utils.comment.list.invalidate({ cardId }),
  });
  const updateComment = trpc.comment.update.useMutation({
    onSuccess: () => {
      utils.comment.list.invalidate({ cardId });
      setEditingCommentId(null);
    },
  });
  const deleteComment = trpc.comment.delete.useMutation({
    onSuccess: () => utils.comment.list.invalidate({ cardId }),
  });
  const createChecklistItem = trpc.checklist.create.useMutation({ onSuccess: invalidateCard });
  const toggleChecklistItem = trpc.checklist.toggle.useMutation({ onSuccess: invalidateCard });
  const deleteChecklistItem = trpc.checklist.delete.useMutation({ onSuccess: invalidateCard });

  const [titleDraft, setTitleDraft] = useState("");
  const [descDraft, setDescDraft] = useState("");
  const [locationDraft, setLocationDraft] = useState("");
  const [blockedReasonDraft, setBlockedReasonDraft] = useState("");
  const [blockedByCardIdDraft, setBlockedByCardIdDraft] = useState("");
  // Kept in sync with card.assignees but updated optimistically/
  // synchronously on every toggle click (see below) — deriving "next"
  // straight from `card.assignees` on each click would race two rapid
  // clicks against each other: the second click's mutation would still
  // be computing "next" from the pre-first-click server state if that
  // mutation's own refetch hadn't landed yet, silently dropping the
  // first click's change.
  const [assigneesDraft, setAssigneesDraft] = useState<{ userId?: string; contactId?: string }[]>([]);
  const [commentDraft, setCommentDraft] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentBody, setEditingCommentBody] = useState("");
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
    setBlockedByCardIdDraft(card.blockedByCardId ?? "");
    setAssigneesDraft(card.assignees.map((a) => (a.user ? { userId: a.user.id } : { contactId: a.contact!.id })));
    setEditingDescription(false);
    setEditingCommentId(null);
  }

  // Escape closes the panel, same convention as the search palette —
  // but a nested Escape handler (e.g. cancelling a comment edit) calls
  // stopPropagation so it doesn't also close the whole panel.
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!card) {
    return (
      <div className="fixed inset-0 z-50 flex justify-end bg-black/20" onClick={onClose}>
        <div className="h-full w-full max-w-lg bg-white dark:bg-[#0F2A3D]" />
      </div>
    );
  }

  const selectedLabelIds = new Set(card.labels.map((l) => l.label.id));
  const isAdmin = members.find((m) => m.userId === me?.id)?.role === "ADMIN";

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/20" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${card.title} details`}
        className="flex h-full w-full max-w-lg flex-col overflow-y-auto border-l border-[#D3DBD8] bg-white dark:border-[#23414F] dark:bg-[#0F2A3D]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ---------- Primary content ---------- */}
        <div className="px-6 pt-6">
          <div className="mb-2 flex items-start justify-between gap-2">
            <textarea
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={() => {
                if (titleDraft.trim() && titleDraft !== card.title) {
                  updateCard.mutate({ cardId, title: titleDraft.trim() });
                }
              }}
              rows={2}
              className="w-full resize-none bg-transparent text-lg font-semibold text-[#14242E] outline-none dark:text-[#E7EEF0]"
            />
            <div className="flex shrink-0 items-center gap-1">
              <button
                onClick={() => {
                  if (confirm("Delete this card?")) {
                    deleteCard.mutate({ cardId });
                  }
                }}
                className="rounded p-1.5 text-[#55707D] hover:bg-[#C1440E]/10 hover:text-[#C1440E] dark:text-[#8FA8B3] dark:hover:bg-[#E8703A]/10 dark:hover:text-[#E8703A]"
                aria-label="Delete card"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <button
                onClick={onClose}
                className="rounded p-1.5 text-[#55707D] hover:bg-[#D3DBD8]/50 dark:text-[#8FA8B3] dark:hover:bg-[#23414F]/50"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {editingDescription ? (
            <Textarea
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
            />
          ) : (
            <div
              onClick={() => setEditingDescription(true)}
              className="min-h-[2.5rem] cursor-text rounded-md border border-transparent px-0.5 py-1 hover:border-[#D3DBD8] dark:hover:border-[#23414F]"
            >
              {card.description ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                  {card.description}
                </ReactMarkdown>
              ) : (
                <p className="text-sm text-[#55707D] dark:text-[#8FA8B3]">
                  Click to add a description (markdown supported)
                </p>
              )}
            </div>
          )}
        </div>

        {/* ---------- Metadata ---------- */}
        <div className="mt-5 space-y-4 border-t border-[#D3DBD8] px-6 pt-4 dark:border-[#23414F]">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <Label className="flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5" />
                Type
              </Label>
              <Select
                value={card.cardTypeId ?? ""}
                onChange={(e) => updateCard.mutate({ cardId, cardTypeId: e.target.value || null })}
              >
                <option value="">None</option>
                {cardTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Label className="flex items-center gap-1.5">
                <Flag className="h-3.5 w-3.5" />
                Priority
              </Label>
              <Select
                value={card.priority}
                onChange={(e) =>
                  updateCard.mutate({
                    cardId,
                    priority: e.target.value as (typeof PRIORITIES)[number],
                  })
                }
                style={{ color: PRIORITY_META[card.priority].color }}
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {PRIORITY_META[p].label}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Label className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Start date
              </Label>
              <Input
                type="date"
                value={formatDateInput(card.startDate)}
                onChange={(e) =>
                  updateCard.mutate({
                    cardId,
                    startDate: e.target.value ? new Date(e.target.value).toISOString() : null,
                  })
                }
              />
            </div>

            <div>
              <Label className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Due date
              </Label>
              <Input
                type="date"
                value={formatDateInput(card.dueDate)}
                onChange={(e) =>
                  updateCard.mutate({
                    cardId,
                    dueDate: e.target.value ? new Date(e.target.value).toISOString() : null,
                  })
                }
              />
            </div>
          </div>

          {/* Assignees */}
          <div>
            <Label className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" />
              Assignees
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {members.map((m) => {
                const selected = assigneesDraft.some((a) => a.userId === m.userId);
                return (
                  <button
                    key={m.userId}
                    type="button"
                    onClick={() => {
                      const next = selected
                        ? assigneesDraft.filter((a) => a.userId !== m.userId)
                        : [...assigneesDraft, { userId: m.userId }];
                      setAssigneesDraft(next);
                      setAssignees.mutate({ cardId, assignees: next });
                    }}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                      selected
                        ? "border-[#1D5C8A] bg-[#1D5C8A]/10 text-[#1D5C8A] dark:border-[#5FB4E0] dark:bg-[#5FB4E0]/15 dark:text-[#5FB4E0]"
                        : "border-[#D3DBD8] text-[#55707D] hover:border-[#1D5C8A]/50 dark:border-[#23414F] dark:text-[#8FA8B3] dark:hover:border-[#5FB4E0]/50",
                    )}
                  >
                    {memberLabel(m)}
                  </button>
                );
              })}
              {contacts.map((c) => {
                const selected = assigneesDraft.some((a) => a.contactId === c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      const next = selected
                        ? assigneesDraft.filter((a) => a.contactId !== c.id)
                        : [...assigneesDraft, { contactId: c.id }];
                      setAssigneesDraft(next);
                      setAssignees.mutate({ cardId, assignees: next });
                    }}
                    className={cn(
                      "rounded-full border border-dashed px-2.5 py-1 text-xs font-medium transition-colors",
                      selected
                        ? "border-[#1D5C8A] bg-[#1D5C8A]/10 text-[#1D5C8A] dark:border-[#5FB4E0] dark:bg-[#5FB4E0]/15 dark:text-[#5FB4E0]"
                        : "border-[#D3DBD8] text-[#55707D] hover:border-[#1D5C8A]/50 dark:border-[#23414F] dark:text-[#8FA8B3] dark:hover:border-[#5FB4E0]/50",
                    )}
                  >
                    {c.name} (contact)
                  </button>
                );
              })}
              {members.length === 0 && contacts.length === 0 && (
                <p className="text-xs text-[#55707D] dark:text-[#8FA8B3]">No members yet.</p>
              )}
            </div>
          </div>

          {/* Blocked */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-[#14242E] dark:text-[#E7EEF0]">
              <Checkbox
                checked={card.isBlocked}
                onChange={(e) =>
                  toggleBlocked.mutate({
                    cardId,
                    isBlocked: e.target.checked,
                    blockedReason: e.target.checked ? blockedReasonDraft : null,
                    blockedByCardId: e.target.checked ? blockedByCardIdDraft || null : null,
                  })
                }
              />
              <Ban className="h-3.5 w-3.5 text-[#C1440E] dark:text-[#E8703A]" />
              Blocked
            </label>
            {card.isBlocked && (
              <div className="mt-2 space-y-2">
                <Input
                  value={blockedReasonDraft}
                  onChange={(e) => setBlockedReasonDraft(e.target.value)}
                  onBlur={() => {
                    if (blockedReasonDraft !== (card.blockedReason ?? "")) {
                      toggleBlocked.mutate({
                        cardId,
                        isBlocked: true,
                        blockedReason: blockedReasonDraft || null,
                        blockedByCardId: blockedByCardIdDraft || null,
                      });
                    }
                  }}
                  placeholder="Why is this blocked?"
                />
                <Select
                  value={blockedByCardIdDraft}
                  onChange={(e) => {
                    setBlockedByCardIdDraft(e.target.value);
                    toggleBlocked.mutate({
                      cardId,
                      isBlocked: true,
                      blockedReason: blockedReasonDraft || null,
                      blockedByCardId: e.target.value || null,
                    });
                  }}
                >
                  <option value="">Not blocked by a specific card</option>
                  {boardCards
                    ?.filter((c) => c.id !== cardId)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                </Select>
                {card.blockedByCard && onOpenCard && (
                  <button
                    type="button"
                    onClick={() => onOpenCard(card.blockedByCard!.id)}
                    className="text-xs font-medium text-[#1D5C8A] hover:underline dark:text-[#5FB4E0]"
                  >
                    Open &quot;{card.blockedByCard.title}&quot;
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Labels */}
          <div>
            <Label className="flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5" />
              Labels
            </Label>
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
                <p className="text-xs text-[#55707D] dark:text-[#8FA8B3]">No labels yet.</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="col-span-2">
              <Label className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                Location / zone
              </Label>
              <Input
                value={locationDraft}
                onChange={(e) => setLocationDraft(e.target.value)}
                onBlur={() => {
                  if (locationDraft !== (card.location ?? "")) {
                    updateCard.mutate({ cardId, location: locationDraft || null });
                  }
                }}
                placeholder="e.g. Building A / Floor 3"
              />
            </div>

            <div className="col-span-2">
              <Label className="flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5" />
                Parent
              </Label>
              <Select
                value={card.parentCardId ?? ""}
                onChange={(e) => updateCard.mutate({ cardId, parentCardId: e.target.value || null })}
              >
                <option value="">No parent</option>
                {boardCards
                  ?.filter((c) => c.id !== cardId && !card.children.some((child) => child.id === c.id))
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
              </Select>
              {card.parent && onOpenCard && (
                <button
                  type="button"
                  onClick={() => onOpenCard(card.parent!.id)}
                  className="mt-1 text-xs font-medium text-[#1D5C8A] hover:underline dark:text-[#5FB4E0]"
                >
                  Open &quot;{card.parent.title}&quot;
                </button>
              )}
            </div>
          </div>

          <CustomFieldsSection cardId={cardId} cardTypeId={card.cardTypeId} />
        </div>

        {/* ---------- Collaboration ---------- */}
        <div className="mt-5 space-y-5 border-t border-[#D3DBD8] px-6 py-5 dark:border-[#23414F]">
          <div>
            <div className="mb-2 flex items-center gap-1.5 border-b border-[#D3DBD8] pb-1.5 dark:border-[#23414F]">
              <Paperclip className="h-3.5 w-3.5 text-[#55707D] dark:text-[#8FA8B3]" />
              <SectionLabel>Attachments</SectionLabel>
            </div>
            <AttachmentsSection cardId={cardId} organizationId={card.organizationId} />
          </div>

          {/* Sub-tasks (children) */}
          {card.children.length > 0 && (
            <div>
              <div className="mb-2 flex items-center gap-1.5 border-b border-[#D3DBD8] pb-1.5 dark:border-[#23414F]">
                <Layers className="h-3.5 w-3.5 text-[#55707D] dark:text-[#8FA8B3]" />
                <SectionLabel>
                  Sub-tasks ({card.children.filter((c) => c.column.isDoneColumn).length}/
                  {card.children.length} done)
                </SectionLabel>
              </div>
              <div className="space-y-1">
                {card.children.map((child) => (
                  <button
                    key={child.id}
                    type="button"
                    onClick={() => onOpenCard?.(child.id)}
                    disabled={!onOpenCard}
                    className="flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left text-sm text-[#14242E] hover:bg-[#EEF2F0] disabled:cursor-default disabled:hover:bg-transparent dark:text-[#E7EEF0] dark:hover:bg-[#0B1F2E]"
                  >
                    {child.column.isDoneColumn ? (
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#0F7A5C] dark:text-[#3FBF95]" />
                    ) : (
                      <Circle className="h-3.5 w-3.5 shrink-0 text-[#55707D] dark:text-[#8FA8B3]" />
                    )}
                    <span className={child.column.isDoneColumn ? "text-[#55707D] line-through dark:text-[#8FA8B3]" : ""}>
                      {child.title}
                    </span>
                    {child.isBlocked && <Ban className="h-3 w-3 shrink-0 text-[#C1440E] dark:text-[#E8703A]" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Checklist */}
          <div>
            <div className="mb-2 flex items-center gap-1.5 border-b border-[#D3DBD8] pb-1.5 dark:border-[#23414F]">
              <ListChecks className="h-3.5 w-3.5 text-[#55707D] dark:text-[#8FA8B3]" />
              <SectionLabel>Checklist</SectionLabel>
            </div>
            <div className="space-y-1">
              {card.checklistItems.map((item) => (
                <div key={item.id} className="group flex items-center gap-2">
                  <Checkbox
                    checked={item.isDone}
                    onChange={(e) =>
                      toggleChecklistItem.mutate({ itemId: item.id, isDone: e.target.checked })
                    }
                  />
                  <span
                    className={`flex-1 text-sm ${item.isDone ? "text-[#55707D] line-through dark:text-[#8FA8B3]" : "text-[#14242E] dark:text-[#E7EEF0]"}`}
                  >
                    {item.text}
                  </span>
                  <button
                    onClick={() => deleteChecklistItem.mutate({ itemId: item.id })}
                    aria-label="Delete checklist item"
                    className="text-[#55707D] opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 hover:text-[#C1440E] focus-visible:opacity-100 dark:text-[#8FA8B3] dark:hover:text-[#E8703A]"
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
              <Input
                value={checklistDraft}
                onChange={(e) => setChecklistDraft(e.target.value)}
                placeholder="Add checklist item"
                aria-label="Add checklist item"
              />
            </form>
          </div>

          {/* Comments */}
          <div>
            <div className="mb-2 flex items-center gap-1.5 border-b border-[#D3DBD8] pb-1.5 dark:border-[#23414F]">
              <MessageSquare className="h-3.5 w-3.5 text-[#55707D] dark:text-[#8FA8B3]" />
              <SectionLabel>Comments</SectionLabel>
            </div>
            <div className="space-y-3">
              {comments?.map((comment) => {
                const isOwn = comment.authorId === me?.id;
                const canDelete = isOwn || isAdmin;
                const isEditing = editingCommentId === comment.id;

                return (
                  <div key={comment.id} className="group rounded-md bg-[#EEF2F0] p-2 dark:bg-[#0B1F2E]">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-[#14242E] dark:text-[#E7EEF0]">
                        {comment.author.fullName ?? comment.author.email}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-[#55707D] dark:text-[#8FA8B3]">
                          {new Date(comment.createdAt).toLocaleString()}
                          {comment.editedAt && " (edited)"}
                        </span>
                        {isOwn && !isEditing && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCommentId(comment.id);
                              setEditingCommentBody(comment.body);
                            }}
                            className="text-[10px] font-medium text-[#55707D] opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 hover:text-[#14242E] focus-visible:opacity-100 dark:text-[#8FA8B3] dark:hover:text-[#E7EEF0]"
                          >
                            Edit
                          </button>
                        )}
                        {canDelete && !isEditing && (
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm("Delete this comment?")) {
                                deleteComment.mutate({ commentId: comment.id });
                              }
                            }}
                            className="text-[10px] font-medium text-[#55707D] opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 hover:text-[#C1440E] focus-visible:opacity-100 dark:text-[#8FA8B3] dark:hover:text-[#E8703A]"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>

                    {isEditing ? (
                      <form
                        className="mt-1 flex gap-2"
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (!editingCommentBody.trim()) return;
                          updateComment.mutate({ commentId: comment.id, body: editingCommentBody.trim() });
                        }}
                      >
                        <Input
                          value={editingCommentBody}
                          onChange={(e) => setEditingCommentBody(e.target.value)}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Escape") {
                              e.stopPropagation();
                              setEditingCommentId(null);
                            }
                          }}
                          className="bg-white dark:bg-[#0F2A3D]"
                        />
                        <Button type="submit" size="sm" className="shrink-0" disabled={updateComment.isPending}>
                          Save
                        </Button>
                      </form>
                    ) : (
                      <p className="mt-1 text-sm whitespace-pre-wrap text-[#14242E] dark:text-[#E7EEF0]">
                        {comment.body}
                      </p>
                    )}
                  </div>
                );
              })}
              {comments?.length === 0 && (
                <p className="text-sm text-[#55707D] dark:text-[#8FA8B3]">No comments yet.</p>
              )}
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
              <Input
                value={commentDraft}
                onChange={(e) => setCommentDraft(e.target.value)}
                placeholder="Write a comment"
                aria-label="Write a comment"
              />
            </form>
          </div>

          {/* Activity */}
          <div>
            <div className="mb-2 flex items-center gap-1.5 border-b border-[#D3DBD8] pb-1.5 dark:border-[#23414F]">
              <History className="h-3.5 w-3.5 text-[#55707D] dark:text-[#8FA8B3]" />
              <SectionLabel>Activity</SectionLabel>
            </div>
            {auditLog ? (
              <div className="space-y-2">
                {auditLog.map((entry) => (
                  <p key={entry.id} className="text-sm text-[#14242E] dark:text-[#E7EEF0]">
                    <span className="font-medium">
                      {entry.actor?.fullName ?? entry.actor?.email ?? "Someone"}
                    </span>{" "}
                    <span className="text-[#55707D] dark:text-[#8FA8B3]">
                      {describeAuditLog(entry)}
                    </span>{" "}
                    <span className="text-xs text-[#55707D] dark:text-[#8FA8B3]">
                      · {timeAgo(new Date(entry.createdAt))}
                    </span>
                  </p>
                ))}
                {auditLog.length === 0 && (
                  <p className="text-sm text-[#55707D] dark:text-[#8FA8B3]">No activity yet.</p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
