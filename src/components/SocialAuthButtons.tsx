import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { lovable } from "@/integrations/lovable";
import { Button } from "./ui/button";
import { Loader2 } from "lucide-react";

type Provider = "google" | "apple" | "microsoft";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden>
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.4-1.68 4.1-5.5 4.1-3.3 0-6-2.73-6-6.1s2.7-6.1 6-6.1c1.88 0 3.14.8 3.86 1.49l2.63-2.53C16.9 3.4 14.66 2.4 12 2.4 6.9 2.4 2.8 6.5 2.8 11.6S6.9 20.8 12 20.8c6.93 0 9.2-4.87 9.2-7.34 0-.5-.05-.87-.12-1.25H12z"/>
    </svg>
  );
}
function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden fill="currentColor">
      <path d="M16.365 1.43c0 1.14-.44 2.22-1.17 3.02-.78.86-2.06 1.53-3.09 1.45-.13-1.12.43-2.28 1.15-3.05.79-.86 2.14-1.5 3.11-1.42zM20.9 17.36c-.58 1.31-.86 1.9-1.6 3.06-1.03 1.61-2.48 3.61-4.28 3.63-1.6.02-2.02-1.04-4.19-1.03-2.17.01-2.63 1.05-4.23 1.03-1.8-.02-3.17-1.83-4.2-3.44-2.88-4.5-3.19-9.78-1.41-12.59 1.27-2 3.27-3.17 5.15-3.17 1.92 0 3.12 1.05 4.7 1.05 1.53 0 2.46-1.05 4.68-1.05 1.67 0 3.45.91 4.71 2.49-4.14 2.27-3.47 8.19.67 10.02z"/>
    </svg>
  );
}
function MicrosoftIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden>
      <rect x="2" y="2" width="9" height="9" fill="#F25022" />
      <rect x="13" y="2" width="9" height="9" fill="#7FBA00" />
      <rect x="2" y="13" width="9" height="9" fill="#00A4EF" />
      <rect x="13" y="13" width="9" height="9" fill="#FFB900" />
    </svg>
  );
}

interface Props {
  redirectTo?: string;
}

export default function SocialAuthButtons({ redirectTo }: Props) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState<Provider | null>(null);

  const handleOAuth = async (provider: Provider) => {
    if (provider === "microsoft") {
      toast.info(t("auth.microsoftUnavailable"));
      return;
    }
    setLoading(provider);
    try {
      const result = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: redirectTo || window.location.origin,
      });
      if (result.error) {
        toast.error(result.error.message || "Sign-in failed");
        setLoading(null);
        return;
      }
      if (result.redirected) return; // browser will navigate away
      // Session set — parent listener will react
      setLoading(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Sign-in failed");
      setLoading(null);
    }
  };

  const btnCls =
    "w-full justify-center gap-3 h-11 rounded-xl border border-border bg-background hover:bg-secondary transition-colors";

  return (
    <div className="grid gap-2">
      <Button variant="outline" className={btnCls} onClick={() => handleOAuth("google")} disabled={loading !== null}>
        {loading === "google" ? <Loader2 className="w-4 h-4 animate-spin" /> : <GoogleIcon />}
        <span className="text-sm font-medium">{t("auth.continueWithGoogle")}</span>
      </Button>
      <Button variant="outline" className={btnCls} onClick={() => handleOAuth("apple")} disabled={loading !== null}>
        {loading === "apple" ? <Loader2 className="w-4 h-4 animate-spin" /> : <AppleIcon />}
        <span className="text-sm font-medium">{t("auth.continueWithApple")}</span>
      </Button>
      <Button
        variant="outline"
        className={`${btnCls} opacity-70`}
        onClick={() => handleOAuth("microsoft")}
        disabled={loading !== null}
        title={t("auth.microsoftUnavailable")}
      >
        <MicrosoftIcon />
        <span className="text-sm font-medium">{t("auth.continueWithMicrosoft")}</span>
      </Button>
    </div>
  );
}
