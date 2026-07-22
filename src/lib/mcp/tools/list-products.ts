import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { products, categories } from "../../../data/products";

export default defineTool({
  name: "list_products",
  title: "List products",
  description: "List subscription products in the GoAifast catalog, optionally filtered by category.",
  inputSchema: {
    category: z
      .enum(["all", "svod", "ai", "music", "marketplace", "topup", "software", "games"])
      .optional()
      .describe("Filter by category. Omit or 'all' returns everything."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ category }) => {
    const filtered =
      !category || category === "all"
        ? products
        : products.filter((p) => p.category === category);
    return {
      content: [{ type: "text", text: JSON.stringify({ categories, products: filtered }) }],
      structuredContent: { count: filtered.length, products: filtered },
    };
  },
});
