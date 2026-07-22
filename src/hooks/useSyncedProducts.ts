import { useEffect, useState } from "react";
import { loadPublicProducts } from "@/lib/adminStore";
import { applyIpPricing, getVisitorIpInfo } from "@/lib/ipPricing";

export function useSyncedProducts() {
  const [visitor, setVisitor] = useState<Awaited<ReturnType<typeof getVisitorIpInfo>>>(null);
  const [products, setProducts] = useState(() => applyIpPricing(loadPublicProducts(), null));

  useEffect(() => {
    let alive = true;
    getVisitorIpInfo().then((info) => {
      if (!alive) return;
      setVisitor(info);
      setProducts(applyIpPricing(loadPublicProducts(), info));
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const refresh = () => setProducts(applyIpPricing(loadPublicProducts(), visitor));
    window.addEventListener("storage", refresh);
    window.addEventListener("goaifast-store-updated", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("goaifast-store-updated", refresh);
    };
  }, [visitor]);

  return products;
}
