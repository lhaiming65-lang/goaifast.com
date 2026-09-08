import { useEffect } from "react";
import {
  Link,
  useNavigate,
  useSearchParams,
  useLocation,
} from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import AuthForm from "@/components/AuthForm";
import { useAuth } from "@/contexts/AuthContext";

export default function AuthPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useAuth();
  const [params] = useSearchParams();
  const mode =
    params.get("mode") === "signup"
      ? "signup"
      : params.get("mode") === "forgot"
        ? "forgot"
        : "signin";
  const candidate =
    params.get("next") || (location.state as { from?: string } | null)?.from;
  // Validate both URL params and navigation state; backslashes normalize to slashes in URLs.
  const safeNext =
    typeof candidate === "string" &&
    candidate.startsWith("/") &&
    !candidate.startsWith("//") &&
    !candidate.includes("\\") &&
    !/^\/auth(?:[/?#]|$)/.test(candidate)
      ? candidate
      : "/profile";

  useEffect(() => {
    if (!loading && user) {
      navigate(safeNext, { replace: true });
    }
  }, [user, loading, navigate, safeNext]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background flex flex-col">
      <header className="p-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("auth.backHome")}
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md bg-card rounded-3xl shadow-soft border border-border p-8">
          <div className="flex justify-center mb-6">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-brand rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-soft">
                G
              </div>
              <span className="text-2xl font-bold bg-gradient-brand bg-clip-text text-transparent">
                GoAifast
              </span>
            </Link>
          </div>
          <AuthForm initialMode={mode} redirectTo={safeNext} />
        </div>
      </main>
    </div>
  );
}
