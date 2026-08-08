import { createClient } from "@/lib/supabase/server";

export async function createContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return {
    userId: user?.id ?? null,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
