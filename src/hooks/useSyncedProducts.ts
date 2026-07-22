import { useEffect, useState } from "react";
import { loadPublicProducts } from "@/lib/adminStore";

export function useSyncedProducts() {
  const [products, setProducts] = useState(() => loadPublicProducts());

  useEffect(() => {
    const refresh = () => setProducts(loadPublicProducts());
    window.addEventListener("storage", refresh);
    window.addEventListener("goaifast-store-updated", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("goaifast-store-updated", refresh);
    };
  }, []);

  return products;
}
