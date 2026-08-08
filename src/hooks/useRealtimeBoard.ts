"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

/// Subscribes to live card/column changes for one board via Supabase
/// Realtime, calling `onChange` (a full refetch, not a delta merge —
/// simplest and least bug-prone way to reconcile local state) whenever
/// any other session touches this board's cards or columns.
///
/// `onChange` is read through a ref so callers don't need to memoize it
/// — only `boardId` changing tears down and re-subscribes.
export function useRealtimeBoard(boardId: string, onChange: () => void) {
  const onChangeRef = useRef(onChange);

  // Keep the ref current without mutating it during render — refs must
  // only be written in effects/event handlers, per React's rules.
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    // Realtime's RLS-aware postgres_changes needs the connection to
    // authenticate as the logged-in user, not fall back to anon. A
    // freshly-created client's session comes from an async cookie read,
    // so subscribing immediately can race ahead of that and open the
    // socket unauthenticated. Explicitly resolve the session and hand
    // its token to Realtime first.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      if (session) {
        supabase.realtime.setAuth(session.access_token);
      }

      channel = supabase
        .channel(`board-${boardId}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "cards", filter: `board_id=eq.${boardId}` },
          () => onChangeRef.current(),
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "columns", filter: `board_id=eq.${boardId}` },
          () => onChangeRef.current(),
        )
        .subscribe();
    });

    return () => {
      cancelled = true;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [boardId]);
}
