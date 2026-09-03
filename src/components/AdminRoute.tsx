import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useProductContent";

export default function AdminRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const { isAdmin, checking } = useIsAdmin(user?.id);
  const location = useLocation();

  if (loading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-6 text-center">
        <h1 className="text-2xl font-bold text-foreground">无权限访问</h1>
        <p className="text-muted-foreground text-sm">该页面仅限管理员使用。</p>
      </div>
    );
  }

  return <>{children}</>;
}
