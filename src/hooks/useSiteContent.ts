import { useEffect, useRef, useState } from "react";
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
  const channelName = useRef(`go_site_settings:content:${Math.random().toString(36).slice(2)}`);

  useEffect(() => {
    let active = true;

    const refreshFromCache = () => {
      if (active) setContent(readCachedContent());
    };

    const load = async () => {
      try {
        const { data } = await supabase
          .from("go_site_settings" as never)
          .select("settings_payload")
          .eq("id", "default")
          .maybeSingle();
        if (!active) return;
        const payload = (data as { settings_payload?: { content?: Partial<SiteContent> } } | null)?.settings_payload;
        setContent(normalizeSiteContent(payload?.content));
      } catch {
        refreshFromCache();
      }
    };

    load();
    window.addEventListener("storage", refreshFromCache);
    window.addEventListener("goaifast-store-updated", refreshFromCache as EventListener);

    const channel = supabase
      .channel(channelName.current)
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
