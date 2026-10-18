"use server";

import { requestClient } from "@/lib/supabase/server";
import { staffAccess } from "@/lib/auth/guard";

import { z } from "zod";

const searchQuerySchema = z.string().trim().min(1).max(100);

export async function searchUsersAction(query: string) {
  try {
    const parsed = searchQuerySchema.safeParse(query);
    if (!parsed.success) return { error: "Invalid search query." };

    const client = await requestClient();
    if (!client) return { error: "Configuration unavailable." };

    const access = await staffAccess(client, true, ["administrator"]);
    if (!access.allowed) {
      return { error: "Unauthorized." };
    }

    const { data, error } = await client.rpc("admin_search_users", {
      p_query: parsed.data,
      p_limit: 10,
      p_offset: 0,
    });

    if (error) {
      return { error: "Failed to search users." };
    }

    return { data };
  } catch {
    return { error: "An unexpected error occurred." };
  }
}
