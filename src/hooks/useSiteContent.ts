import { useEffect, useState } from "react";
import {
  PUBLIC_STORE_KEY,
  defaultSiteContent,
  normalizeSiteContent,
  type SiteContent,
} from "@/lib/adminStore";
import { supabase } from "@/integrations/supabase/client";

function readCachedContent(): SiteContent {
  if (typeof window === "undefined") return defaultSiteContent;
  try {
    const parsed = JSON.parse(localStorage.getItem(PUBLIC_STORE_KEY) || "{}");
    return normalizeSiteContent(parsed?.settings?.content);
  } catch {
    return defaultSiteContent;
  }
}

export function useSiteContent() {
  const [content, setContent] = useState<SiteContent>(() => readCachedContent());

  useEffect(() => {
    let active = true;

    const refreshFromCache = () => {
      if (active) setContent(readCachedContent());
    };

    const load = async () => {
      const { data } = await supabase
        .from("go_site_settings" as never)
        .select("settings_payload")
        .eq("id", "default")
        .maybeSingle();
      if (!active) return;
      const payload = (data as { settings_payload?: { content?: Partial<SiteContent> } } | null)?.settings_payload;
      setContent(normalizeSiteContent(payload?.content));
    };

    load();
    window.addEventListener("storage", refreshFromCache);
    window.addEventListener("goaifast-store-updated", refreshFromCache as EventListener);

    const channel = supabase
      .channel("go_site_settings:content")
      .on("postgres_changes", { event: "*", schema: "public", table: "go_site_settings", filter: "id=eq.default" }, load)
      .subscribe();

    return () => {
      active = false;
      window.removeEventListener("storage", refreshFromCache);
      window.removeEventListener("goaifast-store-updated", refreshFromCache as EventListener);
      supabase.removeChannel(channel);
    };
  }, []);

  return content;
}
