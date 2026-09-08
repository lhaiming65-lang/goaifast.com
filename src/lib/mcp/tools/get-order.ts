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
const failure = (text: string) => ({
  content: [{ type: "text" as const, text }],
  isError: true,
});

export default defineTool({
  name: "get_order",
  title: "Get order details",
  description:
    "Get an order owned by the signed-in user, by order number or UUID. Includes delivery status, refunds and warranty; secret codes must be viewed securely on the website.",
  inputSchema: {
    order_no: z
      .string()
      .max(100)
      .optional()
      .describe("Human order number, e.g. GO-20260909-ABCDEF123456."),
    id: z.string().uuid().optional().describe("Order UUID."),
  },
  annotations: {
    readOnlyHint: true,
    idempotentHint: true,
    openWorldHint: false,
  },
  handler: async ({ order_no, id }, ctx) => {
    if (!ctx.isAuthenticated()) return failure("Not authenticated");
    if (!order_no && !id) return failure("Provide order_no or id");
    const client = supabaseForUser(ctx);
    let orderId = id;
    if (!orderId) {
      const { data: listing, error } = await client.rpc("commerce_api", {
        p_action: "orders",
        p_payload: {},
      });
      if (error) return failure(error.message);
      const rows = (listing?.orders ?? []) as Record<string, unknown>[];
      orderId = rows.find(
        (row) =>
          row.user_id === ctx.getUserId() && row.order_number === order_no,
      )?.id as string | undefined;
      if (!orderId) return failure("Order not found or access denied");
    }
    const { data, error } = await client.rpc("commerce_api", {
      p_action: "order",
      p_payload: { order_id: orderId },
    });
    if (error) return failure(error.message);
    // The commerce order RPC also supports administrators. This tool intentionally
    // remains a personal-account tool, so enforce owner scope before serializing.
    if (data?.order?.user_id !== ctx.getUserId())
      return failure("Order not found or access denied");
    const row = data.order as Record<string, unknown>;
    const items = (data.items ?? []) as Record<string, unknown>[];
    const deliveries = (data.deliveries ?? []) as Record<string, unknown>[];
    const refunds = (data.refunds ?? []) as Record<string, unknown>[];
    const result = {
      order: {
        id: row.id,
        order_number: row.order_number,
        status: row.status,
        total_cents: row.total_cents,
        currency: row.currency,
        payment_method: row.payment_method,
        created_at: row.created_at,
        delivered_at: row.delivered_at,
        completed_at: row.completed_at,
      },
      items: items.map((item) => ({
        id: item.id,
        product_id: item.product_id,
        title: item.title,
        quantity: item.quantity,
        unit_price_cents: item.unit_price_cents,
        delivery_method: item.delivery_method,
        warranty_days: item.warranty_days,
        auto_replace: item.auto_replace,
        max_replacements: item.max_replacements,
        replacement_count: item.replacement_count,
      })),
      deliveries: deliveries.map((delivery) => ({
        item_id: delivery.item_id,
        status: delivery.status,
        generation: delivery.generation,
        created_at: delivery.created_at,
      })),
      refunds: refunds.map((refund) => ({
        id: refund.id,
        status: refund.status,
        amount_cents: refund.amount_cents,
        currency: refund.currency,
        created_at: refund.created_at,
      })),
      details_path: "/order/" + orderId,
    };
    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
      structuredContent: result,
    };
  },
});
