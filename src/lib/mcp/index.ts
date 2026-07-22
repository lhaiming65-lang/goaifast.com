import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listProductsTool from "./tools/list-products";
import getProfileTool from "./tools/get-profile";
import listOrdersTool from "./tools/list-orders";
import getOrderTool from "./tools/get-order";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "goaifast-mcp",
  title: "GoAifast",
  version: "0.1.0",
  instructions:
    "Tools for the GoAifast digital subscription marketplace. Use list_products to browse the catalog, and get_profile / list_orders / get_order to read the signed-in user's account data.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listProductsTool, getProfileTool, listOrdersTool, getOrderTool],
});
