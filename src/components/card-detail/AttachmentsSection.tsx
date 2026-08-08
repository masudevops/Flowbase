"use client";

import { useEffect, useRef, useState } from "react";
import { trpc } from "@/trpc/client";
import { createClient } from "@/lib/supabase/client";

const MAX_SIZE_BYTES = 20 * 1024 * 1024; // 20MB, matches the server-side schema ceiling

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AttachmentsSection({
  cardId,
  organizationId,
}: {
  cardId: string;
  organizationId: string;
}) {
  const utils = trpc.useUtils();
  const { data: attachments } = trpc.attachment.list.useQuery({ cardId });
  const createAttachment = trpc.attachment.create.useMutation({
    onSuccess: () => utils.attachment.list.invalidate({ cardId }),
  });
  const deleteAttachment = trpc.attachment.delete.useMutation({
    onSuccess: () => utils.attachment.list.invalidate({ cardId }),
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});

  // Private bucket — attachments have no permanent public URL. Fetch a
  // short-lived signed URL for each one whenever the list changes.
  useEffect(() => {
    if (!attachments || attachments.length === 0) return;
    let cancelled = false;

    async function loadSignedUrls() {
      const supabase = createClient();
      const entries = await Promise.all(
        attachments!.map(async (a) => {
          const { data } = await supabase.storage
            .from("attachments")
            .createSignedUrl(a.storagePath, 60 * 60); // 1 hour
          return [a.id, data?.signedUrl ?? ""] as const;
        }),
      );
      if (!cancelled) {
        setSignedUrls(Object.fromEntries(entries));
      }
    }

    loadSignedUrls();
    return () => {
      cancelled = true;
    };
  }, [attachments]);

  async function handleFileSelected(file: File) {
    setError(null);
    if (file.size > MAX_SIZE_BYTES) {
      setError("File is too large (max 20MB).");
      return;
    }

    setUploading(true);
    try {
      const supabase = createClient();
      const path = `${organizationId}/${cardId}/${crypto.randomUUID()}-${sanitizeFileName(file.name)}`;

      const { error: uploadError } = await supabase.storage
        .from("attachments")
        .upload(path, file, { contentType: file.type || "application/octet-stream" });

      if (uploadError) {
        setError(uploadError.message);
        return;
      }

      await createAttachment.mutateAsync({
        cardId,
        fileName: file.name,
        storagePath: path,
        mimeType: file.type || "application/octet-stream",
        sizeBytes: file.size,
      });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="mt-4">
      <label className="mb-1 block text-xs font-medium text-[#5E6C84] dark:text-[#8C9BAB]">
        Attachments
      </label>

      <div className="space-y-2">
        {attachments?.map((attachment) => {
          const url = signedUrls[attachment.id];
          const isImage = attachment.mimeType.startsWith("image/");
          return (
            <div
              key={attachment.id}
              className="flex items-center gap-3 rounded-md border border-[#DFE1E6] bg-[#F4F6FA] p-2 dark:border-[#2A3547] dark:bg-[#0E1624]"
            >
              {isImage && url ? (
                <a href={url} target="_blank" rel="noopener noreferrer" className="shrink-0">
                  <img
                    src={url}
                    alt={attachment.fileName}
                    className="h-12 w-12 rounded object-cover"
                  />
                </a>
              ) : (
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded bg-[#DFE1E6] text-[10px] text-[#5E6C84] dark:bg-[#2A3547] dark:text-[#8C9BAB]">
                  FILE
                </span>
              )}
              <div className="min-w-0 flex-1">
                {url ? (
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block truncate text-sm font-medium text-[#0B5CFF] hover:underline dark:text-[#4C9AFF]"
                  >
                    {attachment.fileName}
                  </a>
                ) : (
                  <span className="block truncate text-sm font-medium text-[#172B4D] dark:text-[#E4E7EC]">
                    {attachment.fileName}
                  </span>
                )}
                <span className="text-xs text-[#5E6C84] dark:text-[#8C9BAB]">
                  {formatSize(attachment.sizeBytes)} ·{" "}
                  {attachment.uploadedBy.fullName ?? attachment.uploadedBy.email}
                </span>
              </div>
              <button
                onClick={() => deleteAttachment.mutate({ attachmentId: attachment.id })}
                className="shrink-0 text-xs text-[#5E6C84] hover:text-[#DE350B] dark:text-[#8C9BAB]"
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>

      {error && <p className="mt-2 text-sm text-[#DE350B] dark:text-[#FF5630]">{error}</p>}

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelected(file);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="mt-2 rounded-md px-2 py-1.5 text-sm text-[#5E6C84] hover:bg-[#DFE1E6]/50 disabled:opacity-50 dark:text-[#8C9BAB] dark:hover:bg-[#2A3547]/50"
      >
        {uploading ? "Uploading..." : "+ Add attachment"}
      </button>
    </div>
  );
}
