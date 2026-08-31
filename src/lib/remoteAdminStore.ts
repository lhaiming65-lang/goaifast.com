import { supabase } from "@/integrations/supabase/client";
import {
  buildPublicStore,
  saveAdminStore,
  PUBLIC_STORE_KEY,
  type AdminStore,
} from "@/lib/adminStore";

const STORE_ID = "default";
const ADMIN_TABLE = "admin_site_store";
const PUBLIC_VIEW = "public_site_store";

export type RemoteSyncResult =
  | { ok: true; store?: AdminStore }
  | { ok: false; error: string };

function errorMessage(error: unknown) {
  if (!error) return "未知错误";
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && "message" in error) return String((error as { message?: unknown }).message);
  return "未知错误";
}

function cachePublicStore(publicStore: unknown) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PUBLIC_STORE_KEY, JSON.stringify(publicStore));
  window.dispatchEvent(new CustomEvent("goaifast-store-updated", { detail: publicStore }));
}

export async function loadRemotePublicStore() {
  const { data, error } = await supabase
    .from(PUBLIC_VIEW as never)
    .select("public_payload, updated_at")
    .eq("id", STORE_ID)
    .maybeSingle();

  if (error || !data?.public_payload) return { ok: false as const, error: errorMessage(error || "暂无远程公开数据") };
  cachePublicStore(data.public_payload);
  return { ok: true as const, publicStore: data.public_payload };
}

export async function loadRemoteAdminStore(): Promise<RemoteSyncResult> {
  const { data, error } = await supabase
    .from(ADMIN_TABLE as never)
    .select("admin_payload")
    .eq("id", STORE_ID)
    .maybeSingle();

  if (error) return { ok: false, error: errorMessage(error) };
  if (!data?.admin_payload) return { ok: false, error: "数据库里还没有后台数据" };

  const store = data.admin_payload as AdminStore;
  saveAdminStore(store);
  return { ok: true, store };
}

export async function saveRemoteAdminStore(store: AdminStore): Promise<RemoteSyncResult> {
  const payload = {
    id: STORE_ID,
    admin_payload: store,
    public_payload: buildPublicStore(store),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from(ADMIN_TABLE as never)
    .upsert(payload as never, { onConflict: "id" });

  if (error) return { ok: false, error: errorMessage(error) };
  cachePublicStore(payload.public_payload);
  return { ok: true, store };
}
