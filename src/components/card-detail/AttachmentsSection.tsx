"use client";

import { useEffect, useRef, useState } from "react";
import { File, X, Upload } from "lucide-react";
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
    <div>
      {attachments?.length === 0 && (
        <p className="mb-2 text-sm text-[#55707D] dark:text-[#8FA8B3]">No attachments yet.</p>
      )}
      <div className="space-y-2">
        {attachments?.map((attachment) => {
          const url = signedUrls[attachment.id];
          const isImage = attachment.mimeType.startsWith("image/");
          return (
            <div
              key={attachment.id}
              className="flex items-center gap-3 rounded-md border border-[#D3DBD8] bg-[#EEF2F0] p-2 dark:border-[#23414F] dark:bg-[#0B1F2E]"
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
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded bg-[#D3DBD8] text-[#55707D] dark:bg-[#23414F] dark:text-[#8FA8B3]">
                  <File className="h-5 w-5" />
                </span>
              )}
              <div className="min-w-0 flex-1">
                {url ? (
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block truncate text-sm font-medium text-[#1D5C8A] hover:underline dark:text-[#5FB4E0]"
                  >
                    {attachment.fileName}
                  </a>
                ) : (
                  <span className="block truncate text-sm font-medium text-[#14242E] dark:text-[#E7EEF0]">
                    {attachment.fileName}
                  </span>
                )}
                <span className="text-xs text-[#55707D] dark:text-[#8FA8B3]">
                  {formatSize(attachment.sizeBytes)} ·{" "}
                  {attachment.uploadedBy.fullName ?? attachment.uploadedBy.email}
                </span>
              </div>
              <button
                onClick={() => deleteAttachment.mutate({ attachmentId: attachment.id })}
                aria-label="Delete attachment"
                className="shrink-0 text-[#55707D] hover:text-[#C1440E] dark:text-[#8FA8B3] dark:hover:text-[#E8703A]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>

      {error && <p className="mt-2 text-sm text-[#C1440E] dark:text-[#E8703A]">{error}</p>}

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
        className="mt-2 flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-[#55707D] hover:bg-[#D3DBD8]/50 disabled:opacity-50 dark:text-[#8FA8B3] dark:hover:bg-[#23414F]/50"
      >
        <Upload className="h-4 w-4" />
        {uploading ? "Uploading..." : "Add attachment"}
      </button>
    </div>
  );
}
