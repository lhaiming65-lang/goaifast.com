declare const process: { env: Record<string, string> };
import { createClient } from "@supabase/supabase-js";
import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "list_products",
  title: "List products",
  description:
    "Read currently active digital products, USD prices and available stock from the live GoAifast catalog.",
  inputSchema: {
    category: z
      .string()
      .max(100)
      .optional()
      .describe("Category name; omit or use 'all' for every category."),
  },
  annotations: {
    readOnlyHint: true,
    idempotentHint: true,
    openWorldHint: false,
  },
  handler: async ({ category }) => {
    const client = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY!,
      {
        auth: { persistSession: false, autoRefreshToken: false },
      },
    );
    const { data, error } = await client.rpc("commerce_api", {
      p_action: "catalog",
      p_payload: {},
    });
    if (error)
      return {
        content: [{ type: "text", text: error.message }],
        isError: true,
      };
    const rows = (data?.products ?? []) as Record<string, unknown>[];
    // Explicit public output fields protect the MCP surface from future schema additions.
    const products = rows
      .filter(
        (row) => !category || category === "all" || row.category === category,
      )
      .map((row) => ({
        id: row.id,
        title: row.title,
        slug: row.slug,
        category: row.category,
        price_cents: row.price_cents,
        currency: "USD",
        available_stock: row.available_stock,
        delivery_method: row.delivery_method,
        warranty_days: row.warranty_days,
        auto_replace: row.auto_replace,
        max_replacements: row.max_replacements,
      }));
    const categories = [
      ...new Set(
        rows
          .map((row) => row.category)
          .filter((value) => typeof value === "string"),
      ),
    ];
    const result = { count: products.length, categories, products };
    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
      structuredContent: result,
    };
  },
});
