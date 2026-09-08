import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listProductsTool from "./tools/list-products";
import getProfileTool from "./tools/get-profile";
import listOrdersTool from "./tools/list-orders";
import getOrderTool from "./tools/get-order";

// The deployed runtime is the source of truth; a local CLI project name is not
// a Supabase hostname. This also avoids the two legacy project refs diverging.
const supabaseUrl = process.env.SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL?.trim() || "https://rzphsmpkdjjbptrhuxsb.supabase.co";

export default defineMcp({
  name: "goaifast-mcp",
  title: "GoAifast",
  version: "0.1.0",
  instructions:
    "Tools for the GoAifast digital subscription marketplace. Use list_products to browse the catalog, and get_profile / list_orders / get_order to read the signed-in user's account data.",
  auth: auth.oauth.issuer({
    issuer: `${supabaseUrl.replace(/\/$/, "")}/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listProductsTool, getProfileTool, listOrdersTool, getOrderTool],
});
