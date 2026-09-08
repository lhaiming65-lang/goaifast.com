declare const process: { env: Record<string, string> };
import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function supabaseForUser(ctx: ToolContext) {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}

export default defineTool({
  name: "list_orders",
  title: "List my orders",
  description:
    "List the signed-in user's live GoAifast commerce orders, newest first, without delivery credentials.",
  inputSchema: {
    limit: z
      .number()
      .int()
      .min(1)
      .max(100)
      .optional()
      .describe("Max orders to return (default 20)."),
  },
  annotations: {
    readOnlyHint: true,
    idempotentHint: true,
    openWorldHint: false,
  },
  handler: async ({ limit }, ctx) => {
    if (!ctx.isAuthenticated())
      return {
        content: [{ type: "text", text: "Not authenticated" }],
        isError: true,
      };
    const { data, error } = await supabaseForUser(ctx).rpc("commerce_api", {
      p_action: "orders",
      p_payload: {},
    });
    if (error)
      return {
        content: [{ type: "text", text: error.message }],
        isError: true,
      };
    const rows = (data?.orders ?? []) as Record<string, unknown>[];
    const owned = rows.filter((row) => row.user_id === ctx.getUserId());
    const orders = owned.slice(0, limit ?? 20).map((row) => ({
      id: row.id,
      order_number: row.order_number,
      status: row.status,
      total_cents: row.total_cents,
      currency: row.currency,
      payment_method: row.payment_method,
      created_at: row.created_at,
      delivered_at: row.delivered_at,
      completed_at: row.completed_at,
    }));
    const result = { count: orders.length, total: owned.length, orders };
    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
      structuredContent: result,
    };
  },
});
