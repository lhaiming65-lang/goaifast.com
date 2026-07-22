declare const process: { env: Record<string, string> };
import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function supabaseForUser(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "get_order",
  title: "Get order details",
  description: "Get a single order belonging to the signed-in user by order number or id.",
  inputSchema: {
    order_no: z.string().optional().describe("Human order number, e.g. GO-12345."),
    id: z.string().uuid().optional().describe("Order UUID."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ order_no, id }, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    if (!order_no && !id)
      return { content: [{ type: "text", text: "Provide order_no or id" }], isError: true };
    let q = supabaseForUser(ctx).from("orders").select("*").eq("user_id", ctx.getUserId());
    if (id) q = q.eq("id", id);
    else if (order_no) q = q.eq("order_no", order_no);
    const { data, error } = await q.maybeSingle();
    if (error)
      return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { order: data },
    };
  },
});
